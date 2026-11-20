(function () {
  function normPath(p) {
    if (!p) return '';
    const cleaned = p.replace(/\\/g, '/').replace(/^\/+/, '');
    const parts = cleaned.split('/');
    const out = [];
    for (const part of parts) {
      if (!part || part === '.') continue;
      if (part === '..') {
        out.pop();
      } else {
        out.push(part);
      }
    }
    return out.join('/');
  }

  function dirname(p) {
    const n = normPath(p);
    const idx = n.lastIndexOf('/');
    return idx === -1 ? '' : n.slice(0, idx);
  }

  function resolvePath(baseDir, href) {
    if (!href) return '';
    let clean = href.split('#')[0].split('?')[0];
    try {
      clean = decodeURIComponent(clean);
    } catch (_) {}
    if (!baseDir) return normPath(clean);
    return normPath(`${baseDir}/${clean}`);
  }

  function parseXml(str) {
    const parser = new DOMParser();
    let doc = parser.parseFromString(str, 'application/xml');
    if (doc.querySelector('parsererror')) {
      doc = parser.parseFromString(str, 'text/html');
    }
    return doc;
  }

  function parseChapterDoc(str) {
    const parser = new DOMParser();
    // Try XHTML first for strict self-closing tags; fallback to text/html
    let doc = parser.parseFromString(str, 'application/xhtml+xml');
    if (doc.querySelector('parsererror') || !doc.body) {
      doc = parser.parseFromString(str, 'text/html');
    }
    return doc;
  }

  function guessMime(pathStr) {
    const lower = (pathStr || '').toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.svg')) return 'image/svg+xml';
    return 'image/jpeg';
  }

  class EpubBook {
    constructor(zip) {
      this.zip = zip;
      this.fileMap = new Map();
      this.fileMapLower = new Map();
      this.meta = {
        title: 'Untitled',
        author: 'Unknown',
        language: 'en',
        genres: [],
        series: '',
        seriesIndex: null,
        description: '',
      };
      this.manifest = new Map();
      this.spine = [];
      this.spineByPath = new Map();
      this.toc = [];
      this.chapterCache = new Map();
      this.blobUrls = new Map();
      this.opfDir = '';
      this.coverPath = null;
      this.totalWeight = 0;

      zip.forEach((relPath, file) => {
        if (!file.dir) {
          const n = normPath(relPath);
          this.fileMap.set(n, file);
          this.fileMapLower.set(n.toLowerCase(), file);
        }
      });
    }

    findFile(targetPath) {
      if (!targetPath) return null;
      const n = normPath(targetPath);
      if (this.fileMap.has(n)) return this.fileMap.get(n);
      let decoded = n;
      try {
        decoded = normPath(decodeURIComponent(n));
      } catch (_) {}
      if (this.fileMap.has(decoded)) return this.fileMap.get(decoded);
      if (this.fileMapLower.has(n.toLowerCase())) return this.fileMapLower.get(n.toLowerCase());
      if (this.fileMapLower.has(decoded.toLowerCase()))
        return this.fileMapLower.get(decoded.toLowerCase());
      return null;
    }

    async readText(targetPath) {
      const file = this.findFile(targetPath);
      if (!file) return null;
      return file.async('string');
    }

    async getBlobUrl(targetPath, explicitMime) {
      const n = normPath(targetPath).toLowerCase();
      if (this.blobUrls.has(n)) return this.blobUrls.get(n);
      const file = this.findFile(targetPath);
      if (!file) return null;
      const ab = await file.async('arraybuffer');
      const mime = explicitMime || guessMime(targetPath);
      const url = URL.createObjectURL(new Blob([ab], { type: mime }));
      this.blobUrls.set(n, url);
      return url;
    }

    async getCoverBlob() {
      if (!this.coverPath) return null;
      const file = this.findFile(this.coverPath);
      if (!file) return null;
      const ab = await file.async('arraybuffer');
      return new Blob([ab], { type: guessMime(this.coverPath) });
    }

    async parse() {
      let opfPath = null;
      const containerXml = await this.readText('META-INF/container.xml');
      if (containerXml) {
        const doc = parseXml(containerXml);
        const rf = doc.querySelector('rootfile');
        if (rf) opfPath = rf.getAttribute('full-path');
      }
      if (!opfPath) {
        for (const key of this.fileMap.keys()) {
          if (/\.opf$/i.test(key)) {
            opfPath = key;
            break;
          }
        }
      }
      if (!opfPath) throw new Error('Không tìm thấy tệp cấu trúc OPF trong file EPUB.');

      const opfText = await this.readText(opfPath);
      if (!opfText) throw new Error('Không thể đọc tệp OPF trong EPUB.');

      this.opfDir = dirname(opfPath);
      const opfDoc = parseXml(opfText);

      // Metadata
      const titleEl = opfDoc.querySelector('title, dc\\:title');
      const creatorEls = Array.from(opfDoc.querySelectorAll('creator, dc\\:creator'));
      const langEl = opfDoc.querySelector('language, dc\\:language');
      if (titleEl && titleEl.textContent.trim()) {
        this.meta.title = titleEl.textContent.trim();
      }
      const authors = creatorEls
        .map((e) => e.textContent.trim())
        .filter((t, i, arr) => t && arr.indexOf(t) === i);
      if (authors.length) this.meta.author = authors.join(', ');
      if (langEl && langEl.textContent.trim()) {
        this.meta.language = langEl.textContent.trim().toLowerCase();
      }

      // Genres (dc:subject)
      const subjectEls = Array.from(opfDoc.querySelectorAll('subject, dc\\:subject'));
      const genreSet = new Set();
      for (const el of subjectEls) {
        const raw = (el.textContent || '').trim();
        if (!raw) continue;
        for (const part of raw.split(/[;,/|]/)) {
          const clean = part.replace(/\s+/g, ' ').trim();
          if (clean && clean.length >= 2 && clean.length <= 42 && !/^fiction$/i.test(clean)) {
            genreSet.add(clean);
          }
        }
      }
      this.meta.genres = Array.from(genreSet).slice(0, 6);

      // Description (dc:description)
      const descEl = opfDoc.querySelector('description, dc\\:description');
      if (descEl && descEl.textContent.trim()) {
        const tmp = document.createElement('div');
        tmp.innerHTML = descEl.textContent;
        this.meta.description = (tmp.textContent || descEl.textContent || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 1400);
      }

      // Cover meta id + Series (Calibre & EPUB3 belongs-to-collection)
      let coverMetaId = null;
      for (const m of opfDoc.querySelectorAll('meta')) {
        const nameAttr = (m.getAttribute('name') || '').toLowerCase();
        const propAttr = (m.getAttribute('property') || '').toLowerCase();
        const contentAttr = (m.getAttribute('content') || '').trim();
        const txt = (m.textContent || '').trim();

        if (nameAttr === 'cover') {
          coverMetaId = contentAttr;
        } else if (nameAttr === 'calibre:series' && contentAttr) {
          this.meta.series = contentAttr;
        } else if (nameAttr === 'calibre:series_index' && contentAttr) {
          const n = parseFloat(contentAttr);
          if (!Number.isNaN(n)) this.meta.seriesIndex = n;
        } else if (propAttr === 'belongs-to-collection' && txt && !this.meta.series) {
          this.meta.series = txt;
        } else if (propAttr === 'group-position' && txt && this.meta.seriesIndex == null) {
          const n = parseFloat(txt);
          if (!Number.isNaN(n)) this.meta.seriesIndex = n;
        }
      }

      // Manifest
      let navItemPath = null;
      let ncxItemPath = null;
      for (const item of opfDoc.querySelectorAll('manifest > item, item')) {
        const id = item.getAttribute('id');
        const href = item.getAttribute('href');
        if (!id || !href) continue;
        const fullPath = resolvePath(this.opfDir, href);
        const mediaType = item.getAttribute('media-type') || '';
        const properties = item.getAttribute('properties') || '';
        const rec = { id, href, fullPath, mediaType, properties };
        this.manifest.set(id, rec);

        if (properties.split(/\s+/).includes('nav')) navItemPath = fullPath;
        if (mediaType === 'application/x-dtbncx+xml') ncxItemPath = fullPath;
        if (properties.split(/\s+/).includes('cover-image')) this.coverPath = fullPath;
      }

      if (!this.coverPath && coverMetaId && this.manifest.has(coverMetaId)) {
        const c = this.manifest.get(coverMetaId);
        if (c.mediaType.startsWith('image/')) this.coverPath = c.fullPath;
      }
      if (!this.coverPath) {
        for (const item of this.manifest.values()) {
          if (item.mediaType.startsWith('image/') && /cover/i.test(`${item.id} ${item.href}`)) {
            this.coverPath = item.fullPath;
            break;
          }
        }
      }

      // Spine
      const spineEl = opfDoc.querySelector('spine');
      const tocAttr = spineEl ? spineEl.getAttribute('toc') : null;
      if (!ncxItemPath && tocAttr && this.manifest.has(tocAttr)) {
        ncxItemPath = this.manifest.get(tocAttr).fullPath;
      }

      const itemrefs = Array.from(opfDoc.querySelectorAll('spine > itemref, itemref'));
      let cumulative = 0;
      for (const ref of itemrefs) {
        const idref = ref.getAttribute('idref');
        const linear = (ref.getAttribute('linear') || 'yes').toLowerCase();
        if (linear === 'no') continue;
        const m = this.manifest.get(idref);
        if (!m) continue;
        const zf = this.findFile(m.fullPath);
        if (!zf) continue;
        const weight = Math.max(
          200,
          (zf._data && typeof zf._data.uncompressedSize === 'number'
            ? zf._data.uncompressedSize
            : 4000)
        );
        const idx = this.spine.length;
        this.spine.push({
          index: idx,
          id: m.id,
          fullPath: m.fullPath,
          weight,
          cumStart: cumulative,
          title: '',
        });
        this.spineByPath.set(m.fullPath.toLowerCase(), idx);
        cumulative += weight;
      }
      this.totalWeight = Math.max(1, cumulative);

      // Parse TOC (EPUB3 NAV preferred, fallback EPUB2 NCX)
      if (navItemPath) {
        await this.parseNavToc(navItemPath);
      }
      if (this.toc.length === 0 && ncxItemPath) {
        await this.parseNcxToc(ncxItemPath);
      }

      // Assign titles back onto spine entries from TOC
      for (const entry of this.toc) {
        if (entry.spineIndex >= 0 && entry.spineIndex < this.spine.length) {
          if (!this.spine[entry.spineIndex].title) {
            this.spine[entry.spineIndex].title = entry.label;
          }
        }
      }
      // Fill missing spine titles cleanly
      let lastTitle = this.meta.title;
      for (let i = 0; i < this.spine.length; i++) {
        if (this.spine[i].title) {
          lastTitle = this.spine[i].title;
        } else {
          this.spine[i].title = i === 0 ? this.meta.title : lastTitle;
        }
      }

      return this;
    }

    async parseNavToc(navPath) {
      const txt = await this.readText(navPath);
      if (!txt) return;
      const doc = parseChapterDoc(txt);
      const navDir = dirname(navPath);
      let nav =
        doc.querySelector('nav[epub\\:type~="toc"]') ||
        Array.from(doc.querySelectorAll('nav')).find((n) => {
          const t = n.getAttribute('epub:type') || n.getAttribute('role') || '';
          return t.includes('toc');
        }) ||
        doc.querySelector('nav');
      if (!nav) return;

      const walkOl = (ol, depth) => {
        if (!ol) return;
        for (const li of Array.from(ol.children)) {
          if (li.tagName.toLowerCase() !== 'li') continue;
          const a = li.querySelector(':scope > a, :scope > span > a');
          if (a) {
            const href = a.getAttribute('href') || '';
            const label = a.textContent.replace(/\s+/g, ' ').trim();
            const [filePart, frag] = href.split('#');
            const target = resolvePath(navDir, filePart);
            const spineIndex = this.spineByPath.has(target.toLowerCase())
              ? this.spineByPath.get(target.toLowerCase())
              : -1;
            if (label && spineIndex >= 0) {
              this.toc.push({ label, spineIndex, fragment: frag || '', depth });
            }
          }
          const sub = li.querySelector(':scope > ol');
          if (sub) walkOl(sub, depth + 1);
        }
      };
      walkOl(nav.querySelector('ol'), 0);
    }

    async parseNcxToc(ncxPath) {
      const txt = await this.readText(ncxPath);
      if (!txt) return;
      const doc = parseXml(txt);
      const ncxDir = dirname(ncxPath);
      const navMap = doc.querySelector('navMap');
      if (!navMap) return;

      const walkPoints = (parent, depth) => {
        for (const np of Array.from(parent.children)) {
          if (np.tagName.toLowerCase() !== 'navpoint') continue;
          const labelEl = np.querySelector(':scope > navLabel > text');
          const contentEl = np.querySelector(':scope > content');
          const label = labelEl ? labelEl.textContent.replace(/\s+/g, ' ').trim() : '';
          const src = contentEl ? contentEl.getAttribute('src') || '' : '';
          const [filePart, frag] = src.split('#');
          const target = resolvePath(ncxDir, filePart);
          const spineIndex = this.spineByPath.has(target.toLowerCase())
            ? this.spineByPath.get(target.toLowerCase())
            : -1;
          if (label && spineIndex >= 0) {
            this.toc.push({ label, spineIndex, fragment: frag || '', depth });
          }
          walkPoints(np, depth + 1);
        }
      };
      walkPoints(navMap, 0);
    }

    async loadChapter(spineIndex) {
      if (spineIndex < 0 || spineIndex >= this.spine.length) return null;
      if (this.chapterCache.has(spineIndex)) {
        return this.chapterCache.get(spineIndex);
      }

      const item = this.spine[spineIndex];
      const raw = await this.readText(item.fullPath);
      if (raw == null) {
        return { index: spineIndex, title: item.title, html: '<p>(Trống)</p>', wordCount: 0 };
      }

      const chapDir = dirname(item.fullPath);
      const doc = parseChapterDoc(raw);
      const body = doc.body || doc.documentElement;

      // Remove unwanted executable/styling tags
      for (const el of Array.from(
        body.querySelectorAll('script, style, link, meta, iframe, object, embed, audio, video, noscript')
      )) {
        el.remove();
      }

      // Convert SVG image wrappers (common for covers/illustrations) into clean <img> tags
      for (const svg of Array.from(body.querySelectorAll('svg'))) {
        const imgEl = svg.querySelector('image');
        if (imgEl) {
          const href =
            imgEl.getAttribute('xlink:href') ||
            imgEl.getAttribute('href') ||
            imgEl.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
          if (href) {
            const resolved = resolvePath(chapDir, href);
            const url = await this.getBlobUrl(resolved);
            if (url) {
              const replacement = doc.createElement('img');
              replacement.setAttribute('src', url);
              replacement.setAttribute('class', 'epub-cover-img');
              replacement.setAttribute('alt', 'Illustration');
              svg.replaceWith(replacement);
              continue;
            }
          }
        }
      }

      // Resolve <img> tags
      for (const img of Array.from(body.querySelectorAll('img'))) {
        const src = img.getAttribute('src');
        if (src && !/^data:|^https?:|^blob:/i.test(src)) {
          const resolved = resolvePath(chapDir, src);
          const url = await this.getBlobUrl(resolved);
          if (url) {
            img.setAttribute('src', url);
          }
        }
        img.removeAttribute('width');
        img.removeAttribute('height');
        img.setAttribute('loading', 'eager');
      }

      // Sanitize inline styles & rewrite internal links
      for (const el of Array.from(body.querySelectorAll('*'))) {
        // Strip inline event handlers
        for (const attr of Array.from(el.attributes)) {
          if (attr.name.toLowerCase().startsWith('on')) {
            el.removeAttribute(attr.name);
          }
        }
        // Preserve only safe alignment hints from inline style; strip colors/fonts/sizes
        const styleAttr = el.getAttribute('style');
        if (styleAttr) {
          const keep = [];
          const alignMatch = styleAttr.match(/text-align\s*:\s*(center|right|left)/i);
          if (alignMatch) keep.push(`text-align:${alignMatch[1].toLowerCase()}`);
          const italicMatch = styleAttr.match(/font-style\s*:\s*italic/i);
          if (italicMatch) keep.push('font-style:italic');
          const boldMatch = styleAttr.match(/font-weight\s*:\s*(bold|[6-9]00)/i);
          if (boldMatch) keep.push('font-weight:bold');
          if (keep.length) {
            el.setAttribute('style', keep.join(';'));
          } else {
            el.removeAttribute('style');
          }
        }
        el.removeAttribute('bgcolor');
        el.removeAttribute('color');

        // Detect centered / heading class hints used by Calibre/Kindle EPUBs WITHOUT centering whole chapter containers!
        const tag = el.tagName.toLowerCase();
        const cls = (el.getAttribute('class') || '').toLowerCase();
        const isContainer = /^(div|section|article|main|body)$/.test(tag);
        const textLen = (el.textContent || '').trim().length;
        if (
          !isContainer &&
          textLen < 220 &&
          /\b(center|centered|calibre_?center|chaptitle|chapter-?title|dedication)\b/.test(cls)
        ) {
          el.classList.add('epub-centered');
        }
        if (
          !isContainer &&
          textLen > 0 &&
          textLen < 120 &&
          /\b(chaptitle|chapter-?title|chapter-?num|chapter-?head|part-?title|book-?title)\b/.test(cls)
        ) {
          el.classList.add('epub-heading');
        }

        if (el.tagName.toLowerCase() === 'a') {
          const href = el.getAttribute('href') || '';
          if (href && !/^https?:|^mailto:/i.test(href)) {
            const [filePart, frag] = href.split('#');
            const targetPath = filePart ? resolvePath(chapDir, filePart) : item.fullPath;
            const targetIdx = this.spineByPath.has(targetPath.toLowerCase())
              ? this.spineByPath.get(targetPath.toLowerCase())
              : spineIndex;
            el.setAttribute('data-epub-spine', String(targetIdx));
            if (frag) el.setAttribute('data-epub-frag', frag);
            el.setAttribute('href', '#');
          } else if (/^https?:/i.test(href)) {
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
          }
        }
      }

      // Extract clean heading if spine title was generic
      let detectedTitle = item.title;
      const heading = body.querySelector('h1, h2, h3');
      if (heading && heading.textContent.trim().length > 0 && heading.textContent.trim().length < 90) {
        const hText = heading.textContent.replace(/\s+/g, ' ').trim();
        if (!detectedTitle || detectedTitle === this.meta.title) {
          detectedTitle = hText;
        }
      }

      const textLen = (body.textContent || '').trim().split(/\s+/).filter(Boolean).length;
      const chapter = {
        index: spineIndex,
        title: detectedTitle || `Chương ${spineIndex + 1}`,
        html: body.innerHTML,
        wordCount: textLen,
      };
      this.chapterCache.set(spineIndex, chapter);
      return chapter;
    }

    getBookPercent(spineIndex, chapterRatio) {
      if (!this.spine.length) return 0;
      const clampedIdx = Math.max(0, Math.min(this.spine.length - 1, spineIndex));
      const item = this.spine[clampedIdx];
      const clampedRatio = Math.max(0, Math.min(1, chapterRatio || 0));
      const pos = item.cumStart + item.weight * clampedRatio;
      return Math.max(0, Math.min(100, (pos / this.totalWeight) * 100));
    }

    getEstimatedMinutesLeft(spineIndex, chapterRatio) {
      // Heuristic: ~7 bytes of XHTML per word on average in English novels, 230 wpm reading speed
      if (!this.spine.length) return 0;
      const pct = this.getBookPercent(spineIndex, chapterRatio);
      const remainingBytes = this.totalWeight * (1 - pct / 100);
      const approxWords = remainingBytes / 7.5;
      return Math.max(1, Math.round(approxWords / 230));
    }

    destroy() {
      for (const url of this.blobUrls.values()) {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
      }
      this.blobUrls.clear();
      this.chapterCache.clear();
    }
  }

  window.PaperInkEpub = {
    async loadFromBlob(blob) {
      const zip = await window.JSZip.loadAsync(blob);
      const book = new EpubBook(zip);
      await book.parse();
      return book;
    },
  };
})();
