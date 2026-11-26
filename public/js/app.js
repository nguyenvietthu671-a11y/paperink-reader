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
    progressSolidColor: '#0B57D0',
    progressGradStart: '#0B57D0',
    progressGradEnd: '#6750A4',
    pageMode: 'eink',
    paperGrain: true,
    extraDim: 0,
    warmth: 0,
    grayscale: false,
    tapDict: false,
    showHeaderFooter: true,
    autoSaveOffline: false,
    updatedAt: 0,
  };

  const PROGRESS_SOLID_PRESETS = [
    { name: 'Google Blue', hex: '#0B57D0' },
    { name: 'M3 Violet', hex: '#6750A4' },
    { name: 'Kindle Ấm', hex: '#8C5A32' },
    { name: 'Xanh lá M3', hex: '#146C2E' },
    { name: 'San hô', hex: '#B3261E' },
    { name: 'Đen mực', hex: '#1F1F1F' },
  ];

  const PROGRESS_GRADIENT_PRESETS = [
    { name: 'Google Sky', start: '#0B57D0', end: '#38BDF8' },
    { name: 'Material You', start: '#6750A4', end: '#D946EF' },
    { name: 'Sunset', start: '#E85D04', end: '#F48C06' },
    { name: 'Botanical', start: '#146C2E', end: '#4CAF50' },
    { name: 'Rose Gold', start: '#B3261E', end: '#F59E0B' },
    { name: 'Kindle Gold', start: '#8C5A32', end: '#D6A354' },
  ];

  const FONT_STACKS = {
    cormorant: "'Cormorant Garamond', Georgia, serif",
    playfair: "'Playfair Display', Georgia, serif",
    literata: "'Literata', Georgia, 'Times New Roman', serif",
    lora: "'Lora', Georgia, serif",
    newsreader: "'Newsreader', Georgia, serif",
    atkinson: "'Atkinson Hyperlegible', -apple-system, BlinkMacSystemFont, sans-serif",
    sans: "'Roboto', 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
  };

  const BUILTIN_BODY_FONTS = [
    { id: 'literata', label: 'Literata' },
    { id: 'lora', label: 'Lora' },
    { id: 'newsreader', label: 'Newsreader' },
    { id: 'atkinson', label: 'Atkinson' },
    { id: 'sans', label: 'Roboto / Sans' },
  ];

  const BUILTIN_HEADING_FONTS = [
    { id: 'same', label: 'Giống văn bản' },
    { id: 'cormorant', label: 'Cormorant' },
    { id: 'playfair', label: 'Playfair' },
    { id: 'literata', label: 'Literata' },
    { id: 'lora', label: 'Lora' },
    { id: 'newsreader', label: 'Newsreader' },
    { id: 'sans', label: 'Roboto / Sans' },
  ];

  const THEME_META_COLORS = {
    apple: '#F8F9FA',
    paper: '#F3F1EC',
    sepia: '#EFE5D1',
    eink: '#EAEAEA',
    sage: '#E5EDE4',
    dark: '#131314',
    amoled: '#000000',
  };

  function isDarkThemeName(theme) {
    return theme === 'dark' || theme === 'amoled';
  }

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
    moreVert: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="18.5" r="2"/></svg>`,
    pen: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    folder: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    sparkles: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.9 5.3L19 10.2l-5.1 1.9L12 17.4l-1.9-5.3L5 10.2l5.1-1.9L12 3z"/><path d="M19 3l.8 2.2L22 6l-2.2.8L19 9l-.8-2.2L16 6l2.2-.8L19 3z"/></svg>`,
    tag: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
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
    const c = String(hex || '#F8F9FA').replace('#', '');
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
      this.wallpaperUrls = new Map(); // scopeKey -> objectURL
      this.studioScopeMode = 'global'; // 'global' | 'scoped'
      this.studioScopeType = 'series'; // 'series' | 'genre' | 'author' | 'folder' | 'route'
      this.studioScopeValue = '';
      this.studioScopeKey = 'global';
      this.isOnlineToServer = false;
      this.deferredInstallPrompt = null;
      this.activeBookInfoId = null;
      this.activeSeriesInfoName = null;
      this.enrichingBookIds = new Set();
      this.enrichingSeriesKeys = new Set();
      this.knownServerBookIds = null;

      this.state = {
        progress: {},
        bookmarks: {},
        highlights: {},
        bookReviews: {},
        bookMetaOverrides: {},
        seriesMeta: {},
        inkNotes: {},
        folders: [],
        hiddenBookIds: {},
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

      // Multi-Select Books & Custom Folders state
      this.selectMode = false;
      this.selectedBookIds = new Set();
      this.visibleShelfBookIds = [];
      this.suppressNextBookClick = false;
      this.folderModalCtx = null;

      // Sticker Edit & Drag state
      this.editStickersMode = false;
      this.selectedStickerId = null;
      this.dragState = null;

      this.syncTimer = null;
      this.cloudSyncTimer = null;
      this.toastTimer = null;
      this.lastSyncedAt = 0;
      this.customServerUrl = this.readSavedServerUrl();
      this.activeServerOrigin = '';
      this.cloudToken = (localStorage.getItem('paperink_cloud_gist_token') || '').trim();
      this.cloudGistId = (localStorage.getItem('paperink_cloud_gist_id') || '').trim();
      this.lastCloudSyncAt = 0;

      this.currentUser = null;
      try {
        const savedUser = localStorage.getItem('paperink_user');
        if (savedUser) this.currentUser = JSON.parse(savedUser);
      } catch (_) {}
      this.authToken = (localStorage.getItem('paperink_auth_token') || '').trim();
      this._currentAccountPairUrl = '';

      this.dictUI = new window.PaperInkDictUI({
        onSaveVocab: (entry) => this.addVocabWord(entry),
        isWordSaved: (word) => this.isVocabWordSaved(word),
      });

      this.inkCanvas = new window.PaperInkSPen({
        onSavePage: (bookId, pageKey, strokes, meta) => this.saveInkPage(bookId, pageKey, strokes, meta),
        onActiveChange: (isActive) => {
          if (isActive) this.reader.setHudVisible(false);
        },
        onPenDetected: () => {
          this.reader?.abortTouchGesture?.();
        },
        toast: (msg) => this.toast(msg),
      });

      this.reader = new window.PaperInkReader({
        getSettings: () => this.state.settings,
        getPenState: () => ({
          active: this.inkCanvas.active,
          detailOpen: this.inkCanvas.detailOpen,
          sPenOnly: this.inkCanvas.sPenOnly,
          shouldRejectTouch: this.inkCanvas.shouldRejectTouchAsPalm(),
          shouldSuppressTap: this.inkCanvas.shouldSuppressSyntheticTap(),
        }),
        collapsePenToolbar: () => {
          if (this.inkCanvas.detailOpen) {
            this.inkCanvas.setDetailOpen(false);
          } else {
            this.inkCanvas.setActive(false);
            this.inkCanvas.wakeQuickPill?.();
          }
        },
        onPageChanged: ({ bookId, pageKey, meta }) => this.loadInkForPage(bookId, pageKey, meta),
        onBookClosed: () => {
          this.inkCanvas.clearContext();
          this.flushSyncNow(true);
        },
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

      this.p2p = window.PaperInkP2P ? new window.PaperInkP2P(this) : null;
    }

    computeShelfCols() {
      const rawW = window.innerWidth;
      const rawH = window.innerHeight;
      const isShortLandscape = rawW > rawH && rawH <= 540;
      const w = isShortLandscape ? Math.max(320, rawW - 76) : rawW;
      if (w < 460) return 3;
      if (w < 700) return 4;
      if (w < 1020) return 5;
      return 6;
    }

    async init() {
      if (!this.p2p && window.PaperInkP2P) this.p2p = new window.PaperInkP2P(this);
      this.checkUrlHashPairing();
      this.registerServiceWorker();
      this.bindUI();
      this.updateAccountUI();

      await this.loadLocalData();
      this.applySettingsToDOM();
      this.applyBackgroundToDOM();
      this.renderCurrentRoute();

      await this.refreshFromServer();
    }

    checkUrlHashPairing() {
      try {
        const hash = window.location.hash || '';
        if (hash.includes('account_pair=')) {
          const raw = hash.replace(/^#+/, '');
          const params = new URLSearchParams(raw);
          const pairPayload = params.get('account_pair');
          if (pairPayload) {
            try {
              const decoded = JSON.parse(decodeURIComponent(escape(atob(pairPayload))));
              if (decoded && decoded.user) {
                this.currentUser = decoded.user;
                this.authToken = decoded.token || '';
                localStorage.setItem('paperink_user', JSON.stringify(this.currentUser));
                if (this.authToken) localStorage.setItem('paperink_auth_token', this.authToken);
                if (decoded.cloudSync?.token) {
                  this.cloudToken = decoded.cloudSync.token;
                  localStorage.setItem('paperink_cloud_gist_token', this.cloudToken);
                  if (decoded.cloudSync.gistId) {
                    this.cloudGistId = decoded.cloudSync.gistId;
                    localStorage.setItem('paperink_cloud_gist_id', this.cloudGistId);
                  }
                }
                if (decoded.lanUrl && !this.customServerUrl) {
                  this.customServerUrl = decoded.lanUrl;
                  localStorage.setItem('paperink_server_url', decoded.lanUrl);
                }
                this.updateAccountUI();
                if (window.history && window.history.replaceState) {
                  window.history.replaceState(null, '', window.location.pathname + window.location.search);
                }
                setTimeout(() => {
                  this.toast(`Chào mừng ${this.currentUser.displayName || this.currentUser.username}! Đã đồng bộ tài khoản thành công.`);
                  this.syncWithCloudGist(false);
                  this.refreshFromServer(false);
                }, 500);
              }
            } catch (err) {
              console.warn('[PaperInk] account_pair decode error:', err);
            }
          }
        } else if (hash.includes('cloud_token=')) {
          const raw = hash.replace(/^#+/, '');
          const params = new URLSearchParams(raw);
          const token = params.get('cloud_token');
          const gistId = params.get('gist_id');
          if (token && (token.startsWith('gho_') || token.startsWith('ghp_'))) {
            this.cloudToken = token;
            localStorage.setItem('paperink_cloud_gist_token', token);
            if (gistId) {
              this.cloudGistId = gistId;
              localStorage.setItem('paperink_cloud_gist_id', gistId);
            }
            if (window.history && window.history.replaceState) {
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
            setTimeout(() => {
              this.toast('Đã kết nối Cloud Sync 24/7! Đang đồng bộ tiến độ & ghi chú…');
              this.syncWithCloudGist(false);
            }, 500);
          }
        } else if (hash.includes('p2p_pair=')) {
          const raw = hash.replace(/^#+/, '');
          const params = new URLSearchParams(raw);
          const pairCode = params.get('p2p_pair');
          if (pairCode) {
            if (window.history && window.history.replaceState) {
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
            setTimeout(() => {
              if (!this.p2p && window.PaperInkP2P) this.p2p = new window.PaperInkP2P(this);
              this.p2p?.connectToHost(pairCode);
            }, 500);
          }
        }
      } catch (_) {}
    }

    async startP2PHost() {
      if (!this.p2p && window.PaperInkP2P) this.p2p = new window.PaperInkP2P(this);
      if (!this.p2p) return;
      this.toast('Đang khởi tạo phòng chia sẻ P2P…');
      const res = await this.p2p.startHost();
      if (!res) return;

      const hostBox = document.getElementById('p2p-host-box');
      const qrBox = document.getElementById('p2p-qr');
      const codeEl = document.getElementById('p2p-room-code');

      if (codeEl) codeEl.textContent = res.roomCode;
      const pairUrl = `${window.location.origin}${window.location.pathname}#p2p_pair=${encodeURIComponent(res.roomCode)}`;
      this._currentP2PPairUrl = pairUrl;

      if (qrBox) {
        const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&color=12733f&data=${encodeURIComponent(pairUrl)}`;
        qrBox.innerHTML = `<img src="${escHtml(qrImgUrl)}" alt="Mã QR kết nối P2P" style="width:100%;height:100%;object-fit:contain;border-radius:8px" />`;
      }
      hostBox?.classList.remove('hidden');
      this.p2p.updateUiStatus();
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
      if (merged.defaultStickerMode !== 'push') {
        merged.defaultStickerMode = 'overlay';
      }
      if (!Array.isArray(merged.placedStickers)) {
        merged.placedStickers = [];
      } else {
        merged.placedStickers = merged.placedStickers
          .filter((st) => st && typeof st === 'object' && st.id && st.stickerId)
          .map((st) => ({
            ...st,
            mode: st.mode === 'push' ? 'push' : 'overlay',
            slotIndex: typeof st.slotIndex === 'number' && !Number.isNaN(st.slotIndex) ? st.slotIndex : null,
          }));
      }
      if (!merged.bgMode || !['color', 'preset', 'image'].includes(merged.bgMode)) {
        merged.bgMode = 'color';
      }
      if (!merged.bgPreset) merged.bgPreset = 'cozy-amber';
      if (!merged.bgColor || !/^#[0-9a-fA-F]{6}$/.test(merged.bgColor)) {
        merged.bgColor = '#F8F9FA';
      }
      if (!merged.scopedWallpapers || typeof merged.scopedWallpapers !== 'object' || Array.isArray(merged.scopedWallpapers)) {
        merged.scopedWallpapers = {};
      }
      return merged;
    }

    getWallpaperBlobKey(scopeKey = 'global') {
      return !scopeKey || scopeKey === 'global' ? 'customWallpaper' : `customWallpaper:${scopeKey}`;
    }

    getWallpaperUrl(scopeKey = 'global') {
      if (!scopeKey || scopeKey === 'global') {
        return this.wallpaperUrls.get('global') || this.customWallpaperUrl || null;
      }
      return this.wallpaperUrls.get(scopeKey) || null;
    }

    async reloadAllWallpaperBlobs() {
      const wpBlob = await window.PaperInkDB.getKV('customWallpaper');
      if (wpBlob instanceof Blob) {
        const prev = this.wallpaperUrls.get('global');
        if (prev) URL.revokeObjectURL(prev);
        const url = URL.createObjectURL(wpBlob);
        this.customWallpaperUrl = url;
        this.wallpaperUrls.set('global', url);
      }
      const scoped = this.state.shelfConfig?.scopedWallpapers || {};
      for (const sKey of Object.keys(scoped)) {
        if (!sKey || sKey === 'global' || scoped[sKey]?.removed) continue;
        try {
          const sBlob = await window.PaperInkDB.getKV(this.getWallpaperBlobKey(sKey));
          if (sBlob instanceof Blob) {
            const prev = this.wallpaperUrls.get(sKey);
            if (prev) URL.revokeObjectURL(prev);
            this.wallpaperUrls.set(sKey, URL.createObjectURL(sBlob));
          }
        } catch (_) {}
      }
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
            bookMetaOverrides: savedState.bookMetaOverrides || {},
            seriesMeta: savedState.seriesMeta || {},
            inkNotes: savedState.inkNotes || {},
            folders: Array.isArray(savedState.folders) ? savedState.folders : [],
            hiddenBookIds: savedState.hiddenBookIds || {},
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

        await this.reloadAllWallpaperBlobs();

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

    readSavedServerUrl() {
      try {
        const raw = (localStorage.getItem('paperink_server_url') || '').trim();
        return raw ? raw.replace(/\/+$/, '') : '';
      } catch (_) {
        return '';
      }
    }

    saveServerUrl(url) {
      const clean = String(url || '').trim().replace(/\/+$/, '');
      this.customServerUrl = clean;
      try {
        if (clean) localStorage.setItem('paperink_server_url', clean);
        else localStorage.removeItem('paperink_server_url');
      } catch (_) {}
    }

    apiUrl(apiPath) {
      const p = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
      if (this.activeServerOrigin) return `${this.activeServerOrigin}${p}`;
      return `.${p}`;
    }

    resolveServerAssetUrl(url) {
      if (!url) return null;
      if (/^(https?:|blob:|data:)/i.test(url)) return url;
      return this.apiUrl(url);
    }

    async probeServerOrigin(origin, timeoutMs = 1100) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const base = origin ? origin.replace(/\/+$/, '') : '.';
        const res = await fetch(`${base}/api/info`, { cache: 'no-store', signal: ctrl.signal });
        if (!res.ok) return false;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return false;
        const data = await res.json();
        return data && data.name === 'PaperInk';
      } catch (_) {
        return false;
      } finally {
        clearTimeout(timer);
      }
    }

    mergeIncomingState(incoming) {
      if (!incoming || typeof incoming !== 'object') return;
      const deleted = { ...(this.state.deletedIds || {}) };
      if (incoming.deletedIds && typeof incoming.deletedIds === 'object') {
        for (const [id, ts] of Object.entries(incoming.deletedIds)) {
          if (!deleted[id] || ts > deleted[id]) deleted[id] = ts;
        }
      }
      this.state.deletedIds = deleted;

      if (incoming.hiddenBookIds && typeof incoming.hiddenBookIds === 'object') {
        if (!this.state.hiddenBookIds) this.state.hiddenBookIds = {};
        for (const [id, ts] of Object.entries(incoming.hiddenBookIds)) {
          if (!this.state.hiddenBookIds[id] || ts > this.state.hiddenBookIds[id]) {
            this.state.hiddenBookIds[id] = ts;
          }
        }
      }

      if (incoming.progress && typeof incoming.progress === 'object') {
        for (const [bookId, p] of Object.entries(incoming.progress)) {
          if (!p || typeof p !== 'object') continue;
          const cur = this.state.progress[bookId];
          if (!cur || (p.updatedAt || 0) >= (cur.updatedAt || 0)) {
            this.state.progress[bookId] = p;
          }
        }
      }

      if (incoming.bookReviews && typeof incoming.bookReviews === 'object') {
        for (const [bookId, rev] of Object.entries(incoming.bookReviews)) {
          if (!rev || typeof rev !== 'object') continue;
          const cur = this.state.bookReviews[bookId];
          if (!cur || (rev.updatedAt || 0) >= (cur.updatedAt || 0)) {
            this.state.bookReviews[bookId] = rev;
          }
        }
      }

      if (incoming.bookMetaOverrides && typeof incoming.bookMetaOverrides === 'object') {
        if (!this.state.bookMetaOverrides) this.state.bookMetaOverrides = {};
        for (const [bookId, meta] of Object.entries(incoming.bookMetaOverrides)) {
          if (!meta || typeof meta !== 'object') continue;
          const cur = this.state.bookMetaOverrides[bookId];
          if (!cur || (meta.updatedAt || 0) >= (cur.updatedAt || 0)) {
            this.state.bookMetaOverrides[bookId] = meta;
          }
        }
      }

      if (incoming.seriesMeta && typeof incoming.seriesMeta === 'object') {
        if (!this.state.seriesMeta) this.state.seriesMeta = {};
        for (const [sKey, sm] of Object.entries(incoming.seriesMeta)) {
          if (!sm || typeof sm !== 'object') continue;
          const cur = this.state.seriesMeta[sKey];
          if (!cur || (sm.updatedAt || 0) >= (cur.updatedAt || 0)) {
            this.state.seriesMeta[sKey] = sm;
          }
        }
      }

      if (incoming.inkNotes && typeof incoming.inkNotes === 'object') {
        for (const [bookId, pagesObj] of Object.entries(incoming.inkNotes)) {
          if (!pagesObj || typeof pagesObj !== 'object') continue;
          if (!this.state.inkNotes[bookId]) this.state.inkNotes[bookId] = {};
          for (const [pageKey, pageNote] of Object.entries(pagesObj)) {
            if (!pageNote || typeof pageNote !== 'object') continue;
            const cur = this.state.inkNotes[bookId][pageKey];
            if (!cur || (pageNote.updatedAt || 0) >= (cur.updatedAt || 0)) {
              this.state.inkNotes[bookId][pageKey] = pageNote;
            }
          }
        }
      }

      const mergeListById = (curList = [], inList = []) => {
        const byId = new Map();
        for (const item of [...(curList || []), ...(inList || [])]) {
          if (!item || !item.id) continue;
          const delTs = deleted[item.id] || 0;
          const itemTs = item.updatedAt || item.createdAt || 0;
          if (delTs >= itemTs) continue;
          const prev = byId.get(item.id);
          if (!prev || itemTs >= (prev.updatedAt || prev.createdAt || 0)) {
            byId.set(item.id, item);
          }
        }
        return Array.from(byId.values()).sort(
          (a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
        );
      };

      if (incoming.bookmarks && typeof incoming.bookmarks === 'object') {
        for (const [bookId, list] of Object.entries(incoming.bookmarks)) {
          if (Array.isArray(list)) {
            this.state.bookmarks[bookId] = mergeListById(this.state.bookmarks[bookId], list);
          }
        }
      }
      if (incoming.highlights && typeof incoming.highlights === 'object') {
        for (const [bookId, list] of Object.entries(incoming.highlights)) {
          if (Array.isArray(list)) {
            this.state.highlights[bookId] = mergeListById(this.state.highlights[bookId], list);
          }
        }
      }
      if (Array.isArray(incoming.folders)) {
        this.state.folders = mergeListById(this.state.folders, incoming.folders);
      }
      if (Array.isArray(incoming.vocab)) {
        this.state.vocab = mergeListById(this.state.vocab, incoming.vocab);
      }
      if (incoming.settings && (incoming.settings.updatedAt || 0) >= (this.state.settings?.updatedAt || 0)) {
        this.state.settings = this.normalizeSettings(incoming.settings);
      }
      if (incoming.shelfConfig && typeof incoming.shelfConfig === 'object') {
        const curCfg = this.state.shelfConfig || {};
        const mergedScoped = { ...(curCfg.scopedWallpapers || {}) };
        if (incoming.shelfConfig.scopedWallpapers && typeof incoming.shelfConfig.scopedWallpapers === 'object') {
          for (const [sKey, entry] of Object.entries(incoming.shelfConfig.scopedWallpapers)) {
            if (!entry || typeof entry !== 'object') continue;
            const prev = mergedScoped[sKey];
            if (!prev || (entry.updatedAt || 0) >= (prev.updatedAt || 0)) {
              mergedScoped[sKey] = entry;
            }
          }
        }
        if ((incoming.shelfConfig.updatedAt || 0) >= (curCfg.updatedAt || 0)) {
          this.state.shelfConfig = this.normalizeShelfConfig({
            ...incoming.shelfConfig,
            scopedWallpapers: mergedScoped,
          });
        } else {
          this.state.shelfConfig = this.normalizeShelfConfig({
            ...curCfg,
            scopedWallpapers: mergedScoped,
          });
        }
      }
      if (incoming.readingStats && typeof incoming.readingStats === 'object') {
        const rs = this.state.readingStats || { dailyMinutes: {}, dailyGoalMinutes: 30, pagesTurned: 0, updatedAt: 0 };
        const inRs = incoming.readingStats;
        if (inRs.dailyMinutes && typeof inRs.dailyMinutes === 'object') {
          for (const [day, mins] of Object.entries(inRs.dailyMinutes)) {
            if (typeof mins === 'number' && mins >= 0) {
              rs.dailyMinutes[day] = Math.max(rs.dailyMinutes[day] || 0, mins);
            }
          }
        }
        if (typeof inRs.pagesTurned === 'number') {
          rs.pagesTurned = Math.max(rs.pagesTurned || 0, inRs.pagesTurned);
        }
        if ((inRs.updatedAt || 0) >= (rs.updatedAt || 0)) {
          if (inRs.dailyGoalMinutes > 0) rs.dailyGoalMinutes = inRs.dailyGoalMinutes;
          rs.updatedAt = inRs.updatedAt || Date.now();
        }
        this.state.readingStats = rs;
      }

      if (this.inkCanvas?.bookId && this.inkCanvas?.pageKey && !this.inkCanvas.drawing) {
        const latestPage = this.state.inkNotes?.[this.inkCanvas.bookId]?.[this.inkCanvas.pageKey];
        if (latestPage && Array.isArray(latestPage.strokes)) {
          this.inkCanvas.strokes = structuredClone(latestPage.strokes);
          this.inkCanvas.redraw();
        }
      }
    }

    async syncWithCloudGist(silent = true) {
      if (!this.cloudToken) return false;
      const headers = {
        Authorization: `Bearer ${this.cloudToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      };
      const FILE_NAME = 'paperink-sync-state.json';

      try {
        let gistId = this.cloudGistId;
        let remoteState = null;

        if (!gistId) {
          const listRes = await fetch('https://api.github.com/gists?per_page=30', { headers });
          if (!listRes.ok) throw new Error(`GitHub ${listRes.status}`);
          const gists = await listRes.json();
          const found = (gists || []).find((g) => g.files && g.files[FILE_NAME]);
          if (found) {
            gistId = found.id;
            this.cloudGistId = gistId;
            localStorage.setItem('paperink_cloud_gist_id', gistId);
          }
        }

        if (gistId) {
          const gRes = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, { headers });
          if (gRes.ok) {
            const gData = await gRes.json();
            const fileObj = gData?.files?.[FILE_NAME];
            if (fileObj) {
              let rawText = fileObj.content || '';
              if (fileObj.truncated && fileObj.raw_url) {
                const rawRes = await fetch(fileObj.raw_url);
                if (rawRes.ok) rawText = await rawRes.text();
              }
              if (rawText) {
                const parsed = JSON.parse(rawText);
                remoteState = parsed?.state || parsed;
              }
            }
          } else if (gRes.status === 404) {
            gistId = '';
            this.cloudGistId = '';
            localStorage.removeItem('paperink_cloud_gist_id');
          }
        }

        if (remoteState) {
          this.mergeIncomingState(remoteState);
          await window.PaperInkDB.setKV('state', this.state);
          this.applySettingsToDOM();
        }

        const payload = JSON.stringify({
          app: 'PaperInk',
          version: 4,
          syncedAt: Date.now(),
          state: this.state,
        });

        if (gistId) {
          const patchRes = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ files: { [FILE_NAME]: { content: payload } } }),
          });
          if (!patchRes.ok) throw new Error(`GitHub PATCH ${patchRes.status}`);
        } else {
          const createRes = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              description: 'PaperInk Private Sync (Reading Progress, Notes & S Pen Ink)',
              public: false,
              files: { [FILE_NAME]: { content: payload } },
            }),
          });
          if (!createRes.ok) throw new Error(`GitHub POST ${createRes.status}`);
          const created = await createRes.json();
          this.cloudGistId = created.id || '';
          if (this.cloudGistId) localStorage.setItem('paperink_cloud_gist_id', this.cloudGistId);
        }

        this.lastCloudSyncAt = Date.now();
        this.updateSyncStatusUI();
        if (!silent) this.toast('Đã đồng bộ Cloud (tiến độ & ghi chú S Pen)!');
        return true;
      } catch (err) {
        console.warn('[PaperInk Cloud Sync]', err);
        if (!silent) this.toast('Token Cloud không hợp lệ hoặc thiếu quyền gist');
        return false;
      }
    }

    updateSyncStatusUI() {
      const dot = document.getElementById('connection-dot');
      const pcBadge = document.getElementById('sync-status-badge');
      const cloudBadge = document.getElementById('cloud-sync-status');
      const cloudClear = document.getElementById('cloud-sync-clear-btn');

      const fmtTime = (ts) =>
        ts ? new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

      if (dot) {
        const connected = this.isOnlineToServer || Boolean(this.lastCloudSyncAt);
        dot.classList.toggle('online', connected);
        dot.classList.toggle('offline', !connected);
        dot.title = this.isOnlineToServer
          ? `Đã kết nối kho PC (${this.serverBooks.length} sách Online) · Đồng bộ lúc ${fmtTime(this.lastSyncedAt) || 'vừa xong'}`
          : this.cloudToken
          ? `Cloud Sync đang hoạt động · ${fmtTime(this.lastCloudSyncAt) || 'sẵn sàng'}`
          : 'Chế độ Offline — chạm để cài đặt đồng bộ PC / Cloud';
      }

      if (pcBadge) {
        if (this.isOnlineToServer) {
          pcBadge.textContent = `Đã kết nối PC · ${this.serverBooks.length} sách Online${
            this.lastSyncedAt ? ` · ${fmtTime(this.lastSyncedAt)}` : ''
          }`;
          pcBadge.classList.add('connected');
        } else {
          pcBadge.textContent = 'Chưa kết nối máy chủ PC (đang chạy Offline)';
          pcBadge.classList.remove('connected');
        }
      }

      if (cloudBadge) {
        if (this.cloudToken) {
          cloudBadge.textContent = this.lastCloudSyncAt
            ? `Cloud Sync đã bật · Đồng bộ lúc ${fmtTime(this.lastCloudSyncAt)}`
            : 'Cloud Sync đã lưu token · Đang chờ đồng bộ';
          cloudBadge.classList.add('connected');
        } else {
          cloudBadge.textContent = 'Chưa kích hoạt Cloud Sync';
          cloudBadge.classList.remove('connected');
        }
      }
      cloudClear?.classList.toggle('hidden', !this.cloudToken);
      document.getElementById('more-rescan-btn')?.classList.toggle('hidden', !this.isOnlineToServer);
    }

    async refreshFromServer(silent = true) {
      const staticHost = this.isStaticWebHost();

      let candidateOrigin = null;
      if (!staticHost && !this.customServerUrl) {
        candidateOrigin = '';
      } else if (this.customServerUrl) {
        candidateOrigin = this.customServerUrl;
      } else if (staticHost && !/android|iphone|ipad/i.test(navigator.userAgent || '')) {
        const localAlive = await this.probeServerOrigin('http://localhost:3000', 850);
        if (localAlive) candidateOrigin = 'http://localhost:3000';
      }

      if (candidateOrigin !== null) {
        this.activeServerOrigin = candidateOrigin;
        try {
          const [libRes, syncRes, infoRes] = await Promise.all([
            fetch(this.apiUrl('/api/library'), { cache: 'no-store' }),
            fetch(this.apiUrl('/api/state/sync'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(this.state),
            }),
            fetch(this.apiUrl('/api/info'), { cache: 'no-store' }).catch(() => null),
          ]);

          if (infoRes && infoRes.ok) {
            try {
              const infoData = await infoRes.json();
              if (infoData.cloudSync?.enabled && infoData.cloudSync.token && !this.cloudToken) {
                this.cloudToken = infoData.cloudSync.token;
                this.cloudGistId = infoData.cloudSync.gistId || '';
                localStorage.setItem('paperink_cloud_gist_token', this.cloudToken);
                if (this.cloudGistId) localStorage.setItem('paperink_cloud_gist_id', this.cloudGistId);
              }
            } catch (_) {}
          }

          if (libRes.ok) {
            const libData = await libRes.json();
            if (Array.isArray(libData.books)) {
              const prevIds = this.knownServerBookIds;
              this.serverBooks = libData.books;
              this.knownServerBookIds = new Set(libData.books.map((b) => b.id));
              window.PaperInkDB.setKV('libraryCatalog', this.serverBooks).catch(() => {});
              if (prevIds && prevIds.size > 0) {
                const newlyDetected = libData.books.filter(
                  (b) => !prevIds.has(b.id) && !this.state.bookMetaOverrides?.[b.id]
                );
                if (newlyDetected.length > 0 && newlyDetected.length <= 10) {
                  this.autoEnrichNewBooks(newlyDetected, { silent: true });
                }
              }
            }
            this.isOnlineToServer = true;
          } else {
            this.isOnlineToServer = false;
          }

          if (syncRes.ok) {
            const merged = await syncRes.json();
            this.mergeIncomingState(merged);
            await window.PaperInkDB.setKV('state', this.state);
            this.applySettingsToDOM();
            this.lastSyncedAt = Date.now();
          }
        } catch (_) {
          this.isOnlineToServer = false;
        }
      } else {
        this.isOnlineToServer = false;
      }

      if (this.cloudToken) {
        await this.syncWithCloudGist(true);
      }

      await this.ensureStarterSampleBook();

      this.updateSyncStatusUI();
      this.renderCurrentRoute();
      if (!silent) {
        if (this.isOnlineToServer) {
          this.toast(`Đã đồng bộ ${this.serverBooks.length} sách Online, tiến độ & ghi chú!`);
        } else if (this.cloudToken) {
          this.toast('Đã đồng bộ tiến độ & ghi chú lên Cloud!');
        } else {
          this.toast('Không tìm thấy máy chủ PC — hãy chạy start-paperink.bat trên máy tính');
        }
      }
    }

    async flushSyncNow(silent = true) {
      window.PaperInkDB.setKV('state', this.state).catch(() => {});
      if (this.isOnlineToServer) {
        try {
          const res = await fetch(this.apiUrl('/api/state/sync'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.state),
          });
          if (res.ok) {
            const merged = await res.json();
            this.mergeIncomingState(merged);
            await window.PaperInkDB.setKV('state', this.state);
            this.lastSyncedAt = Date.now();
            this.updateSyncStatusUI();
          }
        } catch (_) {}
      }
      if (this.cloudToken) {
        await this.syncWithCloudGist(silent);
      }
      this.p2p?.broadcastState(this.state);
    }

    scheduleSync() {
      window.PaperInkDB.setKV('state', this.state).catch(() => {});
      if (this.isOnlineToServer) {
        clearTimeout(this.syncTimer);
        this.syncTimer = setTimeout(async () => {
          try {
            const res = await fetch(this.apiUrl('/api/state/sync'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(this.state),
            });
            if (res.ok) {
              const merged = await res.json();
              this.mergeIncomingState(merged);
              window.PaperInkDB.setKV('state', this.state).catch(() => {});
              this.isOnlineToServer = true;
              this.lastSyncedAt = Date.now();
              this.updateSyncStatusUI();
            }
          } catch (_) {}
        }, 650);
      }
      if (this.cloudToken) {
        clearTimeout(this.cloudSyncTimer);
        this.cloudSyncTimer = setTimeout(() => {
          this.syncWithCloudGist(true);
        }, 2500);
      }
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

    makeWallpaperScopeKey(type, value) {
      if (!type || type === 'global') return 'global';
      const v = String(value || '').trim();
      if (!v) return 'global';
      if (type === 'series') return `series:${this.canonicalSeriesKey(v)}`;
      return `${type}:${v}`;
    }

    describeWallpaperScope(type, value) {
      if (!type || type === 'global') return 'Mọi nền';
      const v = String(value || '').trim();
      if (type === 'series') return `Bộ: ${v}`;
      if (type === 'genre') return `Thể loại: ${v}`;
      if (type === 'author') return `Tác giả: ${v}`;
      if (type === 'folder') {
        const fld = this.getFolderById?.(v);
        return `Thư mục: ${fld?.name || v}`;
      }
      if (type === 'route') {
        const routeNames = {
          shelf: 'Kệ sách chính',
          genres: 'Tab Thể loại',
          authors: 'Tab Tác giả',
          series: 'Tab Bộ truyện',
          progress: 'Tab Tiến độ',
        };
        return routeNames[v] || `Tab: ${v}`;
      }
      return v;
    }

    getScopedWallpaperEntry(scopeKey) {
      if (!scopeKey || scopeKey === 'global') return null;
      const entry = this.state.shelfConfig?.scopedWallpapers?.[scopeKey];
      if (!entry || typeof entry !== 'object' || entry.removed) return null;
      return entry;
    }

    resolveViewWallpaper(includeStudioPreview = true) {
      // Live preview when user is actively editing a scoped shelf inside Studio Sheet
      const studioOpen = Boolean(document.getElementById('studio-sheet')?.classList.contains('open'));
      if (includeStudioPreview && studioOpen && this.studioScopeMode === 'scoped' && this.studioScopeKey !== 'global') {
        const previewEntry = this.getScopedWallpaperEntry(this.studioScopeKey);
        if (previewEntry) {
          return { scopeKey: this.studioScopeKey, isScoped: true, cfg: previewEntry };
        }
      }

      if (this.drilldown) {
        const dKey = this.makeWallpaperScopeKey(this.drilldown.type, this.drilldown.value);
        const dEntry = this.getScopedWallpaperEntry(dKey);
        if (dEntry) {
          return { scopeKey: dKey, isScoped: true, cfg: dEntry };
        }
      }

      const rKey = `route:${this.route}`;
      const rEntry = this.getScopedWallpaperEntry(rKey);
      if (rEntry) {
        return { scopeKey: rKey, isScoped: true, cfg: rEntry };
      }

      return { scopeKey: 'global', isScoped: false, cfg: this.state.shelfConfig };
    }

    getEditingWallpaperTarget() {
      if (this.studioScopeMode !== 'scoped' || !this.studioScopeKey || this.studioScopeKey === 'global') {
        return { scopeKey: 'global', isScoped: false, hasCustom: true, cfg: this.state.shelfConfig };
      }
      const existing = this.getScopedWallpaperEntry(this.studioScopeKey);
      if (existing) {
        return { scopeKey: this.studioScopeKey, isScoped: true, hasCustom: true, cfg: existing };
      }
      return {
        scopeKey: this.studioScopeKey,
        isScoped: true,
        hasCustom: false,
        cfg: {
          bgMode: this.state.shelfConfig.bgMode || 'color',
          bgColor: this.state.shelfConfig.bgColor || '#F8F9FA',
          bgPreset: this.state.shelfConfig.bgPreset || 'cozy-amber',
          bgAmbient: this.state.shelfConfig.bgAmbient !== false,
          bgBlur: this.state.shelfConfig.bgBlur || 0,
          bgDim: this.state.shelfConfig.bgDim || 0,
        },
      };
    }

    updateEditingWallpaper(patch) {
      if (!this.state.shelfConfig.scopedWallpapers) {
        this.state.shelfConfig.scopedWallpapers = {};
      }
      if (this.studioScopeMode === 'scoped' && this.studioScopeKey && this.studioScopeKey !== 'global') {
        const prev = this.getScopedWallpaperEntry(this.studioScopeKey) || {
          scopeKey: this.studioScopeKey,
          scopeType: this.studioScopeType,
          scopeValue: this.studioScopeValue,
          label: this.describeWallpaperScope(this.studioScopeType, this.studioScopeValue),
          bgMode: this.state.shelfConfig.bgMode || 'color',
          bgColor: this.state.shelfConfig.bgColor || '#F8F9FA',
          bgPreset: this.state.shelfConfig.bgPreset || 'cozy-amber',
          bgAmbient: this.state.shelfConfig.bgAmbient !== false,
          bgBlur: this.state.shelfConfig.bgBlur || 0,
          bgDim: this.state.shelfConfig.bgDim || 0,
        };
        this.state.shelfConfig.scopedWallpapers[this.studioScopeKey] = {
          ...prev,
          ...patch,
          label: this.describeWallpaperScope(prev.scopeType || this.studioScopeType, prev.scopeValue || this.studioScopeValue),
          removed: false,
          updatedAt: Date.now(),
        };
        this.state.shelfConfig.updatedAt = Date.now();
      } else {
        this.state.shelfConfig = {
          ...this.state.shelfConfig,
          ...patch,
          updatedAt: Date.now(),
        };
      }
      this.applyBackgroundToDOM();
      this.renderStudioSheet();
      if (!this.drilldown && ['genres', 'authors', 'series'].includes(this.route)) {
        this.renderCollectionsPage();
      }
      this.scheduleSync();
    }

    async resetScopedWallpaper(scopeKey) {
      if (!scopeKey || scopeKey === 'global') return;
      if (!this.state.shelfConfig.scopedWallpapers) {
        this.state.shelfConfig.scopedWallpapers = {};
      }
      this.state.shelfConfig.scopedWallpapers[scopeKey] = {
        scopeKey,
        removed: true,
        updatedAt: Date.now(),
      };
      this.state.shelfConfig.updatedAt = Date.now();
      try {
        await window.PaperInkDB.setKV(this.getWallpaperBlobKey(scopeKey), null);
      } catch (_) {}
      const prevUrl = this.wallpaperUrls.get(scopeKey);
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
        this.wallpaperUrls.delete(scopeKey);
      }
      this.applyBackgroundToDOM();
      this.renderStudioSheet();
      if (!this.drilldown && ['genres', 'authors', 'series'].includes(this.route)) {
        this.renderCollectionsPage();
      }
      this.scheduleSync();
      this.toast('Đã đặt lại kệ này theo hình nền chung (Mọi nền)');
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

    toggleDarkMode(forceDark = null) {
      const cur = this.state.settings.theme || 'apple';
      const currentlyDark = isDarkThemeName(cur);
      const wantDark = typeof forceDark === 'boolean' ? forceDark : !currentlyDark;
      if (wantDark === currentlyDark) return;
      if (wantDark) {
        if (!currentlyDark) this.lastLightTheme = cur;
        this.updateSettings({ theme: this.lastDarkTheme || 'dark' });
        this.toast('Đã bật Chế độ Tối (Material Dark)');
      } else {
        if (currentlyDark) this.lastDarkTheme = cur;
        this.updateSettings({ theme: this.lastLightTheme || 'apple' });
        this.toast('Đã chuyển sang Chế độ Sáng');
      }
    }

    applySettingsToDOM() {
      const s = this.state.settings;
      const root = document.documentElement;
      const themeName = s.theme || 'apple';
      if (isDarkThemeName(themeName)) this.lastDarkTheme = themeName;
      else this.lastLightTheme = themeName;

      root.setAttribute('data-theme', themeName);
      root.classList.toggle('paper-grain-on', Boolean(s.paperGrain));
      root.classList.toggle('grayscale-on', Boolean(s.grayscale) || themeName === 'eink');

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
          ? `linear-gradient(90deg, ${s.progressGradStart || '#0B57D0'}, ${s.progressGradEnd || '#6750A4'})`
          : s.progressSolidColor || '#0B57D0';
      root.style.setProperty('--reader-progress-bg', progBg);

      const dimOverlay = document.getElementById('extra-dim-overlay');
      if (dimOverlay) {
        dimOverlay.style.opacity = String(Math.max(0, Math.min(0.78, (s.extraDim || 0) / 100)));
      }
      const warmOverlay = document.getElementById('warmth-overlay');
      if (warmOverlay) {
        warmOverlay.style.opacity = String(Math.max(0, Math.min(0.45, ((s.warmth || 0) / 100) * 0.65)));
      }

      this.applyBackgroundToDOM();
      this.syncSettingsControls();
      this.reader.applyVisualMode();
      this.inkCanvas?.redraw();
    }

    applyBackgroundToDOM() {
      const resolved = this.resolveViewWallpaper(true);
      const viewActual = this.resolveViewWallpaper(false);
      const cfg = resolved.cfg || this.state.shelfConfig;
      const scopeKey = resolved.scopeKey || 'global';
      const themeName = this.state.settings.theme || 'apple';
      const darkActive = isDarkThemeName(themeName);
      const libView = document.getElementById('library-view');
      const wpEl = document.getElementById('library-wallpaper');
      const ambEl = document.getElementById('library-wallpaper-ambient');
      const scrimEl = document.getElementById('library-wallpaper-scrim');
      if (!libView || !wpEl || !scrimEl || !ambEl) return;

      // Update header Studio badge when current view has its own custom wallpaper
      const scopeDot = document.getElementById('studio-scope-dot');
      const studioLbl = document.getElementById('lib-studio-label');
      scopeDot?.classList.toggle('hidden', !viewActual.isScoped);
      if (studioLbl) {
        studioLbl.textContent = viewActual.isScoped ? 'Nền riêng' : 'Nền & Kệ';
      }

      const imgUrl = this.getWallpaperUrl(scopeKey);
      const useImage = cfg.bgMode === 'image' && Boolean(imgUrl);
      const usePreset = cfg.bgMode === 'preset' || (cfg.bgMode === 'image' && !imgUrl && Boolean(cfg.bgPreset));

      const blurPct = Math.max(0, Math.min(100, Math.round(Number(cfg.bgBlur || 0))));
      const blurPx = Number(((blurPct / 100) * 36).toFixed(2));
      const blurScale = blurPct > 0 ? `scale(${(1 + (blurPct / 100) * 0.12).toFixed(3)})` : '';

      if (useImage) {
        wpEl.style.backgroundColor = darkActive ? '#131314' : '#141416';
        wpEl.style.backgroundImage = `url("${imgUrl}")`;
        wpEl.style.backgroundSize = 'cover';
        wpEl.style.backgroundPosition = 'center';
        wpEl.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : '';
        wpEl.style.transform = blurScale;
        const baseDim = Number(cfg.bgDim || 0) / 100;
        const dimPct = darkActive ? Math.max(0.44, baseDim) : baseDim;
        scrimEl.style.opacity = String(Math.max(0, Math.min(0.82, dimPct)));
        ambEl.style.opacity = '0';
        libView.classList.toggle('wp-dark', darkActive || dimPct >= 0.25);
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.setAttribute('content', THEME_META_COLORS[themeName] || '#F8F9FA');
      } else if (usePreset) {
        const decorMod = window.PaperInkShelfDecor;
        const preset = decorMod?.getPresetById(cfg.bgPreset) || decorMod?.WALLPAPER_PRESETS?.[0];
        wpEl.style.backgroundColor = preset?.metaColor || '#18181b';
        wpEl.style.backgroundImage = preset?.css || 'none';
        wpEl.style.backgroundSize = 'cover';
        wpEl.style.backgroundPosition = 'center';
        wpEl.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : '';
        wpEl.style.transform = blurScale;
        const baseDim = Number(cfg.bgDim || 0) / 100;
        const dimPct = darkActive && !preset?.isDark ? Math.max(0.54, baseDim) : baseDim;
        scrimEl.style.opacity = String(Math.max(0, Math.min(0.82, dimPct)));
        ambEl.style.opacity = '0';
        const isDark = Boolean(preset?.isDark) || darkActive || dimPct >= 0.35;
        libView.classList.toggle('wp-dark', isDark);
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.setAttribute('content', preset?.metaColor || '#18181b');
      } else {
        const savedHex = cfg.bgColor || '#F8F9FA';
        const savedIsDark = hexLuminance(savedHex) < 0.28;
        let effectiveHex = savedHex;
        let colorDim = 0;
        if (darkActive && !savedIsDark) {
          if (resolved.isScoped) {
            // Preserve intentional scoped shelf tint in Dark Mode with a soft dark scrim
            effectiveHex = savedHex;
            colorDim = 0.58;
          } else {
            effectiveHex = themeName === 'amoled' ? '#000000' : '#131314';
          }
        }
        wpEl.style.backgroundImage = 'none';
        wpEl.style.backgroundColor = effectiveHex;
        wpEl.style.filter = '';
        wpEl.style.transform = '';
        scrimEl.style.opacity = String(colorDim);
        const isDark = darkActive || hexLuminance(effectiveHex) < 0.28 || colorDim >= 0.35;
        libView.classList.toggle('wp-dark', isDark);
        ambEl.style.opacity = cfg.bgAmbient !== false ? '1' : '0';
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.setAttribute('content', effectiveHex);
      }
    }

    syncSettingsControls() {
      const s = this.state.settings;
      const darkActive = isDarkThemeName(s.theme);
      document.querySelectorAll('.theme-swatch').forEach((el) => {
        el.classList.toggle('active', el.dataset.theme === s.theme);
      });

      const darkToggleBtn = document.getElementById('lib-dark-toggle');
      if (darkToggleBtn) {
        darkToggleBtn.setAttribute('aria-pressed', String(darkActive));
        darkToggleBtn.title = darkActive ? 'Chuyển sang chế độ Sáng' : 'Bật chế độ Tối (Dark Mode)';
        darkToggleBtn.classList.toggle('active', darkActive);
      }
      document.getElementById('dark-icon-moon')?.classList.toggle('hidden', darkActive);
      document.getElementById('dark-icon-sun')?.classList.toggle('hidden', !darkActive);
      const moreDarkChk = document.getElementById('more-dark-mode-switch');
      if (moreDarkChk) moreDarkChk.checked = darkActive;

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
    canonicalSeriesKey(name) {
      return String(name || '')
        .trim()
        .toLowerCase()
        .replace(/^the\s+/, '')
        .replace(/[’']/g, "'")
        .replace(/\s+/g, ' ');
    }

    applyMetaOverrideToBook(book) {
      const ov = this.state.bookMetaOverrides?.[book.id];
      const merged = { ...book };
      const metaMod = window.PaperInkMetadata;
      const manualOverride = Boolean(ov?.manual);

      if (ov && typeof ov === 'object') {
        if (typeof ov.author === 'string' && ov.author.trim()) merged.author = ov.author.trim();
        if (typeof ov.series === 'string') merged.series = ov.series.trim();
        if (ov.seriesIndex !== undefined) merged.seriesIndex = ov.seriesIndex;
        if (Array.isArray(ov.genres) && ov.genres.length) merged.genres = ov.genres;
        if (Array.isArray(ov.tags)) merged.tags = ov.tags;
        if (typeof ov.description === 'string' && ov.description.trim()) merged.description = ov.description.trim();
        if (ov.goodreadsRating) merged.goodreadsRating = ov.goodreadsRating;
        if (ov.goodreadsUrl) merged.goodreadsUrl = ov.goodreadsUrl;
        if (ov.descSource) merged.descSource = ov.descSource;
        merged.autoTaggedAt = ov.updatedAt || 0;
      }

      // Guard: never let Series name equal the Author's name (unless user explicitly saved it manually)
      if (!manualOverride && merged.series && metaMod) {
        if (typeof metaMod.cleanSeriesName === 'function') {
          merged.series = metaMod.cleanSeriesName(merged.series, merged.author);
        } else if (typeof metaMod.isSeriesSameAsAuthor === 'function' && metaMod.isSeriesSameAsAuthor(merged.series, merged.author)) {
          merged.series = '';
        }
        if (!merged.series) {
          merged.seriesIndex = null;
        }
      }

      if (!Array.isArray(merged.tags) || merged.tags.length === 0 || (!manualOverride && !merged.series && merged.fileName)) {
        if (metaMod && typeof metaMod.analyzeBookMetadata === 'function') {
          const inferred = metaMod.analyzeBookMetadata({
            title: merged.title,
            author: merged.author,
            fileName: merged.fileName,
            description: merged.description,
            series: merged.series,
            seriesIndex: merged.seriesIndex,
            subjects: merged.genres,
            language: merged.language,
            size: merged.size,
          });
          if (!merged.author || /^unknown/i.test(merged.author)) merged.author = inferred.author;
          if (!merged.series && inferred.series) {
            merged.series = inferred.series;
            merged.seriesIndex = merged.seriesIndex ?? inferred.seriesIndex;
          }
          if (!Array.isArray(merged.genres) || !merged.genres.length || (merged.genres.length === 1 && merged.genres[0] === 'General Fiction')) {
            merged.genres = inferred.genres;
          }
          if (!Array.isArray(merged.tags) || merged.tags.length === 0) {
            merged.tags = inferred.tags;
          }
        } else if (!Array.isArray(merged.tags)) {
          merged.tags = [];
        }
      }
      if (!Array.isArray(merged.genres) || !merged.genres.length) {
        merged.genres = ['General Fiction'];
      }
      return merged;
    }

    getMergedBooks() {
      const map = new Map();
      for (const b of this.serverBooks) {
        const isOff = this.offlineMap.has(b.id);
        const offCover = this.offlineCoverUrls.get(b.id);
        map.set(
          b.id,
          this.applyMetaOverrideToBook({
            ...b,
            description: b.description || '',
            genres: Array.isArray(b.genres) && b.genres.length ? b.genres : ['General Fiction'],
            tags: Array.isArray(b.tags) ? b.tags : [],
            series: b.series || '',
            seriesIndex: b.seriesIndex ?? null,
            isOnline: true,
            isOffline: isOff,
            coverDisplayUrl: offCover || this.resolveServerAssetUrl(b.coverUrl),
            progress: this.state.progress[b.id] || null,
            review: this.state.bookReviews?.[b.id] || null,
          })
        );
      }
      for (const [id, off] of this.offlineMap.entries()) {
        if (!map.has(id)) {
          map.set(
            id,
            this.applyMetaOverrideToBook({
              id: off.id,
              title: off.title,
              author: off.author,
              series: off.series || '',
              seriesIndex: off.seriesIndex ?? null,
              genres: Array.isArray(off.genres) && off.genres.length ? off.genres : ['General Fiction'],
              tags: Array.isArray(off.tags) ? off.tags : [],
              language: off.language || 'en',
              fileName: off.fileName || '',
              size: off.size || 0,
              mtimeMs: off.savedAt || 0,
              hasCover: Boolean(off.hasCoverBlob),
              isOnline: false,
              isOffline: true,
              isLocalImport: Boolean(off.isLocalImport),
              isDemoSample: Boolean(off.isDemoSample),
              coverDisplayUrl: this.offlineCoverUrls.get(id) || null,
              description: off.description || '',
              progress: this.state.progress[id] || null,
              review: this.state.bookReviews?.[id] || null,
            })
          );
        }
      }
      const hidden = this.state.hiddenBookIds || {};
      return Array.from(map.values()).filter((b) => !hidden[b.id]);
    }

    // ---- Navigation & Route Controller ----
    setRoute(route, drilldown = null) {
      if (this.editStickersMode && route !== 'shelf') {
        this.setEditStickersMode(false);
      }
      if (this.selectMode) {
        this.setSelectMode(false, null, false);
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
      if (active && this.selectMode) {
        this.setSelectMode(false, null, false);
      }
      this.editStickersMode = Boolean(active);
      if (!this.editStickersMode) this.selectedStickerId = null;
      document.getElementById('library-view')?.classList.toggle('edit-stickers-mode', this.editStickersMode);
      document.getElementById('edit-shelf-banner')?.classList.toggle('hidden', !this.editStickersMode);
      document.getElementById('bottom-tabbar')?.classList.toggle('hidden', this.editStickersMode || this.selectMode);
      document.getElementById('toggle-drag-mode-btn')?.classList.toggle('active', this.editStickersMode);
      this.updateStickerInspectorUI();
      if (this.route === 'shelf' || this.drilldown) {
        this.renderShelfPage();
      }
    }

    // ---- MULTI-SELECT BOOKS & CUSTOM FOLDERS ENGINE ----
    setSelectMode(active, initialBookId = null, rerender = true) {
      const next = Boolean(active);
      if (next && this.editStickersMode) {
        this.setEditStickersMode(false);
      }
      this.selectMode = next;
      this.selectedBookIds.clear();
      if (next && initialBookId) {
        this.selectedBookIds.add(initialBookId);
      }

      const libView = document.getElementById('library-view');
      libView?.classList.toggle('select-books-mode', this.selectMode);
      document.getElementById('select-books-banner')?.classList.toggle('hidden', !this.selectMode);
      document.getElementById('select-action-bar')?.classList.toggle('hidden', !this.selectMode);
      document.getElementById('bottom-tabbar')?.classList.toggle('hidden', this.selectMode || this.editStickersMode);
      document.getElementById('toggle-select-mode-btn')?.classList.toggle('active', this.selectMode);

      this.updateSelectUI();
      if (rerender && (this.route === 'shelf' || this.drilldown)) {
        this.renderShelfPage();
      }
    }

    toggleBookSelection(bookId) {
      if (!bookId) return;
      if (this.selectedBookIds.has(bookId)) {
        this.selectedBookIds.delete(bookId);
      } else {
        this.selectedBookIds.add(bookId);
      }
      // Update DOM selection rings immediately without heavy full rerender
      document.querySelectorAll(`[data-open-book="${CSS.escape(bookId)}"]`).forEach((el) => {
        el.classList.toggle('selected', this.selectedBookIds.has(bookId));
      });
      this.updateSelectUI();
    }

    selectAllVisibleBooks() {
      const allIds = this.visibleShelfBookIds || [];
      const allSelected = allIds.length > 0 && allIds.every((id) => this.selectedBookIds.has(id));
      if (allSelected) {
        this.selectedBookIds.clear();
      } else {
        allIds.forEach((id) => this.selectedBookIds.add(id));
      }
      document.querySelectorAll('#books-container [data-open-book]').forEach((el) => {
        el.classList.toggle('selected', this.selectedBookIds.has(el.dataset.openBook));
      });
      this.updateSelectUI();
    }

    updateSelectUI() {
      const count = this.selectedBookIds.size;
      const lbl = document.getElementById('select-count-label');
      if (lbl) lbl.textContent = count > 0 ? `Đã chọn ${count} cuốn` : 'Chạm vào sách để chọn';

      const allIds = this.visibleShelfBookIds || [];
      const allSelected = allIds.length > 0 && allIds.every((id) => this.selectedBookIds.has(id));
      const allBtn = document.getElementById('select-all-btn');
      if (allBtn) allBtn.textContent = allSelected ? 'Bỏ chọn' : 'Chọn tất cả';

      const inFolder = this.drilldown?.type === 'folder';
      document.getElementById('sel-remove-folder-btn')?.classList.toggle('hidden', !inFolder);

      ['sel-new-folder-btn', 'sel-add-to-btn', 'sel-remove-folder-btn', 'sel-delete-books-btn'].forEach((id) => {
        const b = document.getElementById(id);
        if (b) b.disabled = count === 0;
      });
    }

    getFolderById(folderId) {
      return (this.state.folders || []).find((f) => f.id === folderId) || null;
    }

    openFolderNameModal(mode = 'create', folderId = null) {
      this.closeAllSheets();
      this.folderModalCtx = { mode, folderId };
      const titleEl = document.getElementById('folder-name-title');
      const inputEl = document.getElementById('folder-name-input');
      const hintEl = document.getElementById('folder-name-hint');
      const submitEl = document.getElementById('folder-name-submit');

      if (mode === 'rename' && folderId) {
        const folder = this.getFolderById(folderId);
        if (!folder) return;
        if (titleEl) titleEl.textContent = 'Đổi tên thư mục';
        if (inputEl) inputEl.value = folder.name || '';
        if (hintEl) hintEl.textContent = 'Nhập tên mới cho thư mục sách này.';
        if (submitEl) submitEl.textContent = 'Lưu tên';
      } else {
        const cnt = this.selectedBookIds.size;
        if (titleEl) titleEl.textContent = 'Tạo thư mục mới';
        if (inputEl) inputEl.value = '';
        if (hintEl) {
          hintEl.textContent =
            cnt > 0
              ? `Sẽ tự động đưa ${cnt} cuốn sách đang chọn vào thư mục mới này.`
              : 'Tạo một thư mục mới để gom nhóm sách theo ý thích.';
        }
        if (submitEl) submitEl.textContent = cnt > 0 ? `Tạo & Thêm (${cnt})` : 'Tạo thư mục';
      }

      document.getElementById('folder-name-backdrop')?.classList.add('open');
      document.getElementById('folder-name-modal')?.classList.add('open');
      setTimeout(() => {
        inputEl?.focus();
        inputEl?.select?.();
      }, 60);
    }

    submitFolderNameModal() {
      const ctx = this.folderModalCtx;
      const name = (document.getElementById('folder-name-input')?.value || '').trim();
      if (!name) {
        this.toast('Vui lòng nhập tên thư mục');
        document.getElementById('folder-name-input')?.focus();
        return;
      }
      if (ctx?.mode === 'rename' && ctx.folderId) {
        this.renameFolder(ctx.folderId, name);
      } else {
        this.createFolderWithBooks(name, Array.from(this.selectedBookIds));
      }
      this.closeAllSheets();
    }

    createFolderWithBooks(name, bookIds = []) {
      const cleanName = String(name || '').trim().slice(0, 48);
      if (!cleanName) return;
      const folder = {
        id: uid('fld'),
        name: cleanName,
        bookIds: Array.from(new Set(bookIds)),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      if (!Array.isArray(this.state.folders)) this.state.folders = [];
      this.state.folders.unshift(folder);
      this.scheduleSync();
      this.setSelectMode(false, null, false);
      this.renderCurrentRoute();
      this.toast(
        folder.bookIds.length
          ? `Đã tạo thư mục "${cleanName}" (${folder.bookIds.length} cuốn)`
          : `Đã tạo thư mục "${cleanName}"`
      );
    }

    renameFolder(folderId, newName) {
      const folder = this.getFolderById(folderId);
      if (!folder) return;
      folder.name = String(newName || '').trim().slice(0, 48) || folder.name;
      folder.updatedAt = Date.now();
      if (this.drilldown?.type === 'folder' && this.drilldown.value === folderId) {
        this.drilldown.label = folder.name;
      }
      this.scheduleSync();
      this.renderCurrentRoute();
      this.toast(`Đã đổi tên thành "${folder.name}"`);
    }

    deleteFolderOnly(folderId) {
      const folder = this.getFolderById(folderId);
      if (!folder) return;
      if (!confirm(`Xóa thư mục "${folder.name}"? (Các cuốn sách bên trong vẫn giữ nguyên trên Kệ sách)`)) return;
      this.state.folders = (this.state.folders || []).filter((f) => f.id !== folderId);
      this.state.deletedIds[folderId] = Date.now();
      this.scheduleSync();
      if (this.drilldown?.type === 'folder' && this.drilldown.value === folderId) {
        this.setRoute('shelf', null);
      } else {
        this.renderCurrentRoute();
      }
      this.toast(`Đã xóa thư mục "${folder.name}"`);
    }

    addBooksToFolder(folderId, bookIds) {
      const folder = this.getFolderById(folderId);
      if (!folder || !bookIds.length) return;
      const merged = new Set(folder.bookIds || []);
      let added = 0;
      for (const id of bookIds) {
        if (!merged.has(id)) {
          merged.add(id);
          added++;
        }
      }
      folder.bookIds = Array.from(merged);
      folder.updatedAt = Date.now();
      this.scheduleSync();
      this.closeAllSheets();
      this.setSelectMode(false, null, false);
      this.renderCurrentRoute();
      this.toast(
        added > 0
          ? `Đã thêm ${added} cuốn vào "${folder.name}"`
          : `Các sách này đã có sẵn trong "${folder.name}"`
      );
    }

    removeBooksFromFolder(folderId, bookIds) {
      const folder = this.getFolderById(folderId);
      if (!folder || !bookIds.length) return;
      const rem = new Set(bookIds);
      folder.bookIds = (folder.bookIds || []).filter((id) => !rem.has(id));
      folder.updatedAt = Date.now();
      this.scheduleSync();
      this.setSelectMode(false, null, false);
      this.renderCurrentRoute();
      this.toast(`Đã gỡ ${rem.size} cuốn khỏi "${folder.name}"`);
    }

    markSelectedBooksStatus(status) {
      const ids = Array.from(this.selectedBookIds);
      if (!ids.length) return;
      const now = Date.now();
      for (const id of ids) {
        const cur = this.state.progress[id] || {};
        if (status === 'reading') {
          this.state.progress[id] = {
            ...cur,
            chapterIndex: cur.chapterIndex || 0,
            chapterRatio: cur.chapterRatio || 0,
            bookPercent: cur.bookPercent && cur.bookPercent < 96 ? cur.bookPercent : 1,
            updatedAt: now,
          };
        } else if (status === 'finished') {
          this.state.progress[id] = {
            ...cur,
            bookPercent: 100,
            estimatedMinsLeft: 0,
            updatedAt: now,
          };
        }
      }
      this.scheduleSync();
      this.closeAllSheets();
      this.setSelectMode(false, null, false);
      this.renderCurrentRoute();
      this.toast(
        status === 'finished'
          ? `Đã đánh dấu ${ids.length} cuốn là Đã đọc xong`
          : `Đã thêm ${ids.length} cuốn vào mục Đang đọc`
      );
    }

    openFolderPickerSheet() {
      const count = this.selectedBookIds.size;
      if (count === 0) return;
      this.closeAllSheets();

      const body = document.getElementById('folder-picker-body');
      const titleEl = document.getElementById('folder-picker-title');
      if (titleEl) titleEl.textContent = `Thêm ${count} cuốn vào…`;
      if (!body) return;

      const allBooks = this.getMergedBooks();
      const bookMap = new Map(allBooks.map((b) => [b.id, b]));
      const folders = this.state.folders || [];

      const foldersListHtml = folders.length
        ? folders
            .map((f) => {
              const validBooks = (f.bookIds || []).map((id) => bookMap.get(id)).filter(Boolean);
              const thumb = validBooks[0] ? this.renderCoverMarkup(validBooks[0]) : ICONS.folder;
              return `
                <button class="inset-action-row folder-pick-row" data-pick-folder="${escHtml(f.id)}" type="button">
                  <span class="folder-pick-thumb">${thumb}</span>
                  <div>
                    <strong>${escHtml(f.name)}</strong>
                    <span class="tabular">${validBooks.length} cuốn</span>
                  </div>
                </button>
              `;
            })
            .join('')
        : `<div class="inset-row"><p class="muted-text" style="margin:0;font-size:0.84rem">Chưa có thư mục nào — bấm nút tạo mới ở trên để tạo thư mục đầu tiên.</p></div>`;

      body.innerHTML = `
        <div class="inset-section">
          <div class="inset-section-label">Thư mục của bạn</div>
          <div class="inset-group">
            <button class="inset-action-row" data-picker-new-folder="1" type="button">
              ${ICONS.plus}
              <div><strong>Tạo thư mục mới &amp; đặt tên…</strong><span>Gom ${count} cuốn đang chọn vào thư mục mới</span></div>
            </button>
            ${foldersListHtml}
          </div>
        </div>
        <div class="inset-section">
          <div class="inset-section-label">Hoặc thêm nhanh vào danh sách đọc</div>
          <div class="inset-group">
            <button class="inset-action-row" data-picker-status="reading" type="button">
              ${ICONS.pen}
              <div><strong>Đánh dấu Đang đọc</strong><span>Hiện lên dải Đọc tiếp &amp; tab Tiến độ</span></div>
            </button>
            <button class="inset-action-row" data-picker-status="finished" type="button">
              ${ICONS.check}
              <div><strong>Đánh dấu Đã đọc xong (100%)</strong><span>Chuyển sang mục Đã xong để đánh giá sao</span></div>
            </button>
          </div>
        </div>
      `;

      document.getElementById('folder-picker-backdrop')?.classList.add('open');
      document.getElementById('folder-picker-sheet')?.classList.add('open');
    }

    async deleteSelectedBooks() {
      const ids = Array.from(this.selectedBookIds);
      if (!ids.length) return;
      const msg =
        ids.length === 1
          ? 'Xóa cuốn sách đã chọn khỏi kệ sách?'
          : `Xóa ${ids.length} cuốn sách đã chọn khỏi kệ sách?`;
      if (!confirm(msg)) return;

      const now = Date.now();
      if (!this.state.hiddenBookIds) this.state.hiddenBookIds = {};

      for (const id of ids) {
        const off = this.offlineMap.get(id);
        if (off) {
          if (off.isDemoSample) localStorage.setItem('paperink_demo_dismissed', '1');
          await window.PaperInkDB.deleteOfflineBook(id).catch(() => {});
          if (this.offlineCoverUrls.has(id)) {
            URL.revokeObjectURL(this.offlineCoverUrls.get(id));
            this.offlineCoverUrls.delete(id);
          }
        }
        // Mark hidden for server-indexed books too
        this.state.hiddenBookIds[id] = now;
        delete this.state.progress[id];
      }

      // Prune deleted books from all custom folders
      const delSet = new Set(ids);
      for (const f of this.state.folders || []) {
        const before = (f.bookIds || []).length;
        f.bookIds = (f.bookIds || []).filter((bid) => !delSet.has(bid));
        if (f.bookIds.length !== before) f.updatedAt = now;
      }

      await this.reloadOfflineMeta();
      this.scheduleSync();
      this.setSelectMode(false, null, false);
      this.renderCurrentRoute();
      this.toast(`Đã xóa ${ids.length} cuốn sách`);
    }

    renderFoldersStrip(allBooks) {
      const sec = document.getElementById('folders-section');
      const strip = document.getElementById('folders-strip');
      if (!sec || !strip) return;

      const folders = this.state.folders || [];
      const show =
        !this.drilldown &&
        !this.editStickersMode &&
        !this.selectMode &&
        this.shelfFilter === 'all' &&
        !this.searchQuery &&
        folders.length > 0;

      sec.classList.toggle('hidden', !show);
      if (!show) return;

      const bookMap = new Map(allBooks.map((b) => [b.id, b]));
      strip.innerHTML = folders
        .map((f) => {
          const validBooks = (f.bookIds || []).map((id) => bookMap.get(id)).filter(Boolean);
          const thumbs = validBooks.slice(0, 3);
          const coversHtml = thumbs.length
            ? thumbs
                .map((b, idx) => `<div class="folder-mini-cover fmc-${idx}">${this.renderCoverMarkup(b)}</div>`)
                .join('')
            : `<div class="folder-empty-glyph">${ICONS.folder}</div>`;

          return `
            <article class="folder-card glass-card" data-open-folder="${escHtml(f.id)}" tabindex="0" role="button" aria-label="Mở thư mục ${escHtml(f.name)}">
              <div class="folder-collage">${coversHtml}</div>
              <div class="folder-card-meta">
                <div class="folder-card-name" title="${escHtml(f.name)}">${escHtml(f.name)}</div>
                <div class="folder-card-count tabular">${validBooks.length} cuốn</div>
              </div>
            </article>
          `;
        })
        .join('');
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

      this.applyBackgroundToDOM();

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

      const isFolderView = this.drilldown?.type === 'folder';
      document.getElementById('folder-header-bar')?.classList.toggle('hidden', !isFolderView);

      if (this.drilldown) {
        if (this.drilldown.type === 'genre') {
          scoped = all.filter((b) => (b.genres || []).includes(this.drilldown.value));
        } else if (this.drilldown.type === 'author') {
          scoped = all.filter((b) => (b.author || '') === this.drilldown.value);
        } else if (this.drilldown.type === 'series') {
          const targetKey = this.canonicalSeriesKey(this.drilldown.value);
          scoped = all.filter((b) => b.series && this.canonicalSeriesKey(b.series) === targetKey);
        } else if (this.drilldown.type === 'folder') {
          const folder = this.getFolderById(this.drilldown.value);
          const idSet = new Set(folder?.bookIds || []);
          scoped = all.filter((b) => idSet.has(b.id));
          if (folder) this.drilldown.label = folder.name;
        }
        if (titleEl) titleEl.textContent = this.drilldown.label;
        if (subEl) {
          if (this.drilldown.type === 'series') {
            const prof = this.getSeriesProfile(this.drilldown.value, scoped);
            const gText = prof.genres?.slice(0, 2).join(' · ');
            subEl.innerHTML = `${scoped.length} cuốn${gText ? ` · ${escHtml(gText)}` : ''} · <button class="inline-series-info-link" data-open-series-info="${escHtml(this.drilldown.value)}" type="button">Thông tin bộ</button>`;
          } else {
            subEl.textContent = `${scoped.length} cuốn`;
          }
        }
      } else {
        if (titleEl) titleEl.textContent = 'Kệ sách';
        const onlineCnt = all.filter((b) => b.isOnline).length;
        const offlineCnt = all.filter((b) => b.isOffline).length;
        const parts = [`${all.length} cuốn`];
        if (onlineCnt) parts.push(`${onlineCnt} Online`);
        if (offlineCnt) parts.push(`${offlineCnt} Offline`);
        if (subEl) subEl.textContent = parts.join(' · ');
      }

      // Render custom folders strip on home shelf
      this.renderFoldersStrip(all);

      // Render Series Goodreads Overview Card when inside a Series shelf
      this.renderSeriesShelfOverview(scoped);

      const readingBooks = scoped
        .filter((b) => b.progress && b.progress.updatedAt)
        .sort((a, b) => (b.progress.updatedAt || 0) - (a.progress.updatedAt || 0));
      const onlineBooks = scoped.filter((b) => b.isOnline);
      const offlineBooks = scoped.filter((b) => b.isOffline);

      const elAll = document.getElementById('tab-count-all');
      const elRead = document.getElementById('tab-count-reading');
      const elOn = document.getElementById('tab-count-online');
      const elOff = document.getElementById('tab-count-offline');
      if (elAll) elAll.textContent = String(scoped.length);
      if (elRead) elRead.textContent = String(readingBooks.length);
      if (elOn) elOn.textContent = String(onlineBooks.length);
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
      else if (this.shelfFilter === 'online') filtered = onlineBooks;
      else if (this.shelfFilter === 'offline') filtered = offlineBooks;

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const qTag = q.replace(/^#/, '');
        filtered = filtered.filter(
          (b) =>
            (b.title || '').toLowerCase().includes(q) ||
            (b.author || '').toLowerCase().includes(q) ||
            (b.series || '').toLowerCase().includes(q) ||
            (b.genres || []).some((g) => g.toLowerCase().includes(qTag)) ||
            (b.tags || []).some((t) => t.toLowerCase().includes(qTag)) ||
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

      this.visibleShelfBookIds = filtered.map((b) => b.id);
      if (this.selectMode) this.updateSelectUI();

      if (filtered.length === 0) {
        container.className = '';
        const isOnlineEmpty = this.shelfFilter === 'online' && !this.searchQuery;
        container.innerHTML = `
          <div class="empty-state glass-card">
            <p class="empty-title">${
              isOnlineEmpty
                ? 'Chưa có sách Online từ máy tính'
                : this.shelfFilter === 'offline'
                ? 'Chưa có sách nào lưu Offline'
                : this.searchQuery
                ? 'Không tìm thấy cuốn sách phù hợp'
                : 'Kệ sách của bạn đang trống'
            }</p>
            <p class="muted-text">${
              isOnlineEmpty
                ? 'Chạy start-paperink.bat trên máy tính rồi kết nối đồng bộ để đọc toàn bộ kho EPUB trực tuyến không tốn bộ nhớ máy.'
                : this.searchQuery
                ? 'Thử tìm bằng tên tác giả, thể loại hoặc bộ truyện khác.'
                : 'Chọn file .EPUB trên điện thoại/máy tính (hoặc kéo thả vào đây) để tự động xếp lên kệ gỗ 3D.'
            }</p>
            ${
              isOnlineEmpty
                ? `<div style="margin-top:16px"><button class="apple-pill-btn" data-open-sync="1" type="button">Kết nối &amp; Đồng bộ PC</button></div>`
                : !this.searchQuery
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

    renderSeriesShelfOverview(scopedBooks) {
      const box = document.getElementById('series-shelf-overview');
      if (!box) return;
      const show =
        this.drilldown?.type === 'series' &&
        !this.editStickersMode &&
        !this.selectMode &&
        !this.searchQuery &&
        Array.isArray(scopedBooks) &&
        scopedBooks.length > 0;
      box.classList.toggle('hidden', !show);
      if (!show) return;

      const seriesName = this.drilldown.value;
      const key = this.canonicalSeriesKey(seriesName);
      if (key && !this.state.seriesMeta?.[key] && !this.enrichingSeriesKeys.has(key)) {
        this.autoEnrichSeries(seriesName, { silent: true });
      }

      const profile = this.getSeriesProfile(seriesName, scopedBooks);
      const desc = (profile.description || '').trim();
      const isExpanded = this.expandedSeriesOverviewKey === key;
      const isLong = desc.length > 260 || desc.includes('\n');
      const genresHtml = (profile.genres || [])
        .slice(0, 3)
        .map((g) => `<span class="col-genre-mini">${escHtml(g)}</span>`)
        .join('');
      const grBadge = profile.seriesUrl
        ? `<a class="goodreads-pill" href="${escHtml(profile.seriesUrl)}" target="_blank" rel="noopener noreferrer" title="Mở trang bộ truyện trên Goodreads">Goodreads${profile.subtitle ? ` · ${escHtml(profile.subtitle.split('•')[0].trim())}` : ''}</a>`
        : profile.enrichedOnline
        ? `<span class="goodreads-pill">Goodreads</span>`
        : '';

      box.innerHTML = `
        <div class="series-overview-top">
          <div class="series-overview-badges">
            ${grBadge}
            ${genresHtml}
          </div>
          <button class="inline-series-info-link" data-open-series-info="${escHtml(seriesName)}" type="button">Chi tiết &amp; Sửa bộ truyện</button>
        </div>
        ${
          desc
            ? `<p class="series-overview-text ${isLong && !isExpanded ? 'clamped' : ''}">${escHtml(desc)}</p>`
            : `<p class="muted-text" style="margin:0;font-size:0.83rem">Đang tải mô tả bộ truyện từ Goodreads…</p>`
        }
        ${
          isLong
            ? `<div class="series-overview-actions">
                 <button class="inline-series-info-link" data-toggle-series-overview="${escHtml(key)}" type="button">${
                   isExpanded ? 'Thu gọn mô tả' : 'Xem toàn bộ mô tả'
                 }</button>
               </div>`
            : ''
        }
      `;
    }

    renderWoodenShelves(books) {
      const cfg = this.state.shelfConfig;
      const cols = Math.max(1, this.computeShelfCols());

      const showSeriesBadge =
        this.route === 'series' || this.drilldown?.type === 'series' || this.sortBy === 'series';
      const allLackSeriesIdx =
        this.drilldown?.type === 'series' && books.length > 0 && books.every((b) => b.seriesIndex == null);
      const indexFallbackMap = new Map();
      if (allLackSeriesIdx) {
        books.forEach((b, idx) => indexFallbackMap.set(b.id, idx + 1));
      }

      const placed = Array.isArray(cfg.placedStickers) ? cfg.placedStickers : [];
      const pushStickers = placed.filter((st) => st.mode === 'push' && this.renderStickerContent(st.stickerId));
      const overlayStickers = placed.filter((st) => st.mode !== 'push');

      // Build sequential shelf tiers interleaving Push-mode stickers into real column slots (pushing books right & down!)
      const maxNaturalTier = Math.max(0, Math.ceil((books.length + pushStickers.length) / cols));
      const pushByTier = new Map();
      for (const st of pushStickers) {
        const tIdx = Math.max(0, Math.min(maxNaturalTier, st.shelfIndex || 0));
        if (!pushByTier.has(tIdx)) pushByTier.set(tIdx, []);
        pushByTier.get(tIdx).push(st);
      }
      for (const arr of pushByTier.values()) {
        arr.sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));
      }

      const tiers = [];
      let bookCursor = 0;
      let overflowPush = [];
      let tIdx = 0;

      while (
        (bookCursor < books.length || overflowPush.length > 0 || pushByTier.has(tIdx) || (tiers.length === 0 && placed.length > 0)) &&
        tIdx < 250
      ) {
        const incomingPush = [...overflowPush, ...(pushByTier.get(tIdx) || [])];
        pushByTier.delete(tIdx);
        const tierPush = incomingPush.slice(0, cols);
        overflowPush = incomingPush.slice(cols);

        const slots = new Array(cols).fill(null);
        for (const st of tierPush) {
          let desiredCol =
            st.slotIndex != null && !Number.isNaN(Number(st.slotIndex))
              ? Math.round(Number(st.slotIndex))
              : Math.floor(((st.xPct ?? 50) / 100) * cols);
          desiredCol = Math.max(0, Math.min(cols - 1, desiredCol));

          let chosenCol = desiredCol;
          if (slots[chosenCol] !== null) {
            // Find nearest free slot on this shelf plank
            let bestDist = Infinity;
            for (let c = 0; c < cols; c++) {
              if (slots[c] === null && Math.abs(c - desiredCol) < bestDist) {
                bestDist = Math.abs(c - desiredCol);
                chosenCol = c;
              }
            }
          }
          if (slots[chosenCol] === null) {
            slots[chosenCol] = { kind: 'sticker', sticker: st, colIdx: chosenCol };
          }
        }

        // Fill remaining open slots on this shelf plank with standing books (books get pushed cleanly!)
        let lastActiveCol = -1;
        for (let c = 0; c < cols; c++) {
          if (slots[c] !== null) {
            lastActiveCol = Math.max(lastActiveCol, c);
            continue;
          }
          if (bookCursor < books.length) {
            slots[c] = { kind: 'book', book: books[bookCursor++], colIdx: c };
            lastActiveCol = Math.max(lastActiveCol, c);
          }
        }

        const fillUntilCol = this.editStickersMode ? cols - 1 : lastActiveCol;
        const finalCells = [];
        for (let c = 0; c <= fillUntilCol; c++) {
          finalCells.push(slots[c] || { kind: 'empty', colIdx: c });
        }

        tiers.push({ tierIdx: tIdx, cells: finalCells });
        tIdx++;
      }

      const maxRenderedTier = Math.max(0, tiers.length - 1);

      return tiers
        .map(({ tierIdx, cells }) => {
          const cellsHtml = cells
            .map((cell) => {
              if (cell.kind === 'book') {
                return this.renderShelfBook(
                  cell.book,
                  showSeriesBadge,
                  indexFallbackMap.get(cell.book.id) ?? null,
                  cell.colIdx
                );
              }
              if (cell.kind === 'sticker') {
                const st = cell.sticker;
                const asset = this.renderStickerContent(st.stickerId);
                if (!asset) return `<div class="shelf-empty-slot" data-col-idx="${cell.colIdx}" aria-hidden="true"></div>`;
                const isSelected = this.editStickersMode && this.selectedStickerId === st.id;
                const isLampOff = asset.interactive === 'lamp' && !cfg.lampLit;
                const scale = st.scale || 1;
                const rot = st.rotate || 0;
                const flip = st.flipX ? -1 : 1;
                const w = Math.round(asset.baseWidth * scale);
                const yOff = st.yOffset ?? 0;

                return `
                  <div class="shelf-sticker-slot ${isSelected ? 'selected' : ''}" data-col-idx="${cell.colIdx}">
                    <div class="placed-sticker placed-sticker-push ${isSelected ? 'selected' : ''} ${isLampOff ? 'lamp-off' : ''}"
                         data-placed-id="${escHtml(st.id)}"
                         data-sticker-mode="push"
                         data-slot-idx="${cell.colIdx}"
                         data-interactive="${escHtml(asset.interactive || '')}"
                         style="width:${w}px; transform:translateY(${-yOff}px) rotate(${rot}deg) scaleX(${flip});"
                         title="${escHtml(asset.name)} — Chế độ Đẩy sách (không đè lên sách)">
                      ${asset.html}
                    </div>
                  </div>
                `;
              }
              return `<div class="shelf-empty-slot" data-col-idx="${cell.colIdx}" aria-hidden="true"></div>`;
            })
            .join('');

          const labelsHtml = cells
            .map((cell) => {
              if (cell.kind === 'sticker') {
                return `<div class="shelf-sticker-caption" aria-hidden="true">${
                  this.editStickersMode ? '<span class="push-slot-pill">Ô đẩy sách</span>' : ''
                }</div>`;
              }
              if (cell.kind !== 'book') {
                return `<div class="shelf-empty-slot" aria-hidden="true"></div>`;
              }
              const b = cell.book;
              const rev = this.getBookReview(b.id);
              const showRatingBar = this.shelfFilter === 'reading' || rev.rating > 0;
              const dispIdx = b.seriesIndex ?? indexFallbackMap.get(b.id) ?? null;
              return `
              <div class="shelf-book-caption" data-open-book="${escHtml(b.id)}">
                <div class="shelf-book-title" title="${escHtml(b.title)}">${escHtml(b.title)}</div>
                <div class="shelf-book-author">${
                  showSeriesBadge && dispIdx != null ? `Tập #${dispIdx} · ` : ''
                }${escHtml(b.author)}</div>
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

          // Freeform Overlay-mode stickers anchored to this shelf plank
          const tierStickers = overlayStickers.filter(
            (st) => Math.max(0, Math.min(maxRenderedTier, st.shelfIndex || 0)) === tierIdx
          );
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
                     data-sticker-mode="overlay"
                     data-interactive="${escHtml(asset.interactive || '')}"
                     style="left:${xPct}%; bottom:${8 + yOff}px; width:${w}px; transform:translateX(-50%) rotate(${rot}deg) scaleX(${flip});"
                     title="${escHtml(asset.name)}${this.editStickersMode ? ' — Chế độ Đè lên (Overlay)' : ''}">
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

    renderShelfBook(book, showSeriesBadge = false, fallbackIdx = null, colIdx = null) {
      const pct = book.progress ? Math.round(book.progress.bookPercent || 0) : 0;
      const isDl = this.downloadingIds.has(book.id);
      const offlineBtnTitle = book.isOffline ? 'Đã lưu Offline (chạm để gỡ)' : 'Lưu đọc Offline';
      const dispIdx = book.seriesIndex ?? fallbackIdx;
      const hasSeriesBadge = Boolean(showSeriesBadge && dispIdx != null);
      const idxBadge = hasSeriesBadge
        ? `<span class="series-num-badge tabular" title="Quyển #${dispIdx}${book.series ? ` · ${escHtml(book.series)}` : ''}">#${dispIdx}</span>`
        : '';

      // Pure pristine cover: only a whisper-subtle corner badge if saved offline, or hover action on PC
      const offlineIndicator = isDl
        ? `<button class="cover-corner-btn loading" data-toggle-offline="${escHtml(book.id)}" type="button" disabled aria-label="Đang lưu Offline">${ICONS.spinner}</button>`
        : book.isOffline
        ? `<button class="cover-corner-btn saved" data-toggle-offline="${escHtml(book.id)}" type="button" title="${offlineBtnTitle}" aria-label="${offlineBtnTitle}">${ICONS.check}</button>`
        : `<button class="cover-corner-btn hover-only" data-toggle-offline="${escHtml(book.id)}" type="button" title="${offlineBtnTitle}" aria-label="${offlineBtnTitle}">${ICONS.download}</button>`;

      const isSel = this.selectedBookIds.has(book.id);
      const selectBadge = `<span class="book-select-badge" aria-hidden="true">${ICONS.check}</span>`;
      const moreInfoBtn = `<button class="cover-more-btn" data-open-book-info="${escHtml(book.id)}" type="button" title="Xem thông tin sách" aria-label="Xem thông tin sách ${escHtml(book.title)}">${ICONS.moreVert}</button>`;
      const colAttr = colIdx != null ? ` data-col-idx="${colIdx}"` : '';

      return `
        <article class="shelf-book ${isSel ? 'selected' : ''} ${hasSeriesBadge ? 'has-series-badge' : ''}" data-open-book="${escHtml(book.id)}"${colAttr} tabindex="0" role="button" aria-label="Mở sách ${escHtml(book.title)}">
          <div class="shelf-book-stand">
            <div class="shelf-book-cover">
              ${this.renderCoverMarkup(book)}
              ${idxBadge}
              ${moreInfoBtn}
              ${offlineIndicator}
              ${selectBadge}
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
      const showSeriesBadge =
        this.route === 'series' || this.drilldown?.type === 'series' || this.sortBy === 'series';
      const hasSeriesBadge = Boolean(showSeriesBadge && book.seriesIndex != null);
      const idxBadge = hasSeriesBadge
        ? `<span class="series-num-badge tabular" title="Quyển #${book.seriesIndex}${book.series ? ` · ${escHtml(book.series)}` : ''}">#${book.seriesIndex}</span>`
        : '';

      const offlineIndicator = isDl
        ? `<button class="cover-corner-btn loading" data-toggle-offline="${escHtml(book.id)}" type="button" disabled>${ICONS.spinner}</button>`
        : book.isOffline
        ? `<button class="cover-corner-btn saved" data-toggle-offline="${escHtml(book.id)}" type="button" title="${offlineBtnTitle}">${ICONS.check}</button>`
        : `<button class="cover-corner-btn hover-only" data-toggle-offline="${escHtml(book.id)}" type="button" title="${offlineBtnTitle}">${ICONS.download}</button>`;

      const isSel = this.selectedBookIds.has(book.id);
      const selectBadge = `<span class="book-select-badge" aria-hidden="true">${ICONS.check}</span>`;
      const moreInfoBtn = `<button class="cover-more-btn" data-open-book-info="${escHtml(book.id)}" type="button" title="Xem thông tin sách" aria-label="Xem thông tin sách ${escHtml(book.title)}">${ICONS.moreVert}</button>`;

      return `
        <article class="book-card ${isSel ? 'selected' : ''} ${hasSeriesBadge ? 'has-series-badge' : ''}" data-open-book="${escHtml(book.id)}" tabindex="0" role="button" aria-label="Mở sách ${escHtml(book.title)}">
          <div class="book-cover-wrap">
            ${this.renderCoverMarkup(book)}
            ${idxBadge}
            ${moreInfoBtn}
            ${offlineIndicator}
            ${selectBadge}
            ${pct > 0 ? `<div class="cover-progress"><div style="width:${pct}%"></div></div>` : ''}
          </div>
          <div class="book-card-title" title="${escHtml(book.title)}">${escHtml(book.title)}</div>
          <div class="book-card-author">${
            hasSeriesBadge ? `Tập #${book.seriesIndex} · ` : ''
          }${escHtml(book.author)}</div>
        </article>
      `;
    }

    renderBookRow(book) {
      const pct = book.progress ? Math.round(book.progress.bookPercent || 0) : 0;
      const isDl = this.downloadingIds.has(book.id);
      const offlineBtnTitle = book.isOffline ? 'Đã lưu Offline (nhấn để gỡ)' : 'Lưu đọc Offline';
      const offlineIcon = isDl ? ICONS.spinner : book.isOffline ? ICONS.check : ICONS.download;
      const offlineBadge = book.isOffline ? `<span class="offline-pill">Offline</span>` : '';
      const isSel = this.selectedBookIds.has(book.id);
      const showSeriesBadge =
        this.route === 'series' || this.drilldown?.type === 'series' || this.sortBy === 'series';
      const hasSeriesBadge = Boolean(showSeriesBadge && book.seriesIndex != null);

      return `
        <article class="book-row ${isSel ? 'selected' : ''}" data-open-book="${escHtml(book.id)}" tabindex="0" role="button" aria-label="Mở sách ${escHtml(book.title)}">
          <span class="book-select-badge row-select-badge" aria-hidden="true">${ICONS.check}</span>
          <div class="book-row-cover">
            ${this.renderCoverMarkup(book)}
            ${hasSeriesBadge ? `<span class="series-num-badge row-cover-badge tabular">#${book.seriesIndex}</span>` : ''}
          </div>
          <div class="book-row-meta">
            <div class="book-row-title">${
              hasSeriesBadge
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
          <div class="book-row-actions">
            <button class="book-row-more-btn" data-open-book-info="${escHtml(book.id)}" type="button" title="Xem thông tin sách" aria-label="Xem thông tin sách ${escHtml(book.title)}">
              ${ICONS.moreVert}
            </button>
            <button class="book-offline-btn ${book.isOffline ? 'saved' : ''} ${isDl ? 'loading' : ''}" data-toggle-offline="${escHtml(book.id)}" type="button" title="${offlineBtnTitle}" aria-label="${offlineBtnTitle}" ${isDl ? 'disabled' : ''}>
              ${offlineIcon}
            </button>
          </div>
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

    // ---- STICKER PLACEMENT & DUAL-MODE (OVERLAY vs PUSH SÁCH) DRAG ENGINE ----
    addStickerToShelf(stickerId) {
      const placed = [...(this.state.shelfConfig.placedStickers || [])];
      const style = this.state.shelfConfig.shelfStyle || 'oak';
      const nextStyle = ['oak', 'walnut', 'birch', 'slate'].includes(style) ? style : 'oak';
      const cols = Math.max(1, this.computeShelfCols());
      const mode = this.state.shelfConfig.defaultStickerMode === 'push' ? 'push' : 'overlay';

      const sameTier = placed.filter((s) => (s.shelfIndex || 0) === 0);
      const slots = [14, 86, 50, 32, 68, 22, 78];
      const xPct = slots[sameTier.length % slots.length];
      const usedPushCols = new Set(
        sameTier.filter((s) => s.mode === 'push').map((s) => Number(s.slotIndex ?? 0))
      );
      let slotIndex = 0;
      for (let c = 0; c < cols; c++) {
        if (!usedPushCols.has(c)) {
          slotIndex = c;
          break;
        }
      }

      const newSticker = {
        id: uid('st'),
        stickerId,
        mode,
        slotIndex: mode === 'push' ? slotIndex : null,
        shelfIndex: 0,
        xPct: mode === 'push' ? Number((((slotIndex + 0.5) / cols) * 100).toFixed(2)) : xPct,
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
      this.toast(
        mode === 'push'
          ? 'Đã đặt sticker ở chế độ Đẩy sách — sách tự nhường ô, không bị đè!'
          : 'Đã dán lên kệ (Overlay) — kéo thả tự do hoặc đổi sang Đẩy sách!'
      );
    }

    setStickerPlacementMode(rawMode, { fromBanner = false } = {}) {
      const nextMode = rawMode === 'push' ? 'push' : 'overlay';
      const cols = Math.max(1, this.computeShelfCols());
      const list = [...(this.state.shelfConfig.placedStickers || [])];
      const selected = this.getSelectedSticker();

      const applyModeToItem = (item) => {
        if (nextMode === 'push') {
          if (item.slotIndex == null || Number.isNaN(Number(item.slotIndex))) {
            item.slotIndex = Math.max(0, Math.min(cols - 1, Math.floor(((item.xPct ?? 50) / 100) * cols)));
          } else {
            item.slotIndex = Math.max(0, Math.min(cols - 1, Math.round(Number(item.slotIndex))));
          }
          item.xPct = Number((((item.slotIndex + 0.5) / cols) * 100).toFixed(2));
          item.yOffset = 0;
          item.mode = 'push';
        } else {
          if (item.mode === 'push' && item.slotIndex != null) {
            const c = Math.max(0, Math.min(cols - 1, Math.round(Number(item.slotIndex))));
            item.xPct = Number((((c + 0.5) / cols) * 100).toFixed(2));
          }
          item.mode = 'overlay';
        }
      };

      if (selected) {
        const target = list.find((s) => s.id === selected.id);
        if (target) applyModeToItem(target);
      } else if (fromBanner && list.length > 0) {
        for (const item of list) {
          applyModeToItem(item);
        }
      }

      this.updateShelfConfig({
        defaultStickerMode: nextMode,
        placedStickers: list,
      });
      this.updateStickerInspectorUI();
      this.toast(
        nextMode === 'push'
          ? 'Chế độ Đẩy sách (Không đè): Sticker đứng riêng 1 ô và đẩy sách sang bên'
          : 'Chế độ Đè lên (Overlay): Kéo thả sticker tự do trên kệ và sách'
      );
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
      const activeMode = st
        ? st.mode === 'push'
          ? 'push'
          : 'overlay'
        : this.state.shelfConfig?.defaultStickerMode === 'push'
        ? 'push'
        : 'overlay';

      // Sync top edit banner mode buttons & hint text
      document.querySelectorAll('.banner-mode-btn[data-banner-sticker-mode]').forEach((btn) => {
        const isAct = btn.dataset.bannerStickerMode === activeMode;
        btn.classList.toggle('active', isAct);
        btn.setAttribute('aria-checked', String(isAct));
      });
      const bannerHint = document.getElementById('edit-banner-hint');
      if (bannerHint) {
        bannerHint.textContent =
          activeMode === 'push'
            ? 'Đẩy sách: kéo sticker thả vào ô bất kỳ để đẩy sách sang bên'
            : 'Đè lên (Overlay): kéo sticker tự do tới bất kỳ vị trí nào';
      }

      if (!inspector) return;
      const show = this.editStickersMode && Boolean(st);
      inspector.classList.toggle('hidden', !show);
      if (show && st) {
        const sc = document.getElementById('insp-scale');
        const rot = document.getElementById('insp-rotate');
        if (sc) sc.value = String(st.scale ?? 1);
        if (rot) rot.value = String(st.rotate ?? 0);
        inspector.querySelectorAll('.insp-mode-btn[data-sticker-mode]').forEach((btn) => {
          const isAct = btn.dataset.stickerMode === (st.mode === 'push' ? 'push' : 'overlay');
          btn.classList.toggle('active', isAct);
          btn.setAttribute('aria-checked', String(isAct));
        });
      }
    }

    applyLiveStickerTransform(el, st) {
      const asset = this.renderStickerContent(st.stickerId);
      if (!asset || !el) return;
      const w = Math.round(asset.baseWidth * (st.scale || 1));
      el.style.width = `${w}px`;
      if (st.mode === 'push') {
        el.style.left = '';
        el.style.bottom = '';
        el.style.transform = `translateY(${-(st.yOffset || 0)}px) rotate(${st.rotate || 0}deg) scaleX(${st.flipX ? -1 : 1})`;
      } else {
        el.style.left = `${st.xPct}%`;
        el.style.bottom = `${8 + (st.yOffset || 0)}px`;
        el.style.transform = `translateX(-50%) rotate(${st.rotate || 0}deg) scaleX(${st.flipX ? -1 : 1})`;
      }
    }

    clearPushDropPreviews() {
      document.querySelectorAll('.push-drop-preview').forEach((el) => el.classList.remove('push-drop-preview'));
      document.querySelectorAll('.wooden-shelf-tier.drop-target').forEach((t) => t.classList.remove('drop-target'));
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
        document.querySelectorAll('.placed-sticker.selected, .shelf-sticker-slot.selected').forEach((n) =>
          n.classList.remove('selected')
        );
        stickerEl.classList.add('selected');
        stickerEl.closest('.shelf-sticker-slot')?.classList.add('selected');
        this.updateStickerInspectorUI();
      }

      const stageEl = stickerEl.closest('.wooden-shelf-stage');
      if (!stageEl) return;
      const stageRect = stageEl.getBoundingClientRect();
      const cols = Math.max(1, this.computeShelfCols());
      const isPushMode = st.mode === 'push';

      stickerEl.setPointerCapture?.(e.pointerId);
      stickerEl.classList.add('dragging');

      const startX = e.clientX;
      const startY = e.clientY;
      const origXPct = st.xPct ?? 50;
      const origYOff = st.yOffset ?? 0;
      let moved = false;
      let hoverTierIdx = st.shelfIndex || 0;
      let hoverSlotIdx = st.slotIndex ?? 0;

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

        if (isPushMode) {
          // Smooth pointer-following lift + live target slot highlight
          stickerEl.style.transform = `translate(${dx}px, ${dy}px) rotate(${st.rotate || 0}deg) scaleX(${
            st.flipX ? -1 : 1
          })`;
          this.clearPushDropPreviews();
          const tiers = Array.from(document.querySelectorAll('.wooden-shelf-tier'));
          for (const t of tiers) {
            const r = t.getBoundingClientRect();
            if (ev.clientY >= r.top - 12 && ev.clientY <= r.bottom + 12) {
              hoverTierIdx = parseInt(t.dataset.shelfTier, 10) || 0;
              const itemsEl = t.querySelector('.wooden-shelf-items');
              const ir = (itemsEl || t).getBoundingClientRect();
              hoverSlotIdx = Math.max(
                0,
                Math.min(cols - 1, Math.floor(((ev.clientX - ir.left) / Math.max(1, ir.width)) * cols))
              );
              t.classList.add('drop-target');
              const targetCell = itemsEl?.querySelector(`[data-col-idx="${hoverSlotIdx}"]`);
              targetCell?.classList.add('push-drop-preview');
              break;
            }
          }
          return;
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
        this.clearPushDropPreviews();

        if (!moved) {
          if (!this.editStickersMode && stickerEl.dataset.interactive === 'lamp') {
            const nextLit = !this.state.shelfConfig.lampLit;
            this.updateShelfConfig({ lampLit: nextLit });
          }
          return;
        }

        if (isPushMode) {
          const nextXPct = Number((((hoverSlotIdx + 0.5) / cols) * 100).toFixed(2));
          this.updatePlacedSticker(
            id,
            {
              mode: 'push',
              shelfIndex: hoverTierIdx,
              slotIndex: hoverSlotIdx,
              xPct: nextXPct,
              yOffset: 0,
            },
            true
          );
          this.renderShelfPage();
          return;
        }

        // Overlay mode: check if dropped onto another shelf tier!
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
      const seriesDisplayNames = new Map();
      const type = this.route === 'genres' ? 'genre' : this.route === 'authors' ? 'author' : 'series';
      const metaMod = window.PaperInkMetadata;

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
          const manualOv = Boolean(this.state.bookMetaOverrides?.[book.id]?.manual);
          if (!manualOv && metaMod?.isSeriesSameAsAuthor?.(book.series, book.author)) {
            continue;
          }
          const key = this.canonicalSeriesKey(book.series);
          if (!key) continue;
          if (!groups.has(key)) {
            groups.set(key, []);
            seriesDisplayNames.set(key, book.series);
          } else {
            // Prefer shorter canonical name without leading "The " when another book omits it
            const prevName = seriesDisplayNames.get(key) || book.series;
            if (/^the\s+/i.test(prevName) && !/^the\s+/i.test(book.series)) {
              seriesDisplayNames.set(key, book.series);
            }
          }
          groups.get(key).push(book);
        }
      }

      let list = Array.from(groups.entries()).map(([rawKey, books]) => {
        const name = type === 'series' ? seriesDisplayNames.get(rawKey) || rawKey : rawKey;
        if (type === 'series') {
          books.sort((a, b) => (a.seriesIndex ?? 9999) - (b.seriesIndex ?? 9999));
        }
        const readCount = books.filter((b) => (b.progress?.bookPercent || 0) >= 95).length;
        const activeCount = books.filter((b) => (b.progress?.bookPercent || 0) > 0).length;
        const primaryAuthor = books[0]?.author || '';
        const profile = type === 'series' ? this.getSeriesProfile(name, books) : null;
        return { name, books, count: books.length, readCount, activeCount, primaryAuthor, profile };
      });

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const qTag = q.replace(/^#/, '');
        list = list.filter(
          (g) =>
            g.name.toLowerCase().includes(q) ||
            g.primaryAuthor.toLowerCase().includes(q) ||
            (g.profile?.genres || []).some((gn) => gn.toLowerCase().includes(qTag)) ||
            (g.profile?.tags || []).some((tg) => tg.toLowerCase().includes(qTag))
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
            .map(
              (b, idx) =>
                `<div class="fan-cover fan-${idx}">${this.renderCoverMarkup(b)}${
                  type === 'series' && b.seriesIndex != null
                    ? `<span class="fan-series-badge tabular">#${b.seriesIndex}</span>`
                    : ''
                }</div>`
            )
            .join('');

          const pct = g.count > 0 ? Math.round((g.readCount / g.count) * 100) : 0;
          const seriesGenres = type === 'series' ? (g.profile?.genres || []).slice(0, 2) : [];
          const seriesGenresHtml = seriesGenres.length
            ? `<div class="col-series-genres">${seriesGenres
                .map((gn) => `<span class="col-genre-mini">${escHtml(gn)}</span>`)
                .join('')}</div>`
            : '';
          const seriesDescPreview =
            type === 'series' ? String(g.profile?.description || '').replace(/\s+/g, ' ').trim() : '';
          const progressMarkup =
            type === 'series'
              ? `
                ${seriesGenresHtml}
                ${seriesDescPreview ? `<p class="col-series-desc">${escHtml(seriesDescPreview)}</p>` : ''}
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

          const cScopeKey = this.makeWallpaperScopeKey(type, g.name);
          const cScopedWp = this.getScopedWallpaperEntry(cScopeKey);
          let wpDotHtml = '';
          if (cScopedWp) {
            const cImg = this.getWallpaperUrl(cScopeKey);
            const cPreset = window.PaperInkShelfDecor?.getPresetById(cScopedWp.bgPreset);
            const dotStyle =
              cScopedWp.bgMode === 'image' && cImg
                ? `background-image:url('${escHtml(cImg)}')`
                : cScopedWp.bgMode === 'preset' && cPreset
                ? `background:${cPreset.css}`
                : `background:${escHtml(cScopedWp.bgColor || '#0B57D0')}`;
            wpDotHtml = `<span class="col-wp-dot" style="${dotStyle}" title="Kệ này đang có hình nền riêng"></span>`;
          }

          return `
            <article class="collection-card glass-card ${type === 'series' ? 'series-collection-card' : ''}"
                     data-open-collection-type="${type}"
                     data-open-collection-val="${escHtml(g.name)}"
                     tabindex="0"
                     role="button">
              <div class="collection-fan">${fanHtml}</div>
              <div class="collection-meta">
                <div class="collection-top">
                  <h3 class="collection-name">${escHtml(g.name)}</h3>
                  <div class="collection-top-right">
                    ${wpDotHtml}
                    <span class="collection-count tabular">${g.count}</span>
                    ${
                      type === 'series'
                        ? `<button class="series-more-btn" data-open-series-info="${escHtml(g.name)}" type="button" title="Thể loại & mô tả bộ truyện" aria-label="Xem thể loại và mô tả bộ truyện ${escHtml(g.name)}">${ICONS.moreVert}</button>`
                        : ''
                    }
                  </div>
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

    // ---- STUDIO SHEET (KỆ GỖ, MÀU/ẢNH NỀN MỌI NỀN HOẶC RIÊNG TỪNG KỆ, TẢI STICKER) ----
    getScopeCandidatesByType(type = 'series') {
      const all = this.getMergedBooks();
      const metaMod = window.PaperInkMetadata;
      if (type === 'series') {
        const counts = new Map();
        const displayNames = new Map();
        for (const b of all) {
          if (!b.series) continue;
          const manualOv = Boolean(this.state.bookMetaOverrides?.[b.id]?.manual);
          if (!manualOv && metaMod?.isSeriesSameAsAuthor?.(b.series, b.author)) continue;
          const key = this.canonicalSeriesKey(b.series);
          if (!key) continue;
          counts.set(key, (counts.get(key) || 0) + 1);
          if (!displayNames.has(key)) displayNames.set(key, b.series);
          else if (/^the\s+/i.test(displayNames.get(key)) && !/^the\s+/i.test(b.series)) {
            displayNames.set(key, b.series);
          }
        }
        return Array.from(counts.entries())
          .map(([k, cnt]) => {
            const name = displayNames.get(k) || k;
            return { value: name, key: `series:${k}`, label: `${name} (${cnt} cuốn)`, count: cnt };
          })
          .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
      }
      if (type === 'genre') {
        const counts = new Map();
        for (const b of all) {
          for (const g of b.genres || ['General Fiction']) {
            counts.set(g, (counts.get(g) || 0) + 1);
          }
        }
        return Array.from(counts.entries())
          .map(([g, cnt]) => ({ value: g, key: `genre:${g}`, label: `${g} (${cnt} cuốn)`, count: cnt }))
          .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
      }
      if (type === 'author') {
        const counts = new Map();
        for (const b of all) {
          const a = b.author || 'Unknown Author';
          counts.set(a, (counts.get(a) || 0) + 1);
        }
        return Array.from(counts.entries())
          .map(([a, cnt]) => ({ value: a, key: `author:${a}`, label: `${a} (${cnt} cuốn)`, count: cnt }))
          .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
      }
      if (type === 'folder') {
        return (this.state.folders || []).map((f) => ({
          value: f.id,
          key: `folder:${f.id}`,
          label: `${f.name} (${(f.bookIds || []).length} cuốn)`,
          count: (f.bookIds || []).length,
        }));
      }
      if (type === 'route') {
        return [
          { value: 'shelf', key: 'route:shelf', label: 'Kệ sách chính' },
          { value: 'series', key: 'route:series', label: 'Tab Bộ truyện' },
          { value: 'genres', key: 'route:genres', label: 'Tab Thể loại' },
          { value: 'authors', key: 'route:authors', label: 'Tab Tác giả' },
          { value: 'progress', key: 'route:progress', label: 'Tab Tiến độ' },
        ];
      }
      return [];
    }

    setStudioScopeMode(mode) {
      this.studioScopeMode = mode === 'scoped' ? 'scoped' : 'global';
      if (this.studioScopeMode === 'global') {
        this.studioScopeKey = 'global';
      } else {
        if (this.drilldown) {
          this.studioScopeType = this.drilldown.type;
          this.studioScopeValue = this.drilldown.value;
          this.studioScopeKey = this.makeWallpaperScopeKey(this.drilldown.type, this.drilldown.value);
        } else if (!this.studioScopeKey || this.studioScopeKey === 'global') {
          this.setStudioScopeType(this.studioScopeType || 'series', null, false);
        }
      }
      this.renderStudioSheet();
      this.applyBackgroundToDOM();
    }

    setStudioScopeType(type, preferredVal = null, rerender = true) {
      this.studioScopeType = type;
      const opts = this.getScopeCandidatesByType(type);
      if (preferredVal) {
        this.studioScopeValue = preferredVal;
        this.studioScopeKey = this.makeWallpaperScopeKey(type, preferredVal);
      } else if (opts.length > 0) {
        this.studioScopeValue = opts[0].value;
        this.studioScopeKey = opts[0].key;
      } else {
        this.studioScopeValue = '';
        this.studioScopeKey = 'global';
      }
      if (rerender) {
        this.renderStudioSheet();
        this.applyBackgroundToDOM();
      }
    }

    openStudioSheet(preferredScope = null) {
      this.closeAllSheets();
      if (preferredScope && preferredScope.type && preferredScope.value) {
        this.studioScopeMode = 'scoped';
        this.studioScopeType = preferredScope.type;
        this.studioScopeValue = preferredScope.value;
        this.studioScopeKey = this.makeWallpaperScopeKey(preferredScope.type, preferredScope.value);
      } else if (this.drilldown) {
        this.studioScopeMode = 'scoped';
        this.studioScopeType = this.drilldown.type;
        this.studioScopeValue = this.drilldown.value;
        this.studioScopeKey = this.makeWallpaperScopeKey(this.drilldown.type, this.drilldown.value);
      } else if (this.getScopedWallpaperEntry(`route:${this.route}`)) {
        this.studioScopeMode = 'scoped';
        this.studioScopeType = 'route';
        this.studioScopeValue = this.route;
        this.studioScopeKey = `route:${this.route}`;
      } else {
        this.studioScopeMode = 'global';
        this.studioScopeKey = 'global';
      }
      document.getElementById('studio-backdrop')?.classList.add('open');
      document.getElementById('studio-sheet')?.classList.add('open');
      this.renderStudioSheet();
      this.applyBackgroundToDOM();
    }

    openMoreSheet() {
      this.closeAllSheets();
      document.getElementById('more-backdrop')?.classList.add('open');
      document.getElementById('more-sheet')?.classList.add('open');
    }

    renderStudioSheet() {
      const decorMod = window.PaperInkShelfDecor;
      if (!decorMod) return;
      const globalCfg = this.state.shelfConfig;
      const target = this.getEditingWallpaperTarget();
      const cfg = target.cfg;
      const activeScopeKey = target.scopeKey;

      // 1. Shelf Styles
      const styleGrid = document.getElementById('shelf-style-grid');
      if (styleGrid) {
        styleGrid.innerHTML = decorMod.SHELF_STYLES.map(
          (s) => `
            <button class="shelf-style-card ${globalCfg.shelfStyle === s.id ? 'active' : ''}" data-shelf-style="${s.id}" type="button">
              <span class="shelf-swatch shelf-swatch-${s.id}" aria-hidden="true"></span>
              <span>${escHtml(s.name)}</span>
            </button>
          `
        ).join('');
      }

      // 2A. Wallpaper Scope Selector (Global vs Specific Series / Genre / Author / Folder / Route)
      const isScopedMode = this.studioScopeMode === 'scoped';
      document.querySelectorAll('.wp-scope-mode-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.wpscopeMode === (isScopedMode ? 'scoped' : 'global'));
      });

      const scopedBtnLabel = document.getElementById('wp-scope-scoped-label');
      if (scopedBtnLabel) {
        if (this.drilldown) {
          const shortLbl = String(this.drilldown.label || this.drilldown.value || '').slice(0, 18);
          scopedBtnLabel.textContent = `Chỉ kệ: ${shortLbl}${String(this.drilldown.label || '').length > 18 ? '…' : ''}`;
        } else {
          scopedBtnLabel.textContent = isScopedMode ? 'Riêng từng kệ' : 'Riêng từng kệ…';
        }
      }

      const pickerWrap = document.getElementById('wp-scope-picker-wrap');
      pickerWrap?.classList.toggle('hidden', !isScopedMode);

      if (isScopedMode) {
        document.querySelectorAll('.wp-type-pill').forEach((btn) => {
          btn.classList.toggle('active', btn.dataset.wptype === this.studioScopeType);
        });

        const selectEl = document.getElementById('wp-scope-target-select');
        const candidates = this.getScopeCandidatesByType(this.studioScopeType);
        if (selectEl) {
          if (!candidates.length) {
            selectEl.innerHTML = `<option value="">Chưa có mục nào trong nhóm này</option>`;
            selectEl.disabled = true;
          } else {
            selectEl.disabled = false;
            // Ensure current studioScopeKey matches one of candidates (or add current value)
            const matched = candidates.find((c) => c.key === this.studioScopeKey);
            if (!matched && candidates[0]) {
              this.studioScopeValue = candidates[0].value;
              this.studioScopeKey = candidates[0].key;
            }
            selectEl.innerHTML = candidates
              .map(
                (c) =>
                  `<option value="${escHtml(c.value)}" ${c.key === this.studioScopeKey ? 'selected' : ''}>${escHtml(c.label)}</option>`
              )
              .join('');
          }
        }

        const statusBadge = document.getElementById('wp-scope-status-badge');
        const resetBtn = document.getElementById('reset-scoped-wp-btn');
        const curScopedEntry = this.getScopedWallpaperEntry(this.studioScopeKey);
        if (statusBadge) {
          if (curScopedEntry) {
            statusBadge.textContent = `Đang dùng nền riêng cho ${this.describeWallpaperScope(this.studioScopeType, this.studioScopeValue)}`;
            statusBadge.classList.add('custom-active');
          } else if (this.studioScopeKey !== 'global') {
            statusBadge.textContent = 'Đang theo Mọi nền — chọn màu/ảnh bên dưới để tạo nền riêng';
            statusBadge.classList.remove('custom-active');
          } else {
            statusBadge.textContent = 'Hãy tạo thư mục trước để đặt nền riêng';
            statusBadge.classList.remove('custom-active');
          }
        }
        resetBtn?.classList.toggle('hidden', !curScopedEntry);
      }

      // Active Scoped Wallpapers Quick Chips
      const activeWrap = document.getElementById('active-scoped-wp-wrap');
      const activeChipsEl = document.getElementById('active-scoped-wp-chips');
      const allScopedEntries = Object.values(globalCfg.scopedWallpapers || {})
        .filter((e) => e && typeof e === 'object' && !e.removed && e.scopeKey)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

      if (activeWrap && activeChipsEl) {
        activeWrap.classList.toggle('hidden', allScopedEntries.length === 0);
        activeChipsEl.innerHTML = allScopedEntries
          .map((e) => {
            const eImg = this.getWallpaperUrl(e.scopeKey);
            const ePreset = decorMod.getPresetById(e.bgPreset);
            const swStyle =
              e.bgMode === 'image' && eImg
                ? `background-image:url('${escHtml(eImg)}')`
                : e.bgMode === 'preset' && ePreset
                ? `background:${ePreset.css}`
                : `background:${escHtml(e.bgColor || '#F8F9FA')}`;
            const isEditing = isScopedMode && this.studioScopeKey === e.scopeKey;
            const lbl = e.label || this.describeWallpaperScope(e.scopeType, e.scopeValue);
            return `
              <span class="scoped-wp-chip ${isEditing ? 'editing' : ''}">
                <button class="scoped-wp-chip-select" data-select-scoped-wp="${escHtml(e.scopeKey)}" type="button" title="Chỉnh nền riêng của ${escHtml(lbl)}">
                  <span class="scoped-wp-swatch" style="${swStyle}"></span>
                  <span>${escHtml(lbl)}</span>
                </button>
                <button class="scoped-wp-chip-del" data-remove-scoped-wp="${escHtml(e.scopeKey)}" type="button" title="Gỡ nền riêng" aria-label="Gỡ nền riêng ${escHtml(lbl)}">${ICONS.close}</button>
              </span>
            `;
          })
          .join('');
      }

      // 2B. Background Mode (Color vs Preset vs Image)
      const curMode = ['color', 'preset', 'image'].includes(cfg.bgMode) ? cfg.bgMode : 'color';
      document.querySelectorAll('.bg-mode-pill').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.bgmode === curMode);
      });
      document.getElementById('bg-color-panel')?.classList.toggle('hidden', curMode !== 'color');
      document.getElementById('bg-preset-panel')?.classList.toggle('hidden', curMode !== 'preset');
      document.getElementById('bg-image-panel')?.classList.toggle('hidden', curMode !== 'image');

      const colorInp = document.getElementById('custom-bg-color-input');
      const hexLbl = document.getElementById('custom-bg-hex');
      if (colorInp) colorInp.value = cfg.bgColor || '#F8F9FA';
      if (hexLbl) hexLbl.textContent = (cfg.bgColor || '#F8F9FA').toUpperCase();

      const ambChk = document.getElementById('set-bg-ambient');
      if (ambChk) ambChk.checked = cfg.bgAmbient !== false;

      const swBox = document.getElementById('bg-color-swatches');
      if (swBox) {
        swBox.innerHTML = decorMod.BG_COLORS.map(
          (c) => `
            <button class="bg-color-dot ${curMode === 'color' && (cfg.bgColor || '').toUpperCase() === c.hex.toUpperCase() ? 'active' : ''}"
                    data-pick-color="${c.hex}"
                    style="background:${c.hex}"
                    title="${escHtml(c.name)}"
                    aria-label="Màu nền ${escHtml(c.name)}"
                    type="button"></button>
          `
        ).join('');
      }

      // Artistic Presets Grid
      const presetGrid = document.getElementById('bg-preset-grid');
      if (presetGrid) {
        presetGrid.innerHTML = (decorMod.WALLPAPER_PRESETS || [])
          .map(
            (p) => `
            <button class="wp-preset-card ${curMode === 'preset' && cfg.bgPreset === p.id ? 'active' : ''}"
                    data-pick-preset="${p.id}"
                    type="button">
              <span class="wp-preset-preview" style="background:${p.css}" aria-hidden="true"></span>
              <span class="wp-preset-name">${escHtml(p.name)}</span>
            </button>
          `
          )
          .join('');
      }
      const blurPctVal = Math.max(0, Math.min(100, Math.round(Number(cfg.bgBlur || 0))));
      const presetBlurInp = document.getElementById('set-preset-blur');
      const presetBlurVal = document.getElementById('val-preset-blur');
      if (presetBlurInp) presetBlurInp.value = String(blurPctVal);
      if (presetBlurVal) presetBlurVal.textContent = `${blurPctVal}%`;
      const presetDimInp = document.getElementById('set-preset-dim');
      const presetDimVal = document.getElementById('val-preset-dim');
      if (presetDimInp) presetDimInp.value = String(cfg.bgDim || 0);
      if (presetDimVal) presetDimVal.textContent = `${cfg.bgDim || 0}%`;

      // Custom Image Upload controls (per-scope!)
      const hasScopeImg = Boolean(this.getWallpaperUrl(activeScopeKey));
      document.getElementById('clear-wallpaper-btn')?.classList.toggle('hidden', !hasScopeImg);
      const upBtnLbl = document.getElementById('upload-wallpaper-btn-label');
      const scopeHint = document.getElementById('wp-image-scope-hint');
      const targetDesc =
        activeScopeKey === 'global'
          ? 'Mọi nền (toàn bộ ứng dụng)'
          : this.describeWallpaperScope(this.studioScopeType, this.studioScopeValue);
      if (upBtnLbl) {
        upBtnLbl.textContent = hasScopeImg ? 'Đổi ảnh nền khác' : 'Chọn ảnh nền từ máy';
      }
      if (scopeHint) {
        scopeHint.textContent = `Ảnh tải lên sẽ áp dụng cho: ${targetDesc}. Mỗi bộ truyện hoặc thể loại có thể lưu 1 ảnh nền riêng biệt.`;
      }

      const blurInp = document.getElementById('set-wp-blur');
      const blurVal = document.getElementById('val-wp-blur');
      if (blurInp) blurInp.value = String(blurPctVal);
      if (blurVal) blurVal.textContent = `${blurPctVal}%`;
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

    async sampleImageAverageHex(url) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            const cv = document.createElement('canvas');
            cv.width = 16;
            cv.height = 16;
            const ctx = cv.getContext('2d');
            ctx.drawImage(img, 0, 0, 16, 16);
            const data = ctx.getImageData(0, 0, 16, 16).data;
            let r = 0, g = 0, b = 0, n = 0;
            for (let i = 0; i < data.length; i += 4) {
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
              n++;
            }
            if (!n) return resolve('#24262B');
            const toHex = (v) => Math.round(v / n).toString(16).padStart(2, '0');
            resolve(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
          } catch (_) {
            resolve('#24262B');
          }
        };
        img.onerror = () => resolve('#24262B');
        img.src = url;
      });
    }

    async handleWallpaperUpload(file) {
      if (!file || !file.type.startsWith('image/')) {
        this.toast('Vui lòng chọn tệp ảnh hợp lệ');
        return;
      }
      const target = this.getEditingWallpaperTarget();
      const scopeKey = target.scopeKey || 'global';
      await window.PaperInkDB.setKV(this.getWallpaperBlobKey(scopeKey), file);

      const prevUrl = this.wallpaperUrls.get(scopeKey);
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      const nextUrl = URL.createObjectURL(file);
      this.wallpaperUrls.set(scopeKey, nextUrl);
      if (scopeKey === 'global') {
        this.customWallpaperUrl = nextUrl;
      }

      const avgHex = await this.sampleImageAverageHex(nextUrl);
      this.updateEditingWallpaper({
        bgMode: 'image',
        bgColor: avgHex,
        bgDim: Math.max(15, target.cfg?.bgDim || 15),
      });

      const targetName =
        scopeKey === 'global'
          ? 'Mọi nền'
          : this.describeWallpaperScope(this.studioScopeType, this.studioScopeValue);
      this.toast(`Đã đặt ảnh nền cho ${targetName}!`);
    }

    async clearCustomWallpaper() {
      const target = this.getEditingWallpaperTarget();
      const scopeKey = target.scopeKey || 'global';
      await window.PaperInkDB.setKV(this.getWallpaperBlobKey(scopeKey), null);
      const prevUrl = this.wallpaperUrls.get(scopeKey);
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
        this.wallpaperUrls.delete(scopeKey);
      }
      if (scopeKey === 'global') {
        this.customWallpaperUrl = null;
      }
      this.updateEditingWallpaper({ bgMode: 'color', bgBlur: 0, bgDim: 0 });
      this.toast('Đã gỡ ảnh nền tải lên');
    }

    // ---- Open / Download / Import EPUB ----
    async downloadBookOffline(bookId, silent = false) {
      const book = this.getMergedBooks().find((b) => b.id === bookId);
      if (!book || this.downloadingIds.has(bookId)) return null;

      this.downloadingIds.add(bookId);
      if (!silent) this.renderCurrentRoute();

      try {
        const res = await fetch(this.apiUrl(`/api/books/${encodeURIComponent(bookId)}/file`));
        if (!res.ok) throw new Error('Download failed');
        const epubBlob = await res.blob();

        let coverBlob = null;
        if (book.coverUrl) {
          try {
            const cRes = await fetch(this.resolveServerAssetUrl(book.coverUrl));
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
          tags: Array.isArray(book.tags) ? book.tags : [],
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
        } else if (this.p2p && this.p2p.isClient && this.p2p.isConnected()) {
          this.toast('Đang tải sách từ máy tính qua P2P…');
          epubBlob = await this.p2p.requestBookFromHost(bookId, book.fileName);
          if (epubBlob) {
            window.PaperInkDB.saveOfflineBook({
              id: book.id,
              title: book.title,
              author: book.author,
              series: book.series || '',
              seriesIndex: book.seriesIndex ?? null,
              genres: Array.isArray(book.genres) ? book.genres : [],
              tags: Array.isArray(book.tags) ? book.tags : [],
              description: book.description || '',
              language: book.language || 'en',
              fileName: book.fileName || `${book.id}.epub`,
              size: epubBlob.size,
              savedAt: Date.now(),
              isLocalImport: false,
              coverBlob: null,
              epubBlob,
            }).then(() => this.reloadOfflineMeta()).catch(() => {});
          }
        } else {
          this.toast('Đang mở sách Online…');
          const res = await fetch(this.apiUrl(`/api/books/${encodeURIComponent(bookId)}/file`));
          if (!res.ok) throw new Error('Không thể tải sách từ PC');
          epubBlob = await res.blob();

          if (this.state.settings.autoSaveOffline) {
            let coverBlob = null;
            if (book.coverUrl) {
              try {
                const cRes = await fetch(this.resolveServerAssetUrl(book.coverUrl));
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
              tags: Array.isArray(book.tags) ? book.tags : [],
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
      const validFiles = Array.from(files).filter((f) => /\.epub$/i.test(f.name));
      if (!validFiles.length) {
        this.toast('Vui lòng chọn tệp .epub hợp lệ');
        return;
      }

      // When connected to PC Server: upload EPUBs straight into PC Online library pool (no heavy phone storage!)
      if (this.isOnlineToServer) {
        this.toast(`Đang tải ${validFiles.length} cuốn lên mục Online & tự động gắn nhãn…`);
        let uploaded = 0;
        let lastBooks = null;
        const uploadedBooks = [];
        for (const file of validFiles) {
          try {
            const res = await fetch(this.apiUrl('/api/books/upload'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/epub+zip',
                'X-Filename': encodeURIComponent(file.name),
              },
              body: file,
            });
            if (!res.ok) continue;
            const data = await res.json();
            if (data.ok) {
              uploaded++;
              if (data.book?.id) {
                uploadedBooks.push(data.book);
                if (this.state.hiddenBookIds?.[data.book.id]) {
                  delete this.state.hiddenBookIds[data.book.id];
                }
              }
              if (Array.isArray(data.books)) lastBooks = data.books;
            }
          } catch (err) {
            console.error('Upload EPUB to PC Online error:', err);
          }
        }
        if (uploaded > 0) {
          if (lastBooks) {
            this.serverBooks = lastBooks;
            this.knownServerBookIds = new Set(lastBooks.map((b) => b.id));
            window.PaperInkDB.setKV('libraryCatalog', this.serverBooks).catch(() => {});
          }
          this.scheduleSync();
          this.renderCurrentRoute();
          this.toast(`Đã tải ${uploaded} cuốn vào mục Online & gắn nhãn tự động!`);
          if (uploadedBooks.length) {
            this.autoEnrichNewBooks(uploadedBooks, { silent: false });
          }
          return;
        }
      }

      // Fallback when offline / standalone web: save directly to local Offline IndexedDB
      let imported = 0;
      const importedBooks = [];
      for (const file of validFiles) {
        try {
          const parsed = await window.PaperInkEpub.loadFromBlob(file, file.name);
          const coverBlob = await parsed.getCoverBlob();
          const id = `local_${file.name.replace(/[^a-z0-9]/gi, '_').slice(0, 24)}_${file.size}`;
          if (this.state.hiddenBookIds?.[id]) {
            delete this.state.hiddenBookIds[id];
          }
          const rec = {
            id,
            title: parsed.meta.title || file.name.replace(/\.epub$/i, ''),
            author: parsed.meta.author || 'Unknown Author',
            series: parsed.meta.series || '',
            seriesIndex: parsed.meta.seriesIndex ?? null,
            genres: Array.isArray(parsed.meta.genres) ? parsed.meta.genres : [],
            tags: Array.isArray(parsed.meta.tags) ? parsed.meta.tags : [],
            description: parsed.meta.description || '',
            language: parsed.meta.language || 'en',
            fileName: file.name,
            size: file.size,
            savedAt: Date.now(),
            isLocalImport: true,
            coverBlob,
            epubBlob: file,
          };
          await window.PaperInkDB.saveOfflineBook(rec);
          importedBooks.push(rec);
          parsed.destroy();
          imported++;
        } catch (err) {
          console.error('Import EPUB error:', err);
        }
      }
      if (imported > 0) {
        await this.reloadOfflineMeta();
        this.renderCurrentRoute();
        const first = importedBooks[0];
        const summaryBits = [];
        if (imported === 1 && first) {
          if (first.author && !/^unknown/i.test(first.author)) summaryBits.push(first.author);
          if (first.series) summaryBits.push(`Bộ ${first.series}`);
          if (first.genres?.[0]) summaryBits.push(first.genres[0]);
        }
        this.toast(
          summaryBits.length
            ? `Đã thêm & gắn nhãn: ${summaryBits.join(' · ')}`
            : `Đã thêm ${imported} cuốn EPUB & tự động gắn nhãn!`
        );
        this.autoEnrichNewBooks(importedBooks, { silent: imported > 1 });
      } else {
        this.toast('Vui lòng chọn tệp .epub hợp lệ');
      }
    }

    async persistMetaOverrideToOffline(bookId, override) {
      try {
        const rec = await window.PaperInkDB.getOfflineBook(bookId);
        if (!rec) return;
        await window.PaperInkDB.saveOfflineBook({
          ...rec,
          author: override.author || rec.author,
          series: override.series ?? rec.series,
          seriesIndex: override.seriesIndex !== undefined ? override.seriesIndex : rec.seriesIndex,
          genres: Array.isArray(override.genres) && override.genres.length ? override.genres : rec.genres,
          tags: Array.isArray(override.tags) ? override.tags : rec.tags,
          description: override.description || rec.description,
        });
        await this.reloadOfflineMeta();
      } catch (_) {}
    }

    async autoEnrichNewBooks(books, { silent = true } = {}) {
      const metaMod = window.PaperInkMetadata;
      if (!metaMod || typeof metaMod.enrichBookOnline !== 'function') return;
      if (!Array.isArray(books) || !books.length) return;

      let enrichedCount = 0;
      let lastSummary = '';
      for (const b of books.slice(0, 10)) {
        if (!b || !b.id || this.enrichingBookIds.has(b.id)) continue;
        this.enrichingBookIds.add(b.id);
        try {
          const srvBase = this.isOnlineToServer ? this.activeServerOrigin || '.' : false;
          const result = await metaMod.enrichBookOnline(b, { serverBase: srvBase });
          if (!result) continue;
          const override = {
            author: result.author || b.author || 'Unknown Author',
            series: result.series || '',
            seriesIndex: result.seriesIndex ?? null,
            genres: Array.isArray(result.genres) && result.genres.length ? result.genres : ['General Fiction'],
            tags: Array.isArray(result.tags) ? result.tags : [],
            description: result.description || b.description || '',
            goodreadsRating: result.goodreadsRating || b.goodreadsRating || null,
            goodreadsUrl: result.goodreadsUrl || b.goodreadsUrl || null,
            descSource: result.descSource || 'goodreads',
            updatedAt: Date.now(),
          };
          if (!this.state.bookMetaOverrides) this.state.bookMetaOverrides = {};
          this.state.bookMetaOverrides[b.id] = override;
          await this.persistMetaOverrideToOffline(b.id, override);
          enrichedCount++;
          if (books.length === 1) {
            const parts = [];
            if (override.author && !/^unknown/i.test(override.author)) parts.push(override.author);
            if (override.series) {
              parts.push(override.seriesIndex != null ? `${override.series} #${override.seriesIndex}` : override.series);
            }
            if (override.genres[0]) parts.push(override.genres[0]);
            if (override.tags.length) parts.push(override.tags.slice(0, 2).map((t) => `#${t}`).join(' '));
            lastSummary = parts.join(' · ');
          }
        } catch (err) {
          console.warn('[PaperInk Auto-Tag]', err);
        } finally {
          this.enrichingBookIds.delete(b.id);
        }
      }

      if (enrichedCount > 0) {
        this.scheduleSync();
        this.renderCurrentRoute();
        if (this.activeBookInfoId && document.getElementById('book-info-modal')?.classList.contains('open')) {
          this.renderBookInfoModal(this.activeBookInfoId);
        }
        if (!silent) {
          this.toast(
            lastSummary
              ? `Đã tự động gắn nhãn: ${lastSummary}`
              : `Đã tự động gắn nhãn (tag, thể loại, tác giả, bộ truyện) cho ${enrichedCount} cuốn!`
          );
        }
      }
    }

    async autoEnrichBook(bookId, { silent = false } = {}) {
      const book = this.getMergedBooks().find((b) => b.id === bookId);
      const metaMod = window.PaperInkMetadata;
      if (!book || !metaMod || this.enrichingBookIds.has(bookId)) return;

      this.enrichingBookIds.add(bookId);
      if (this.activeBookInfoId === bookId && document.getElementById('book-info-modal')?.classList.contains('open')) {
        this.renderBookInfoModal(bookId);
      }

      try {
        const srvBase = this.isOnlineToServer ? this.activeServerOrigin || '.' : false;
        const result = await metaMod.enrichBookOnline(book, { serverBase: srvBase, force: !silent });
        const override = {
          author: result.author || book.author || 'Unknown Author',
          series: result.series || '',
          seriesIndex: result.seriesIndex ?? null,
          genres: Array.isArray(result.genres) && result.genres.length ? result.genres : ['General Fiction'],
          tags: Array.isArray(result.tags) ? result.tags : [],
          description: result.description || book.description || '',
          goodreadsRating: result.goodreadsRating || book.goodreadsRating || null,
          goodreadsUrl: result.goodreadsUrl || book.goodreadsUrl || null,
          descSource: result.descSource || 'goodreads',
          updatedAt: Date.now(),
        };
        if (!this.state.bookMetaOverrides) this.state.bookMetaOverrides = {};
        this.state.bookMetaOverrides[bookId] = override;
        await this.persistMetaOverrideToOffline(bookId, override);
        this.scheduleSync();
        this.renderCurrentRoute();
        if (!silent) {
          const bits = [
            result.goodreadsRating ? `★ ${result.goodreadsRating} Goodreads` : '',
            override.genres[0],
            override.series ? `Bộ ${override.series}` : '',
          ].filter(Boolean);
          this.toast(
            result.enrichedOnline
              ? `Đã cập nhật mô tả & nhãn từ Goodreads: ${bits.join(' · ')}`
              : `Đã phân loại tự động: ${bits.join(' · ')}`
          );
        }
      } catch (err) {
        console.warn('[PaperInk Auto-Tag]', err);
        if (!silent) this.toast('Không thể tra cứu online — đã giữ nhãn phân loại từ tệp EPUB');
      } finally {
        this.enrichingBookIds.delete(bookId);
        if (this.activeBookInfoId === bookId && document.getElementById('book-info-modal')?.classList.contains('open')) {
          this.renderBookInfoModal(bookId);
        }
      }
    }

    async runBatchGoodreadsEnrich() {
      if (!this.isOnlineToServer) {
        this.toast('Cần kết nối tới máy chủ PC để đồng bộ toàn bộ từ Goodreads');
        return;
      }
      this.toast('Đang bắt đầu quét & đồng bộ toàn bộ sách & bộ truyện từ Goodreads…');
      try {
        const res = await fetch(this.apiUrl('/api/library/enrich-all'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ forceAllBooks: false }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data.books)) {
          this.serverBooks = data.books;
          window.PaperInkDB.setKV('libraryCatalog', this.serverBooks).catch(() => {});
        }
        if (data.state) {
          if (data.state.seriesMeta) {
            this.state.seriesMeta = Object.assign({}, this.state.seriesMeta, data.state.seriesMeta);
          }
          if (data.state.bookMetaOverrides) {
            this.state.bookMetaOverrides = Object.assign({}, this.state.bookMetaOverrides, data.state.bookMetaOverrides);
          }
          this.scheduleSync();
        }
        this.renderCurrentRoute();
        const stat = data.status || {};
        this.toast(`Goodreads: Đã cập nhật ${stat.updatedBooks || 0} sách và ${stat.updatedSeries || 0} bộ truyện!`);
      } catch (err) {
        console.error('[runBatchGoodreadsEnrich]', err);
        this.toast('Lỗi khi cập nhật Goodreads: ' + (err.message || 'Network error'));
      }
    }

    async saveBookMetaOverride(bookId, fields) {
      if (!bookId || !fields) return;
      const existing = this.getMergedBooks().find((b) => b.id === bookId);
      const parseCsv = (val) =>
        String(val || '')
          .split(/[,;]+/)
          .map((s) => s.replace(/^#+/, '').trim())
          .filter(Boolean);

      const author = String(fields.author || '').trim() || existing?.author || 'Unknown Author';
      const series = String(fields.series || '').trim();
      const rawIdx = String(fields.seriesIndex ?? '').trim();
      const parsedIdx = rawIdx === '' ? null : parseFloat(rawIdx);
      const seriesIndex = parsedIdx != null && !Number.isNaN(parsedIdx) ? parsedIdx : null;
      const genres = parseCsv(fields.genres);
      const tags = parseCsv(fields.tags);

      const override = {
        author,
        series,
        seriesIndex,
        genres: genres.length ? genres.slice(0, 6) : ['General Fiction'],
        tags: tags.slice(0, 10),
        description:
          fields.description !== undefined
            ? String(fields.description || '').trim()
            : existing?.description || '',
        goodreadsRating: existing?.goodreadsRating || null,
        goodreadsUrl: existing?.goodreadsUrl || null,
        descSource: existing?.descSource || 'manual',
        manual: true,
        updatedAt: Date.now(),
      };
      if (!this.state.bookMetaOverrides) this.state.bookMetaOverrides = {};
      this.state.bookMetaOverrides[bookId] = override;
      await this.persistMetaOverrideToOffline(bookId, override);
      this.scheduleSync();
      this.renderCurrentRoute();
      if (this.activeBookInfoId === bookId) {
        this.renderBookInfoModal(bookId);
      }
      this.toast('Đã lưu tác giả, bộ truyện, thể loại & tags!');
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

    getBooksForSeries(seriesName) {
      const targetKey = this.canonicalSeriesKey(seriesName);
      if (!targetKey) return [];
      const all = this.getMergedBooks();
      return all
        .filter((b) => b.series && this.canonicalSeriesKey(b.series) === targetKey)
        .sort((a, b) => (a.seriesIndex ?? 9999) - (b.seriesIndex ?? 9999));
    }

    getSeriesProfile(seriesName, booksArg = null) {
      const books = Array.isArray(booksArg) ? booksArg : this.getBooksForSeries(seriesName);
      const key = this.canonicalSeriesKey(seriesName);
      const stripKey = key.replace(/^(the|a|an)\s+/, '');
      const withTheKey = 'the ' + stripKey;
      const saved =
        this.state.seriesMeta?.[key] ||
        this.state.seriesMeta?.[stripKey] ||
        this.state.seriesMeta?.[withTheKey];
      const metaMod = window.PaperInkMetadata;
      const base =
        metaMod && typeof metaMod.synthesizeSeriesOverview === 'function'
          ? metaMod.synthesizeSeriesOverview(seriesName, books)
          : {
              series: seriesName,
              author: books[0]?.author || 'Unknown Author',
              genres: books[0]?.genres || ['General Fiction'],
              tags: ['Theo bộ'],
              description: `${seriesName} (${books.length} cuốn).`,
            };

      if (saved && typeof saved === 'object') {
        return {
          ...base,
          author: saved.author || base.author,
          subtitle: saved.subtitle || '',
          seriesUrl: saved.seriesUrl || '',
          genres: Array.isArray(saved.genres) && saved.genres.length ? saved.genres : base.genres,
          tags: Array.isArray(saved.tags) && saved.tags.length ? saved.tags : base.tags,
          description:
            typeof saved.description === 'string' && saved.description.trim()
              ? saved.description.trim()
              : base.description,
          enrichedOnline: Boolean(saved.enrichedOnline),
          manual: Boolean(saved.manual),
          updatedAt: saved.updatedAt || 0,
        };
      }
      return base;
    }

    openSeriesInfoModal(seriesName) {
      if (!seriesName) return;
      this.activeBookInfoId = null;
      this.activeSeriesInfoName = seriesName;
      this.closeAllSheets();
      const titleEl = document.getElementById('book-info-title');
      if (titleEl) titleEl.textContent = 'Thông tin Bộ truyện';
      this.renderSeriesInfoModal(seriesName);
      document.getElementById('book-info-backdrop')?.classList.add('open');
      document.getElementById('book-info-modal')?.classList.add('open');

      // Auto-enrich shared series description & genres online on first view if not yet saved
      const key = this.canonicalSeriesKey(seriesName);
      if (key && !this.state.seriesMeta?.[key] && !this.enrichingSeriesKeys.has(key)) {
        this.autoEnrichSeries(seriesName, { silent: true });
      }
    }

    renderSeriesInfoModal(seriesName) {
      const body = document.getElementById('book-info-body');
      if (!body) return;
      const books = this.getBooksForSeries(seriesName);
      if (!books.length) return;

      const key = this.canonicalSeriesKey(seriesName);
      const profile = this.getSeriesProfile(seriesName, books);
      const genres = (profile.genres || []).slice(0, 6);
      const tags = (profile.tags || []).slice(0, 8);
      const readCount = books.filter((b) => (b.progress?.bookPercent || 0) >= 95).length;
      const pct = Math.round((readCount / books.length) * 100);
      const isEnriching = this.enrichingSeriesKeys.has(key);

      // Next unread or in-progress book in series
      const nextBook =
        books.find((b) => {
          const p = b.progress?.bookPercent || 0;
          return p > 0 && p < 95;
        }) ||
        books.find((b) => (b.progress?.bookPercent || 0) < 95) ||
        books[0];

      const fanCovers = books.slice(0, 3);
      const fanHtml = fanCovers
        .map(
          (b, idx) =>
            `<div class="fan-cover fan-${idx}">${this.renderCoverMarkup(b)}${
              b.seriesIndex != null ? `<span class="fan-series-badge tabular">#${b.seriesIndex}</span>` : ''
            }</div>`
        )
        .join('');

      body.innerHTML = `
        <div class="book-info-hero series-info-hero">
          <div class="collection-fan series-modal-fan">${fanHtml}</div>
          <div class="book-info-meta">
            <h3 class="book-info-name">${escHtml(seriesName)}</h3>
            <button class="book-info-author book-info-link" data-filter-author="${escHtml(profile.author)}" type="button" title="Xem tất cả sách của tác giả này">${escHtml(profile.author)}</button>
            <div class="book-info-status-row">
              <span class="pct-pill tabular">${books.length} cuốn · Đã đọc ${readCount}/${books.length}</span>
              ${
                profile.seriesUrl
                  ? `<a class="goodreads-pill tabular" href="${escHtml(profile.seriesUrl)}" target="_blank" rel="noopener noreferrer" title="Mở trang bộ truyện trên Goodreads">Goodreads Series</a>`
                  : profile.enrichedOnline
                  ? `<span class="goodreads-pill tabular">Goodreads</span>`
                  : ''
              }
            </div>
            ${
              genres.length
                ? `<div class="book-info-genres">${genres
                    .map(
                      (g) =>
                        `<button class="genre-chip genre-chip-btn" data-filter-genre="${escHtml(g)}" type="button" title="Xem thể loại ${escHtml(g)}">${escHtml(g)}</button>`
                    )
                    .join('')}</div>`
                : ''
            }
            ${
              tags.length
                ? `<div class="book-info-tags">${tags
                    .map(
                      (t) =>
                        `<button class="tag-chip" data-filter-tag="${escHtml(t)}" type="button" title="Tìm sách gắn tag #${escHtml(t)}">#${escHtml(t)}</button>`
                    )
                    .join('')}</div>`
                : ''
            }
          </div>
        </div>

        ${
          pct > 0
            ? `<div class="book-info-prog-bar"><div class="prog-bar-track"><div class="prog-bar-fill" style="width:${pct}%"></div></div></div>`
            : ''
        }

        <div class="book-meta-actions">
          <button class="apple-pill-btn secondary small" data-auto-enrich-series="${escHtml(seriesName)}" type="button" ${isEnriching ? 'disabled' : ''}>
            ${isEnriching ? ICONS.spinner : ICONS.sparkles}
            <span>${isEnriching ? 'Đang tạo mô tả & nhãn…' : 'Tự động gắn thể loại & mô tả'}</span>
          </button>
          <button class="apple-pill-btn secondary small" id="toggle-series-edit-btn" type="button">
            ${ICONS.tag}
            <span>Chỉnh sửa bộ truyện</span>
          </button>
          <button class="apple-pill-btn secondary small" data-open-series-wallpaper="${escHtml(seriesName)}" type="button">
            ${ICONS.sparkles}
            <span>Nền riêng bộ truyện</span>
          </button>
        </div>

        <div id="series-meta-edit-panel" class="meta-edit-panel hidden">
          <div class="inset-group">
            <div class="inset-row stack-item">
              <div class="meta-edit-grid">
                <label class="meta-edit-field">
                  <span class="meta-edit-label">Thể loại bộ truyện (cách nhau bằng dấu phẩy)</span>
                  <input id="series-edit-genres" class="meta-edit-input" type="text" value="${escHtml(genres.join(', '))}" placeholder="Mystery & Detective, Thriller & Suspense" />
                </label>
                <label class="meta-edit-field">
                  <span class="meta-edit-label">Tags bộ truyện (cách nhau bằng dấu phẩy)</span>
                  <input id="series-edit-tags" class="meta-edit-input" type="text" value="${escHtml(tags.join(', '))}" placeholder="Theo bộ, Trinh thám, Tiếng Anh" />
                </label>
                <label class="meta-edit-field">
                  <span class="meta-edit-label">Mô tả chung bộ truyện (Description chung)</span>
                  <textarea id="series-edit-desc" class="book-review-textarea" rows="4" placeholder="Giới thiệu tổng quan về bối cảnh, nhân vật chính và nội dung xuyên suốt bộ truyện…">${escHtml(profile.description || '')}</textarea>
                </label>
              </div>
              <div class="book-info-actions">
                <button class="apple-pill-btn small" data-save-series-meta="${escHtml(seriesName)}" type="button">Lưu thông tin bộ truyện</button>
              </div>
            </div>
          </div>
        </div>

        <div class="inset-section">
          <div class="inset-section-label">Mô tả chung bộ truyện (Series Description)</div>
          <div class="inset-group">
            <div class="inset-row stack-item">
              <p class="book-info-desc">${escHtml(profile.description || '')}</p>
            </div>
          </div>
        </div>

        <div class="inset-section">
          <div class="inset-section-label">Các tập trong bộ (${books.length} cuốn · xếp #1 → #N)</div>
          <div class="inset-group">
            <div class="series-books-mini-list">
              ${books
                .slice(0, 12)
                .map((b) => {
                  const bp = Math.round(b.progress?.bookPercent || 0);
                  return `
                    <button class="series-book-mini-row" data-read-from-modal="${escHtml(b.id)}" type="button">
                      <span class="series-mini-idx tabular">${b.seriesIndex != null ? `#${b.seriesIndex}` : '•'}</span>
                      <span class="series-mini-title">${escHtml(b.title)}</span>
                      <span class="series-mini-pct tabular">${bp > 0 ? `${bp}%` : 'Đọc'}</span>
                    </button>
                  `;
                })
                .join('')}
              ${
                books.length > 12
                  ? `<div class="series-mini-more muted-text">… và ${books.length - 12} tập khác trong kệ bộ truyện</div>`
                  : ''
              }
            </div>
          </div>
        </div>

        <div class="book-info-actions" style="margin-top:12px">
          <button class="apple-pill-btn secondary small" data-filter-series="${escHtml(seriesName)}" type="button">Xem kệ bộ truyện</button>
          ${
            nextBook
              ? `<button class="apple-pill-btn small" data-read-from-modal="${escHtml(nextBook.id)}" type="button">${
                  nextBook.seriesIndex != null ? `Đọc Tập #${nextBook.seriesIndex}` : 'Bắt đầu đọc'
                }</button>`
              : ''
          }
        </div>
      `;
    }

    async autoEnrichSeries(seriesName, { silent = false } = {}) {
      const key = this.canonicalSeriesKey(seriesName);
      const metaMod = window.PaperInkMetadata;
      if (!key || !metaMod?.enrichSeriesOnline || this.enrichingSeriesKeys.has(key)) return;

      const books = this.getBooksForSeries(seriesName);
      if (!books.length) return;

      this.enrichingSeriesKeys.add(key);
      if (this.activeSeriesInfoName && this.canonicalSeriesKey(this.activeSeriesInfoName) === key) {
        this.renderSeriesInfoModal(this.activeSeriesInfoName);
      }

      try {
        const srvBase = this.isOnlineToServer ? this.activeServerOrigin || '.' : false;
        const res = await metaMod.enrichSeriesOnline(seriesName, books, { serverBase: srvBase, force: !silent });
        if (this.state.seriesMeta?.[key]?.manual) {
          // Do not overwrite manual user overrides
          return;
        }
        if (!this.state.seriesMeta) this.state.seriesMeta = {};
        this.state.seriesMeta[key] = {
          name: seriesName,
          author: res.author || '',
          subtitle: res.subtitle || '',
          seriesUrl: res.seriesUrl || '',
          genres: Array.isArray(res.genres) && res.genres.length ? res.genres : ['General Fiction'],
          tags: Array.isArray(res.tags) ? res.tags : ['Theo bộ'],
          description: res.description || '',
          enrichedOnline: Boolean(res.enrichedOnline),
          manual: false,
          updatedAt: Date.now(),
        };
        this.scheduleSync();
        this.renderCurrentRoute();
        if (!silent) {
          this.toast(`Đã cập nhật thể loại & mô tả bộ "${seriesName}"!`);
        }
      } catch (err) {
        console.warn('[PaperInk Series Enrich]', err);
        if (!silent) this.toast('Đã tổng hợp thể loại & mô tả từ các tập trong bộ');
      } finally {
        this.enrichingSeriesKeys.delete(key);
        if (
          this.activeSeriesInfoName &&
          this.canonicalSeriesKey(this.activeSeriesInfoName) === key &&
          document.getElementById('book-info-modal')?.classList.contains('open')
        ) {
          this.renderSeriesInfoModal(this.activeSeriesInfoName);
        }
      }
    }

    saveSeriesMetaOverride(seriesName, fields) {
      const key = this.canonicalSeriesKey(seriesName);
      if (!key || !fields) return;
      const parseCsv = (val) =>
        String(val || '')
          .split(/[,;]+/)
          .map((s) => s.replace(/^#+/, '').trim())
          .filter(Boolean);

      const genres = parseCsv(fields.genres);
      const tags = parseCsv(fields.tags);
      const description = String(fields.description || '').trim();

      if (!this.state.seriesMeta) this.state.seriesMeta = {};
      this.state.seriesMeta[key] = {
        name: seriesName,
        genres: genres.length ? genres.slice(0, 6) : ['General Fiction'],
        tags: tags.length ? tags.slice(0, 8) : ['Theo bộ'],
        description,
        manual: true,
        updatedAt: Date.now(),
      };
      this.scheduleSync();
      this.renderCurrentRoute();
      if (this.activeSeriesInfoName && this.canonicalSeriesKey(this.activeSeriesInfoName) === key) {
        this.renderSeriesInfoModal(this.activeSeriesInfoName);
      }
      this.toast(`Đã lưu thể loại & mô tả chung cho bộ "${seriesName}"!`);
    }

    openBookInfoModal(bookId) {
      if (!bookId) return;
      this.activeSeriesInfoName = null;
      this.activeBookInfoId = bookId;
      this.closeAllSheets();
      const titleEl = document.getElementById('book-info-title');
      if (titleEl) titleEl.textContent = 'Thông tin & Đánh giá sách';
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
      const tags = Array.isArray(book.tags) ? book.tags.slice(0, 8) : [];
      const desc = (book.description || '').trim();
      const statusLabel = pct >= 96 ? 'Đã hoàn thành' : pct > 0 || book.progress?.updatedAt ? `Đang đọc · ${pct}%` : 'Chưa bắt đầu';
      const isEnriching = this.enrichingBookIds.has(bookId);

      body.innerHTML = `
        <div class="book-info-hero">
          <div class="book-info-cover">${this.renderCoverMarkup(book)}</div>
          <div class="book-info-meta">
            <h3 class="book-info-name">${escHtml(book.title)}</h3>
            <button class="book-info-author book-info-link" data-filter-author="${escHtml(book.author || 'Unknown Author')}" type="button" title="Xem tất cả sách của tác giả này">${escHtml(book.author || 'Unknown Author')}</button>
            ${
              book.series
                ? `<button class="book-info-series book-info-link" data-filter-series="${escHtml(book.series)}" type="button" title="Xem toàn bộ bộ truyện này">${escHtml(book.series)}${book.seriesIndex != null ? ` · Tập #${book.seriesIndex}` : ''}</button>`
                : ''
            }
            <div class="book-info-status-row">
              <span class="pct-pill tabular">${statusLabel}</span>
              ${
                book.goodreadsRating
                  ? `<a class="goodreads-pill tabular" href="${escHtml(book.goodreadsUrl || `https://www.goodreads.com/search?q=${encodeURIComponent(book.title)}`)}" target="_blank" rel="noopener noreferrer" title="Mở trang sách trên Goodreads">★ ${book.goodreadsRating} Goodreads</a>`
                  : ''
              }
              ${book.isOffline ? `<span class="offline-pill">Offline</span>` : ''}
            </div>
            ${
              genres.length
                ? `<div class="book-info-genres">${genres
                    .map(
                      (g) =>
                        `<button class="genre-chip genre-chip-btn" data-filter-genre="${escHtml(g)}" type="button" title="Lọc theo thể loại ${escHtml(g)}">${escHtml(g)}</button>`
                    )
                    .join('')}</div>`
                : ''
            }
            ${
              tags.length
                ? `<div class="book-info-tags">${tags
                    .map(
                      (t) =>
                        `<button class="tag-chip" data-filter-tag="${escHtml(t)}" type="button" title="Tìm sách gắn tag #${escHtml(t)}">#${escHtml(t)}</button>`
                    )
                    .join('')}</div>`
                : ''
            }
          </div>
        </div>

        <div class="book-meta-actions">
          <button class="apple-pill-btn secondary small" data-auto-tag-book="${escHtml(bookId)}" type="button" ${isEnriching ? 'disabled' : ''}>
            ${isEnriching ? ICONS.spinner : ICONS.sparkles}
            <span>${isEnriching ? 'Đang tra cứu nhãn…' : 'Tự động gắn nhãn'}</span>
          </button>
          <button class="apple-pill-btn secondary small" id="toggle-meta-edit-btn" type="button">
            ${ICONS.tag}
            <span>Chỉnh sửa nhãn</span>
          </button>
        </div>

        <div id="book-meta-edit-panel" class="meta-edit-panel hidden">
          <div class="inset-group">
            <div class="inset-row stack-item">
              <div class="meta-edit-grid">
                <label class="meta-edit-field">
                  <span class="meta-edit-label">Tác giả (Author)</span>
                  <input id="meta-edit-author" class="meta-edit-input" type="text" value="${escHtml(book.author || '')}" placeholder="Arthur Conan Doyle" />
                </label>
                <div class="meta-edit-series-row">
                  <label class="meta-edit-field" style="flex:1">
                    <span class="meta-edit-label">Bộ truyện (Series)</span>
                    <input id="meta-edit-series" class="meta-edit-input" type="text" value="${escHtml(book.series || '')}" placeholder="Sherlock Holmes" />
                  </label>
                  <label class="meta-edit-field" style="width:88px">
                    <span class="meta-edit-label">Tập #</span>
                    <input id="meta-edit-series-idx" class="meta-edit-input tabular" type="number" step="0.5" min="0" value="${book.seriesIndex != null ? escHtml(String(book.seriesIndex)) : ''}" placeholder="1" />
                  </label>
                </div>
                <label class="meta-edit-field">
                  <span class="meta-edit-label">Thể loại (Genres — cách nhau bằng dấu phẩy)</span>
                  <input id="meta-edit-genres" class="meta-edit-input" type="text" value="${escHtml(genres.join(', '))}" placeholder="Mystery & Detective, Classic Literature" />
                </label>
                <label class="meta-edit-field">
                  <span class="meta-edit-label">Tags (cách nhau bằng dấu phẩy)</span>
                  <input id="meta-edit-tags" class="meta-edit-input" type="text" value="${escHtml(tags.join(', '))}" placeholder="Trinh thám, Kinh điển, Tiếng Anh" />
                </label>
                <label class="meta-edit-field">
                  <span class="meta-edit-label">Mô tả sách (Description)</span>
                  <textarea id="meta-edit-desc" class="book-review-textarea" rows="4" placeholder="Nhập tóm tắt nội dung cuốn sách…">${escHtml(desc)}</textarea>
                </label>
              </div>
              <div class="book-info-actions">
                <button class="apple-pill-btn small" data-save-meta-override="${escHtml(bookId)}" type="button">Lưu thông tin &amp; nhãn</button>
              </div>
            </div>
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
          bookMetaOverrides: { ...(this.state.bookMetaOverrides || {}), ...(incoming.bookMetaOverrides || {}) },
          seriesMeta: { ...(this.state.seriesMeta || {}), ...(incoming.seriesMeta || {}) },
          inkNotes: { ...this.state.inkNotes, ...(incoming.inkNotes || {}) },
          folders: Array.isArray(incoming.folders) ? incoming.folders : this.state.folders || [],
          hiddenBookIds: { ...(this.state.hiddenBookIds || {}), ...(incoming.hiddenBookIds || {}) },
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
      const srvInp = document.getElementById('native-server-url-input');
      const cloudInp = document.getElementById('cloud-gist-token-input');

      if (srvInp) {
        srvInp.value = this.customServerUrl || this.activeServerOrigin || '';
      }
      if (cloudInp) {
        cloudInp.value = this.cloudToken ? '••••••••••••••••' : '';
      }
      this.updateSyncStatusUI();

      const currentUrl = `${window.location.origin}${window.location.pathname}`;
      const isHttps = window.location.protocol === 'https:';
      httpStep?.classList.toggle('hidden', isHttps);

      let loadedFromServer = false;
      if (this.isOnlineToServer) {
        try {
          const res = await fetch(this.apiUrl('/api/info'));
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

      const cloudQrWrap = document.getElementById('cloud-sync-qr-box-wrap');
      const cloudQrBox = document.getElementById('cloud-sync-qr');
      if (this.cloudToken) {
        cloudQrWrap?.classList.remove('hidden');
        const cloudPairUrl = `https://nguyenvietthu671-a11y.github.io/paperink-reader/#cloud_token=${encodeURIComponent(this.cloudToken)}${this.cloudGistId ? `&gist_id=${encodeURIComponent(this.cloudGistId)}` : ''}`;
        this._currentCloudPairUrl = cloudPairUrl;
        if (cloudQrBox) {
          const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&color=0b57d0&data=${encodeURIComponent(cloudPairUrl)}`;
          cloudQrBox.innerHTML = `<img src="${escHtml(qrImgUrl)}" alt="Mã QR kích hoạt Cloud Sync cho điện thoại" style="width:100%;height:100%;object-fit:contain;border-radius:8px" />`;
        }
      } else {
        cloudQrWrap?.classList.add('hidden');
      }
    }

    openAccountModal() {
      this.closeAllSheets();
      document.getElementById('account-backdrop')?.classList.add('open');
      document.getElementById('account-modal')?.classList.add('open');
      this.updateAccountUI();
    }

    closeAccountModal() {
      document.getElementById('account-backdrop')?.classList.remove('open');
      document.getElementById('account-modal')?.classList.remove('open');
    }

    updateAccountUI() {
      const isLogged = Boolean(this.currentUser && this.currentUser.username);
      const guestView = document.getElementById('account-guest-view');
      const userView = document.getElementById('account-user-view');
      const headerDot = document.getElementById('header-account-dot');
      const moreTitle = document.getElementById('more-account-title');
      const moreSub = document.getElementById('more-account-subtitle');

      headerDot?.classList.toggle('hidden', !isLogged);

      if (isLogged) {
        const dispName = this.currentUser.displayName || this.currentUser.username;
        const initial = (dispName[0] || 'U').toUpperCase();

        if (moreTitle) moreTitle.textContent = `Tài khoản: ${dispName}`;
        if (moreSub) moreSub.textContent = `🟢 Đã kết nối · @${this.currentUser.username} · Tự động đồng bộ`;

        guestView?.classList.add('hidden');
        userView?.classList.remove('hidden');

        const avatarEl = document.getElementById('account-user-avatar');
        const nameEl = document.getElementById('account-user-name');
        const handleEl = document.getElementById('account-user-handle');
        const booksEl = document.getElementById('account-books-count');
        const cloudEl = document.getElementById('account-cloud-status');
        const qrBox = document.getElementById('account-qr');

        if (avatarEl) avatarEl.textContent = initial;
        if (nameEl) nameEl.textContent = dispName;
        if (handleEl) handleEl.textContent = `@${this.currentUser.username}`;
        if (booksEl) {
          const count = this.serverBooks?.length || 344;
          booksEl.textContent = `${count} cuốn EPUB máy tính sẵn sàng`;
        }
        if (cloudEl) {
          cloudEl.textContent = this.cloudToken ? '🟢 Đã kích hoạt qua GitHub Gist riêng tư' : 'Chưa bật Cloud Sync';
        }

        // Build 1-click pairing QR code for Samsung S25 Ultra
        const pairData = {
          user: this.currentUser,
          token: this.authToken,
          cloudSync: {
            token: this.cloudToken,
            gistId: this.cloudGistId,
          },
          lanUrl: this.activeServerOrigin || '',
        };
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(pairData))));
        const pairUrl = `https://nguyenvietthu671-a11y.github.io/paperink-reader/#account_pair=${encoded}`;
        this._currentAccountPairUrl = pairUrl;
        if (qrBox) {
          const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&color=0b57d0&data=${encodeURIComponent(pairUrl)}`;
          qrBox.innerHTML = `<img src="${escHtml(qrImg)}" alt="Mã QR đăng nhập nhanh trên S25 Ultra" style="width:100%;height:100%;object-fit:contain;border-radius:10px" />`;
        }
      } else {
        if (moreTitle) moreTitle.textContent = 'Tài khoản PaperInk & Đồng bộ';
        if (moreSub) moreSub.textContent = 'Đăng nhập để đồng bộ 344 sách & ghi chú giữa Máy tính và S25 Ultra';
        guestView?.classList.remove('hidden');
        userView?.classList.add('hidden');
      }
    }

    async loginUser(username, password) {
      const u = String(username || '').trim();
      const p = String(password || '').trim();
      const errEl = document.getElementById('account-login-err');
      if (errEl) errEl.classList.add('hidden');

      if (!u || !p) {
        if (errEl) {
          errEl.textContent = 'Vui lòng nhập đầy đủ tên tài khoản và mật khẩu';
          errEl.classList.remove('hidden');
        }
        return false;
      }

      try {
        const res = await fetch(this.apiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: u, password: p }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          if (errEl) {
            errEl.textContent = data.error || 'Đăng nhập không thành công';
            errEl.classList.remove('hidden');
          }
          return false;
        }

        this.currentUser = data.user;
        this.authToken = data.token;
        localStorage.setItem('paperink_user', JSON.stringify(this.currentUser));
        localStorage.setItem('paperink_auth_token', this.authToken);

        if (data.cloudSync?.token && !this.cloudToken) {
          this.cloudToken = data.cloudSync.token;
          this.cloudGistId = data.cloudSync.gistId || '';
          localStorage.setItem('paperink_cloud_gist_token', this.cloudToken);
          if (this.cloudGistId) localStorage.setItem('paperink_cloud_gist_id', this.cloudGistId);
        }

        this.updateAccountUI();
        this.toast(`Chào mừng ${this.currentUser.displayName || this.currentUser.username}! Đã đồng bộ tài khoản.`);
        this.syncWithCloudGist(false);
        this.refreshFromServer(false);
        return true;
      } catch (err) {
        if (errEl) {
          errEl.textContent = 'Không thể kết nối máy chủ để đăng nhập: ' + err.message;
          errEl.classList.remove('hidden');
        }
        return false;
      }
    }

    async registerUser(username, displayName, password) {
      const u = String(username || '').trim();
      const n = String(displayName || '').trim();
      const p = String(password || '').trim();
      const errEl = document.getElementById('account-reg-err');
      if (errEl) errEl.classList.add('hidden');

      if (!u || u.length < 2) {
        if (errEl) {
          errEl.textContent = 'Tên tài khoản phải từ 2 ký tự trở lên';
          errEl.classList.remove('hidden');
        }
        return false;
      }
      if (!p || p.length < 4) {
        if (errEl) {
          errEl.textContent = 'Mật khẩu phải từ 4 ký tự trở lên';
          errEl.classList.remove('hidden');
        }
        return false;
      }

      try {
        const res = await fetch(this.apiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: u, displayName: n || u, password: p }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          if (errEl) {
            errEl.textContent = data.error || 'Đăng ký không thành công';
            errEl.classList.remove('hidden');
          }
          return false;
        }

        this.currentUser = data.user;
        this.authToken = data.token;
        localStorage.setItem('paperink_user', JSON.stringify(this.currentUser));
        localStorage.setItem('paperink_auth_token', this.authToken);

        if (data.cloudSync?.token && !this.cloudToken) {
          this.cloudToken = data.cloudSync.token;
          this.cloudGistId = data.cloudSync.gistId || '';
          localStorage.setItem('paperink_cloud_gist_token', this.cloudToken);
          if (this.cloudGistId) localStorage.setItem('paperink_cloud_gist_id', this.cloudGistId);
        }

        this.updateAccountUI();
        this.toast(`Tài khoản ${this.currentUser.username} đã được tạo thành công!`);
        this.syncWithCloudGist(false);
        this.refreshFromServer(false);
        return true;
      } catch (err) {
        if (errEl) {
          errEl.textContent = 'Không thể kết nối máy chủ để đăng ký: ' + err.message;
          errEl.classList.remove('hidden');
        }
        return false;
      }
    }

    logoutUser() {
      this.currentUser = null;
      this.authToken = '';
      localStorage.removeItem('paperink_user');
      localStorage.removeItem('paperink_auth_token');
      this.updateAccountUI();
      this.toast('Đã đăng xuất tài khoản.');
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
      const studioWasOpen = Boolean(document.getElementById('studio-sheet')?.classList.contains('open'));
      document
        .querySelectorAll('.sheet-panel.open, .sheet-backdrop.open, .modal-panel.open')
        .forEach((el) => el.classList.remove('open'));
      if (studioWasOpen) {
        this.applyBackgroundToDOM();
      }
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
      document.getElementById('lib-dark-toggle')?.addEventListener('click', () => this.toggleDarkMode());
      document.getElementById('more-dark-mode-switch')?.addEventListener('change', (e) => {
        this.toggleDarkMode(Boolean(e.target.checked));
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
          const res = await fetch(this.apiUrl('/api/library/rescan'), { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            this.serverBooks = data.books || [];
            window.PaperInkDB.setKV('libraryCatalog', this.serverBooks).catch(() => {});
            this.updateSyncStatusUI();
            this.renderCurrentRoute();
            this.toast(`Đã tìm thấy ${this.serverBooks.length} cuốn EPUB Online!`);
          }
        } catch (_) {
          this.toast('Không kết nối được tới máy chủ PC');
        }
      });
      document.getElementById('more-goodreads-enrich-btn')?.addEventListener('click', () => {
        this.closeAllSheets();
        this.runBatchGoodreadsEnrich();
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
      document.querySelectorAll('.banner-mode-btn[data-banner-sticker-mode]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.setStickerPlacementMode(btn.dataset.bannerStickerMode, { fromBanner: true });
        });
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
      document.querySelectorAll('.insp-mode-btn[data-sticker-mode]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.setStickerPlacementMode(btn.dataset.stickerMode, { fromBanner: false });
        });
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

      // Responsive shelf column recount on resize & portrait/landscape rotation
      let resizeTimer = null;
      const handleViewportAdapt = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const nextCols = this.computeShelfCols();
          if (nextCols !== this.lastShelfCols) {
            this.lastShelfCols = nextCols;
            if (this.route === 'shelf' || this.drilldown) this.renderShelfPage();
          }
        }, 120);
      };
      window.addEventListener('resize', handleViewportAdapt);
      window.addEventListener('orientationchange', handleViewportAdapt);

      // Global Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (this.dictUI.isOpen()) this.dictUI.close();
          else if (this.inkCanvas?.active) this.inkCanvas.setActive(false);
          else if (document.querySelector('.sheet-panel.open, .modal-panel.open')) this.closeAllSheets();
          else if (this.selectMode) this.setSelectMode(false);
          else if (this.editStickersMode) this.setEditStickersMode(false);
          else this.closeAllSheets();
        }
      });

      // Multi-Select Books & Custom Folder Controls
      document.getElementById('toggle-select-mode-btn')?.addEventListener('click', () => {
        this.setSelectMode(!this.selectMode);
      });
      document.getElementById('select-all-btn')?.addEventListener('click', () => {
        this.selectAllVisibleBooks();
      });
      document.getElementById('select-done-btn')?.addEventListener('click', () => {
        this.setSelectMode(false);
      });
      document.getElementById('sel-new-folder-btn')?.addEventListener('click', () => {
        if (this.selectedBookIds.size > 0) this.openFolderNameModal('create');
      });
      document.getElementById('sel-add-to-btn')?.addEventListener('click', () => {
        this.openFolderPickerSheet();
      });
      document.getElementById('sel-remove-folder-btn')?.addEventListener('click', () => {
        if (this.drilldown?.type === 'folder' && this.selectedBookIds.size > 0) {
          this.removeBooksFromFolder(this.drilldown.value, Array.from(this.selectedBookIds));
        }
      });
      document.getElementById('sel-delete-books-btn')?.addEventListener('click', () => {
        this.deleteSelectedBooks();
      });

      // Folder Header Bar (Rename / Delete folder inside folder drilldown)
      document.getElementById('folder-rename-btn')?.addEventListener('click', () => {
        if (this.drilldown?.type === 'folder') {
          this.openFolderNameModal('rename', this.drilldown.value);
        }
      });
      document.getElementById('folder-delete-btn')?.addEventListener('click', () => {
        if (this.drilldown?.type === 'folder') {
          this.deleteFolderOnly(this.drilldown.value);
        }
      });

      // Folder Picker Bottom Sheet
      document.getElementById('folder-picker-close')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('folder-picker-backdrop')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('folder-picker-body')?.addEventListener('click', (e) => {
        if (e.target.closest('[data-picker-new-folder]')) {
          this.openFolderNameModal('create');
          return;
        }
        const pickFolder = e.target.closest('[data-pick-folder]');
        if (pickFolder) {
          this.addBooksToFolder(pickFolder.dataset.pickFolder, Array.from(this.selectedBookIds));
          return;
        }
        const pickStatus = e.target.closest('[data-picker-status]');
        if (pickStatus) {
          this.markSelectedBooksStatus(pickStatus.dataset.pickerStatus);
        }
      });

      // Create / Rename Folder Modal
      document.getElementById('folder-name-close')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('folder-name-backdrop')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('folder-name-cancel')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('folder-name-submit')?.addEventListener('click', () => this.submitFolderNameModal());
      document.getElementById('folder-name-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.submitFolderNameModal();
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

      // Pointerdown: freeform sticker dragging OR long-press on any book to enter Select Mode!
      const mainEl = document.getElementById('main-library');
      let lpTimer = null;
      let lpStartX = 0;
      let lpStartY = 0;
      const clearLongPress = () => {
        if (lpTimer) {
          clearTimeout(lpTimer);
          lpTimer = null;
        }
      };

      mainEl?.addEventListener('pointerdown', (e) => {
        const stickerEl = e.target.closest('.placed-sticker');
        if (stickerEl) {
          this.handleStickerPointerDown(e, stickerEl);
          return;
        }
        if (this.editStickersMode || this.selectMode) return;
        if (e.button && e.button !== 0) return;
        if (e.target.closest('button, input, select')) return;

        const bookEl = e.target.closest('#books-container [data-open-book]');
        if (!bookEl) return;
        const bookId = bookEl.dataset.openBook;
        if (!bookId) return;

        clearLongPress();
        lpStartX = e.clientX;
        lpStartY = e.clientY;
        lpTimer = setTimeout(() => {
          lpTimer = null;
          this.suppressNextBookClick = true;
          setTimeout(() => {
            this.suppressNextBookClick = false;
          }, 420);
          navigator.vibrate?.(18);
          this.setSelectMode(true, bookId);
        }, 420);
      });

      mainEl?.addEventListener('pointermove', (e) => {
        if (!lpTimer) return;
        if (Math.hypot(e.clientX - lpStartX, e.clientY - lpStartY) > 10) {
          clearLongPress();
        }
      });
      window.addEventListener('pointerup', clearLongPress);
      window.addEventListener('pointercancel', clearLongPress);
      window.addEventListener('scroll', clearLongPress, { passive: true });

      // Prevent browser "Save image / Share" context menu on long-pressing book covers on S25 Ultra
      mainEl?.addEventListener('contextmenu', (e) => {
        if (e.target.closest('#books-container [data-open-book]')) {
          e.preventDefault();
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

        // Handle Multi-Select Mode taps cleanly
        if (this.selectMode) {
          const bookCard = e.target.closest('[data-open-book]');
          if (this.suppressNextBookClick) {
            this.suppressNextBookClick = false;
            return;
          }
          if (bookCard) {
            e.preventDefault();
            e.stopPropagation();
            this.toggleBookSelection(bookCard.dataset.openBook);
          }
          return;
        }

        if (this.suppressNextBookClick) {
          this.suppressNextBookClick = false;
          return;
        }

        const folderCard = e.target.closest('[data-open-folder]');
        if (folderCard) {
          const folder = this.getFolderById(folderCard.dataset.openFolder);
          if (folder) {
            this.setRoute('shelf', { type: 'folder', value: folder.id, label: folder.name });
          }
          return;
        }

        const openSync = e.target.closest('[data-open-sync]');
        if (openSync) {
          this.openConnectModal();
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

        const seriesInfoBtn = e.target.closest('[data-open-series-info]');
        if (seriesInfoBtn) {
          e.stopPropagation();
          this.openSeriesInfoModal(seriesInfoBtn.dataset.openSeriesInfo);
          return;
        }

        const toggleOverviewBtn = e.target.closest('[data-toggle-series-overview]');
        if (toggleOverviewBtn) {
          e.stopPropagation();
          const key = toggleOverviewBtn.dataset.toggleSeriesOverview;
          this.expandedSeriesOverviewKey = this.expandedSeriesOverviewKey === key ? null : key;
          this.renderShelfPage();
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

      document.getElementById('wp-scope-target-select')?.addEventListener('change', (e) => {
        const val = e.target.value;
        if (!val) return;
        this.studioScopeValue = val;
        this.studioScopeKey = this.makeWallpaperScopeKey(this.studioScopeType, val);
        this.renderStudioSheet();
        this.applyBackgroundToDOM();
      });

      document.getElementById('reset-scoped-wp-btn')?.addEventListener('click', () => {
        if (this.studioScopeKey && this.studioScopeKey !== 'global') {
          this.resetScopedWallpaper(this.studioScopeKey);
        }
      });

      document.getElementById('custom-bg-color-input')?.addEventListener('input', (e) => {
        const hex = e.target.value;
        const hexEl = document.getElementById('custom-bg-hex');
        if (hexEl) hexEl.textContent = hex.toUpperCase();
        this.updateEditingWallpaper({ bgMode: 'color', bgColor: hex });
      });
      document.getElementById('set-bg-ambient')?.addEventListener('change', (e) => {
        this.updateEditingWallpaper({ bgAmbient: e.target.checked });
      });
      document.getElementById('set-preset-blur')?.addEventListener('input', (e) => {
        this.updateEditingWallpaper({ bgBlur: Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)) });
      });
      document.getElementById('set-preset-dim')?.addEventListener('input', (e) => {
        this.updateEditingWallpaper({ bgDim: parseInt(e.target.value, 10) });
      });
      document.getElementById('set-wp-blur')?.addEventListener('input', (e) => {
        this.updateEditingWallpaper({ bgBlur: Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)) });
      });
      document.getElementById('set-wp-dim')?.addEventListener('input', (e) => {
        this.updateEditingWallpaper({ bgDim: parseInt(e.target.value, 10) });
      });

      document.getElementById('studio-sheet')?.addEventListener('click', (e) => {
        const scopeModeBtn = e.target.closest('.wp-scope-mode-btn');
        if (scopeModeBtn) {
          this.setStudioScopeMode(scopeModeBtn.dataset.wpscopeMode);
          return;
        }
        const typePill = e.target.closest('.wp-type-pill');
        if (typePill) {
          this.setStudioScopeType(typePill.dataset.wptype);
          return;
        }
        const selectChip = e.target.closest('[data-select-scoped-wp]');
        if (selectChip) {
          const sKey = selectChip.dataset.selectScopedWp;
          const entry = this.getScopedWallpaperEntry(sKey);
          if (entry) {
            this.studioScopeMode = 'scoped';
            this.studioScopeType = entry.scopeType || sKey.split(':')[0] || 'series';
            this.studioScopeValue = entry.scopeValue || sKey.slice(sKey.indexOf(':') + 1);
            this.studioScopeKey = sKey;
            this.renderStudioSheet();
            this.applyBackgroundToDOM();
          }
          return;
        }
        const removeChip = e.target.closest('[data-remove-scoped-wp]');
        if (removeChip) {
          e.stopPropagation();
          this.resetScopedWallpaper(removeChip.dataset.removeScopedWp);
          return;
        }
        const styleBtn = e.target.closest('[data-shelf-style]');
        if (styleBtn) {
          this.updateShelfConfig({ shelfStyle: styleBtn.dataset.shelfStyle });
          return;
        }
        const modeBtn = e.target.closest('.bg-mode-pill');
        if (modeBtn) {
          this.updateEditingWallpaper({ bgMode: modeBtn.dataset.bgmode });
          return;
        }
        const colorDot = e.target.closest('[data-pick-color]');
        if (colorDot) {
          this.updateEditingWallpaper({ bgMode: 'color', bgColor: colorDot.dataset.pickColor });
          return;
        }
        const presetCard = e.target.closest('[data-pick-preset]');
        if (presetCard) {
          this.updateEditingWallpaper({ bgMode: 'preset', bgPreset: presetCard.dataset.pickPreset });
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
          this.toast(
            this.inkCanvas.sPenOnly
              ? 'Bảng chọn bút S Pen — Bút viết trực tiếp, ngón tay vẫn lật trang tự nhiên'
              : 'Bảng chọn bút — Đang cho phép vẽ bằng cả bút và tay'
          );
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

      document.querySelector('.lib-header')?.addEventListener('click', (e) => {
        const sBtn = e.target.closest('[data-open-series-info]');
        if (sBtn) {
          e.stopPropagation();
          this.openSeriesInfoModal(sBtn.dataset.openSeriesInfo);
        }
      });

      // Book Info / Description / Rating Modal
      document.getElementById('book-info-close')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('book-info-backdrop')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('book-info-body')?.addEventListener('click', (e) => {
        const seriesWpBtn = e.target.closest('[data-open-series-wallpaper]');
        if (seriesWpBtn) {
          const sName = seriesWpBtn.dataset.openSeriesWallpaper;
          this.setRoute('series', { type: 'series', value: sName, label: sName });
          this.openStudioSheet({ type: 'series', value: sName });
          return;
        }
        const autoSeriesBtn = e.target.closest('[data-auto-enrich-series]');
        if (autoSeriesBtn) {
          this.autoEnrichSeries(autoSeriesBtn.dataset.autoEnrichSeries, { silent: false });
          return;
        }
        if (e.target.closest('#toggle-series-edit-btn')) {
          document.getElementById('series-meta-edit-panel')?.classList.toggle('hidden');
          return;
        }
        const saveSeriesBtn = e.target.closest('[data-save-series-meta]');
        if (saveSeriesBtn) {
          this.saveSeriesMetaOverride(saveSeriesBtn.dataset.saveSeriesMeta, {
            genres: document.getElementById('series-edit-genres')?.value || '',
            tags: document.getElementById('series-edit-tags')?.value || '',
            description: document.getElementById('series-edit-desc')?.value || '',
          });
          return;
        }
        const autoTagBtn = e.target.closest('[data-auto-tag-book]');
        if (autoTagBtn) {
          this.autoEnrichBook(autoTagBtn.dataset.autoTagBook, { silent: false });
          return;
        }
        if (e.target.closest('#toggle-meta-edit-btn')) {
          document.getElementById('book-meta-edit-panel')?.classList.toggle('hidden');
          return;
        }
        const saveMetaBtn = e.target.closest('[data-save-meta-override]');
        if (saveMetaBtn) {
          this.saveBookMetaOverride(saveMetaBtn.dataset.saveMetaOverride, {
            author: document.getElementById('meta-edit-author')?.value || '',
            series: document.getElementById('meta-edit-series')?.value || '',
            seriesIndex: document.getElementById('meta-edit-series-idx')?.value || '',
            genres: document.getElementById('meta-edit-genres')?.value || '',
            tags: document.getElementById('meta-edit-tags')?.value || '',
            description: document.getElementById('meta-edit-desc')?.value || '',
          });
          return;
        }
        const filterAuthor = e.target.closest('[data-filter-author]');
        if (filterAuthor) {
          const val = filterAuthor.dataset.filterAuthor;
          this.closeAllSheets();
          if (!document.getElementById('reader-view')?.classList.contains('hidden')) {
            this.reader.closeBook();
            document.getElementById('library-view')?.classList.remove('hidden');
          }
          this.setRoute('authors', { type: 'author', value: val, label: val });
          return;
        }
        const filterSeries = e.target.closest('[data-filter-series]');
        if (filterSeries) {
          const val = filterSeries.dataset.filterSeries;
          this.closeAllSheets();
          if (!document.getElementById('reader-view')?.classList.contains('hidden')) {
            this.reader.closeBook();
            document.getElementById('library-view')?.classList.remove('hidden');
          }
          this.setRoute('series', { type: 'series', value: val, label: val });
          return;
        }
        const filterGenre = e.target.closest('[data-filter-genre]');
        if (filterGenre) {
          const val = filterGenre.dataset.filterGenre;
          this.closeAllSheets();
          if (!document.getElementById('reader-view')?.classList.contains('hidden')) {
            this.reader.closeBook();
            document.getElementById('library-view')?.classList.remove('hidden');
          }
          this.setRoute('genres', { type: 'genre', value: val, label: val });
          return;
        }
        const filterTag = e.target.closest('[data-filter-tag]');
        if (filterTag) {
          const val = filterTag.dataset.filterTag;
          this.closeAllSheets();
          if (!document.getElementById('reader-view')?.classList.contains('hidden')) {
            this.reader.closeBook();
            document.getElementById('library-view')?.classList.remove('hidden');
          }
          this.setRoute('shelf', null);
          this.searchQuery = `#${val}`;
          this.setSearchOpen(true);
          const inp = document.getElementById('lib-search');
          if (inp) inp.value = `#${val}`;
          this.renderShelfPage();
          return;
        }

        const openSync = e.target.closest('[data-open-sync]');
        if (openSync) {
          this.openConnectModal();
          return;
        }

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

      document.getElementById('connection-dot')?.addEventListener('click', () => this.openConnectModal());
      document.getElementById('connect-backdrop')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('connect-close-btn')?.addEventListener('click', () => this.closeAllSheets());
      document.getElementById('native-server-save-btn')?.addEventListener('click', async () => {
        const inp = document.getElementById('native-server-url-input');
        const val = (inp?.value || '').trim();
        if (val && !/^https?:\/\//i.test(val)) {
          this.toast('Địa chỉ phải bắt đầu bằng http:// hoặc https://');
          return;
        }
        this.saveServerUrl(val);
        this.toast(val ? 'Đang kết nối máy chủ PC…' : 'Đã đặt lại kết nối mặc định…');
        await this.refreshFromServer(false);
      });
      document.getElementById('sync-now-btn')?.addEventListener('click', async () => {
        this.toast('Đang đồng bộ kho EPUB, tiến độ & ghi chú…');
        await this.refreshFromServer(false);
      });
      document.getElementById('cloud-sync-save-btn')?.addEventListener('click', async () => {
        const inp = document.getElementById('cloud-gist-token-input');
        const raw = (inp?.value || '').trim();
        if (!raw || raw.startsWith('••')) {
          if (this.cloudToken) {
            await this.syncWithCloudGist(false);
          } else {
            this.toast('Vui lòng dán GitHub Token (quyền gist)');
          }
          return;
        }
        this.cloudToken = raw;
        this.cloudGistId = '';
        localStorage.setItem('paperink_cloud_gist_token', raw);
        localStorage.removeItem('paperink_cloud_gist_id');
        if (inp) inp.value = '••••••••••••••••';
        this.toast('Đang đồng bộ tiến độ & ghi chú lên Cloud…');
        const ok = await this.syncWithCloudGist(false);
        if (ok) this.renderCurrentRoute();
      });
      document.getElementById('cloud-sync-clear-btn')?.addEventListener('click', () => {
        this.cloudToken = '';
        this.cloudGistId = '';
        this.lastCloudSyncAt = 0;
        localStorage.removeItem('paperink_cloud_gist_token');
        localStorage.removeItem('paperink_cloud_gist_id');
        const inp = document.getElementById('cloud-gist-token-input');
        if (inp) inp.value = '';
        this.updateSyncStatusUI();
        this.toast('Đã gỡ kết nối Cloud Sync');
      });
      document.getElementById('copy-lan-url-btn')?.addEventListener('click', () => {
        const txt = document.getElementById('connect-url-text')?.textContent || '';
        navigator.clipboard?.writeText(txt).catch(() => {});
        this.toast('Đã sao chép địa chỉ kết nối');
      });
      document.getElementById('copy-cloud-sync-url-btn')?.addEventListener('click', () => {
        const url = this._currentCloudPairUrl;
        if (url) {
          navigator.clipboard?.writeText(url).catch(() => {});
          this.toast('Đã sao chép link Cloud Sync 1-chạm!');
        }
      });
      document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
        if (!this.deferredInstallPrompt) return;
        this.deferredInstallPrompt.prompt();
        await this.deferredInstallPrompt.userChoice;
        this.deferredInstallPrompt = null;
        document.getElementById('pwa-install-btn')?.classList.add('hidden');
      });

      // P2P Book Syncing listeners
      document.getElementById('p2p-host-btn')?.addEventListener('click', () => this.startP2PHost());
      document.getElementById('p2p-copy-link-btn')?.addEventListener('click', () => {
        const url = this._currentP2PPairUrl;
        if (url) {
          navigator.clipboard?.writeText(url).catch(() => {});
          this.toast('Đã chép link kết nối P2P!');
        }
      });
      document.getElementById('p2p-connect-btn')?.addEventListener('click', () => {
        const inp = document.getElementById('p2p-code-input');
        const code = (inp?.value || '').trim();
        if (!code) {
          this.toast('Vui lòng nhập mã phòng P2P');
          return;
        }
        if (!this.p2p && window.PaperInkP2P) this.p2p = new window.PaperInkP2P(this);
        this.p2p?.connectToHost(code);
      });
      document.getElementById('p2p-batch-download-btn')?.addEventListener('click', () => {
        this.p2p?.requestBatchDownloadAll();
      });

      // Account & Cross-Device Sync UI listeners
      document.getElementById('header-account-btn')?.addEventListener('click', () => this.openAccountModal());
      document.getElementById('more-account-btn')?.addEventListener('click', () => this.openAccountModal());
      document.getElementById('account-close-btn')?.addEventListener('click', () => this.closeAccountModal());
      document.getElementById('account-backdrop')?.addEventListener('click', () => this.closeAccountModal());

      const tabLogin = document.getElementById('account-tab-login');
      const tabReg = document.getElementById('account-tab-reg');
      const paneLogin = document.getElementById('account-login-pane');
      const paneReg = document.getElementById('account-reg-pane');

      tabLogin?.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabLogin.setAttribute('aria-selected', 'true');
        tabReg?.classList.remove('active');
        tabReg?.setAttribute('aria-selected', 'false');
        paneLogin?.classList.remove('hidden');
        paneReg?.classList.add('hidden');
      });

      tabReg?.addEventListener('click', () => {
        tabReg.classList.add('active');
        tabReg.setAttribute('aria-selected', 'true');
        tabLogin?.classList.remove('active');
        tabLogin?.setAttribute('aria-selected', 'false');
        paneReg?.classList.remove('hidden');
        paneLogin?.classList.add('hidden');
      });

      document.getElementById('account-login-submit')?.addEventListener('click', async () => {
        const u = document.getElementById('account-login-user')?.value;
        const p = document.getElementById('account-login-pass')?.value;
        await this.loginUser(u, p);
      });

      document.getElementById('account-reg-submit')?.addEventListener('click', async () => {
        const u = document.getElementById('account-reg-user')?.value;
        const n = document.getElementById('account-reg-name')?.value;
        const p = document.getElementById('account-reg-pass')?.value;
        await this.registerUser(u, n, p);
      });

      document.getElementById('account-copy-pair-btn')?.addEventListener('click', () => {
        if (this._currentAccountPairUrl) {
          navigator.clipboard?.writeText(this._currentAccountPairUrl).catch(() => {});
          this.toast('Đã sao chép link đăng nhập 1-chạm!');
        }
      });

      document.getElementById('account-sync-now-btn')?.addEventListener('click', async () => {
        this.toast('Đang đồng bộ toàn bộ sách và tiến độ…');
        await this.flushSyncNow(false);
        await this.syncWithCloudGist(false);
        this.updateAccountUI();
        this.toast('Đã đồng bộ xong!');
      });

      document.getElementById('account-logout-btn')?.addEventListener('click', () => {
        this.logoutUser();
      });

      window.addEventListener('online', () => this.refreshFromServer(true));
      window.addEventListener('focus', () => {
        if (this.isOnlineToServer || this.cloudToken) {
          this.flushSyncNow(true);
        }
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          if (this.reader.epub) this.reader.persistProgress();
          this.flushSyncNow(true);
        } else if (document.visibilityState === 'visible') {
          if (this.isOnlineToServer || this.cloudToken) {
            this.refreshFromServer(true);
          }
        }
      });
      // Periodic 30s bidirectional sync heartbeat while tab is active
      setInterval(() => {
        if (document.visibilityState === 'visible' && (this.isOnlineToServer || this.cloudToken)) {
          this.flushSyncNow(true);
        }
      }, 30000);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    const app = new PaperInkApp();
    window.__paperInk = app;
    app.init();
  });
})();
