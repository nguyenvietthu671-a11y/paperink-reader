const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const yauzl = require('yauzl');
const { XMLParser } = require('fast-xml-parser');
const metadataEnricher = require('../public/js/metadata-enricher');

const INDEX_VERSION = 6;

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

function extractRawString(val) {
  if (val == null) return '';
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    for (const item of val) {
      const t = extractRawString(item);
      if (t) return t;
    }
    return '';
  }
  if (typeof val === 'object') {
    if (typeof val['#text'] === 'string' || typeof val['#text'] === 'number') {
      return String(val['#text']);
    }
  }
  return '';
}

function extractText(val) {
  const raw = extractRawString(val);
  return raw ? decodeHtmlEntities(raw) : '';
}

function cleanRichDescription(rawVal, maxLen = 2800) {
  let s = extractRawString(rawVal);
  if (!s) return '';
  // Decode entities first in case HTML tags inside OPF dc:description are entity-escaped (&lt;p&gt;)
  s = s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

  // Preserve paragraph breaks cleanly before stripping markup
  s = s
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|li|blockquote|h[1-6])\s*>/gi, '\n\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, ' ');

  // Normalize line-by-line whitespace
  const lines = s
    .split(/\r?\n/)
    .map((ln) => ln.replace(/[ \t\f\v]+/g, ' ').trim());
  s = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

  if (s.length > maxLen) {
    const sub = s.slice(0, maxLen);
    const lastPeriod = Math.max(sub.lastIndexOf('. '), sub.lastIndexOf('! '), sub.lastIndexOf('? '), sub.lastIndexOf('.\n'));
    s = lastPeriod > maxLen * 0.65 ? sub.slice(0, lastPeriod + 1).trim() : sub.replace(/\s+\S*$/, '').trim() + '…';
  }
  return s;
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

    let title = extractText(meta.title) || '';
    let author = extractAuthors(meta.creator) || '';

    const language = (extractText(meta.language) || '').slice(0, 12).toLowerCase();
    const description = cleanRichDescription(meta.description, 2800);

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

    const rawSubjects = Array.isArray(meta.subject) ? meta.subject : meta.subject ? [meta.subject] : [];
    const subjectStrings = rawSubjects.map((s) => extractText(s)).filter(Boolean);

    const enriched = metadataEnricher.analyzeBookMetadata({
      title,
      author,
      fileName,
      description,
      series,
      seriesIndex,
      subjects: subjectStrings,
      language,
      size: 0,
    });

    title = enriched.title || title;
    author = enriched.author || author;
    series = enriched.series || series;
    seriesIndex = enriched.seriesIndex != null ? enriched.seriesIndex : seriesIndex;
    const genres = enriched.genres;
    const tags = enriched.tags;

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
      language: enriched.language || language,
      description,
      series,
      seriesIndex,
      genres,
      tags,
      hasCover: Boolean(coverEntryPath),
      coverEntry: coverEntryPath,
      coverMime,
    };
  } catch (err) {
    const fb = metadataEnricher.analyzeBookMetadata({ fileName });
    return {
      title: fb.title || fallback.title,
      author: fb.author || fallback.author,
      language: fb.language || 'en',
      description: '',
      series: fb.series || '',
      seriesIndex: fb.seriesIndex ?? null,
      genres: fb.genres || ['General Fiction'],
      tags: fb.tags || [],
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
    this.updateConfigFile = path.join(dataDir, 'update-config.json');
    this.coversDir = path.join(dataDir, 'covers');
    this.allRawBooks = [];
    this.books = [];
    this.booksById = new Map();
    this.scanning = false;
    this._extFileCache = new Map();
  }

  async init() {
    await fsp.mkdir(this.dataDir, { recursive: true });
    await fsp.mkdir(this.coversDir, { recursive: true });
    await this.scan();
  }

  async computeFileSha1(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha1');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  async loadPreferredBookIds() {
    const ids = new Set();
    try {
      const raw = await fsp.readFile(path.join(this.dataDir, 'state.json'), 'utf8');
      const st = JSON.parse(raw);
      for (const bucket of [st?.progress, st?.bookmarks, st?.highlights, st?.inkNotes, st?.bookReviews]) {
        if (bucket && typeof bucket === 'object') {
          for (const k of Object.keys(bucket)) ids.add(k);
        }
      }
    } catch (_) {}
    return ids;
  }

  async loadUpdateConfig() {
    try {
      const raw = await fsp.readFile(this.updateConfigFile, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        includeCommonDirs: parsed.includeCommonDirs !== false,
        extraDirs: Array.isArray(parsed.extraDirs) ? parsed.extraDirs.filter(Boolean) : [],
      };
    } catch (_) {
      return { includeCommonDirs: true, extraDirs: [] };
    }
  }

  async saveUpdateConfig(cfg) {
    const clean = {
      includeCommonDirs: cfg?.includeCommonDirs !== false,
      extraDirs: Array.from(new Set((cfg?.extraDirs || []).map((d) => String(d || '').trim()).filter(Boolean))),
    };
    await fsp.writeFile(this.updateConfigFile, JSON.stringify(clean, null, 2), 'utf8');
    return clean;
  }

  async getCandidateScanDirs(extraAdHocDirs = []) {
    const cfg = await this.loadUpdateConfig();
    const candidates = [];
    if (cfg.includeCommonDirs) {
      const home = os.homedir();
      if (home) {
        candidates.push(path.join(home, 'Downloads'));
        candidates.push(path.join(home, 'Desktop'));
        candidates.push(path.join(home, 'Documents'));
      }
    }
    for (const d of [...cfg.extraDirs, ...extraAdHocDirs]) {
      if (d) candidates.push(path.resolve(String(d)));
    }

    const normBooksDir = path.resolve(this.booksDir).toLowerCase();
    const valid = [];
    const seen = new Set();
    for (const dir of candidates) {
      const resolved = path.resolve(dir);
      const lower = resolved.toLowerCase();
      if (lower === normBooksDir || seen.has(lower)) continue;
      seen.add(lower);
      try {
        const st = await fsp.stat(resolved);
        if (st.isDirectory()) valid.push(resolved);
      } catch (_) {}
    }
    return valid;
  }

  async walkExternalEpubs(rootDir, maxDepth = 2, currentDepth = 0) {
    const results = [];
    if (currentDepth > maxDepth) return results;

    const normBooksDir = path.resolve(this.booksDir).toLowerCase();
    const normCurrent = path.resolve(rootDir).toLowerCase();
    // Skip booksDir itself (already scanned directly in step 1!)
    if (normCurrent === normBooksDir || normCurrent.startsWith(normBooksDir + path.sep)) {
      return results;
    }

    const skipNames = new Set([
      'paperink-reader',
      'node_modules',
      '.git',
      '.gemini',
      'appdata',
      '$recycle.bin',
      'system volume information',
      'windows',
      'program files',
      'program files (x86)',
      'library',
    ]);

    let entries;
    try {
      entries = await fsp.readdir(rootDir, { withFileTypes: true });
    } catch (_) {
      return results;
    }

    for (const ent of entries) {
      const full = path.join(rootDir, ent.name);
      if (ent.isDirectory()) {
        const lower = ent.name.toLowerCase();
        if (skipNames.has(lower) || lower.startsWith('.') || lower.endsWith('.sdr')) continue;
        if (path.resolve(full).toLowerCase() === normBooksDir) continue;
        if (currentDepth < maxDepth) {
          const sub = await this.walkExternalEpubs(full, maxDepth, currentDepth + 1);
          results.push(...sub);
        }
      } else if (ent.isFile() && /\.epub$/i.test(ent.name)) {
        results.push(full);
      }
    }
    return results;
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
      if (Array.isArray(parsed.books)) {
        const map = new Map();
        const isCurrentVersion = parsed.indexVersion === INDEX_VERSION;
        for (const b of parsed.books) {
          if (b && b.relPath) {
            map.set(b.relPath, { ...b, _isCurrentVersion: isCurrentVersion });
          }
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
            cached._isCurrentVersion &&
            cached.size === stat.size &&
            Math.abs(cached.mtimeMs - stat.mtimeMs) < 1000 &&
            cached.id &&
            Array.isArray(cached.genres) &&
            Array.isArray(cached.tags)
          ) {
            const { _isCurrentVersion, ...cleanCached } = cached;
            results[i] = cleanCached;
            continue;
          }

          const meta = await parseEpubMetadata(fullPath, path.basename(fullPath));
          // Preserve previously fetched Goodreads description/rating/series across index upgrades!
          const bestDesc =
            cached?.description && cached.description.length > (meta.description || '').length
              ? cached.description
              : meta.description;
          const finalMeta = metadataEnricher.analyzeBookMetadata({
            ...meta,
            description: bestDesc,
            series: meta.series || cached?.series || '',
            seriesIndex: meta.seriesIndex != null ? meta.seriesIndex : cached?.seriesIndex ?? null,
            fileName: path.basename(fullPath),
            subjects: meta.genres,
            size: stat.size,
          });
          const sha1 = cached?.sha1 || (await this.computeFileSha1(fullPath).catch(() => ''));
          const id = hashId(relPath);
          results[i] = {
            id,
            relPath,
            fileName: path.basename(fullPath),
            size: stat.size,
            mtimeMs: stat.mtimeMs,
            sha1,
            title: finalMeta.title,
            author: finalMeta.author,
            language: finalMeta.language,
            description: bestDesc,
            series: finalMeta.series,
            seriesIndex: finalMeta.seriesIndex,
            genres: finalMeta.genres,
            tags: finalMeta.tags,
            goodreadsRating: cached?.goodreadsRating || undefined,
            goodreadsUrl: cached?.goodreadsUrl || undefined,
            descSource: cached?.descSource || undefined,
            hasCover: meta.hasCover,
            coverEntry: meta.coverEntry,
            coverMime: meta.coverMime,
          };
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(concurrency, Math.max(1, files.length)) }, worker)
      );

      const rawBooks = results.filter(Boolean);
      // Lazily backfill sha1 for cached entries that didn't have sha1 yet
      let shaBackfilled = false;
      for (const b of rawBooks) {
        if (!b.sha1) {
          const full = path.join(this.booksDir, b.relPath);
          b.sha1 = await this.computeFileSha1(full).catch(() => '');
          if (b.sha1) shaBackfilled = true;
        }
      }

      if (typeof metadataEnricher.unifyLibraryCatalog === 'function') {
        metadataEnricher.unifyLibraryCatalog(rawBooks);
      }

      const preferredIds = await this.loadPreferredBookIds();
      const dedupRes =
        typeof metadataEnricher.deduplicateBooksCatalog === 'function'
          ? metadataEnricher.deduplicateBooksCatalog(rawBooks, preferredIds)
          : { books: rawBooks, removedCount: 0 };

      const uniqueBooks = dedupRes.books;
      uniqueBooks.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

      this.allRawBooks = rawBooks;
      this.books = uniqueBooks;
      // Map all raw IDs first so legacy bookmarks/progress on duplicate copies still resolve cleanly, then overwrite with winners
      this.booksById = new Map(rawBooks.map((b) => [b.id, b]));
      for (const b of uniqueBooks) {
        this.booksById.set(b.id, b);
      }

      await this.saveIndex();

      console.log(
        `[PaperInk] Indexed ${uniqueBooks.length} unique EPUB books (${rawBooks.length} files, ${dedupRes.removedCount} duplicates hidden, v${INDEX_VERSION}) in ${Date.now() - t0}ms`
      );
      return uniqueBooks;
    } finally {
      this.scanning = false;
    }
  }

  async saveIndex() {
    const listToSave = this.allRawBooks && this.allRawBooks.length ? this.allRawBooks : this.books;
    const tmp = `${this.indexFile}.tmp`;
    await fsp.writeFile(
      tmp,
      JSON.stringify(
        { indexVersion: INDEX_VERSION, updatedAt: Date.now(), count: listToSave.length, books: listToSave },
        null,
        2
      ),
      'utf8'
    );
    await fsp.rename(tmp, this.indexFile);
  }

  async inspectCandidateFile(fullPath, explicitFileName = '') {
    const stat = await fsp.stat(fullPath);
    const fName = explicitFileName || path.basename(fullPath);
    const cachedExt = this._extFileCache.get(fullPath);
    if (cachedExt && cachedExt.size === stat.size && Math.abs(cachedExt.mtimeMs - stat.mtimeMs) < 1000) {
      return cachedExt.candidate;
    }
    const sha1 = await this.computeFileSha1(fullPath).catch(() => '');
    const meta = await parseEpubMetadata(fullPath, fName);
    const analyzed = metadataEnricher.analyzeBookMetadata({
      ...meta,
      fileName: fName,
      subjects: meta.genres,
      size: stat.size,
    });
    const candidate = {
      fullPath,
      fileName: fName,
      size: stat.size,
      mtimeMs: stat.mtimeMs,
      sha1,
      title: analyzed.title,
      author: analyzed.author,
      series: analyzed.series,
      seriesIndex: analyzed.seriesIndex,
      genres: analyzed.genres,
      tags: analyzed.tags,
      description: meta.description || '',
    };
    this._extFileCache.set(fullPath, { size: stat.size, mtimeMs: stat.mtimeMs, candidate });
    return candidate;
  }

  async checkCandidateDuplicate(fullPath, explicitFileName = '') {
    const cand = await this.inspectCandidateFile(fullPath, explicitFileName);
    const idx = metadataEnricher.buildCatalogDedupIndex(this.allRawBooks.length ? this.allRawBooks : this.books);
    const check = metadataEnricher.isBookDuplicateOfCatalog(cand, idx);
    return { ...check, candidate: cand };
  }

  async autoUpdateFromMachine({ extraDirs = [] } = {}) {
    // 1. Capture snapshot BEFORE update
    const prevUniqueIds = new Set(this.books.map((b) => b.id));
    const prevDedupIdx = metadataEnricher.buildCatalogDedupIndex(
      this.allRawBooks.length ? this.allRawBooks : this.books
    );
    const prevSeriesKeys = new Set(
      this.books.map((b) => (b.series || '').trim().toLowerCase()).filter(Boolean)
    );

    // 2. First rescan primary booksDir in case user placed new .epub files directly inside booksDir
    await this.scan();

    const liveDedupIdx = metadataEnricher.buildCatalogDedupIndex(
      this.allRawBooks.length ? this.allRawBooks : this.books
    );

    // 3. Walk external folders on this machine (Downloads, Desktop, Documents + custom folders)
    const scanDirs = await this.getCandidateScanDirs(extraDirs);
    const scannedFolderLabels = [path.basename(this.booksDir), ...scanDirs.map((d) => path.basename(d) || d)];

    let skippedDuplicates = 0;
    const copiedTargetNames = [];

    for (const dir of scanDirs) {
      const extFiles = await this.walkExternalEpubs(dir, 2);
      for (const extPath of extFiles) {
        let cand;
        try {
          cand = await this.inspectCandidateFile(extPath);
        } catch (_) {
          continue;
        }
        // Validate non-empty zip signature implicitly via valid candidate
        if (!cand || cand.size < 64) continue;

        const dupCheck = metadataEnricher.isBookDuplicateOfCatalog(cand, liveDedupIdx);
        if (dupCheck.duplicate) {
          skippedDuplicates++;
          continue;
        }

        // Genuinely NEW book/series installment -> copy cleanly into booksDir!
        const origBase = path.basename(extPath).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim();
        const parsed = path.parse(origBase);
        let targetName = origBase;
        let targetPath = path.join(this.booksDir, targetName);
        for (let suffix = 1; suffix <= 99; suffix++) {
          try {
            await fsp.stat(targetPath);
            targetName = `${parsed.name}_${suffix}${parsed.ext || '.epub'}`;
            targetPath = path.join(this.booksDir, targetName);
          } catch (_) {
            break;
          }
        }

        try {
          await fsp.copyFile(extPath, targetPath);
          copiedTargetNames.push(targetName);
          // Immediately register into liveDedupIdx so duplicate copies inside Downloads are also skipped!
          for (const k of metadataEnricher.getBookDedupKeys({ ...cand, fileName: targetName })) {
            liveDedupIdx.set(k, cand);
          }
        } catch (err) {
          console.warn('[PaperInk AutoUpdate] Failed to copy:', extPath, err.message);
        }
      }
    }

    // 4. Rescan if any new files were copied into booksDir
    if (copiedTargetNames.length > 0) {
      await this.scan();
    }

    // 5. Identify genuinely newly added books & newly added / updated series!
    const publicBooks = this.getPublicList();
    const addedBooks = publicBooks.filter((b) => {
      if (prevUniqueIds.has(b.id)) return false;
      const checkOld = metadataEnricher.isBookDuplicateOfCatalog(b, prevDedupIdx);
      return !checkOld.duplicate;
    });

    const newSeriesSet = new Set();
    const updatedSeriesSet = new Set();
    for (const b of addedBooks) {
      if (!b.series) continue;
      const sKey = b.series.trim().toLowerCase();
      if (!prevSeriesKeys.has(sKey)) newSeriesSet.add(b.series);
      else updatedSeriesSet.add(b.series);
    }

    return {
      ok: true,
      addedCount: addedBooks.length,
      addedBooks,
      newSeriesCount: newSeriesSet.size,
      newSeriesNames: Array.from(newSeriesSet),
      updatedSeriesCount: updatedSeriesSet.size,
      updatedSeriesNames: Array.from(updatedSeriesSet),
      skippedDuplicates,
      scannedFolders: scannedFolderLabels,
      count: this.books.length,
      books: publicBooks,
    };
  }

  updateBookMetadata(id, patch = {}) {
    const b = this.booksById.get(id);
    if (!b || !patch || typeof patch !== 'object') return false;
    let changed = false;
    if (typeof patch.description === 'string' && patch.description.trim() && patch.description.trim() !== b.description) {
      b.description = patch.description.trim();
      changed = true;
    }
    if (typeof patch.series === 'string' && patch.series.trim() && !b.series) {
      b.series = patch.series.trim();
      changed = true;
    }
    if (patch.seriesIndex != null && b.seriesIndex == null) {
      b.seriesIndex = patch.seriesIndex;
      changed = true;
    }
    if (Array.isArray(patch.genres) && patch.genres.length) {
      const onlyGeneric = !Array.isArray(b.genres) || !b.genres.length || (b.genres.length === 1 && b.genres[0] === 'General Fiction');
      if (onlyGeneric) {
        b.genres = patch.genres;
        changed = true;
      }
    }
    if (patch.goodreadsRating && b.goodreadsRating !== patch.goodreadsRating) {
      b.goodreadsRating = patch.goodreadsRating;
      changed = true;
    }
    if (patch.goodreadsUrl && b.goodreadsUrl !== patch.goodreadsUrl) {
      b.goodreadsUrl = patch.goodreadsUrl;
      changed = true;
    }
    if (patch.descSource && b.descSource !== patch.descSource) {
      b.descSource = patch.descSource;
      changed = true;
    }
    return changed;
  }

  getPublicList() {
    return this.books.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      series: b.series || '',
      seriesIndex: b.seriesIndex ?? null,
      genres: Array.isArray(b.genres) && b.genres.length ? b.genres : ['General Fiction'],
      tags: Array.isArray(b.tags) ? b.tags : [],
      language: b.language,
      description: b.description || '',
      goodreadsRating: b.goodreadsRating || null,
      goodreadsUrl: b.goodreadsUrl || null,
      descSource: b.descSource || null,
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
