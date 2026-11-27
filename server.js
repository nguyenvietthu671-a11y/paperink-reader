const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');

const { LibraryManager } = require('./lib/library');
const { StateStore } = require('./lib/state');
const { DictionaryService } = require('./lib/dictionary');
const { ServerCloudSync } = require('./lib/cloud-sync');
const { AuthManager } = require('./lib/auth');
const { GoodreadsService, canonicalSeriesKey } = require('./lib/goodreads');

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const APP_DIR = __dirname;
const PUBLIC_DIR = path.join(APP_DIR, 'public');
const DATA_DIR = process.env.PAPERINK_DATA_DIR
  ? path.resolve(process.env.PAPERINK_DATA_DIR)
  : path.join(APP_DIR, 'data');
const BOOKS_DIR = process.env.PAPERINK_BOOKS_DIR
  ? path.resolve(process.env.PAPERINK_BOOKS_DIR)
  : path.resolve(APP_DIR, '..');

const JSZIP_PATH = path.join(APP_DIR, 'node_modules', 'jszip', 'dist', 'jszip.min.js');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function getLanIPs() {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const [name, list] of Object.entries(nets)) {
    if (!list) continue;
    const lower = name.toLowerCase();
    const isVirtual =
      lower.includes('vethernet') ||
      lower.includes('wsl') ||
      lower.includes('hyper-v') ||
      lower.includes('virtual') ||
      lower.includes('vmware') ||
      lower.includes('docker') ||
      lower.includes('loopback');
    for (const net of list) {
      if (net.family === 'IPv4' && !net.internal) {
        let score = 0;
        if (!isVirtual) score += 10;
        if (lower.includes('wi-fi') || lower.includes('wifi') || lower.includes('wlan')) score += 5;
        if (net.address.startsWith('192.168.')) score += 3;
        else if (net.address.startsWith('10.')) score += 2;
        candidates.push({ name, address: net.address, score });
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates.map((c) => c.address);
}

function sendJson(res, status, data, extraHeaders = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(body);
}

function readJsonBody(req, maxBytes = 32 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        req.destroy();
        reject(new Error('Payload too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function readRawBody(req, maxBytes = 150 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        req.destroy();
        reject(new Error('File too large (max 150MB)'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sanitizeEpubFileName(rawName) {
  let name = String(rawName || 'book.epub');
  try {
    name = decodeURIComponent(name);
  } catch (_) {}
  name = path.basename(name).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim();
  if (!name) name = `book_${Date.now()}.epub`;
  if (!/\.epub$/i.test(name)) name += '.epub';
  return name;
}

async function serveStaticFile(res, filePath, customHeaders = {}) {
  try {
    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) return false;
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    const headers = {
      'Content-Type': mime,
      'Content-Length': stat.size,
      ...customHeaders,
    };
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
    return true;
  } catch (_) {
    return false;
  }
}

async function main() {
  const library = new LibraryManager(BOOKS_DIR, DATA_DIR);
  const stateStore = new StateStore(DATA_DIR);
  const dictService = new DictionaryService(DATA_DIR);
  const cloudSync = new ServerCloudSync(DATA_DIR, stateStore);
  const authManager = new AuthManager(DATA_DIR);
  const goodreads = new GoodreadsService(DATA_DIR);

  await Promise.all([
    library.init(),
    stateStore.init(),
    dictService.init(),
    cloudSync.init(),
    authManager.init(),
    goodreads.init(),
  ]);

  // Watch PC books folder so newly copied/downloaded EPUBs auto-sync into Online library
  let watchTimer = null;
  try {
    fs.watch(BOOKS_DIR, { persistent: false }, (_eventType, fileName) => {
      if (fileName && !/\.epub$/i.test(String(fileName))) return;
      clearTimeout(watchTimer);
      watchTimer = setTimeout(() => {
        library.scan().catch((err) => console.error('[PaperInk] Auto-rescan error:', err));
      }, 1200);
    });
  } catch (_) {}

  const server = http.createServer(async (req, res) => {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = decodeURIComponent(urlObj.pathname);

      // Full CORS + Chrome Private Network Access support for cross-origin PC <-> Web/PWA sync
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Filename, X-File-Name');
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // API: Server info + LAN QR Code + Cloud Sync info + Auth status
      if (req.method === 'GET' && pathname === '/api/info') {
        const ips = getLanIPs();
        const lanUrls = ips.map((ip) => `http://${ip}:${PORT}`);
        const primaryUrl = lanUrls[0] || `http://localhost:${PORT}`;
        const qrSvg = await QRCode.toString(primaryUrl, {
          type: 'svg',
          margin: 1,
          width: 220,
          color: { dark: '#1c1b18', light: '#00000000' },
        });
        sendJson(res, 200, {
          name: 'PaperInk',
          version: '1.0.0',
          booksCount: library.books.length,
          booksDir: BOOKS_DIR,
          lanUrls,
          primaryUrl,
          qrSvg,
          cloudSync: cloudSync.getInfo(),
          userCount: authManager.users.size,
        });
        return;
      }

      // API: Auth Register
      if (req.method === 'POST' && pathname === '/api/auth/register') {
        const body = await readJsonBody(req);
        const { username, password, displayName } = body || {};
        const regResult = await authManager.register(username, password, displayName);
        if (!regResult.ok) {
          sendJson(res, 400, regResult);
          return;
        }
        sendJson(res, 200, {
          ...regResult,
          cloudSync: cloudSync.getInfo(),
        });
        return;
      }

      // API: Auth Login
      if (req.method === 'POST' && pathname === '/api/auth/login') {
        const body = await readJsonBody(req);
        const { username, password } = body || {};
        const loginResult = await authManager.login(username, password);
        if (!loginResult.ok) {
          sendJson(res, 401, loginResult);
          return;
        }
        sendJson(res, 200, {
          ...loginResult,
          cloudSync: cloudSync.getInfo(),
        });
        return;
      }

      // API: Auth Me (Verify current session token)
      if (req.method === 'GET' && pathname === '/api/auth/me') {
        const authHdr = req.headers['authorization'] || '';
        const token = authHdr.startsWith('Bearer ') ? authHdr.slice(7).trim() : '';
        const user = authManager.verifyToken(token);
        if (!user) {
          sendJson(res, 401, { ok: false, error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn' });
          return;
        }
        sendJson(res, 200, {
          ok: true,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
          },
          cloudSync: cloudSync.getInfo(),
        });
        return;
      }

      // API: Auth State Sync (Sync library state tied to user)
      if (req.method === 'POST' && pathname === '/api/auth/sync') {
        const authHdr = req.headers['authorization'] || '';
        const token = authHdr.startsWith('Bearer ') ? authHdr.slice(7).trim() : '';
        const user = authManager.verifyToken(token);
        const body = await readJsonBody(req);
        const merged = stateStore.mergeState(body);
        cloudSync.syncPush().catch(() => {});
        sendJson(res, 200, {
          ok: true,
          user: user ? { id: user.id, username: user.username, displayName: user.displayName } : null,
          state: merged,
        });
        return;
      }

      // API: Library list
      if (req.method === 'GET' && pathname === '/api/library') {
        sendJson(res, 200, {
          count: library.books.length,
          books: library.getPublicList(),
        });
        return;
      }

      // API: Rescan library folder
      if (req.method === 'POST' && pathname === '/api/library/rescan') {
        await library.scan();
        sendJson(res, 200, {
          ok: true,
          count: library.books.length,
          books: library.getPublicList(),
        });
        return;
      }

      // API: Smart 1-Click Auto-Update EPUBs from Machine (Adds ONLY new books/series, skips all duplicates!)
      if (req.method === 'POST' && pathname === '/api/library/auto-update') {
        const body = await readJsonBody(req).catch(() => ({}));
        const extraDirs = Array.isArray(body?.extraDirs) ? body.extraDirs : [];
        const updateRes = await library.autoUpdateFromMachine({ extraDirs });

        // Unhide any newly added books if previously hidden, and trigger background Goodreads enrich for new items
        if (updateRes.addedCount > 0) {
          let stateChanged = false;
          for (const b of updateRes.addedBooks || []) {
            if (b?.id && stateStore.state.hiddenBookIds?.[b.id]) {
              delete stateStore.state.hiddenBookIds[b.id];
              stateChanged = true;
            }
          }
          if (stateChanged) stateStore.scheduleSave();

          goodreads
            .enrichLibraryAll(library, stateStore, { forceAllBooks: false })
            .then(() => cloudSync.syncPush())
            .catch(() => {});
        }

        sendJson(res, 200, updateRes);
        return;
      }

      // API: Get / Save PC Auto-Update Scan Folders Config
      if (req.method === 'GET' && pathname === '/api/library/update-config') {
        const cfg = await library.loadUpdateConfig();
        const activeDirs = await library.getCandidateScanDirs();
        sendJson(res, 200, {
          ok: true,
          booksDir: BOOKS_DIR,
          config: cfg,
          activeScanDirs: activeDirs,
        });
        return;
      }

      if (req.method === 'POST' && pathname === '/api/library/update-config') {
        const body = await readJsonBody(req).catch(() => ({}));
        const saved = await library.saveUpdateConfig(body);
        const activeDirs = await library.getCandidateScanDirs();
        sendJson(res, 200, {
          ok: true,
          booksDir: BOOKS_DIR,
          config: saved,
          activeScanDirs: activeDirs,
        });
        return;
      }

      // API: Single Book Goodreads Description & Metadata Lookup
      if (req.method === 'GET' && pathname === '/api/goodreads/book') {
        const title = urlObj.searchParams.get('title') || '';
        const author = urlObj.searchParams.get('author') || '';
        const bookId = urlObj.searchParams.get('bookId') || '';
        const force = urlObj.searchParams.get('force') === '1';

        const result = await goodreads.lookupBook({
          title,
          author,
          needFullDescription: true,
          forceRefresh: force,
        });

        if (result && bookId && library.getBook(bookId)) {
          const changed = library.updateBookMetadata(bookId, {
            description: result.description || '',
            series: result.series || '',
            seriesIndex: result.seriesIndex ?? null,
            genres: result.genres || [],
            goodreadsRating: result.goodreadsRating || null,
            goodreadsUrl: result.goodreadsUrl || null,
            descSource: result.source || 'goodreads',
          });
          if (changed) {
            library.saveIndex().catch(() => {});
          }
        }

        sendJson(res, 200, { ok: Boolean(result), result: result || null });
        return;
      }

      // API: Single Series Goodreads Description & Metadata Lookup
      if (req.method === 'GET' && pathname === '/api/goodreads/series') {
        const series = urlObj.searchParams.get('series') || '';
        const author = urlObj.searchParams.get('author') || '';
        const force = urlObj.searchParams.get('force') === '1';
        const sKey = canonicalSeriesKey(series);
        const sBooks = library.books.filter((b) => b.series && canonicalSeriesKey(b.series) === sKey);

        const result = await goodreads.lookupSeries({
          seriesName: series,
          author,
          books: sBooks,
          forceRefresh: force,
        });

        if (result && result.description && sKey) {
          const existing = stateStore.state.seriesMeta?.[sKey];
          if (!existing?.manual || force) {
            if (!stateStore.state.seriesMeta) stateStore.state.seriesMeta = {};
            stateStore.state.seriesMeta[sKey] = {
              name: series,
              author: result.author || author || '',
              subtitle: result.subtitle || '',
              seriesUrl: result.seriesUrl || '',
              genres: result.genres,
              tags: result.tags,
              description: result.description,
              source: result.source || 'goodreads',
              enrichedOnline: true,
              manual: false,
              updatedAt: Date.now(),
            };
            stateStore.scheduleSave();
            cloudSync.syncPush().catch(() => {});
          }
        }

        sendJson(res, 200, { ok: Boolean(result), result: result || null });
        return;
      }

      // API: Batch Enrich All Books & Series from Goodreads
      if (req.method === 'POST' && pathname === '/api/library/enrich-all') {
        const body = await readJsonBody(req).catch(() => ({}));
        const status = await goodreads.enrichLibraryAll(library, stateStore, {
          forceAllBooks: Boolean(body?.forceAllBooks),
        });
        cloudSync.syncPush().catch(() => {});
        sendJson(res, 200, {
          ok: true,
          status,
          count: library.books.length,
          books: library.getPublicList(),
          state: stateStore.getState(),
        });
        return;
      }

      // API: Goodreads Batch Enrich Status
      if (req.method === 'GET' && pathname === '/api/library/enrich-status') {
        sendJson(res, 200, goodreads.getStatus());
        return;
      }

      // API: Upload EPUB directly into PC Online library folder (with strict anti-duplicate check!)
      if (req.method === 'POST' && pathname === '/api/books/upload') {
        const rawHeaderName =
          req.headers['x-filename'] || req.headers['x-file-name'] || urlObj.searchParams.get('filename') || '';
        const safeName = sanitizeEpubFileName(rawHeaderName);
        const buf = await readRawBody(req);
        if (!buf || buf.length < 32 || buf[0] !== 0x50 || buf[1] !== 0x4b) {
          sendJson(res, 400, { error: 'Invalid EPUB file' });
          return;
        }

        const tmpPath = path.join(DATA_DIR, `.upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.epub`);
        await fsp.writeFile(tmpPath, buf);

        let dupInfo = { duplicate: false, matchedBook: null };
        try {
          dupInfo = await library.checkCandidateDuplicate(tmpPath, safeName);
        } catch (_) {}

        if (dupInfo.duplicate) {
          await fsp.unlink(tmpPath).catch(() => {});
          const publicList = library.getPublicList();
          const matchedPublic =
            (dupInfo.matchedBook?.id && publicList.find((b) => b.id === dupInfo.matchedBook.id)) || null;
          sendJson(res, 200, {
            ok: true,
            duplicate: true,
            fileName: dupInfo.matchedBook?.fileName || safeName,
            book: matchedPublic,
            count: library.books.length,
            books: publicList,
          });
          return;
        }

        let targetName = safeName;
        let targetPath = path.join(BOOKS_DIR, targetName);
        const parsedName = path.parse(safeName);

        for (let suffix = 1; suffix <= 99; suffix++) {
          try {
            await fsp.stat(targetPath);
            targetName = `${parsedName.name}_${suffix}${parsedName.ext}`;
            targetPath = path.join(BOOKS_DIR, targetName);
          } catch (_) {
            break;
          }
        }

        await fsp.rename(tmpPath, targetPath).catch(async () => {
          await fsp.copyFile(tmpPath, targetPath);
          await fsp.unlink(tmpPath).catch(() => {});
        });

        await library.scan();
        const uploadedBook =
          library.getPublicList().find((b) => b.fileName === targetName) || null;
        sendJson(res, 200, {
          ok: true,
          duplicate: false,
          fileName: targetName,
          book: uploadedBook,
          count: library.books.length,
          books: library.getPublicList(),
        });
        return;
      }

      // API: Book cover
      const coverMatch = pathname.match(/^\/api\/books\/([a-zA-Z0-9_-]+)\/cover$/);
      if (req.method === 'GET' && coverMatch) {
        const cover = await library.getCover(coverMatch[1]);
        if (!cover) {
          res.writeHead(404);
          res.end();
          return;
        }
        res.writeHead(200, {
          'Content-Type': cover.mime,
          'Content-Length': cover.buffer.length,
          'Cache-Control': 'public, max-age=604800, immutable',
        });
        res.end(cover.buffer);
        return;
      }

      // API: Book EPUB binary
      const fileMatch = pathname.match(/^\/api\/books\/([a-zA-Z0-9_-]+)\/file$/);
      if (req.method === 'GET' && fileMatch) {
        const bookId = fileMatch[1];
        const book = library.getBook(bookId);
        const fullPath = library.getBookFullPath(bookId);
        if (!book || !fullPath) {
          sendJson(res, 404, { error: 'Book not found' });
          return;
        }
        const stat = await fsp.stat(fullPath);
        const etag = `"${book.id}-${stat.size}-${Math.floor(stat.mtimeMs)}"`;
        if (req.headers['if-none-match'] === etag) {
          res.writeHead(304);
          res.end();
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'application/epub+zip',
          'Content-Length': stat.size,
          ETag: etag,
          'Cache-Control': 'private, max-age=86400',
          'Content-Disposition': `inline; filename="${encodeURIComponent(book.fileName)}"`,
        });
        fs.createReadStream(fullPath).pipe(res);
        return;
      }

      // API: State get & bidirectional sync
      if (req.method === 'GET' && pathname === '/api/state') {
        sendJson(res, 200, stateStore.getState());
        return;
      }

      if (req.method === 'POST' && pathname === '/api/state/sync') {
        const body = await readJsonBody(req);
        const merged = stateStore.mergeState(body);
        cloudSync.syncPush().catch(() => {});
        sendJson(res, 200, merged);
        return;
      }

      // API: Trigger cloud sync pull/push
      if (req.method === 'POST' && pathname === '/api/cloud/sync') {
        await cloudSync.syncPull();
        await cloudSync.syncPush();
        sendJson(res, 200, { ok: true, info: cloudSync.getInfo() });
        return;
      }

      // API: English-Vietnamese dictionary & translation
      if (req.method === 'GET' && pathname === '/api/dict') {
        const q = urlObj.searchParams.get('q') || '';
        const result = await dictService.lookup(q);
        sendJson(res, 200, result);
        return;
      }

      // Vendor JSZip (local, works offline via SW)
      if (req.method === 'GET' && pathname === '/vendor/jszip.min.js') {
        const ok = await serveStaticFile(res, JSZIP_PATH, {
          'Cache-Control': 'public, max-age=2592000',
        });
        if (!ok) {
          res.writeHead(404);
          res.end('Not found');
        }
        return;
      }

      // Static files from public/
      if (req.method === 'GET') {
        let rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
        const safePath = path.resolve(PUBLIC_DIR, rel);
        if (safePath.startsWith(PUBLIC_DIR)) {
          const headers = {};
          if (rel === 'sw.js') {
            headers['Cache-Control'] = 'no-cache';
            headers['Service-Worker-Allowed'] = '/';
          } else if (rel === 'manifest.webmanifest' || rel === 'index.html') {
            headers['Cache-Control'] = 'no-cache';
          } else {
            headers['Cache-Control'] = 'public, max-age=3600';
          }
          const ok = await serveStaticFile(res, safePath, headers);
          if (ok) return;
        }
        // SPA fallback
        await serveStaticFile(res, path.join(PUBLIC_DIR, 'index.html'), {
          'Cache-Control': 'no-cache',
        });
        return;
      }

      res.writeHead(404);
      res.end('Not Found');
    } catch (err) {
      console.error('[PaperInk] Request error:', err);
      if (!res.headersSent) {
        sendJson(res, 500, { error: 'Internal server error' });
      }
    }
  });

  server.listen(PORT, HOST, () => {
    const ips = getLanIPs();
    console.log('');
    console.log('=======================================================');
    console.log('  PaperInk — E-Ink EPUB Reader & Library Server');
    console.log('=======================================================');
    console.log(`  Books folder : ${BOOKS_DIR}`);
    console.log(`  Books found  : ${library.books.length} EPUBs`);
    console.log(`  On this PC   : http://localhost:${PORT}`);
    if (ips.length > 0) {
      for (const ip of ips) {
        console.log(`  On S25 Ultra : http://${ip}:${PORT}`);
      }
    }
    console.log('=======================================================');
    console.log('');

    // Background Goodreads enrichment for any books or series missing descriptions
    const hasMissingBooks = library.books.some((b) => !b.description || b.description.trim().length < 140);
    const allSeriesKeys = new Set(
      library.books
        .map((b) => (b.series ? canonicalSeriesKey(b.series) : ''))
        .filter(Boolean)
    );
    const hasMissingSeries = Array.from(allSeriesKeys).some(
      (k) => !stateStore.state.seriesMeta?.[k]?.description
    );
    if (hasMissingBooks || hasMissingSeries) {
      console.log('[PaperInk] Background Goodreads enrichment starting for books & series...');
      goodreads
        .enrichLibraryAll(library, stateStore)
        .then((st) => {
          console.log(
            `[PaperInk] Goodreads enrichment complete: ${st.updatedBooks} books & ${st.updatedSeries} series updated.`
          );
          return cloudSync.syncPush();
        })
        .catch(() => {});
    }
  });
}

main().catch((err) => {
  console.error('[PaperInk] Fatal startup error:', err);
  process.exit(1);
});
