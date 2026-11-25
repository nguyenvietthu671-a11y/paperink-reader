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

  class SPenInkCanvas {
    constructor({ onSavePage, onActiveChange, toast }) {
      this.onSavePage = onSavePage;
      this.onActiveChange = onActiveChange;
      this.toast = toast;

      this.canvas = document.getElementById('ink-canvas');
      this.stage = document.getElementById('reader-stage');
      this.toolbar = document.getElementById('pen-toolbar');
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

      this.active = false; // Whether pen toolbar / drawing mode is open
      this.sPenOnly = false; // Palm rejection: ignore finger touch when true (pen & mouse still draw)
      this.autoSPenDetect = true; // Instantly draw whenever S Pen (pointerType === 'pen') touches screen

      this.tool = 'pen'; // pen | pencil | highlighter | eraser
      this.color = 'auto'; // auto | #D93829 | #0066CC | #2D8A4E | #F2B705
      this.width = 2.6; // 1.8 | 2.6 | 4.6

      this.bookId = null;
      this.pageKey = null;
      this.pageMeta = null; // { chapterIndex, chapterTitle, pageLabel, progressRatio }
      this.strokes = [];
      this.redoStack = [];

      this.drawing = false;
      this.activePointerId = null;
      this.currentStroke = null;
      this.erasedDuringGesture = false;

      this.bindEvents();
      this.syncToolbarUI();
    }

    isDrawingEnabledForPointer(e) {
      if (!this.bookId || !this.pageKey) return false;
      // Always allow S Pen automatically if autoSPenDetect is on!
      if (e.pointerType === 'pen' && (this.active || this.autoSPenDetect)) {
        return true;
      }
      if (!this.active) return false;
      // Palm rejection: if sPenOnly is enabled, reject finger touch so user can swipe pages with finger while writing with S Pen!
      if (this.sPenOnly && e.pointerType === 'touch') return false;
      return true;
    }

    setActive(flag) {
      this.active = Boolean(flag);
      this.canvas?.classList.toggle('pen-active', this.active);
      this.canvas?.classList.toggle('spen-only', this.active && this.sPenOnly);
      this.toolbar?.classList.toggle('open', this.active);
      document.getElementById('hud-pen-btn')?.classList.toggle('active', this.active);
      document.getElementById('hud-pen-btn')?.setAttribute('aria-pressed', String(this.active));
      this.onActiveChange?.(this.active);
      this.syncToolbarUI();
    }

    setSPenOnly(flag) {
      this.sPenOnly = Boolean(flag);
      this.canvas?.classList.toggle('spen-only', this.active && this.sPenOnly);
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
        this.drawStroke(ctx, stroke);
      }
      if (this.currentStroke) {
        this.drawStroke(ctx, this.currentStroke);
      }
      ctx.restore();
    }

    drawStroke(ctx, stroke) {
      const pts = stroke.points;
      if (!pts || pts.length === 0) return;
      const W = this.cssW || 1;
      const H = this.cssH || 1;
      const color = resolveStrokeColor(stroke.color);

      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.34;
        ctx.lineCap = 'butt';
        ctx.lineWidth = Math.max(12, (stroke.width || 2.6) * 5.2);
        ctx.beginPath();
        ctx.moveTo(pts[0][0] * W, pts[0][1] * H);
        for (let i = 1; i < pts.length; i++) {
          const prev = pts[i - 1];
          const cur = pts[i];
          const midX = ((prev[0] + cur[0]) * 0.5) * W;
          const midY = ((prev[1] + cur[1]) * 0.5) * H;
          ctx.quadraticCurveTo(prev[0] * W, prev[1] * H, midX, midY);
        }
        const last = pts[pts.length - 1];
        ctx.lineTo(last[0] * W, last[1] * H);
        ctx.stroke();
        ctx.restore();
        return;
      }

      if (stroke.tool === 'pencil') {
        ctx.globalAlpha = 0.58;
      } else {
        ctx.globalAlpha = 0.96;
      }
      ctx.lineCap = 'round';

      const baseW = stroke.width || 2.6;
      if (pts.length === 1) {
        const p = pts[0][2] ?? 0.5;
        const r = Math.max(0.8, (baseW * (0.5 + 0.85 * p)) / 2);
        ctx.beginPath();
        ctx.arc(pts[0][0] * W, pts[0][1] * H, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }

      // Smooth variable-width pressure segments (like Samsung Notes fountain pen!)
      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1];
        const p1 = pts[i];
        const pMid = ((p0[2] ?? 0.5) + (p1[2] ?? 0.5)) * 0.5;
        const segW = Math.max(0.9, baseW * (0.45 + 0.95 * pMid));
        ctx.lineWidth = segW;
        ctx.beginPath();
        if (i === 1) {
          ctx.moveTo(p0[0] * W, p0[1] * H);
          ctx.lineTo(p1[0] * W, p1[1] * H);
        } else {
          const prevMidX = ((pts[i - 2][0] + p0[0]) * 0.5) * W;
          const prevMidY = ((pts[i - 2][1] + p0[1]) * 0.5) * H;
          const curMidX = ((p0[0] + p1[0]) * 0.5) * W;
          const curMidY = ((p0[1] + p1[1]) * 0.5) * H;
          ctx.moveTo(prevMidX, prevMidY);
          ctx.quadraticCurveTo(p0[0] * W, p0[1] * H, curMidX, curMidY);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    eraseAtNormalized(nx, ny) {
      const W = this.cssW || 1;
      const H = this.cssH || 1;
      const px = nx * W;
      const py = ny * H;
      const hitRadius = 16;

      let removed = false;
      const next = [];
      for (const stroke of this.strokes) {
        const pts = stroke.points || [];
        let hit = false;
        const extra = stroke.tool === 'highlighter' ? 12 : 0;
        for (let i = 0; i < pts.length; i++) {
          const x1 = pts[i][0] * W;
          const y1 = pts[i][1] * H;
          if (i === 0) {
            if (Math.hypot(px - x1, py - y1) <= hitRadius + extra) {
              hit = true;
              break;
            }
          } else {
            const x0 = pts[i - 1][0] * W;
            const y0 = pts[i - 1][1] * H;
            if (pointToSegmentDist(px, py, x0, y0, x1, y1) <= hitRadius + extra) {
              hit = true;
              break;
            }
          }
        }
        if (hit) {
          removed = true;
        } else {
          next.push(stroke);
        }
      }

      if (removed) {
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

    syncToolbarUI() {
      document.querySelectorAll('.pen-tool-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.pentool === this.tool);
      });
      document.querySelectorAll('.pen-color-dot').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.pencolor === this.color);
      });
      document.querySelectorAll('.pen-size-btn').forEach((btn) => {
        btn.classList.toggle('active', Math.abs(parseFloat(btn.dataset.pensize) - this.width) < 0.2);
      });
      const palmBtn = document.getElementById('pen-spen-only-btn');
      if (palmBtn) {
        palmBtn.classList.toggle('active', this.sPenOnly);
        palmBtn.setAttribute('aria-pressed', String(this.sPenOnly));
      }
      const undoBtn = document.getElementById('pen-undo-btn');
      const redoBtn = document.getElementById('pen-redo-btn');
      if (undoBtn) undoBtn.disabled = this.strokes.length === 0;
      if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;
    }

    bindEvents() {
      if (!this.canvas || !this.stage) return;

      // Resize observer so canvas matches reader stage seamlessly
      const ro = new ResizeObserver(() => {
        if (!this.bookId) return;
        this.resizeCanvas();
        this.redraw();
      });
      ro.observe(this.stage);

      // Listen on stage in capture phase so S Pen automatically writes even before Pen Mode is toggled!
      this.stage.addEventListener(
        'pointerdown',
        (e) => {
          if (!this.isDrawingEnabledForPointer(e)) return;

          // If S Pen touched screen while toolbar closed, auto-open Pen Mode with Palm Rejection!
          if (e.pointerType === 'pen' && !this.active) {
            this.sPenOnly = true;
            this.setActive(true);
            this.toast?.('Đã kích hoạt bút S Pen (Chống tì tay BẬT)');
          }

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

          // S Pen side button / eraser tip (buttons === 32) acts as instant eraser!
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
          const last = pts[pts.length - 1];
          // Tiny distance threshold prevents bloated duplicate points
          if (Math.hypot((nx - last[0]) * rect.width, (ny - last[1]) * rect.height) < 1.3) continue;
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

      // Toolbar button bindings
      document.querySelectorAll('.pen-tool-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.tool = btn.dataset.pentool || 'pen';
          // Auto-select warm yellow when picking highlighter if currently on auto ink
          if (this.tool === 'highlighter' && this.color === 'auto') {
            this.color = '#F2B705';
          }
          this.syncToolbarUI();
        });
      });

      document.querySelectorAll('.pen-color-dot').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.color = btn.dataset.pencolor || 'auto';
          if (this.tool === 'eraser') this.tool = 'pen';
          this.syncToolbarUI();
        });
      });

      document.querySelectorAll('.pen-size-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.width = parseFloat(btn.dataset.pensize) || 2.6;
          this.syncToolbarUI();
        });
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
