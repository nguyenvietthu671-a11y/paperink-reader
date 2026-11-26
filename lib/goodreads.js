const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const metadataEnricher = require('../public/js/metadata-enricher');

const GOODREADS_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const GOODREADS_GENRE_MAP = [
  [/\b(psychological thriller|thriller|suspense|espionage|spy)\b/i, 'Thriller & Suspense'],
  [/\b(mystery|detective|crime|noir|police procedural|whodunit|murder)\b/i, 'Mystery & Detective'],
  [/\b(science fiction|sci-fi|cyberpunk|dystopia|space opera|time travel)\b/i, 'Science Fiction'],
  [/\b(fantasy|magic|dragons?|fae|paranormal|urban fantasy|epic fantasy)\b/i, 'Fantasy'],
  [/\b(romance|chick lit|contemporary romance|historical romance|love)\b/i, 'Romance'],
  [/\b(historical fiction|historical|tudor|victorian|world war)\b/i, 'Historical Fiction'],
  [/\b(horror|gothic|supernatural|ghosts?)\b/i, 'Horror'],
  [/\b(classic|classics|19th century|literature)\b/i, 'Classic Literature'],
  [/\b(young adult|\bya\b|teen|coming of age)\b/i, 'Young Adult'],
  [/\b(biography|memoir|autobiography)\b/i, 'Biography & Memoir'],
  [/\b(history|nonfiction|true crime|politics|war)\b/i, 'History'],
  [/\b(psychology|self help|personal development|productivity)\b/i, 'Self-Help & Psychology'],
  [/\b(philosophy|stoicism|ethics)\b/i, 'Philosophy'],
  [/\b(business|economics|finance|leadership|management)\b/i, 'Business & Economics'],
  [/\b(science|physics|biology|astronomy|technology)\b/i, 'Science & Technology'],
  [/\b(literary fiction|contemporary)\b/i, 'Literary Fiction'],
];

function canonicalSeriesKey(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ');
}

function decodeEntities(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&rsquo;|&apos;/gi, '’')
    .replace(/&lsquo;/gi, '‘')
    .replace(/&ldquo;/gi, '“')
    .replace(/&rdquo;/gi, '”')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&hellip;/gi, '…')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}

function cleanHtmlDescription(rawHtml, maxLen = 2800) {
  if (!rawHtml || typeof rawHtml !== 'string') return '';
  let s = decodeEntities(rawHtml);
  s = s
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|li|blockquote|h[1-6])\s*>/gi, '\n\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, ' ');

  // Decode second pass in case entities were nested inside HTML
  s = decodeEntities(s);

  const lines = s
    .split(/\r?\n/)
    .map((ln) => ln.replace(/[ \t\f\v]+/g, ' ').trim())
    .filter((ln, idx, arr) => !(ln === '' && (idx === 0 || arr[idx - 1] === '')));

  s = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  // Remove trailing Goodreads "...more" / "Librarian's note" artifacts
  s = s.replace(/\s*\.\.\.more\s*$/i, '').trim();
  s = s.replace(/\n*Librarian['’]s note:[\s\S]*$/i, '').trim();

  if (s.length > maxLen) {
    const sub = s.slice(0, maxLen);
    const lastStop = Math.max(
      sub.lastIndexOf('. '),
      sub.lastIndexOf('! '),
      sub.lastIndexOf('? '),
      sub.lastIndexOf('.\n')
    );
    s = lastStop > maxLen * 0.6 ? sub.slice(0, lastStop + 1).trim() : sub.replace(/\s+\S*$/, '').trim() + '…';
  }
  return s;
}

function normalizeCompare(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    .replace(/[^a-z0-9\u00c0-\u024f\u1e00-\u1eff]+/g, ' ')
    .replace(/^the\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanSearchTitle(title) {
  let t = String(title || '').trim();
  // Remove trailing "(Series, #N)" or "[Book 2]" or "-- A Novel"
  t = t
    .replace(/\s*\([^)]*#\d+[^)]*\)\s*$/i, '')
    .replace(/\s*\[[^\]]*\]\s*$/i, '')
    .replace(/\s*:\s*a\s+novel.*$/i, '')
    .replace(/\s*-\s*a\s+novel.*$/i, '')
    .trim();
  return t || String(title || '').trim();
}

function parseSeriesFromGoodreadsTitle(fullTitle, author) {
  const m = String(fullTitle || '').match(/\(([^()]+?),\s*#(\d+(?:\.\d+)?)\)\s*$/);
  if (!m) return { series: '', seriesIndex: null };
  let rawSeries = m[1].trim();
  // Sometimes Goodreads has multiple series separated by "; " inside parens: "(Jack Reacher, #8; Chronological, #1)"
  if (rawSeries.includes(';')) {
    rawSeries = rawSeries.split(';')[0].trim();
  }
  const cleanSeries = metadataEnricher?.cleanSeriesName
    ? metadataEnricher.cleanSeriesName(rawSeries, author)
    : rawSeries;
  const idx = parseFloat(m[2]);
  return {
    series: cleanSeries || '',
    seriesIndex: !Number.isNaN(idx) ? idx : null,
  };
}

function mapGoodreadsGenres(rawGenreNames = []) {
  const mapped = [];
  const seen = new Set();
  for (const raw of rawGenreNames) {
    const g = String(raw || '').trim();
    if (!g) continue;
    for (const [rx, label] of GOODREADS_GENRE_MAP) {
      if (rx.test(g) && !seen.has(label)) {
        seen.add(label);
        mapped.push(label);
      }
    }
    if (mapped.length >= 4) break;
  }
  return mapped;
}

class GoodreadsService {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.cacheFile = path.join(dataDir, 'goodreads-cache.json');
    this.cache = { version: 1, books: {}, series: {} };
    this.saveTimer = null;
    this.enrichStatus = {
      running: false,
      phase: 'idle',
      done: 0,
      total: 0,
      updatedBooks: 0,
      updatedSeries: 0,
      startedAt: 0,
      finishedAt: 0,
    };
  }

  async init() {
    await fsp.mkdir(this.dataDir, { recursive: true });
    try {
      const raw = await fsp.readFile(this.cacheFile, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        this.cache = {
          version: 1,
          books: parsed.books || {},
          series: parsed.series || {},
        };
      }
    } catch (_) {}
  }

  scheduleSaveCache() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveCache().catch(() => {});
    }, 800);
  }

  async saveCache() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    const tmp = `${this.cacheFile}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(this.cache, null, 2), 'utf8');
    await fsp.rename(tmp, this.cacheFile);
  }

  makeBookCacheKey(title, author) {
    return `${normalizeCompare(cleanSearchTitle(title))}__${normalizeCompare(author)}`;
  }

  scoreCandidate(item, targetTitle, targetAuthor) {
    if (!item || !item.bookId) return -999;
    const fullTitle = String(item.title || '');
    // Reject study guides, summaries, analyses, trivia, workbooks
    if (/\b(summary|study guide|workbook|analysis|cliffnotes|sparknotes|trivia|companion to|box\s*set|omnibus)\b/i.test(fullTitle)) {
      if (!/\b(summary|guide|omnibus)\b/i.test(targetTitle)) return -500;
    }

    const candTitle = normalizeCompare(item.bookTitleBare || cleanSearchTitle(fullTitle));
    const wantTitle = normalizeCompare(cleanSearchTitle(targetTitle));
    const wantShort = normalizeCompare(cleanSearchTitle(targetTitle).split(/[:\-–—]/)[0]);
    const candAuthor = normalizeCompare(item.author?.name || '');
    const wantAuthor = normalizeCompare(String(targetAuthor || '').split(/[,;&]/)[0]);

    let score = 0;
    if (candTitle === wantTitle) score += 60;
    else if (wantShort && candTitle === wantShort) score += 52;
    else if (candTitle.startsWith(wantTitle) || wantTitle.startsWith(candTitle)) score += 36;
    else if (wantShort && (candTitle.startsWith(wantShort) || wantShort.startsWith(candTitle))) score += 28;
    else {
      // Token overlap
      const wTokens = wantTitle.split(' ').filter((w) => w.length > 2);
      const cSet = new Set(candTitle.split(' '));
      const hits = wTokens.filter((w) => cSet.has(w)).length;
      if (wTokens.length > 0 && hits / wTokens.length >= 0.65) score += 20;
      else return -100;
    }

    if (wantAuthor && !/^unknown/.test(wantAuthor)) {
      const wantParts = wantAuthor.split(' ').filter(Boolean);
      const lastName = wantParts[wantParts.length - 1];
      if (candAuthor === wantAuthor) score += 45;
      else if (lastName && lastName.length >= 3 && candAuthor.includes(lastName)) score += 32;
      else score -= 35;
    }

    const ratings = Number(item.ratingsCount || 0);
    if (ratings > 0) {
      score += Math.min(12, Math.log10(ratings + 1) * 2.2);
    }
    return score;
  }

  async fetchAutocomplete(query, timeoutMs = 6500) {
    const url = `https://www.goodreads.com/book/auto_complete?format=json&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: GOODREADS_HEADERS,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async fetchBookShowDetails(bookUrl, expectedBookId = null, timeoutMs = 8500) {
    const fullUrl = bookUrl.startsWith('http') ? bookUrl : `https://www.goodreads.com${bookUrl}`;
    const res = await fetch(fullUrl, {
      headers: GOODREADS_HEADERS,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!m) return null;

    let parsed;
    try {
      parsed = JSON.parse(m[1]);
    } catch (_) {
      return null;
    }

    const apollo = parsed?.props?.pageProps?.apolloState || {};
    let bestBook = null;
    for (const [k, val] of Object.entries(apollo)) {
      if (!k.startsWith('Book:') || !val || typeof val !== 'object') continue;
      if (expectedBookId && String(val.legacyId || '') === String(expectedBookId) && val.description) {
        bestBook = val;
        break;
      }
      if (val.description && (!bestBook || String(val.description).length > String(bestBook.description).length)) {
        bestBook = val;
      }
    }

    if (!bestBook) return null;

    const description = cleanHtmlDescription(bestBook.description || '', 2800);
    const rawGenres = Array.isArray(bestBook.bookGenres)
      ? bestBook.bookGenres.map((bg) => bg?.genre?.name).filter(Boolean)
      : [];
    const genres = mapGoodreadsGenres(rawGenres);

    let seriesTitle = '';
    let seriesIndex = null;
    let seriesWebUrl = '';
    if (Array.isArray(bestBook.bookSeries) && bestBook.bookSeries.length > 0) {
      const bs = bestBook.bookSeries[0];
      if (bs?.userPosition != null && bs.userPosition !== '') {
        const idx = parseFloat(String(bs.userPosition));
        if (!Number.isNaN(idx)) seriesIndex = idx;
      }
      const ref = bs?.series?.__ref;
      const seriesObj = ref ? apollo[ref] : null;
      if (seriesObj) {
        seriesTitle = seriesObj.title || '';
        seriesWebUrl = seriesObj.webUrl || '';
      }
    }
    if (!seriesWebUrl) {
      const anySeriesKey = Object.keys(apollo).find((k) => k.startsWith('Series:') && apollo[k]?.webUrl);
      if (anySeriesKey) {
        seriesTitle = seriesTitle || apollo[anySeriesKey].title || '';
        seriesWebUrl = apollo[anySeriesKey].webUrl || '';
      }
    }

    return {
      description,
      genres,
      rawGenres: rawGenres.slice(0, 8),
      seriesTitle,
      seriesIndex,
      seriesWebUrl,
      webUrl: bestBook.webUrl || fullUrl,
    };
  }

  async fallbackBookDescription(title, author) {
    const cleanT = cleanSearchTitle(title);
    const cleanA = String(author || '').replace(/^unknown.*/i, '').split(',')[0].trim();

    // 1. Apple iTunes Books Search API (high quality publisher descriptions, fast JSON)
    try {
      const term = [cleanT, cleanA].filter(Boolean).join(' ');
      const res = await fetch(
        `https://itunes.apple.com/search?media=ebook&entity=ebook&limit=4&term=${encodeURIComponent(term)}`,
        { signal: AbortSignal.timeout(5500) }
      );
      if (res.ok) {
        const data = await res.json();
        for (const item of data.results || []) {
          const desc = cleanHtmlDescription(item.description || '', 2600);
          if (desc.length >= 80) {
            return { description: desc, source: 'apple-books' };
          }
        }
      }
    } catch (_) {}

    // 2. Google Books API
    try {
      const q = cleanA ? `intitle:${cleanT} inauthor:${cleanA}` : `intitle:${cleanT}`;
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?maxResults=4&q=${encodeURIComponent(q)}`,
        { signal: AbortSignal.timeout(5500) }
      );
      if (res.ok) {
        const data = await res.json();
        for (const item of data.items || []) {
          const desc = cleanHtmlDescription(item.volumeInfo?.description || '', 2600);
          if (desc.length >= 80) {
            return { description: desc, source: 'google-books' };
          }
        }
      }
    } catch (_) {}

    return null;
  }

  async lookupBook({ title, author = '', needFullDescription = true, forceRefresh = false } = {}) {
    if (!title) return null;
    const cacheKey = this.makeBookCacheKey(title, author);
    const cached = this.cache.books[cacheKey];
    if (
      cached &&
      !forceRefresh &&
      (!needFullDescription || (cached.fullFetched && cached.description && cached.description.length >= 80))
    ) {
      return cached;
    }

    const cleanT = cleanSearchTitle(title);
    const primaryAuthor = String(author || '').replace(/^unknown.*/i, '').split(/[,;&]/)[0].trim();

    let items = [];
    try {
      const q1 = [cleanT, primaryAuthor].filter(Boolean).join(' ');
      items = await this.fetchAutocomplete(q1);
      if (!items.length && primaryAuthor) {
        items = await this.fetchAutocomplete(cleanT);
      }
      if (!items.length && cleanT.includes(':')) {
        const shortT = cleanT.split(':')[0].trim();
        items = await this.fetchAutocomplete([shortT, primaryAuthor].filter(Boolean).join(' '));
      }
    } catch (_) {}

    let best = null;
    let bestScore = -999;
    for (const it of items) {
      const sc = this.scoreCandidate(it, cleanT, primaryAuthor);
      if (sc > bestScore) {
        bestScore = sc;
        best = it;
      }
    }

    let result = cached ? { ...cached } : null;

    if (best && bestScore >= 15) {
      const parsedSeries = parseSeriesFromGoodreadsTitle(best.title, primaryAuthor || best.author?.name);
      const snippetDesc = cleanHtmlDescription(best.description?.html || '', 1200);
      const bookUrl = best.bookUrl
        ? best.bookUrl.startsWith('http')
          ? best.bookUrl
          : `https://www.goodreads.com${best.bookUrl}`
        : `https://www.goodreads.com/book/show/${best.bookId}`;

      result = {
        found: true,
        source: 'goodreads',
        bookId: String(best.bookId),
        title: best.bookTitleBare || cleanT,
        author: best.author?.name || author,
        goodreadsRating: best.avgRating ? Number(best.avgRating) : null,
        ratingsCount: Number(best.ratingsCount || 0),
        goodreadsUrl: bookUrl,
        series: parsedSeries.series || result?.series || '',
        seriesIndex: parsedSeries.seriesIndex ?? result?.seriesIndex ?? null,
        seriesWebUrl: result?.seriesWebUrl || '',
        genres: result?.genres || [],
        description: result?.description || snippetDesc || '',
        fullFetched: Boolean(result?.fullFetched),
        updatedAt: Date.now(),
      };

      if (needFullDescription && (!result.fullFetched || forceRefresh || result.description.length < 200)) {
        try {
          const full = await this.fetchBookShowDetails(bookUrl, best.bookId);
          if (full) {
            if (full.description && full.description.length > 40) {
              result.description = full.description;
            }
            if (full.genres?.length) {
              result.genres = full.genres;
            }
            if (full.seriesTitle) {
              const cleanedS = metadataEnricher?.cleanSeriesName
                ? metadataEnricher.cleanSeriesName(full.seriesTitle, result.author)
                : full.seriesTitle;
              if (cleanedS) result.series = cleanedS;
            }
            if (full.seriesIndex != null && result.seriesIndex == null) {
              result.seriesIndex = full.seriesIndex;
            }
            if (full.seriesWebUrl) {
              result.seriesWebUrl = full.seriesWebUrl;
            }
            result.fullFetched = true;
          }
        } catch (_) {}
      }
    }

    // Fallback if Goodreads didn't yield a full description when needed
    if (needFullDescription && (!result || !result.description || result.description.length < 80)) {
      const fb = await this.fallbackBookDescription(title, author);
      if (fb && fb.description) {
        result = {
          ...(result || {
            found: true,
            title: cleanT,
            author,
            series: '',
            seriesIndex: null,
            genres: [],
          }),
          description: fb.description,
          source: result?.goodreadsUrl ? 'goodreads' : fb.source,
          fullFetched: true,
          updatedAt: Date.now(),
        };
      }
    }

    if (result) {
      this.cache.books[cacheKey] = result;
      this.scheduleSaveCache();
    }
    return result;
  }

  async fetchGoodreadsSeriesPage(seriesWebUrl, timeoutMs = 8500) {
    if (!seriesWebUrl) return null;
    const url = seriesWebUrl.startsWith('http')
      ? seriesWebUrl
      : `https://www.goodreads.com${seriesWebUrl}`;
    const res = await fetch(url, {
      headers: GOODREADS_HEADERS,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const m =
      html.match(/data-react-class="ReactComponents\.SeriesHeader"\s+data-react-props="([^"]+)"/) ||
      html.match(/SeriesHeader"\s+data-react-props="([^"]+)"/);
    if (!m) return null;

    const decodedJson = m[1]
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    let props;
    try {
      props = JSON.parse(decodedJson);
    } catch (_) {
      return null;
    }

    const rawDescHtml = props?.description?.html || props?.description?.truncatedHtml || '';
    const description = cleanHtmlDescription(rawDescHtml, 2600);
    return {
      title: props?.title || '',
      subtitle: props?.subtitle ? decodeEntities(String(props.subtitle)).trim() : '',
      description,
      seriesUrl: url,
    };
  }

  async fetchWikipediaSeriesFallback(seriesName, author) {
    const cleanS = String(seriesName || '').trim();
    const authorLast = String(author || '')
      .replace(/^unknown.*/i, '')
      .trim()
      .split(/\s+/)
      .pop()
      ?.toLowerCase();
    const candidates = [`${cleanS} (novel series)`, `${cleanS} (book series)`, cleanS];

    for (const cand of candidates) {
      try {
        const slug = encodeURIComponent(cand.replace(/\s+/g, '_'));
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(4500),
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (!data || data.type === 'disambiguation' || !data.extract) continue;
        const extract = String(data.extract).trim();
        const lower = `${data.description || ''} ${extract}`.toLowerCase();
        const looksLiterary = /\b(novel|book|series|author|writer|detective|thriller|fiction|trilogy|character)\b/.test(lower);
        const matchesAuthor = !authorLast || authorLast.length < 3 || lower.includes(authorLast);
        if (extract.length >= 90 && looksLiterary && matchesAuthor) {
          return extract;
        }
      } catch (_) {}
    }
    return '';
  }

  async lookupSeries({ seriesName, author = '', books = [], seriesWebUrl = '', forceRefresh = false } = {}) {
    const key = canonicalSeriesKey(seriesName);
    if (!key) return null;

    const cached = this.cache.series[key];
    if (cached && !forceRefresh && cached.description && cached.description.length >= 90) {
      return cached;
    }

    const sortedBooks = [...(books || [])].sort((a, b) => (a.seriesIndex ?? 9999) - (b.seriesIndex ?? 9999));
    const primaryAuthor = author || sortedBooks[0]?.author || '';
    const firstBook = sortedBooks[0] || null;

    // 1. Discover Goodreads Series URL if not provided
    let resolvedSeriesUrl = seriesWebUrl || cached?.seriesUrl || '';
    let firstBookGr = null;

    if (!resolvedSeriesUrl && firstBook) {
      firstBookGr = await this.lookupBook({
        title: firstBook.title,
        author: firstBook.author || primaryAuthor,
        needFullDescription: true,
        forceRefresh,
      });
      if (firstBookGr?.seriesWebUrl) {
        resolvedSeriesUrl = firstBookGr.seriesWebUrl;
      }
    }

    if (!resolvedSeriesUrl) {
      // Try querying Goodreads by seriesName + author
      const probe = await this.lookupBook({
        title: seriesName,
        author: primaryAuthor,
        needFullDescription: true,
      });
      if (probe?.seriesWebUrl) {
        resolvedSeriesUrl = probe.seriesWebUrl;
      }
      if (!firstBookGr && probe) firstBookGr = probe;
    }

    // 2. Fetch Goodreads Series Page
    let grSeries = null;
    if (resolvedSeriesUrl) {
      try {
        grSeries = await this.fetchGoodreadsSeriesPage(resolvedSeriesUrl);
      } catch (_) {}
    }

    // Aggregate genres from books + Goodreads
    const genreCounts = new Map();
    for (const b of sortedBooks) {
      for (const g of b.genres || []) {
        if (g && g !== 'General Fiction') {
          genreCounts.set(g, (genreCounts.get(g) || 0) + 1);
        }
      }
    }
    if (firstBookGr?.genres?.length) {
      for (const g of firstBookGr.genres) {
        genreCounts.set(g, (genreCounts.get(g) || 0) + 2);
      }
    }
    const genres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([g]) => g);
    if (!genres.length) genres.push('General Fiction');

    let description = grSeries?.description || '';
    let source = description ? 'goodreads-series' : '';

    // 3. Fallback if Goodreads SeriesHeader had empty description (some Goodreads series list works without header text)
    if (!description || description.length < 80) {
      const wiki = await this.fetchWikipediaSeriesFallback(seriesName, primaryAuthor);
      if (wiki) {
        description = wiki;
        source = resolvedSeriesUrl ? 'goodreads+wikipedia' : 'wikipedia';
      }
    }

    // 4. Rich Goodreads Book #1 + Series Header synthesis if neither Goodreads SeriesHeader nor Wikipedia had prose
    if (!description || description.length < 80) {
      if (!firstBookGr && firstBook) {
        firstBookGr = await this.lookupBook({
          title: firstBook.title,
          author: firstBook.author || primaryAuthor,
          needFullDescription: true,
        });
      }
      const book1Desc = (firstBookGr?.description || firstBook?.description || '').trim();
      const subtitleBit = grSeries?.subtitle ? ` (${grSeries.subtitle} trên Goodreads)` : '';
      const genreBit = genres.filter((g) => g !== 'General Fiction').slice(0, 2).join(' & ');
      const headerSentence = `${seriesName} là bộ tiểu thuyết${genreBit ? ` thuộc thể loại ${genreBit}` : ''}${
        primaryAuthor && !/^unknown/i.test(primaryAuthor) ? ` của tác giả ${primaryAuthor}` : ''
      }${subtitleBit}, hiện có ${sortedBooks.length || 1} tập trong thư viện của bạn.`;

      if (book1Desc) {
        const introLabel = firstBook
          ? `Khởi đầu từ tập ${firstBook.seriesIndex != null ? `#${firstBook.seriesIndex} ` : ''}“${firstBook.title}”: `
          : '';
        description = `${headerSentence}\n\n${introLabel}${book1Desc}`;
        source = firstBookGr?.goodreadsUrl ? 'goodreads-book1' : 'synthesized';
      } else {
        description = headerSentence;
        source = 'synthesized';
      }
    }

    // Collect clean tags
    const tagSet = new Set(['Theo bộ']);
    for (const b of sortedBooks.slice(0, 6)) {
      for (const t of b.tags || []) {
        if (t && tagSet.size < 6) tagSet.add(t);
      }
    }

    const finalSeries = {
      found: true,
      name: seriesName,
      key,
      author: primaryAuthor,
      subtitle: grSeries?.subtitle || '',
      seriesUrl: grSeries?.seriesUrl || resolvedSeriesUrl || '',
      genres,
      tags: Array.from(tagSet),
      description: cleanHtmlDescription(description, 2600),
      source,
      enrichedOnline: true,
      updatedAt: Date.now(),
    };

    this.cache.series[key] = finalSeries;
    this.scheduleSaveCache();
    return finalSeries;
  }

  getStatus() {
    return { ...this.enrichStatus };
  }

  async enrichLibraryAll(library, stateStore, { forceAllBooks = false, onProgress = null } = {}) {
    if (this.enrichStatus.running) {
      return this.enrichStatus;
    }

    this.enrichStatus = {
      running: true,
      phase: 'books',
      done: 0,
      total: library.books.length,
      updatedBooks: 0,
      updatedSeries: 0,
      startedAt: Date.now(),
      finishedAt: 0,
    };

    try {
      const books = library.books;
      let cursor = 0;
      const concurrency = 5;
      const discoveredSeriesUrls = new Map();

      const bookWorker = async () => {
        while (cursor < books.length) {
          const idx = cursor++;
          const b = books[idx];
          if (!b) continue;

          const existingDesc = String(b.description || '').trim();
          const needsFullDesc = forceAllBooks || existingDesc.length < 180;
          const needsAnyGoodreads = needsFullDesc || !b.goodreadsUrl || !b.series;

          if (needsAnyGoodreads) {
            try {
              const gr = await this.lookupBook({
                title: b.title,
                author: b.author,
                needFullDescription: needsFullDesc,
                forceRefresh: false,
              });

              if (gr) {
                const patch = {
                  goodreadsRating: gr.goodreadsRating || b.goodreadsRating || null,
                  goodreadsUrl: gr.goodreadsUrl || b.goodreadsUrl || null,
                };
                if (gr.description && (needsFullDesc || existingDesc.length < 180)) {
                  patch.description = gr.description;
                  patch.descSource = gr.source || 'goodreads';
                }
                if (gr.series && !b.series) {
                  patch.series = gr.series;
                  if (gr.seriesIndex != null) patch.seriesIndex = gr.seriesIndex;
                } else if (b.series && b.seriesIndex == null && gr.seriesIndex != null) {
                  if (canonicalSeriesKey(gr.series) === canonicalSeriesKey(b.series)) {
                    patch.seriesIndex = gr.seriesIndex;
                  }
                }
                if (Array.isArray(gr.genres) && gr.genres.length) {
                  patch.genres = gr.genres;
                }

                if (library.updateBookMetadata(b.id, patch)) {
                  this.enrichStatus.updatedBooks++;
                }

                // Also store in stateStore.bookMetaOverrides if description or series was missing so Cloud Sync / Mobile gets it immediately
                if ((needsFullDesc && patch.description) || patch.series) {
                  const curOv = stateStore.state.bookMetaOverrides?.[b.id];
                  if (!curOv?.manual) {
                    if (!stateStore.state.bookMetaOverrides) stateStore.state.bookMetaOverrides = {};
                    stateStore.state.bookMetaOverrides[b.id] = {
                      ...(curOv || {}),
                      author: b.author,
                      series: b.series || '',
                      seriesIndex: b.seriesIndex ?? null,
                      genres: b.genres,
                      tags: b.tags || [],
                      description: b.description || '',
                      goodreadsRating: b.goodreadsRating || null,
                      goodreadsUrl: b.goodreadsUrl || null,
                      updatedAt: Date.now(),
                    };
                  }
                }

                const sName = b.series || gr.series;
                if (sName && gr.seriesWebUrl) {
                  discoveredSeriesUrls.set(canonicalSeriesKey(sName), gr.seriesWebUrl);
                }
              }
            } catch (_) {}
          }

          this.enrichStatus.done++;
          if (onProgress) onProgress(this.getStatus());
        }
      };

      await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, books.length)) }, bookWorker));
      await library.saveIndex();

      // Phase 2: All Series in library
      const seriesGroups = new Map();
      const seriesDisplayNames = new Map();
      for (const b of library.books) {
        if (!b.series) continue;
        if (metadataEnricher?.isSeriesSameAsAuthor?.(b.series, b.author)) continue;
        const sKey = canonicalSeriesKey(b.series);
        if (!sKey) continue;
        if (!seriesGroups.has(sKey)) {
          seriesGroups.set(sKey, []);
          seriesDisplayNames.set(sKey, b.series);
        } else if (/^the\s+/i.test(seriesDisplayNames.get(sKey)) && !/^the\s+/i.test(b.series)) {
          seriesDisplayNames.set(sKey, b.series);
        }
        seriesGroups.get(sKey).push(b);
      }

      const seriesEntries = Array.from(seriesGroups.entries());
      this.enrichStatus.phase = 'series';
      this.enrichStatus.done = 0;
      this.enrichStatus.total = seriesEntries.length;

      let sCursor = 0;
      const seriesConcurrency = 4;
      const seriesWorker = async () => {
        while (sCursor < seriesEntries.length) {
          const idx = sCursor++;
          const [sKey, sBooks] = seriesEntries[idx];
          const sName = seriesDisplayNames.get(sKey) || sBooks[0]?.series || sKey;
          const existingMeta = stateStore.state.seriesMeta?.[sKey];
          if (existingMeta?.manual) {
            this.enrichStatus.done++;
            continue;
          }

          try {
            const sr = await this.lookupSeries({
              seriesName: sName,
              author: sBooks[0]?.author || '',
              books: sBooks,
              seriesWebUrl: discoveredSeriesUrls.get(sKey) || existingMeta?.seriesUrl || '',
              forceRefresh: false,
            });
            if (sr && sr.description) {
              if (!stateStore.state.seriesMeta) stateStore.state.seriesMeta = {};
              stateStore.state.seriesMeta[sKey] = {
                name: sName,
                subtitle: sr.subtitle || '',
                seriesUrl: sr.seriesUrl || '',
                genres: sr.genres,
                tags: sr.tags,
                description: sr.description,
                source: sr.source || 'goodreads',
                enrichedOnline: true,
                manual: false,
                updatedAt: Date.now(),
              };
              this.enrichStatus.updatedSeries++;
            }
          } catch (_) {}

          this.enrichStatus.done++;
          if (onProgress) onProgress(this.getStatus());
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(seriesConcurrency, Math.max(1, seriesEntries.length)) }, seriesWorker)
      );

      stateStore.state.updatedAt = Date.now();
      await Promise.all([library.saveIndex(), stateStore.flush(), this.saveCache()]);

      this.enrichStatus.running = false;
      this.enrichStatus.phase = 'done';
      this.enrichStatus.finishedAt = Date.now();
      return this.getStatus();
    } catch (err) {
      console.error('[Goodreads] Batch enrich error:', err);
      this.enrichStatus.running = false;
      this.enrichStatus.phase = 'error';
      this.enrichStatus.finishedAt = Date.now();
      return this.getStatus();
    }
  }
}

module.exports = { GoodreadsService, canonicalSeriesKey, cleanHtmlDescription };
