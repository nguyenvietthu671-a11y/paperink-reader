(function () {
  function uid(prefix = 'stk') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function resolveStrokeColor(colorToken) {
    if (colorToken === 'auto') {
      const theme = document.documentElement.getAttribute('data-theme');
      return theme === 'amoled' || theme === 'dark' ? '#E4DFD5' : '#1D1D1F';
    }
    return colorToken || '#1D1D1F';
  }

  function pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  // Deterministic tiny hash for non-flickering graphite pencil grain
  function grainRand(seed) {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  const TOOL_META = {
    fountain: { label: 'Bút máy', defaultWidth: 2.4, defaultOpacity: 0.96, minW: 0.8, maxW: 12 },
    ballpoint: { label: 'Bút bi', defaultWidth: 1.8, defaultOpacity: 0.98, minW: 0.8, maxW: 10 },
    calligraphy: { label: 'Thư pháp', defaultWidth: 3.8, defaultOpacity: 0.95, minW: 1.2, maxW: 16 },
    pencil: { label: 'Bút chì', defaultWidth: 2.8, defaultOpacity: 0.68, minW: 1.0, maxW: 14 },
    highlighter: { label: 'Dạ quang', defaultWidth: 4.4, defaultOpacity: 0.36, minW: 1.6, maxW: 12 },
    eraser: { label: 'Tẩy', defaultWidth: 4.0, defaultOpacity: 1.0, minW: 1.5, maxW: 16 },
  };

  const COLOR_PALETTES = [
    {
      id: 'essential',
      name: 'Cơ bản',
      colors: [
        { hex: 'auto', name: 'Mực tự động sáng/tối' },
        { hex: '#1D1D1F', name: 'Đen mực' },
        { hex: '#0B57D0', name: 'Xanh bút bi' },
        { hex: '#D93025', name: 'Đỏ chấm bài' },
        { hex: '#188038', name: 'Xanh lá' },
        { hex: '#7627BB', name: 'Tím mực' },
        { hex: '#E37400', name: 'Cam đất' },
        { hex: '#6D4C41', name: 'Nâu cà phê' },
      ],
    },
    {
      id: 'pastel',
      name: 'Pastel',
      colors: [
        { hex: '#F48FB1', name: 'Hồng phấn' },
        { hex: '#FFAB91', name: 'Cam đào' },
        { hex: '#FFE082', name: 'Vàng bơ' },
        { hex: '#80CBC4', name: 'Xanh bạc hà' },
        { hex: '#90CAF9', name: 'Xanh trời nhạt' },
        { hex: '#CE93D8', name: 'Tím oải hương' },
        { hex: '#BCAAA4', name: 'Kem cát' },
        { hex: '#A5D6A7', name: 'Xanh bơ' },
      ],
    },
    {
      id: 'neon',
      name: 'Dạ quang',
      colors: [
        { hex: '#FDD835', name: 'Vàng chanh' },
        { hex: '#FF4081', name: 'Hồng neon' },
        { hex: '#76FF03', name: 'Xanh lá sáng' },
        { hex: '#18FFFF', name: 'Xanh băng' },
        { hex: '#FF9100', name: 'Cam neon' },
        { hex: '#E040FB', name: 'Tím sáng' },
        { hex: '#FFD740', name: 'Vàng hổ phách' },
        { hex: '#64FFDA', name: 'Ngọc lam' },
      ],
    },
    {
      id: 'classic',
      name: 'Cổ điển',
      colors: [
        { hex: '#1A237E', name: 'Xanh mực đêm' },
        { hex: '#880E4F', name: 'Đỏ rượu vang' },
        { hex: '#1B5E20', name: 'Rêu rừng' },
        { hex: '#4E342E', name: 'Nâu Sepia' },
        { hex: '#9E7B1C', name: 'Vàng đồng' },
        { hex: '#006064', name: 'Xanh cổ vịt' },
        { hex: '#455A64', name: 'Xám đá' },
        { hex: '#BF360C', name: 'Đỏ gạch' },
      ],
    },
    {
      id: 'night',
      name: 'Nền tối',
      colors: [
        { hex: '#F2ECE1', name: 'Kem sáng' },
        { hex: '#E8EAED', name: 'Trắng dịu' },
        { hex: '#8AB4F8', name: 'Xanh bầu trời' },
        { hex: '#81C995', name: 'Bạc hà sáng' },
        { hex: '#FDD663', name: 'Vàng dịu' },
        { hex: '#F28B82', name: 'Hồng san hô' },
        { hex: '#C58AF9', name: 'Tím mây' },
        { hex: '#FCAD70', name: 'Cam đào sáng' },
      ],
    },
  ];

  const DEFAULT_FAVORITES = [
    { id: 'fav_1', tool: 'fountain', color: 'auto', width: 2.4, opacity: 0.96 },
    { id: 'fav_2', tool: 'ballpoint', color: '#0B57D0', width: 1.8, opacity: 0.98 },
    { id: 'fav_3', tool: 'highlighter', color: '#FDD835', width: 4.4, opacity: 0.36 },
  ];

  const QUICK_SIZES = [1.2, 2.2, 3.4, 5.2, 8.0];

  class SPenInkCanvas {
    constructor({ onSavePage, onActiveChange, toast }) {
      this.onSavePage = onSavePage;
      this.onActiveChange = onActiveChange;
      this.toast = toast;

      this.canvas = document.getElementById('ink-canvas');
      this.stage = document.getElementById('reader-stage');
      this.toolbar = document.getElementById('pen-toolbar');
      this.detailPanel = document.getElementById('pen-detail-panel');
      this.previewCanvas = document.getElementById('pen-preview-canvas');
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

      this.active = false;
      this.detailOpen = false;
      this.sPenOnly = false;
      this.autoSPenDetect = true;

      this.tool = 'fountain'; // fountain | ballpoint | calligraphy | pencil | highlighter | eraser
      this.color = 'auto';
      this.width = 2.4;
      this.opacity = 0.96;
      this.activePaletteId = 'essential';
      this.straightHighlighter = false;
      this.eraserMode = 'stroke'; // stroke | area
      this.eraserSize = 18;

      // Remember per-tool width/opacity/color preferences like Samsung Notes
      this.toolPrefs = {
        fountain: { width: 2.4, opacity: 0.96, color: 'auto' },
        ballpoint: { width: 1.8, opacity: 0.98, color: '#0B57D0' },
        calligraphy: { width: 3.8, opacity: 0.95, color: 'auto' },
        pencil: { width: 2.8, opacity: 0.68, color: 'auto' },
        highlighter: { width: 4.4, opacity: 0.36, color: '#FDD835' },
        eraser: { width: 4.0, opacity: 1.0, color: 'auto' },
      };

      this.favorites = this.loadFavorites();

      this.bookId = null;
      this.pageKey = null;
      this.pageMeta = null;
      this.strokes = [];
      this.redoStack = [];

      this.drawing = false;
      this.activePointerId = null;
      this.currentStroke = null;
      this.erasedDuringGesture = false;
      this._preEraseSnapshot = null;

      this.bindEvents();
      this.renderPaletteTabs();
      this.syncToolbarUI();
    }

    loadFavorites() {
      try {
        const raw = localStorage.getItem('paperink_pen_favorites_v2');
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 6);
      } catch (_) {}
      return structuredClone(DEFAULT_FAVORITES);
    }

    saveFavorites() {
      try {
        localStorage.setItem('paperink_pen_favorites_v2', JSON.stringify(this.favorites));
      } catch (_) {}
    }

    normalizeTool(t) {
      if (!t || t === 'pen') return 'fountain';
      return TOOL_META[t] ? t : 'fountain';
    }

    isDrawingEnabledForPointer(e) {
      if (!this.bookId || !this.pageKey) return false;
      if (e.pointerType === 'pen' && (this.active || this.autoSPenDetect)) return true;
      if (!this.active) return false;
      if (this.sPenOnly && e.pointerType === 'touch') return false;
      return true;
    }

    setActive(flag) {
      this.active = Boolean(flag);
      if (!this.active) this.setDetailOpen(false);
      this.canvas?.classList.toggle('pen-active', this.active);
      this.canvas?.classList.toggle('spen-only', this.active && this.sPenOnly);
      this.toolbar?.classList.toggle('open', this.active);
      document.getElementById('hud-pen-btn')?.classList.toggle('active', this.active);
      document.getElementById('hud-pen-btn')?.setAttribute('aria-pressed', String(this.active));
      this.onActiveChange?.(this.active);
      this.syncToolbarUI();
    }

    setDetailOpen(flag) {
      this.detailOpen = Boolean(flag && this.active);
      this.detailPanel?.classList.toggle('open', this.detailOpen);
      document.getElementById('pen-expand-btn')?.classList.toggle('active', this.detailOpen);
      if (this.detailOpen) {
        this.renderPreviewWave();
      }
    }

    setSPenOnly(flag) {
      this.sPenOnly = Boolean(flag);
      this.canvas?.classList.toggle('spen-only', this.active && this.sPenOnly);
      this.syncToolbarUI();
    }

    selectTool(nextTool, allowTogglePanel = false) {
      const norm = this.normalizeTool(nextTool);
      if (allowTogglePanel && this.tool === norm) {
        this.setDetailOpen(!this.detailOpen);
        return;
      }
      // Save current tool state
      this.toolPrefs[this.tool] = {
        width: this.width,
        opacity: this.opacity,
        color: this.color,
      };
      this.tool = norm;
      const pref = this.toolPrefs[norm] || TOOL_META[norm];
      this.width = pref.width ?? TOOL_META[norm].defaultWidth;
      this.opacity = pref.opacity ?? TOOL_META[norm].defaultOpacity;
      if (norm === 'highlighter') {
        this.color = pref.color && pref.color !== 'auto' ? pref.color : '#FDD835';
      } else if (norm !== 'eraser' && pref.color) {
        this.color = pref.color;
      }
      this.syncToolbarUI();
    }

    loadPage({ bookId, pageKey, strokes, meta }) {
      this.bookId = bookId;
      this.pageKey = pageKey;
      this.pageMeta = meta || null;
      this.strokes = Array.isArray(strokes) ? structuredClone(strokes) : [];
      this.redoStack = [];
      this.resizeCanvas();
      this.redraw();
      this.syncToolbarUI();
    }

    clearContext() {
      this.setActive(false);
      this.bookId = null;
      this.pageKey = null;
      this.strokes = [];
      this.redoStack = [];
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    resizeCanvas() {
      if (!this.canvas || !this.stage) return;
      const rect = this.stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      if (this.canvas.width !== Math.floor(w * dpr) || this.canvas.height !== Math.floor(h * dpr)) {
        this.canvas.width = Math.floor(w * dpr);
        this.canvas.height = Math.floor(h * dpr);
      }
      this.cssW = w;
      this.cssH = h;
      this.dpr = dpr;
    }

    redraw() {
      if (!this.ctx || !this.canvas) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.setTransform(this.dpr || 1, 0, 0, this.dpr || 1, 0, 0);
      ctx.clearRect(0, 0, this.cssW || 0, this.cssH || 0);

      for (const stroke of this.strokes) {
        this.drawStroke(ctx, stroke, this.cssW || 1, this.cssH || 1);
      }
      if (this.currentStroke) {
        this.drawStroke(ctx, this.currentStroke, this.cssW || 1, this.cssH || 1);
      }
      ctx.restore();
    }

    drawStroke(ctx, stroke, W, H) {
      const pts = stroke.points;
      if (!pts || pts.length === 0) return;

      const tool = this.normalizeTool(stroke.tool);
      const color = resolveStrokeColor(stroke.color);
      const baseW = Number(stroke.width) || TOOL_META[tool]?.defaultWidth || 2.4;
      const baseAlpha =
        typeof stroke.opacity === 'number'
          ? Math.max(0.08, Math.min(1, stroke.opacity))
          : TOOL_META[tool]?.defaultOpacity ?? 0.96;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineJoin = 'round';

      // ---- 1. CHISEL-TIP HIGHLIGHTER ----
      if (tool === 'highlighter') {
        ctx.globalAlpha = baseAlpha;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'bevel';
        ctx.lineWidth = Math.max(10, baseW * 4.4);
        ctx.beginPath();
        ctx.moveTo(pts[0][0] * W, pts[0][1] * H);
        if (pts.length === 1) {
          ctx.lineTo(pts[0][0] * W + 1, pts[0][1] * H);
        } else {
          for (let i = 1; i < pts.length; i++) {
            const prev = pts[i - 1];
            const cur = pts[i];
            const midX = (prev[0] + cur[0]) * 0.5 * W;
            const midY = (prev[1] + cur[1]) * 0.5 * H;
            ctx.quadraticCurveTo(prev[0] * W, prev[1] * H, midX, midY);
          }
          const last = pts[pts.length - 1];
          ctx.lineTo(last[0] * W, last[1] * H);
        }
        ctx.stroke();
        ctx.restore();
        return;
      }

      // ---- 2. TEXTURED GRAPHITE PENCIL ----
      if (tool === 'pencil') {
        ctx.lineCap = 'round';
        if (pts.length === 1) {
          ctx.globalAlpha = baseAlpha * 0.72;
          ctx.beginPath();
          ctx.arc(pts[0][0] * W, pts[0][1] * H, Math.max(0.9, baseW * 0.5), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return;
        }
        for (let i = 1; i < pts.length; i++) {
          const p0 = pts[i - 1];
          const p1 = pts[i];
          const x0 = p0[0] * W;
          const y0 = p0[1] * H;
          const x1 = p1[0] * W;
          const y1 = p1[1] * H;
          const pMid = ((p0[2] ?? 0.5) + (p1[2] ?? 0.5)) * 0.5;
          const segW = Math.max(1.0, baseW * (0.68 + 0.65 * pMid));

          // Soft graphite core
          ctx.globalAlpha = baseAlpha * (0.42 + 0.34 * pMid);
          ctx.lineWidth = segW;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();

          // Fine deterministic paper-tooth stipple grain
          const dist = Math.hypot(x1 - x0, y1 - y0);
          const steps = Math.max(1, Math.min(8, Math.ceil(dist / 2.2)));
          ctx.globalAlpha = baseAlpha * (0.38 + 0.35 * pMid);
          for (let k = 0; k < steps; k++) {
            const frac = k / steps;
            const seed = i * 31 + k * 7 + (stroke.id ? stroke.id.charCodeAt(stroke.id.length - 1) : 3);
            const jx = (grainRand(seed) - 0.5) * segW * 0.95;
            const jy = (grainRand(seed + 19) - 0.5) * segW * 0.95;
            const gx = x0 + (x1 - x0) * frac + jx;
            const gy = y0 + (y1 - y0) * frac + jy;
            const r = Math.max(0.45, segW * (0.14 + grainRand(seed + 41) * 0.16));
            ctx.fillRect(gx, gy, r * 1.4, r * 1.4);
          }
        }
        ctx.restore();
        return;
      }

      // ---- 3. PRECISION BALLPOINT PEN ----
      if (tool === 'ballpoint') {
        ctx.globalAlpha = baseAlpha;
        ctx.lineCap = 'round';
        if (pts.length === 1) {
          ctx.beginPath();
          ctx.arc(pts[0][0] * W, pts[0][1] * H, Math.max(0.7, baseW * 0.5), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return;
        }
        for (let i = 1; i < pts.length; i++) {
          const p0 = pts[i - 1];
          const p1 = pts[i];
          const pMid = ((p0[2] ?? 0.5) + (p1[2] ?? 0.5)) * 0.5;
          ctx.lineWidth = Math.max(0.8, baseW * (0.84 + 0.3 * pMid));
          this.strokeSmoothSeg(ctx, pts, i, W, H);
        }
        ctx.restore();
        return;
      }

      // ---- 4. CALLIGRAPHY BRUSH PEN ----
      if (tool === 'calligraphy') {
        ctx.globalAlpha = baseAlpha;
        ctx.lineCap = 'round';
        if (pts.length === 1) {
          const r = Math.max(1.0, (baseW * (0.4 + (pts[0][2] ?? 0.5))) / 2);
          ctx.beginPath();
          ctx.arc(pts[0][0] * W, pts[0][1] * H, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return;
        }
        const total = pts.length;
        for (let i = 1; i < total; i++) {
          const p0 = pts[i - 1];
          const p1 = pts[i];
          const pMid = ((p0[2] ?? 0.5) + (p1[2] ?? 0.5)) * 0.5;
          const dx = (p1[0] - p0[0]) * W;
          const dy = (p1[1] - p0[1]) * H;
          const speed = Math.hypot(dx, dy);
          const velThin = Math.max(0.55, Math.min(1.18, 1.16 - speed * 0.018));
          // Natural brush entry/exit taper
          const edgeTaper =
            i < 3 ? 0.55 + (i / 3) * 0.45 : i > total - 4 ? 0.42 + ((total - i) / 4) * 0.58 : 1;
          ctx.lineWidth = Math.max(0.8, baseW * (0.22 + 1.58 * pMid) * velThin * edgeTaper);
          this.strokeSmoothSeg(ctx, pts, i, W, H);
        }
        ctx.restore();
        return;
      }

      // ---- 5. FOUNTAIN PEN (Calligraphic nib angle + S Pen pressure) ----
      ctx.globalAlpha = baseAlpha;
      ctx.lineCap = 'round';
      if (pts.length === 1) {
        const p = pts[0][2] ?? 0.5;
        const r = Math.max(0.8, (baseW * (0.48 + 0.85 * p)) / 2);
        ctx.beginPath();
        ctx.arc(pts[0][0] * W, pts[0][1] * H, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }
      const nibAngle = -Math.PI * 0.24; // Classic ~43 deg fountain nib slant
      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1];
        const p1 = pts[i];
        const pMid = ((p0[2] ?? 0.5) + (p1[2] ?? 0.5)) * 0.5;
        const dx = (p1[0] - p0[0]) * W;
        const dy = (p1[1] - p0[1]) * H;
        const theta = Math.atan2(dy, dx);
        const nibFactor = 0.54 + 0.56 * Math.abs(Math.sin(theta - nibAngle));
        const taperEnd = i === pts.length - 1 ? 0.72 : 1;
        ctx.lineWidth = Math.max(0.8, baseW * (0.42 + 0.92 * pMid) * nibFactor * taperEnd);
        this.strokeSmoothSeg(ctx, pts, i, W, H);
      }
      ctx.restore();
    }

    strokeSmoothSeg(ctx, pts, i, W, H) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      ctx.beginPath();
      if (i === 1) {
        ctx.moveTo(p0[0] * W, p0[1] * H);
        ctx.lineTo(p1[0] * W, p1[1] * H);
      } else {
        const prevMidX = (pts[i - 2][0] + p0[0]) * 0.5 * W;
        const prevMidY = (pts[i - 2][1] + p0[1]) * 0.5 * H;
        const curMidX = (p0[0] + p1[0]) * 0.5 * W;
        const curMidY = (p0[1] + p1[1]) * 0.5 * H;
        ctx.moveTo(prevMidX, prevMidY);
        ctx.quadraticCurveTo(p0[0] * W, p0[1] * H, curMidX, curMidY);
      }
      ctx.stroke();
    }

    eraseAtNormalized(nx, ny) {
      const W = this.cssW || 1;
      const H = this.cssH || 1;
      const px = nx * W;
      const py = ny * H;
      const hitRadius = Math.max(10, this.eraserSize || 18);

      let modified = false;
      const next = [];

      for (const stroke of this.strokes) {
        const pts = stroke.points || [];
        const extra = this.normalizeTool(stroke.tool) === 'highlighter' ? 12 : 0;
        const r = hitRadius + extra;

        if (this.eraserMode === 'area' && pts.length > 2) {
          // Area Eraser: split stroke precisely around erased radius!
          let hitAny = false;
          let segment = [];
          const pieces = [];
          for (let i = 0; i < pts.length; i++) {
            const x1 = pts[i][0] * W;
            const y1 = pts[i][1] * H;
            const hitPt = Math.hypot(px - x1, py - y1) <= r;
            if (hitPt) {
              hitAny = true;
              if (segment.length >= 2) pieces.push(segment);
              segment = [];
            } else {
              segment.push(pts[i]);
            }
          }
          if (segment.length >= 2) pieces.push(segment);

          if (hitAny) {
            modified = true;
            for (const piece of pieces) {
              next.push({ ...stroke, id: uid('s'), points: piece });
            }
          } else {
            next.push(stroke);
          }
          continue;
        }

        // Stroke Eraser: touch any part to remove entire stroke cleanly
        let hit = false;
        for (let i = 0; i < pts.length; i++) {
          const x1 = pts[i][0] * W;
          const y1 = pts[i][1] * H;
          if (i === 0) {
            if (Math.hypot(px - x1, py - y1) <= r) {
              hit = true;
              break;
            }
          } else {
            const x0 = pts[i - 1][0] * W;
            const y0 = pts[i - 1][1] * H;
            if (pointToSegmentDist(px, py, x0, y0, x1, y1) <= r) {
              hit = true;
              break;
            }
          }
        }
        if (hit) modified = true;
        else next.push(stroke);
      }

      if (modified) {
        this.strokes = next;
        this.erasedDuringGesture = true;
        this.redraw();
      }
    }

    persist() {
      if (!this.bookId || !this.pageKey) return;
      this.onSavePage?.(this.bookId, this.pageKey, structuredClone(this.strokes), this.pageMeta);
      this.syncToolbarUI();
    }

    undo() {
      if (!this.strokes.length) return;
      this.redoStack.push(this.strokes.pop());
      this.redraw();
      this.persist();
    }

    redo() {
      if (!this.redoStack.length) return;
      this.strokes.push(this.redoStack.pop());
      this.redraw();
      this.persist();
    }

    clearPage() {
      if (!this.strokes.length) return;
      this.strokes = [];
      this.redoStack = [];
      this.redraw();
      this.persist();
      this.toast?.('Đã xóa nét viết trên trang này');
    }

    getActivePalette() {
      return COLOR_PALETTES.find((p) => p.id === this.activePaletteId) || COLOR_PALETTES[0];
    }

    renderPaletteTabs() {
      const tabsEl = document.getElementById('pen-palette-tabs');
      if (!tabsEl) return;
      tabsEl.innerHTML = COLOR_PALETTES.map(
        (pal) => `
          <button class="pen-pal-tab ${pal.id === this.activePaletteId ? 'active' : ''}"
                  data-pen-palette="${pal.id}"
                  type="button">${pal.name}</button>
        `
      ).join('');
    }

    renderColorSwatches() {
      const pal = this.getActivePalette();
      const quickEl = document.getElementById('pen-quick-colors');
      const fullEl = document.getElementById('pen-palette-grid');
      const curUpper = String(this.color || 'auto').toUpperCase();

      const makeDot = (c) => {
        const isAuto = c.hex === 'auto';
        const isActive = isAuto ? this.color === 'auto' : curUpper === c.hex.toUpperCase();
        const bg = isAuto ? 'linear-gradient(135deg,#1d1d1f 50%,#e4dfd5 50%)' : c.hex;
        return `<button class="pen-color-dot ${isActive ? 'active' : ''}" data-pencolor="${c.hex}" style="background:${bg}" title="${c.name}" aria-label="${c.name}" type="button"></button>`;
      };

      if (quickEl) {
        quickEl.innerHTML = pal.colors.slice(0, 6).map(makeDot).join('');
      }
      if (fullEl) {
        fullEl.innerHTML = pal.colors.map(makeDot).join('');
      }
    }

    renderFavoritesBar() {
      const wrap = document.getElementById('pen-favorites-row');
      if (!wrap) return;
      const toolShort = {
        fountain: 'Máy',
        ballpoint: 'Bi',
        calligraphy: 'Thư',
        pencil: 'Chì',
        highlighter: 'Quang',
      };
      wrap.innerHTML =
        this.favorites
          .map((fav) => {
            const bg =
              fav.color === 'auto'
                ? 'linear-gradient(135deg,#1d1d1f 50%,#e4dfd5 50%)'
                : fav.color;
            const active =
              this.tool === fav.tool &&
              String(this.color).toUpperCase() === String(fav.color).toUpperCase() &&
              Math.abs(this.width - fav.width) < 0.25;
            return `
              <div class="pen-fav-chip ${active ? 'active' : ''}">
                <button class="pen-fav-apply" data-fav-apply="${fav.id}" type="button" title="Chọn nhanh ${TOOL_META[fav.tool]?.label || fav.tool} (${fav.width}px)">
                  <span class="pen-fav-dot" style="background:${bg}"></span>
                  <span>${toolShort[fav.tool] || 'Bút'} ${Number(fav.width).toFixed(1)}</span>
                </button>
                <button class="pen-fav-del" data-fav-del="${fav.id}" type="button" aria-label="Xóa bút yêu thích">×</button>
              </div>
            `;
          })
          .join('') +
        (this.favorites.length < 6
          ? `<button class="pen-fav-add" id="pen-fav-add-btn" type="button" title="Lưu cấu hình bút hiện tại">+ Lưu bút</button>`
          : '');
    }

    renderPreviewWave() {
      const cv = this.previewCanvas;
      if (!cv) return;
      const rect = cv.getBoundingClientRect();
      const w = Math.max(180, Math.floor(rect.width || 280));
      const h = Math.max(44, Math.floor(rect.height || 50));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (cv.width !== w * dpr || cv.height !== h * dpr) {
        cv.width = w * dpr;
        cv.height = h * dpr;
      }
      const ctx = cv.getContext('2d');
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (this.tool === 'eraser') {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink-muted') || '#666';
        ctx.font = '500 12px Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          this.eraserMode === 'area'
            ? `Tẩy vùng (${this.eraserSize}px) — xóa từng phần nét vẽ`
            : `Tẩy theo nét (${this.eraserSize}px) — chạm để xóa cả nét`,
          w / 2,
          h / 2
        );
        ctx.restore();
        return;
      }

      // Generate organic Samsung Notes S-wave with variable S Pen pressure!
      const pts = [];
      const steps = 42;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const nx = 0.08 + t * 0.84;
        const ny = this.tool === 'highlighter' && this.straightHighlighter
          ? 0.5
          : 0.5 + Math.sin(t * Math.PI * 2.15) * 0.27;
        const pressure = 0.22 + Math.sin(t * Math.PI) * 0.65 + Math.sin(t * Math.PI * 3) * 0.1;
        pts.push([nx, ny, Math.max(0.15, Math.min(0.98, pressure))]);
      }

      this.drawStroke(
        ctx,
        {
          id: 'preview',
          tool: this.tool,
          color: this.color,
          width: this.width,
          opacity: this.opacity,
          points: pts,
        },
        w,
        h
      );
      ctx.restore();
    }

    syncToolbarUI() {
      const isEraser = this.tool === 'eraser';
      const isHighlighter = this.tool === 'highlighter';

      document.querySelectorAll('.pen-tool-btn').forEach((btn) => {
        btn.classList.toggle('active', this.normalizeTool(btn.dataset.pentool) === this.tool);
      });

      const titleEl = document.getElementById('pen-detail-title');
      if (titleEl) titleEl.textContent = TOOL_META[this.tool]?.label || 'Bút S Pen';

      const swatchDot = document.getElementById('pen-expand-dot');
      if (swatchDot) {
        swatchDot.style.background =
          this.color === 'auto'
            ? 'linear-gradient(135deg,#1d1d1f 50%,#e4dfd5 50%)'
            : this.color;
      }
      const expandLbl = document.getElementById('pen-expand-val');
      if (expandLbl) {
        expandLbl.textContent = isEraser ? `${this.eraserSize}px` : `${Number(this.width).toFixed(1)}`;
      }

      // Size & Opacity sliders
      const sizeSlider = document.getElementById('pen-width-slider');
      const sizeVal = document.getElementById('pen-width-val');
      if (sizeSlider) {
        const meta = TOOL_META[this.tool] || TOOL_META.fountain;
        sizeSlider.min = String(meta.minW);
        sizeSlider.max = String(meta.maxW);
        sizeSlider.step = '0.2';
        sizeSlider.value = String(this.width);
      }
      if (sizeVal) sizeVal.textContent = `${Number(this.width).toFixed(1)}px`;

      const opSlider = document.getElementById('pen-opacity-slider');
      const opVal = document.getElementById('pen-opacity-val');
      const pctOp = Math.round(this.opacity * 100);
      if (opSlider) opSlider.value = String(pctOp);
      if (opVal) opVal.textContent = `${pctOp}%`;

      document.querySelectorAll('.pen-size-btn').forEach((btn) => {
        btn.classList.toggle('active', Math.abs(parseFloat(btn.dataset.pensize) - this.width) < 0.35);
      });

      // Toggle tool-specific rows
      document.getElementById('pen-stroke-controls')?.classList.toggle('hidden', isEraser);
      document.getElementById('pen-eraser-controls')?.classList.toggle('hidden', !isEraser);
      document.getElementById('pen-highlighter-row')?.classList.toggle('hidden', !isHighlighter);
      document.getElementById('pen-colors-section')?.classList.toggle('hidden', isEraser);

      const straightChk = document.getElementById('pen-straight-hl');
      if (straightChk) straightChk.checked = Boolean(this.straightHighlighter);

      document.querySelectorAll('[data-eraser-mode]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.eraserMode === this.eraserMode);
      });
      const erSlider = document.getElementById('pen-eraser-size');
      const erVal = document.getElementById('pen-eraser-size-val');
      if (erSlider) erSlider.value = String(this.eraserSize);
      if (erVal) erVal.textContent = `${this.eraserSize}px`;

      // Custom color picker
      const customInp = document.getElementById('pen-custom-color');
      const customHex = document.getElementById('pen-custom-hex');
      const resolvedHex = resolveStrokeColor(this.color);
      if (customInp && /^#[0-9a-fA-F]{6}$/.test(resolvedHex)) customInp.value = resolvedHex;
      if (customHex) customHex.textContent = this.color === 'auto' ? 'Auto' : resolvedHex.toUpperCase();

      const palmBtn = document.getElementById('pen-spen-only-btn');
      if (palmBtn) {
        palmBtn.classList.toggle('active', this.sPenOnly);
        palmBtn.setAttribute('aria-pressed', String(this.sPenOnly));
      }
      const undoBtn = document.getElementById('pen-undo-btn');
      const redoBtn = document.getElementById('pen-redo-btn');
      if (undoBtn) undoBtn.disabled = this.strokes.length === 0;
      if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;

      this.renderPaletteTabs();
      this.renderColorSwatches();
      this.renderFavoritesBar();
      if (this.detailOpen) this.renderPreviewWave();
    }

    bindEvents() {
      if (!this.canvas || !this.stage) return;

      const ro = new ResizeObserver(() => {
        if (!this.bookId) return;
        this.resizeCanvas();
        this.redraw();
      });
      ro.observe(this.stage);

      // Capture-phase S Pen auto-activation
      this.stage.addEventListener(
        'pointerdown',
        (e) => {
          if (!this.isDrawingEnabledForPointer(e)) return;

          if (e.pointerType === 'pen' && !this.active) {
            this.sPenOnly = true;
            this.setActive(true);
            this.toast?.('Đã kích hoạt bút S Pen (Chống tì tay BẬT)');
          }

          // Auto-collapse pen settings drawer as soon as user starts writing on the page
          if (this.detailOpen) this.setDetailOpen(false);

          e.preventDefault();
          e.stopPropagation();

          this.resizeCanvas();
          const rect = this.stage.getBoundingClientRect();
          const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
          const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / Math.max(1, rect.height)));
          const pressure =
            e.pointerType === 'pen' && typeof e.pressure === 'number' && e.pressure > 0
              ? e.pressure
              : 0.52;

          this.drawing = true;
          this.activePointerId = e.pointerId;
          this.erasedDuringGesture = false;
          this.canvas.setPointerCapture?.(e.pointerId);

          const isEraser = this.tool === 'eraser' || e.buttons === 32 || e.button === 5;
          this._gestureIsEraser = isEraser;

          if (isEraser) {
            this.eraseAtNormalized(nx, ny);
            return;
          }

          this.redoStack = [];
          this.currentStroke = {
            id: uid('s'),
            tool: this.tool,
            color: this.color,
            width: this.width,
            opacity: this.opacity,
            points: [[Number(nx.toFixed(4)), Number(ny.toFixed(4)), Number(pressure.toFixed(2))]],
          };
          this.redraw();
        },
        { capture: true }
      );

      const handleMove = (e) => {
        if (!this.drawing || e.pointerId !== this.activePointerId) return;
        e.preventDefault();
        e.stopPropagation();

        const rect = this.stage.getBoundingClientRect();
        const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e];
        for (const ev of events) {
          const nx = Math.max(0, Math.min(1, (ev.clientX - rect.left) / Math.max(1, rect.width)));
          const ny = Math.max(0, Math.min(1, (ev.clientY - rect.top) / Math.max(1, rect.height)));

          if (this._gestureIsEraser) {
            this.eraseAtNormalized(nx, ny);
            continue;
          }

          if (!this.currentStroke) continue;
          const pts = this.currentStroke.points;

          // Straight Highlighter mode (just like Samsung Notes Straight Marker!)
          if (this.currentStroke.tool === 'highlighter' && this.straightHighlighter) {
            const start = pts[0];
            // Snap almost-horizontal lines cleanly to exact horizontal
            const dyPx = Math.abs((ny - start[1]) * rect.height);
            const dxPx = Math.abs((nx - start[0]) * rect.width);
            const snappedNy = dxPx > 24 && dyPx < 14 ? start[1] : ny;
            const endPt = [Number(nx.toFixed(4)), Number(snappedNy.toFixed(4)), 0.52];
            if (pts.length === 1) pts.push(endPt);
            else pts[1] = endPt;
            continue;
          }

          const last = pts[pts.length - 1];
          if (Math.hypot((nx - last[0]) * rect.width, (ny - last[1]) * rect.height) < 1.2) continue;
          const pressure =
            ev.pointerType === 'pen' && typeof ev.pressure === 'number' && ev.pressure > 0
              ? ev.pressure
              : 0.52;
          pts.push([Number(nx.toFixed(4)), Number(ny.toFixed(4)), Number(pressure.toFixed(2))]);
        }
        this.redraw();
      };

      const handleUp = (e) => {
        if (!this.drawing || e.pointerId !== this.activePointerId) return;
        this.drawing = false;
        this.activePointerId = null;
        try {
          this.canvas.releasePointerCapture?.(e.pointerId);
        } catch (_) {}

        if (this._gestureIsEraser) {
          if (this.erasedDuringGesture) this.persist();
          return;
        }

        if (this.currentStroke && this.currentStroke.points.length > 0) {
          this.strokes.push(this.currentStroke);
          this.currentStroke = null;
          this.redraw();
          this.persist();
        }
      };

      this.canvas.addEventListener('pointermove', handleMove);
      this.canvas.addEventListener('pointerup', handleUp);
      this.canvas.addEventListener('pointercancel', handleUp);
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);

      // Tool buttons (tap again on active tool to open/close Samsung Notes Pen Panel!)
      document.querySelectorAll('.pen-tool-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.selectTool(btn.dataset.pentool || 'fountain', true);
        });
      });

      // Delegated clicks inside toolbar + detail panel (colors, palettes, sizes, favorites, eraser modes)
      const handlePenUI = (e) => {
        const colorBtn = e.target.closest('.pen-color-dot[data-pencolor]');
        if (colorBtn) {
          this.color = colorBtn.dataset.pencolor || 'auto';
          if (this.tool === 'eraser') this.selectTool('fountain', false);
          this.toolPrefs[this.tool] = { width: this.width, opacity: this.opacity, color: this.color };
          this.syncToolbarUI();
          return;
        }
        const palTab = e.target.closest('[data-pen-palette]');
        if (palTab) {
          this.activePaletteId = palTab.dataset.penPalette || 'essential';
          this.syncToolbarUI();
          return;
        }
        const sizeBtn = e.target.closest('.pen-size-btn[data-pensize]');
        if (sizeBtn) {
          this.width = parseFloat(sizeBtn.dataset.pensize) || 2.4;
          this.toolPrefs[this.tool] = { width: this.width, opacity: this.opacity, color: this.color };
          this.syncToolbarUI();
          return;
        }
        const erMode = e.target.closest('[data-eraser-mode]');
        if (erMode) {
          this.eraserMode = erMode.dataset.eraserMode === 'area' ? 'area' : 'stroke';
          this.syncToolbarUI();
          return;
        }
        const favApply = e.target.closest('[data-fav-apply]');
        if (favApply) {
          const fav = this.favorites.find((f) => f.id === favApply.dataset.favApply);
          if (fav) {
            this.tool = this.normalizeTool(fav.tool);
            this.color = fav.color;
            this.width = fav.width;
            this.opacity = fav.opacity ?? TOOL_META[this.tool].defaultOpacity;
            this.syncToolbarUI();
          }
          return;
        }
        const favDel = e.target.closest('[data-fav-del]');
        if (favDel) {
          e.stopPropagation();
          this.favorites = this.favorites.filter((f) => f.id !== favDel.dataset.favDel);
          this.saveFavorites();
          this.syncToolbarUI();
          return;
        }
        if (e.target.closest('#pen-fav-add-btn')) {
          if (this.tool === 'eraser') {
            this.toast?.('Chọn một loại bút trước khi lưu yêu thích');
            return;
          }
          this.favorites.push({
            id: uid('fav'),
            tool: this.tool,
            color: this.color,
            width: Number(this.width.toFixed(1)),
            opacity: Number(this.opacity.toFixed(2)),
          });
          this.favorites = this.favorites.slice(-6);
          this.saveFavorites();
          this.syncToolbarUI();
          this.toast?.('Đã lưu vào Bút yêu thích');
        }
      };

      this.toolbar?.addEventListener('click', handlePenUI);
      this.detailPanel?.addEventListener('click', handlePenUI);

      document.getElementById('pen-expand-btn')?.addEventListener('click', () => {
        this.setDetailOpen(!this.detailOpen);
      });
      document.getElementById('pen-detail-close')?.addEventListener('click', () => {
        this.setDetailOpen(false);
      });

      document.getElementById('pen-width-slider')?.addEventListener('input', (e) => {
        this.width = parseFloat(e.target.value) || 2.4;
        this.toolPrefs[this.tool] = { width: this.width, opacity: this.opacity, color: this.color };
        this.syncToolbarUI();
      });

      document.getElementById('pen-opacity-slider')?.addEventListener('input', (e) => {
        this.opacity = Math.max(0.15, Math.min(1, parseInt(e.target.value, 10) / 100));
        this.toolPrefs[this.tool] = { width: this.width, opacity: this.opacity, color: this.color };
        this.syncToolbarUI();
      });

      document.getElementById('pen-straight-hl')?.addEventListener('change', (e) => {
        this.straightHighlighter = Boolean(e.target.checked);
        this.syncToolbarUI();
      });

      document.getElementById('pen-eraser-size')?.addEventListener('input', (e) => {
        this.eraserSize = parseInt(e.target.value, 10) || 18;
        this.syncToolbarUI();
      });

      document.getElementById('pen-custom-color')?.addEventListener('input', (e) => {
        this.color = e.target.value;
        if (this.tool === 'eraser') this.selectTool('fountain', false);
        this.toolPrefs[this.tool] = { width: this.width, opacity: this.opacity, color: this.color };
        this.syncToolbarUI();
      });

      document.getElementById('pen-undo-btn')?.addEventListener('click', () => this.undo());
      document.getElementById('pen-redo-btn')?.addEventListener('click', () => this.redo());
      document.getElementById('pen-clear-btn')?.addEventListener('click', () => {
        if (this.strokes.length && confirm('Xóa toàn bộ nét viết S Pen trên trang này?')) {
          this.clearPage();
        }
      });
      document.getElementById('pen-spen-only-btn')?.addEventListener('click', () => {
        this.setSPenOnly(!this.sPenOnly);
        this.toast?.(
          this.sPenOnly
            ? 'Chỉ nhận S Pen (Chống tì tay BẬT — ngón tay vẫn lật trang bình thường)'
            : 'Cho phép vẽ bằng cả S Pen, tay và chuột'
        );
      });
      document.getElementById('pen-done-btn')?.addEventListener('click', () => this.setActive(false));
    }
  }

  window.PaperInkSPen = SPenInkCanvas;
})();
