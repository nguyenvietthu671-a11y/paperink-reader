(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PaperInkMetadata = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function decodeEntities(str) {
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

  function isUnknownAuthor(a) {
    const t = String(a || '').trim().toLowerCase();
    return !t || t === 'unknown' || t === 'unknown author' || t === 'anonymous' || t === 'n/a' || t === 'none';
  }

  const NON_AUTHOR_CORP_RE =
    /\b(overdrive|inc\.?|llc|ltd\.?|corp\.?|publishing|publishers|publisher|imprint|penguin|random house|harpercollins|simon\s*&\s*schuster|macmillan|hachette|kensington|ballantine|flatiron|quill|calibre|epublibre|z-library|z-lib|oceanofpdf|anna[’']?s archive|gutenberg|amazon|audible)\b/i;

  const NON_AUTHOR_ROLE_RE =
    /\((?:translator|translation|translated by|narrator|editor|edited by|illustrator|illustrated by|foreword|introduction|afterword|compiler|biên dịch|người dịch|dịch giả|biên tập|minh họa)[^)]*\)/i;

  function normalizeSingleAuthor(raw) {
    let s = decodeEntities(String(raw || '')).trim();
    if (!s) return '';
    // Skip pure translator/editor/illustrator credits when tagged in parens
    if (NON_AUTHOR_ROLE_RE.test(s)) {
      const strippedRole = s.replace(NON_AUTHOR_ROLE_RE, '').trim();
      // If original raw string explicitly marked THIS person as translator/editor (e.g. "Slin Jung (translator)"), drop them!
      if (/\((?:translator|translation|translated by|narrator|illustrator|biên dịch|người dịch|dịch giả)/i.test(s)) {
        return '';
      }
      s = strippedRole;
    }
    if (NON_AUTHOR_CORP_RE.test(s)) return '';

    let n = s
      .replace(/\[[^\]]*\]/g, ' ') // Strip Anna's Archive "[Hanff, Helene]" duplicate bracket
      .replace(/^\s*by\s+/i, '')
      .replace(/\s*\((?:author|tác giả)\)\s*/gi, '')
      .replace(/\s+etc\.?$/i, '')
      // Convert underscore initials like "S_ A_ Cosby" or "Noelle W_ Ihli" -> "S. A. Cosby", "Noelle W. Ihli"
      .replace(/\b([A-Z])_(?=\s|$|[A-Z]_)/g, '$1.')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!n || NON_AUTHOR_CORP_RE.test(n)) return '';

    // Flip "Last, First" -> "First Last" when there is exactly one comma and no suffixes
    if (/^[^,]{2,34},\s*[^,]{2,34}$/.test(n) && !/\b(jr\.?|sr\.?|iii|ii|phd|md|inc\.?|ltd\.?)\b/i.test(n)) {
      const [last, first] = n.split(',').map((x) => x.trim());
      if (first && last && !/\d/.test(first) && !/\d/.test(last)) {
        n = `${first} ${last}`;
      }
    }
    // Expand compact two-letter uppercase initials at start of name: "AR Torre" -> "A. R. Torre", "JD Barker" -> "J. D. Barker"
    n = n.replace(/^([A-Z])([A-Z])\s+([A-Z][a-z]{2,})\b/, '$1. $2. $3');
    // Normalize dotted initials like "C.J. Sansom" or "S.A. Cosby" -> "C. J. Sansom"
    n = n.replace(/\b([A-Z])\.([A-Z])\./g, '$1. $2.');
    n = n.replace(/\b([A-Z])\.([A-Z])\b(?!\.)/g, '$1. $2.');
    n = n.replace(/\s+/g, ' ').trim();
    if (n.length < 2 || /^\d+$/.test(n)) return '';
    return n;
  }

  function normalizeAuthor(raw) {
    if (!raw) return '';
    const items = Array.isArray(raw) ? raw : [String(raw)];
    const parts = [];
    for (const item of items) {
      const str = decodeEntities(String(item || ''))
        .replace(/\[[^\]]*\]/g, ' ')
        .trim();
      if (!str) continue;
      // Split multi-author strings carefully:
      // Split on ";", "&", " and ", OR ", " when NOT a single "Last, First" pair!
      const semiSplit = str.split(/\s*(?:;|&\s+(?=[A-Z])|\band\b(?=\s+[A-Z]))\s*/);
      for (const chunk of semiSplit) {
        const commaCount = (chunk.match(/,/g) || []).length;
        if (commaCount >= 2) {
          // e.g. "Lee Onhwa, Slin Jung (translator), ..."
          parts.push(...chunk.split(',').map((x) => x.trim()).filter(Boolean));
        } else if (commaCount === 1) {
          const [a, b] = chunk.split(',').map((x) => x.trim());
          // Check if "First1 Last1, First2 Last2" (both sides have spaces or role parens!) vs "Last, First"
          if (
            NON_AUTHOR_ROLE_RE.test(b) ||
            NON_AUTHOR_CORP_RE.test(b) ||
            a.toLowerCase() === b.toLowerCase() ||
            (a.includes(' ') && b.includes(' ') && !/^[A-Z]\.\s*[A-Z]\.$/.test(b))
          ) {
            parts.push(a, b);
          } else {
            parts.push(chunk);
          }
        } else {
          parts.push(chunk);
        }
      }
    }

    const out = [];
    const seen = new Set();
    for (const part of parts) {
      const clean = normalizeSingleAuthor(part);
      if (clean && !isUnknownAuthor(clean)) {
        const key = clean.toLowerCase().replace(/[^a-z0-9\u00c0-\u1eff]/g, '');
        if (!key || seen.has(key)) continue;
        // Deduplicate pseudonym/initial variant in same credit like "A. R. Torre, Alessandra Torre"
        const tokens = clean.split(/\s+/);
        const lastTok = tokens[tokens.length - 1]?.toLowerCase();
        const firstInit = tokens[0]?.charAt(0)?.toLowerCase();
        const dupIdx = out.findIndex((existing) => {
          const et = existing.split(/\s+/);
          return et[et.length - 1]?.toLowerCase() === lastTok && et[0]?.charAt(0)?.toLowerCase() === firstInit;
        });
        if (dupIdx !== -1) continue;
        seen.add(key);
        out.push(clean);
      }
    }
    return out.join(', ');
  }

  function parseNumberWord(token) {
    if (token == null) return null;
    const s = String(token).trim().toLowerCase();
    const num = parseFloat(s);
    if (!Number.isNaN(num)) return num;
    const map = {
      one: 1, first: 1, i: 1, một: 1,
      two: 2, second: 2, ii: 2, hai: 2,
      three: 3, third: 3, iii: 3, ba: 3,
      four: 4, fourth: 4, iv: 4, bốn: 4,
      five: 5, fifth: 5, v: 5, năm: 5,
      six: 6, sixth: 6, vi: 6, sáu: 6,
      seven: 7, seventh: 7, vii: 7, bảy: 7,
      eight: 8, eighth: 8, viii: 8, tám: 8,
      nine: 9, ninth: 9, ix: 9, chín: 9,
      ten: 10, tenth: 10, x: 10, mười: 10,
    };
    return map[s] ?? null;
  }

  function normalizePersonTokens(str) {
    return decodeEntities(String(str || ''))
      .toLowerCase()
      .replace(/[’']s\b/g, '')
      .replace(/[^a-z0-9\u00c0-\u024f\u1e00-\u1eff\s]/gi, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }

  function isSeriesSameAsAuthor(series, author) {
    if (!series || !author || isUnknownAuthor(author)) return false;
    const sClean = decodeEntities(String(series))
      .replace(/\b(bestselling|new york times|international|psychological|gripping|acclaimed|classic|thriller|mystery|novel|series|collection|works|books)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const sTokens = normalizePersonTokens(sClean);
    if (!sTokens.length) return true;
    const sJoined = sTokens.join('');

    const authorParts = String(author)
      .split(/[,;&]+|\band\b/i)
      .map((a) => normalizeSingleAuthor(a))
      .filter((a) => a && !isUnknownAuthor(a));

    // Also include whole normalized author string
    const fullNorm = normalizeAuthor(author);
    if (fullNorm) {
      for (const a of fullNorm.split(',').map((x) => x.trim()).filter(Boolean)) {
        if (!authorParts.includes(a)) authorParts.push(a);
      }
    }

    for (const a of authorParts) {
      const aTokens = normalizePersonTokens(a);
      if (!aTokens.length) continue;
      const aJoined = aTokens.join('');
      const aRevJoined = [...aTokens].reverse().join('');
      if (sJoined === aJoined || sJoined === aRevJoined) return true;
      // Same token set regardless of order (e.g. "Patterson James" vs "James Patterson")
      if (
        sTokens.length === aTokens.length &&
        sTokens.every((t) => aTokens.includes(t))
      ) {
        return true;
      }
    }
    return false;
  }

  function stripAuthorPrefixFromSeries(series, author) {
    if (!series || !author || isUnknownAuthor(author)) return series;
    let out = series;
    const authorList = normalizeAuthor(author)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const a of authorList) {
      const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out
        .replace(new RegExp(`^${escaped}(?:[’']s)?\\s+(?:bestselling\\s+|#?1\\s+new\\s+york\\s+times\\s+bestselling\\s+)?`, 'i'), '')
        .trim();
    }
    return out;
  }

  function cleanSeriesName(raw, author = '') {
    let s = decodeEntities(String(raw || ''))
      .replace(/\s*\((?:unabridged|abridged|illustrated|annotated)\)\s*/gi, ' ')
      .replace(/\s*:\s*(?:summary|book analysis|conversation starters|study guide).*$/i, '')
      .replace(/\s+\bby\s+[A-Z][\w\s.'-]+$/i, '')
      .replace(/^(?:an?\s+|tales\s+of\s+(?:the\s+)?)(?=[A-Z0-9])/i, '')
      .replace(/\s*(?:crime\s+thriller|psychological\s+thriller|detective\s+series|mystery\s+series|thriller\s+series)\s*$/i, '')
      // Do NOT strip "Mysteries" / "Guide" if preceded by possessive "'s" (e.g. "Antique Hunter's Mysteries")!
      .replace(/(.+?)\s+(series|trilogy|saga|chronicles?|novels?|books?|mysteries|investigations?|adventures?|files|cases)\s*$/i, (full, prefix, suffix) => {
        if (/trilogy|saga|chronicles?|sequence/i.test(suffix)) return full.trim();
        if (/[’']s$/i.test(prefix.trim()) && /mysteries|adventures?|investigations?|cases|files/i.test(suffix)) {
          return `${prefix.trim()} ${suffix.charAt(0).toUpperCase()}${suffix.slice(1).toLowerCase()}`;
        }
        return prefix.trim();
      })
      .replace(/^(.{4,}?)\s+(?:mystery|thriller)\s*$/i, (full, baseName) => {
        if (/[’']s$/i.test(baseName.trim())) return full.trim();
        return /^[A-Z0-9]{2,4}$/.test(baseName.trim()) ? `${baseName.trim()} Thriller` : baseName;
      })
      // Fix dangling possessive "'s" if source already lacked the trailing noun (e.g. "Antique Hunter's" -> "Antique Hunter's Mysteries")
      .replace(/^(.*?\bHunter)[’']s$/i, "$1's Mysteries")
      .replace(/\s*(?:tập|quyển|phần|vol\.?|volume|part|bk\.?)\s*$/i, '')
      .replace(/^[\s\-–—:,#•_]+|[\s\-–—:,#•_]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (author) {
      s = stripAuthorPrefixFromSeries(s, author);
    }
    if (!s || s.length < 2 || s.length > 68 || /^\d+$/.test(s)) return '';
    if (
      /^(edition|first edition|version|unabridged|abridged|illustrated|annotated|retail|epub|pdf|kindle|z-lib|z-library|oceanofpdf|calibre|none|novel|a novel|a thriller|a mystery|short story|tập|quyển|phần|book|vol\.?|volume|part|bestseller|new york times|standalone)$/i.test(
        s
      )
    ) {
      return '';
    }
    if (/award|finalist|prize|isbn|publisher|penguin|harpercollins|random house|simon\s*&\s*schuster/i.test(s)) {
      return '';
    }
    // Capitalize leading lowercase word in English series (e.g. "alex Cross" -> "Alex Cross")
    if (/^[a-z]/.test(s)) {
      s = s.charAt(0).toUpperCase() + s.slice(1);
    }
    if (author && isSeriesSameAsAuthor(s, author)) {
      return '';
    }
    return s;
  }

  function extractSeriesFromText(title = '', fileName = '', description = '', author = '') {
    let series = '';
    let seriesIndex = null;
    let cleanTitle = decodeEntities(String(title || ''))
      .replace(/#(\d+)_(\d+)\b/g, '#$1.$2')
      .trim();

    const stripNoiseFromFile = (fn) =>
      decodeEntities(String(fn || ''))
        .replace(/\.epub$/i, '')
        .replace(/#(\d+)_(\d+)\b/g, '#$1.$2')
        .replace(/^_?OceanofPDF\.com_/i, '')
        .replace(/\s*\((?:z-library|z-lib|1lib)[^)]*\)/gi, '')
        .replace(/\s*--\s*Anna[’']?s Archive.*$/i, '')
        // Strip Windows duplicate "(1)", "(2)" right before author paren or end of filename
        .replace(/\s*\(\d\)(?=\s*\([^()]+\)\s*$|\s*$)/g, '')
        .replace(/_/g, ' ')
        .trim();

    const tryParen = (source, stripFromTitle = false) => {
      if (!source || series) return;
      // Scan all (...) or [...] groups in source so we skip author parens and find "(Series #1)"
      const groupRe = /\s*([\(\[])([^()\[\]]{2,68}?)([\)\]])/g;
      let match;
      while ((match = groupRe.exec(source)) !== null) {
        const inner = match[2].trim();
        const m = inner.match(
          /^(.{2,60}?)(?:[,:\-\s]+)(?:#|book\s+|bk\.?\s*|vol\.?\s*|volume\s+|part\s+|tập\s+|quyển\s+|phần\s+|no\.?\s*)?(\d+(?:\.\d+)?)$/i
        );
        if (m) {
          const cand = cleanSeriesName(m[1], author);
          const idx = parseFloat(m[2]);
          const hasExplicitWord = /(?:#|book|bk|vol|part|tập|quyển|phần)\s*\d/i.test(inner);
          if (cand && !Number.isNaN(idx) && idx >= 0 && (idx < 500 || hasExplicitWord) && !(idx >= 1800 && idx <= 2099 && !hasExplicitWord)) {
            series = cand;
            seriesIndex = idx;
            if (stripFromTitle) {
              const stripped = source.replace(match[0], '').replace(/\s+/g, ' ').trim();
              if (stripped.length >= 2) cleanTitle = stripped;
            }
            return;
          }
        }
      }
    };

    tryParen(cleanTitle, true);
    const cleanedFileSource = stripNoiseFromFile(fileName);
    tryParen(cleanedFileSource.split(' -- ')[0], false);

    // Pattern: "Outsiders Sequence 2: The Other" or "[Series] Book 3: Title"
    if (!series && cleanTitle) {
      const prefixSeqRe = /^([A-Z][\w\s'&.-]{2,44}?\s+(?:Sequence|Chronicles?|Trilogy|Saga|Cycle|Files))\s+#?(\d+(?:\.\d+)?)\s*[:\-–—]\s*(.{2,80})$/i;
      const mPref = cleanTitle.match(prefixSeqRe);
      if (mPref) {
        const cand = cleanSeriesName(mPref[1], author);
        const idx = parseFloat(mPref[2]);
        if (cand && !Number.isNaN(idx) && idx < 500) {
          series = cand;
          seriesIndex = idx;
          cleanTitle = mPref[3].trim();
        }
      }
    }

    // Pattern: "Title: Series Name, Book 4" or "Title _ Gabriel Allon Series, Book 4" or "Title - Detective Erika Foster 5"
    if (!series && cleanTitle) {
      const colonSubRe =
        /^(.{2,60}?)\s*(?:[:•—–]|_|\s-\s)\s*([A-Z][\w\s'&.-]{2,48}?)(?:[,:\s]+)(?:series[,:\s]+)?(?:#|book\s+|bk\.?\s*|vol\.?\s*|tập\s+|quyển\s+)(\d+(?:\.\d+)?)\b/i;
      const mSub = cleanTitle.match(colonSubRe);
      if (mSub) {
        const cand = cleanSeriesName(mSub[2], author);
        const idx = parseFloat(mSub[3]);
        if (cand && !Number.isNaN(idx) && idx < 500) {
          series = cand;
          seriesIndex = idx;
          const stripped = mSub[1].replace(/\s*#\d+(?:\.\d+)?\s*$/, '').trim();
          if (stripped.length >= 2) cleanTitle = stripped;
        }
      }
    }

    // Pattern: "(A Sherlock Holmes Novel)", ": A Jack Reacher Novel", ": A Tales of the Sun Eater"
    if (!series && cleanTitle) {
      const novelOfRe =
        /(?:\s*[\(\[]\s*|\s*[:\-–—_]\s*)(?:(?:an?|the)\s+)?(?:tales?\s+of\s+(?:the\s+)?)?([A-Z0-9][\w\s'&.-]{2,44}?)\s+(?:novel|novella|mystery|mysteries|thriller|adventure|story|stories|case|chronicle|trilogy)\s*[\)\]]?$/i;
      const m = cleanTitle.match(novelOfRe);
      if (m) {
        const cand = cleanSeriesName(m[1], author);
        if (cand) {
          series = cand;
          const stripped = cleanTitle.slice(0, m.index).replace(/\s+/g, ' ').trim();
          if (stripped.length >= 2) cleanTitle = stripped;
        }
      } else {
        const talesOnlyRe = /\s*[:\-–—_]\s*(?:an?\s+)?tales?\s+of\s+(?:the\s+)?([A-Z0-9][\w\s'&.-]{2,40})$/i;
        const mt = cleanTitle.match(talesOnlyRe);
        if (mt) {
          const cand = cleanSeriesName(mt[1], author);
          if (cand) {
            series = cand;
            const stripped = cleanTitle.slice(0, mt.index).replace(/\s+/g, ' ').trim();
            if (stripped.length >= 2) cleanTitle = stripped;
          }
        }
      }
    }

    // Pattern: "Đấu Phá Thương Khung - Tập 3" / "Title - Quyển 2" (only when prefix is NOT the author!)
    if (!series && cleanTitle) {
      const viRe = /^(.{2,55}?)\s*[-–—:,]?\s*(?:tập|quyển|phần|book|vol\.?)\s*(\d+(?:\.\d+)?)\b/i;
      const m = cleanTitle.match(viRe);
      if (m) {
        const cand = cleanSeriesName(m[1], author);
        const idx = parseFloat(m[2]);
        if (cand && !Number.isNaN(idx) && idx > 0 && idx < 500) {
          series = cand;
          seriesIndex = idx;
        }
      }
    }

    // Pattern in description: "Book One of the Kingkiller Chronicle", "first in the 4MK Thriller series", "sixth novel of the ... Sun Eater series"
    if (!series && description) {
      const descPatterns = [
        {
          re: /\b(?:book|volume|novel|novella|installment|part)\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:of|in)\s+(?:the\s+)?(?:[a-z]+[- ][a-z]+\s+)?([A-Z0-9][A-Za-z0-9'\s&-]{2,48}?)\s+(?:series|trilogy|saga|quartet|cycle|sequence)\b/i,
          idxGroup: 1,
          serGroup: 2,
        },
        {
          re: /\b(?:book|volume|novel|novella|installment|part)\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:of|in)\s+(?:the\s+)?([A-Z0-9][A-Za-z0-9'\s&-]{2,48}?\s+chronicles?)\b/i,
          idxGroup: 1,
          serGroup: 2,
        },
        {
          re: /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th))\s+(?:(?:book|novel|novella|installment|thriller|mystery)\s+)?(?:in|of)\s+(?:the\s+)?(?:[a-z]+[- ][a-z]+\s+)?([A-Z0-9][A-Za-z0-9'\s&-]{2,48}?)\s+(?:series|trilogy|saga|sequence|mysteries|mystery|thriller)\b/i,
          idxGroup: 1,
          serGroup: 2,
        },
      ];
      for (const p of descPatterns) {
        const md = description.match(p.re);
        if (md) {
          const cand = cleanSeriesName(md[p.serGroup], author);
          if (cand) {
            series = cand;
            const tok = String(md[p.idxGroup] || '').replace(/(st|nd|rd|th)$/i, '');
            seriesIndex = parseNumberWord(tok);
            break;
          }
        }
      }
    }

    // Index fallback from filename/title if series already known
    if (series && seriesIndex == null) {
      const idxMatch = `${cleanedFileSource} ${title}`.match(
        /(?:#|book\s+|bk\.?\s*|vol\.?\s*|tập\s+|quyển\s+)(\d+(?:\.\d+)?)\b/i
      );
      if (idxMatch) {
        const n = parseFloat(idxMatch[1]);
        if (!Number.isNaN(n) && n >= 0 && n < 500) seriesIndex = n;
      }
    }

    // Clean leftover subtitle noise from title (e.g. ": A Novel", "_ A Novel", "(Previously Published As ...)")
    cleanTitle = cleanTitle
      .replace(/\s*[_:]\s*A\s+(?:Novel|Thriller|Mystery|Psychological\s+Thriller|Domestic\s+Thriller)\s*$/i, '')
      .replace(/\s*\(Previously\s+Published\s+As\b[^)]*$/i, '')
      .replace(/\s*\(\d\)\s*$/, '')
      .trim();

    return { cleanTitle: cleanTitle || title, series, seriesIndex };
  }

  function parseFilenameMeta(fileName) {
    let base = decodeEntities(String(fileName || '')).replace(/\.epub$/i, '');
    base = base.replace(/#(\d+)_(\d+)\b/g, '#$1.$2');
    base = base.replace(/^_?OceanofPDF\.com_/i, '');
    base = base.replace(/\s*\((?:z-library|z-lib|1lib)[^)]*\)/gi, '');
    base = base.replace(/\s*--\s*Anna[’']?s Archive.*$/i, '');
    base = base.replace(/\s*\[(?:epub|ebook[^\]]*|retail|v\d+|converted)\]\s*/gi, ' ').trim();
    // Strip trailing Windows duplicate counter like " (1)" ONLY when preceded by another paren or author
    base = base.replace(/(\))\s*\(\d\)$/, '$1').trim();

    let title = base;
    let author = '';
    let series = '';
    let seriesIndex = null;

    if (base.includes(' -- ')) {
      const parts = base.split(' -- ').map((s) => s.trim()).filter(Boolean);
      title = (parts[0] || base)
        .replace(/\s+_\s*/g, ': ')
        .replace(/_\s+/g, ': ')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (parts[1] && !/^\d{4}$/.test(parts[1]) && !/^none$/i.test(parts[1])) {
        author = normalizeAuthor(parts[1].replace(/\[[^\]]+\]/g, '').replace(/_/g, ' '));
      }
      // Anna's Archive often stores series in parts[2]: "Gabriel Allon, 4, 2003" or "Alex Cross, bk_ 20"
      if (parts[2]) {
        const seg = parts[2].replace(/bk_\s*/i, '#').replace(/_/g, ' ').trim();
        const segMatch = seg.match(
          /^([A-Z0-9][^,;()]{1,48}?)(?:[,:\s]+)(?:#|book\s+|vol\.?\s*)?(\d+(?:\.\d+)?)\b/i
        );
        if (segMatch) {
          const idx = parseFloat(segMatch[2]);
          const cand = cleanSeriesName(segMatch[1], author);
          if (cand && !Number.isNaN(idx) && idx >= 0 && idx < 500 && !(idx >= 1800 && idx <= 2099)) {
            series = cand;
            seriesIndex = idx;
          }
        }
      }
    } else if (base.includes('_-_')) {
      const parts = base.split('_-_').map((s) => s.replace(/_/g, ' ').trim()).filter(Boolean);
      title = parts[0] || base;
      if (parts[1]) {
        author = normalizeAuthor(parts[1].replace(/\(\d+\)$/, '').trim());
      }
    } else {
      // Z-Library format: "Title (Series 24) (Author Name)" or "Title (Author Name)"
      const trailingParens = base.match(/^(.*?\S)\s*\(([^()]{3,64})\)\s*$/);
      if (trailingParens) {
        const inside = trailingParens[2].trim();
        const looksLikeSeriesWithNum = /(?:#|book\s+|vol\.?\s*|tập\s+|\s)\d+(?:\.\d+)?$/i.test(inside);
        if (!looksLikeSeriesWithNum && !/\b(trilogy|series|saga|edition|unabridged)\b/i.test(inside)) {
          const cleanedInside = inside
            .replace(/,?\s*[^,()]*\((?:translat|editor|illustrat)[^)]*\).*$/i, '')
            .replace(/\s+etc\.?$/i, '')
            .trim();
          const candAuthor = normalizeAuthor(cleanedInside);
          if (!isUnknownAuthor(candAuthor)) {
            author = candAuthor;
            base = trailingParens[1].trim();
            title = base;
          }
        }
      }

      if (/\s-\s/.test(base)) {
        const parts = base.split(/\s-\s/).map((s) => s.replace(/_/g, ' ').trim()).filter(Boolean);
        if (parts.length >= 3) {
          // Vietnamese/volume pattern: "Đấu Phá Thương Khung - Tập 2 - Thiên Tàm Thổ Đậu"
          const volMatch = parts[1].match(/^(?:tập|quyển|phần|book|vol\.?|volume|part|#)\s*(\d+(?:\.\d+)?)$/i);
          if (volMatch) {
            const tailAuthor = normalizeAuthor(parts.slice(2).join(' - '));
            const cand = cleanSeriesName(parts[0], tailAuthor);
            if (cand) series = cand;
            seriesIndex = parseFloat(volMatch[1]);
            title = `${parts[0]} - ${parts[1]}`;
            author = tailAuthor;
          } else {
            // Common Calibre/eBook naming: "Author - Series 01 - Title"
            const midMatch = parts[1].match(/^(.+?)\s+#?(\d+(?:\.\d+)?)$/);
            const headAuthor = normalizeAuthor(parts[0]);
            const candSeries = midMatch ? cleanSeriesName(midMatch[1], headAuthor) : '';
            if (midMatch && candSeries) {
              author = headAuthor;
              series = candSeries;
              seriesIndex = parseFloat(midMatch[2]);
              title = parts.slice(2).join(' - ');
            } else {
              title = parts[0];
              author = normalizeAuthor(parts[parts.length - 1]);
            }
          }
        } else if (parts.length === 2) {
          // Could be "Cold Blood - Detective Erika Foster 5" (when author was already stripped from Z-Lib paren!)
          const rightSeriesMatch = author
            ? parts[1].match(/^([A-Z][\w\s'&.-]{2,46}?)\s+#?(\d+(?:\.\d+)?)$/)
            : null;
          if (rightSeriesMatch) {
            const cand = cleanSeriesName(rightSeriesMatch[1], author);
            if (cand) {
              title = parts[0];
              series = cand;
              seriesIndex = parseFloat(rightSeriesMatch[2]);
            } else {
              title = parts[0];
              if (!author) author = normalizeAuthor(parts[1]);
            }
          } else {
            title = parts[0];
            if (!author) author = normalizeAuthor(parts[1]);
          }
        }
      } else {
        title = base.replace(/_/g, ' ').trim();
      }
    }

    // Pre-check "Title #19 _ Series_ Book 19" or "Title _ Series Series, Book 4" BEFORE leadSeq!
    const earlySub = title.match(
      /^(.{2,60}?)\s*(?:[:•—–]|\s-\s|\s+_\s*|\s*_\s+)\s*([A-Z][\w\s'&.-]{2,48}?)(?:[,:\s]+)(?:series[,:\s]+)?(?:#|book\s+|bk\.?\s*|vol\.?\s*|tập\s+|quyển\s+)(\d+(?:\.\d+)?)\b/i
    );
    if (earlySub) {
      const cand = cleanSeriesName(earlySub[2], author);
      const idx = parseFloat(earlySub[3]);
      if (cand && !Number.isNaN(idx) && idx < 500) {
        series = series || cand;
        seriesIndex = seriesIndex ?? idx;
        title = earlySub[1].replace(/\s*#\d+(?:\.\d+)?\s*$/, '').trim();
      }
    }

    // Handle leading "[Series 04] • Title", "Series 04_ Title", "Series 01-Title", or "Prefix 08 Title"
    const leadBracket = title.match(/^\[([^[\]]{2,52}?)\s+#?(\d+(?:\.\d+)?)\]\s*[•\-–—:]*\s*(.+)$/);
    if (leadBracket) {
      const idx = parseFloat(leadBracket[2]);
      const restTitle = leadBracket[3].trim();
      const cand = cleanSeriesName(leadBracket[1], author);
      if (restTitle.length >= 2 && !Number.isNaN(idx)) {
        title = restTitle;
        seriesIndex = seriesIndex ?? idx;
        if (cand && !series) series = cand;
      }
    } else if (!series) {
      const leadSeq = title.match(
        /^([A-Z][\w\s'&.-]{2,40}?)\s+(\d{1,2}(?:\.\d+)?)(?:\s*[_:\-–—]\s*|\s+)(.+)$/
      );
      if (leadSeq) {
        const prefix = leadSeq[1].trim();
        const idx = parseFloat(leadSeq[2]);
        const restTitle = leadSeq[3].trim();
        if (restTitle.length >= 2 && !Number.isNaN(idx) && idx > 0 && idx < 200) {
          if (author && isSeriesSameAsAuthor(prefix, author)) {
            // Prefix is the Author (e.g. "Lee Child 08 The Enemy") — strip author & number from title, NEVER set series = author!
            title = restTitle;
            seriesIndex = seriesIndex ?? idx;
          } else if (!author && /^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(prefix) && /^\d{2}$/.test(leadSeq[2])) {
            // Pattern "Lee Child 08 The Enemy" when author wasn't known yet: treat prefix as candidate author, NOT series!
            author = normalizeAuthor(prefix);
            title = restTitle;
            seriesIndex = seriesIndex ?? idx;
          } else {
            const cand = cleanSeriesName(prefix, author);
            if (cand && !series) series = cand;
            seriesIndex = seriesIndex ?? idx;
            title = restTitle;
          }
        }
      }
    }

    const fromTitle = extractSeriesFromText(title, fileName, '', author);
    if (!series && fromTitle.series) {
      series = fromTitle.series;
      seriesIndex = seriesIndex ?? fromTitle.seriesIndex;
    }
    if (fromTitle.cleanTitle && fromTitle.cleanTitle.length >= 2) {
      title = fromTitle.cleanTitle;
    }
    if (series && isSeriesSameAsAuthor(series, author)) {
      series = '';
    }

    return {
      title: title || 'Untitled',
      author: author || 'Unknown Author',
      series,
      seriesIndex,
    };
  }

  // Bilingual Genre & Smart Tag Taxonomy Rules (Precision-guarded against thriller blurb metaphors)
  const GENRE_RULES = [
    {
      genre: 'Mystery & Detective',
      tag: 'Trinh thám',
      re: /\b(detective|murder|killer|homicide|police|inspector|crime|fbi|forensic|whodunit|sherlock|poirot|sleuth|investigation|mystery|mysteries|private investigator|cold case|serial killer|suspect)\b|trinh thám|án mạng|phá án|vụ án|kỳ án|thám tử|hung thủ|tội phạm/i,
    },
    {
      genre: 'Thriller & Suspense',
      tag: 'Giật gân',
      re: /\b(thriller|thrillers|suspense|espionage|spy|cia|mossad|mi6|assassin|conspiracy|hostage|kidnap|kidnapped|abduction|manhunt|domestic noir|psychological thriller|psychological suspense|legal thriller)\b|giật gân|ly kỳ|điệp viên|âm mưu|hồi hộp|sát thủ/i,
    },
    {
      genre: 'Sci-Fi',
      tag: 'Khoa học VT',
      re: /\b(sci-fi|science fiction|cyberpunk|dystopia|dystopian|post-apocalyptic|apocalyptic|space opera|spaceship|interstellar|galaxy|alien|aliens|mars|android|time travel|quantum|speculative fiction)\b|khoa học viễn tưởng|viễn tưởng|vũ trụ|hành tinh|hậu tận thế|tương lai/i,
    },
    {
      genre: 'Fantasy',
      tag: 'Kỳ ảo',
      re: /\b(fantasy|magical realism|magic|dragon|dragons|witch|witches|wizard|sorcerer|spell|elf|elves|fae|faerie|vampire|werewolf|necromancer|fairytale retelling|mythological|mythology)\b|kỳ ảo|ma thuật|phép thuật|rồng|vương quốc|tiên hiệp|kiếm hiệp|huyền huyễn|dị giới|tu tiên|tu chân|đấu khí|thương khung|xuyên không|trùng sinh/i,
    },
    {
      genre: 'Romance',
      tag: 'Tình cảm',
      re: /\b(romance|romantic comedy|rom-com|love story|soulmate|enemies to lovers|second chance romance|contemporary romance|small town romance)\b|ngôn tình|tình cảm|lãng mạn|chuyện tình/i,
    },
    {
      genre: 'Horror',
      tag: 'Kinh dị',
      re: /\b(horror|ghost story|exorcism|demonic|possession|supernatural horror|gothic horror|slasher|macabre|zombie|zombies|occult|lovecraft|lovecraftian|haunted house|paranormal horror)\b|kinh dị|ma quái|trừ tà|ác quỷ|linh dị/i,
    },
    {
      genre: 'Historical Fiction',
      tag: 'Lịch sử',
      re: /\b(historical fiction|historical mystery|tudor|victorian|medieval|world war|wwii|wwi|16th century|17th century|18th century|19th century|regency|ancient rome|samurai|blitzkrieg|nazi)\b|tiểu thuyết lịch sử|lịch sử|triều đại|cổ đại/i,
    },
    {
      genre: 'Classic & Literary Fiction',
      tag: 'Văn học · Chữa lành',
      re: /\b(classic literature|classics|literary fiction|contemporary fiction|healing fiction|bookshop|pastry shop|convenience store|mind laundry|gutenberg|masterpiece|dostoevsky|tolstoy|austen|dickens|shakespeare|hemingway|orwell|kafka|murakami)\b|kinh điển|văn học cổ điển|kiệt tác|văn học đương đại|chữa lành/i,
    },
    {
      genre: 'Business & Finance',
      tag: 'Kinh doanh',
      re: /\b(business\s*&\s*economics|corporate finance|investing|stock market|entrepreneur|entrepreneurship|venture capital|macroeconomics|microeconomics|marketing strategy|business management)\b|kinh doanh|tài chính|đầu tư|khởi nghiệp|kinh tế học|quản trị doanh nghiệp/i,
    },
    {
      genre: 'Self-Help & Productivity',
      tag: 'Phát triển bản thân',
      re: /\b(self-help|self help|personal growth|habit formation|atomic habits|productivity|mindfulness|time management|self-improvement)\b|kỹ năng sống|phát triển bản thân|rèn luyện thói quen|hiệu suất|tự lực/i,
    },
    {
      genre: 'Psychology & Philosophy',
      tag: 'Tâm lý · Triết học',
      re: /\b(philosophy|stoicism|stoic|cognitive psychology|neuroscience|behavioral science|attachment theory|existentialism|metaphysics|epistemology|plato|socrates|aristotle|nietzsche|meditations|freud|jung)\b|tâm lý học|triết học|nhận thức luận|chủ nghĩa khắc kỷ/i,
      excludeIf: /\b(thriller|murder|serial killer|detective|homicide|inspector|domestic noir|crime fiction)\b/i,
    },
    {
      genre: 'History & Society',
      tag: 'Xã hội · Khảo cứu',
      re: /\b(social science|sociology|feminism|feminist|cultural studies|gender studies|anthropology|political science|social analysis|secret history|asexuality)\b|xã hội học|khảo cứu|văn hóa|nữ quyền|lịch sử xã hội/i,
      excludeIf: /\b(thriller|serial killer|detective|fantasy|magic)\b/i,
    },
    {
      genre: 'Science & Tech',
      tag: 'Khoa học · Công nghệ',
      re: /\b(astrophysics|quantum physics|evolutionary biology|cosmology|computer science|software engineering|programming|algorithms|genetics|popular science)\b|vật lý học|sinh học|lập trình|thuật toán|khoa học tự nhiên/i,
    },
    {
      genre: 'Biography & Memoir',
      tag: 'Tiểu sử · Hồi ký',
      re: /\b(biography|autobiography|memoir|memoirs|correspondence|letters from)\b|tiểu sử|tự truyện|hồi ký|nhật ký/i,
    },
    {
      genre: 'Light Novel & Manga',
      tag: 'Light Novel',
      re: /\b(light novel|isekai|manga|anime|shonen|seinen|manhwa)\b|light novel|tiểu thuyết nhẹ|chuyển sinh/i,
    },
    {
      genre: 'Young Adult',
      tag: 'Tuổi mới lớn',
      re: /\b(young adult|ya fiction|juvenile fiction|teen\s*&\s*young adult|coming-of-age|coming of age)\b|tuổi mới lớn|văn học tuổi teen|thanh xuân vườn trường/i,
    },
  ];

  // Comprehensive Multi-Paragraph Literary Genre Descriptions (Bilingual / Vietnamese)
  const GENRE_TAXONOMY_DESCRIPTIONS = {
    'Mystery & Detective':
      'Trinh thám & Điều tra (Mystery & Detective) là dòng văn học tôn vinh trí tuệ sắc bén, óc quan sát tinh tường và nghệ thuật suy luận logic trước những vụ án tưởng chừng không lời giải. Từ hiện trường khép kín đầy bí ẩn, những manh mối mong manh bị che giấu khéo léo cho đến quá khứ phức tạp của từng nghi phạm, mỗi trang sách đều mời gọi người đọc trực tiếp tham gia vào cuộc điều tra phá án cùng người thám tử.\n\nDòng sách này trải rộng từ trinh thám cổ điển (Whodunit), điều tra cảnh sát hiện đại (Police Procedural), pháp y hình sự (Forensic Mystery) cho tới trinh thám tâm lý Bắc Âu (Nordic Noir). Sức hút bền bỉ của thể loại nằm ở sự cân bằng hoàn hảo giữa những cú ngoặt bất ngờ (plot twists), bầu không khí căng thẳng và chiều sâu đạo đức đằng sau mỗi tội ác.',
    'Thriller & Suspense':
      'Giật gân & Hồi hộp (Thriller & Suspense) cuốn người đọc vào nhịp độ dồn dập nghẹt thở ngay từ những chương đầu tiên, nơi hiểm nguy luôn rình rập và thời gian đếm ngược từng giờ. Khác với trinh thám thuần giải đố, dòng sách Thriller đẩy nhân vật chính vào những tình thế ngàn cân treo sợi tóc — buộc họ phải chạy đua để ngăn chặn một âm mưu lớn, vạch trần kẻ phản bội hoặc bảo vệ mạng sống của những người thân yêu.\n\nThể loại này bao hàm nhiều nhánh đặc sắc như Giật gân tâm lý & Hôn nhân đen tối (Psychological Thriller & Domestic Noir), Tình báo – Điệp viên quốc tế (Espionage), Hành động – Tội phạm và Pháp đình. Những bí mật bị chôn vùi dưới vẻ ngoài hoàn hảo cùng sự đảo chiều liên tục khiến độc giả không thể rời mắt cho đến dòng cuối cùng.',
    'Sci-Fi':
      'Khoa học Viễn tưởng (Science Fiction / Sci-Fi) mở ra cánh cửa khám phá tương lai nhân loại, những nền văn minh ngoài vũ trụ bao la và giới hạn tận cùng của khoa học – công nghệ. Dựa trên nền tảng các giả thuyết vật lý, sinh học, trí tuệ nhân tạo (AI), du hành không gian – thời gian và kỹ thuật di truyền, Sci-Fi đặt ra câu hỏi lớn lao: Điều gì định nghĩa bản chất con người khi thế giới thay đổi hoàn toàn?\n\nTừ sử thi không gian hào hùng (Space Opera), thế giới hậu tận thế khắc nghiệt (Post-Apocalyptic & Dystopian) cho tới Cyberpunk gai góc, mỗi tác phẩm vừa là chuyến phiêu lưu kỳ vĩ vượt qua các vì sao, vừa là tấm gương phản chiếu sâu sắc xã hội hiện đại.',
    'Fantasy':
      'Kỳ ảo & Huyền huyễn (Fantasy) đưa người đọc bước qua ranh giới thực tại để tiến vào những thế giới nhiệm màu của phép thuật cổ xưa, thần thoại, rồng thiêng, các vương quốc huyền bí và những lời tiên tri định mệnh. Ở đó, trí tưởng tượng được giải phóng trọn vẹn qua hệ thống ma thuật độc đáo, lịch sử các chủng tộc và những cuộc hành trình anh hùng vượt qua bóng tối.\n\nBên cạnh dòng Epic Fantasy & Urban Fantasy phương Tây, thể loại này còn giao thoa với Hiện thực huyền ảo (Magical Realism), Cải biên cổ tích – thần thoại và Kiếm hiệp – Tiên hiệp phương Đông, nơi tình bạn, lòng quả cảm, sự hy sinh và khát vọng tự do luôn tỏa sáng rực rỡ.',
    'Romance':
      'Tình cảm & Lãng mạn (Romance) là bản giao hưởng của những rung động trái tim, sự đồng điệu tâm hồn và hành trình hai con người tìm thấy nhau giữa muôn vàn thử thách của cuộc đời. Với lối viết giàu cảm xúc, tinh tế trong từng ánh nhìn và đối thoại, thể loại này khắc họa trọn vẹn vẻ đẹp vừa ngọt ngào vừa mong manh của tình yêu đôi lứa.\n\nDù là chuyện tình thị trấn nhỏ ấm áp (Small-Town Cozy Romance), oan gia ngõ hẹp (Enemies to Lovers), cơ hội thứ hai sau tổn thương hay những mối tình khắc cốt ghi tâm vượt thời gian, dòng sách Romance luôn mang lại cảm giác ấm áp, chữa lành và niềm tin vào hạnh phúc.',
    'Horror':
      'Kinh dị & Siêu nhiên (Horror) đánh thức những nỗi sợ nguyên thủy sâu thẳm nhất trong tiềm thức con người — nơi bóng tối không chỉ ẩn náu trong những ngôi nhà bị nguyền rủa, thực thể tâm linh kỳ dị hay nghi thức trừ tà cổ xưa, mà còn len lỏi ngay trong tâm trí con người khi đối diện với cái chưa biết.\n\nKết hợp giữa bầu không khí u tối ngột ngạt (Gothic & Atmospheric Horror), yếu tố siêu nhiên rùng rợn và chiều sâu ẩn dụ xã hội, những tác phẩm kinh dị xuất sắc không chỉ khiến người đọc lạnh sống lưng mà còn để lại dư âm ám ảnh lâu dài về lòng dũng cảm và bản năng sinh tồn.',
    'Historical Fiction':
      'Tiểu thuyết Lịch sử (Historical Fiction) tái hiện sống động hơi thở của những thời đại đã lùi xa — từ các triều đại phong kiến đầy biến động, châu Âu thời Trung cổ & Phục hưng, nước Anh thời Tudor – Victoria cho tới khói lửa của hai cuộc Thế chiến. Qua lăng kính văn chương giàu tư liệu, quá khứ hiện lên không còn là những con số khô khan mà bằng máu thịt, khát vọng và số phận con người.\n\nSự hòa quyện giữa bối cảnh lịch sử chân thực với cốt truyện trinh thám, gián điệp hoặc bi kịch gia tộc giúp người đọc vừa đắm chìm trong một câu chuyện cuốn hút, vừa thấu hiểu sâu sắc văn hóa, phong tục và những bước ngoặt định hình thế giới.',
    'Classic & Literary Fiction':
      'Văn học Kinh điển & Đương đại (Classic & Literary Fiction) quy tụ những kiệt tác vượt thời gian của các đại văn hào thế giới cùng những tiểu thuyết văn chương đương đại giàu chất suy tư và chữa lành. Không chạy theo công thức giải trí đơn thuần, dòng sách này chăm chút từng câu chữ nghệ thuật, đi sâu khám phá vẻ đẹp bình dị đời thường, nỗi cô đơn đô thị và những góc khuất tinh tế nhất của tâm hồn.\n\nTừ các tác phẩm kinh điển bất hủ cho đến dòng văn học chữa lành Á Đông (những hiệu sách nhỏ, tiệm bánh đêm khuya, cửa hàng tiện lợi ven biển), mỗi cuốn sách là một khoảng lặng dịu dàng giúp người đọc lắng nghe và thấu cảm với chính mình.',
    'Classic Literature':
      'Văn học Kinh điển (Classic Literature) là kho tàng những kiệt tác văn chương vượt qua thử thách của hàng thế kỷ, kết tinh tư tưởng nhân văn sâu sắc và nghệ thuật ngôn từ bậc thầy của nhân loại. Mỗi tác phẩm mở ra bức tranh toàn cảnh về thời đại, phẩm giá con người, tình yêu, tham vọng và sự cứu rỗi.\n\nĐọc lại kinh điển ở mỗi giai đoạn cuộc đời luôn mang đến những tầng ý nghĩa mới mẻ, bồi đắp nền tảng thẩm mỹ và chiều sâu tri thức bền vững cho người yêu sách.',
    'Business & Finance':
      'Kinh doanh & Tài chính (Business & Finance) cung cấp hệ thống tư duy chiến lược, nguyên lý kinh tế học ứng dụng, nghệ thuật quản trị lãnh đạo và phương pháp đầu tư tài chính bền vững trong kỷ nguyên hiện đại. Thông qua các nghiên cứu tình huống thực tiễn và bài học thành bại của những tập đoàn lớn, dòng sách này giúp người đọc nhìn thấu quy luật vận hành của dòng tiền và thị trường.\n\nĐây là nguồn tham khảo thiết thực dành cho bất kỳ ai muốn nâng cao năng lực ra quyết định, khởi nghiệp thông minh và xây dựng tự do tài chính cá nhân.',
    'Self-Help & Productivity':
      'Phát triển Bản thân & Hiệu suất (Self-Help & Productivity) tập trung vào nghệ thuật kiến tạo thói quen tích cực, quản trị thời gian – năng lượng, rèn luyện sự tập trung sâu (Deep Work) và nuôi dưỡng tư duy cầu tiến. Thay vì những lời khuyên sáo rỗng, các tác phẩm tiêu biểu trong thể loại này kết hợp khoa học hành vi với lộ trình thực hành cụ thể từng bước nhỏ mỗi ngày.\n\nMỗi cuốn sách đóng vai trò như một người đồng hành thực tế, giúp bạn tháo gỡ trì hoãn, cân bằng cảm xúc và phát huy tối đa tiềm năng sẵn có.',
    'Psychology & Philosophy':
      'Tâm lý học & Triết học (Psychology & Philosophy) dẫn dắt người đọc đi sâu khám phá cơ chế vận hành kỳ diệu của tâm trí, khoa học gắn kết tình cảm, các thiên kiến nhận thức cũng như những câu hỏi nền tảng về đạo đức, tình bạn, tình yêu và ý nghĩa tồn tại. Từ đối thoại triết học cổ điển Hy Lạp, chủ nghĩa Khắc kỷ (Stoicism) cho đến tâm lý học thực nghiệm hiện đại, tri thức luôn gắn liền với nghệ thuật sống tỉnh thức.\n\nĐọc dòng sách này giúp mở rộng nhãn quan đa chiều, rèn luyện tư duy phản biện sắc sảo và tìm thấy sự điềm tĩnh vững vàng trước biến động ngoại cảnh.',
    'History & Society':
      'Lịch sử & Khảo cứu Xã hội (History & Society) tập hợp các công trình phi hư cấu sắc sảo phân tích văn hóa, biến chuyển xã hội, lịch sử tư tưởng, bình đẳng giới và những mối quan hệ con người trong thế giới hiện đại. Bằng lập luận chặt chẽ kết hợp tư liệu phong phú và những câu chuyện đời thực sống động, các tác giả bóc tách những định kiến quen thuộc để hé lộ góc nhìn sâu rộng hơn về cộng đồng quanh ta.\n\nĐây là dòng sách khơi gợi đối thoại trí tuệ, bồi đắp sự thấu cảm xã hội và giúp người đọc hiểu rõ cội nguồn của những xu hướng đương đại.',
    'Science & Tech':
      'Khoa học & Công nghệ (Science & Tech) giải mã những quy luật kỳ thú của vũ trụ, vật lý lượng tử, sinh học tiến hóa, y học hiện đại cùng cuộc cách mạng phần mềm và trí tuệ nhân tạo đang định hình tương lai thế giới. Với lối diễn giải mạch lạc, giàu hình ảnh dành cho đại chúng, những khái niệm khoa học phức tạp trở nên gần gũi và đầy cảm hứng khám phá.\n\nThể loại này nuôi dưỡng trí tò mò khoa học, tư duy duy lý dựa trên bằng chứng và cái nhìn toàn diện về hành trình tri thức của nhân loại.',
    'Biography & Memoir':
      'Tiểu sử & Hồi ký (Biography & Memoir) lưu giữ những lát cắt đời thực chân thành, xúc động về hành trình sống, lao động sáng tạo và vượt qua nghịch cảnh của các nhân vật lịch sử, nghệ sĩ, nhà tư tưởng lẫn những con người bình dị phi thường. Không có kịch bản hư cấu nào mạnh mẽ hơn chính sự thật được kể lại bằng trải nghiệm xương máu và sự chiêm nghiệm sâu lắng.\n\nTừng trang hồi ký truyền tải nguồn cảm hứng sống mãnh liệt, sự đồng cảm sâu sắc và những bài học quý giá rút ra từ chính cuộc đời thật.',
    'Light Novel & Manga':
      'Light Novel & Manga mang phong cách kể chuyện trẻ trung, giàu tính thị giác, nhịp điệu linh hoạt và trí tưởng tượng phóng khoáng đặc trưng của văn hóa đại chúng Nhật Bản – Á Đông. Từ những cuộc phiêu lưu chuyển sinh sang thế giới khác (Isekai), giả tưởng học đường cho tới trinh thám đời thường dí dỏm, thể loại này luôn tạo nên thế giới nhân vật sống động và giàu cá tính.\n\nSự kết hợp giữa cốt truyện lôi cuốn, hội thoại tự nhiên và cảm xúc trong trẻo giúp dòng sách này trở thành lựa chọn giải trí tuyệt vời sau những giờ làm việc căng thẳng.',
    'Young Adult':
      'Văn học Tuổi mới lớn (Young Adult / YA) khắc họa chân thực ngưỡng cửa trưởng thành đầy bão giông nhưng cũng rực rỡ ước mơ của tuổi trẻ — nơi những rung động đầu đời, tình bạn tri kỷ, nỗi chênh vênh định hình bản sắc cá nhân và lòng dũng cảm đối diện mất mát đan xen mãnh liệt.\n\nDù đặt trong bối cảnh hiện đại, học đường hay giả tưởng kịch tính, các tác phẩm YA luôn chạm tới trái tim người đọc ở mọi lứa tuổi nhờ sự chân thành, nồng nhiệt và khát vọng vươn tới ánh sáng.',
    'General Fiction':
      'Văn học Tổng hợp (General Fiction) bao gồm những câu chuyện đa sắc màu phản ánh muôn mặt đời sống xã hội, các mối quan hệ gia đình, tình bạn và hành trình nội tâm của con người hiện đại. Không bị giới hạn trong một khuôn mẫu thể loại cứng nhắc, mỗi cuốn sách mang một giọng điệu riêng biệt và giàu sức gợi.\n\nĐây là không gian dành cho những độc giả yêu thích sự tự do khám phá những miền cảm xúc mới mẻ qua từng trang viết.',
  };

  // Vietnamese aliases pointing to canonical essays
  const GENRE_VI_ALIASES = {
    'Trinh thám': 'Mystery & Detective',
    'Giật gân': 'Thriller & Suspense',
    'Khoa học VT': 'Sci-Fi',
    'Kỳ ảo': 'Fantasy',
    'Tình cảm': 'Romance',
    'Kinh dị': 'Horror',
    'Lịch sử': 'Historical Fiction',
    'Kinh điển': 'Classic Literature',
    'Văn học': 'Classic & Literary Fiction',
    'Kinh doanh': 'Business & Finance',
    'Phát triển bản thân': 'Self-Help & Productivity',
    'Tâm lý · Triết học': 'Psychology & Philosophy',
    'Xã hội · Khảo cứu': 'History & Society',
    'Khoa học · Công nghệ': 'Science & Tech',
    'Tiểu sử · Hồi ký': 'Biography & Memoir',
    'Light Novel': 'Light Novel & Manga',
    'Tuổi mới lớn': 'Young Adult',
  };

  function getGenreTaxonomyDescription(genreName, books = []) {
    const raw = String(genreName || '').trim();
    const safeBooks = Array.isArray(books) ? books : [];
    if (!raw) return 'Tuyển tập các tác phẩm đặc sắc được lưu trữ và phân loại trong thư viện cá nhân của bạn.';

    const mappedKey = GENRE_VI_ALIASES[raw] || raw;
    let baseEssay = GENRE_TAXONOMY_DESCRIPTIONS[mappedKey] || '';

    if (!baseEssay) {
      const lower = raw.toLowerCase();
      for (const [key, desc] of Object.entries(GENRE_TAXONOMY_DESCRIPTIONS)) {
        if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
          baseEssay = desc;
          break;
        }
      }
    }
    if (!baseEssay) {
      for (const rule of GENRE_RULES) {
        if (rule.genre.toLowerCase() === raw.toLowerCase() || rule.tag.toLowerCase() === raw.toLowerCase() || rule.re.test(raw)) {
          baseEssay = GENRE_TAXONOMY_DESCRIPTIONS[rule.genre] || '';
          if (baseEssay) break;
        }
      }
    }
    if (!baseEssay) {
      baseEssay =
        `${raw} là nhóm chủ đề quy tụ những tác phẩm mang phong cách, bối cảnh và cảm hứng nghệ thuật đặc trưng trong thư viện của bạn. Các đầu sách thuộc nhánh này mở ra những góc nhìn phong phú, kết hợp giữa chiều sâu nội dung và sức hấp dẫn riêng biệt của từng tác giả.\n\nViệc phân loại theo chủ đề ${raw} giúp bạn dễ dàng khám phá mạch đọc liền mạch, so sánh bút pháp giữa các nhà văn cùng dòng và nhanh chóng tìm thấy cuốn sách phù hợp nhất với tâm trạng hiện tại.`;
    }

    // Append rich personalized library insights paragraph if books are provided!
    if (safeBooks.length > 0) {
      const authorCounts = new Map();
      const seriesSet = new Set();
      for (const b of safeBooks) {
        if (b?.author && !isUnknownAuthor(b.author)) {
          authorCounts.set(b.author, (authorCounts.get(b.author) || 0) + 1);
        }
        if (b?.series) seriesSet.add(b.series);
      }
      const topAuthors = Array.from(authorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([a]) => a);
      const sampleTitles = safeBooks
        .slice(0, 4)
        .map((b) => b?.title)
        .filter(Boolean);

      const parts = [`Trong thư viện hiện tại của bạn có ${safeBooks.length} cuốn sách thuộc thể loại này`];
      if (seriesSet.size > 0) {
        parts[0] += ` (bao gồm ${seriesSet.size} bộ truyện dài kỳ)`;
      }
      parts[0] += '.';
      if (topAuthors.length > 0) {
        parts.push(`Các tác giả tiêu biểu góp mặt gồm: ${topAuthors.join(', ')}.`);
      }
      if (sampleTitles.length > 0) {
        parts.push(`Một số tựa sách nổi bật bạn có thể bắt đầu đọc ngay: "${sampleTitles.join('", "')}".`);
      }
      return `${baseEssay}\n\n${parts.join(' ')}`;
    }

    return baseEssay;
  }

  // Clean raw OPF subjects / Google Books categories into canonical genres (strictCanonical by default to avoid micro-genre clutter!)
  function normalizeSubjectsToGenres(subjectsRaw, { strictCanonical = true } = {}) {
    const list = Array.isArray(subjectsRaw) ? subjectsRaw : subjectsRaw ? [subjectsRaw] : [];
    const genres = [];
    const tags = [];
    const seenG = new Set();
    const seenT = new Set();

    const noisyRe =
      /\b(fiction|general|ebooks?|calibre|novel|books?|nonfiction|non-fiction|literature|general fiction|protected daisy|accessible book|in library|large type|open_syllabus|reading level|reviewed|award|bestseller|new york times|internet archive|overdrive|lending|translations? into|juvenile)\b|\(|\)|,\s*fiction$/i;

    const addGenre = (g) => {
      const clean = decodeEntities(String(g || '')).trim();
      if (!clean || clean.length < 2 || clean.length > 44) return;
      if (noisyRe.test(clean)) return;
      if (/^(FIC|NON|JUV|BIO|BUS|HIS|SCI)\d+/i.test(clean)) return;
      const key = clean.toLowerCase();
      if (!seenG.has(key)) {
        seenG.add(key);
        genres.push(clean);
      }
    };

    const addTag = (t) => {
      const clean = String(t || '').trim();
      if (!clean) return;
      const key = clean.toLowerCase();
      if (!seenT.has(key)) {
        seenT.add(key);
        tags.push(clean);
      }
    };

    // Map legacy/fine-grained subjects cleanly to canonical genres
    const subGenreMap = [
      { re: /\b(private investigator|cozy mystery|police procedural|amateur sleuth|crime)\b/i, genre: 'Mystery & Detective', tag: 'Trinh thám' },
      { re: /\b(domestic noir|psychological|espionage|action\s*&\s*adventure|tomb raiding)\b/i, genre: 'Thriller & Suspense', tag: 'Giật gân' },
      { re: /\b(post-apocalyptic|dystopian|space opera|cyberpunk)\b/i, genre: 'Sci-Fi', tag: 'Khoa học VT' },
      { re: /\b(magical realism|fairytale|mythological|urban fantasy|epic fantasy)\b/i, genre: 'Fantasy', tag: 'Kỳ ảo' },
      { re: /\b(literary|contemporary|baking|cuisine|cooking|food|bookshop|slice of life|humorous|satire)\b/i, genre: 'Classic & Literary Fiction', tag: 'Văn học · Chữa lành' },
      { re: /\b(history\s*&\s*social|social|sociology|feminism|cultural|essay|politics)\b/i, genre: 'History & Society', tag: 'Xã hội · Khảo cứu' },
    ];

    const fullSubjectStr = list.join(' ; ');

    for (const raw of list) {
      const txt = decodeEntities(String(raw || ''));
      if (!txt || txt.length > 90) continue;
      const parts = txt.split(/\s*[;/|]\s*/).map((s) => s.trim()).filter(Boolean);
      for (const part of parts) {
        if (/\b(new york times|bestseller|pulitzer|hugo award|nebula award|booker prize|nobel|award)\b/i.test(part)) {
          addTag('Nổi bật');
        }
        let matchedRule = false;
        for (const rule of GENRE_RULES) {
          if (rule.re.test(part) && !(rule.excludeIf && rule.excludeIf.test(fullSubjectStr))) {
            addGenre(rule.genre);
            addTag(rule.tag);
            matchedRule = true;
          }
        }
        if (!matchedRule) {
          for (const sm of subGenreMap) {
            if (sm.re.test(part)) {
              addGenre(sm.genre);
              addTag(sm.tag);
              matchedRule = true;
              break;
            }
          }
        }
        if (!strictCanonical && !matchedRule && part.length >= 3 && part.length <= 36) {
          addGenre(part);
        }
        if (genres.length >= 3) break;
      }
      if (genres.length >= 3) break;
    }

    return { genres, tags };
  }

  function detectLanguageTag(lang, title, description) {
    const l = String(lang || '').toLowerCase();
    const sample = `${title || ''} ${description || ''}`;
    const viChars = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i;
    if (l.startsWith('vi') || viChars.test(sample)) return 'Tiếng Việt';
    if (l.startsWith('en')) return 'Tiếng Anh';
    if (l.startsWith('ja') || /[\u3040-\u30ff]/.test(sample)) return 'Tiếng Nhật';
    if (l.startsWith('fr')) return 'Tiếng Pháp';
    if (l.startsWith('zh') || /[\u4e00-\u9fff]/.test(sample)) return 'Tiếng Trung';
    if (l.startsWith('ko') || /[\uac00-\ud7af]/.test(sample)) return 'Tiếng Hàn';
    if (l.startsWith('de')) return 'Tiếng Đức';
    if (/[a-zA-Z]{3,}/.test(sample)) return 'Tiếng Anh';
    return '';
  }

  function inferGenresAndTags({ title = '', author = '', description = '', subjects = [], series = '', language = '', size = 0 }) {
    const fromSub = normalizeSubjectsToGenres(subjects, { strictCanonical: true });
    const genres = [...fromSub.genres];
    const tags = [...fromSub.tags];
    const seenG = new Set(genres.map((g) => g.toLowerCase()));
    const seenT = new Set(tags.map((t) => t.toLowerCase()));

    const pushG = (g) => {
      const k = g.toLowerCase();
      if (!seenG.has(k) && genres.length < 3) {
        seenG.add(k);
        genres.push(g);
      }
    };
    const pushT = (t) => {
      const k = t.toLowerCase();
      if (t && !seenT.has(k) && tags.length < 6) {
        seenT.add(k);
        tags.push(t);
      }
    };

    const hay = `${title} ${author} ${series} ${description}`;
    for (const rule of GENRE_RULES) {
      if (rule.re.test(hay) && !(rule.excludeIf && rule.excludeIf.test(hay))) {
        pushG(rule.genre);
        pushT(rule.tag);
      }
    }

    if (/\bpsychological\s+(?:thriller|suspense)\b|\bdomestic\s+noir\b/i.test(hay)) {
      pushT('Tâm lý tội phạm');
    }

    if (genres.length === 0) {
      genres.push('Classic & Literary Fiction');
    }

    // Add useful smart discovery tags
    const langTag = detectLanguageTag(language, title, description);
    if (langTag) pushT(langTag);

    if (series) pushT('Theo bộ');
    if (/\b(bestseller|new york times|pulitzer|nobel|booker prize|hugo award|nebula award|award[- ]winning)\b|bán chạy|giải thưởng/i.test(hay)) {
      pushT('Nổi bật');
    }
    if (size > 0) {
      if (size < 280 * 1024) pushT('Đọc nhanh');
      else if (size > 2.2 * 1024 * 1024) pushT('Trường thiên');
    }

    return { genres: genres.slice(0, 3), tags: tags.slice(0, 6) };
  }

  // Cross-catalog intelligence: unify inverted 2-token author names ("Belle Kimberly" -> "Kimberly Belle")
  // and same-author series variants ("Detective Roger 'Sami' Kierce" -> "Sami Kierce", "The Sun Eater" -> "Sun Eater")!
  function unifyLibraryCatalog(books) {
    if (!Array.isArray(books) || books.length === 0) return books;

    // 1. Author frequency & token-set unification
    const authorCounts = new Map();
    for (const b of books) {
      const a = normalizeAuthor(b.author) || b.author || 'Unknown Author';
      b.author = a;
      if (!isUnknownAuthor(a) && !a.includes(',')) {
        authorCounts.set(a, (authorCounts.get(a) || 0) + 1);
      }
    }

    const tokenSignatureMap = new Map(); // sortedTokensKey -> bestAuthorName
    for (const [aName, count] of authorCounts.entries()) {
      const toks = normalizePersonTokens(aName);
      if (toks.length === 2) {
        const sig = [...toks].sort().join('|');
        const prev = tokenSignatureMap.get(sig);
        if (!prev || count > prev.count) {
          tokenSignatureMap.set(sig, { name: aName, count });
        }
      }
    }

    for (const b of books) {
      if (!b.author || b.author.includes(',')) continue;
      const toks = normalizePersonTokens(b.author);
      if (toks.length === 2) {
        const sig = [...toks].sort().join('|');
        const best = tokenSignatureMap.get(sig);
        if (best && best.name !== b.author && best.count > (authorCounts.get(b.author) || 0)) {
          b.author = best.name;
        }
      }
    }

    // 2. Same-author series variant unification (e.g. "Detective Roger 'Sami' Kierce" + "Sami Kierce" -> "Sami Kierce", "The Sun Eater" -> "Sun Eater")
    const simplifySeriesCore = (s) =>
      String(s || '')
        .toLowerCase()
        .replace(/^(?:the|a|an)\s+/i, '')
        .replace(/^(?:detective|inspector|agent|chief\s+inspector|di|dci|dr\.?|doctor)\s+/i, '')
        .replace(/['"‘’“”]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const byAuthorSeries = new Map(); // authorLower -> Map<seriesName, count>
    for (const b of books) {
      if (!b.series) continue;
      const cleaned = cleanSeriesName(b.series, b.author);
      if (!cleaned) {
        b.series = '';
        continue;
      }
      b.series = cleaned;
      const aKey = (b.author || '').toLowerCase();
      if (!byAuthorSeries.has(aKey)) byAuthorSeries.set(aKey, new Map());
      const sMap = byAuthorSeries.get(aKey);
      sMap.set(b.series, (sMap.get(b.series) || 0) + 1);
    }

    const seriesRemap = new Map(); // `${aKey}::${oldSeries}` -> canonicalSeries
    for (const [aKey, sMap] of byAuthorSeries.entries()) {
      const entries = Array.from(sMap.entries()); // [seriesName, count]
      if (entries.length < 2) continue;
      // Prefer higher count, or shorter clean name without leading "The " / middle nickname clutter
      entries.sort((x, y) => y[1] - x[1] || x[0].replace(/^the\s+/i, '').length - y[0].replace(/^the\s+/i, '').length);

      for (let i = 0; i < entries.length; i++) {
        const [candA] = entries[i];
        const coreA = simplifySeriesCore(candA);
        const toksA = coreA.split(' ').filter(Boolean);
        for (let j = i + 1; j < entries.length; j++) {
          const [candB] = entries[j];
          const keyB = `${aKey}::${candB}`;
          if (seriesRemap.has(keyB)) continue;
          const coreB = simplifySeriesCore(candB);
          const toksB = coreB.split(' ').filter(Boolean);

          // Exact match after stripping "The " or "Detective "
          if (coreA === coreB) {
            const preferred = /^the\s+/i.test(candA) && !/^the\s+/i.test(candB) ? candB : candA;
            seriesRemap.set(`${aKey}::${candA}`, preferred);
            seriesRemap.set(`${aKey}::${candB}`, preferred);
            continue;
          }

          // Subset token match for character names (at least 2 tokens, e.g. ["sami", "kierce"] subset of ["roger", "sami", "kierce"])
          const shorter = toksA.length <= toksB.length ? { name: candA, toks: toksA } : { name: candB, toks: toksB };
          const longer = toksA.length <= toksB.length ? { name: candB, toks: toksB } : { name: candA, toks: toksA };
          if (shorter.toks.length >= 2 && shorter.toks.every((t) => longer.toks.includes(t))) {
            seriesRemap.set(`${aKey}::${longer.name}`, shorter.name);
          }
        }
      }
    }

    for (const b of books) {
      if (!b.series) continue;
      const aKey = (b.author || '').toLowerCase();
      const mapped = seriesRemap.get(`${aKey}::${b.series}`);
      if (mapped) b.series = mapped;
    }

    return books;
  }

  // ==================== SMART INCREMENTAL UPDATE & STRICT ANTI-DUPLICATE ENGINE ====================
  function normalizeBookDedupTitle(rawTitle, rawSeries = '') {
    let t = decodeEntities(String(rawTitle || '')).trim();
    if (!t) return '';

    // Strip leading series prefix like "Alex Cross 27 - Criss Cross" or "Dream Harbor 2: The Cinnamon Bun..."
    if (rawSeries) {
      const escS = rawSeries.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      t = t.replace(new RegExp(`^(?:the\\s+)?${escS}\\s*#?\\d+(?:\\.\\d+)?\\s*[:_\\-–—]+\\s*`, 'i'), '');
    }
    t = t.replace(/^[A-Za-z][A-Za-z\s'.]{2,28}\s+\d{1,2}\s*[:_\-–—]+\s*(?=[A-Z])/i, '');

    // Strip parenthetical / bracketed series or edition suffixes
    t = t
      .replace(/\s*\([^)]*(?:#\d|book\s+\d|series|novel|mystery|thriller|edition|vol\.?\s*\d|z-lib|1lib)[^)]*\)/gi, '')
      .replace(/\s*\[[^\]]*\]/g, '')
      .replace(/\s*\(\d+\)\s*$/, '');

    // Strip subtitle after ":" or " _ " when it's an edition/series/marketing subtitle
    t = t.replace(
      /\s*(?::|_|—|–|\s-\s)\s*(?:a\s+[\w\s'’-]{0,32}(?:novel|mystery|thriller|story|suspense|romance)|[\w\s'’-]*edition|tiktok\s+made\s+me\s+buy\s+it.*|book\s+\d+.*)$/i,
      ''
    );

    return t
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '')
      .trim();
  }

  function normalizeBookDedupAuthor(rawAuthor) {
    const clean = normalizeAuthor(rawAuthor);
    if (!clean || isUnknownAuthor(clean)) return 'unknown';
    const primary = clean.split(',')[0].trim();
    const toks = normalizePersonTokens(primary);
    if (!toks.length) return primary.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'unknown';
    return [...toks].sort().join('_');
  }

  function normalizeEpubStem(fileName) {
    let s = String(fileName || '').replace(/\.epub$/i, '').trim();
    if (!s) return '';
    s = s
      .replace(/^_?oceanofpdf\.com_/i, '')
      .replace(/\s*\(z-library[^)]*\)/gi, '')
      .replace(/\s*--\s*[0-9a-f]{24,36}.*$/i, '')
      .replace(/\s*--\s*anna[’']?s\s*archive.*$/i, '')
      .replace(/\s*\(\d+\)\s*$/g, '')
      .replace(/(?:_|\s-\s)copy\s*$/i, '')
      .replace(/_\d{1,2}$/, '');
    return s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '')
      .trim();
  }

  function getBookDedupKeys(book = {}) {
    const keys = [];
    if (book.sha1 && typeof book.sha1 === 'string') {
      keys.push(`sha1:${book.sha1.toLowerCase()}`);
    }
    const normTitle = normalizeBookDedupTitle(book.title, book.series);
    const normAuthor = normalizeBookDedupAuthor(book.author);
    if (normTitle.length >= 2 && normAuthor !== 'unknown') {
      keys.push(`ta:${normTitle}::${normAuthor}`);
    } else if (normTitle.length >= 6) {
      keys.push(`to:${normTitle}`);
    }
    const stem = normalizeEpubStem(book.fileName || '');
    if (stem.length >= 6) {
      keys.push(`fn:${stem}`);
    }
    return keys;
  }

  function scoreBookQuality(b, preferredIds) {
    let score = 0;
    if (preferredIds && b.id && preferredIds.has(b.id)) score += 1000;
    if (b.isOffline) score += 200;
    if (b.hasCover || b.coverUrl || b.coverDisplayUrl) score += 50;
    if (b.goodreadsRating) score += 35;
    if ((b.description || '').length >= 160) score += 25;
    if (b.series && b.seriesIndex != null) score += 15;
    if (!/\(\d+\)\.epub$/i.test(b.fileName || '') && !/_\d\.epub$/i.test(b.fileName || '')) score += 12;
    return score;
  }

  function mergeDuplicateMetadataIntoWinner(winner, loser) {
    if (!winner || !loser) return winner;
    if ((!winner.description || winner.description.length < 80) && loser.description && loser.description.length > (winner.description || '').length) {
      winner.description = loser.description;
      if (loser.descSource) winner.descSource = loser.descSource;
    }
    if (!winner.goodreadsRating && loser.goodreadsRating) {
      winner.goodreadsRating = loser.goodreadsRating;
    }
    if (!winner.goodreadsUrl && loser.goodreadsUrl) {
      winner.goodreadsUrl = loser.goodreadsUrl;
    }
    if (!winner.series && loser.series) {
      winner.series = loser.series;
    }
    if (winner.seriesIndex == null && loser.seriesIndex != null) {
      winner.seriesIndex = loser.seriesIndex;
    }
    return winner;
  }

  function deduplicateBooksCatalog(books, preferredIds = new Set()) {
    if (!Array.isArray(books) || books.length <= 1) {
      return { books: Array.isArray(books) ? books : [], removedCount: 0, aliasMap: new Map() };
    }

    const prefSet = preferredIds instanceof Set ? preferredIds : new Set(preferredIds || []);
    // Sort highest quality first so the strongest edition wins naturally
    const sorted = [...books].sort((a, b) => {
      const diff = scoreBookQuality(b, prefSet) - scoreBookQuality(a, prefSet);
      if (diff !== 0) return diff;
      return (b.size || 0) - (a.size || 0);
    });

    const keyToWinner = new Map();
    const uniqueBooks = [];
    const aliasMap = new Map();
    let removedCount = 0;

    for (const book of sorted) {
      const keys = getBookDedupKeys(book);
      let matchedWinner = null;
      for (const k of keys) {
        if (keyToWinner.has(k)) {
          matchedWinner = keyToWinner.get(k);
          break;
        }
      }

      if (matchedWinner) {
        removedCount++;
        mergeDuplicateMetadataIntoWinner(matchedWinner, book);
        if (book.id && matchedWinner.id && book.id !== matchedWinner.id) {
          aliasMap.set(book.id, matchedWinner.id);
        }
        // Register all keys of loser to winner as well
        for (const k of keys) {
          if (!keyToWinner.has(k)) keyToWinner.set(k, matchedWinner);
        }
      } else {
        uniqueBooks.push(book);
        for (const k of keys) {
          keyToWinner.set(k, book);
        }
      }
    }

    return { books: uniqueBooks, removedCount, aliasMap };
  }

  function buildCatalogDedupIndex(catalogBooks = []) {
    const map = new Map();
    for (const b of catalogBooks || []) {
      for (const k of getBookDedupKeys(b)) {
        if (!map.has(k)) map.set(k, b);
      }
    }
    return map;
  }

  function isBookDuplicateOfCatalog(candidate, catalogOrIndex) {
    const idx = catalogOrIndex instanceof Map ? catalogOrIndex : buildCatalogDedupIndex(catalogOrIndex);
    const keys = getBookDedupKeys(candidate);
    for (const k of keys) {
      if (idx.has(k)) {
        return { duplicate: true, matchedBook: idx.get(k), matchedKey: k };
      }
    }
    return { duplicate: false, matchedBook: null, matchedKey: '' };
  }

  function analyzeBookMetadata(raw = {}) {
    const fileFallback = parseFilenameMeta(raw.fileName || '');

    let title = decodeEntities(String(raw.title || '')).trim();
    if (!title || /^untitled$/i.test(title) || /^unknown$/i.test(title)) {
      title = fileFallback.title;
    }

    let author = normalizeAuthor(raw.author);
    if (isUnknownAuthor(author)) {
      author = fileFallback.author;
    }

    const description = decodeEntities(String(raw.description || '')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    let series = cleanSeriesName(raw.series || '', author);
    let seriesIndex = raw.seriesIndex != null && !Number.isNaN(Number(raw.seriesIndex)) ? Number(raw.seriesIndex) : null;

    // If raw.series was rejected because it equaled the author name, clear bogus seriesIndex unless confirmed by real series
    if (raw.series && !series) {
      seriesIndex = fileFallback.series && !isSeriesSameAsAuthor(fileFallback.series, author) ? fileFallback.seriesIndex : null;
    }

    if (!series) {
      const extracted = extractSeriesFromText(title, raw.fileName || '', description, author);
      if (extracted.series) {
        series = extracted.series;
        seriesIndex = seriesIndex ?? extracted.seriesIndex;
        title = extracted.cleanTitle;
      } else if (fileFallback.series && !isSeriesSameAsAuthor(fileFallback.series, author)) {
        series = cleanSeriesName(fileFallback.series, author);
        seriesIndex = seriesIndex ?? fileFallback.seriesIndex;
      }
    } else if (seriesIndex == null) {
      const extracted = extractSeriesFromText(title, raw.fileName || '', description, author);
      if (extracted.seriesIndex != null) seriesIndex = extracted.seriesIndex;
      else if (fileFallback.seriesIndex != null) seriesIndex = fileFallback.seriesIndex;
    }

    if (series && isSeriesSameAsAuthor(series, author)) {
      series = '';
    }

    const subjects = Array.isArray(raw.subjects) ? raw.subjects : Array.isArray(raw.genres) ? raw.genres : [];
    const { genres, tags } = inferGenresAndTags({
      title,
      author,
      description,
      subjects,
      series,
      language: raw.language || '',
      size: Number(raw.size) || 0,
    });

    return {
      title,
      author: author || 'Unknown Author',
      series,
      seriesIndex,
      genres,
      tags,
      description,
      language: (raw.language || (tags.includes('Tiếng Việt') ? 'vi' : 'en')).slice(0, 12).toLowerCase(),
    };
  }

  async function fetchJsonWithTimeout(url, timeoutMs = 4500) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
    try {
      const res = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
      if (!res.ok) return null;
      return await res.json();
    } catch (_) {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function titleMatchesBook(candidateTitle, targetTitle) {
    const norm = (s) =>
      decodeEntities(String(s || ''))
        .toLowerCase()
        .replace(/[^a-z0-9\u00c0-\u024f\u1e00-\u1eff\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const c = norm(candidateTitle);
    const t = norm(targetTitle);
    if (!c || !t) return false;
    return c === t || c.startsWith(`${t} `) || t.startsWith(`${c} `);
  }

  // Online Auto-Enrichment (Goodreads via PC Server first, fallback to Apple Books + Open Library + Google Books)
  async function enrichBookOnline(book, options = {}) {
    const base = analyzeBookMetadata({
      title: book.title,
      author: book.author,
      fileName: book.fileName,
      description: book.description,
      series: book.series,
      seriesIndex: book.seriesIndex,
      subjects: book.genres,
      language: book.language,
      size: book.size,
    });

    // 0. Try Goodreads via PaperInk Server API if reachable
    if (options.serverBase !== false) {
      try {
        const prefix = typeof options.serverBase === 'string' && options.serverBase ? options.serverBase.replace(/\/+$/, '') : '.';
        const grParams = new URLSearchParams({
          title: base.title || book.title || '',
          author: base.author || book.author || '',
          bookId: book.id || '',
          force: options.force ? '1' : '0',
        });
        const grRes = await fetchJsonWithTimeout(`${prefix}/api/goodreads/book?${grParams.toString()}`, 9500);
        if (grRes?.ok && grRes.result) {
          const gr = grRes.result;
          const grAuthor = (!isUnknownAuthor(base.author) ? base.author : normalizeAuthor(gr.author)) || 'Unknown Author';
          const grSeries = cleanSeriesName(gr.series || base.series || '', grAuthor);
          const grIdx = gr.seriesIndex ?? base.seriesIndex ?? null;
          const grDesc = (gr.description && gr.description.length >= 60 ? gr.description : base.description) || '';
          const { genres, tags } = inferGenresAndTags({
            title: base.title,
            author: grAuthor,
            description: grDesc,
            subjects: [...(gr.genres || []), ...(base.genres || [])],
            series: grSeries,
            language: base.language,
            size: book.size || 0,
          });
          if (grDesc.length >= 60 || gr.goodreadsUrl) {
            return {
              title: base.title,
              author: grAuthor,
              series: grSeries,
              seriesIndex: grIdx,
              genres: gr.genres?.length ? gr.genres : genres,
              tags,
              description: grDesc,
              goodreadsRating: gr.goodreadsRating || null,
              goodreadsUrl: gr.goodreadsUrl || null,
              descSource: gr.source || 'goodreads',
              language: base.language || 'en',
              enrichedOnline: true,
            };
          }
        }
      } catch (_) {}
    }

    const queryTitle = (base.title || '').replace(/\s*[:(\[].*$/, '').trim();
    if (!queryTitle || queryTitle.length < 2) return base;

    const hasRealAuthor = !isUnknownAuthor(base.author);
    const primaryAuthor = hasRealAuthor ? base.author.split(',')[0].trim() : '';
    const gbQ = hasRealAuthor ? `intitle:${queryTitle} inauthor:${primaryAuthor}` : `intitle:${queryTitle}`;
    const appleTerm = hasRealAuthor ? `${queryTitle} ${primaryAuthor}` : queryTitle;

    const [gbData, olData, appleEbookData, appleAudioData] = await Promise.all([
      fetchJsonWithTimeout(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(gbQ)}&maxResults=3`, 4500),
      fetchJsonWithTimeout(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(queryTitle)}${
          hasRealAuthor ? `&author=${encodeURIComponent(primaryAuthor)}` : ''
        }&limit=3&fields=title,author_name,subject,first_sentence`,
        4500
      ),
      fetchJsonWithTimeout(
        `https://itunes.apple.com/search?media=ebook&entity=ebook&limit=5&term=${encodeURIComponent(appleTerm)}`,
        4500
      ),
      fetchJsonWithTimeout(
        `https://itunes.apple.com/search?media=audiobook&entity=audiobook&limit=5&term=${encodeURIComponent(appleTerm)}`,
        4500
      ),
    ]);

    const extraSubjects = [...(base.genres || [])];
    let author = base.author;
    let description = base.description;
    let series = base.series;
    let seriesIndex = base.seriesIndex;
    let language = base.language;

    // 1. Merge Google Books hit
    const gbVol = gbData?.items?.[0]?.volumeInfo;
    if (gbVol) {
      if (isUnknownAuthor(author) && Array.isArray(gbVol.authors) && gbVol.authors.length) {
        author = normalizeAuthor(gbVol.authors);
      }
      if (Array.isArray(gbVol.categories)) {
        extraSubjects.push(...gbVol.categories);
      }
      if ((!description || description.length < 40) && gbVol.description) {
        description = decodeEntities(gbVol.description).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1200);
      }
      if (!series && gbVol.seriesInfo?.volumeSeries?.[0]?.seriesBookType) {
        const disp = gbVol.seriesInfo.bookDisplayNumber;
        if (disp && seriesIndex == null && !Number.isNaN(parseFloat(disp))) {
          seriesIndex = parseFloat(disp);
        }
      }
      if (!series && gbVol.subtitle) {
        const fromSub = extractSeriesFromText(`${gbVol.title || ''}: ${gbVol.subtitle}`, '', gbVol.description || '', author);
        if (fromSub.series) {
          series = fromSub.series;
          seriesIndex = seriesIndex ?? fromSub.seriesIndex;
        }
      }
      if (gbVol.language && !language) language = gbVol.language;
    }

    // 2. Merge Apple Books eBook + Audiobook hits (CORS *, fast, rich series & book number titles!)
    const appleEbooks = Array.isArray(appleEbookData?.results) ? appleEbookData.results : [];
    const appleAudios = Array.isArray(appleAudioData?.results) ? appleAudioData.results : [];
    const matchedEbook = appleEbooks.find(
      (it) =>
        titleMatchesBook(it.trackName, queryTitle) &&
        !/\b(summary|analysis|conversation starters|study guide)\b/i.test(it.trackName || '')
    );
    if (matchedEbook) {
      if (isUnknownAuthor(author) && matchedEbook.artistName) {
        author = normalizeAuthor(matchedEbook.artistName);
      }
      if (Array.isArray(matchedEbook.genres)) {
        extraSubjects.push(...matchedEbook.genres);
      }
      if ((!description || description.length < 40) && matchedEbook.description) {
        description = decodeEntities(matchedEbook.description)
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 1200);
      }
    }

    // Inspect matching Apple eBook & Audiobook titles for explicit series + book index!
    // e.g. "36 Hours: Detective Kim Stone, Book 21 (Unabridged)" or "The Fourth Monkey (4MK)" or "The Enemy: A Jack Reacher Novel"
    if (!series || seriesIndex == null) {
      const candidateTitles = [
        ...appleAudios.map((a) => a.collectionName || ''),
        ...appleEbooks.map((e) => e.trackName || ''),
      ].filter((t) => titleMatchesBook(t, queryTitle));

      for (const rawCand of candidateTitles) {
        const cleanedCand = decodeEntities(rawCand)
          .replace(/\s*\((?:unabridged|abridged)\)\s*/gi, '')
          .replace(/\s+by\s+[A-Z][\w\s.'-]+(?::\s*(?:summary|conversation starters|book analysis).*)?$/i, '')
          .trim();
        const ext = extractSeriesFromText(cleanedCand, '', '', author);
        if (ext.series && !series) {
          series = ext.series;
        }
        if (ext.seriesIndex != null && seriesIndex == null) {
          seriesIndex = ext.seriesIndex;
        }
        // Also check trailing short paren like "The Fourth Monkey (4MK)" or "A Curious Beginning (Veronica Speedwell Mysteries)"
        if (!series) {
          const parenOnly = cleanedCand.match(/\(([^()]{2,48})\)\s*$/);
          if (parenOnly) {
            const candS = cleanSeriesName(parenOnly[1], author);
            if (candS && !titleMatchesBook(candS, queryTitle)) {
              series = candS;
            }
          }
        }
        if (series && seriesIndex != null) break;
      }
    }

    // 3. Merge Open Library hit (extract canonical genres/tags only so LoC headings don't pollute genres)
    const olDoc = olData?.docs?.[0];
    let olExtraTags = [];
    if (olDoc) {
      if (isUnknownAuthor(author) && Array.isArray(olDoc.author_name) && olDoc.author_name.length) {
        author = normalizeAuthor(olDoc.author_name);
      }
      if (Array.isArray(olDoc.subject)) {
        const fromOl = normalizeSubjectsToGenres(olDoc.subject.slice(0, 24), { strictCanonical: true });
        extraSubjects.push(...fromOl.genres);
        olExtraTags = fromOl.tags;
      }
    }

    // Re-run series detection if description got enriched!
    if ((!series || seriesIndex == null) && description) {
      const fromDesc = extractSeriesFromText('', '', description, author);
      if (!series && fromDesc.series) {
        series = fromDesc.series;
      }
      if (seriesIndex == null && fromDesc.seriesIndex != null) {
        seriesIndex = fromDesc.seriesIndex;
      }
    }

    // If online lookup found a real series and filename had an explicit book number (e.g. "Lee Child 08 The Enemy.epub"), preserve that book number!
    if (series && seriesIndex == null && book.fileName) {
      const fnParsed = parseFilenameMeta(book.fileName);
      if (fnParsed.seriesIndex != null) {
        seriesIndex = fnParsed.seriesIndex;
      }
    }

    // Final strict author-vs-series guard!
    if (series) {
      series = cleanSeriesName(series, author);
    }

    const { genres, tags } = inferGenresAndTags({
      title: base.title,
      author,
      description,
      subjects: extraSubjects,
      series,
      language,
      size: book.size || 0,
    });
    const mergedTags = [...tags];
    for (const t of olExtraTags) {
      if (mergedTags.length < 6 && !mergedTags.some((x) => x.toLowerCase() === t.toLowerCase())) {
        mergedTags.push(t);
      }
    }

    return {
      title: base.title,
      author: author || 'Unknown Author',
      series,
      seriesIndex,
      genres,
      tags: mergedTags,
      description,
      language: language || base.language || 'en',
      enrichedOnline: Boolean(gbVol || olDoc || matchedEbook || appleAudios.length),
    };
  }

  function synthesizeSeriesOverview(seriesName, books = []) {
    const safeBooks = Array.isArray(books) ? [...books] : [];
    safeBooks.sort((a, b) => (a.seriesIndex ?? 9999) - (b.seriesIndex ?? 9999));

    const primaryAuthor =
      safeBooks.map((b) => b.author).find((a) => a && !isUnknownAuthor(a)) || 'Unknown Author';

    const genreFreq = new Map();
    const tagFreq = new Map();
    for (const b of safeBooks) {
      for (const g of b.genres || []) {
        if (!g || g === 'General Fiction') continue;
        genreFreq.set(g, (genreFreq.get(g) || 0) + 1);
      }
      for (const t of b.tags || []) {
        if (!t) continue;
        tagFreq.set(t, (tagFreq.get(t) || 0) + 1);
      }
    }

    const firstWithDesc = safeBooks.find((b) => b.description && b.description.trim().length >= 30);
    const combinedText = `${seriesName} ${safeBooks.map((b) => `${b.title || ''} ${b.description || ''}`).slice(0, 5).join(' ')}`;
    const inferred = inferGenresAndTags({
      title: seriesName,
      author: primaryAuthor,
      description: combinedText,
      subjects: Array.from(genreFreq.keys()),
      series: seriesName,
      language: safeBooks[0]?.language || '',
      size: 0,
    });

    let genres = Array.from(genreFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([g]) => g)
      .slice(0, 4);
    for (const ig of inferred.genres) {
      if (genres.length >= 4) break;
      if (ig !== 'General Fiction' && !genres.some((x) => x.toLowerCase() === ig.toLowerCase())) {
        genres.push(ig);
      }
    }
    if (!genres.length) genres = inferred.genres.length ? inferred.genres : ['General Fiction'];

    let tags = Array.from(tagFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t)
      .filter((t) => t !== 'Đọc nhanh' && t !== 'Trường thiên')
      .slice(0, 6);
    if (!tags.includes('Theo bộ')) tags.unshift('Theo bộ');
    for (const it of inferred.tags) {
      if (tags.length >= 6) break;
      if (!tags.some((x) => x.toLowerCase() === it.toLowerCase())) tags.push(it);
    }
    tags = tags.slice(0, 6);

    const isVi = /[ăâđêôơưàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/i.test(seriesName) || tags.includes('Tiếng Việt');
    let description = '';
    if (isVi) {
      const viGenreTag = tags.find(
        (t) => !['Theo bộ', 'Tiếng Anh', 'Tiếng Việt', 'Tiếng Nhật', 'Tiếng Trung', 'Tiếng Pháp', 'Tiếng Hàn', 'Tiếng Đức', 'Nổi bật', 'Đọc nhanh', 'Trường thiên'].includes(t)
      );
      const authorClause = !isUnknownAuthor(primaryAuthor) ? ` của tác giả ${primaryAuthor}` : '';
      const genreClause = viGenreTag ? ` thuộc thể loại ${viGenreTag.toLowerCase()}` : '';
      const introLine = `${seriesName} là bộ truyện${genreClause}${authorClause} (gồm ${safeBooks.length} cuốn trong thư viện của bạn).`;
      description = introLine;
      if (firstWithDesc) {
        const snippet = firstWithDesc.description.trim().slice(0, 520);
        const bookLabel =
          firstWithDesc.seriesIndex != null
            ? `Tập #${firstWithDesc.seriesIndex} (${firstWithDesc.title})`
            : firstWithDesc.title;
        description = `${introLine}\n\nNội dung mở đầu — ${bookLabel}: ${snippet}`;
      }
    } else {
      const genreStr = genres.filter((g) => g !== 'General Fiction').slice(0, 2).join(' and ') || 'acclaimed';
      const authorClause = !isUnknownAuthor(primaryAuthor) ? ` written by ${primaryAuthor}` : '';
      const introLine = `${seriesName} is a ${genreStr} series${authorClause}.`;
      description = introLine;
      if (firstWithDesc) {
        const snippet = firstWithDesc.description.trim().slice(0, 520);
        description = `${introLine}\n\n${snippet}`;
      }
    }

    return {
      series: seriesName,
      name: seriesName,
      author: primaryAuthor,
      genres,
      tags,
      description,
    };
  }

  async function enrichSeriesOnline(seriesName, books = [], options = {}) {
    const base = synthesizeSeriesOverview(seriesName, books);
    const cleanName = String(seriesName || '').trim();
    if (!cleanName) return { ...base, enrichedOnline: false };

    // 0. Try Goodreads Series endpoint via PaperInk Server first
    if (options.serverBase !== false) {
      try {
        const prefix = typeof options.serverBase === 'string' && options.serverBase ? options.serverBase.replace(/\/+$/, '') : '.';
        const grParams = new URLSearchParams({
          series: cleanName,
          author: !isUnknownAuthor(base.author) ? base.author : '',
          force: options.force ? '1' : '0',
        });
        const grRes = await fetchJsonWithTimeout(`${prefix}/api/goodreads/series?${grParams.toString()}`, 10500);
        if (grRes?.ok && grRes.result?.description) {
          const gr = grRes.result;
          return {
            series: cleanName,
            name: cleanName,
            author: gr.author || base.author,
            subtitle: gr.subtitle || '',
            seriesUrl: gr.seriesUrl || '',
            genres: Array.isArray(gr.genres) && gr.genres.length ? gr.genres : base.genres,
            tags: Array.isArray(gr.tags) && gr.tags.length ? gr.tags : base.tags,
            description: gr.description,
            source: gr.source || 'goodreads',
            enrichedOnline: true,
          };
        }
      } catch (_) {}
    }

    const isVi = /[ăâđêôơưàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/i.test(cleanName) || base.tags.includes('Tiếng Việt');
    const authorLast = !isUnknownAuthor(base.author)
      ? base.author.split(',')[0].trim().split(/\s+/).pop().toLowerCase()
      : '';

    const wikiCandidates = isVi
      ? [
          `https://vi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName.replace(/\s+/g, '_'))}`,
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(`${cleanName} (book series)`.replace(/\s+/g, '_'))}`,
        ]
      : [
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(`${cleanName} (book series)`.replace(/\s+/g, '_'))}`,
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(`${cleanName} (novel series)`.replace(/\s+/g, '_'))}`,
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName.replace(/\s+/g, '_'))}`,
        ];

    const firstBook = [...(books || [])].sort((a, b) => (a.seriesIndex ?? 9999) - (b.seriesIndex ?? 9999))[0];
    const appleQuery = firstBook
      ? `${firstBook.title} ${!isUnknownAuthor(base.author) ? base.author.split(',')[0] : cleanName}`
      : `${cleanName} ${!isUnknownAuthor(base.author) ? base.author.split(',')[0] : ''}`;

    const [wikiResults, appleData] = await Promise.all([
      Promise.all(wikiCandidates.map((u) => fetchJsonWithTimeout(u, 4200))),
      fetchJsonWithTimeout(
        `https://itunes.apple.com/search?media=ebook&entity=ebook&limit=4&term=${encodeURIComponent(appleQuery.trim())}`,
        4200
      ),
    ]);

    let wikiExtract = '';
    for (const w of wikiResults) {
      if (!w || w.type === 'disambiguation' || !w.extract || w.extract.length < 50) continue;
      const hay = `${w.description || ''} ${w.extract}`.toLowerCase();
      const looksBookRelated =
        /\b(novel|novels|book|series|fictional|detective|character|author|writer|thriller|mystery|fantasy|trilogy|saga)\b|tiểu thuyết|truyện|nhân vật|tác giả/i.test(
          hay
        ) || (authorLast && authorLast.length >= 3 && hay.includes(authorLast));
      if (looksBookRelated) {
        wikiExtract = w.extract.trim().slice(0, 950);
        break;
      }
    }

    const extraSubjects = [...base.genres];
    let appleDesc = '';
    const appleItems = Array.isArray(appleData?.results) ? appleData.results : [];
    for (const item of appleItems) {
      if (Array.isArray(item.genres)) extraSubjects.push(...item.genres);
      if (!appleDesc && item.description) {
        appleDesc = decodeEntities(item.description)
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 700);
      }
    }

    const finalDescription = wikiExtract || (appleDesc ? `${base.description.split('\n\n')[0]}\n\n${appleDesc}` : base.description);
    const { genres, tags } = inferGenresAndTags({
      title: cleanName,
      author: base.author,
      description: `${finalDescription} ${base.description}`,
      subjects: extraSubjects,
      series: cleanName,
      language: isVi ? 'vi' : 'en',
      size: 0,
    });

    const finalTags = [...tags];
    if (!finalTags.includes('Theo bộ')) finalTags.unshift('Theo bộ');

    return {
      series: cleanName,
      name: cleanName,
      author: base.author,
      genres: genres.length ? genres : base.genres,
      tags: finalTags.slice(0, 6),
      description: finalDescription,
      enrichedOnline: Boolean(wikiExtract || appleDesc),
    };
  }

  return {
    normalizeAuthor,
    isSeriesSameAsAuthor,
    cleanSeriesName,
    parseFilenameMeta,
    extractSeriesFromText,
    inferGenresAndTags,
    analyzeBookMetadata,
    enrichBookOnline,
    synthesizeSeriesOverview,
    enrichSeriesOnline,
    getGenreTaxonomyDescription,
    GENRE_TAXONOMY_DESCRIPTIONS,
    unifyLibraryCatalog,
    normalizeBookDedupTitle,
    normalizeBookDedupAuthor,
    normalizeEpubStem,
    getBookDedupKeys,
    deduplicateBooksCatalog,
    buildCatalogDedupIndex,
    isBookDuplicateOfCatalog,
  };
});
