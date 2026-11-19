const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const yauzl = require('yauzl');
const { XMLParser } = require('fast-xml-parser');

const INDEX_VERSION = 2;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  removeNSPrefix: true,
  parseTagValue: false,
  trimValues: true,
});

function hashId(str) {
  return crypto.createHash('sha1').update(str).digest('hex').slice(0, 14);
}

function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanFilenameFallback(fileName) {
  let base = fileName.replace(/\.epub$/i, '');
  base = decodeHtmlEntities(base);
  base = base.replace(/^_?OceanofPDF\.com_/i, '');
  base = base.replace(/\s*\(z-library\.sk.*?\)/gi, '');
  base = base.replace(/\s*--\s*Anna[’']?s Archive$/i, '');
  if (base.includes(' -- ')) {
    const parts = base.split(' -- ').map((s) => s.trim()).filter(Boolean);
    const title = parts[0] || base;
    const author = parts[1] && !/^\d{4}$/.test(parts[1]) ? parts[1] : 'Unknown Author';
    return { title: title.replace(/_/g, ' ').trim(), author: author.replace(/_/g, ' ').trim() };
  }
  if (base.includes('_-_')) {
    const [t, a] = base.split('_-_');
    return {
      title: (t || base).replace(/_/g, ' ').trim(),
      author: (a || 'Unknown Author').replace(/_/g, ' ').replace(/\(\d+\)$/, '').trim(),
    };
  }
  return {
    title: base.replace(/_/g, ' ').trim(),
    author: 'Unknown Author',
  };
}

function extractText(val) {
  if (val == null) return '';
  if (typeof val === 'string' || typeof val === 'number') return decodeHtmlEntities(String(val));
  if (Array.isArray(val)) {
    for (const item of val) {
      const t = extractText(item);
      if (t) return t;
    }
    return '';
  }
  if (typeof val === 'object') {
    if (typeof val['#text'] === 'string' || typeof val['#text'] === 'number') {
      return decodeHtmlEntities(String(val['#text']));
    }
  }
  return '';
}

function normalizeAuthorName(name) {
  let n = decodeHtmlEntities(String(name || '')).replace(/\s+/g, ' ').trim();
  if (!n) return '';
  // Normalize initials like "C.J. Sansom" -> "C. J. Sansom"
  n = n.replace(/\b([A-Z])\.([A-Z])\./g, '$1. $2.');
  return n;
}

function extractAuthors(creatorVal) {
  if (!creatorVal) return '';
  const items = Array.isArray(creatorVal) ? creatorVal : [creatorVal];
  const names = [];
  const seenLower = new Set();
  for (const item of items) {
    const t = normalizeAuthorName(extractText(item));
    if (t && !seenLower.has(t.toLowerCase())) {
      seenLower.add(t.toLowerCase());
      names.push(t);
    }
  }
  return names.join(', ');
}

function extractGenres(subjectVal, description, series) {
  const rawList = Array.isArray(subjectVal) ? subjectVal : subjectVal ? [subjectVal] : [];
  const genres = [];
  const seen = new Set();

  for (const item of rawList) {
    const txt = extractText(item);
    if (!txt) continue;
    // Skip pure BISAC / junk codes or overly long sentences
    if (txt.length > 48 || /^(FIC|NON|JUV)\d+/i.test(txt)) continue;
    // Split on " / " or ";" if Calibre exported hierarchical subjects
    const parts = txt.split(/\s*[;/]\s*/).map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.length < 3 || part.length > 44) continue;
      if (/^(fiction|general|ebooks?|calibre|novel|books?)$/i.test(part)) continue;
      const key = part.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        genres.push(part);
      }
      if (genres.length >= 4) break;
    }
    if (genres.length >= 4) break;
  }

  // Smart fallback genre inference if EPUB had no dc:subject
  if (genres.length === 0) {
    const hay = `${series || ''} ${description || ''}`.toLowerCase();
    if (/\b(detective|murder|killer|homicide|police|inspector|crime|fbi|forensic)\b/.test(hay)) {
      genres.push('Crime & Detective');
    } else if (/\b(spy|espionage|cia|mossad|intelligence|assassin|conspiracy)\b/.test(hay)) {
      genres.push('Espionage & Thriller');
    } else if (/\b(romance|love|heart|wedding|kiss)\b/.test(hay)) {
      genres.push('Romance');
    } else if (/\b(magic|dragon|witch|fantasy|kingdom|spell)\b/.test(hay)) {
      genres.push('Fantasy & Magical');
    } else if (/\b(mystery|secret|missing|disappear|suspect|clue)\b/.test(hay)) {
      genres.push('Mystery & Suspense');
    } else if (/\b(thriller|danger|chase|revenge|survival)\b/.test(hay)) {
      genres.push('Thriller');
    } else {
      genres.push('General Fiction');
    }
  }

  return genres;
}

function parseSeriesIndexFromText(str) {
  if (!str) return null;
  const m = str.match(/(?:#|book\s+|vol\.?\s+|series\s+)(\d+(?:\.\d+)?)/i);
  if (m) return parseFloat(m[1]);
  return null;
}

function openZip(filePath) {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true, autoClose: false }, (err, zipfile) => {
      if (err) return reject(err);
      resolve(zipfile);
    });
  });
}

function readEntryBuffer(zipfile, entry) {
  return new Promise((resolve, reject) => {
    zipfile.openReadStream(entry, (err, stream) => {
      if (err) return reject(err);
      const chunks = [];
      stream.on('data', (c) => chunks.push(c));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  });
}

function listZipEntries(zipfile) {
  return new Promise((resolve, reject) => {
    const entries = new Map();
    const entriesLower = new Map();
    zipfile.on('entry', (entry) => {
      const norm = entry.fileName.replace(/\\/g, '/').replace(/^\/+/, '');
      entries.set(norm, entry);
      entriesLower.set(norm.toLowerCase(), entry);
      zipfile.readEntry();
    });
    zipfile.on('end', () => resolve({ entries, entriesLower }));
    zipfile.on('error', reject);
    zipfile.readEntry();
  });
}

function findEntry(entries, entriesLower, targetPath) {
  if (!targetPath) return null;
  const cleaned = targetPath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (entries.has(cleaned)) return entries.get(cleaned);
  let decoded = cleaned;
  try {
    decoded = decodeURIComponent(cleaned);
  } catch (_) {}
  if (entries.has(decoded)) return entries.get(decoded);
  if (entriesLower.has(cleaned.toLowerCase())) return entriesLower.get(cleaned.toLowerCase());
  if (entriesLower.has(decoded.toLowerCase())) return entriesLower.get(decoded.toLowerCase());
  return null;
}

function resolvePosix(baseDir, href) {
  if (!href) return '';
  let cleanHref = href.split('#')[0].split('?')[0];
  try {
    cleanHref = decodeURIComponent(cleanHref);
  } catch (_) {}
  if (!baseDir || baseDir === '.') return path.posix.normalize(cleanHref).replace(/^\/+/, '');
  return path.posix.normalize(path.posix.join(baseDir, cleanHref)).replace(/^\/+/, '');
}

async function parseEpubMetadata(fullPath, fileName) {
  const fallback = cleanFilenameFallback(fileName);
  let zipfile;
  try {
    zipfile = await openZip(fullPath);
    const { entries, entriesLower } = await listZipEntries(zipfile);

    let opfPath = null;
    const containerEntry = findEntry(entries, entriesLower, 'META-INF/container.xml');
    if (containerEntry) {
      const containerXml = (await readEntryBuffer(zipfile, containerEntry)).toString('utf8');
      const parsed = xmlParser.parse(containerXml);
      const rootfiles = parsed?.container?.rootfiles?.rootfile;
      const rf = Array.isArray(rootfiles) ? rootfiles[0] : rootfiles;
      if (rf && rf['@_full-path']) {
        opfPath = rf['@_full-path'];
      }
    }

    if (!opfPath) {
      for (const key of entries.keys()) {
        if (/\.opf$/i.test(key)) {
          opfPath = key;
          break;
        }
      }
    }

    if (!opfPath) {
      return {
        title: fallback.title,
        author: fallback.author,
        language: 'en',
        description: '',
        series: '',
        seriesIndex: null,
        genres: ['General Fiction'],
        hasCover: false,
        coverEntry: null,
        coverMime: null,
      };
    }

    const opfEntry = findEntry(entries, entriesLower, opfPath);
    if (!opfEntry) {
      return {
        title: fallback.title,
        author: fallback.author,
        language: 'en',
        description: '',
        series: '',
        seriesIndex: null,
        genres: ['General Fiction'],
        hasCover: false,
        coverEntry: null,
        coverMime: null,
      };
    }

    const opfXml = (await readEntryBuffer(zipfile, opfEntry)).toString('utf8');
    const opf = xmlParser.parse(opfXml);
    const pkg = opf?.package || {};
    const meta = pkg.metadata || {};
    const manifestRaw = pkg.manifest?.item;
    const manifestItems = Array.isArray(manifestRaw) ? manifestRaw : manifestRaw ? [manifestRaw] : [];
    const opfDir = path.posix.dirname(opfEntry.fileName.replace(/\\/g, '/'));

    let title = extractText(meta.title) || fallback.title;
    if (!title || /^unknown$/i.test(title)) title = fallback.title;

    let author = extractAuthors(meta.creator) || fallback.author;
    if (!author || /^unknown$/i.test(author)) author = fallback.author;

    const language = (extractText(meta.language) || 'en').slice(0, 12).toLowerCase();
    let description = extractText(meta.description) || '';
    if (description) {
      description = description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
    }

    let series = '';
    let seriesIndex = null;
    let coverId = null;
    const metaList = Array.isArray(meta.meta) ? meta.meta : meta.meta ? [meta.meta] : [];
    for (const m of metaList) {
      if (!m || typeof m !== 'object') continue;
      const name = String(m['@_name'] || m['@_property'] || '').toLowerCase();
      const content = m['@_content'] || m['#text'] || '';
      if (name === 'cover' && content) {
        coverId = String(content);
      }
      if ((name === 'calibre:series' || name === 'belongs-to-collection') && content) {
        series = decodeHtmlEntities(String(content));
      }
      if ((name === 'calibre:series_index' || name === 'group-position') && content !== '') {
        const num = parseFloat(String(content));
        if (!Number.isNaN(num)) seriesIndex = num;
      }
    }

    if (series && seriesIndex == null) {
      seriesIndex = parseSeriesIndexFromText(fileName) ?? parseSeriesIndexFromText(title);
    }

    const genres = extractGenres(meta.subject, description, series);

    // Locate cover image in manifest
    let coverItem = manifestItems.find(
      (it) =>
        typeof it?.['@_properties'] === 'string' &&
        it['@_properties'].split(/\s+/).includes('cover-image')
    );
    if (!coverItem && coverId) {
      coverItem = manifestItems.find((it) => String(it?.['@_id'] || '') === coverId);
      if (!coverItem) {
        coverItem = manifestItems.find((it) => String(it?.['@_href'] || '') === coverId);
      }
    }
    if (!coverItem || !String(coverItem['@_media-type'] || '').startsWith('image/')) {
      const candidate = manifestItems.find((it) => {
        const mt = String(it?.['@_media-type'] || '');
        const id = String(it?.['@_id'] || '');
        const href = String(it?.['@_href'] || '');
        return mt.startsWith('image/') && /cover/i.test(`${id} ${href}`);
      });
      if (candidate) coverItem = candidate;
    }

    let coverEntryPath = null;
    let coverMime = null;
    if (coverItem && coverItem['@_href']) {
      const resolved = resolvePosix(opfDir === '.' ? '' : opfDir, coverItem['@_href']);
      const matched = findEntry(entries, entriesLower, resolved);
      if (matched) {
        coverEntryPath = matched.fileName;
        coverMime = coverItem['@_media-type'] || guessImageMime(matched.fileName);
      }
    }

    return {
      title,
      author,
      language,
      description,
      series,
      seriesIndex,
      genres,
      hasCover: Boolean(coverEntryPath),
      coverEntry: coverEntryPath,
      coverMime,
    };
  } catch (err) {
    return {
      title: fallback.title,
      author: fallback.author,
      language: 'en',
      description: '',
      series: '',
      seriesIndex: null,
      genres: ['General Fiction'],
      hasCover: false,
      coverEntry: null,
      coverMime: null,
    };
  } finally {
    if (zipfile) {
      try {
        zipfile.close();
      } catch (_) {}
    }
  }
}

function guessImageMime(name) {
  const ext = path.extname(name || '').toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.svg') return 'image/svg+xml';
  return 'image/jpeg';
}

function mimeToExt(mime) {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/gif') return '.gif';
  if (mime === 'image/svg+xml') return '.svg';
  return '.jpg';
}

class LibraryManager {
  constructor(booksDir, dataDir) {
    this.booksDir = booksDir;
    this.dataDir = dataDir;
    this.indexFile = path.join(dataDir, 'library-index.json');
    this.coversDir = path.join(dataDir, 'covers');
    this.books = [];
    this.booksById = new Map();
    this.scanning = false;
  }

  async init() {
    await fsp.mkdir(this.dataDir, { recursive: true });
    await fsp.mkdir(this.coversDir, { recursive: true });
    await this.scan();
  }

  async walkEpubs(dir, skipDirs) {
    const results = [];
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch (_) {
      return results;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        const lower = ent.name.toLowerCase();
        if (skipDirs.has(lower) || lower.endsWith('.sdr') || lower.startsWith('.')) {
          continue;
        }
        const sub = await this.walkEpubs(full, skipDirs);
        results.push(...sub);
      } else if (ent.isFile() && /\.epub$/i.test(ent.name)) {
        results.push(full);
      }
    }
    return results;
  }

  async loadCachedIndex() {
    try {
      const raw = await fsp.readFile(this.indexFile, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.indexVersion === INDEX_VERSION && Array.isArray(parsed.books)) {
        const map = new Map();
        for (const b of parsed.books) {
          if (b && b.relPath) map.set(b.relPath, b);
        }
        return map;
      }
    } catch (_) {}
    return new Map();
  }

  async scan() {
    if (this.scanning) return this.books;
    this.scanning = true;
    const t0 = Date.now();
    try {
      const cachedMap = await this.loadCachedIndex();
      const skipDirs = new Set(['paperink-reader', 'node_modules', '.git']);
      const files = await this.walkEpubs(this.booksDir, skipDirs);

      const results = new Array(files.length);
      let cursor = 0;
      const concurrency = 12;

      const worker = async () => {
        while (cursor < files.length) {
          const i = cursor++;
          const fullPath = files[i];
          const relPath = path.relative(this.booksDir, fullPath).replace(/\\/g, '/');
          let stat;
          try {
            stat = await fsp.stat(fullPath);
          } catch (_) {
            continue;
          }

          const cached = cachedMap.get(relPath);
          if (
            cached &&
            cached.size === stat.size &&
            Math.abs(cached.mtimeMs - stat.mtimeMs) < 1000 &&
            cached.id &&
            Array.isArray(cached.genres)
          ) {
            results[i] = cached;
            continue;
          }

          const meta = await parseEpubMetadata(fullPath, path.basename(fullPath));
          const id = hashId(relPath);
          results[i] = {
            id,
            relPath,
            fileName: path.basename(fullPath),
            size: stat.size,
            mtimeMs: stat.mtimeMs,
            title: meta.title,
            author: meta.author,
            language: meta.language,
            description: meta.description,
            series: meta.series,
            seriesIndex: meta.seriesIndex,
            genres: meta.genres,
            hasCover: meta.hasCover,
            coverEntry: meta.coverEntry,
            coverMime: meta.coverMime,
          };
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(concurrency, Math.max(1, files.length)) }, worker)
      );

      const books = results.filter(Boolean);
      books.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

      this.books = books;
      this.booksById = new Map(books.map((b) => [b.id, b]));

      await fsp.writeFile(
        this.indexFile,
        JSON.stringify(
          { indexVersion: INDEX_VERSION, updatedAt: Date.now(), count: books.length, books },
          null,
          2
        ),
        'utf8'
      );

      console.log(`[PaperInk] Indexed ${books.length} EPUB books (v${INDEX_VERSION}) in ${Date.now() - t0}ms`);
      return books;
    } finally {
      this.scanning = false;
    }
  }

  getPublicList() {
    return this.books.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      series: b.series || '',
      seriesIndex: b.seriesIndex ?? null,
      genres: Array.isArray(b.genres) && b.genres.length ? b.genres : ['General Fiction'],
      language: b.language,
      description: b.description,
      fileName: b.fileName,
      size: b.size,
      mtimeMs: b.mtimeMs,
      hasCover: b.hasCover,
      coverUrl: b.hasCover ? `/api/books/${b.id}/cover` : null,
    }));
  }

  getBook(id) {
    return this.booksById.get(id) || null;
  }

  getBookFullPath(id) {
    const b = this.booksById.get(id);
    if (!b) return null;
    const full = path.resolve(this.booksDir, b.relPath);
    if (!full.startsWith(path.resolve(this.booksDir))) return null;
    return full;
  }

  async getCover(id) {
    const b = this.booksById.get(id);
    if (!b || !b.hasCover || !b.coverEntry) return null;

    const ext = mimeToExt(b.coverMime);
    const cacheFile = path.join(this.coversDir, `${b.id}${ext}`);
    try {
      const buf = await fsp.readFile(cacheFile);
      return { buffer: buf, mime: b.coverMime || 'image/jpeg' };
    } catch (_) {}

    const fullPath = this.getBookFullPath(id);
    if (!fullPath) return null;

    let zipfile;
    try {
      zipfile = await openZip(fullPath);
      const { entries, entriesLower } = await listZipEntries(zipfile);
      const entry = findEntry(entries, entriesLower, b.coverEntry);
      if (!entry) return null;
      const buf = await readEntryBuffer(zipfile, entry);
      await fsp.writeFile(cacheFile, buf).catch(() => {});
      return { buffer: buf, mime: b.coverMime || guessImageMime(b.coverEntry) };
    } catch (_) {
      return null;
    } finally {
      if (zipfile) {
        try {
          zipfile.close();
        } catch (_) {}
      }
    }
  }
}

module.exports = { LibraryManager };
