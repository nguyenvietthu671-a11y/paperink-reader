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

  function normalizeSingleAuthor(raw) {
    let n = decodeEntities(String(raw || ''))
      .replace(/^\s*by\s+/i, '')
      .replace(/\s*\((?:author|translator|editor|illustrator|biên dịch|dịch giả)\)\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!n) return '';
    // Flip "Last, First" -> "First Last" when there is exactly one comma and no corporate suffixes
    if (/^[^,]{2,34},\s*[^,]{2,34}$/.test(n) && !/\b(jr\.?|sr\.?|iii|ii|phd|md|inc\.?|ltd\.?)\b/i.test(n)) {
      const [last, first] = n.split(',').map((s) => s.trim());
      if (first && last && !/\d/.test(first) && !/\d/.test(last)) {
        n = `${first} ${last}`;
      }
    }
    // Normalize initials like "C.J. Sansom" -> "C. J. Sansom"
    n = n.replace(/\b([A-Z])\.([A-Z])\./g, '$1. $2.');
    return n.trim();
  }

  function normalizeAuthor(raw) {
    if (!raw) return '';
    const arr = Array.isArray(raw) ? raw : String(raw).split(/\s*(?:;|&\s+(?=[A-Z])|\band\b(?=\s+[A-Z]))\s*/);
    const out = [];
    const seen = new Set();
    for (const part of arr) {
      const clean = normalizeSingleAuthor(part);
      if (clean && !isUnknownAuthor(clean)) {
        const key = clean.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          out.push(clean);
        }
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
      .replace(/^(?:an?\s+)(?=[A-Z0-9])/i, '')
      .replace(/\s*(?:crime\s+thriller|psychological\s+thriller|detective\s+series|mystery\s+series|thriller\s+series)\s*$/i, '')
      .replace(/\s*(?:series|trilogy|saga|chronicles?|novels?|books?|mysteries|investigations?|adventures?|files|cases)\s*$/i, (m) =>
        /trilogy|saga|chronicles?/i.test(m) ? m : ''
      )
      .replace(/^(.{4,}?)\s+(?:mystery|thriller)\s*$/i, (_, baseName) =>
        /^[A-Z0-9]{2,4}$/.test(baseName.trim()) ? `${baseName.trim()} Thriller` : baseName
      )
      .replace(/\s*(?:tập|quyển|phần|vol\.?|volume|part|bk\.?)\s*$/i, '')
      .replace(/^[\s\-–—:,#•_]+|[\s\-–—:,#•_]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (author) {
      s = stripAuthorPrefixFromSeries(s, author);
    }
    if (!s || s.length < 2 || s.length > 68 || /^\d+$/.test(s)) return '';
    if (
      /^(edition|first edition|version|unabridged|abridged|illustrated|annotated|retail|epub|pdf|kindle|z-lib|z-library|oceanofpdf|calibre|none|novel|a novel|a thriller|a mystery|short story|tập|quyển|phần|book|vol\.?|volume|part|bestseller|new york times)$/i.test(
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
          // Avoid false positive years like "(1984)" or "(2023)" unless explicitly prefixed with #/Book
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

    // Pattern: "(A Sherlock Holmes Novel)" or ": A Jack Reacher Novel" in title (guarded against Author Name!)
    if (!series && cleanTitle) {
      const novelOfRe =
        /(?:\s*[\(\[]\s*|\s*[:\-–—_]\s*)(?:an?\s+)?([A-Z0-9][\w\s'&.-]{2,44}?)\s+(?:novel|mystery|mysteries|thriller|adventure|story|case|chronicle|trilogy)\s*[\)\]]?$/i;
      const m = cleanTitle.match(novelOfRe);
      if (m) {
        const cand = cleanSeriesName(m[1], author);
        if (cand) {
          series = cand;
          const stripped = cleanTitle.slice(0, m.index).replace(/\s+/g, ' ').trim();
          if (stripped.length >= 2) cleanTitle = stripped;
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

    // Pattern in description: "Book One of the Kingkiller Chronicle", "first in the 4MK Thriller series"
    if (!series && description) {
      const descPatterns = [
        {
          re: /\b(?:book|volume|novel|installment|part)\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:of|in)\s+(?:the\s+)?([A-Z0-9][A-Za-z0-9'\s&-]{2,48}?)\s+(?:series|trilogy|saga|quartet|cycle)\b/i,
          idxGroup: 1,
          serGroup: 2,
        },
        {
          re: /\b(?:book|volume|novel|installment|part)\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:of|in)\s+(?:the\s+)?([A-Z0-9][A-Za-z0-9'\s&-]{2,48}?\s+chronicles?)\b/i,
          idxGroup: 1,
          serGroup: 2,
        },
        {
          re: /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th))\s+(?:(?:book|novel|installment|thriller|mystery)\s+)?in\s+(?:the\s+)?([A-Z0-9][A-Za-z0-9'\s&-]{2,48}?)\s+(?:series|trilogy|saga|mysteries|mystery|thriller)\b/i,
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
        /(?:#|book\s+|bk\.?\s*|vol\.?\s*|tập\s+|quyển\s+|\(\s*)(\d+(?:\.\d+)?)\b/i
      );
      if (idxMatch) {
        const n = parseFloat(idxMatch[1]);
        if (!Number.isNaN(n) && n >= 0 && n < 500) seriesIndex = n;
      }
    }

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

  // Bilingual Genre & Smart Tag Taxonomy Rules
  const GENRE_RULES = [
    {
      genre: 'Mystery & Detective',
      tag: 'Trinh thám',
      re: /\b(detective|murder|killer|homicide|police|inspector|crime|fbi|forensic|whodunit|sherlock|poirot|sleuth|investigation|mystery|clue|suspect)\b|trinh thám|án mạng|phá án|vụ án|kỳ án|thám tử|hung thủ|tội phạm/i,
    },
    {
      genre: 'Thriller & Suspense',
      tag: 'Giật gân',
      re: /\b(thriller|suspense|espionage|spy|cia|mossad|assassin|conspiracy|hostage|kidnap|revenge|chase|psychological thriller|manhunt)\b|giật gân|ly kỳ|điệp viên|âm mưu|hồi hộp|sát thủ/i,
    },
    {
      genre: 'Sci-Fi',
      tag: 'Khoa học VT',
      re: /\b(sci-fi|science fiction|cyberpunk|dystopia|dystopian|space opera|spaceship|galaxy|alien|mars|android|robot|time travel|ai|quantum|future world)\b|khoa học viễn tưởng|viễn tưởng|vũ trụ|hành tinh|tương lai/i,
    },
    {
      genre: 'Fantasy',
      tag: 'Kỳ ảo',
      re: /\b(fantasy|magic|dragon|witch|wizard|sorcerer|kingdom|spell|elf|elves|dwarf|quest|sword|prophecy|fae|vampire|werewolf|necromancer)\b|kỳ ảo|ma thuật|phép thuật|rồng|vương quốc|tiên hiệp|kiếm hiệp|huyền huyễn|dị giới|tu tiên|tu chân|đấu khí|thương khung|xuyên không|trùng sinh/i,
    },
    {
      genre: 'Romance',
      tag: 'Tình cảm',
      re: /\b(romance|romantic|love story|heartbreak|wedding|bride|soulmate|kiss|passion|billionaire|enemies to lovers)\b|ngôn tình|tình cảm|lãng mạn|tình yêu|hôn nhân/i,
    },
    {
      genre: 'Horror',
      tag: 'Kinh dị',
      re: /\b(horror|ghost|haunted|demon|curse|supernatural|nightmare|terror|macabre|zombie|gothic horror)\b|kinh dị|ma quái|ám ảnh|rùng rợn|linh dị/i,
    },
    {
      genre: 'Historical Fiction',
      tag: 'Lịch sử',
      re: /\b(historical|victorian|medieval|world war|wwii|wwi|century|empire|dynasty|tudor|regency|ancient rome|samurai|revolution)\b|lịch sử|chiến tranh|triều đại|cổ đại|thế kỷ/i,
    },
    {
      genre: 'Classic Literature',
      tag: 'Kinh điển',
      re: /\b(classic|classics|literary fiction|19th century|18th century|gutenberg|public domain|masterpiece|dostoevsky|tolstoy|austen|dickens|shakespeare|hemingway|orwell|kafka|murakami)\b|kinh điển|văn học cổ điển|kiệt tác/i,
    },
    {
      genre: 'Business & Finance',
      tag: 'Kinh doanh',
      re: /\b(business|finance|investing|investment|startup|entrepreneur|economics|economy|marketing|management|leadership|wealth|money|stock market|strategy)\b|kinh doanh|tài chính|đầu tư|khởi nghiệp|kinh tế|quản trị|lãnh đạo|tiền bạc/i,
    },
    {
      genre: 'Self-Help & Productivity',
      tag: 'Phát triển bản thân',
      re: /\b(self-help|self help|habit|habits|productivity|mindfulness|success|motivation|atomic|focus|discipline|personal growth|communication|time management)\b|kỹ năng sống|phát triển bản thân|thói quen|hiệu suất|thành công|tư duy|tự lực/i,
    },
    {
      genre: 'Psychology & Philosophy',
      tag: 'Tâm lý · Triết học',
      re: /\b(psychology|psychological|philosophy|stoicism|stoic|cognitive|neuroscience|behavioral|brain|consciousness|existential|ethics|meditations|freud|jung)\b|tâm lý học|tâm lý|triết học|nhận thức|não bộ|khắc kỷ|chủ nghĩa/i,
    },
    {
      genre: 'Science & Tech',
      tag: 'Khoa học · Công nghệ',
      re: /\b(physics|biology|chemistry|mathematics|astronomy|cosmology|evolution|computer science|programming|algorithm|software|engineering|technology|genetics|medicine)\b|khoa học|công nghệ|vật lý|sinh học|lập trình|thuật toán|y học|tiến hóa/i,
    },
    {
      genre: 'Biography & Memoir',
      tag: 'Tiểu sử · Hồi ký',
      re: /\b(biography|autobiography|memoir|memoirs|diary|letters|life story|true story)\b|tiểu sử|tự truyện|hồi ký|nhật ký/i,
    },
    {
      genre: 'Light Novel & Manga',
      tag: 'Light Novel',
      re: /\b(light novel|isekai|manga|anime|shonen|seinen|manhwa|wuxia|xianxia)\b|light novel|tiểu thuyết nhẹ|chuyển sinh/i,
    },
    {
      genre: 'Young Adult',
      tag: 'Tuổi mới lớn',
      re: /\b(young adult|ya fiction|coming of age|teen|high school|academy)\b|tuổi mới lớn|thanh xuân|học đường/i,
    },
  ];

  // Comprehensive Genre Taxonomy Descriptions (Bilingual / Vietnamese)
  const GENRE_TAXONOMY_DESCRIPTIONS = {
    'Mystery & Detective': 'Tập hợp các tác phẩm điều tra phá án ly kỳ, những vụ án bí ẩn, logic suy luận sắc bén và những màn đấu trí kịch tính giữa thám tử và tội phạm.',
    'Trinh thám': 'Tập hợp các tác phẩm điều tra phá án ly kỳ, những vụ án bí ẩn, logic suy luận sắc bén và những màn đấu trí kịch tính giữa thám tử và tội phạm.',
    'Thriller & Suspense': 'Tiết tấu dồn dập, hồi hộp nghẹt thở, những âm mưu nguy hiểm, thế giới điệp viên và những tình huống ngàn cân treo sợi tóc.',
    'Giật gân': 'Tiết tấu dồn dập, hồi hộp nghẹt thở, những âm mưu nguy hiểm, thế giới điệp viên và những tình huống ngàn cân treo sợi tóc.',
    'Sci-Fi': 'Khám phá tương lai nhân loại, công nghệ tối tân, trí tuệ nhân tạo, du hành vũ trụ và những chiều không gian song song kỳ vĩ.',
    'Khoa học VT': 'Khám phá tương lai nhân loại, công nghệ tối tân, trí tuệ nhân tạo, du hành vũ trụ và những chiều không gian song song kỳ vĩ.',
    'Fantasy': 'Thế giới phép thuật nhiệm màu, thần thoại, những vùng đất kỳ bí, kiếm hiệp, tiên hiệp và các cuộc phiêu lưu huyền thoại.',
    'Kỳ ảo': 'Thế giới phép thuật nhiệm màu, thần thoại, những vùng đất kỳ bí, kiếm hiệp, tiên hiệp và các cuộc phiêu lưu huyền thoại.',
    'Romance': 'Những câu chuyện tình yêu ngọt ngào, sâu lắng, những cung bậc cảm xúc rung động trái tim và hành trình gắn kết lứa đôi.',
    'Tình cảm': 'Những câu chuyện tình yêu ngọt ngào, sâu lắng, những cung bậc cảm xúc rung động trái tim và hành trình gắn kết lứa đôi.',
    'Horror': 'Không khí rùng rợn, ám ảnh, những hiện tượng siêu nhiên kỳ bí và nỗi sợ hãi tâm lý sâu thẳm.',
    'Kinh dị': 'Không khí rùng rợn, ám ảnh, những hiện tượng siêu nhiên kỳ bí và nỗi sợ hãi tâm lý sâu thẳm.',
    'Historical Fiction': 'Tái hiện sống động các thời kỳ hào hùng, biến cố lịch sử, văn hóa và thân phận con người qua các giai đoạn thăng trầm.',
    'Lịch sử': 'Tái hiện sống động các thời kỳ hào hùng, biến cố lịch sử, văn hóa và thân phận con người qua các giai đoạn thăng trầm.',
    'Classic Literature': 'Những kiệt tác văn chương vượt thời gian của các đại văn hào thế giới, mang giá trị nhân văn sâu sắc và tính nghệ thuật mẫu mực.',
    'Kinh điển': 'Những kiệt tác văn chương vượt thời gian của các đại văn hào thế giới, mang giá trị nhân văn sâu sắc và tính nghệ thuật mẫu mực.',
    'Business & Finance': 'Kiến thức thực chiến về kinh tế, đầu tư tài chính, quản trị doanh nghiệp, khởi nghiệp và tư duy làm giàu thông minh.',
    'Kinh doanh': 'Kiến thức thực chiến về kinh tế, đầu tư tài chính, quản trị doanh nghiệp, khởi nghiệp và tư duy làm giàu thông minh.',
    'Self-Help & Productivity': 'Rèn luyện thói quen tích cực, nâng cao hiệu suất làm việc, làm chủ tư duy và phát triển bản thân mỗi ngày.',
    'Phát triển bản thân': 'Rèn luyện thói quen tích cực, nâng cao hiệu suất làm việc, làm chủ tư duy và phát triển bản thân mỗi ngày.',
    'Psychology & Philosophy': 'Thấu hiểu chiều sâu tâm lý con người, quy luật hành vi, triết lý sống khắc kỷ và những chiêm nghiệm nhân sinh sâu sắc.',
    'Tâm lý · Triết học': 'Thấu hiểu chiều sâu tâm lý con người, quy luật hành vi, triết lý sống khắc kỷ và những chiêm nghiệm nhân sinh sâu sắc.',
    'Science & Tech': 'Những đột phá khoa học, vật lý, sinh học, công nghệ lập trình và tri thức định hình tương lai thế giới.',
    'Khoa học · Công nghệ': 'Những đột phá khoa học, vật lý, sinh học, công nghệ lập trình và tri thức định hình tương lai thế giới.',
    'Biography & Memoir': 'Những trang đời chân thực, câu chuyện vượt khó truyền cảm hứng và di sản của các nhân vật kiệt xuất.',
    'Tiểu sử · Hồi ký': 'Những trang đời chân thực, câu chuyện vượt khó truyền cảm hứng và di sản của các nhân vật kiệt xuất.',
    'Light Novel & Manga': 'Phong cách tiểu thuyết trẻ trung, phiêu lưu thế giới khác (Isekai), học đường thanh xuân và văn hóa đương đại.',
    'Light Novel': 'Phong cách tiểu thuyết trẻ trung, phiêu lưu thế giới khác (Isekai), học đường thanh xuân và văn hóa đương đại.',
    'Young Adult': 'Thanh xuân nhiệt huyết, những bỡ ngỡ đầu đời, tình bạn, tình yêu học đường và hành trình tìm kiếm bản thân.',
    'Tuổi mới lớn': 'Thanh xuân nhiệt huyết, những bỡ ngỡ đầu đời, tình bạn, tình yêu học đường và hành trình tìm kiếm bản thân.',
    'General Fiction': 'Những góc nhìn đa chiều về cuộc sống, bức tranh xã hội hiện đại và chiều sâu nội tâm con người.',
    'Văn học': 'Những góc nhìn đa chiều về cuộc sống, bức tranh xã hội hiện đại và chiều sâu nội tâm con người.',
    'Poetry & Drama': 'Nghệ thuật ngôn từ tinh tế, cảm xúc dạt dào qua những vần thơ bất hủ và các tác phẩm kịch nghệ sâu sắc.',
    'Thơ & Kịch': 'Nghệ thuật ngôn từ tinh tế, cảm xúc dạt dào qua những vần thơ bất hủ và các tác phẩm kịch nghệ sâu sắc.',
    'Travel & Adventure': 'Hành trình khám phá những vùng đất mới lạ, văn hóa muôn màu và tinh thần phiêu lưu phóng khoáng.',
    'Du ký': 'Hành trình khám phá những vùng đất mới lạ, văn hóa muôn màu và tinh thần phiêu lưu phóng khoáng.',
    'Religion & Spirituality': 'Chiêm nghiệm tâm linh, tôn giáo, tìm kiếm sự bình an nội tâm và ý nghĩa cuộc sống.',
    'Tâm linh': 'Chiêm nghiệm tâm linh, tôn giáo, tìm kiếm sự bình an nội tâm và ý nghĩa cuộc sống.',
    'Humor & Comedy': 'Tiếng cười sảng khoái, góc nhìn hóm hỉnh, châm biếm sâu cay và niềm vui tích cực trong cuộc sống.',
    'Hài hước': 'Tiếng cười sảng khoái, góc nhìn hóm hỉnh, châm biếm sâu cay và niềm vui tích cực trong cuộc sống.',
    'Wuxia & Xianxia': 'Thế giới võ lâm giang hồ, ân oán tình thù, tu tiên luyện khí, phi thăng tiên giới và tinh thần hiệp nghĩa hào hùng.',
    'Kiếm hiệp': 'Thế giới võ lâm giang hồ, ân oán tình thù, tu tiên luyện khí, phi thăng tiên giới và tinh thần hiệp nghĩa hào hùng.',
  };

  function getGenreTaxonomyDescription(genreName, books = []) {
    const raw = String(genreName || '').trim();
    if (!raw) return 'Tuyển tập các tác phẩm đặc sắc trong thư viện của bạn.';
    if (GENRE_TAXONOMY_DESCRIPTIONS[raw]) {
      return GENRE_TAXONOMY_DESCRIPTIONS[raw];
    }
    const lower = raw.toLowerCase();
    for (const [key, desc] of Object.entries(GENRE_TAXONOMY_DESCRIPTIONS)) {
      if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
        return desc;
      }
    }
    for (const rule of GENRE_RULES) {
      if (rule.genre.toLowerCase() === lower || rule.tag.toLowerCase() === lower || rule.re.test(raw)) {
        if (GENRE_TAXONOMY_DESCRIPTIONS[rule.genre]) return GENRE_TAXONOMY_DESCRIPTIONS[rule.genre];
        if (GENRE_TAXONOMY_DESCRIPTIONS[rule.tag]) return GENRE_TAXONOMY_DESCRIPTIONS[rule.tag];
      }
    }
    const safeBooks = Array.isArray(books) ? books : [];
    const sample = safeBooks.slice(0, 3).map((b) => b.title).filter(Boolean).join(', ');
    if (sample) {
      return `Tuyển tập các tác phẩm thể loại ${raw} (${safeBooks.length} cuốn sách trong thư viện của bạn), tiêu biểu gồm: ${sample}.`;
    }
    return `Tuyển tập các tác phẩm thuộc thể loại ${raw} được tuyển chọn trong kho sách của bạn.`;
  }

  // Clean raw OPF subjects / Google Books categories into canonical genres
  function normalizeSubjectsToGenres(subjectsRaw, { strictCanonical = false } = {}) {
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

    for (const raw of list) {
      const txt = decodeEntities(String(raw || ''));
      if (!txt || txt.length > 80) continue;
      const parts = txt.split(/\s*[;/|]\s*/).map((s) => s.trim()).filter(Boolean);
      for (const part of parts) {
        if (/\b(new york times|bestseller|pulitzer|hugo award|nebula award|booker prize|nobel|award)\b/i.test(part)) {
          addTag('Nổi bật');
        }
        let matchedRule = false;
        for (const rule of GENRE_RULES) {
          if (rule.re.test(part)) {
            addGenre(rule.genre);
            addTag(rule.tag);
            matchedRule = true;
          }
        }
        if (!strictCanonical && !matchedRule && part.length >= 3 && part.length <= 36) {
          addGenre(part);
        }
        if (genres.length >= 4) break;
      }
      if (genres.length >= 4) break;
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
    const fromSub = normalizeSubjectsToGenres(subjects);
    const genres = [...fromSub.genres];
    const tags = [...fromSub.tags];
    const seenG = new Set(genres.map((g) => g.toLowerCase()));
    const seenT = new Set(tags.map((t) => t.toLowerCase()));

    const pushG = (g) => {
      const k = g.toLowerCase();
      if (!seenG.has(k) && genres.length < 4) {
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
      if (rule.re.test(hay)) {
        pushG(rule.genre);
        pushT(rule.tag);
      }
    }

    if (genres.length === 0) {
      genres.push('General Fiction');
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

    return { genres: genres.slice(0, 4), tags: tags.slice(0, 6) };
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
  };
});
