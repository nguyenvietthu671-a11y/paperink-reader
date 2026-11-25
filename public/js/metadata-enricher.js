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

  function cleanSeriesName(raw) {
    let s = decodeEntities(String(raw || ''))
      .replace(/^the\s+(?=[A-Z])/i, (m) => m)
      .replace(/\s*(?:series|trilogy|saga|chronicles?|novels?|books?)\s*$/i, (m) =>
        /trilogy|saga|chronicles?/i.test(m) ? m : ''
      )
      .replace(/\s*(?:tập|quyển|phần|vol\.?|volume|part)\s*$/i, '')
      .replace(/^[\s\-–—:,#]+|[\s\-–—:,#]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!s || s.length < 2 || s.length > 72 || /^\d+$/.test(s)) return '';
    if (
      /^(edition|version|unabridged|illustrated|annotated|retail|epub|pdf|kindle|z-lib|oceanofpdf|tập|quyển|phần|book|vol\.?|volume|part)$/i.test(
        s
      )
    ) {
      return '';
    }
    return s;
  }

  function extractSeriesFromText(title = '', fileName = '', description = '') {
    let series = '';
    let seriesIndex = null;
    let cleanTitle = decodeEntities(String(title || '')).trim();

    const tryParen = (source, stripFromTitle = false) => {
      if (!source || series) return;
      // Matches "(Sherlock Holmes, #1)", "(Dune Book 2)", "[Mistborn 03]", "(Kiếm Lai - Tập 2)"
      const re = /\s*[\(\[]([^()\[\]]{2,68}?)(?:[,:\-\s]+)?(?:#|book\s+|vol\.?\s*|volume\s+|part\s+|tập\s+|quyển\s+|phần\s+|no\.?\s*)?(\d+(?:\.\d+)?)\s*[\)\]]/i;
      const m = source.match(re);
      if (m) {
        const cand = cleanSeriesName(m[1]);
        const idx = parseFloat(m[2]);
        // Avoid false positive years like "(1984)" or "(2023)"
        if (cand && !Number.isNaN(idx) && idx > 0 && idx < 500) {
          series = cand;
          seriesIndex = idx;
          if (stripFromTitle) {
            const stripped = source.replace(m[0], '').replace(/\s+/g, ' ').trim();
            if (stripped.length >= 2) cleanTitle = stripped;
          }
        }
      }
    };

    tryParen(cleanTitle, true);
    tryParen(decodeEntities(String(fileName || '')).replace(/\.epub$/i, '').replace(/_/g, ' '), false);

    // Pattern: "(A Sherlock Holmes Novel)" or "(A Cormoran Strike Mystery)" in title
    if (!series && cleanTitle) {
      const novelOfRe = /\s*[\(\[]\s*(?:an?\s+)?([A-Z][\w\s'&.-]{2,48}?)\s+(?:novel|mystery|thriller|adventure|story|case|chronicle|book|trilogy)\s*[\)\]]/i;
      const m = cleanTitle.match(novelOfRe);
      if (m) {
        const cand = cleanSeriesName(m[1]);
        if (cand) {
          series = cand;
          const stripped = cleanTitle.replace(m[0], '').replace(/\s+/g, ' ').trim();
          if (stripped.length >= 2) cleanTitle = stripped;
        }
      }
    }

    // Pattern: "Series Name: Book 2" or "Title - Tập 3" / "Title - Quyển 2"
    if (!series && cleanTitle) {
      const viRe = /^(.{2,55}?)\s*[-–—:,]?\s*(?:tập|quyển|phần|book|vol\.?)\s*(\d+(?:\.\d+)?)\b/i;
      const m = cleanTitle.match(viRe);
      if (m) {
        const cand = cleanSeriesName(m[1]);
        const idx = parseFloat(m[2]);
        if (cand && !Number.isNaN(idx) && idx > 0 && idx < 500) {
          series = cand;
          seriesIndex = idx;
        }
      }
    }

    // Pattern in description: "Book One of the Kingkiller Chronicle", "first novel in the Cormoran Strike series", "A Jack Reacher Novel"
    if (!series && description) {
      const descRe1 =
        /\b(?:book|volume|novel|installment|part)\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:of|in)\s+(?:the\s+)?([A-Z][A-Za-z0-9'\s&-]{2,52}?)\s+(?:series|trilogy|saga|quartet|cycle)\b/i;
      const m1 = description.match(descRe1);
      if (m1) {
        const cand = cleanSeriesName(m1[2]);
        if (cand) {
          series = cand;
          seriesIndex = parseNumberWord(m1[1]);
        }
      }
      if (!series) {
        const descRe1b =
          /\b(?:book|volume|novel|installment|part)\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:of|in)\s+(?:the\s+)?([A-Z][A-Za-z0-9'\s&-]{2,52}?\s+chronicles?)\b/i;
        const m1b = description.match(descRe1b);
        if (m1b) {
          const cand = cleanSeriesName(m1b[2]);
          if (cand) {
            series = cand;
            seriesIndex = parseNumberWord(m1b[1]);
          }
        }
      }
      if (!series) {
        const descRe2 =
          /\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th))\s+(?:book|novel|installment)\s+in\s+(?:the\s+)?([A-Z][A-Za-z0-9'\s&-]{2,52}?)\s+(?:series|trilogy|saga|mystery|thriller)\b/i;
        const m2 = description.match(descRe2);
        if (m2) {
          const cand = cleanSeriesName(m2[1]);
          if (cand) {
            series = cand;
            seriesIndex = parseNumberWord(m2[0].split(/\s+/)[0].replace(/(st|nd|rd|th)$/i, ''));
          }
        }
      }
    }

    // Index fallback from filename/title if series already known
    if (series && seriesIndex == null) {
      const idxMatch = `${fileName} ${title}`.match(/(?:#|book\s+|vol\.?\s*|tập\s+|quyển\s+)(\d+(?:\.\d+)?)/i);
      if (idxMatch) {
        const n = parseFloat(idxMatch[1]);
        if (!Number.isNaN(n) && n > 0 && n < 500) seriesIndex = n;
      }
    }

    return { cleanTitle: cleanTitle || title, series, seriesIndex };
  }

  function parseFilenameMeta(fileName) {
    let base = decodeEntities(String(fileName || '')).replace(/\.epub$/i, '');
    base = base.replace(/^_?OceanofPDF\.com_/i, '');
    base = base.replace(/\s*\(z-library\.sk.*?\)/gi, '');
    base = base.replace(/\s*\(z-lib\.org.*?\)/gi, '');
    base = base.replace(/\s*--\s*Anna[’']?s Archive$/i, '');
    base = base.replace(/\s*\[(?:epub|retail|v\d+|converted)\]\s*/gi, ' ').trim();

    let title = base;
    let author = '';
    let series = '';
    let seriesIndex = null;

    if (base.includes(' -- ')) {
      const parts = base.split(' -- ').map((s) => s.trim()).filter(Boolean);
      title = (parts[0] || base).replace(/_/g, ' ').trim();
      if (parts[1] && !/^\d{4}$/.test(parts[1])) {
        author = normalizeAuthor(parts[1].replace(/_/g, ' '));
      }
    } else if (base.includes('_-_')) {
      const parts = base.split('_-_').map((s) => s.replace(/_/g, ' ').trim()).filter(Boolean);
      title = parts[0] || base;
      if (parts[1]) {
        author = normalizeAuthor(parts[1].replace(/\(\d+\)$/, '').trim());
      }
    } else if (/\s-\s/.test(base)) {
      const parts = base.split(/\s-\s/).map((s) => s.replace(/_/g, ' ').trim()).filter(Boolean);
      if (parts.length >= 3) {
        // Vietnamese/volume pattern: "Đấu Phá Thương Khung - Tập 2 - Thiên Tàm Thổ Đậu"
        const volMatch = parts[1].match(/^(?:tập|quyển|phần|book|vol\.?|volume|part|#)\s*(\d+(?:\.\d+)?)$/i);
        if (volMatch) {
          series = cleanSeriesName(parts[0]);
          seriesIndex = parseFloat(volMatch[1]);
          title = `${parts[0]} - ${parts[1]}`;
          author = normalizeAuthor(parts.slice(2).join(' - '));
        } else {
          // Common Calibre/eBook naming: "Author - Series 01 - Title"
          const midMatch = parts[1].match(/^(.+?)\s+#?(\d+(?:\.\d+)?)$/);
          const candSeries = midMatch ? cleanSeriesName(midMatch[1]) : '';
          if (midMatch && candSeries) {
            author = normalizeAuthor(parts[0]);
            series = candSeries;
            seriesIndex = parseFloat(midMatch[2]);
            title = parts.slice(2).join(' - ');
          } else {
            title = parts[0];
            author = normalizeAuthor(parts[parts.length - 1]);
          }
        }
      } else if (parts.length === 2) {
        title = parts[0];
        author = normalizeAuthor(parts[1]);
      }
    } else {
      title = base.replace(/_/g, ' ').trim();
    }

    const fromTitle = extractSeriesFromText(title, fileName, '');
    if (!series && fromTitle.series) {
      series = fromTitle.series;
      seriesIndex = fromTitle.seriesIndex;
      title = fromTitle.cleanTitle;
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
    let series = cleanSeriesName(raw.series || '');
    let seriesIndex = raw.seriesIndex != null && !Number.isNaN(Number(raw.seriesIndex)) ? Number(raw.seriesIndex) : null;

    if (!series) {
      const extracted = extractSeriesFromText(title, raw.fileName || '', description);
      if (extracted.series) {
        series = extracted.series;
        seriesIndex = extracted.seriesIndex;
        title = extracted.cleanTitle;
      } else if (fileFallback.series) {
        series = fileFallback.series;
        seriesIndex = fileFallback.seriesIndex;
      }
    } else if (seriesIndex == null) {
      const extracted = extractSeriesFromText(title, raw.fileName || '', description);
      if (extracted.seriesIndex != null) seriesIndex = extracted.seriesIndex;
      else if (fileFallback.seriesIndex != null) seriesIndex = fileFallback.seriesIndex;
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

  // Online Auto-Enrichment (Google Books API + Open Library API, CORS *, zero API key needed)
  async function enrichBookOnline(book) {
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

    const queryTitle = (base.title || '').replace(/\s*[:(\[].*$/, '').trim();
    if (!queryTitle || queryTitle.length < 2) return base;

    const hasRealAuthor = !isUnknownAuthor(base.author);
    const gbQ = hasRealAuthor
      ? `intitle:${queryTitle} inauthor:${base.author.split(',')[0].trim()}`
      : `intitle:${queryTitle}`;

    const [gbData, olData] = await Promise.all([
      fetchJsonWithTimeout(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(gbQ)}&maxResults=3`, 4500),
      fetchJsonWithTimeout(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(queryTitle)}${
          hasRealAuthor ? `&author=${encodeURIComponent(base.author.split(',')[0].trim())}` : ''
        }&limit=3&fields=title,author_name,subject,first_sentence`,
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
      if (!series && gbVol.subtitle) {
        const fromSub = extractSeriesFromText(`${gbVol.title || ''} (${gbVol.subtitle})`, '', gbVol.description || '');
        if (fromSub.series) {
          series = fromSub.series;
          seriesIndex = seriesIndex ?? fromSub.seriesIndex;
        }
      }
      if (gbVol.language && !language) language = gbVol.language;
    }

    // 2. Merge Open Library hit (extract canonical genres/tags only so LoC headings don't pollute genres)
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
    if (!series && description) {
      const fromDesc = extractSeriesFromText(base.title, book.fileName || '', description);
      if (fromDesc.series) {
        series = fromDesc.series;
        seriesIndex = seriesIndex ?? fromDesc.seriesIndex;
      }
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
      enrichedOnline: Boolean(gbVol || olDoc),
    };
  }

  return {
    normalizeAuthor,
    parseFilenameMeta,
    extractSeriesFromText,
    inferGenresAndTags,
    analyzeBookMetadata,
    enrichBookOnline,
  };
});
