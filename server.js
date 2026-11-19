const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');

const { LibraryManager } = require('./lib/library');
const { StateStore } = require('./lib/state');
const { DictionaryService } = require('./lib/dictionary');

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

function readJsonBody(req, maxBytes = 16 * 1024 * 1024) {
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

  await Promise.all([library.init(), stateStore.init(), dictService.init()]);

  const server = http.createServer(async (req, res) => {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = decodeURIComponent(urlObj.pathname);

      // Basic CORS for local convenience
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // API: Server info + LAN QR Code
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
        sendJson(res, 200, merged);
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
  });
}

main().catch((err) => {
  console.error('[PaperInk] Fatal startup error:', err);
  process.exit(1);
});
