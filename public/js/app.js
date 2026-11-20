(function () {
  const DEFAULT_SETTINGS = {
    theme: 'apple',
    fontFamily: 'literata',
    headingFont: 'cormorant',
    fontSize: 19,
    headingSize: 28,
    fontWeight: 420,
    lineHeight: 1.68,
    letterSpacing: 0,
    wordSpacing: 0,
    paraGap: 0.62,
    margin: 'medium',
    textAlign: 'justify',
    readDirection: 'horizontal', // horizontal | vertical
    turnEffect: 'curl', // curl | slide | eink | instant
    progressStyle: 'line', // line | pill | percent | hidden
    progressColorMode: 'solid', // solid | gradient
    progressSolidColor: '#0071E3',
    progressGradStart: '#0071E3',
    progressGradEnd: '#AF52DE',
    pageMode: 'eink',
    paperGrain: true,
    extraDim: 0,
    warmth: 0,
    grayscale: false,
    tapDict: false,
    showHeaderFooter: true,
    autoSaveOffline: true,
    updatedAt: 0,
  };

  const PROGRESS_SOLID_PRESETS = [
    { name: 'Apple Blue', hex: '#0071E3' },
    { name: 'Kindle Ấm', hex: '#8C5A32' },
    { name: 'Xanh lá dịu', hex: '#2D8A4E' },
    { name: 'San hô', hex: '#E05263' },
    { name: 'Tím Indigo', hex: '#6E5CE6' },
    { name: 'Đen mực', hex: '#1D1D1F' },
  ];

  const PROGRESS_GRADIENT_PRESETS = [
    { name: 'Ocean', start: '#0071E3', end: '#34C7F0' },
    { name: 'Aurora', start: '#5E5CE6', end: '#D946EF' },
    { name: 'Sunset', start: '#FF6B4A', end: '#FFB347' },
    { name: 'Matcha', start: '#2D8A4E', end: '#7AD99E' },
    { name: 'Rose Gold', start: '#E05263', end: '#F59E0B' },
    { name: 'Kindle Gold', start: '#8C5A32', end: '#D6A354' },
  ];

  const FONT_STACKS = {
    cormorant: "'Cormorant Garamond', Georgia, serif",
    playfair: "'Playfair Display', Georgia, serif",
    literata: "'Literata', Georgia, 'Times New Roman', serif",
    lora: "'Lora', Georgia, serif",
    newsreader: "'Newsreader', Georgia, serif",
    atkinson: "'Atkinson Hyperlegible', -apple-system, BlinkMacSystemFont, sans-serif",
    sans: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Segoe UI', Roboto, sans-serif",
  };

  const BUILTIN_BODY_FONTS = [
    { id: 'literata', label: 'Literata' },
    { id: 'lora', label: 'Lora' },
    { id: 'newsreader', label: 'Newsreader' },
    { id: 'atkinson', label: 'Atkinson' },
    { id: 'sans', label: 'SF / Sans' },
  ];

  const BUILTIN_HEADING_FONTS = [
    { id: 'same', label: 'Giống văn bản' },
    { id: 'cormorant', label: 'Cormorant' },
    { id: 'playfair', label: 'Playfair' },
    { id: 'literata', label: 'Literata' },
    { id: 'lora', label: 'Lora' },
    { id: 'newsreader', label: 'Newsreader' },
    { id: 'sans', label: 'SF / Sans' },
  ];

  const THEME_META_COLORS = {
    apple: '#F5F5F7',
    paper: '#F3F1EC',
    sepia: '#EFE5D1',
    eink: '#EAEAEA',
    sage: '#E5EDE4',
    amoled: '#000000',
  };

  const ICONS = {
    spinner: `<svg class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
    check: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
    download: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    speaker: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
    note: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    close: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    plus: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    arrowRight: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>`,
    flame: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    starFilled: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    starOutline: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    pen: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  };

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatRelativeDate(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatMinsShort(mins) {
    const m = Math.round(mins || 0);
    if (m < 60) return `${m}p`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h}g ${r}p` : `${h}g`;
  }

  function formatMinsLong(mins) {
    const m = Math.round(mins || 0);
    if (m <= 1) return '1 phút';
    if (m < 60) return `${m} phút`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h} giờ ${r} phút` : `${h} giờ`;
  }

  function todayKey(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function dayLabelVi(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const names = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return offsetDays === 0 ? 'Nay' : names[d.getDay()];
  }

  function hexLuminance(hex) {
    const c = String(hex || '#F5F5F7').replace('#', '');
    if (c.length !== 6) return 0.9;
    const rgb = [0, 2, 4]
      .map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  function uid(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  class PaperInkApp {
    constructor() {
      const decorMod = window.PaperInkShelfDecor;
      this.serverBooks = [];
      this.offlineMap = new Map();
      this.offlineCoverUrls = new Map();
      this.customStickers = []; // { id, name, url, createdAt }
      this.customStickerMap = new Map();
      this.customFonts = []; // { id, name, cssFamily, createdAt }
      this.customFontMap = new Map();
      this.loadedFontFamilies = new Set();
      this.customWallpaperUrl = null;
      this.isOnlineToServer = false;
      this.deferredInstallPrompt = null;
      this.activeBookInfoId = null;

      this.state = {
        progress: {},
        bookmarks: {},
        highlights: {},
        bookReviews: {},
        inkNotes: {},
        vocab: [],
        deletedIds: {},
        settings: { ...DEFAULT_SETTINGS },
        readingStats: {
          dailyMinutes: {},
          dailyGoalMinutes: 30,
          pagesTurned: 0,
          updatedAt: 0,
        },
        shelfConfig: structuredClone(decorMod?.DEFAULT_SHELF_CONFIG || {}),
      };

      // UI state
      this.route = 'shelf';
      this.drilldown = null;
      this.shelfFilter = 'all';
      this.progressTab = 'reading';
      this.searchQuery = '';
      this.searchOpen = false;
      this.sortBy = 'recent';
      this.renderLimit = 72;
      this.downloadingIds = new Set();
      this.lastShelfCols = this.computeShelfCols();

      // Sticker Edit & Drag state
      this.editStickersMode = false;
      this.selectedStickerId = null;
      this.dragState = null;

      this.syncTimer = null;
      this.toastTimer = null;

      this.dictUI = new window.PaperInkDictUI({
        onSaveVocab: (entry) => this.addVocabWord(entry),
        isWordSaved: (word) => this.isVocabWordSaved(word),
      });

      this.inkCanvas = new window.PaperInkSPen({
        onSavePage: (bookId, pageKey, strokes, meta) => this.saveInkPage(bookId, pageKey, strokes, meta),
        onActiveChange: (isActive) => {
          if (isActive) this.reader.setHudVisible(false);
        },
        toast: (msg) => this.toast(msg),
      });

      this.reader = new window.PaperInkReader({
        getSettings: () => this.state.settings,
        getPenState: () => ({
          active: this.inkCanvas.active,
          sPenOnly: this.inkCanvas.sPenOnly,
        }),
        onPageChanged: ({ bookId, pageKey, meta }) => this.loadInkForPage(bookId, pageKey, meta),
        onBookClosed: () => this.inkCanvas.clearContext(),
        saveProgress: (bookId, p) => this.updateProgress(bookId, p),
        onReadingActivity: (act) => this.recordReadingActivity(act),
        getBookmarks: (bookId) => this.state.bookmarks[bookId] || [],
        addBookmark: (bookId, bm) => this.addBookmark(bookId, bm),
        deleteBookmark: (bookId, bmId) => this.deleteBookmark(bookId, bmId),
        getHighlights: (bookId) => this.state.highlights[bookId] || [],
        addHighlight: (bookId, hl) => this.addHighlight(bookId, hl),
        updateHighlight: (bookId, hlId, patch) => this.updateHighlight(bookId, hlId, patch),
        deleteHighlight: (bookId, hlId) => this.deleteHighlight(bookId, hlId),
        openDictionary: (opts) => this.dictUI.lookup(opts),
        toast: (msg) => this.toast(msg),
      });
    }

    computeShelfCols() {
      const w = window.innerWidth;
      if (w < 460) return 3;
      if (w < 720) return 4;
      if (w < 1020) return 5;
      return 6;
    }

    async init() {
      this.registerServiceWorker();
      this.bindUI();

      await this.loadLocalData();
      this.applySettingsToDOM();
      this.applyBackgroundToDOM();
      this.renderCurrentRoute();

      await this.refreshFromServer();
    }

    registerServiceWorker() {
      if ('serviceWorker' in navigator && window.isSecureContext) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      }
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredInstallPrompt = e;
        document.getElementById('pwa-install-btn')?.classList.remove('hidden');
      });
    }

    isStaticWebHost() {
      const host = (window.location.hostname || '').toLowerCase();
      return (
        host.endsWith('.github.io') ||
        host.endsWith('.pages.dev') ||
        host.endsWith('.netlify.app') ||
        host.endsWith('.vercel.app') ||
        window.location.protocol === 'file:'
      );
    }

    async ensureStarterSampleBook() {
      if (this.serverBooks.length > 0 || this.offlineMap.size > 0) return;
      if (localStorage.getItem('paperink_demo_dismissed') === '1') return;
      if (!window.PaperInkDemoBook) return;
      try {
        const sample = await window.PaperInkDemoBook.buildSampleEpubBlob();
        await window.PaperInkDB.saveOfflineBook(sample);
        await this.reloadOfflineMeta();
      } catch (err) {
        console.warn('[PaperInk] Sample book init skipped:', err);
      }
    }

    normalizeSettings(raw) {
      const s = { ...DEFAULT_SETTINGS, ...(raw || {}) };
      if (!raw?.readDirection) {
        s.readDirection = raw?.pageMode === 'scroll' ? 'vertical' : 'horizontal';
      }
      if (!raw?.turnEffect) {
        if (raw?.pageMode === 'instant') s.turnEffect = 'instant';
        else if (raw?.pageMode === 'eink') s.turnEffect = 'eink';
        else s.turnEffect = 'curl';
      }
      if (!raw?.progressStyle) {
        s.progressStyle = raw?.showHeaderFooter === false ? 'hidden' : 'line';
      }
      if (!raw?.headingFont) s.headingFont = 'cormorant';
      return s;
    }

    normalizeShelfConfig(raw) {
      const def = window.PaperInkShelfDecor?.DEFAULT_SHELF_CONFIG || {};
      const merged = { ...structuredClone(def), ...(raw || {}) };
      if (!Array.isArray(merged.placedStickers)) merged.placedStickers = [];
      if (!merged.bgMode) merged.bgMode = 'color';
      if (!merged.bgColor || !/^#[0-9a-fA-F]{6}$/.test(merged.bgColor)) {
        merged.bgColor = '#F5F5F7';
      }
      return merged;
    }

    async loadLocalData() {
      try {
        const savedState = await window.PaperInkDB.getKV('state');
        if (savedState && typeof savedState === 'object') {
          this.state = {
            progress: savedState.progress || {},
            bookmarks: savedState.bookmarks || {},
            highlights: savedState.highlights || {},
            bookReviews: savedState.bookReviews || {},
            inkNotes: savedState.inkNotes || {},
            vocab: Array.isArray(savedState.vocab) ? savedState.vocab : [],
            deletedIds: savedState.deletedIds || {},
            settings: this.normalizeSettings(savedState.settings),
            readingStats: {
              dailyMinutes: savedState.readingStats?.dailyMinutes || {},
              dailyGoalMinutes: savedState.readingStats?.dailyGoalMinutes || 30,
              pagesTurned: savedState.readingStats?.pagesTurned || 0,
              updatedAt: savedState.readingStats?.updatedAt || 0,
            },
            shelfConfig: this.normalizeShelfConfig(savedState.shelfConfig),
          };
        }

        const cachedCatalog = await window.PaperInkDB.getKV('libraryCatalog');
        if (Array.isArray(cachedCatalog)) {
          this.serverBooks = cachedCatalog;
        }

        const wpBlob = await window.PaperInkDB.getKV('customWallpaper');
        if (wpBlob instanceof Blob) {
          this.customWallpaperUrl = URL.createObjectURL(wpBlob);
        }

        await this.reloadCustomFonts();
        await this.reloadCustomStickers();
        await this.reloadOfflineMeta();
      } catch (err) {
        console.warn('[PaperInk] Local load warning:', err);
      }
    }

    async reloadCustomFonts() {
      try {
        const list = await window.PaperInkDB.listCustomFonts();
        this.customFonts = (list || [])
          .filter((f) => f && f.blob instanceof Blob)
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        this.customFontMap.clear();
        for (const f of this.customFonts) {
          this.customFontMap.set(f.id, f);
          if (!this.loadedFontFamilies.has(f.cssFamily)) {
            try {
              const buf = await f.blob.arrayBuffer();
              const face = new FontFace(f.cssFamily, buf);
              await face.load();
              document.fonts.add(face);
              this.loadedFontFamilies.add(f.cssFamily);
            } catch (err) {
              console.warn('[PaperInk] Font load failed:', f.name, err);
            }
          }
        }
      } catch (_) {}
    }

    async handleFontUpload(files) {
      if (!files || !files.length) return;
      let loadedCount = 0;
      let lastId = null;

      for (const file of Array.from(files)) {
        if (!/\.(ttf|otf|woff|woff2)$/i.test(file.name)) continue;
        const cleanName = file.name
          .replace(/\.[^.]+$/, '')
          .replace(/[_-]+/g, ' ')
          .trim()
          .slice(0, 26) || 'Custom Font';
        const id = uid('cfont');
        const cssFamily = `PIFont_${id.replace(/[^a-zA-Z0-9]/g, '')}`;

        try {
          const buf = await file.arrayBuffer();
          const face = new FontFace(cssFamily, buf);
          await face.load();
          document.fonts.add(face);
          this.loadedFontFamilies.add(cssFamily);

          await window.PaperInkDB.saveCustomFont({
            id,
            name: cleanName,
            cssFamily,
            blob: file,
            createdAt: Date.now(),
          });
          lastId = id;
          loadedCount++;
        } catch (err) {
          console.warn('[PaperInk] Invalid font file:', file.name, err);
        }
      }

      if (loadedCount > 0) {
        await this.reloadCustomFonts();
        if (lastId) {
          this.updateSettings({ fontFamily: lastId });
        } else {
          this.syncSettingsControls();
        }
        this.toast(`Đã tải ${loadedCount} font chữ riêng (có thể chọn cho Văn bản hoặc Tiêu đề)!`);
      } else {
        this.toast('File font không hợp lệ — hãy chọn tệp .ttf, .otf, .woff hoặc .woff2');
      }
    }

    async deleteCustomFont(id) {
      await window.PaperInkDB.deleteCustomFont(id);
      await this.reloadCustomFonts();
      const patch = {};
      if (this.state.settings.fontFamily === id) patch.fontFamily = 'literata';
      if (this.state.settings.headingFont === id) patch.headingFont = 'cormorant';
      if (Object.keys(patch).length) {
        this.updateSettings(patch);
      } else {
        this.syncSettingsControls();
      }
      this.toast('Đã gỡ font chữ tải lên');
    }

    resolveFontStack(token, isHeading = false) {
      if (isHeading && (!token || token === 'same')) {
        return this.resolveFontStack(this.state.settings.fontFamily, false);
      }
      const custom = this.customFontMap.get(token);
      if (custom) {
        return `'${custom.cssFamily}', Georgia, serif`;
      }
      return FONT_STACKS[token] || FONT_STACKS.literata;
    }

    async reloadCustomStickers() {
      try {
        const list = await window.PaperInkDB.listCustomStickers();
        for (const old of this.customStickers) {
          if (old.url) URL.revokeObjectURL(old.url);
        }
        this.customStickers = (list || [])
          .filter((s) => s && s.blob instanceof Blob)
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
          .map((s) => ({
            id: s.id,
            name: s.name || 'Sticker',
            url: URL.createObjectURL(s.blob),
            createdAt: s.createdAt || 0,
          }));
        this.customStickerMap = new Map(this.customStickers.map((s) => [s.id, s]));
      } catch (_) {}
    }

    async reloadOfflineMeta() {
      const list = await window.PaperInkDB.listOfflineBookMeta();
      this.offlineMap.clear();
      for (const item of list) {
        if (item.coverBlob && !this.offlineCoverUrls.has(item.id)) {
          this.offlineCoverUrls.set(item.id, URL.createObjectURL(item.coverBlob));
        }
        this.offlineMap.set(item.id, item);
      }
    }

    async refreshFromServer() {
      const dot = document.getElementById('connection-dot');
      const staticHost = this.isStaticWebHost();

      if (!staticHost) {
        try {
          const [libRes, syncRes] = await Promise.all([
            fetch('./api/library', { cache: 'no-store' }),
            fetch('./api/state/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(this.state),
            }),
          ]);

          if (libRes.ok) {
            const libData = await libRes.json();
            if (Array.isArray(libData.books)) {
              this.serverBooks = libData.books;
              window.PaperInkDB.setKV('libraryCatalog', this.serverBooks).catch(() => {});
            }
            this.isOnlineToServer = true;
          }

          if (syncRes.ok) {
            const merged = await syncRes.json();
            this.state = {
              progress: merged.progress || {},
              bookmarks: merged.bookmarks || {},
              highlights: merged.highlights || {},
              bookReviews: merged.bookReviews || {},
              inkNotes: merged.inkNotes || {},
              vocab: Array.isArray(merged.vocab) ? merged.vocab : [],
              deletedIds: merged.deletedIds || {},
              settings: this.normalizeSettings(merged.settings || this.state.settings),
              readingStats: {
                dailyMinutes: merged.readingStats?.dailyMinutes || {},
                dailyGoalMinutes: merged.readingStats?.dailyGoalMinutes || 30,
                pagesTurned: merged.readingStats?.pagesTurned || 0,
                updatedAt: merged.readingStats?.updatedAt || 0,
              },
              shelfConfig: this.normalizeShelfConfig(merged.shelfConfig || this.state.shelfConfig),
            };
            await window.PaperInkDB.setKV('state', this.state);
            this.applySettingsToDOM();
            this.applyBackgroundToDOM();
          }
        } catch (_) {
          this.isOnlineToServer = false;
        }
      } else {
        this.isOnlineToServer = false;
      }

      // Hide PC-only rescan row when running as standalone public website
      document.getElementById('more-rescan-btn')?.classList.toggle('hidden', !this.isOnlineToServer);

      // Seed 1 public-domain classic starter book when library is completely empty so visitors can test right away
      await this.ensureStarterSampleBook();

      if (dot) {
        if (staticHost) {
          dot.classList.add('online');
          dot.classList.remove('offline');
          dot.title = 'PaperInk Web · Lưu trữ riêng tư ngay trên thiết bị (hỗ trợ Offline)';
        } else {
          dot.classList.toggle('online', this.isOnlineToServer);
          dot.classList.toggle('offline', !this.isOnlineToServer);
          dot.title = this.isOnlineToServer ? 'Đã kết nối thư viện PC' : 'Chế độ Offline';
        }
      }

      this.renderCurrentRoute();
    }

    scheduleSync() {
      window.PaperInkDB.setKV('state', this.state).catch(() => {});
      if (!this.isOnlineToServer || this.isStaticWebHost()) return;
      clearTimeout(this.syncTimer);
      this.syncTimer = setTimeout(async () => {
        try {
          const res = await fetch('./api/state/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.state),
          });
          if (res.ok) this.isOnlineToServer = true;
        } catch (_) {}
      }, 650);
    }

    // ---- State Mutators ----
    updateProgress(bookId, prog) {
      this.state.progress[bookId] = prog;
      this.scheduleSync();
    }

    recordReadingActivity({ minutesDelta = 0, pagesDelta = 0 }) {
      const rs = this.state.readingStats;
      if (!rs.dailyMinutes) rs.dailyMinutes = {};
      const key = todayKey(0);
      if (minutesDelta > 0) {
        rs.dailyMinutes[key] = Number(((rs.dailyMinutes[key] || 0) + minutesDelta).toFixed(2));
      }
      if (pagesDelta > 0) {
        rs.pagesTurned = (rs.pagesTurned || 0) + pagesDelta;
      }
      rs.updatedAt = Date.now();
      this.scheduleSync();
    }

    addBookmark(bookId, bm) {
      if (!Array.isArray(this.state.bookmarks[bookId])) this.state.bookmarks[bookId] = [];
      this.state.bookmarks[bookId].unshift(bm);
      this.scheduleSync();
    }

    deleteBookmark(bookId, bmId) {
      if (!Array.isArray(this.state.bookmarks[bookId])) return;
      this.state.bookmarks[bookId] = this.state.bookmarks[bookId].filter((b) => b.id !== bmId);
      this.state.deletedIds[bmId] = Date.now();
      this.scheduleSync();
    }

    addHighlight(bookId, hl) {
      if (!Array.isArray(this.state.highlights[bookId])) this.state.highlights[bookId] = [];
      this.state.highlights[bookId].unshift(hl);
      this.scheduleSync();
    }

    updateHighlight(bookId, hlId, patch) {
      const list = this.state.highlights[bookId] || [];
      const item = list.find((h) => h.id === hlId);
      if (!item) return;
      Object.assign(item, patch, { updatedAt: Date.now() });
      this.scheduleSync();
    }

    deleteHighlight(bookId, hlId) {
      if (!Array.isArray(this.state.highlights[bookId])) return;
      this.state.highlights[bookId] = this.state.highlights[bookId].filter((h) => h.id !== hlId);
      this.state.deletedIds[hlId] = Date.now();
      this.scheduleSync();
    }

    isVocabWordSaved(word) {
      const norm = String(word || '').trim().toLowerCase();
      return this.state.vocab.some((v) => (v.word || '').toLowerCase() === norm);
    }

    addVocabWord(entry) {
      const norm = String(entry.word || '').trim().toLowerCase();
      if (!norm) return false;
      if (this.isVocabWordSaved(norm)) {
        this.toast('Từ này đã có trong Sổ từ vựng');
        return true;
      }
      this.state.vocab.unshift({
        id: uid('voc'),
        ...entry,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      this.scheduleSync();
      this.toast(`Đã lưu "${entry.word}" vào Sổ từ vựng`);
      return true;
    }

    deleteVocabWord(id) {
      this.state.vocab = this.state.vocab.filter((v) => v.id !== id);
      this.state.deletedIds[id] = Date.now();
      this.scheduleSync();
    }

    // ---- Book Rating & Review Mutators ----
    getBookReview(bookId) {
      return this.state.bookReviews?.[bookId] || { rating: 0, review: '', updatedAt: 0 };
    }

    setBookRating(bookId, value) {
      if (!bookId) return;
      const cur = this.getBookReview(bookId);
      const nextRating = cur.rating === value ? 0 : Math.max(0, Math.min(5, value));
      this.state.bookReviews[bookId] = {
        ...cur,
        rating: nextRating,
        updatedAt: Date.now(),
      };
      this.scheduleSync();
      if (this.activeBookInfoId === bookId && document.getElementById('book-info-modal')?.classList.contains('open')) {
        this.renderBookInfoModal(bookId);
      }
      if (!document.getElementById('library-view')?.classList.contains('hidden')) {
        this.renderCurrentRoute();
      }
      this.toast(nextRating > 0 ? `Đã đánh giá ${nextRating}/5 sao` : 'Đã gỡ đánh giá sao');
    }

    saveBookReview(bookId, reviewText) {
      if (!bookId) return;
      const cur = this.getBookReview(bookId);
      this.state.bookReviews[bookId] = {
        ...cur,
        review: String(reviewText || '').trim(),
        updatedAt: Date.now(),
      };
      this.scheduleSync();
      if (!document.getElementById('library-view')?.classList.contains('hidden')) {
        this.renderCurrentRoute();
      }
      this.toast('Đã lưu cảm nhận của bạn về cuốn sách');
    }

    renderStarRating(bookId, rating = 0, size = 'md') {
      const val = Math.max(0, Math.min(5, Number(rating) || 0));
      return `
        <div class="star-rating star-rating-${size}" role="group" aria-label="Đánh giá sách (${val}/5 sao)">
          ${[1, 2, 3, 4, 5]
            .map(
              (n) => `
              <button class="star-btn ${n <= val ? 'filled' : ''}"
                      data-rate-book="${escHtml(bookId)}"
                      data-rate-val="${n}"
                      type="button"
                      title="Đánh giá ${n} sao"
                      aria-label="Đánh giá ${n} sao">
                ${n <= val ? ICONS.starFilled : ICONS.starOutline}
              </button>
            `
            )
            .join('')}
        </div>
      `;
    }

    // ---- S Pen Ink Canvas Persistence ----
    loadInkForPage(bookId, pageKey, meta) {
      const saved = this.state.inkNotes?.[bookId]?.[pageKey];
      this.inkCanvas?.loadPage({
        bookId,
        pageKey,
        strokes: Array.isArray(saved?.strokes) ? saved.strokes : [],
        meta,
      });
    }

    saveInkPage(bookId, pageKey, strokes, meta) {
      if (!bookId || !pageKey) return;
      if (!this.state.inkNotes[bookId]) this.state.inkNotes[bookId] = {};
      if (!Array.isArray(strokes) || strokes.length === 0) {
        this.state.inkNotes[bookId][pageKey] = {
          strokes: [],
          updatedAt: Date.now(),
        };
      } else {
        this.state.inkNotes[bookId][pageKey] = {
          strokes,
          chapterIndex: meta?.chapterIndex ?? this.reader.chapterIndex ?? 0,
          chapterTitle: meta?.chapterTitle || '',
          pageLabel: meta?.pageLabel || '',
          progressRatio: meta?.progressRatio ?? 0,
          updatedAt: Date.now(),
        };
      }
      this.scheduleSync();
    }

    deleteInkPage(bookId, pageKey) {
      if (!this.state.inkNotes?.[bookId]?.[pageKey]) return;
      this.state.inkNotes[bookId][pageKey] = { strokes: [], updatedAt: Date.now() };
      this.scheduleSync();
      if (this.inkCanvas?.bookId === bookId && this.inkCanvas?.pageKey === pageKey) {
        this.inkCanvas.strokes = [];
        this.inkCanvas.redoStack = [];
        this.inkCanvas.redraw();
        this.inkCanvas.syncToolbarUI();
      }
      this.toast('Đã xóa ghi chú viết tay trên trang đó');
    }

    updateSettings(patch) {
      this.state.settings = {
        ...this.state.settings,
        ...patch,
        updatedAt: Date.now(),
      };
      this.applySettingsToDOM();
      this.scheduleSync();
    }

    updateShelfConfig(patch, rerenderShelf = true) {
      this.state.shelfConfig = {
        ...this.state.shelfConfig,
        ...patch,
        updatedAt: Date.now(),
      };
      this.applyBackgroundToDOM();
      this.renderStudioSheet();
      if (rerenderShelf && (this.route === 'shelf' || this.drilldown)) {
        this.renderShelfPage();
      }
      this.scheduleSync();
    }

    applySettingsToDOM() {
      const s = this.state.settings;
      const root = document.documentElement;
      root.setAttribute('data-theme', s.theme || 'apple');
      root.classList.toggle('paper-grain-on', Boolean(s.paperGrain));
      root.classList.toggle('grayscale-on', Boolean(s.grayscale) || s.theme === 'eink');

      root.style.setProperty('--reader-font', this.resolveFontStack(s.fontFamily, false));
      root.style.setProperty('--reader-heading-font', this.resolveFontStack(s.headingFont, true));
      root.style.setProperty('--reader-size', `${s.fontSize}px`);
      root.style.setProperty('--reader-heading-size', `${s.headingSize || 28}px`);
      root.style.setProperty('--reader-weight', String(s.fontWeight || 420));
      root.style.setProperty('--reader-lh', String(s.lineHeight || 1.68));
      root.style.setProperty('--reader-letter-spacing', `${Number(s.letterSpacing || 0).toFixed(2)}em`);
      root.style.setProperty('--reader-word-spacing', `${Number(s.wordSpacing || 0).toFixed(2)}em`);
      root.style.setProperty('--reader-para-gap', `${Number(s.paraGap ?? 0.62).toFixed(2)}em`);
      root.style.setProperty('--reader-align', s.textAlign || 'justify');

      const marginMap = { narrow: '14px', medium: '24px', wide: '40px' };
      root.style.setProperty('--reader-pad-x', marginMap[s.margin] || '24px');

      const progBg =
        s.progressColorMode === 'gradient'
          ? `linear-gradient(90deg, ${s.progressGradStart || '#0071E3'}, ${s.progressGradEnd || '#AF52DE'})`
          : s.progressSolidColor || '#0071E3';
      root.style.setProperty('--reader-progress-bg', progBg);

      const dimOverlay = document.getElementById('extra-dim-overlay');
      if (dimOverlay) {
        dimOverlay.style.opacity = String(Math.max(0, Math.min(0.78, (s.extraDim || 0) / 100)));
      }
      const warmOverlay = document.getElementById('warmth-overlay');
      if (warmOverlay) {
        warmOverlay.style.opacity = String(Math.max(0, Math.min(0.45, ((s.warmth || 0) / 100) * 0.65)));
      }

      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute(
          'content',
          this.state.shelfConfig.bgMode === 'color'
            ? this.state.shelfConfig.bgColor
            : THEME_META_COLORS[s.theme] || '#F5F5F7'
        );
      }

      this.syncSettingsControls();
      this.reader.applyVisualMode();
      this.inkCanvas?.redraw();
    }

    applyBackgroundToDOM() {
      const cfg = this.state.shelfConfig;
      const libView = document.getElementById('library-view');
      const wpEl = document.getElementById('library-wallpaper');
      const ambEl = document.getElementById('library-wallpaper-ambient');
      const scrimEl = document.getElementById('library-wallpaper-scrim');
      if (!libView || !wpEl || !scrimEl || !ambEl) return;

      const useImage = cfg.bgMode === 'image' && Boolean(this.customWallpaperUrl);
      if (useImage) {
        wpEl.style.backgroundColor = '#141416';
        wpEl.style.backgroundImage = `url("${this.customWallpaperUrl}")`;
        wpEl.style.backgroundSize = 'cover';
        wpEl.style.backgroundPosition = 'center';
        const blurPx = Number(cfg.bgBlur || 0);
        wpEl.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : '';
        wpEl.style.transform = blurPx > 0 ? 'scale(1.06)' : '';
        const dimPct = Number(cfg.bgDim || 0) / 100;
        scrimEl.style.opacity = String(Math.max(0, Math.min(0.78, dimPct)));
        ambEl.style.opacity = '0';
        // Treat dimmed photos (>= 25% dim) as dark surface for crisp legibility
        libView.classList.toggle('wp-dark', dimPct >= 0.25);
      } else {
        const hex = cfg.bgColor || '#F5F5F7';
        wpEl.style.backgroundImage = 'none';
        wpEl.style.backgroundColor = hex;
        wpEl.style.filter = '';
        wpEl.style.transform = '';
        scrimEl.style.opacity = '0';
        const isDark = hexLuminance(hex) < 0.28;
        libView.classList.toggle('wp-dark', isDark);
        ambEl.style.opacity = cfg.bgAmbient !== false ? '1' : '0';
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.setAttribute('content', hex);
      }
    }

    syncSettingsControls() {
      const s = this.state.settings;
      document.querySelectorAll('.theme-swatch').forEach((el) => {
        el.classList.toggle('active', el.dataset.theme === s.theme);
      });

      // Custom Uploaded Fonts Chips
      const customRow = document.getElementById('custom-fonts-row');
      const customChips = document.getElementById('custom-fonts-chips');
      if (customRow && customChips) {
        customRow.classList.toggle('hidden', this.customFonts.length === 0);
        customChips.innerHTML = this.customFonts
          .map(
            (f) => `
            <span class="font-chip" style="font-family:'${escHtml(f.cssFamily)}', serif">
              <span>${escHtml(f.name)}</span>
              <button class="font-chip-del" data-delete-font="${escHtml(f.id)}" type="button" aria-label="Gỡ font ${escHtml(f.name)}" title="Gỡ font">${ICONS.close}</button>
            </span>
          `
          )
          .join('');
      }

      // Dynamic Body Font Pills (Built-in + Uploaded)
      const bodyPills = document.getElementById('body-font-pills');
      if (bodyPills) {
        const allBody = [
          ...BUILTIN_BODY_FONTS,
          ...this.customFonts.map((f) => ({ id: f.id, label: f.name, custom: true })),
        ];
        bodyPills.innerHTML = allBody
          .map((f) => {
            const stack = this.resolveFontStack(f.id, false);
            return `
              <button class="pill-opt font-pill ${s.fontFamily === f.id ? 'active' : ''} ${f.custom ? 'is-custom' : ''}"
                      data-body-font="${escHtml(f.id)}"
                      style="font-family:${stack.replace(/"/g, "'")}"
                      type="button">${escHtml(f.label)}</button>
            `;
          })
          .join('');
      }

      // Dynamic Heading Font Pills (Different from Body Font!)
      const headingPills = document.getElementById('heading-font-pills');
      if (headingPills) {
        const allHeading = [
          ...BUILTIN_HEADING_FONTS,
          ...this.customFonts.map((f) => ({ id: f.id, label: f.name, custom: true })),
        ];
        headingPills.innerHTML = allHeading
          .map((f) => {
            const stack = this.resolveFontStack(f.id, true);
            return `
              <button class="pill-opt font-pill ${s.headingFont === f.id ? 'active' : ''} ${f.custom ? 'is-custom' : ''}"
                      data-heading-font="${escHtml(f.id)}"
                      style="font-family:${stack.replace(/"/g, "'")}"
                      type="button">${escHtml(f.label)}</button>
            `;
          })
          .join('');
      }

      document.querySelectorAll('.margin-pill').forEach((el) => {
        el.classList.toggle('active', el.dataset.margin === s.margin);
      });
      document.querySelectorAll('.align-pill').forEach((el) => {
        el.classList.toggle('active', el.dataset.align === s.textAlign);
      });
      document.querySelectorAll('.dir-pill').forEach((el) => {
        el.classList.toggle('active', el.dataset.dir === (s.readDirection || 'horizontal'));
      });
      document.querySelectorAll('.effect-pill').forEach((el) => {
        el.classList.toggle('active', el.dataset.effect === (s.turnEffect || 'curl'));
      });
      document.querySelectorAll('.progstyle-pill').forEach((el) => {
        el.classList.toggle('active', el.dataset.progstyle === (s.progressStyle || 'line'));
      });

      const progStyle = s.progressStyle || 'line';
      const hasBar = progStyle === 'line' || progStyle === 'pill';
      const isGrad = s.progressColorMode === 'gradient';

      // Sync compact Live Preview progress bar inside Aa sheet!
      document.getElementById('aa-prev-prog-line')?.classList.toggle('hidden', progStyle !== 'line');
      document.getElementById('aa-prev-prog-pill')?.classList.toggle('hidden', progStyle !== 'pill');
      document.getElementById('aa-prev-prog-pct')?.classList.toggle('hidden', progStyle !== 'percent');

      document.querySelectorAll('.progmode-pill').forEach((el) => {
        el.classList.toggle('active', el.dataset.progmode === (isGrad ? 'gradient' : 'solid'));
      });

      document.getElementById('prog-color-section')?.classList.toggle('hidden', !hasBar);
      document.getElementById('prog-solid-panel')?.classList.toggle('hidden', !hasBar || isGrad);
      document.getElementById('prog-gradient-panel')?.classList.toggle('hidden', !hasBar || !isGrad);

      const solidHex = (s.progressSolidColor || '#0071E3').toUpperCase();
      const solidInp = document.getElementById('prog-solid-input');
      const solidLbl = document.getElementById('prog-solid-hex');
      if (solidInp) solidInp.value = solidHex;
      if (solidLbl) solidLbl.textContent = solidHex;

      const solidSw = document.getElementById('prog-solid-swatches');
      if (solidSw) {
        solidSw.innerHTML = PROGRESS_SOLID_PRESETS.map(
          (c) => `
            <button class="bg-color-dot ${solidHex === c.hex.toUpperCase() ? 'active' : ''}"
                    data-prog-solid="${c.hex}"
                    style="background:${c.hex}"
                    title="${escHtml(c.name)}"
                    aria-label="Màu tiến độ ${escHtml(c.name)}"
                    type="button"></button>
          `
        ).join('');
      }

      const gStart = (s.progressGradStart || '#0071E3').toUpperCase();
      const gEnd = (s.progressGradEnd || '#AF52DE').toUpperCase();
      const gsInp = document.getElementById('prog-grad-start');
      const geInp = document.getElementById('prog-grad-end');
      const gsDot = document.getElementById('prog-grad-start-dot');
      const geDot = document.getElementById('prog-grad-end-dot');
      if (gsInp) gsInp.value = gStart;
      if (geInp) geInp.value = gEnd;
      if (gsDot) gsDot.style.background = gStart;
      if (geDot) geDot.style.background = gEnd;

      const gradSw = document.getElementById('prog-gradient-presets');
      if (gradSw) {
        gradSw.innerHTML = PROGRESS_GRADIENT_PRESETS.map(
          (g) => `
            <button class="grad-preset-chip ${
              gStart === g.start.toUpperCase() && gEnd === g.end.toUpperCase() ? 'active' : ''
            }"
                    data-prog-grad-start="${g.start}"
                    data-prog-grad-end="${g.end}"
                    type="button"
                    title="${escHtml(g.name)}">
              <span class="grad-swatch-bar" style="background:linear-gradient(90deg, ${g.start}, ${g.end})"></span>
              <span>${escHtml(g.name)}</span>
            </button>
          `
        ).join('');
      }

      // Turn effect only applies to horizontal paginated reading
      document.getElementById('turn-effect-row')?.classList.toggle('hidden', s.readDirection === 'vertical');

      const setVal = (id, val, labelId, suffix = '') => {
        const inp = document.getElementById(id);
        if (inp) inp.value = String(val);
        const lbl = document.getElementById(labelId);
        if (lbl) lbl.textContent = `${val}${suffix}`;
      };
      setVal('set-font-size', s.fontSize, 'val-font-size', 'px');
      setVal('set-heading-size', s.headingSize || 28, 'val-heading-size', 'px');
      setVal('set-font-weight', s.fontWeight, 'val-font-weight', '');
      setVal('set-line-height', Number(s.lineHeight || 1.68).toFixed(2), 'val-line-height', '');
      setVal('set-letter-spacing', Number(s.letterSpacing || 0).toFixed(2), 'val-letter-spacing', 'em');
      setVal('set-word-spacing', Number(s.wordSpacing || 0).toFixed(2), 'val-word-spacing', 'em');
      setVal('set-para-gap', Number(s.paraGap ?? 0.62).toFixed(2), 'val-para-gap', 'em');
      setVal('set-extra-dim', s.extraDim, 'val-extra-dim', '%');
      setVal('set-warmth', s.warmth, 'val-warmth', '%');

      const setChk = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.checked = Boolean(val);
      };
      setChk('set-paper-grain', s.paperGrain);
      setChk('set-grayscale', s.grayscale);
      setChk('set-tap-dict', s.tapDict);
      setChk('set-header-footer', s.showHeaderFooter);
      setChk('set-auto-offline', s.autoSaveOffline);
    }

    // ---- Merged Book Data ----
    getMergedBooks() {
      const map = new Map();
      for (const b of this.serverBooks) {
        const isOff = this.offlineMap.has(b.id);
        const offCover = this.offlineCoverUrls.get(b.id);
        map.set(b.id, {
          ...b,
          description: b.description || '',
          genres: Array.isArray(b.genres) && b.genres.length ? b.genres : ['General Fiction'],
          series: b.series || '',
          seriesIndex: b.seriesIndex ?? null,
          isOffline: isOff,
          coverDisplayUrl: offCover || b.coverUrl || null,
          progress: this.state.progress[b.id] || null,
          review: this.state.bookReviews?.[b.id] || null,
        });
      }
      for (const [id, off] of this.offlineMap.entries()) {
        if (!map.has(id)) {
          map.set(id, {
            id: off.id,
            title: off.title,
            author: off.author,
            series: off.series || '',
            seriesIndex: off.seriesIndex ?? null,
            genres: Array.isArray(off.genres) && off.genres.length ? off.genres : ['General Fiction'],
            language: off.language || 'en',
            fileName: off.fileName || '',
            size: off.size || 0,
            mtimeMs: off.savedAt || 0,
            hasCover: Boolean(off.hasCoverBlob),
            isOffline: true,
            isLocalImport: Boolean(off.isLocalImport),
            isDemoSample: Boolean(off.isDemoSample),
            coverDisplayUrl: this.offlineCoverUrls.get(id) || null,
            description: off.description || '',
            progress: this.state.progress[id] || null,
            review: this.state.bookReviews?.[id] || null,
          });
        }
      }
      return Array.from(map.values());
    }

    // ---- Navigation & Route Controller ----
    setRoute(route, drilldown = null) {
      if (this.editStickersMode && route !== 'shelf') {
        this.setEditStickersMode(false);
      }
      this.route = route;
      this.drilldown = drilldown;
      this.renderLimit = 72;
      if (drilldown?.type === 'series') {
        this.sortBy = 'series';
        const sortEl = document.getElementById('lib-sort');
        if (sortEl) sortEl.value = 'series';
      } else if (this.sortBy === 'series' && !drilldown) {
        this.sortBy = 'recent';
        const sortEl = document.getElementById('lib-sort');
        if (sortEl) sortEl.value = 'recent';
      }

      document.querySelectorAll('.btab').forEach((btn) => {
        const active = btn.dataset.route === route;
        btn.classList.toggle('active', active);
        if (active) btn.setAttribute('aria-current', 'page');
        else btn.removeAttribute('aria-current');
      });

      window.scrollTo({ top: 0, behavior: 'auto' });
      this.renderCurrentRoute();
    }

    setSearchOpen(open) {
      this.searchOpen = Boolean(open);
      const drawer = document.getElementById('search-drawer');
      const btn = document.getElementById('lib-search-toggle');
      drawer?.classList.toggle('hidden', !this.searchOpen);
      btn?.setAttribute('aria-expanded', String(this.searchOpen));
      btn?.classList.toggle('active', this.searchOpen);
      if (this.searchOpen) {
        setTimeout(() => document.getElementById('lib-search')?.focus(), 40);
      } else if (this.searchQuery) {
        this.searchQuery = '';
        const inp = document.getElementById('lib-search');
        if (inp) inp.value = '';
        this.renderCurrentRoute();
      }
    }

    setEditStickersMode(active) {
      this.editStickersMode = Boolean(active);
      if (!this.editStickersMode) this.selectedStickerId = null;
      document.getElementById('library-view')?.classList.toggle('edit-stickers-mode', this.editStickersMode);
      document.getElementById('edit-shelf-banner')?.classList.toggle('hidden', !this.editStickersMode);
      document.getElementById('bottom-tabbar')?.classList.toggle('hidden', this.editStickersMode);
      document.getElementById('toggle-drag-mode-btn')?.classList.toggle('active', this.editStickersMode);
      this.updateStickerInspectorUI();
      if (this.route === 'shelf' || this.drilldown) {
        this.renderShelfPage();
      }
    }

    renderCurrentRoute() {
      const pageShelf = document.getElementById('page-shelf');
      const pageCollections = document.getElementById('page-collections');
      const pageProgress = document.getElementById('page-progress');
      const backBtn = document.getElementById('drilldown-back-btn');
      const searchToggle = document.getElementById('lib-search-toggle');

      const isShelfView = this.route === 'shelf' || Boolean(this.drilldown);
      const isCollectionsView = !this.drilldown && ['genres', 'authors', 'series'].includes(this.route);
      const isProgressView = this.route === 'progress';

      pageShelf?.classList.toggle('hidden', !isShelfView);
      pageCollections?.classList.toggle('hidden', !isCollectionsView);
      pageProgress?.classList.toggle('hidden', !isProgressView);
      backBtn?.classList.toggle('hidden', !this.drilldown);
      searchToggle?.classList.toggle('hidden', isProgressView);
      if (isProgressView && this.searchOpen) this.setSearchOpen(false);

      if (isShelfView) {
        this.renderShelfPage();
      } else if (isCollectionsView) {
        this.renderCollectionsPage();
      } else if (isProgressView) {
        this.renderProgressPage();
      }
    }

    // ---- PAGE 1: WOODEN BOOKSHELF + FREEFORM DRAGGABLE STICKERS ----
    renderShelfPage() {
      const all = this.getMergedBooks();
      let scoped = all;
      const titleEl = document.getElementById('view-title');
      const subEl = document.getElementById('lib-subtitle');

      if (this.drilldown) {
        if (this.drilldown.type === 'genre') {
          scoped = all.filter((b) => (b.genres || []).includes(this.drilldown.value));
        } else if (this.drilldown.type === 'author') {
          scoped = all.filter((b) => (b.author || '') === this.drilldown.value);
        } else if (this.drilldown.type === 'series') {
          scoped = all.filter((b) => (b.series || '') === this.drilldown.value);
        }
        if (titleEl) titleEl.textContent = this.drilldown.label;
        if (subEl) subEl.textContent = `${scoped.length} cuốn`;
      } else {
        if (titleEl) titleEl.textContent = 'Kệ sách';
        const offlineCnt = all.filter((b) => b.isOffline).length;
        if (subEl) {
          subEl.textContent = `${all.length} cuốn${offlineCnt ? ` · ${offlineCnt} Offline` : ''}`;
        }
      }

      const readingBooks = scoped
        .filter((b) => b.progress && b.progress.updatedAt)
        .sort((a, b) => (b.progress.updatedAt || 0) - (a.progress.updatedAt || 0));
      const offlineBooks = scoped.filter((b) => b.isOffline);

      const elAll = document.getElementById('tab-count-all');
      const elRead = document.getElementById('tab-count-reading');
      const elOff = document.getElementById('tab-count-offline');
      if (elAll) elAll.textContent = String(scoped.length);
      if (elRead) elRead.textContent = String(readingBooks.length);
      if (elOff) elOff.textContent = String(offlineBooks.length);

      // Compact Apple Now-Reading Banner
      const continueSection = document.getElementById('continue-section');
      const continueStrip = document.getElementById('continue-strip');
      if (continueSection && continueStrip) {
        if (
          !this.drilldown &&
          !this.editStickersMode &&
          this.shelfFilter === 'all' &&
          !this.searchQuery &&
          readingBooks.length > 0
        ) {
          continueSection.classList.remove('hidden');
          continueStrip.innerHTML = readingBooks
            .slice(0, 4)
            .map((b) => this.renderNowReadingChip(b))
            .join('');
        } else {
          continueSection.classList.add('hidden');
        }
      }

      let filtered = scoped;
      if (this.shelfFilter === 'reading') filtered = readingBooks;
      else if (this.shelfFilter === 'offline') filtered = offlineBooks;

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (b) =>
            (b.title || '').toLowerCase().includes(q) ||
            (b.author || '').toLowerCase().includes(q) ||
            (b.series || '').toLowerCase().includes(q) ||
            (b.genres || []).some((g) => g.toLowerCase().includes(q)) ||
            (b.fileName || '').toLowerCase().includes(q)
        );
      }

      filtered = [...filtered];
      if (this.sortBy === 'series') {
        filtered.sort((a, b) => {
          const sa = a.series || 'zzz';
          const sb = b.series || 'zzz';
          if (sa !== sb) return sa.localeCompare(sb, undefined, { sensitivity: 'base' });
          const ia = a.seriesIndex ?? 9999;
          const ib = b.seriesIndex ?? 9999;
          if (ia !== ib) return ia - ib;
          return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
        });
      } else if (this.sortBy === 'recent') {
        filtered.sort((a, b) => {
          const ap = a.progress?.updatedAt || 0;
          const bp = b.progress?.updatedAt || 0;
          if (ap !== bp) return bp - ap;
          return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
        });
      } else if (this.sortBy === 'author') {
        filtered.sort((a, b) =>
          (a.author || '').localeCompare(b.author || '', undefined, { sensitivity: 'base' })
        );
      } else if (this.sortBy === 'newest') {
        filtered.sort((a, b) => (b.mtimeMs || 0) - (a.mtimeMs || 0));
      } else {
        filtered.sort((a, b) =>
          (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
        );
      }

      const container = document.getElementById('books-container');
      const loadMoreWrap = document.getElementById('load-more-wrap');
      if (!container) return;

      if (filtered.length === 0) {
        container.className = '';
        container.innerHTML = `
          <div class="empty-state glass-card">
            <p class="empty-title">${
              this.shelfFilter === 'offline'
                ? 'Chưa có sách nào lưu Offline'
                : this.searchQuery
                ? 'Không tìm thấy cuốn sách phù hợp'
                : 'Kệ sách của bạn đang trống'
            }</p>
            <p class="muted-text">${
              this.searchQuery
                ? 'Thử tìm bằng tên tác giả, thể loại hoặc bộ truyện khác.'
                : 'Chọn file .EPUB trên điện thoại/máy tính (hoặc kéo thả vào đây) để tự động xếp lên kệ gỗ 3D và đọc 100% Offline.'
            }</p>
            ${
              !this.searchQuery
                ? `<div style="margin-top:16px"><button class="apple-pill-btn" data-trigger-import="1" type="button">${ICONS.plus}<span>Thêm sách .EPUB từ máy</span></button></div>`
                : ''
            }
          </div>
        `;
        loadMoreWrap?.classList.add('hidden');
        return;
      }

      const slice = filtered.slice(0, this.renderLimit);
      const style = this.state.shelfConfig.shelfStyle || 'oak';
      const isShelfStyle = ['oak', 'walnut', 'birch', 'slate'].includes(style);

      // Show "Sắp xếp sticker" link only on wooden shelf styles
      document.getElementById('toggle-drag-mode-btn')?.classList.toggle('hidden', !isShelfStyle);

      if (isShelfStyle) {
        container.className = `bookshelf-wall shelf-theme-${style}`;
        container.innerHTML = this.renderWoodenShelves(slice);
      } else if (style === 'list') {
        container.className = 'books-list';
        container.innerHTML = slice.map((b) => this.renderBookRow(b)).join('');
      } else {
        container.className = 'books-grid';
        container.innerHTML = slice.map((b) => this.renderGridBookCard(b)).join('');
      }

      if (loadMoreWrap) {
        const remaining = filtered.length - slice.length;
        if (remaining > 0) {
          loadMoreWrap.classList.remove('hidden');
          const btn = document.getElementById('load-more-btn');
          if (btn) btn.textContent = `Hiện thêm sách (còn ${remaining} cuốn)`;
        } else {
          loadMoreWrap.classList.add('hidden');
        }
      }
    }

    renderStickerContent(stickerId) {
      const builtin = window.PaperInkShelfDecor?.getBuiltinById(stickerId);
      if (builtin) {
        return {
          html: builtin.svg,
          baseWidth: builtin.baseWidth || 72,
          name: builtin.name,
          interactive: builtin.interactive || null,
        };
      }
      const custom = this.customStickerMap.get(stickerId);
      if (custom) {
        return {
          html: `<img src="${escHtml(custom.url)}" alt="${escHtml(custom.name)}" draggable="false" />`,
          baseWidth: 84,
          name: custom.name,
          interactive: null,
        };
      }
      return null;
    }

    renderWoodenShelves(books) {
      const cfg = this.state.shelfConfig;
      const cols = this.computeShelfCols();
      const rows = [];
      for (let i = 0; i < books.length; i += cols) {
        rows.push(books.slice(i, i + cols));
      }

      const showSeriesBadge = this.drilldown?.type === 'series' || this.sortBy === 'series';
      const placed = Array.isArray(cfg.placedStickers) ? cfg.placedStickers : [];

      return rows
        .map((rowBooks, tierIdx) => {
          const cellsHtml = rowBooks.map((b) => this.renderShelfBook(b, showSeriesBadge)).join('');
          const labelsHtml = rowBooks
            .map((b) => {
              const rev = this.getBookReview(b.id);
              const showRatingBar = this.shelfFilter === 'reading' || rev.rating > 0;
              return `
              <div class="shelf-book-caption" data-open-book="${escHtml(b.id)}">
                <div class="shelf-book-title" title="${escHtml(b.title)}">${escHtml(b.title)}</div>
                <div class="shelf-book-author">${escHtml(b.author)}</div>
                ${
                  showRatingBar
                    ? `<div class="shelf-book-rating-row">
                         ${rev.rating > 0 ? `<span class="mini-star-badge">${ICONS.starFilled}<span>${rev.rating}</span></span>` : ''}
                         ${
                           this.shelfFilter === 'reading'
                             ? `<button class="mini-info-link" data-open-book-info="${escHtml(b.id)}" type="button" title="Mô tả & Đánh giá sách">${ICONS.info}<span>Mô tả</span></button>`
                             : ''
                         }
                       </div>`
                    : ''
                }
              </div>
            `;
            })
            .join('');

          // Freeform draggable stickers anchored to this shelf plank
          const tierStickers = placed.filter((st) => (st.shelfIndex || 0) === tierIdx);
          const stickersHtml = tierStickers
            .map((st) => {
              const asset = this.renderStickerContent(st.stickerId);
              if (!asset) return '';
              const isSelected = this.editStickersMode && this.selectedStickerId === st.id;
              const isLampOff = asset.interactive === 'lamp' && !cfg.lampLit;
              const scale = st.scale || 1;
              const rot = st.rotate || 0;
              const flip = st.flipX ? -1 : 1;
              const w = Math.round(asset.baseWidth * scale);
              const xPct = Math.max(4, Math.min(96, st.xPct ?? 50));
              const yOff = st.yOffset ?? 0;

              return `
                <div class="placed-sticker ${isSelected ? 'selected' : ''} ${isLampOff ? 'lamp-off' : ''}"
                     data-placed-id="${escHtml(st.id)}"
                     data-interactive="${escHtml(asset.interactive || '')}"
                     style="left:${xPct}%; bottom:${8 + yOff}px; width:${w}px; transform:translateX(-50%) rotate(${rot}deg) scaleX(${flip});"
                     title="${escHtml(asset.name)}${this.editStickersMode ? ' — kéo để di chuyển' : ''}">
                  ${asset.html}
                </div>
              `;
            })
            .join('');

          return `
            <div class="wooden-shelf-tier" data-shelf-tier="${tierIdx}">
              <div class="wooden-shelf-stage">
                <div class="wooden-shelf-items" style="--shelf-cols:${cols}">
                  ${cellsHtml}
                </div>
                <div class="shelf-sticker-layer" data-sticker-tier="${tierIdx}">
                  ${stickersHtml}
                </div>
                <div class="wooden-plank" aria-hidden="true">
                  <div class="plank-top"></div>
                  <div class="plank-lip"></div>
                  <div class="plank-shadow"></div>
                </div>
              </div>
              <div class="wooden-shelf-labels" style="--shelf-cols:${cols}">
                ${labelsHtml}
              </div>
            </div>
          `;
        })
        .join('');
    }

    renderShelfBook(book, showSeriesBadge = false) {
      const pct = book.progress ? Math.round(book.progress.bookPercent || 0) : 0;
      const isDl = this.downloadingIds.has(book.id);
      const offlineBtnTitle = book.isOffline ? 'Đã lưu Offline (chạm để gỡ)' : 'Lưu đọc Offline';
      const idxBadge =
        showSeriesBadge && book.seriesIndex != null
          ? `<span class="series-num-badge tabular">#${book.seriesIndex}</span>`
          : '';

      // Pure pristine cover: only a whisper-subtle corner badge if saved offline, or hover action on PC
      const offlineIndicator = isDl
        ? `<button class="cover-corner-btn loading" data-toggle-offline="${escHtml(book.id)}" type="button" disabled aria-label="Đang lưu Offline">${ICONS.spinner}</button>`
        : book.isOffline
        ? `<button class="cover-corner-btn saved" data-toggle-offline="${escHtml(book.id)}" type="button" title="${offlineBtnTitle}" aria-label="${offlineBtnTitle}">${ICONS.check}</button>`
        : `<button class="cover-corner-btn hover-only" data-toggle-offline="${escHtml(book.id)}" type="button" title="${offlineBtnTitle}" aria-label="${offlineBtnTitle}">${ICONS.download}</button>`;

      return `
        <article class="shelf-book" data-open-book="${escHtml(book.id)}" tabindex="0" role="button" aria-label="Mở sách ${escHtml(book.title)}">
          <div class="shelf-book-stand">
            <div class="shelf-book-cover">
              ${this.renderCoverMarkup(book)}
              ${idxBadge}
              ${offlineIndicator}
              ${pct > 0 ? `<div class="cover-progress"><div style="width:${pct}%"></div></div>` : ''}
            </div>
            <div class="shelf-book-pages" aria-hidden="true"></div>
          </div>
        </article>
      `;
    }

    renderGridBookCard(book) {
      const pct = book.progress ? Math.round(book.progress.bookPercent || 0) : 0;
      const isDl = this.downloadingIds.has(book.id);
      const offlineBtnTitle = book.isOffline ? 'Đã lưu Offline (chạm để gỡ)' : 'Lưu đọc Offline';
      const showSeriesBadge = this.drilldown?.type === 'series' || this.sortBy === 'series';
      const idxBadge =
        showSeriesBadge && book.seriesIndex != null
          ? `<span class="series-num-badge tabular">#${book.seriesIndex}</span>`
          : '';

      const offlineIndicator = isDl
        ? `<button class="cover-corner-btn loading" data-toggle-offline="${escHtml(book.id)}" type="button" disabled>${ICONS.spinner}</button>`
        : book.isOffline
        ? `<button class="cover-corner-btn saved" data-toggle-offline="${escHtml(book.id)}" type="button" title="${offlineBtnTitle}">${ICONS.check}</button>`
        : `<button class="cover-corner-btn hover-only" data-toggle-offline="${escHtml(book.id)}" type="button" title="${offlineBtnTitle}">${ICONS.download}</button>`;

      return `
        <article class="book-card" data-open-book="${escHtml(book.id)}" tabindex="0" role="button" aria-label="Mở sách ${escHtml(book.title)}">
          <div class="book-cover-wrap">
            ${this.renderCoverMarkup(book)}
            ${idxBadge}
            ${offlineIndicator}
            ${pct > 0 ? `<div class="cover-progress"><div style="width:${pct}%"></div></div>` : ''}
          </div>
          <div class="book-card-title" title="${escHtml(book.title)}">${escHtml(book.title)}</div>
          <div class="book-card-author">${escHtml(book.author)}</div>
        </article>
      `;
    }

    renderBookRow(book) {
      const pct = book.progress ? Math.round(book.progress.bookPercent || 0) : 0;
      const isDl = this.downloadingIds.has(book.id);
      const offlineBtnTitle = book.isOffline ? 'Đã lưu Offline (nhấn để gỡ)' : 'Lưu đọc Offline';
      const offlineIcon = isDl ? ICONS.spinner : book.isOffline ? ICONS.check : ICONS.download;
      const offlineBadge = book.isOffline ? `<span class="offline-pill">Offline</span>` : '';

      return `
        <article class="book-row" data-open-book="${escHtml(book.id)}" tabindex="0" role="button" aria-label="Mở sách ${escHtml(book.title)}">
          <div class="book-row-cover">${this.renderCoverMarkup(book)}</div>
          <div class="book-row-meta">
            <div class="book-row-title">${
              book.seriesIndex != null && this.drilldown?.type === 'series'
                ? `<span class="inline-series-num">#${book.seriesIndex}</span> `
                : ''
            }${escHtml(book.title)}</div>
            <div class="book-row-author">${escHtml(book.author)}${book.series ? ` · ${escHtml(book.series)}` : ''}</div>
            <div class="book-row-sub">
              ${offlineBadge}
              ${pct > 0 ? `<span class="pct-pill tabular">${pct}%</span>` : ''}
              <span class="tabular">${formatBytes(book.size)}</span>
            </div>
          </div>
          <button class="book-offline-btn ${book.isOffline ? 'saved' : ''} ${isDl ? 'loading' : ''}" data-toggle-offline="${escHtml(book.id)}" type="button" title="${offlineBtnTitle}" aria-label="${offlineBtnTitle}" ${isDl ? 'disabled' : ''}>
            ${offlineIcon}
          </button>
        </article>
      `;
    }

    renderCoverMarkup(book) {
      if (book.coverDisplayUrl) {
        return `<img src="${escHtml(book.coverDisplayUrl)}" alt="${escHtml(book.title)}" loading="lazy" decoding="async" onerror="this.parentElement.classList.add('no-img');this.remove();" />`;
      }
      return `
        <div class="cover-fallback">
          <span class="cover-fallback-title">${escHtml(book.title)}</span>
          <span class="cover-fallback-author">${escHtml(book.author)}</span>
        </div>
      `;
    }

    renderNowReadingChip(book) {
      const pct = Math.round(book.progress?.bookPercent || 0);
      const rev = this.getBookReview(book.id);
      const descPreview = (book.description || '').trim();
      return `
        <article class="now-reading-card glass-card" data-open-book="${escHtml(book.id)}" tabindex="0" role="button" aria-label="Đọc tiếp ${escHtml(book.title)}">
          <div class="now-reading-thumb">${this.renderCoverMarkup(book)}</div>
          <div class="now-reading-meta">
            <div class="now-reading-head">
              <div class="now-reading-title">${escHtml(book.title)}</div>
              <button class="book-info-chip" data-open-book-info="${escHtml(book.id)}" type="button" title="Xem mô tả & đánh giá sách" aria-label="Xem mô tả và đánh giá ${escHtml(book.title)}">${ICONS.info}</button>
            </div>
            <div class="now-reading-sub">${escHtml(book.author)}${rev.rating > 0 ? ` <span class="mini-star-badge inline">${ICONS.starFilled}<span>${rev.rating}</span></span>` : ''}</div>
            ${descPreview ? `<div class="now-reading-desc">${escHtml(descPreview)}</div>` : ''}
            <div class="now-reading-prog">
              <div class="mini-bar"><div class="mini-bar-fill" style="width:${pct}%"></div></div>
              <span class="tabular">${pct}%</span>
            </div>
          </div>
        </article>
      `;
    }

    // ---- STICKER PLACEMENT & FREEFORM DRAG ENGINE ----
    addStickerToShelf(stickerId) {
      const placed = [...(this.state.shelfConfig.placedStickers || [])];
      // Ensure we are on a wooden shelf style so user immediately sees their sticker!
      const style = this.state.shelfConfig.shelfStyle || 'oak';
      const nextStyle = ['oak', 'walnut', 'birch', 'slate'].includes(style) ? style : 'oak';

      // Pick a neat staggered xPct on Shelf 0 so multiple stickers don't stack on top of each other
      const sameTier = placed.filter((s) => (s.shelfIndex || 0) === 0);
      const slots = [14, 86, 50, 32, 68, 22, 78];
      const xPct = slots[sameTier.length % slots.length];

      const newSticker = {
        id: uid('st'),
        stickerId,
        shelfIndex: 0,
        xPct,
        yOffset: 0,
        scale: 1,
        rotate: 0,
        flipX: false,
      };
      placed.push(newSticker);
      this.selectedStickerId = newSticker.id;
      this.closeAllSheets();
      if (this.route !== 'shelf' && !this.drilldown) {
        this.setRoute('shelf', null);
      }
      this.updateShelfConfig({ shelfStyle: nextStyle, placedStickers: placed }, false);
      this.setEditStickersMode(true);
      this.toast('Đã dán lên kệ — kéo thả sticker tới bất kỳ vị trí nào!');
    }

    updatePlacedSticker(id, patch, syncImmediate = false) {
      const list = [...(this.state.shelfConfig.placedStickers || [])];
      const item = list.find((s) => s.id === id);
      if (!item) return;
      Object.assign(item, patch);
      this.state.shelfConfig.placedStickers = list;
      this.state.shelfConfig.updatedAt = Date.now();
      if (syncImmediate) this.scheduleSync();
    }

    getSelectedSticker() {
      if (!this.selectedStickerId) return null;
      return (
        (this.state.shelfConfig.placedStickers || []).find((s) => s.id === this.selectedStickerId) ||
        null
      );
    }

    updateStickerInspectorUI() {
      const inspector = document.getElementById('sticker-inspector');
      const st = this.getSelectedSticker();
      if (!inspector) return;
      const show = this.editStickersMode && Boolean(st);
      inspector.classList.toggle('hidden', !show);
      if (show && st) {
        const sc = document.getElementById('insp-scale');
        const rot = document.getElementById('insp-rotate');
        if (sc) sc.value = String(st.scale ?? 1);
        if (rot) rot.value = String(st.rotate ?? 0);
      }
    }

    applyLiveStickerTransform(el, st) {
      const asset = this.renderStickerContent(st.stickerId);
      if (!asset || !el) return;
      const w = Math.round(asset.baseWidth * (st.scale || 1));
      el.style.width = `${w}px`;
      el.style.left = `${st.xPct}%`;
      el.style.bottom = `${8 + (st.yOffset || 0)}px`;
      el.style.transform = `translateX(-50%) rotate(${st.rotate || 0}deg) scaleX(${st.flipX ? -1 : 1})`;
    }

    handleStickerPointerDown(e, stickerEl) {
      const id = stickerEl.dataset.placedId;
      const st = (this.state.shelfConfig.placedStickers || []).find((s) => s.id === id);
      if (!st) return;

      // On touch outside edit mode, ignore normal swipe/scroll (tap on lamp toggles lamp)
      if (!this.editStickersMode && e.pointerType === 'touch') {
        if (stickerEl.dataset.interactive === 'lamp') {
          const nextLit = !this.state.shelfConfig.lampLit;
          this.updateShelfConfig({ lampLit: nextLit });
        }
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (this.editStickersMode) {
        this.selectedStickerId = id;
        document.querySelectorAll('.placed-sticker.selected').forEach((n) => n.classList.remove('selected'));
        stickerEl.classList.add('selected');
        this.updateStickerInspectorUI();
      }

      const stageEl = stickerEl.closest('.wooden-shelf-stage');
      if (!stageEl) return;
      const stageRect = stageEl.getBoundingClientRect();

      stickerEl.setPointerCapture?.(e.pointerId);
      stickerEl.classList.add('dragging');

      const startX = e.clientX;
      const startY = e.clientY;
      const origXPct = st.xPct ?? 50;
      const origYOff = st.yOffset ?? 0;
      let moved = false;

      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
        if (!moved) return;

        // If user dragged with mouse outside edit mode, seamlessly activate edit mode!
        if (!this.editStickersMode && moved) {
          this.editStickersMode = true;
          this.selectedStickerId = id;
          document.getElementById('library-view')?.classList.add('edit-stickers-mode');
          document.getElementById('edit-shelf-banner')?.classList.remove('hidden');
          document.getElementById('bottom-tabbar')?.classList.add('hidden');
          stickerEl.classList.add('selected');
          this.updateStickerInspectorUI();
        }

        const nextXPct = Math.max(3, Math.min(97, origXPct + (dx / Math.max(1, stageRect.width)) * 100));
        const nextYOff = Math.max(-28, Math.min(180, origYOff - dy));

        st.xPct = Number(nextXPct.toFixed(2));
        st.yOffset = Math.round(nextYOff);
        this.applyLiveStickerTransform(stickerEl, st);

        // Highlight target shelf tier when hovering over another wooden shelf!
        document.querySelectorAll('.wooden-shelf-tier.drop-target').forEach((t) =>
          t.classList.remove('drop-target')
        );
        const tiers = Array.from(document.querySelectorAll('.wooden-shelf-tier'));
        for (const t of tiers) {
          const r = t.getBoundingClientRect();
          if (ev.clientY >= r.top && ev.clientY <= r.bottom) {
            const targetIdx = parseInt(t.dataset.shelfTier, 10);
            if (targetIdx !== (st.shelfIndex || 0)) {
              t.classList.add('drop-target');
            }
            break;
          }
        }
      };

      const onUp = (ev) => {
        stickerEl.removeEventListener('pointermove', onMove);
        stickerEl.removeEventListener('pointerup', onUp);
        stickerEl.removeEventListener('pointercancel', onUp);
        stickerEl.classList.remove('dragging');
        document.querySelectorAll('.wooden-shelf-tier.drop-target').forEach((t) =>
          t.classList.remove('drop-target')
        );

        if (!moved) {
          // Pure tap on lamp outside edit mode toggles ambient light
          if (!this.editStickersMode && stickerEl.dataset.interactive === 'lamp') {
            const nextLit = !this.state.shelfConfig.lampLit;
            this.updateShelfConfig({ lampLit: nextLit });
          }
          return;
        }

        // Check if dropped onto another shelf tier!
        const tiers = Array.from(document.querySelectorAll('.wooden-shelf-tier'));
        let droppedTierIdx = st.shelfIndex || 0;
        let droppedStageRect = stageRect;
        for (const t of tiers) {
          const r = t.getBoundingClientRect();
          if (ev.clientY >= r.top - 10 && ev.clientY <= r.bottom + 10) {
            droppedTierIdx = parseInt(t.dataset.shelfTier, 10);
            droppedStageRect = t.querySelector('.wooden-shelf-stage')?.getBoundingClientRect() || r;
            break;
          }
        }

        if (droppedTierIdx !== (st.shelfIndex || 0)) {
          // Re-anchor cleanly onto the new shelf plank!
          const localXPct = Math.max(
            4,
            Math.min(96, ((ev.clientX - droppedStageRect.left) / Math.max(1, droppedStageRect.width)) * 100)
          );
          this.updatePlacedSticker(
            id,
            { shelfIndex: droppedTierIdx, xPct: Number(localXPct.toFixed(2)), yOffset: 0 },
            true
          );
          this.renderShelfPage();
        } else {
          // Soft magnetic snap back to shelf plank if within ±14px of plank surface
          if (Math.abs(st.yOffset) <= 14) {
            st.yOffset = 0;
            this.applyLiveStickerTransform(stickerEl, st);
          }
          this.updatePlacedSticker(id, { xPct: st.xPct, yOffset: st.yOffset }, true);
        }
      };

      stickerEl.addEventListener('pointermove', onMove);
      stickerEl.addEventListener('pointerup', onUp);
      stickerEl.addEventListener('pointercancel', onUp);
    }

    async handleStickerUpload(files) {
      if (!files || !files.length) return;
      let lastId = null;
      let count = 0;
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const id = uid('cstk');
        await window.PaperInkDB.saveCustomSticker({
          id,
          name: file.name.replace(/\.[^.]+$/, '').slice(0, 28) || 'Sticker',
          blob: file,
          createdAt: Date.now(),
        });
        lastId = id;
        count++;
      }
      if (count > 0) {
        await this.reloadCustomStickers();
        this.renderStudioSheet();
        if (lastId) {
          this.addStickerToShelf(lastId);
        }
      } else {
        this.toast('Vui lòng chọn file ảnh PNG, WebP, GIF hoặc SVG');
      }
    }

    async deleteCustomStickerFromPack(stickerId) {
      await window.PaperInkDB.deleteCustomSticker(stickerId);
      // Also remove placed instances of this deleted custom sticker
      const filteredPlaced = (this.state.shelfConfig.placedStickers || []).filter(
        (p) => p.stickerId !== stickerId
      );
      await this.reloadCustomStickers();
      this.updateShelfConfig({ placedStickers: filteredPlaced });
      this.toast('Đã xóa sticker khỏi kho của bạn');
    }

    // ---- PAGE 2: GENRE / AUTHOR / SERIES COLLECTIONS ----
    renderCollectionsPage() {
      const all = this.getMergedBooks();
      const titleEl = document.getElementById('view-title');
      const subEl = document.getElementById('lib-subtitle');
      const grid = document.getElementById('collections-grid');
      if (!grid) return;

      const groups = new Map();
      const type = this.route === 'genres' ? 'genre' : this.route === 'authors' ? 'author' : 'series';

      for (const book of all) {
        if (type === 'genre') {
          for (const g of book.genres || ['General Fiction']) {
            if (!groups.has(g)) groups.set(g, []);
            groups.get(g).push(book);
          }
        } else if (type === 'author') {
          const a = book.author || 'Unknown Author';
          if (!groups.has(a)) groups.set(a, []);
          groups.get(a).push(book);
        } else {
          if (!book.series) continue;
          if (!groups.has(book.series)) groups.set(book.series, []);
          groups.get(book.series).push(book);
        }
      }

      let list = Array.from(groups.entries()).map(([name, books]) => {
        if (type === 'series') {
          books.sort((a, b) => (a.seriesIndex ?? 9999) - (b.seriesIndex ?? 9999));
        }
        const readCount = books.filter((b) => (b.progress?.bookPercent || 0) >= 95).length;
        const activeCount = books.filter((b) => (b.progress?.bookPercent || 0) > 0).length;
        const primaryAuthor = books[0]?.author || '';
        return { name, books, count: books.length, readCount, activeCount, primaryAuthor };
      });

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter(
          (g) => g.name.toLowerCase().includes(q) || g.primaryAuthor.toLowerCase().includes(q)
        );
      }

      list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

      const labels = {
        genre: ['Thể loại', `${list.length} thể loại`],
        author: ['Tác giả', `${list.length} tác giả`],
        series: ['Bộ truyện', `${list.length} bộ truyện · xếp theo tập #1 → #N`],
      };
      if (titleEl) titleEl.textContent = labels[type][0];
      if (subEl) subEl.textContent = labels[type][1];

      if (!list.length) {
        grid.innerHTML = `<div class="empty-state glass-card"><p class="empty-title">Không tìm thấy mục phù hợp</p></div>`;
        return;
      }

      grid.innerHTML = list
        .map((g) => {
          const covers = g.books.slice(0, 3);
          const fanHtml = covers
            .map((b, idx) => `<div class="fan-cover fan-${idx}">${this.renderCoverMarkup(b)}</div>`)
            .join('');

          const pct = g.count > 0 ? Math.round((g.readCount / g.count) * 100) : 0;
          const progressMarkup =
            type === 'series'
              ? `
                <div class="col-series-prog">
                  <div class="mini-bar"><div class="mini-bar-fill" style="width:${pct}%"></div></div>
                  <span class="tabular">${g.readCount}/${g.count}</span>
                </div>
              `
              : `<div class="col-sub-meta">${
                  type === 'author'
                    ? `${new Set(g.books.map((b) => b.series).filter(Boolean)).size || 0} bộ truyện`
                    : `${g.activeCount > 0 ? `${g.activeCount} đang đọc` : `${g.count} đầu sách`}`
                }</div>`;

          return `
            <article class="collection-card glass-card"
                     data-open-collection-type="${type}"
                     data-open-collection-val="${escHtml(g.name)}"
                     tabindex="0"
                     role="button">
              <div class="collection-fan">${fanHtml}</div>
              <div class="collection-meta">
                <div class="collection-top">
                  <h3 class="collection-name">${escHtml(g.name)}</h3>
                  <span class="collection-count tabular">${g.count}</span>
                </div>
                ${type === 'series' && g.primaryAuthor ? `<div class="collection-author">${escHtml(g.primaryAuthor)}</div>` : ''}
                ${progressMarkup}
              </div>
            </article>
          `;
        })
        .join('');
    }

    // ---- PAGE 3: READING PROGRESS DASHBOARD ----
    computeReadingStreak() {
      const dm = this.state.readingStats?.dailyMinutes || {};
      let streak = 0;
      for (let offset = 0; offset >= -365; offset--) {
        const mins = dm[todayKey(offset)] || 0;
        if (mins >= 1) streak++;
        else if (offset === 0) continue;
        else break;
      }
      return streak;
    }

    renderProgressPage() {
      const all = this.getMergedBooks();
      const titleEl = document.getElementById('view-title');
      const subEl = document.getElementById('lib-subtitle');
      const host = document.getElementById('progress-dashboard');
      if (!host) return;

      if (titleEl) titleEl.textContent = 'Tiến độ';

      const rs = this.state.readingStats || { dailyMinutes: {}, dailyGoalMinutes: 30, pagesTurned: 0 };
      const goalMins = rs.dailyGoalMinutes || 30;
      const todayMins = Math.round(rs.dailyMinutes?.[todayKey(0)] || 0);
      const goalPct = Math.min(100, Math.round((todayMins / Math.max(1, goalMins)) * 100));
      const totalMins = Math.round(
        Object.values(rs.dailyMinutes || {}).reduce((sum, v) => sum + (Number(v) || 0), 0)
      );
      const streak = this.computeReadingStreak();

      const startedBooks = all
        .filter((b) => b.progress && (b.progress.updatedAt || (b.progress.bookPercent || 0) > 0))
        .sort((a, b) => (b.progress.updatedAt || 0) - (a.progress.updatedAt || 0));
      const finishedBooks = startedBooks.filter((b) => (b.progress.bookPercent || 0) >= 96);
      const inProgressBooks = startedBooks.filter((b) => (b.progress.bookPercent || 0) < 96);

      const totalHighlights = Object.values(this.state.highlights || {}).reduce(
        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
        0
      );
      const totalVocab = (this.state.vocab || []).length;

      if (subEl) {
        subEl.textContent = `${inProgressBooks.length} đang đọc · ${finishedBooks.length} hoàn thành`;
      }

      const days = [];
      let maxDayMins = Math.max(goalMins, 10);
      for (let i = -6; i <= 0; i++) {
        const val = Math.round(rs.dailyMinutes?.[todayKey(i)] || 0);
        if (val > maxDayMins) maxDayMins = val;
        days.push({ label: dayLabelVi(i), mins: val, isToday: i === 0 });
      }

      const radius = 50;
      const circumference = 2 * Math.PI * radius;
      const dashOffset = circumference * (1 - goalPct / 100);

      let trackerHtml = '';
      if (this.progressTab === 'series') {
        const seriesMap = new Map();
        for (const b of all) {
          if (!b.series) continue;
          if (!seriesMap.has(b.series)) seriesMap.set(b.series, []);
          seriesMap.get(b.series).push(b);
        }
        const seriesArr = Array.from(seriesMap.entries())
          .map(([name, books]) => {
            books.sort((a, b) => (a.seriesIndex ?? 9999) - (b.seriesIndex ?? 9999));
            const avgPct =
              books.reduce((s, b) => s + (b.progress?.bookPercent || 0), 0) / Math.max(1, books.length);
            const done = books.filter((b) => (b.progress?.bookPercent || 0) >= 96).length;
            const started = books.filter((b) => (b.progress?.bookPercent || 0) > 0).length;
            return { name, books, avgPct, done, started, author: books[0]?.author || '' };
          })
          .sort((a, b) => b.avgPct - a.avgPct || b.books.length - a.books.length);

        trackerHtml = seriesArr
          .slice(0, 24)
          .map(
            (s) => `
            <article class="prog-book-card glass-card" data-open-collection-type="series" data-open-collection-val="${escHtml(s.name)}" tabindex="0" role="button">
              <div class="prog-cover">${this.renderCoverMarkup(s.books[0])}</div>
              <div class="prog-body">
                <div class="prog-top">
                  <div>
                    <div class="prog-title">${escHtml(s.name)}</div>
                    <div class="prog-author">${escHtml(s.author)} · ${s.books.length} cuốn</div>
                  </div>
                  <span class="prog-pct tabular">${Math.round(s.avgPct)}%</span>
                </div>
                <div class="prog-bar-track"><div class="prog-bar-fill" style="width:${Math.round(s.avgPct)}%"></div></div>
                <div class="prog-foot">
                  <span class="tabular">Xong ${s.done}/${s.books.length} cuốn${s.started > s.done ? ` · ${s.started - s.done} đang đọc` : ''}</span>
                  <span class="prog-cta-link">Xem bộ ${ICONS.arrowRight}</span>
                </div>
              </div>
            </article>
          `
          )
          .join('');
      } else {
        const list = this.progressTab === 'finished' ? finishedBooks : inProgressBooks;
        if (!list.length) {
          trackerHtml = `
            <div class="empty-state glass-card">
              <p class="empty-title">${
                this.progressTab === 'finished'
                  ? 'Chưa có cuốn sách nào hoàn thành'
                  : 'Chưa có sách đang đọc'
              }</p>
              <p class="muted-text">Mở một cuốn sách bất kỳ trên Kệ sách để bắt đầu ghi nhận thanh tiến độ đọc.</p>
            </div>
          `;
        } else {
          trackerHtml = list
            .map((b) => {
              const pct = Math.min(100, Math.round(b.progress?.bookPercent || 0));
              const minsLeft = b.progress?.estimatedMinsLeft;
              const rev = this.getBookReview(b.id);
              const desc = (b.description || '').trim();
              return `
                <article class="prog-book-card glass-card" data-open-book="${escHtml(b.id)}" tabindex="0" role="button">
                  <div class="prog-cover">${this.renderCoverMarkup(b)}</div>
                  <div class="prog-body">
                    <div class="prog-top">
                      <div>
                        <div class="prog-title">${escHtml(b.title)}</div>
                        <div class="prog-author">${escHtml(b.author)}${b.series ? ` · ${escHtml(b.series)}` : ''}</div>
                      </div>
                      <span class="prog-pct tabular">${pct}%</span>
                    </div>
                    <div class="prog-bar-track"><div class="prog-bar-fill" style="width:${pct}%"></div></div>
                    <div class="prog-rating-row">
                      ${this.renderStarRating(b.id, rev.rating, 'sm')}
                      <button class="prog-info-btn" data-open-book-info="${escHtml(b.id)}" type="button" title="Xem mô tả đầy đủ & viết cảm nhận">
                        ${ICONS.info}<span>${rev.review ? 'Xem cảm nhận' : 'Mô tả & Đánh giá'}</span>
                      </button>
                    </div>
                    ${
                      desc
                        ? `<p class="prog-desc">${escHtml(desc)}</p>`
                        : rev.review
                        ? `<p class="prog-desc prog-review-quote">“${escHtml(rev.review)}”</p>`
                        : ''
                    }
                    ${
                      desc && rev.review
                        ? `<div class="prog-review-pill">${ICONS.note}<span>${escHtml(rev.review)}</span></div>`
                        : ''
                    }
                    <div class="prog-foot">
                      <span>${escHtml(b.progress?.chapterTitle || '')}${
                minsLeft && pct < 96 ? ` · ~${formatMinsShort(minsLeft)} còn lại` : ''
              }</span>
                      <span class="prog-cta-link">${pct >= 96 ? 'Đọc lại' : 'Đọc tiếp'} ${ICONS.arrowRight}</span>
                    </div>
                  </div>
                </article>
              `;
            })
            .join('');
        }
      }

      host.innerHTML = `
        <div class="progress-bento">
          <div class="bento-card glass-card goal-card">
            <div class="goal-ring-wrap">
              <svg class="goal-ring-svg" viewBox="0 0 120 120" aria-hidden="true">
                <circle class="goal-ring-bg" cx="60" cy="60" r="${radius}"/>
                <circle class="goal-ring-fg" cx="60" cy="60" r="${radius}"
                        stroke-dasharray="${circumference.toFixed(2)}"
                        stroke-dashoffset="${dashOffset.toFixed(2)}"/>
              </svg>
              <div class="goal-ring-center">
                <strong class="tabular">${todayMins}</strong>
                <span>/ ${goalMins}p</span>
              </div>
            </div>
            <div class="goal-info">
              <div class="bento-kicker">Mục tiêu hôm nay</div>
              <h2 class="goal-headline">${
                goalPct >= 100
                  ? 'Đã đạt mục tiêu hôm nay'
                  : `Còn ${Math.max(0, goalMins - todayMins)} phút đọc nữa`
              }</h2>
              <div class="streak-badge">${ICONS.flame}<span class="tabular">Chuỗi ${streak} ngày</span></div>
              <div class="goal-presets">
                ${[15, 30, 45, 60]
                  .map(
                    (g) =>
                      `<button class="goal-chip ${goalMins === g ? 'active' : ''}" data-set-goal="${g}" type="button">${g}p</button>`
                  )
                  .join('')}
              </div>
            </div>
          </div>

          <div class="bento-card glass-card">
            <div class="bento-kicker">Tổng quan</div>
            <div class="kpi-grid">
              <div class="kpi-tile"><strong class="tabular">${inProgressBooks.length}</strong><span>Đang đọc</span></div>
              <div class="kpi-tile"><strong class="tabular">${finishedBooks.length}</strong><span>Hoàn thành</span></div>
              <div class="kpi-tile"><strong class="tabular">${formatMinsShort(totalMins)}</strong><span>Tổng thời gian</span></div>
              <div class="kpi-tile"><strong class="tabular">${rs.pagesTurned || 0}</strong><span>Trang đã lật</span></div>
            </div>
            <div class="kpi-foot-note tabular">${totalHighlights} highlight · ${totalVocab} từ vựng</div>
          </div>
        </div>

        <div class="bento-card glass-card">
          <div class="bento-kicker">Nhịp đọc 7 ngày</div>
          <span class="muted-text">Tổng ${formatMinsLong(days.reduce((s, d) => s + d.mins, 0))}</span>
          <div class="week-bars">
            ${days
              .map((d) => {
                const hPct = Math.max(6, Math.round((d.mins / maxDayMins) * 100));
                return `
                  <div class="week-bar-col ${d.isToday ? 'today' : ''}">
                    <span class="week-bar-val tabular">${d.mins > 0 ? `${d.mins}p` : ''}</span>
                    <div class="week-bar-track"><div class="week-bar-fill" style="height:${hPct}%"></div></div>
                    <span class="week-bar-day">${d.label}</span>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>

        <div class="progress-tracker-section">
          <div class="progress-tracker-head">
            <h2 class="section-title">Tiến độ từng sách</h2>
            <div class="ios-segmented compact prog-tabs" role="tablist">
              <button class="seg-opt ${this.progressTab === 'reading' ? 'active' : ''}" data-progtab="reading" type="button">Đang đọc (${inProgressBooks.length})</button>
              <button class="seg-opt ${this.progressTab === 'finished' ? 'active' : ''}" data-progtab="finished" type="button">Đã xong (${finishedBooks.length})</button>
              <button class="seg-opt ${this.progressTab === 'series' ? 'active' : ''}" data-progtab="series" type="button">Bộ truyện</button>
            </div>
          </div>
          <div class="prog-books-list">${trackerHtml}</div>
        </div>
      `;
    }

    // ---- STUDIO SHEET (KỆ GỖ, MÀU/ẢNH NỀN, TẢI STICKER) ----
    openStudioSheet() {
      this.closeAllSheets();
      this.renderStudioSheet();
      document.getElementById('studio-backdrop')?.classList.add('open');
      document.getElementById('studio-sheet')?.classList.add('open');
    }

    openMoreSheet() {
      this.closeAllSheets();
      document.getElementById('more-backdrop')?.classList.add('open');
      document.getElementById('more-sheet')?.classList.add('open');
    }

    renderStudioSheet() {
      const decorMod = window.PaperInkShelfDecor;
      if (!decorMod) return;
      const cfg = this.state.shelfConfig;

      // 1. Shelf Styles
      const styleGrid = document.getElementById('shelf-style-grid');
      if (styleGrid) {
        styleGrid.innerHTML = decorMod.SHELF_STYLES.map(
          (s) => `
            <button class="shelf-style-card ${cfg.shelfStyle === s.id ? 'active' : ''}" data-shelf-style="${s.id}" type="button">
              <span class="shelf-swatch shelf-swatch-${s.id}" aria-hidden="true"></span>
              <span>${escHtml(s.name)}</span>
            </button>
          `
        ).join('');
      }

      // 2. Background mode (Color Picker vs Image Upload)
      const isImgMode = cfg.bgMode === 'image';
      document.querySelectorAll('.bg-mode-pill').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.bgmode === (isImgMode ? 'image' : 'color'));
      });
      document.getElementById('bg-color-panel')?.classList.toggle('hidden', isImgMode);
      document.getElementById('bg-image-panel')?.classList.toggle('hidden', !isImgMode);

      const colorInp = document.getElementById('custom-bg-color-input');
      const hexLbl = document.getElementById('custom-bg-hex');
      if (colorInp) colorInp.value = cfg.bgColor || '#F5F5F7';
      if (hexLbl) hexLbl.textContent = (cfg.bgColor || '#F5F5F7').toUpperCase();

      const ambChk = document.getElementById('set-bg-ambient');
      if (ambChk) ambChk.checked = cfg.bgAmbient !== false;

      const swBox = document.getElementById('bg-color-swatches');
      if (swBox) {
        swBox.innerHTML = decorMod.BG_COLORS.map(
          (c) => `
            <button class="bg-color-dot ${(cfg.bgColor || '').toUpperCase() === c.hex.toUpperCase() ? 'active' : ''}"
                    data-pick-color="${c.hex}"
                    style="background:${c.hex}"
                    title="${escHtml(c.name)}"
                    aria-label="Màu nền ${escHtml(c.name)}"
                    type="button"></button>
          `
        ).join('');
      }

      document.getElementById('clear-wallpaper-btn')?.classList.toggle('hidden', !this.customWallpaperUrl);
      const blurInp = document.getElementById('set-wp-blur');
      const blurVal = document.getElementById('val-wp-blur');
      if (blurInp) blurInp.value = String(cfg.bgBlur || 0);
      if (blurVal) blurVal.textContent = `${cfg.bgBlur || 0}px`;
      const dimInp = document.getElementById('set-wp-dim');
      const dimVal = document.getElementById('val-wp-dim');
      if (dimInp) dimInp.value = String(cfg.bgDim || 0);
      if (dimVal) dimVal.textContent = `${cfg.bgDim || 0}%`;

      // 3. Custom uploaded stickers
      const customGrid = document.getElementById('custom-stickers-grid');
      if (customGrid) {
        if (!this.customStickers.length) {
          customGrid.innerHTML = `<div class="sticker-empty-hint">Chưa có sticker tải lên — bấm <strong>Tải Sticker (PNG/WebP)</strong> ở trên để thêm sticker yêu thích rồi kéo thả tự do lên kệ!</div>`;
        } else {
          customGrid.innerHTML = this.customStickers
            .map(
              (s) => `
              <div class="sticker-pack-card" data-place-sticker="${escHtml(s.id)}" role="button" tabindex="0">
                <div class="sticker-pack-thumb"><img src="${escHtml(s.url)}" alt="${escHtml(s.name)}" /></div>
                <div class="sticker-pack-name">${escHtml(s.name)}</div>
                <button class="sticker-del-pack" data-delete-custom-sticker="${escHtml(s.id)}" type="button" title="Xóa khỏi kho sticker" aria-label="Xóa sticker">${ICONS.close}</button>
              </div>
            `
            )
            .join('');
        }
      }

      // 4. Built-in minimalist stickers
      const builtinGrid = document.getElementById('builtin-stickers-grid');
      if (builtinGrid) {
        builtinGrid.innerHTML = decorMod.BUILTIN_STICKERS.map(
          (d) => `
            <button class="sticker-pack-card" data-place-sticker="${d.id}" type="button">
              <div class="sticker-pack-thumb">${d.svg}</div>
              <div class="sticker-pack-name">${escHtml(d.name)}</div>
              <span class="sticker-add-plus" aria-hidden="true">${ICONS.plus}</span>
            </button>
          `
        ).join('');
      }
    }

    async handleWallpaperUpload(file) {
      if (!file || !file.type.startsWith('image/')) {
        this.toast('Vui lòng chọn tệp ảnh hợp lệ');
        return;
      }
      await window.PaperInkDB.setKV('customWallpaper', file);
      if (this.customWallpaperUrl) URL.revokeObjectURL(this.customWallpaperUrl);
      this.customWallpaperUrl = URL.createObjectURL(file);
      this.updateShelfConfig({
        bgMode: 'image',
        bgDim: Math.max(15, this.state.shelfConfig.bgDim || 15),
      }, false);
      this.toast('Đã đặt hình nền riêng!');
    }

    async clearCustomWallpaper() {
      await window.PaperInkDB.setKV('customWallpaper', null);
      if (this.customWallpaperUrl) {
        URL.revokeObjectURL(this.customWallpaperUrl);
        this.customWallpaperUrl = null;
      }
      this.updateShelfConfig({ bgMode: 'color', bgBlur: 0, bgDim: 0 }, false);
      this.toast('Đã chuyển về nền màu');
    }

    // ---- Open / Download / Import EPUB ----
    async downloadBookOffline(bookId, silent = false) {
      const book = this.getMergedBooks().find((b) => b.id === bookId);
      if (!book || this.downloadingIds.has(bookId)) return null;

      this.downloadingIds.add(bookId);
      if (!silent) this.renderCurrentRoute();

      try {
        const res = await fetch(`./api/books/${encodeURIComponent(bookId)}/file`);
        if (!res.ok) throw new Error('Download failed');
        const epubBlob = await res.blob();

        let coverBlob = null;
        if (book.coverUrl) {
          try {
            const cRes = await fetch(book.coverUrl);
            if (cRes.ok) coverBlob = await cRes.blob();
          } catch (_) {}
        }

        await window.PaperInkDB.saveOfflineBook({
          id: book.id,
          title: book.title,
          author: book.author,
          series: book.series || '',
          seriesIndex: book.seriesIndex ?? null,
          genres: Array.isArray(book.genres) ? book.genres : [],
          description: book.description || '',
          language: book.language || 'en',
          fileName: book.fileName || '',
          size: epubBlob.size,
          savedAt: Date.now(),
          isLocalImport: false,
          coverBlob,
          epubBlob,
        });

        await this.reloadOfflineMeta();
        if (!silent) this.toast(`Đã lưu "${book.title}" đọc Offline!`);
        return epubBlob;
      } catch (_) {
        if (!silent) this.toast('Không thể lưu Offline (kiểm tra kết nối PC)');
        return null;
      } finally {
        this.downloadingIds.delete(bookId);
        this.renderCurrentRoute();
      }
    }

    async toggleBookOffline(bookId) {
      const off = this.offlineMap.get(bookId);
      if (off) {
        if (off.isLocalImport) {
          if (!confirm(`Xóa "${off.title}" khỏi thiết bị này?`)) return;
        }
        if (off.isDemoSample) {
          localStorage.setItem('paperink_demo_dismissed', '1');
        }
        await window.PaperInkDB.deleteOfflineBook(bookId);
        if (this.offlineCoverUrls.has(bookId)) {
          URL.revokeObjectURL(this.offlineCoverUrls.get(bookId));
          this.offlineCoverUrls.delete(bookId);
        }
        await this.reloadOfflineMeta();
        this.renderCurrentRoute();
        this.toast('Đã gỡ sách khỏi thiết bị');
      } else {
        await this.downloadBookOffline(bookId, false);
      }
    }

    async openBookById(bookId) {
      if (this.editStickersMode) return;
      const book = this.getMergedBooks().find((b) => b.id === bookId);
      if (!book) return;

      try {
        let epubBlob = null;
        const offlineRec = await window.PaperInkDB.getOfflineBook(bookId);
        if (offlineRec && offlineRec.epubBlob) {
          epubBlob = offlineRec.epubBlob;
        } else {
          this.toast('Đang mở sách…');
          const res = await fetch(`./api/books/${encodeURIComponent(bookId)}/file`);
          if (!res.ok) throw new Error('Không thể tải sách từ PC');
          epubBlob = await res.blob();

          if (this.state.settings.autoSaveOffline) {
            let coverBlob = null;
            if (book.coverUrl) {
              try {
                const cRes = await fetch(book.coverUrl);
                if (cRes.ok) coverBlob = await cRes.blob();
              } catch (_) {}
            }
            window.PaperInkDB.saveOfflineBook({
              id: book.id,
              title: book.title,
              author: book.author,
              series: book.series || '',
              seriesIndex: book.seriesIndex ?? null,
              genres: Array.isArray(book.genres) ? book.genres : [],
              description: book.description || '',
              language: book.language || 'en',
              fileName: book.fileName || '',
              size: epubBlob.size,
              savedAt: Date.now(),
              isLocalImport: false,
              coverBlob,
              epubBlob,
            })
              .then(() => this.reloadOfflineMeta())
              .catch(() => {});
          }
        }

        document.getElementById('library-view')?.classList.add('hidden');
        await this.reader.openBook(book, epubBlob, this.state.progress[book.id]);
      } catch (err) {
        console.error(err);
        this.toast(
          this.isOnlineToServer
            ? 'Không mở được file EPUB này.'
            : 'Sách chưa lưu Offline — hãy nhập file .EPUB trực tiếp từ máy.'
        );
        document.getElementById('library-view')?.classList.remove('hidden');
      }
    }

    async importLocalEpubFiles(files) {
      if (!files || !files.length) return;
      let imported = 0;
      for (const file of Array.from(files)) {
        if (!/\.epub$/i.test(file.name)) continue;
        try {
          const parsed = await window.PaperInkEpub.loadFromBlob(file);
          const coverBlob = await parsed.getCoverBlob();
          const id = `local_${file.name.replace(/[^a-z0-9]/gi, '_').slice(0, 24)}_${file.size}`;
          await window.PaperInkDB.saveOfflineBook({
            id,
            title: parsed.meta.title || file.name.replace(/\.epub$/i, ''),
            author: parsed.meta.author || 'Unknown Author',
            series: parsed.meta.series || '',
            seriesIndex: parsed.meta.seriesIndex ?? null,
            genres: Array.isArray(parsed.meta.genres) ? parsed.meta.genres : [],
            description: parsed.meta.description || '',
            language: parsed.meta.language || 'en',
            fileName: file.name,
            size: file.size,
            savedAt: Date.now(),
            isLocalImport: true,
            coverBlob,
            epubBlob: file,
          });
          parsed.destroy();
          imported++;
        } catch (err) {
          console.error('Import EPUB error:', err);
        }
      }
      if (imported > 0) {
        await this.reloadOfflineMeta();
        this.renderCurrentRoute();
        this.toast(`Đã thêm ${imported} cuốn EPUB vào kệ Offline!`);
      } else {
        this.toast('Vui lòng chọn tệp .epub hợp lệ');
      }
    }

    // ---- Drawers: TOC / Bookmarks / Highlights ----
    openNavDrawer(initialTab = 'toc') {
      this.closeAllSheets();
      document.getElementById('nav-drawer-backdrop')?.classList.add('open');
      document.getElementById('nav-drawer')?.classList.add('open');
      this.switchNavTab(initialTab);
    }

    switchNavTab(tab) {
      document.querySelectorAll('.drawer-tab').forEach((t) => {
        const isActive = t.dataset.navtab === tab;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', String(isActive));
      });
      const body = document.getElementById('nav-drawer-body');
      if (!body || !this.reader.epub || !this.reader.bookMeta) return;
      const bookId = this.reader.bookMeta.id;

      if (tab === 'toc') {
        const toc = this.reader.epub.toc;
        const items = toc.length
          ? toc
          : this.reader.epub.spine.map((s, idx) => ({
              label: s.title || `Chương ${idx + 1}`,
              spineIndex: idx,
              fragment: '',
              depth: 0,
            }));

        body.innerHTML = items
          .map(
            (it) => `
            <button class="toc-item ${it.spineIndex === this.reader.chapterIndex ? 'active' : ''}"
                    style="padding-left:${16 + Math.min(3, it.depth) * 16}px"
                    data-jump-spine="${it.spineIndex}"
                    data-jump-frag="${escHtml(it.fragment || '')}"
                    type="button">
              <span>${escHtml(it.label)}</span>
            </button>
          `
          )
          .join('');
      } else if (tab === 'bookmarks') {
        const list = this.state.bookmarks[bookId] || [];
        if (!list.length) {
          body.innerHTML = `<div class="drawer-empty">Chưa có dấu trang nào.</div>`;
          return;
        }
        body.innerHTML = list
          .map(
            (bm) => `
            <div class="saved-entry" data-jump-spine="${bm.chapterIndex}" data-jump-ratio="${bm.progressRatio || 0}" tabindex="0">
              <div class="saved-entry-head">
                <strong>${escHtml(bm.chapterTitle || `Chương ${bm.chapterIndex + 1}`)}</strong>
                <span class="muted-text tabular">${escHtml(bm.pageLabel || '')}</span>
              </div>
              ${bm.snippet ? `<div class="saved-entry-quote">“${escHtml(bm.snippet)}…”</div>` : ''}
              <div class="saved-entry-foot">
                <span class="muted-text tabular">${formatRelativeDate(bm.createdAt)}</span>
                <button class="text-danger-btn" data-del-bm="${escHtml(bm.id)}" type="button">Xóa</button>
              </div>
            </div>
          `
          )
          .join('');
      } else if (tab === 'highlights') {
        const list = this.state.highlights[bookId] || [];
        if (!list.length) {
          body.innerHTML = `<div class="drawer-empty">Chưa có highlight hay ghi chú nào.</div>`;
          return;
        }
        body.innerHTML = `
          <div class="drawer-toolbar">
            <button class="apple-pill-btn secondary small" id="export-book-notes-btn" type="button">Xuất ghi chú (.md)</button>
          </div>
          ${list
            .map(
              (hl) => `
              <div class="saved-entry hl-card hl-border-${escHtml(hl.color || 'sepia')}"
                   data-jump-spine="${hl.chapterIndex}"
                   data-jump-ratio="${hl.progressRatio || 0}"
                   tabindex="0">
                <div class="saved-entry-head">
                  <span class="muted-text">${escHtml(hl.chapterTitle || '')}</span>
                  <span class="muted-text tabular">${formatRelativeDate(hl.createdAt)}</span>
                </div>
                <div class="saved-entry-quote">“${escHtml(hl.text)}”</div>
                ${hl.note ? `<div class="saved-entry-note">${ICONS.note}<span>${escHtml(hl.note)}</span></div>` : ''}
                <div class="saved-entry-foot">
                  <button class="text-link-btn" data-edit-hl="${escHtml(hl.id)}" type="button">Sửa ghi chú</button>
                  <button class="text-danger-btn" data-del-hl="${escHtml(hl.id)}" type="button">Xóa</button>
                </div>
              </div>
            `
            )
            .join('')}
        `;
      } else if (tab === 'ink') {
        const bookPages = this.state.inkNotes?.[bookId] || {};
        const entries = Object.entries(bookPages)
          .filter(([, val]) => val && Array.isArray(val.strokes) && val.strokes.length > 0)
          .sort((a, b) => (a[1].chapterIndex || 0) - (b[1].chapterIndex || 0) || a[0].localeCompare(b[0]));

        if (!entries.length) {
          body.innerHTML = `<div class="drawer-empty">Chưa có nét viết S Pen nào trong cuốn này.<br/><span class="muted-text">Chạm biểu tượng cây bút ở góc trên hoặc đặt ngòi S Pen lên trang sách để viết trực tiếp!</span></div>`;
          return;
        }
        body.innerHTML = entries
          .map(
            ([pageKey, note]) => `
            <div class="saved-entry"
                 data-jump-spine="${note.chapterIndex || 0}"
                 data-jump-ratio="${note.progressRatio || 0}"
                 tabindex="0">
              <div class="saved-entry-head">
                <strong>${escHtml(note.chapterTitle || `Chương ${(note.chapterIndex || 0) + 1}`)}</strong>
                <span class="muted-text tabular">${escHtml(note.pageLabel || pageKey)}</span>
              </div>
              <div class="saved-entry-note">${ICONS.pen}<span class="tabular">${note.strokes.length} nét viết S Pen</span></div>
              <div class="saved-entry-foot">
                <span class="muted-text tabular">${formatRelativeDate(note.updatedAt)}</span>
                <button class="text-danger-btn" data-del-ink-page="${escHtml(pageKey)}" type="button">Xóa nét</button>
              </div>
            </div>
          `
          )
          .join('');
      }
    }

    openBookInfoModal(bookId) {
      if (!bookId) return;
      this.activeBookInfoId = bookId;
      this.closeAllSheets();
      this.renderBookInfoModal(bookId);
      document.getElementById('book-info-backdrop')?.classList.add('open');
      document.getElementById('book-info-modal')?.classList.add('open');
    }

    renderBookInfoModal(bookId) {
      const body = document.getElementById('book-info-body');
      if (!body) return;
      const book =
        this.getMergedBooks().find((b) => b.id === bookId) ||
        (this.reader.bookMeta?.id === bookId ? this.reader.bookMeta : null);
      if (!book) return;

      const rev = this.getBookReview(bookId);
      const pct = Math.min(100, Math.round(book.progress?.bookPercent || 0));
      const isReadingNow = this.reader.bookMeta?.id === bookId && !document.getElementById('reader-view')?.classList.contains('hidden');
      const genres = Array.isArray(book.genres) ? book.genres.slice(0, 6) : [];
      const desc = (book.description || '').trim();
      const statusLabel = pct >= 96 ? 'Đã hoàn thành' : pct > 0 || book.progress?.updatedAt ? `Đang đọc · ${pct}%` : 'Chưa bắt đầu';

      body.innerHTML = `
        <div class="book-info-hero">
          <div class="book-info-cover">${this.renderCoverMarkup(book)}</div>
          <div class="book-info-meta">
            <h3 class="book-info-name">${escHtml(book.title)}</h3>
            <div class="book-info-author">${escHtml(book.author || 'Unknown Author')}</div>
            ${
              book.series
                ? `<div class="book-info-series">${escHtml(book.series)}${book.seriesIndex != null ? ` · Tập #${book.seriesIndex}` : ''}</div>`
                : ''
            }
            <div class="book-info-status-row">
              <span class="pct-pill tabular">${statusLabel}</span>
              ${book.isOffline ? `<span class="offline-pill">Offline</span>` : ''}
            </div>
            ${
              genres.length
                ? `<div class="book-info-genres">${genres.map((g) => `<span class="genre-chip">${escHtml(g)}</span>`).join('')}</div>`
                : ''
            }
          </div>
        </div>

        ${
          pct > 0
            ? `<div class="book-info-prog-bar"><div class="prog-bar-track"><div class="prog-bar-fill" style="width:${pct}%"></div></div></div>`
            : ''
        }

        <div class="inset-section">
          <div class="inset-section-label">Đánh giá của bạn (Rating)</div>
          <div class="inset-group">
            <div class="inset-row book-info-rating-box">
              ${this.renderStarRating(bookId, rev.rating, 'lg')}
              <span class="muted-text tabular">${rev.rating > 0 ? `${rev.rating} / 5 sao` : 'Chạm sao để đánh giá'}</span>
            </div>
          </div>
        </div>

        <div class="inset-section">
          <div class="inset-section-label">Mô tả sách (Description)</div>
          <div class="inset-group">
            <div class="inset-row stack-item">
              ${
                desc
                  ? `<p class="book-info-desc">${escHtml(desc)}</p>`
                  : `<p class="muted-text">Tệp EPUB này không kèm đoạn giới thiệu (dc:description) trong metadata.</p>`
              }
            </div>
          </div>
        </div>

        <div class="inset-section">
          <div class="inset-section-label">Cảm nhận &amp; Ghi chú cá nhân</div>
          <div class="inset-group">
            <div class="inset-row stack-item">
              <textarea id="book-review-input" class="book-review-textarea" rows="3" placeholder="Viết cảm nghĩ, trích dẫn tâm đắc hoặc đánh giá ngắn của bạn về cuốn sách này…">${escHtml(rev.review || '')}</textarea>
              <div class="book-info-actions">
                <button class="apple-pill-btn secondary small" id="book-review-save-btn" data-save-review="${escHtml(bookId)}" type="button">Lưu cảm nhận</button>
                ${
                  isReadingNow
                    ? `<button class="apple-pill-btn small" id="book-info-continue-btn" type="button">Quay lại trang đọc</button>`
                    : `<button class="apple-pill-btn small" data-read-from-modal="${escHtml(bookId)}" type="button">${pct > 0 ? 'Đọc tiếp' : 'Bắt đầu đọc'}</button>`
                }
              </div>
            </div>
          </div>
        </div>
      `;
    }

    exportBookNotesMarkdown() {
      if (!this.reader.bookMeta) return;
      const book = this.reader.bookMeta;
      const list = this.state.highlights[book.id] || [];
      const lines = [`# ${book.title}`, `*Tác giả: ${book.author}*`, ''];
      for (const hl of list) {
        lines.push(`### ${hl.chapterTitle || `Chương ${hl.chapterIndex + 1}`}`);
        lines.push(`> ${hl.text}`);
        if (hl.note) lines.push(`\n**Ghi chú:** ${hl.note}`);
        lines.push('');
      }
      this.downloadTextFile(`${book.title.replace(/[^\w\s-]/g, '').trim() || 'notes'}.md`, lines.join('\n'));
    }

    openVocabModal() {
      this.closeAllSheets();
      document.getElementById('vocab-backdrop')?.classList.add('open');
      document.getElementById('vocab-modal')?.classList.add('open');
      this.renderVocabList();
    }

    renderVocabList(filter = '') {
      const container = document.getElementById('vocab-list');
      if (!container) return;
      const q = filter.trim().toLowerCase();
      const list = this.state.vocab.filter(
        (v) =>
          !q ||
          (v.word || '').toLowerCase().includes(q) ||
          (v.viMeaning || '').toLowerCase().includes(q) ||
          (v.bookTitle || '').toLowerCase().includes(q)
      );
      if (!list.length) {
        container.innerHTML = `<div class="drawer-empty">Sổ từ vựng đang trống.</div>`;
        return;
      }
      container.innerHTML = list
        .map(
          (v) => `
          <div class="vocab-card">
            <div class="vocab-top">
              <div>
                <strong class="vocab-word">${escHtml(v.word)}</strong>
                ${v.phonetic ? `<span class="vocab-ipa">${escHtml(v.phonetic)}</span>` : ''}
              </div>
              <div class="vocab-actions">
                <button class="icon-chip small" data-speak-word="${escHtml(v.word)}" type="button" title="Phát âm">${ICONS.speaker}</button>
                <button class="text-danger-btn" data-del-vocab="${escHtml(v.id)}" type="button">Xóa</button>
              </div>
            </div>
            <div class="vocab-vi">${escHtml(v.viMeaning)}</div>
            ${v.context ? `<div class="vocab-ctx">“${escHtml(v.context)}”</div>` : ''}
            ${v.bookTitle ? `<div class="vocab-book">— ${escHtml(v.bookTitle)}</div>` : ''}
          </div>
        `
        )
        .join('');
    }

    exportVocabMarkdown() {
      const lines = ['# Sổ từ vựng PaperInk', ''];
      for (const v of this.state.vocab) {
        lines.push(`- **${v.word}** ${v.phonetic || ''} — ${v.viMeaning}`);
        if (v.context) lines.push(`  > ${v.context} *(${v.bookTitle || ''})*`);
      }
      this.downloadTextFile('paperink-vocabulary.md', lines.join('\n'));
    }

    exportBackupJson() {
      const payload = {
        app: 'PaperInk',
        version: 3,
        exportedAt: new Date().toISOString(),
        state: this.state,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paperink-backup-${todayKey(0)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.toast('Đã xuất bản sao lưu dữ liệu đọc (.json)');
    }

    async importBackupJson(file) {
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const incoming = parsed?.state || parsed;
        if (!incoming || typeof incoming !== 'object') throw new Error('Invalid backup');
        this.state = {
          progress: { ...this.state.progress, ...(incoming.progress || {}) },
          bookmarks: { ...this.state.bookmarks, ...(incoming.bookmarks || {}) },
          highlights: { ...this.state.highlights, ...(incoming.highlights || {}) },
          bookReviews: { ...this.state.bookReviews, ...(incoming.bookReviews || {}) },
          inkNotes: { ...this.state.inkNotes, ...(incoming.inkNotes || {}) },
          vocab: Array.isArray(incoming.vocab) ? incoming.vocab : this.state.vocab,
          deletedIds: { ...this.state.deletedIds, ...(incoming.deletedIds || {}) },
          settings: this.normalizeSettings(incoming.settings || this.state.settings),
          readingStats: {
            dailyMinutes: {
              ...(this.state.readingStats?.dailyMinutes || {}),
              ...(incoming.readingStats?.dailyMinutes || {}),
            },
            dailyGoalMinutes: incoming.readingStats?.dailyGoalMinutes || this.state.readingStats?.dailyGoalMinutes || 30,
            pagesTurned: Math.max(this.state.readingStats?.pagesTurned || 0, incoming.readingStats?.pagesTurned || 0),
            updatedAt: Date.now(),
          },
          shelfConfig: this.normalizeShelfConfig(incoming.shelfConfig || this.state.shelfConfig),
        };
        await window.PaperInkDB.setKV('state', this.state);
        this.applySettingsToDOM();
        this.applyBackgroundToDOM();
        this.renderCurrentRoute();
        this.scheduleSync();
        this.toast('Đã khôi phục tiến độ, đánh giá & ghi chú thành công!');
      } catch (_) {
        this.toast('File sao lưu .json không hợp lệ');
      }
    }

    async openConnectModal() {
      this.closeAllSheets();
      document.getElementById('connect-backdrop')?.classList.add('open');
      document.getElementById('connect-modal')?.classList.add('open');

      const qrBox = document.getElementById('connect-qr');
      const urlEl = document.getElementById('connect-url-text');
      const flagCmd = document.getElementById('chrome-flag-origin');
      const httpStep = document.getElementById('http-lan-flag-step');

      const currentUrl = `${window.location.origin}${window.location.pathname}`;
      const isHttps = window.location.protocol === 'https:';
      httpStep?.classList.toggle('hidden', isHttps);

      let loadedFromServer = false;
      if (this.isOnlineToServer && !this.isStaticWebHost()) {
        try {
          const res = await fetch('./api/info');
          if (res.ok) {
            const info = await res.json();
            if (qrBox) qrBox.innerHTML = info.qrSvg || '';
            if (urlEl) urlEl.textContent = info.primaryUrl || currentUrl;
            if (flagCmd) flagCmd.textContent = info.primaryUrl || currentUrl;
            loadedFromServer = true;
          }
        } catch (_) {}
      }

      if (!loadedFromServer) {
        if (urlEl) urlEl.textContent = currentUrl;
        if (flagCmd) flagCmd.textContent = window.location.origin;
        if (qrBox) {
          const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(currentUrl)}`;
          qrBox.innerHTML = `<img src="${escHtml(qrImgUrl)}" alt="Mã QR mở PaperInk trên điện thoại" style="width:100%;height:100%;object-fit:contain;border-radius:8px" />`;
        }
      }
    }

    downloadTextFile(filename, text) {
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    openAppearanceSheet(initialTab = 'typo') {
      this.closeAllSheets();
      // Hide Reader HUD so user sees the ACTUAL real book page crystal clear above Aa sheet!
      this.reader?.setHudVisible(false);
      this.switchAaTab(initialTab);
      document.getElementById('aa-backdrop')?.classList.add('open');
      document.getElementById('aa-sheet')?.classList.add('open');
    }

    switchAaTab(tab = 'typo') {
      document.querySelectorAll('.aa-tab').forEach((btn) => {
        const active = btn.dataset.aatab === tab;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', String(active));
      });
      document.querySelectorAll('.aa-panel').forEach((panel) => {
        panel.classList.toggle('hidden', panel.dataset.aapanel !== tab);
      });
    }

    closeAllSheets() {
      document
        .querySelectorAll('.sheet-panel.open, .sheet-backdrop.open, .modal-panel.open')
        .forEach((el) => el.classList.remove('open'));
    }

    toast(msg) {
      const el = document.getElementById('toast');
      if (!el) return;
      el.textContent = msg;
      el.classList.add('show');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
    }

    // ---- Event Binding ----
    bindUI() {
      // Bottom 5-tab bar
      document.querySelectorAll('.btab').forEach((btn) => {
        btn.addEventListener('click', () => this.setRoute(btn.dataset.route || 'shelf', null));
      });

      document.getElementById('drilldown-back-btn')?.addEventListener('click', () => {
        this.setRoute(this.route, null);
      });

      // Top header actions
      document.getElementById('lib-import-btn')?.addEventListener('click', () => {
        document.getElementById('import-epub-input')?.click();
      });
      document.getElementById('lib-search-toggle')?.addEventListener('click', () => {
        this.setSearchOpen(!this.searchOpen);
      });
      document.getElementById('search-clear-btn')?.addEventListener('click', () => {
        this.setSearchOpen(false);
      });
      document.getElementById('lib-studio-btn')?.addEventListener('click', () => this.openStudioSheet());
      document.getElementById('lib-more-btn')?.addEventListener('click', () => this.openMoreSheet());

      // More sheet actions
      document.getElementById('more-close-btn')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('more-backdrop')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('more-connect-btn')?.addEventListener('click', () => this.openConnectModal());
      document.getElementById('more-vocab-btn')?.addEventListener('click', () => this.openVocabModal());
      document.getElementById('more-import-btn')?.addEventListener('click', () => {
        this.closeAllSheets();
        document.getElementById('import-epub-input')?.click();
      });
      document.getElementById('more-backup-export-btn')?.addEventListener('click', () => {
        this.closeAllSheets();
        this.exportBackupJson();
      });
      document.getElementById('more-backup-import-btn')?.addEventListener('click', () => {
        this.closeAllSheets();
        document.getElementById('import-backup-input')?.click();
      });
      const backupInp = document.getElementById('import-backup-input');
      backupInp?.addEventListener('change', () => {
        if (backupInp.files?.[0]) this.importBackupJson(backupInp.files[0]);
        backupInp.value = '';
      });
      document.getElementById('more-rescan-btn')?.addEventListener('click', async () => {
        this.closeAllSheets();
        this.toast('Đang quét lại kho sách trên PC…');
        try {
          const res = await fetch('./api/library/rescan', { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            this.serverBooks = data.books || [];
            window.PaperInkDB.setKV('libraryCatalog', this.serverBooks).catch(() => {});
            this.renderCurrentRoute();
            this.toast(`Đã tìm thấy ${this.serverBooks.length} cuốn EPUB!`);
          }
        } catch (_) {
          this.toast('Không kết nối được tới máy chủ PC');
        }
      });

      // Quiet filter tabs
      document.querySelectorAll('.quiet-tab').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.quiet-tab').forEach((b) => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          this.shelfFilter = btn.dataset.filter || 'all';
          this.renderLimit = 72;
          this.renderShelfPage();
        });
      });

      // Edit Sticker Drag Mode controls
      document.getElementById('toggle-drag-mode-btn')?.addEventListener('click', () => {
        this.setEditStickersMode(!this.editStickersMode);
      });
      document.getElementById('banner-done-edit-btn')?.addEventListener('click', () => {
        this.setEditStickersMode(false);
      });
      document.getElementById('banner-open-studio-btn')?.addEventListener('click', () => {
        this.openStudioSheet();
      });
      document.getElementById('banner-upload-sticker-btn')?.addEventListener('click', () => {
        document.getElementById('upload-sticker-input')?.click();
      });

      // Floating Sticker Inspector controls
      document.getElementById('insp-scale')?.addEventListener('input', (e) => {
        const st = this.getSelectedSticker();
        if (!st) return;
        st.scale = parseFloat(e.target.value);
        const el = document.querySelector(`.placed-sticker[data-placed-id="${CSS.escape(st.id)}"]`);
        this.applyLiveStickerTransform(el, st);
        this.updatePlacedSticker(st.id, { scale: st.scale }, true);
      });
      document.getElementById('insp-rotate')?.addEventListener('input', (e) => {
        const st = this.getSelectedSticker();
        if (!st) return;
        st.rotate = parseInt(e.target.value, 10);
        const el = document.querySelector(`.placed-sticker[data-placed-id="${CSS.escape(st.id)}"]`);
        this.applyLiveStickerTransform(el, st);
        this.updatePlacedSticker(st.id, { rotate: st.rotate }, true);
      });
      document.getElementById('insp-flip-btn')?.addEventListener('click', () => {
        const st = this.getSelectedSticker();
        if (!st) return;
        st.flipX = !st.flipX;
        const el = document.querySelector(`.placed-sticker[data-placed-id="${CSS.escape(st.id)}"]`);
        this.applyLiveStickerTransform(el, st);
        this.updatePlacedSticker(st.id, { flipX: st.flipX }, true);
      });
      document.getElementById('insp-dup-btn')?.addEventListener('click', () => {
        const st = this.getSelectedSticker();
        if (!st) return;
        const copy = {
          ...st,
          id: uid('st'),
          xPct: Math.min(92, (st.xPct || 50) + 12),
        };
        const list = [...(this.state.shelfConfig.placedStickers || []), copy];
        this.selectedStickerId = copy.id;
        this.updateShelfConfig({ placedStickers: list });
        this.updateStickerInspectorUI();
      });
      document.getElementById('insp-del-btn')?.addEventListener('click', () => {
        const st = this.getSelectedSticker();
        if (!st) return;
        const list = (this.state.shelfConfig.placedStickers || []).filter((s) => s.id !== st.id);
        this.selectedStickerId = null;
        this.updateShelfConfig({ placedStickers: list });
        this.updateStickerInspectorUI();
        this.toast('Đã gỡ sticker khỏi kệ');
      });

      // Search input
      const searchInput = document.getElementById('lib-search');
      let searchTimer = null;
      searchInput?.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          this.searchQuery = searchInput.value.trim();
          this.renderLimit = 72;
          this.renderCurrentRoute();
        }, 120);
      });

      // Sort
      document.getElementById('lib-sort')?.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.renderShelfPage();
      });

      // Responsive shelf column recount
      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const nextCols = this.computeShelfCols();
          if (nextCols !== this.lastShelfCols) {
            this.lastShelfCols = nextCols;
            if (this.route === 'shelf' || this.drilldown) this.renderShelfPage();
          }
        }, 160);
      });

      // Global Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (this.dictUI.isOpen()) this.dictUI.close();
          else if (this.inkCanvas?.active) this.inkCanvas.setActive(false);
          else if (this.editStickersMode) this.setEditStickersMode(false);
          else this.closeAllSheets();
        }
      });

      // Load more
      document.getElementById('load-more-btn')?.addEventListener('click', () => {
        this.renderLimit += 96;
        this.renderShelfPage();
      });

      // File inputs
      const epubInp = document.getElementById('import-epub-input');
      epubInp?.addEventListener('change', () => {
        this.importLocalEpubFiles(epubInp.files);
        epubInp.value = '';
      });

      const stickerInp = document.getElementById('upload-sticker-input');
      stickerInp?.addEventListener('change', () => {
        this.handleStickerUpload(stickerInp.files);
        stickerInp.value = '';
      });

      const wpInp = document.getElementById('upload-wallpaper-input');
      wpInp?.addEventListener('change', () => {
        if (wpInp.files?.[0]) this.handleWallpaperUpload(wpInp.files[0]);
        wpInp.value = '';
      });

      // Pointerdown for freeform sticker dragging
      const mainEl = document.getElementById('main-library');
      mainEl?.addEventListener('pointerdown', (e) => {
        const stickerEl = e.target.closest('.placed-sticker');
        if (stickerEl) {
          this.handleStickerPointerDown(e, stickerEl);
        }
      });

      // Main Library delegated clicks
      mainEl?.addEventListener('click', (e) => {
        if (e.target.closest('.placed-sticker')) return;

        // Clicking empty shelf space in Edit Mode deselects sticker
        if (this.editStickersMode) {
          this.selectedStickerId = null;
          document.querySelectorAll('.placed-sticker.selected').forEach((n) => n.classList.remove('selected'));
          this.updateStickerInspectorUI();
          return;
        }

        const triggerImport = e.target.closest('[data-trigger-import]');
        if (triggerImport) {
          document.getElementById('import-epub-input')?.click();
          return;
        }

        const rateBtn = e.target.closest('[data-rate-book]');
        if (rateBtn) {
          e.stopPropagation();
          this.setBookRating(rateBtn.dataset.rateBook, parseInt(rateBtn.dataset.rateVal, 10));
          return;
        }

        const infoBtn = e.target.closest('[data-open-book-info]');
        if (infoBtn) {
          e.stopPropagation();
          this.openBookInfoModal(infoBtn.dataset.openBookInfo);
          return;
        }

        const offBtn = e.target.closest('[data-toggle-offline]');
        if (offBtn) {
          e.stopPropagation();
          this.toggleBookOffline(offBtn.dataset.toggleOffline);
          return;
        }

        const goalBtn = e.target.closest('[data-set-goal]');
        if (goalBtn) {
          const mins = parseInt(goalBtn.dataset.setGoal, 10);
          if (!Number.isNaN(mins)) {
            this.state.readingStats.dailyGoalMinutes = mins;
            this.state.readingStats.updatedAt = Date.now();
            this.scheduleSync();
            this.renderProgressPage();
            this.toast(`Đã đặt mục tiêu ${mins} phút/ngày`);
          }
          return;
        }

        const progTab = e.target.closest('[data-progtab]');
        if (progTab) {
          this.progressTab = progTab.dataset.progtab || 'reading';
          this.renderProgressPage();
          return;
        }

        const colCard = e.target.closest('[data-open-collection-type]');
        if (colCard) {
          const type = colCard.dataset.openCollectionType;
          const val = colCard.dataset.openCollectionVal;
          const routeTarget = type === 'genre' ? 'genres' : type === 'author' ? 'authors' : 'series';
          this.setRoute(routeTarget, { type, value: val, label: val });
          return;
        }

        const bookCard = e.target.closest('[data-open-book]');
        if (bookCard) {
          this.openBookById(bookCard.dataset.openBook);
        }
      });

      mainEl?.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if (e.target.closest('button, input, select')) return;
        const colCard = e.target.closest('[data-open-collection-type]');
        if (colCard) {
          e.preventDefault();
          const type = colCard.dataset.openCollectionType;
          const val = colCard.dataset.openCollectionVal;
          const routeTarget = type === 'genre' ? 'genres' : type === 'author' ? 'authors' : 'series';
          this.setRoute(routeTarget, { type, value: val, label: val });
          return;
        }
        const bookCard = e.target.closest('[data-open-book]');
        if (bookCard) {
          e.preventDefault();
          this.openBookById(bookCard.dataset.openBook);
        }
      });

      // Studio Sheet controls
      document.getElementById('studio-close-btn')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('studio-backdrop')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('studio-upload-sticker-btn')?.addEventListener('click', () => {
        document.getElementById('upload-sticker-input')?.click();
      });
      document.getElementById('studio-drag-mode-btn')?.addEventListener('click', () => {
        this.closeAllSheets();
        if (this.route !== 'shelf' && !this.drilldown) this.setRoute('shelf', null);
        this.setEditStickersMode(true);
      });
      document.getElementById('upload-wallpaper-btn')?.addEventListener('click', () => {
        document.getElementById('upload-wallpaper-input')?.click();
      });
      document.getElementById('clear-wallpaper-btn')?.addEventListener('click', () => {
        this.clearCustomWallpaper();
      });

      document.getElementById('custom-bg-color-input')?.addEventListener('input', (e) => {
        const hex = e.target.value;
        document.getElementById('custom-bg-hex').textContent = hex.toUpperCase();
        this.updateShelfConfig({ bgMode: 'color', bgColor: hex }, false);
      });
      document.getElementById('set-bg-ambient')?.addEventListener('change', (e) => {
        this.updateShelfConfig({ bgAmbient: e.target.checked }, false);
      });
      document.getElementById('set-wp-blur')?.addEventListener('input', (e) => {
        this.updateShelfConfig({ bgBlur: parseInt(e.target.value, 10) }, false);
      });
      document.getElementById('set-wp-dim')?.addEventListener('input', (e) => {
        this.updateShelfConfig({ bgDim: parseInt(e.target.value, 10) }, false);
      });

      document.getElementById('studio-sheet')?.addEventListener('click', (e) => {
        const styleBtn = e.target.closest('[data-shelf-style]');
        if (styleBtn) {
          this.updateShelfConfig({ shelfStyle: styleBtn.dataset.shelfStyle });
          return;
        }
        const modeBtn = e.target.closest('.bg-mode-pill');
        if (modeBtn) {
          this.updateShelfConfig({ bgMode: modeBtn.dataset.bgmode }, false);
          return;
        }
        const colorDot = e.target.closest('[data-pick-color]');
        if (colorDot) {
          this.updateShelfConfig({ bgMode: 'color', bgColor: colorDot.dataset.pickColor }, false);
          return;
        }
        const delCustom = e.target.closest('[data-delete-custom-sticker]');
        if (delCustom) {
          e.stopPropagation();
          this.deleteCustomStickerFromPack(delCustom.dataset.deleteCustomSticker);
          return;
        }
        const placeBtn = e.target.closest('[data-place-sticker]');
        if (placeBtn) {
          this.addStickerToShelf(placeBtn.dataset.placeSticker);
        }
      });

      // Reader HUD buttons
      document.getElementById('hud-back-btn')?.addEventListener('click', () => {
        this.reader.closeBook();
        document.getElementById('library-view')?.classList.remove('hidden');
        this.renderCurrentRoute();
      });

      document.getElementById('hud-book-info-btn')?.addEventListener('click', () => {
        if (this.reader.bookMeta?.id) {
          this.openBookInfoModal(this.reader.bookMeta.id);
        }
      });

      document.getElementById('hud-pen-btn')?.addEventListener('click', () => {
        const next = !this.inkCanvas.active;
        this.inkCanvas.setActive(next);
        if (next) {
          this.toast('Chế độ viết S Pen BẬT — chạm hoặc dùng S Pen viết trực tiếp lên trang');
        }
      });

      document.getElementById('hud-toc-btn')?.addEventListener('click', () => this.openNavDrawer('toc'));
      document.getElementById('hud-aa-btn')?.addEventListener('click', () => this.openAppearanceSheet());
      document.getElementById('hud-vocab-btn')?.addEventListener('click', () => this.openVocabModal());
      document.getElementById('hud-tapdict-btn')?.addEventListener('click', () => {
        const next = !this.state.settings.tapDict;
        this.updateSettings({ tapDict: next });
        this.toast(next ? 'Đã BẬT Chạm tra từ nhanh' : 'Đã TẮT Chạm tra từ');
      });

      document.getElementById('hud-fullscreen-btn')?.addEventListener('click', () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
        else document.exitFullscreen?.().catch(() => {});
      });

      // Book Info / Description / Rating Modal
      document.getElementById('book-info-close')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('book-info-backdrop')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('book-info-body')?.addEventListener('click', (e) => {
        const triggerImport = e.target.closest('[data-trigger-import]');
        if (triggerImport) {
          document.getElementById('import-epub-input')?.click();
          return;
        }

        const rateBtn = e.target.closest('[data-rate-book]');
        if (rateBtn) {
          this.setBookRating(rateBtn.dataset.rateBook, parseInt(rateBtn.dataset.rateVal, 10));
          return;
        }
        const saveRevBtn = e.target.closest('[data-save-review]');
        if (saveRevBtn) {
          const txt = document.getElementById('book-review-input')?.value || '';
          this.saveBookReview(saveRevBtn.dataset.saveReview, txt);
          return;
        }
        if (e.target.id === 'book-info-continue-btn') {
          this.closeAllSheets();
          return;
        }
        const readBtn = e.target.closest('[data-read-from-modal]');
        if (readBtn) {
          const id = readBtn.dataset.readFromModal;
          this.closeAllSheets();
          this.openBookById(id);
        }
      });

      // Nav Drawer
      document.querySelectorAll('.drawer-tab').forEach((tab) => {
        tab.addEventListener('click', () => this.switchNavTab(tab.dataset.navtab));
      });
      document.getElementById('nav-drawer-close')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('nav-drawer-backdrop')?.addEventListener('click', () => this.closeAllSheets());

      document.getElementById('nav-drawer-body')?.addEventListener('click', (e) => {
        if (e.target.id === 'export-book-notes-btn') {
          this.exportBookNotesMarkdown();
          return;
        }
        const delBm = e.target.closest('[data-del-bm]');
        if (delBm && this.reader.bookMeta) {
          e.stopPropagation();
          this.deleteBookmark(this.reader.bookMeta.id, delBm.dataset.delBm);
          this.switchNavTab('bookmarks');
          this.reader.updateBookmarkIndicator();
          return;
        }
        const delHl = e.target.closest('[data-del-hl]');
        if (delHl && this.reader.bookMeta) {
          e.stopPropagation();
          this.deleteHighlight(this.reader.bookMeta.id, delHl.dataset.delHl);
          this.switchNavTab('highlights');
          this.reader.reRenderHighlights();
          return;
        }
        const delInk = e.target.closest('[data-del-ink-page]');
        if (delInk && this.reader.bookMeta) {
          e.stopPropagation();
          this.deleteInkPage(this.reader.bookMeta.id, delInk.dataset.delInkPage);
          this.switchNavTab('ink');
          return;
        }
        const editHl = e.target.closest('[data-edit-hl]');
        if (editHl) {
          e.stopPropagation();
          this.closeAllSheets();
          this.reader.openHighlightModal(editHl.dataset.editHl);
          return;
        }
        const jumpEl = e.target.closest('[data-jump-spine]');
        if (jumpEl) {
          const spine = parseInt(jumpEl.dataset.jumpSpine, 10);
          const ratio = jumpEl.dataset.jumpRatio ? parseFloat(jumpEl.dataset.jumpRatio) : 0;
          const frag = jumpEl.dataset.jumpFrag || '';
          this.closeAllSheets();
          this.reader.setHudVisible(false);
          this.reader.recordJumpPoint();
          this.reader.goToChapter(spine, ratio, frag);
        }
      });

      // Appearance (Aa) Sheet — Reader Only
      document.getElementById('aa-backdrop')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('aa-close-btn')?.addEventListener('click', () => this.closeAllSheets());

      const fontInp = document.getElementById('upload-font-input');
      document.getElementById('upload-font-btn')?.addEventListener('click', () => fontInp?.click());
      fontInp?.addEventListener('change', () => {
        this.handleFontUpload(fontInp.files);
        fontInp.value = '';
      });

      document.getElementById('aa-sheet')?.addEventListener('click', (e) => {
        const aaTabBtn = e.target.closest('.aa-tab');
        if (aaTabBtn) {
          this.switchAaTab(aaTabBtn.dataset.aatab || 'typo');
          return;
        }
        const themeBtn = e.target.closest('.theme-swatch');
        if (themeBtn) {
          this.updateSettings({ theme: themeBtn.dataset.theme });
          return;
        }
        const delFont = e.target.closest('[data-delete-font]');
        if (delFont) {
          e.stopPropagation();
          this.deleteCustomFont(delFont.dataset.deleteFont);
          return;
        }
        const bodyFontBtn = e.target.closest('[data-body-font]');
        if (bodyFontBtn) {
          this.updateSettings({ fontFamily: bodyFontBtn.dataset.bodyFont });
          return;
        }
        const headingFontBtn = e.target.closest('[data-heading-font]');
        if (headingFontBtn) {
          this.updateSettings({ headingFont: headingFontBtn.dataset.headingFont });
          return;
        }
        const marginBtn = e.target.closest('.margin-pill');
        if (marginBtn) {
          this.updateSettings({ margin: marginBtn.dataset.margin });
          return;
        }
        const alignBtn = e.target.closest('.align-pill');
        if (alignBtn) {
          this.updateSettings({ textAlign: alignBtn.dataset.align });
          return;
        }
        const dirBtn = e.target.closest('.dir-pill');
        if (dirBtn) {
          this.updateSettings({ readDirection: dirBtn.dataset.dir });
          return;
        }
        const effBtn = e.target.closest('.effect-pill');
        if (effBtn) {
          this.updateSettings({ turnEffect: effBtn.dataset.effect });
          return;
        }
        const progBtn = e.target.closest('.progstyle-pill');
        if (progBtn) {
          this.updateSettings({ progressStyle: progBtn.dataset.progstyle });
          return;
        }
        const progModeBtn = e.target.closest('.progmode-pill');
        if (progModeBtn) {
          this.updateSettings({ progressColorMode: progModeBtn.dataset.progmode });
          return;
        }
        const solidDot = e.target.closest('[data-prog-solid]');
        if (solidDot) {
          this.updateSettings({ progressColorMode: 'solid', progressSolidColor: solidDot.dataset.progSolid });
          return;
        }
        const gradChip = e.target.closest('[data-prog-grad-start]');
        if (gradChip) {
          this.updateSettings({
            progressColorMode: 'gradient',
            progressGradStart: gradChip.dataset.progGradStart,
            progressGradEnd: gradChip.dataset.progGradEnd,
          });
        }
      });

      document.getElementById('prog-solid-input')?.addEventListener('input', (e) => {
        this.updateSettings({ progressColorMode: 'solid', progressSolidColor: e.target.value });
      });
      document.getElementById('prog-grad-start')?.addEventListener('input', (e) => {
        this.updateSettings({ progressColorMode: 'gradient', progressGradStart: e.target.value });
      });
      document.getElementById('prog-grad-end')?.addEventListener('input', (e) => {
        this.updateSettings({ progressColorMode: 'gradient', progressGradEnd: e.target.value });
      });

      const bindRange = (id, key, isFloat = false) => {
        const el = document.getElementById(id);
        el?.addEventListener('input', () => {
          this.updateSettings({ [key]: isFloat ? parseFloat(el.value) : parseInt(el.value, 10) });
        });
      };
      bindRange('set-font-size', 'fontSize', false);
      bindRange('set-heading-size', 'headingSize', false);
      bindRange('set-font-weight', 'fontWeight', false);
      bindRange('set-line-height', 'lineHeight', true);
      bindRange('set-letter-spacing', 'letterSpacing', true);
      bindRange('set-word-spacing', 'wordSpacing', true);
      bindRange('set-para-gap', 'paraGap', true);
      bindRange('set-extra-dim', 'extraDim', false);
      bindRange('set-warmth', 'warmth', false);

      // Drag & Drop .EPUB anywhere onto Library!
      const dropOverlay = document.getElementById('epub-drop-overlay');
      let dragDepth = 0;
      const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes('Files');
      window.addEventListener('dragenter', (e) => {
        if (!hasFiles(e) || !document.getElementById('reader-view')?.classList.contains('hidden')) return;
        e.preventDefault();
        dragDepth++;
        dropOverlay?.classList.remove('hidden');
      });
      window.addEventListener('dragover', (e) => {
        if (!hasFiles(e) || !document.getElementById('reader-view')?.classList.contains('hidden')) return;
        e.preventDefault();
      });
      window.addEventListener('dragleave', () => {
        if (dragDepth <= 0) return;
        dragDepth--;
        if (dragDepth === 0) dropOverlay?.classList.add('hidden');
      });
      window.addEventListener('drop', (e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        dragDepth = 0;
        dropOverlay?.classList.add('hidden');
        if (e.dataTransfer?.files?.length) {
          this.importLocalEpubFiles(e.dataTransfer.files);
        }
      });

      const bindCheck = (id, key) => {
        const el = document.getElementById(id);
        el?.addEventListener('change', () => this.updateSettings({ [key]: el.checked }));
      };
      bindCheck('set-paper-grain', 'paperGrain');
      bindCheck('set-grayscale', 'grayscale');
      bindCheck('set-tap-dict', 'tapDict');
      bindCheck('set-header-footer', 'showHeaderFooter');
      bindCheck('set-auto-offline', 'autoSaveOffline');

      // Vocab & Connect Modals
      document.getElementById('vocab-backdrop')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('vocab-close-btn')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('vocab-search')?.addEventListener('input', (e) => {
        this.renderVocabList(e.target.value);
      });
      document.getElementById('vocab-export-btn')?.addEventListener('click', () => this.exportVocabMarkdown());
      document.getElementById('vocab-list')?.addEventListener('click', (e) => {
        const sp = e.target.closest('[data-speak-word]');
        if (sp) {
          this.dictUI.speakTTS(sp.dataset.speakWord);
          return;
        }
        const del = e.target.closest('[data-del-vocab]');
        if (del) {
          this.deleteVocabWord(del.dataset.delVocab);
          this.renderVocabList(document.getElementById('vocab-search')?.value || '');
        }
      });

      document.getElementById('connect-backdrop')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('connect-close-btn')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('copy-lan-url-btn')?.addEventListener('click', () => {
        const txt = document.getElementById('connect-url-text')?.textContent || '';
        navigator.clipboard?.writeText(txt).catch(() => {});
        this.toast('Đã sao chép địa chỉ kết nối');
      });
      document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
        if (!this.deferredInstallPrompt) return;
        this.deferredInstallPrompt.prompt();
        await this.deferredInstallPrompt.userChoice;
        this.deferredInstallPrompt = null;
        document.getElementById('pwa-install-btn')?.classList.add('hidden');
      });

      window.addEventListener('online', () => this.refreshFromServer());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && this.reader.epub) {
          this.reader.persistProgress();
        }
      });
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    const app = new PaperInkApp();
    window.__paperInk = app;
    app.init();
  });
})();
