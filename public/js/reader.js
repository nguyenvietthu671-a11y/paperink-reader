(function () {
  function uid(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function formatMinutes(mins) {
    if (!mins || mins <= 1) return '~1 phút còn lại';
    if (mins < 60) return `~${mins} phút còn lại`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `~${h}g ${m}p còn lại` : `~${h} giờ còn lại`;
  }

  function getWordAndSentenceAtPoint(x, y, rootEl) {
    let range = null;
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(x, y);
    } else if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(x, y);
      if (pos) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
      }
    }
    if (!range) return null;
    const node = range.startContainer;
    if (!node || node.nodeType !== Node.TEXT_NODE) return null;
    if (!rootEl.contains(node)) return null;

    // Ensure tap point is actually close to the character rect (not blank whitespace)
    const text = node.nodeValue || '';
    const offset = range.startOffset;
    if (!text.trim()) return null;

    try {
      const testRange = document.createRange();
      const s = Math.max(0, Math.min(offset, text.length - 1));
      testRange.setStart(node, s);
      testRange.setEnd(node, Math.min(text.length, s + 1));
      const rect = testRange.getBoundingClientRect();
      if (
        rect.width === 0 ||
        x < rect.left - 18 ||
        x > rect.right + 18 ||
        y < rect.top - 16 ||
        y > rect.bottom + 16
      ) {
        return null;
      }
    } catch (_) {}

    const isWordChar = (ch) => /[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF'-]/.test(ch);
    let start = offset;
    let end = offset;
    if (start >= text.length && start > 0) start = text.length - 1;
    if (!isWordChar(text[start]) && start > 0 && isWordChar(text[start - 1])) {
      start--;
      end = start;
    }
    if (!isWordChar(text[start])) return null;

    while (start > 0 && isWordChar(text[start - 1])) start--;
    while (end < text.length && isWordChar(text[end])) end++;

    const word = text
      .slice(start, end)
      .replace(/^['-]+|['-]+$/g, '')
      .trim();
    if (!word || word.length < 2) return null;

    // Grab surrounding sentence from closest block element
    const block = node.parentElement?.closest('p, li, blockquote, div, h1, h2, h3, h4') || node.parentElement;
    const blockText = (block?.textContent || text).replace(/\s+/g, ' ').trim();
    let context = '';
    const idx = blockText.toLowerCase().indexOf(word.toLowerCase());
    if (idx !== -1) {
      const before = blockText.slice(0, idx);
      const after = blockText.slice(idx);
      const sentStart = Math.max(
        before.lastIndexOf('. ') + 2,
        before.lastIndexOf('! ') + 2,
        before.lastIndexOf('? ') + 2,
        0
      );
      const endMatch = after.search(/[.!?](\s|$)/);
      const sentEnd = endMatch === -1 ? Math.min(blockText.length, idx + 160) : idx + endMatch + 1;
      context = blockText.slice(sentStart, sentEnd).trim().slice(0, 220);
    }

    return { word, context };
  }

  // Exact cubic-bezier easing solver for natural physical paper inertia
  function solveCubicBezier(x1, y1, x2, y2, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const xt = ((ax * t + bx) * t + cx) * t - x;
      const dxt = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(dxt) < 1e-6) break;
      t = Math.max(0, Math.min(1, t - xt / dxt));
    }
    return ((ay * t + by) * t + cy) * t;
  }

  class PaperInkReader {
    constructor(callbacks) {
      this.cb = callbacks;
      this.bookMeta = null;
      this.epub = null;
      this.chapterIndex = 0;
      this.currentPage = 0;
      this.totalPages = 1;
      this.pageW = 360;
      this.pageH = 640;
      this.pageGap = 40;
      this.hudVisible = false;
      this.isTransitioning = false;
      this.previousJumpPos = null;
      this.pendingSelection = null;
      this.activeHighlightId = null;

      // DOM elements
      this.viewEl = document.getElementById('reader-view');
      this.zoomViewportEl = document.getElementById('reader-zoom-viewport');
      this.zoomBadgeEl = document.getElementById('reader-zoom-badge');
      this.zoomPctEl = document.getElementById('reader-zoom-pct');
      this.stageEl = document.getElementById('reader-stage');
      this.maskEl = document.getElementById('page-mask');
      this.contentEl = document.getElementById('chapter-content');

      // Content-Only Zoom & Pan state (Toolbars remain 100% unscaled!)
      this.contentZoom = 1;
      this.contentPanX = 0;
      this.contentPanY = 0;
      this._lastAutoLookupSig = '';
      this._singleWordSettleTimer = null;
      this._selectPointerDown = false;
      this.flashEl = document.getElementById('eink-flash');
      this.curlEl = document.getElementById('page-curl-overlay');
      this.curlStage = document.getElementById('curl-stage');
      this.curlUnderVeil = document.getElementById('curl-under-veil');
      this.curlTopSheet = document.getElementById('curl-top-sheet');
      this.curlCreaseShade = document.getElementById('curl-crease-shade');
      this.curlUnderShadow = document.getElementById('curl-under-shadow');
      this.curlFlap = document.getElementById('curl-flap');
      this.curlFlapMirror = document.getElementById('curl-flap-mirror');
      this.dogEarEl = document.getElementById('page-dog-ear');

      // Interactive page-turn drag & animation state
      this.turnSession = null;
      this.curlRafId = null;

      // Micro header/footer & reading progress bar
      this.microHeader = document.getElementById('reader-micro-header');
      this.microBookTitle = document.getElementById('micro-book-title');
      this.microChapterTitle = document.getElementById('micro-chapter-title');
      this.microFooter = document.getElementById('reader-micro-footer');
      this.microPageInfo = document.getElementById('micro-page-info');
      this.microProgressInfo = document.getElementById('micro-progress-info');
      this.progressLineWrap = document.getElementById('reader-progress-line');
      this.progressLineFill = document.getElementById('reader-progress-fill');
      this.progressPillWrap = document.getElementById('reader-progress-pill-wrap');
      this.progressPillFill = document.getElementById('reader-pill-fill');
      this.progressPillPct = document.getElementById('reader-pill-pct');

      // HUD
      this.hudTop = document.getElementById('reader-hud-top');
      this.hudBottom = document.getElementById('reader-hud-bottom');
      this.hudTitle = document.getElementById('hud-book-title');
      this.hudSubtitle = document.getElementById('hud-chapter-title');
      this.bookmarkBtn = document.getElementById('hud-bookmark-btn');
      this.tapDictBtn = document.getElementById('hud-tapdict-btn');
      this.scrubber = document.getElementById('reader-scrubber');
      this.scrubberLabel = document.getElementById('scrubber-label');
      this.prevChapBtn = document.getElementById('hud-prev-chap');
      this.nextChapBtn = document.getElementById('hud-next-chap');
      this.undoJumpBtn = document.getElementById('undo-jump-btn');

      // Selection docked bar
      this.selBar = document.getElementById('selection-bar');
      this.hlModal = document.getElementById('highlight-modal');
      this.hlBackdrop = document.getElementById('highlight-backdrop');
      this.hlQuoteEl = document.getElementById('hl-modal-quote');
      this.hlNoteInput = document.getElementById('hl-note-input');

      this.bindEvents();
    }

    getSettings() {
      return this.cb.getSettings();
    }

    isScrollMode() {
      const s = this.getSettings();
      return s.readDirection === 'vertical' || (!s.readDirection && s.pageMode === 'scroll');
    }

    isPenBlockingInput(isTouch = false) {
      const penState = this.cb.getPenState?.();
      if (!penState) return false;
      if (isTouch) {
        // Reject palm/touch while S Pen is hovering, actively writing, or within lift cooldown
        if (penState.shouldRejectTouch) return true;
        // Only block finger page turns if user explicitly turned OFF Smart S-Pen-Only mode ("Vẽ cả bằng tay")
        if (penState.active && !penState.sPenOnly) return true;
        return false;
      }
      // For mouse / synthetic clicks: suppress right after S Pen strokes or when manual draw-all is active
      if (penState.shouldSuppressTap) return true;
      if (penState.active && !penState.sPenOnly) return true;
      return false;
    }

    abortTouchGesture() {
      this._abortActiveTouch?.();
    }

    isPalmTouchContact(touch) {
      if (!touch) return false;
      if (touch.touchType === 'stylus') return true;
      const rx = Number(touch.radiusX || 0);
      const ry = Number(touch.radiusY || 0);
      if (rx > 23 || ry > 23 || rx * ry > 420) return true;
      return false;
    }

    getTurnEffect() {
      const s = this.getSettings();
      return s.turnEffect || (s.pageMode === 'instant' ? 'instant' : 'curl');
    }

    // ==================== CONTENT-ONLY PINCH-ZOOM & PAN (TOOLBARS NEVER ZOOM) ====================
    applyContentZoomTransform(animate = false) {
      if (!this.stageEl) return;
      const vp = this.zoomViewportEl || this.stageEl.parentElement;
      const baseW = Math.max(1, this.stageEl.offsetWidth || vp?.clientWidth || 360);
      const baseH = Math.max(1, this.stageEl.offsetHeight || vp?.clientHeight || 640);

      if (this.contentZoom >= 1) {
        const minX = Math.min(0, baseW * (1 - this.contentZoom));
        const minY = Math.min(0, baseH * (1 - this.contentZoom));
        this.contentPanX = Math.max(minX, Math.min(0, this.contentPanX));
        this.contentPanY = Math.max(minY, Math.min(0, this.contentPanY));
      } else {
        // Gentle centered rubber-band when pinching slightly below 1.0x
        this.contentPanX = (baseW * (1 - this.contentZoom)) * 0.5;
        this.contentPanY = (baseH * (1 - this.contentZoom)) * 0.5;
      }

      const isZoomed = this.contentZoom > 1.01;
      this.stageEl.classList.toggle('zoom-animating', Boolean(animate));
      this.stageEl.classList.toggle('is-zoomed', isZoomed);

      if (Math.abs(this.contentZoom - 1) < 0.005 && Math.abs(this.contentPanX) < 0.5 && Math.abs(this.contentPanY) < 0.5) {
        this.contentZoom = 1;
        this.contentPanX = 0;
        this.contentPanY = 0;
        this.stageEl.style.transform = '';
      } else {
        this.stageEl.style.transform = `translate3d(${this.contentPanX.toFixed(1)}px, ${this.contentPanY.toFixed(
          1
        )}px, 0) scale(${this.contentZoom.toFixed(4)})`;
      }

      if (this.zoomBadgeEl) {
        this.zoomBadgeEl.classList.toggle('hidden', !isZoomed);
        if (isZoomed && this.zoomPctEl) {
          this.zoomPctEl.textContent = `${Math.round(this.contentZoom * 100)}%`;
        }
      }
    }

    zoomContentAroundClientPoint(
      nextZoom,
      focalClientX,
      focalClientY,
      prevFocalClientX = focalClientX,
      prevFocalClientY = focalClientY,
      allowRubberBand = false
    ) {
      const vp = this.zoomViewportEl || this.stageEl;
      if (!vp || !this.stageEl) return;
      const vpRect = vp.getBoundingClientRect();
      if (vpRect.width <= 0 || vpRect.height <= 0) return;
      const vpScaleX = vpRect.width / Math.max(1, vp.clientWidth || vpRect.width);
      const vpScaleY = vpRect.height / Math.max(1, vp.clientHeight || vpRect.height);

      const stageOffsetX = this.stageEl.offsetLeft || 0;
      const stageOffsetY = this.stageEl.offsetTop || 0;

      const fx0 = (prevFocalClientX - vpRect.left) / Math.max(0.2, vpScaleX) - stageOffsetX;
      const fy0 = (prevFocalClientY - vpRect.top) / Math.max(0.2, vpScaleY) - stageOffsetY;
      const fx1 = (focalClientX - vpRect.left) / Math.max(0.2, vpScaleX) - stageOffsetX;
      const fy1 = (focalClientY - vpRect.top) / Math.max(0.2, vpScaleY) - stageOffsetY;

      const ux = (fx0 - this.contentPanX) / Math.max(0.2, this.contentZoom);
      const uy = (fy0 - this.contentPanY) / Math.max(0.2, this.contentZoom);

      const z = allowRubberBand
        ? Math.max(0.9, Math.min(3.2, nextZoom))
        : Math.max(1, Math.min(3.2, nextZoom));

      this.contentZoom = z;
      this.contentPanX = fx1 - ux * z;
      this.contentPanY = fy1 - uy * z;
      this.applyContentZoomTransform(false);
    }

    resetContentZoom(animate = true) {
      this.contentZoom = 1;
      this.contentPanX = 0;
      this.contentPanY = 0;
      this.applyContentZoomTransform(animate);
    }

    caretPosFromClient(clientX, clientY) {
      try {
        if (document.caretRangeFromPoint) {
          const r = document.caretRangeFromPoint(clientX, clientY);
          if (r && r.startContainer && this.contentEl.contains(r.startContainer)) {
            return { node: r.startContainer, offset: r.startOffset };
          }
        } else if (document.caretPositionFromPoint) {
          const p = document.caretPositionFromPoint(clientX, clientY);
          if (p && p.offsetNode && this.contentEl.contains(p.offsetNode)) {
            return { node: p.offsetNode, offset: p.offset };
          }
        }
      } catch (_) {}
      return null;
    }

    snapSelectionToSingleWordIfPartial() {
      try {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
        const r = sel.getRangeAt(0);
        if (r.startContainer !== r.endContainer || r.startContainer.nodeType !== Node.TEXT_NODE) return;
        const txt = r.startContainer.nodeValue || '';
        const slice = txt.slice(r.startOffset, r.endOffset);
        if (!slice || /\s/.test(slice)) return;
        const isWordChar = (ch) => /[\p{L}\p{M}'’-]/u.test(ch);
        let s = r.startOffset;
        let e = r.endOffset;
        while (s > 0 && isWordChar(txt[s - 1])) s--;
        while (e < txt.length && isWordChar(txt[e])) e++;
        if (e > s && (s !== r.startOffset || e !== r.endOffset)) {
          const expanded = document.createRange();
          expanded.setStart(r.startContainer, s);
          expanded.setEnd(r.startContainer, e);
          sel.removeAllRanges();
          sel.addRange(expanded);
        }
      } catch (_) {}
    }

    bindEvents() {
      // Interactive Finger-Tracking Gesture Engine (1:1 Apple Curl & Slide + Content Pinch-Zoom + S Pen Palm Rejection)
      let startX = 0;
      let startY = 0;
      let lastX = 0;
      let lastY = 0;
      let lastMoveTime = 0;
      let velocityX = 0;
      let startTime = 0;
      let pointerActive = false;
      let gestureMode = 'undecided'; // 'undecided' | 'horizontal' | 'vertical' | 'zoom-pan'
      let dragDir = null;
      let lastPalmPointerAt = 0;
      let lastNativeTouchAt = 0;
      let lastTouchEnd = 0;
      let lastPinchEndAt = 0;
      let touchPtrId = null;
      let pinchSession = null;

      // Prevent browser UI/toolbar zoom anywhere inside reader-view; route pinch straight to book content!
      this.zoomBadgeEl?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetContentZoom(true);
      });

      this.viewEl?.addEventListener(
        'gesturestart',
        (e) => {
          e.preventDefault();
        },
        { passive: false }
      );
      this.viewEl?.addEventListener(
        'gesturechange',
        (e) => {
          e.preventDefault();
        },
        { passive: false }
      );
      this.viewEl?.addEventListener(
        'touchmove',
        (e) => {
          // Block browser pinch-zoom on HUD / Pen Toolbar / Quick Pill so toolbars NEVER zoom!
          if (e.touches.length >= 2 && e.cancelable) {
            e.preventDefault();
          }
        },
        { passive: false }
      );

      // Trackpad Pinch-Zoom (Ctrl + Wheel) & 2-Finger Pan when zoomed
      this.viewEl?.addEventListener(
        'wheel',
        (e) => {
          if (!this.epub || this.viewEl.classList.contains('hidden')) return;
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.target.closest('#pen-toolbar, #pen-detail-panel, #reader-hud-top, #reader-hud-bottom')) return;
            const factor = Math.exp(-e.deltaY * 0.0085);
            const nextZ = Math.max(1, Math.min(3.2, this.contentZoom * factor));
            this.zoomContentAroundClientPoint(nextZ, e.clientX, e.clientY);
            return;
          }
          if (this.contentZoom > 1.01 && !e.target.closest('#pen-detail-panel')) {
            e.preventDefault();
            this.contentPanX -= e.deltaX;
            this.contentPanY -= e.deltaY;
            this.applyContentZoomTransform(false);
          }
        },
        { passive: false }
      );

      this._abortActiveTouch = () => {
        if (pointerActive || this.turnSession) {
          pointerActive = false;
          touchPtrId = null;
          gestureMode = 'undecided';
          dragDir = null;
          this.cancelTurnSessionImmediate();
        }
      };

      // Detect wide palm patches via W3C PointerEvent contact geometry (width/height in CSS px)
      this.stageEl.addEventListener(
        'pointerdown',
        (e) => {
          if (e.pointerType === 'pen') {
            this._abortActiveTouch();
            return;
          }
          if (e.pointerType === 'touch') {
            const pw = Number(e.width || 0);
            const ph = Number(e.height || 0);
            if (pw > 44 || ph > 44 || pw * ph > 1400) {
              lastPalmPointerAt = Date.now();
              this._abortActiveTouch();
            }
          }
        },
        { capture: true }
      );

      const beginFingerGesture = (clientX, clientY) => {
        if (this.turnSession?.animating) {
          this.forceCompleteTurnSession();
        }
        pointerActive = true;
        gestureMode = this.contentZoom > 1.02 ? 'zoom-pan' : 'undecided';
        dragDir = null;
        startX = lastX = clientX;
        startY = lastY = clientY;
        startTime = lastMoveTime = Date.now();
        velocityX = 0;
      };

      const moveFingerGesture = (clientX, clientY, rawEvent) => {
        if (!pointerActive) return;
        if (this.isPenBlockingInput(true) || Date.now() - lastPalmPointerAt < 350 || pinchSession) {
          this._abortActiveTouch();
          return;
        }
        if (!this.epub) return;

        // Respect active text selection (long press)
        const selStr = window.getSelection()?.toString();
        if (selStr && selStr.trim().length > 0) {
          pointerActive = false;
          this.cancelTurnSessionImmediate();
          return;
        }

        // When zoomed into book content (> 102%), 1-finger drag pans smoothly across the zoomed page!
        if (this.contentZoom > 1.02 || gestureMode === 'zoom-pan') {
          gestureMode = 'zoom-pan';
          if (rawEvent?.cancelable) rawEvent.preventDefault();
          const vp = this.zoomViewportEl || this.stageEl;
          const vpRect = vp.getBoundingClientRect();
          const vpScale = Math.max(0.2, vpRect.width / Math.max(1, vp.clientWidth || vpRect.width));
          this.contentPanX += (clientX - lastX) / vpScale;
          this.contentPanY += (clientY - lastY) / vpScale;
          lastX = clientX;
          lastY = clientY;
          this.applyContentZoomTransform(false);
          return;
        }

        if (this.isScrollMode()) return;

        const dx = clientX - startX;
        const dy = clientY - startY;

        const getStageYRatio = (cy) => {
          const rect = this.stageEl.getBoundingClientRect();
          return Math.max(0.12, Math.min(0.88, (cy - rect.top) / Math.max(1, rect.height)));
        };

        if (gestureMode === 'undecided') {
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
          if (Math.abs(dx) > Math.abs(dy) * 1.15) {
            gestureMode = 'horizontal';
            dragDir = dx < 0 ? 'next' : 'prev';
            const eff = this.getTurnEffect();
            if (eff === 'curl' || eff === 'slide') {
              this.beginInteractiveTurn(dragDir, eff, getStageYRatio(clientY));
            }
          } else {
            gestureMode = 'vertical';
            return;
          }
        }

        if (gestureMode !== 'horizontal') return;

        const now = Date.now();
        const dt = Math.max(1, now - lastMoveTime);
        velocityX = (clientX - lastX) / dt; // px/ms
        lastX = clientX;
        lastY = clientY;
        lastMoveTime = now;

        const eff = this.getTurnEffect();
        if ((eff === 'curl' || eff === 'slide') && this.turnSession) {
          if (rawEvent?.cancelable) rawEvent.preventDefault();
          const stageW = Math.max(1, this.stageEl.getBoundingClientRect().width);
          if (eff === 'curl') {
            const rawP = dragDir === 'next' ? -dx / stageW : dx / stageW;
            this.updateCurlProgress(Math.max(0, Math.min(1, rawP)), getStageYRatio(clientY));
          } else {
            this.updateSlideDrag(dx);
          }
        }
      };

      const finishFingerGesture = (endX, endY, targetEl, cancelled = false) => {
        if (!pointerActive) return;
        pointerActive = false;
        touchPtrId = null;
        if (this.isPenBlockingInput(true) || Date.now() - lastPalmPointerAt < 350) {
          this.cancelTurnSessionImmediate();
          return;
        }
        const dx = endX - startX;
        const dy = endY - startY;
        const dt = Date.now() - startTime;

        if (gestureMode === 'horizontal' && !this.isScrollMode()) {
          const eff = this.getTurnEffect();
          if ((eff === 'curl' || eff === 'slide') && this.turnSession) {
            const stageW = Math.max(1, this.stageEl.getBoundingClientRect().width);
            const prog = dragDir === 'next' ? -dx / stageW : dx / stageW;
            const fastFlick = dragDir === 'next' ? velocityX < -0.32 : velocityX > 0.32;
            const shouldCommit = !cancelled && (prog > 0.22 || (prog > 0.05 && fastFlick));
            this.endInteractiveTurn(shouldCommit, Math.abs(velocityX));
            return;
          }
          // Non-interactive modes (eink / instant): standard swipe threshold
          if (!cancelled && Math.abs(dx) > 40) {
            if (dx < 0) this.nextPage();
            else this.prevPage();
            return;
          }
        }

        this.cancelTurnSessionImmediate();

        // Quick finger tap (skip if user was panning zoomed content or just finished 2-finger pinch)
        if (!cancelled && Date.now() - lastPinchEndAt > 320 && Math.abs(dx) < 14 && Math.abs(dy) < 14 && dt < 340) {
          this.handleTap(endX, endY, targetEl);
        }
      };

      const touchTargetEl = this.zoomViewportEl || this.stageEl;

      touchTargetEl.addEventListener(
        'touchstart',
        (e) => {
          lastNativeTouchAt = Date.now();
          this._selectPointerDown = true;

          // 2-Finger Pinch-to-Zoom on Book Content!
          if (e.touches.length === 2) {
            this._abortActiveTouch();
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            if (dist > 12) {
              pinchSession = {
                startDist: dist,
                startZoom: this.contentZoom || 1,
                lastMidX: (t1.clientX + t2.clientX) * 0.5,
                lastMidY: (t1.clientY + t2.clientY) * 0.5,
              };
            }
            return;
          }

          if (e.touches.length > 2 || pinchSession) {
            this._abortActiveTouch();
            return;
          }

          if (this.isPenBlockingInput(true) || Date.now() - lastPalmPointerAt < 350 || Date.now() - lastPinchEndAt < 240) {
            this._abortActiveTouch();
            return;
          }
          if (this.isPalmTouchContact(e.touches[0])) {
            lastPalmPointerAt = Date.now();
            this._abortActiveTouch();
            return;
          }
          beginFingerGesture(e.touches[0].clientX, e.touches[0].clientY);
        },
        { passive: true }
      );

      touchTargetEl.addEventListener(
        'touchmove',
        (e) => {
          lastNativeTouchAt = Date.now();
          if (e.touches.length === 2) {
            if (e.cancelable) e.preventDefault();
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dist = Math.max(8, Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY));
            const midX = (t1.clientX + t2.clientX) * 0.5;
            const midY = (t1.clientY + t2.clientY) * 0.5;
            if (!pinchSession) {
              pinchSession = {
                startDist: dist,
                startZoom: this.contentZoom || 1,
                lastMidX: midX,
                lastMidY: midY,
              };
              return;
            }
            const nextZoom = pinchSession.startZoom * (dist / pinchSession.startDist);
            this.zoomContentAroundClientPoint(nextZoom, midX, midY, pinchSession.lastMidX, pinchSession.lastMidY, true);
            pinchSession.lastMidX = midX;
            pinchSession.lastMidY = midY;
            return;
          }

          if (!pointerActive || pinchSession) return;
          if (e.touches.length !== 1 || this.isPalmTouchContact(e.touches[0])) {
            this._abortActiveTouch();
            return;
          }
          moveFingerGesture(e.touches[0].clientX, e.touches[0].clientY, e);
        },
        { passive: false }
      );

      const handleTouchFinish = (e, cancelled = false) => {
        lastNativeTouchAt = Date.now();
        if (!e.touches || e.touches.length === 0) {
          this._selectPointerDown = false;
          setTimeout(() => this.maybeAutoLookupSingleSelectedWord(), 75);
        }
        if (pinchSession) {
          if (!e.touches || e.touches.length < 2) {
            pinchSession = null;
            lastPinchEndAt = Date.now();
            if (this.contentZoom < 1.03) {
              this.resetContentZoom(true);
            } else {
              this.applyContentZoomTransform(false);
            }
          }
          return;
        }
        const touch = e.changedTouches?.[0];
        const endX = touch ? touch.clientX : lastX;
        const endY = touch ? touch.clientY : startY;
        finishFingerGesture(endX, endY, e.target, cancelled);
      };

      touchTargetEl.addEventListener('touchend', (e) => handleTouchFinish(e, false), { passive: true });
      touchTargetEl.addEventListener('touchcancel', (e) => handleTouchFinish(e, true), { passive: true });

      // S Pen Text Mode ("Nhập chữ"): Precision Stylus Word Selection (Bôi đen 1 từ để tra cứu) & Tap Support!
      let penTextDrag = null;
      this.stageEl.addEventListener('pointerdown', (e) => {
        this._selectPointerDown = true;
        if (e.pointerType !== 'pen') return;
        const penState = this.cb.getPenState?.();
        if (penState?.spenMode !== 'text') return;
        if (e.target.closest('button, input, textarea, select, a[href], a[data-epub-spine]')) return;

        const startCaret = this.caretPosFromClient(e.clientX, e.clientY);
        penTextDrag = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          startTime: Date.now(),
          moved: false,
          startCaret,
          target: e.target,
        };
      });

      window.addEventListener('pointermove', (e) => {
        if (!penTextDrag || e.pointerId !== penTextDrag.pointerId) return;
        const dist = Math.hypot(e.clientX - penTextDrag.startX, e.clientY - penTextDrag.startY);
        if (dist < 6 && !penTextDrag.moved) return;
        penTextDrag.moved = true;
        if (!penTextDrag.startCaret) {
          penTextDrag.startCaret = this.caretPosFromClient(e.clientX, e.clientY);
          return;
        }
        const curCaret = this.caretPosFromClient(e.clientX, e.clientY);
        if (!curCaret) return;

        try {
          const r1 = document.createRange();
          r1.setStart(penTextDrag.startCaret.node, penTextDrag.startCaret.offset);
          r1.collapse(true);
          const r2 = document.createRange();
          r2.setStart(curCaret.node, curCaret.offset);
          r2.collapse(true);

          const liveRange = document.createRange();
          if (r1.compareBoundaryPoints(Range.START_TO_START, r2) <= 0) {
            liveRange.setStart(penTextDrag.startCaret.node, penTextDrag.startCaret.offset);
            liveRange.setEnd(curCaret.node, curCaret.offset);
          } else {
            liveRange.setStart(curCaret.node, curCaret.offset);
            liveRange.setEnd(penTextDrag.startCaret.node, penTextDrag.startCaret.offset);
          }
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(liveRange);
        } catch (_) {}
      });

      const finishPenTextDrag = (e, cancelled) => {
        this._selectPointerDown = false;
        setTimeout(() => this.maybeAutoLookupSingleSelectedWord(), 75);
        if (!penTextDrag || e.pointerId !== penTextDrag.pointerId) return;
        const pd = penTextDrag;
        penTextDrag = null;
        if (cancelled) return;

        const dt = Date.now() - pd.startTime;
        if (pd.moved) {
          this.snapSelectionToSingleWordIfPartial();
          this.onSelectionChange(true);
        } else if (dt >= 420 && pd.startCaret) {
          // Long-press with S Pen on a word in Text Mode -> select that word & lookup!
          const hit = getWordAndSentenceAtPoint(e.clientX, e.clientY, this.contentEl);
          if (hit) {
            this.cb.openDictionary({
              query: hit.word,
              context: hit.context,
              bookId: this.bookMeta?.id || '',
              bookTitle: this.bookMeta?.title || '',
            });
          }
        } else if (dt < 380) {
          this.handleTap(e.clientX, e.clientY, pd.target || e.target);
        }
      };
      window.addEventListener('pointerup', (e) => finishPenTextDrag(e, false));
      window.addEventListener('pointercancel', (e) => finishPenTextDrag(e, true));
      window.addEventListener('mouseup', () => {
        this._selectPointerDown = false;
        setTimeout(() => this.maybeAutoLookupSingleSelectedWord(), 75);
      });

      // PointerEvent finger fallback for Windows 2-in-1 Touchscreens (e.g. Galaxy Book5 360) if TouchEvents aren't emitted
      this.stageEl.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'touch') return;
        if (Date.now() - lastNativeTouchAt < 500) return;
        if (this.isPenBlockingInput(true) || Date.now() - lastPalmPointerAt < 350) return;
        touchPtrId = e.pointerId;
        beginFingerGesture(e.clientX, e.clientY);
      });
      window.addEventListener('pointermove', (e) => {
        if (touchPtrId === null || e.pointerId !== touchPtrId || e.pointerType !== 'touch') return;
        if (Date.now() - lastNativeTouchAt < 500) {
          touchPtrId = null;
          return;
        }
        moveFingerGesture(e.clientX, e.clientY, e);
      });
      const finishPointerTouch = (e, cancelled) => {
        if (touchPtrId === null || e.pointerId !== touchPtrId) return;
        lastTouchEnd = Date.now();
        finishFingerGesture(e.clientX, e.clientY, e.target, cancelled);
      };
      window.addEventListener('pointerup', (e) => finishPointerTouch(e, false));
      window.addEventListener('pointercancel', (e) => finishPointerTouch(e, true));

      // Desktop mouse edge-drag support for 3D Curl & Smooth Slide (without breaking middle text selection!)
      let mouseDrag = null;
      let suppressNextClick = false;
      this.stageEl.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || this.isScrollMode() || !this.epub || this.isPenBlockingInput(false)) return;
        const eff = this.getTurnEffect();
        if (eff !== 'curl' && eff !== 'slide') return;
        const rect = this.stageEl.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / Math.max(1, rect.width);
        // Only start mouse drag curl from outer 22% edges so middle text stays 100% selectable!
        if (relX > 0.22 && relX < 0.78) return;
        if (this.turnSession?.animating) this.forceCompleteTurnSession();
        mouseDrag = {
          startX: e.clientX,
          lastX: e.clientX,
          lastTime: Date.now(),
          vx: 0,
          active: false,
          dir: relX >= 0.78 ? 'next' : 'prev',
          stageW: Math.max(1, rect.width),
          stageTop: rect.top,
          stageH: Math.max(1, rect.height),
        };
      });

      window.addEventListener('mousemove', (e) => {
        if (!mouseDrag) return;
        const dx = e.clientX - mouseDrag.startX;
        const yRatio = Math.max(0.12, Math.min(0.88, (e.clientY - mouseDrag.stageTop) / mouseDrag.stageH));
        if (!mouseDrag.active) {
          if (Math.abs(dx) < 10) return;
          const draggedRightDir = (mouseDrag.dir === 'next' && dx < 0) || (mouseDrag.dir === 'prev' && dx > 0);
          if (!draggedRightDir) {
            mouseDrag = null;
            return;
          }
          mouseDrag.active = true;
          suppressNextClick = true;
          window.getSelection()?.removeAllRanges();
          this.beginInteractiveTurn(mouseDrag.dir, this.getTurnEffect(), yRatio);
        }
        e.preventDefault();
        const now = Date.now();
        mouseDrag.vx = (e.clientX - mouseDrag.lastX) / Math.max(1, now - mouseDrag.lastTime);
        mouseDrag.lastX = e.clientX;
        mouseDrag.lastTime = now;

        const eff = this.getTurnEffect();
        if (eff === 'curl') {
          const p = mouseDrag.dir === 'next' ? -dx / mouseDrag.stageW : dx / mouseDrag.stageW;
          this.updateCurlProgress(Math.max(0, Math.min(1, p)), yRatio);
        } else if (eff === 'slide') {
          this.updateSlideDrag(dx);
        }
      });

      window.addEventListener('mouseup', (e) => {
        if (!mouseDrag) return;
        const md = mouseDrag;
        mouseDrag = null;
        if (!md.active) return;
        const dx = e.clientX - md.startX;
        const prog = md.dir === 'next' ? -dx / md.stageW : dx / md.stageW;
        const fastFlick = md.dir === 'next' ? md.vx < -0.32 : md.vx > 0.32;
        this.endInteractiveTurn(prog > 0.2 || (prog > 0.04 && fastFlick), Math.abs(md.vx));
        setTimeout(() => {
          suppressNextClick = false;
        }, 60);
      });

      // Mouse click on desktop (ignore if touch just fired or edge-drag just ran or pen drawing active)
      this.stageEl.addEventListener(
        'touchend',
        () => {
          lastTouchEnd = Date.now();
        },
        { passive: true }
      );

      this.stageEl.addEventListener('click', (e) => {
        if (suppressNextClick) return;
        if (e.pointerType === 'pen') return;
        if (Date.now() - lastTouchEnd < 450) return;
        if (this.isPenBlockingInput(false)) return;
        this.handleTap(e.clientX, e.clientY, e.target);
      });

      // Scroll progress tracking in scroll mode
      let scrollTimer = null;
      this.maskEl.addEventListener(
        'scroll',
        () => {
          if (!this.isScrollMode() || !this.epub) return;
          this.updateProgressUI();
          clearTimeout(scrollTimer);
          scrollTimer = setTimeout(() => this.persistProgress(), 350);
        },
        { passive: true }
      );

      // Resize observer for exact pixel pagination on rotation / font change
      let resizeTimer = null;
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.epub || this.viewEl.classList.contains('hidden')) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const ratio = this.getChapterRatio();
          this.layoutChapter(ratio);
        }, 90);
      });
      this.resizeObserver.observe(this.maskEl);

      // Text selection listener (for docked S25 Ultra friendly bar)
      let selTimer = null;
      document.addEventListener('selectionchange', () => {
        if (!this.epub || this.viewEl.classList.contains('hidden')) return;
        clearTimeout(selTimer);
        selTimer = setTimeout(() => this.onSelectionChange(), 140);
      });

      // Selection bar actions
      document.getElementById('sel-dict-btn')?.addEventListener('click', () => {
        if (!this.pendingSelection) return;
        const { text, context } = this.pendingSelection;
        this.clearSelection();
        this.cb.openDictionary({
          query: text,
          context,
          bookId: this.bookMeta?.id || '',
          bookTitle: this.bookMeta?.title || '',
        });
      });

      document.querySelectorAll('.sel-hl-dot').forEach((btn) => {
        btn.addEventListener('click', () => {
          const color = btn.dataset.color || 'sepia';
          this.createHighlightFromSelection(color, false);
        });
      });

      document.getElementById('sel-note-btn')?.addEventListener('click', () => {
        this.createHighlightFromSelection('sepia', true);
      });

      document.getElementById('sel-copy-btn')?.addEventListener('click', () => {
        if (!this.pendingSelection) return;
        navigator.clipboard?.writeText(this.pendingSelection.text).catch(() => {});
        this.cb.toast('Đã sao chép đoạn văn');
        this.clearSelection();
      });

      document.getElementById('sel-close-btn')?.addEventListener('click', () => {
        this.clearSelection();
      });

      // Highlight modal controls
      this.hlBackdrop?.addEventListener('click', () => this.closeHighlightModal());
      document.getElementById('hl-modal-close')?.addEventListener('click', () => this.closeHighlightModal());
      document.getElementById('hl-save-note-btn')?.addEventListener('click', () => {
        if (!this.activeHighlightId || !this.bookMeta) return;
        const note = this.hlNoteInput.value.trim();
        this.cb.updateHighlight(this.bookMeta.id, this.activeHighlightId, { note });
        this.cb.toast('Đã lưu ghi chú');
        this.closeHighlightModal();
      });
      document.getElementById('hl-delete-btn')?.addEventListener('click', () => {
        if (!this.activeHighlightId || !this.bookMeta) return;
        this.cb.deleteHighlight(this.bookMeta.id, this.activeHighlightId);
        this.closeHighlightModal();
        this.reRenderHighlights();
        this.cb.toast('Đã xóa highlight');
      });
      document.getElementById('hl-dict-btn')?.addEventListener('click', () => {
        const hl = this.getActiveHighlight();
        if (!hl) return;
        this.closeHighlightModal();
        this.cb.openDictionary({
          query: hl.text,
          context: hl.text,
          bookId: this.bookMeta?.id || '',
          bookTitle: this.bookMeta?.title || '',
        });
      });
      document.querySelectorAll('.hl-edit-color').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (!this.activeHighlightId || !this.bookMeta) return;
          const color = btn.dataset.color || 'sepia';
          this.cb.updateHighlight(this.bookMeta.id, this.activeHighlightId, { color });
          this.reRenderHighlights();
          this.syncHighlightModalColors(color);
        });
      });

      // HUD navigation buttons
      this.prevChapBtn?.addEventListener('click', () => {
        if (this.chapterIndex > 0) {
          this.recordJumpPoint();
          this.goToChapter(this.chapterIndex - 1, 0);
        }
      });

      this.nextChapBtn?.addEventListener('click', () => {
        if (this.epub && this.chapterIndex < this.epub.spine.length - 1) {
          this.recordJumpPoint();
          this.goToChapter(this.chapterIndex + 1, 0);
        }
      });

      this.scrubber?.addEventListener('input', () => {
        if (!this.epub) return;
        const val = parseFloat(this.scrubber.value);
        if (this.isScrollMode()) {
          this.scrubberLabel.textContent = `${Math.round(val)}% chương này`;
        } else {
          const p = Math.max(0, Math.min(this.totalPages - 1, Math.round(val)));
          this.scrubberLabel.textContent = `Trang ${p + 1} / ${this.totalPages}`;
        }
      });

      this.scrubber?.addEventListener('change', () => {
        if (!this.epub) return;
        this.recordJumpPoint();
        const val = parseFloat(this.scrubber.value);
        if (this.isScrollMode()) {
          const maxScroll = Math.max(0, this.maskEl.scrollHeight - this.maskEl.clientHeight);
          this.maskEl.scrollTop = (val / 100) * maxScroll;
          this.updateProgressUI();
          this.persistProgress();
        } else {
          this.goToPage(Math.round(val), false);
        }
      });

      this.bookmarkBtn?.addEventListener('click', () => this.toggleBookmarkAtCurrent());

      this.undoJumpBtn?.addEventListener('click', () => {
        if (!this.previousJumpPos) return;
        const prev = this.previousJumpPos;
        this.previousJumpPos = null;
        this.undoJumpBtn.classList.add('hidden');
        this.goToChapter(prev.chapterIndex, prev.ratio);
      });

      // Keyboard controls for desktop
      document.addEventListener('keydown', (e) => {
        if (!this.epub || this.viewEl.classList.contains('hidden')) return;
        if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
          if (!this.isScrollMode()) {
            e.preventDefault();
            this.nextPage();
          }
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          if (!this.isScrollMode()) {
            e.preventDefault();
            this.prevPage();
          }
        } else if (e.key === 'b' || e.key === 'B') {
          this.toggleBookmarkAtCurrent();
        } else if (e.key === 'Escape') {
          if (this.hlModal?.classList.contains('open')) this.closeHighlightModal();
          else if (this.hudVisible) this.setHudVisible(false);
        }
      });
    }

    handleTap(clientX, clientY, target) {
      // If user has an active selection, let browser clear it without turning pages
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 0) {
        return;
      }

      // Check highlight tap
      const hlMark = target?.closest?.('mark.pi-hl');
      if (hlMark) {
        const hlId = hlMark.dataset.hlId;
        if (hlId) {
          this.openHighlightModal(hlId);
          return;
        }
      }

      // Check internal EPUB link tap
      const epubLink = target?.closest?.('a[data-epub-spine]');
      if (epubLink) {
        const spineIdx = parseInt(epubLink.dataset.epubSpine, 10);
        const frag = epubLink.dataset.epubFrag || '';
        if (!Number.isNaN(spineIdx)) {
          this.recordJumpPoint();
          this.goToChapter(spineIdx, 0, frag);
          return;
        }
      }

      const rect = this.stageEl.getBoundingClientRect();
      const relX = (clientX - rect.left) / Math.max(1, rect.width);

      // If HUD is visible, tapping center closes HUD cleanly
      if (this.hudVisible) {
        this.setHudVisible(false);
        return;
      }

      // If Tap-to-Dict mode is ON, tapping a word in central 72% triggers Anh-Việt dictionary
      const settings = this.getSettings();
      if (settings.tapDict && relX > 0.14 && relX < 0.86) {
        const hit = getWordAndSentenceAtPoint(clientX, clientY, this.contentEl);
        if (hit) {
          this.cb.openDictionary({
            query: hit.word,
            context: hit.context,
            bookId: this.bookMeta?.id || '',
            bookTitle: this.bookMeta?.title || '',
          });
          return;
        }
      }

      if (this.isScrollMode()) {
        const penState = this.cb.getPenState?.();
        if (penState?.active) {
          this.cb.collapsePenToolbar?.();
          return;
        }
        // In scroll mode, center tap toggles HUD
        this.setHudVisible(!this.hudVisible);
        return;
      }

      // Kindle tap zones: left 28% prev, right 28% next, center 44% HUD
      const relY = Math.max(0.16, Math.min(0.84, (clientY - rect.top) / Math.max(1, rect.height)));
      if (relX <= 0.28) {
        this.prevPage(relY);
      } else if (relX >= 0.72) {
        this.nextPage(relY);
      } else {
        const penState = this.cb.getPenState?.();
        if (penState?.active) {
          this.cb.collapsePenToolbar?.();
        } else {
          this.setHudVisible(!this.hudVisible);
        }
      }
    }

    setHudVisible(visible) {
      this.hudVisible = Boolean(visible);
      this.hudTop.classList.toggle('visible', this.hudVisible);
      this.hudBottom.classList.toggle('visible', this.hudVisible);
      if (this.hudVisible) {
        this.updateScrubber();
      }
    }

    async openBook(bookMeta, epubBlob, savedProgress) {
      this.closeBook();
      this.bookMeta = bookMeta;
      this.viewEl.classList.remove('hidden');
      this.contentEl.innerHTML = '<div class="chapter-loading">Đang mở sách…</div>';
      this.hudTitle.textContent = bookMeta.title || 'Đang đọc';
      this.microBookTitle.textContent = bookMeta.title || '';
      this.setHudVisible(false);

      this.epub = await window.PaperInkEpub.loadFromBlob(epubBlob);

      // Restore saved reading position or start at first meaningful chapter
      let startChap = 0;
      let startRatio = 0;
      if (savedProgress && typeof savedProgress.chapterIndex === 'number') {
        startChap = Math.max(0, Math.min(this.epub.spine.length - 1, savedProgress.chapterIndex));
        startRatio = Math.max(0, Math.min(0.999, savedProgress.progressRatio || 0));
      }

      this.applyVisualMode();
      await this.goToChapter(startChap, startRatio);
      this.startReadingTimer();
    }

    startReadingTimer() {
      this.stopReadingTimer();
      this._readingTimer = setInterval(() => {
        if (!this.epub || document.visibilityState !== 'visible') return;
        this.cb.onReadingActivity?.({ minutesDelta: 0.5, pagesDelta: 0 });
      }, 30000);
    }

    stopReadingTimer() {
      if (this._readingTimer) {
        clearInterval(this._readingTimer);
        this._readingTimer = null;
      }
    }

    closeBook() {
      this.cancelTurnSessionImmediate();
      this.resetContentZoom(false);
      this.stopReadingTimer();
      this.clearSelection();
      this.closeHighlightModal();
      this.setHudVisible(false);
      this.cb.onBookClosed?.();
      if (this.epub) {
        this.persistProgress();
        this.epub.destroy();
        this.epub = null;
      }
      this.bookMeta = null;
      this.previousJumpPos = null;
      this.undoJumpBtn?.classList.add('hidden');
      this.contentEl.innerHTML = '';
      this.viewEl.classList.add('hidden');
    }

    applyVisualMode() {
      const s = this.getSettings();
      const scroll = this.isScrollMode();
      const progStyle = s.progressStyle || (s.showHeaderFooter === false ? 'hidden' : 'line');
      const turnEffect = s.turnEffect || (s.pageMode === 'instant' ? 'instant' : 'eink');

      this.stageEl.classList.toggle('mode-scroll', scroll);
      this.stageEl.classList.toggle('mode-paginated', !scroll);
      this.contentEl.classList.toggle('turn-slide', !scroll && turnEffect === 'slide');

      this.microHeader.classList.toggle('hidden', !s.showHeaderFooter);
      this.microFooter.classList.toggle('hidden', progStyle === 'hidden');
      this.progressLineWrap?.classList.toggle('hidden', progStyle !== 'line');
      this.progressPillWrap?.classList.toggle('hidden', progStyle !== 'pill');

      if (this.tapDictBtn) {
        const isTap = Boolean(s.tapDict);
        this.tapDictBtn.classList.toggle('active', isTap);
        this.tapDictBtn.setAttribute('aria-pressed', String(isTap));
      }
      if (this.epub) {
        const ratio = this.getChapterRatio();
        requestAnimationFrame(() => this.layoutChapter(ratio));
      }
    }

    getCurrentPageKey() {
      if (this.isScrollMode()) return `ch${this.chapterIndex}_scroll`;
      return `ch${this.chapterIndex}_p${this.currentPage}`;
    }

    notifyPageChanged() {
      if (!this.epub || !this.bookMeta) return;
      const chap = this.epub.spine[this.chapterIndex];
      this.cb.onPageChanged?.({
        bookId: this.bookMeta.id,
        pageKey: this.getCurrentPageKey(),
        meta: {
          chapterIndex: this.chapterIndex,
          chapterTitle: chap?.title || `Chương ${this.chapterIndex + 1}`,
          pageLabel: this.isScrollMode()
            ? 'Cuộn dọc'
            : `Trang ${this.currentPage + 1}/${this.totalPages}`,
          progressRatio: this.getChapterRatio(),
        },
      });
    }

    recordJumpPoint() {
      if (!this.epub) return;
      this.previousJumpPos = {
        chapterIndex: this.chapterIndex,
        ratio: this.getChapterRatio(),
      };
      this.undoJumpBtn?.classList.remove('hidden');
      clearTimeout(this._undoTimer);
      this._undoTimer = setTimeout(() => {
        this.undoJumpBtn?.classList.add('hidden');
      }, 8000);
    }

    async goToChapter(index, targetRatio = 0, fragmentId = '', turnDir = null) {
      if (!this.epub || this.isTransitioning) return;
      const clamped = Math.max(0, Math.min(this.epub.spine.length - 1, index));
      this.isTransitioning = true;
      try {
        this.clearSelection();
        if (this.contentZoom !== 1) this.resetContentZoom(false);
        this.chapterIndex = clamped;
        const chapter = await this.epub.loadChapter(clamped);
        if (!chapter) return;

        // Disable slide transition momentarily during chapter swap
        this.contentEl.classList.add('no-turn-anim');
        this.contentEl.innerHTML = chapter.html || '<p></p>';
        this.contentEl.style.transform = 'translate3d(0, 0, 0)';
        this.maskEl.scrollTop = 0;

        this.hudSubtitle.textContent = chapter.title;
        this.microChapterTitle.textContent = chapter.title;

        this.reRenderHighlights();

        const imgs = Array.from(this.contentEl.querySelectorAll('img'));
        if (imgs.length > 0) {
          await Promise.race([
            Promise.all(
              imgs.map((img) =>
                img.complete
                  ? Promise.resolve()
                  : new Promise((res) => {
                      img.onload = res;
                      img.onerror = res;
                    })
              )
            ),
            new Promise((res) => setTimeout(res, 600)),
          ]);
        }

        this.layoutChapter(targetRatio, fragmentId);
        requestAnimationFrame(() => this.contentEl.classList.remove('no-turn-anim'));
        if (turnDir) this.triggerTurnEffect(turnDir);
        this.persistProgress();
      } finally {
        this.isTransitioning = false;
      }
    }

    layoutChapter(targetRatio = 0, fragmentId = '') {
      if (!this.epub) return;
      const scroll = this.isScrollMode();

      if (scroll) {
        this.contentEl.style.removeProperty('--page-w');
        this.contentEl.style.removeProperty('--page-h');
        this.contentEl.style.removeProperty('--page-gap');
        this.contentEl.style.transform = 'none';
        this.totalPages = 1;
        this.currentPage = 0;

        if (fragmentId) {
          const anchor = this.contentEl.querySelector(`[id="${CSS.escape(fragmentId)}"]`);
          if (anchor) anchor.scrollIntoView({ behavior: 'auto', block: 'start' });
        } else {
          const maxScroll = Math.max(0, this.maskEl.scrollHeight - this.maskEl.clientHeight);
          this.maskEl.scrollTop = Math.round(maxScroll * Math.max(0, Math.min(1, targetRatio)));
        }
        this.updateProgressUI();
        this.notifyPageChanged();
        return;
      }

      const rect = this.maskEl.getBoundingClientRect();
      this.pageW = Math.max(200, Math.floor(this.maskEl.clientWidth || rect.width));
      this.pageH = Math.max(200, Math.floor(this.maskEl.clientHeight || rect.height));
      this.pageGap = 40;

      this.contentEl.classList.add('no-turn-anim');
      this.contentEl.style.transform = 'translate3d(0, 0, 0)';
      this.contentEl.style.setProperty('--page-w', `${this.pageW}px`);
      this.contentEl.style.setProperty('--page-h', `${this.pageH}px`);
      this.contentEl.style.setProperty('--page-gap', `${this.pageGap}px`);

      const stride = this.pageW + this.pageGap;
      const totalWidth = this.contentEl.scrollWidth;
      this.totalPages = Math.max(1, Math.round((totalWidth + this.pageGap) / stride));

      let targetPage = 0;
      if (fragmentId) {
        const anchor = this.contentEl.querySelector(`[id="${CSS.escape(fragmentId)}"]`);
        if (anchor) {
          const contentLeft = this.contentEl.getBoundingClientRect().left;
          const anchorLeft = anchor.getBoundingClientRect().left;
          const relOffset = Math.max(0, anchorLeft - contentLeft);
          targetPage = Math.max(0, Math.min(this.totalPages - 1, Math.floor(relOffset / stride)));
        }
      } else if (targetRatio === 'last') {
        targetPage = this.totalPages - 1;
      } else {
        targetPage = Math.max(
          0,
          Math.min(this.totalPages - 1, Math.floor(targetRatio * this.totalPages))
        );
      }

      this.currentPage = targetPage;
      this.contentEl.style.transform = `translate3d(${-this.currentPage * stride}px, 0, 0)`;
      requestAnimationFrame(() => this.contentEl.classList.remove('no-turn-anim'));
      this.updateProgressUI();
      this.notifyPageChanged();
    }

    // ==================== PHYSICAL DIRECTIONAL 3D 2-PAGE CURL & SMOOTH SLIDE ENGINE ====================
    beginInteractiveTurn(dir, effect, yRatio = 0.72) {
      if (!this.epub || this.isScrollMode()) return;
      this.cancelTurnSessionImmediate();

      const stride = this.pageW + this.pageGap;
      const canStepInChapter = dir === 'next' ? this.currentPage < this.totalPages - 1 : this.currentPage > 0;
      const hasNeighborChapter =
        dir === 'next' ? this.chapterIndex < this.epub.spine.length - 1 : this.chapterIndex > 0;
      const blocked = !canStepInChapter && !hasNeighborChapter;
      const targetPage = canStepInChapter ? (dir === 'next' ? this.currentPage + 1 : this.currentPage - 1) : null;

      const stageRect = this.stageEl.getBoundingClientRect();
      const stageW = Math.max(1, this.stageEl.clientWidth || stageRect.width);
      const stageH = Math.max(1, this.stageEl.clientHeight || stageRect.height);
      const extraTop = Math.round(stageH * 0.18);
      const tallH = stageH + extraTop * 2;

      this.turnSession = {
        dir,
        effect,
        canStepInChapter,
        hasNeighborChapter,
        blocked,
        origPage: this.currentPage,
        targetPage,
        stride,
        stageW,
        stageH,
        extraTop,
        tallH,
        yRatio: Math.max(0.12, Math.min(0.88, yRatio)),
        progress: 0,
        animating: false,
      };

      if (effect === 'slide') {
        this.contentEl.classList.add('no-turn-anim');
        return;
      }

      if (effect === 'curl' && this.curlStage && this.curlTopSheet) {
        const maskRect = this.maskEl.getBoundingClientRect();
        const padLeft = Math.max(0, this.maskEl.offsetLeft || maskRect.left - stageRect.left);
        const padTop = Math.max(0, this.maskEl.offsetTop || maskRect.top - stageRect.top);
        const maskW = Math.max(1, this.maskEl.clientWidth || maskRect.width);
        const maskH = Math.max(1, this.maskEl.clientHeight || maskRect.height);

        const buildPageMask = (pageIdx, boundaryText = '') => {
          const innerMask = document.createElement('div');
          innerMask.className = 'curl-page-mask';
          innerMask.style.left = `${padLeft}px`;
          innerMask.style.top = `${padTop}px`;
          innerMask.style.width = `${maskW}px`;
          innerMask.style.height = `${maskH}px`;

          if (pageIdx !== null) {
            const clone = this.contentEl.cloneNode(true);
            clone.removeAttribute('id');
            clone.classList.add('no-turn-anim');
            clone.style.setProperty('--page-w', `${this.pageW}px`);
            clone.style.setProperty('--page-h', `${this.pageH}px`);
            clone.style.setProperty('--page-gap', `${this.pageGap}px`);
            clone.style.transform = `translate3d(${-pageIdx * stride}px, 0, 0)`;
            innerMask.appendChild(clone);
          } else if (boundaryText) {
            const note = document.createElement('div');
            note.className = 'curl-boundary-hint';
            note.textContent = boundaryText;
            innerMask.appendChild(note);
          }
          return innerMask;
        };

        this.curlStage.classList.remove('dir-next', 'dir-prev', 'chapter-boundary');
        this.curlStage.classList.add(dir === 'next' ? 'dir-next' : 'dir-prev');

        let turningPageIdx = null;
        let boundaryLabel = '';

        if (dir === 'next') {
          // Right -> Left: Top sheet holds CURRENT page peeling away; underneath reveals NEXT page
          turningPageIdx = this.currentPage;
          if (canStepInChapter) {
            this.contentEl.classList.add('no-turn-anim');
            this.contentEl.style.transform = `translate3d(${-targetPage * stride}px, 0, 0)`;
            if (this.curlUnderVeil) this.curlUnderVeil.innerHTML = '';
          } else {
            this.curlStage.classList.add('chapter-boundary');
            if (this.curlUnderVeil) {
              this.curlUnderVeil.innerHTML = `<div class="curl-boundary-hint">${
                hasNeighborChapter ? 'Chương tiếp theo' : 'Cuối sách'
              }</div>`;
            }
          }
        } else {
          // Left -> Right: Underneath keeps CURRENT page; top sheet unfolds PREVIOUS page from left spine
          if (this.curlUnderVeil) this.curlUnderVeil.innerHTML = '';
          if (canStepInChapter) {
            turningPageIdx = targetPage;
          } else {
            boundaryLabel = hasNeighborChapter ? 'Chương trước' : 'Đầu sách';
          }
        }

        // Front side of turning sheet
        this.curlTopSheet.innerHTML = '';
        this.curlTopSheet.appendChild(buildPageMask(turningPageIdx, boundaryLabel));

        // Oversized rotated height prevents clipped corners at diagonal tilt angles
        const applyTallBox = (el) => {
          if (!el) return;
          el.style.top = `${-extraTop}px`;
          el.style.height = `${tallH}px`;
        };
        applyTallBox(this.curlFlap);
        applyTallBox(this.curlUnderShadow);
        applyTallBox(this.curlCreaseShade);

        // Mirrored ghost text on the reverse side of the 3D curled paper cylinder
        if (this.curlFlapMirror) {
          this.curlFlapMirror.innerHTML = '';
          this.curlFlapMirror.style.top = `${extraTop}px`;
          this.curlFlapMirror.style.width = `${stageW}px`;
          this.curlFlapMirror.style.height = `${stageH}px`;
          const mirrorInner = document.createElement('div');
          mirrorInner.className = 'curl-flap-mirror-inner';
          mirrorInner.appendChild(buildPageMask(turningPageIdx, boundaryLabel));
          this.curlFlapMirror.appendChild(mirrorInner);
        }

        this.curlStage.classList.remove('hidden');
        this.updateCurlProgress(0, this.turnSession.yRatio);
      }
    }

    updateCurlProgress(rawProgress, nextYRatio = null) {
      const s = this.turnSession;
      if (!s || s.effect !== 'curl' || !this.curlStage) return;

      if (typeof nextYRatio === 'number' && Number.isFinite(nextYRatio)) {
        const clampedY = Math.max(0.12, Math.min(0.88, nextYRatio));
        // Smooth vertical tilt response when dragging up/down
        s.yRatio = s.yRatio * 0.78 + clampedY * 0.22;
      }

      // Soft physical resistance at the very start/end of the book
      const p = s.blocked
        ? Math.min(0.14, rawProgress * 0.28)
        : Math.max(0, Math.min(1, rawProgress));
      s.progress = p;

      const W = s.stageW;
      const H = s.stageH;

      // Directional conical diagonal fold angle driven by vertical touch height & turn direction:
      // Right -> Left (next): lower thumb leans '/' (+deg), upper thumb leans '\' (-deg)
      // Left -> Right (prev): lower thumb leans '\' (-deg), upper thumb leans '/' (+deg)
      const maxSkew = Math.min(54, Math.max(24, W * 0.115));
      let skew;
      if (s.yRatio >= 0.48) {
        const mag = 0.55 + Math.min(1, (s.yRatio - 0.48) / 0.36) * 0.45;
        skew = s.dir === 'next' ? maxSkew * mag : -maxSkew * mag;
      } else {
        const mag = 0.45 + Math.min(1, (0.48 - s.yRatio) / 0.36) * 0.55;
        skew = s.dir === 'next' ? -maxSkew * mag : maxSkew * mag;
      }
      const absSkew = Math.abs(skew);
      const deg = (Math.atan2(2 * skew, H) * 180) / Math.PI;

      // Center X of the diagonal fold line at y = H / 2
      const cx =
        s.dir === 'next'
          ? (W + absSkew) * (1 - p) - absSkew * p
          : -absSkew * (1 - p) + (W + absSkew) * p;

      // Exact convex trapezoid clip for top flat page (zero self-intersection at all angles)
      const topX = cx + skew;
      const botX = cx - skew;
      this.curlTopSheet.style.clipPath = `polygon(-240px 0px, ${topX.toFixed(1)}px 0px, ${botX.toFixed(
        1
      )}px ${H.toFixed(1)}px, -240px ${H.toFixed(1)}px)`;

      // Physical 3D paper cylinder width & directional geometry
      const sinEnv = Math.sin(p * Math.PI);
      const arch = Math.pow(Math.sin(Math.min(1, p * 0.92 + 0.04) * Math.PI), 0.72);
      const baseFlap = Math.min(235, W * 0.37);

      if (s.dir === 'next') {
        // ---- RIGHT -> LEFT: Peeling right corner over toward the left spine ----
        const peeledDist = Math.max(0, W + absSkew - cx);
        const flapW = Math.max(0, Math.min(baseFlap * (0.28 + 0.72 * arch), peeledDist * 0.92));
        const fadeOut = p > 0.93 ? Math.max(0, (1 - p) / 0.07) : 1;

        if (this.curlFlap) {
          this.curlFlap.style.width = `${flapW.toFixed(1)}px`;
          this.curlFlap.style.transform = `translate3d(${(cx - flapW).toFixed(1)}px, 0, 0) rotate(${deg.toFixed(
            2
          )}deg)`;
          this.curlFlap.style.opacity = flapW > 1 ? fadeOut.toFixed(3) : '0';
        }
        if (this.curlFlapMirror) {
          // Aligns mirrored bleed-through words 1:1 across the right fold crease
          const mirrorShiftX = flapW + cx - W;
          this.curlFlapMirror.style.transform = `translate3d(${mirrorShiftX.toFixed(1)}px, 0, 0)`;
        }
        if (this.curlCreaseShade) {
          // Overhanging shadow cast to the LEFT onto the flat current page
          const creaseW = flapW + 46;
          this.curlCreaseShade.style.width = `${creaseW.toFixed(1)}px`;
          this.curlCreaseShade.style.transform = `translate3d(${(cx - creaseW).toFixed(
            1
          )}px, 0, 0) rotate(${deg.toFixed(2)}deg)`;
          this.curlCreaseShade.style.opacity = (sinEnv * 0.92).toFixed(3);
        }
        if (this.curlUnderShadow) {
          // Deep penumbra cast to the RIGHT onto the newly exposed next page
          const shadowW = 24 + arch * 94;
          this.curlUnderShadow.style.width = `${shadowW.toFixed(1)}px`;
          this.curlUnderShadow.style.transform = `translate3d(${(cx - 1).toFixed(1)}px, 0, 0) rotate(${deg.toFixed(
            2
          )}deg)`;
          this.curlUnderShadow.style.opacity = (sinEnv * 0.96).toFixed(3);
        }
        if (this.curlUnderVeil && !s.blocked && s.canStepInChapter) {
          this.curlUnderVeil.style.opacity = ((1 - p) * 0.85).toFixed(3);
        }
      } else {
        // ---- LEFT -> RIGHT: Unfolding previous page back across from the left spine ----
        const remainDist = Math.max(0, W + absSkew - cx);
        const enteredDist = Math.max(0, cx + absSkew);
        const flapW = Math.max(
          0,
          Math.min(baseFlap * (0.28 + 0.72 * arch), remainDist * 0.92, Math.max(24, enteredDist * 1.15 + 18))
        );
        const fadeIn = p < 0.05 ? Math.max(0, p / 0.05) : 1;

        if (this.curlFlap) {
          // Flap sits on the RIGHT of foldX — arched underside rolling left-to-right!
          this.curlFlap.style.width = `${flapW.toFixed(1)}px`;
          this.curlFlap.style.transform = `translate3d(${cx.toFixed(1)}px, 0, 0) rotate(${deg.toFixed(2)}deg)`;
          this.curlFlap.style.opacity = flapW > 1 ? fadeIn.toFixed(3) : '0';
        }
        if (this.curlFlapMirror) {
          // Aligns mirrored bleed-through words across the left fold crease as the sheet unrolls right
          const mirrorShiftX = cx - W;
          this.curlFlapMirror.style.transform = `translate3d(${mirrorShiftX.toFixed(1)}px, 0, 0)`;
        }
        if (this.curlCreaseShade) {
          // Subtle concave unfold valley just to the left of the crease on the incoming page
          const creaseW = 22 + arch * 36;
          this.curlCreaseShade.style.width = `${creaseW.toFixed(1)}px`;
          this.curlCreaseShade.style.transform = `translate3d(${(cx - creaseW + 1).toFixed(
            1
          )}px, 0, 0) rotate(${deg.toFixed(2)}deg)`;
          this.curlCreaseShade.style.opacity = (sinEnv * 0.74).toFixed(3);
        }
        if (this.curlUnderShadow) {
          // Long directional shadow cast AHEAD to the RIGHT of the rolling cylinder onto current page
          const shadowW = 26 + arch * 98;
          this.curlUnderShadow.style.width = `${shadowW.toFixed(1)}px`;
          this.curlUnderShadow.style.transform = `translate3d(${cx.toFixed(1)}px, 0, 0) rotate(${deg.toFixed(
            2
          )}deg) translate3d(${Math.max(0, flapW - 3).toFixed(1)}px, 0, 0)`;
          this.curlUnderShadow.style.opacity = (sinEnv * 0.92 * fadeIn).toFixed(3);
        }
        if (this.curlUnderVeil) {
          this.curlUnderVeil.style.opacity = (p * 0.65).toFixed(3);
        }
      }
    }

    updateSlideDrag(dx) {
      const s = this.turnSession;
      if (!s || s.effect !== 'slide') return;
      const base = -s.origPage * s.stride;
      const dampedDx = s.canStepInChapter ? dx : dx * 0.32;
      this.contentEl.style.transform = `translate3d(${(base + dampedDx).toFixed(1)}px, 0, 0)`;
      s.progress = Math.max(0, Math.min(1, (s.dir === 'next' ? -dx : dx) / s.stageW));
    }

    endInteractiveTurn(shouldCommit, absVelocity = 0) {
      const s = this.turnSession;
      if (!s) return;

      const commit = Boolean(shouldCommit && !s.blocked);
      if (s.blocked && shouldCommit) {
        this.cb.toast(s.dir === 'next' ? 'Bạn đã đọc đến trang cuối của cuốn sách!' : 'Đang ở trang đầu tiên');
      }

      if (s.effect === 'slide') {
        this.contentEl.classList.remove('no-turn-anim');
        void this.contentEl.offsetWidth;
        if (commit && s.canStepInChapter) {
          this.currentPage = s.targetPage;
          this.contentEl.style.transform = `translate3d(${-this.currentPage * s.stride}px, 0, 0)`;
          this.turnSession = null;
          this.updateProgressUI();
          this.notifyPageChanged();
          this.persistProgress();
          this.cb.onReadingActivity?.({ minutesDelta: 0, pagesDelta: 1 });
        } else if (commit && s.hasNeighborChapter) {
          this.turnSession = null;
          if (s.dir === 'next') this.goToChapter(this.chapterIndex + 1, 0, '', 'next');
          else this.goToChapter(this.chapterIndex - 1, 'last', '', 'prev');
          this.cb.onReadingActivity?.({ minutesDelta: 0, pagesDelta: 1 });
        } else {
          // Spring back smoothly to original page
          this.contentEl.style.transform = `translate3d(${-s.origPage * s.stride}px, 0, 0)`;
          this.turnSession = null;
        }
        return;
      }

      if (s.effect === 'curl') {
        const fromP = s.progress;
        const toP = commit ? 1 : 0;
        const dist = Math.abs(toP - fromP);
        // Unhurried, tactile paper completion: slightly quicker on flicks, never jerky
        const velFactor = 1 + Math.min(0.28, Math.max(0, (absVelocity - 0.35) * 0.3));
        const duration = Math.max(320, Math.min(720, Math.round((dist * 720) / velFactor)));
        this.animateCurlTween(fromP, toP, duration, commit, 'release');
      }
    }

    animateCurlTween(fromP, toP, duration, commit, curve = 'auto') {
      const s = this.turnSession;
      if (!s) return;
      s.animating = true;
      s.pendingCommit = commit;
      const startTime = performance.now();

      const step = (now) => {
        if (!this.turnSession) return;
        const t = Math.min(1, (now - startTime) / Math.max(1, duration));
        // 'auto' tap turn uses an organic lift-glide-settle paper S-curve;
        // 'release' drag turn uses smooth velocity-matched quartic deceleration
        const eased =
          curve === 'auto'
            ? solveCubicBezier(0.32, 0.05, 0.2, 1.0, t)
            : 1 - Math.pow(1 - t, 3.2);
        const curP = fromP + (toP - fromP) * eased;
        this.updateCurlProgress(curP);

        if (t < 1) {
          this.curlRafId = requestAnimationFrame(step);
        } else {
          this.curlRafId = null;
          this.finalizeCurlSession(commit);
        }
      };

      cancelAnimationFrame(this.curlRafId);
      this.curlRafId = requestAnimationFrame(step);
    }

    finalizeCurlSession(commit) {
      const s = this.turnSession;
      this.turnSession = null;
      if (!s) return;

      if (commit && s.canStepInChapter) {
        this.currentPage = s.targetPage;
        this.contentEl.classList.add('no-turn-anim');
        this.contentEl.style.transform = `translate3d(${-this.currentPage * s.stride}px, 0, 0)`;
        this.cleanupCurlDOM();
        requestAnimationFrame(() => this.contentEl.classList.remove('no-turn-anim'));
        this.updateProgressUI();
        this.notifyPageChanged();
        this.persistProgress();
        this.cb.onReadingActivity?.({ minutesDelta: 0, pagesDelta: 1 });
      } else if (commit && s.hasNeighborChapter) {
        this.cleanupCurlDOM();
        if (s.dir === 'next') this.goToChapter(this.chapterIndex + 1, 0, '', 'next');
        else this.goToChapter(this.chapterIndex - 1, 'last', '', 'prev');
        this.cb.onReadingActivity?.({ minutesDelta: 0, pagesDelta: 1 });
      } else {
        // Restore original page cleanly
        this.contentEl.classList.add('no-turn-anim');
        this.contentEl.style.transform = `translate3d(${-s.origPage * s.stride}px, 0, 0)`;
        this.cleanupCurlDOM();
        requestAnimationFrame(() => this.contentEl.classList.remove('no-turn-anim'));
      }
    }

    cleanupCurlDOM() {
      if (this.curlStage) {
        this.curlStage.classList.add('hidden');
        this.curlStage.classList.remove('chapter-boundary', 'dir-next', 'dir-prev');
      }
      if (this.curlTopSheet) {
        this.curlTopSheet.innerHTML = '';
        this.curlTopSheet.style.clipPath = '';
      }
      if (this.curlFlapMirror) {
        this.curlFlapMirror.innerHTML = '';
        this.curlFlapMirror.style.transform = '';
      }
      if (this.curlFlap) {
        this.curlFlap.style.width = '0px';
        this.curlFlap.style.opacity = '0';
        this.curlFlap.style.transform = '';
      }
      if (this.curlCreaseShade) {
        this.curlCreaseShade.style.width = '0px';
        this.curlCreaseShade.style.opacity = '0';
        this.curlCreaseShade.style.transform = '';
      }
      if (this.curlUnderShadow) {
        this.curlUnderShadow.style.width = '0px';
        this.curlUnderShadow.style.opacity = '0';
        this.curlUnderShadow.style.transform = '';
      }
      if (this.curlUnderVeil) {
        this.curlUnderVeil.innerHTML = '';
        this.curlUnderVeil.style.opacity = '0';
      }
    }

    forceCompleteTurnSession() {
      cancelAnimationFrame(this.curlRafId);
      this.curlRafId = null;
      if (!this.turnSession) return;
      if (this.turnSession.effect === 'curl') {
        this.finalizeCurlSession(Boolean(this.turnSession.pendingCommit));
      } else {
        this.turnSession = null;
      }
    }

    cancelTurnSessionImmediate() {
      cancelAnimationFrame(this.curlRafId);
      this.curlRafId = null;
      const s = this.turnSession;
      this.turnSession = null;
      if (s && s.effect === 'curl') {
        this.contentEl.classList.add('no-turn-anim');
        this.contentEl.style.transform = `translate3d(${-s.origPage * s.stride}px, 0, 0)`;
        this.cleanupCurlDOM();
        requestAnimationFrame(() => this.contentEl.classList.remove('no-turn-anim'));
      } else {
        this.cleanupCurlDOM();
      }
    }

    animateAutoCurl(dir, yRatio = 0.72) {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        return false;
      }
      this.beginInteractiveTurn(dir, 'curl', yRatio);
      if (!this.turnSession || this.turnSession.blocked) {
        this.cancelTurnSessionImmediate();
        return false;
      }
      // Graceful, realistic 780ms physical paper turn with organic lift & settle
      this.animateCurlTween(0, 1, 780, true, 'auto');
      return true;
    }

    goToPage(pageIdx, withEffect = true, turnDir = 'next') {
      if (!this.epub || this.isScrollMode()) return;
      if (this.contentZoom !== 1) this.resetContentZoom(false);
      const clamped = Math.max(0, Math.min(this.totalPages - 1, pageIdx));
      this.currentPage = clamped;
      const stride = this.pageW + this.pageGap;
      this.contentEl.style.transform = `translate3d(${-this.currentPage * stride}px, 0, 0)`;
      if (withEffect) this.triggerTurnEffect(turnDir);
      this.updateProgressUI();
      this.notifyPageChanged();
      this.persistProgress();
    }

    nextPage(yRatio = 0.72) {
      if (!this.epub || this.isScrollMode()) return;
      if (this.turnSession?.animating) this.forceCompleteTurnSession();
      const eff = this.getTurnEffect();

      if (this.currentPage < this.totalPages - 1) {
        if (eff === 'curl' && this.animateAutoCurl('next', yRatio)) return;
        this.goToPage(this.currentPage + 1, true, 'next');
        this.cb.onReadingActivity?.({ minutesDelta: 0, pagesDelta: 1 });
      } else if (this.chapterIndex < this.epub.spine.length - 1) {
        if (eff === 'curl' && this.animateAutoCurl('next', yRatio)) return;
        this.goToChapter(this.chapterIndex + 1, 0, '', 'next');
        this.cb.onReadingActivity?.({ minutesDelta: 0, pagesDelta: 1 });
      } else {
        this.cb.toast('Bạn đã đọc đến trang cuối của cuốn sách!');
      }
    }

    prevPage(yRatio = 0.72) {
      if (!this.epub || this.isScrollMode()) return;
      if (this.turnSession?.animating) this.forceCompleteTurnSession();
      const eff = this.getTurnEffect();

      if (this.currentPage > 0) {
        if (eff === 'curl' && this.animateAutoCurl('prev', yRatio)) return;
        this.goToPage(this.currentPage - 1, true, 'prev');
        this.cb.onReadingActivity?.({ minutesDelta: 0, pagesDelta: 1 });
      } else if (this.chapterIndex > 0) {
        if (eff === 'curl' && this.animateAutoCurl('prev', yRatio)) return;
        this.goToChapter(this.chapterIndex - 1, 'last', '', 'prev');
        this.cb.onReadingActivity?.({ minutesDelta: 0, pagesDelta: 1 });
      } else {
        this.cb.toast('Đang ở trang đầu tiên');
      }
    }

    triggerTurnEffect(dir = 'next') {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      const effect = this.getTurnEffect();

      if (effect === 'eink' && this.flashEl) {
        this.flashEl.classList.remove('active');
        void this.flashEl.offsetWidth;
        this.flashEl.classList.add('active');
      }
    }

    getChapterRatio() {
      if (!this.epub) return 0;
      if (this.isScrollMode()) {
        const maxScroll = Math.max(1, this.maskEl.scrollHeight - this.maskEl.clientHeight);
        return Math.max(0, Math.min(1, this.maskEl.scrollTop / maxScroll));
      }
      if (this.totalPages <= 1) return 0;
      return this.currentPage / this.totalPages;
    }

    updateProgressUI() {
      if (!this.epub) return;
      const ratio = this.getChapterRatio();
      const bookPct = this.epub.getBookPercent(this.chapterIndex, ratio);
      const minsLeft = this.epub.getEstimatedMinutesLeft(this.chapterIndex, ratio);

      if (this.isScrollMode()) {
        this.microPageInfo.textContent = `Chương ${this.chapterIndex + 1} / ${this.epub.spine.length}`;
      } else {
        this.microPageInfo.textContent = `Trang ${this.currentPage + 1} / ${this.totalPages}`;
      }
      this.microProgressInfo.textContent = `${bookPct.toFixed(1)}% · ${formatMinutes(minsLeft)}`;
      this.progressLineFill.style.width = `${bookPct.toFixed(2)}%`;
      if (this.progressPillFill) this.progressPillFill.style.width = `${bookPct.toFixed(2)}%`;
      if (this.progressPillPct) this.progressPillPct.textContent = `${Math.round(bookPct)}%`;

      this.updateScrubber();
      this.updateBookmarkIndicator();
    }

    updateScrubber() {
      if (!this.epub || !this.scrubber) return;
      if (this.isScrollMode()) {
        const pct = Math.round(this.getChapterRatio() * 100);
        this.scrubber.min = '0';
        this.scrubber.max = '100';
        this.scrubber.value = String(pct);
        this.scrubberLabel.textContent = `${pct}% chương này`;
      } else {
        this.scrubber.min = '0';
        this.scrubber.max = String(Math.max(0, this.totalPages - 1));
        this.scrubber.value = String(this.currentPage);
        this.scrubberLabel.textContent = `Trang ${this.currentPage + 1} / ${this.totalPages}`;
      }
    }

    getCurrentVisibleSnippet() {
      const text = (this.contentEl.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return '';
      const approxIdx = Math.floor(text.length * this.getChapterRatio());
      return text.slice(approxIdx, approxIdx + 95).trim();
    }

    persistProgress() {
      if (!this.epub || !this.bookMeta) return;
      const ratio = this.getChapterRatio();
      const bookPct = this.epub.getBookPercent(this.chapterIndex, ratio);
      const minsLeft = this.epub.getEstimatedMinutesLeft(this.chapterIndex, ratio);
      const chap = this.epub.spine[this.chapterIndex];
      this.cb.saveProgress(this.bookMeta.id, {
        chapterIndex: this.chapterIndex,
        totalChapters: this.epub.spine.length,
        chapterTitle: chap?.title || `Chương ${this.chapterIndex + 1}`,
        progressRatio: ratio,
        bookPercent: Number(bookPct.toFixed(2)),
        estimatedMinsLeft: minsLeft,
        snippet: this.getCurrentVisibleSnippet(),
        updatedAt: Date.now(),
      });
    }

    // ---- Bookmarks ----
    findMatchingBookmark() {
      if (!this.bookMeta) return null;
      const list = this.cb.getBookmarks(this.bookMeta.id);
      const ratio = this.getChapterRatio();
      const threshold = this.isScrollMode() ? 0.04 : Math.max(0.03, 0.85 / Math.max(1, this.totalPages));
      return list.find(
        (b) => b.chapterIndex === this.chapterIndex && Math.abs((b.progressRatio || 0) - ratio) <= threshold
      );
    }

    updateBookmarkIndicator() {
      const matched = this.findMatchingBookmark();
      const isBm = Boolean(matched);
      this.dogEarEl?.classList.toggle('active', isBm);
      if (this.bookmarkBtn) {
        this.bookmarkBtn.classList.toggle('active', isBm);
        this.bookmarkBtn.setAttribute('aria-pressed', String(isBm));
      }
    }

    toggleBookmarkAtCurrent() {
      if (!this.epub || !this.bookMeta) return;
      const existing = this.findMatchingBookmark();
      if (existing) {
        this.cb.deleteBookmark(this.bookMeta.id, existing.id);
        this.cb.toast('Đã gỡ dấu trang');
      } else {
        const chap = this.epub.spine[this.chapterIndex];
        this.cb.addBookmark(this.bookMeta.id, {
          id: uid('bm'),
          chapterIndex: this.chapterIndex,
          chapterTitle: chap?.title || `Chương ${this.chapterIndex + 1}`,
          progressRatio: this.getChapterRatio(),
          pageLabel: this.isScrollMode()
            ? `${Math.round(this.getChapterRatio() * 100)}%`
            : `Trang ${this.currentPage + 1}/${this.totalPages}`,
          snippet: this.getCurrentVisibleSnippet(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        this.cb.toast('Đã đánh dấu trang này');
      }
      this.updateBookmarkIndicator();
    }

    // ---- Selection, Single-Word Lookup Gesture & Highlights ----
    extractSingleLookupWord(rawText) {
      const cleaned = String(rawText || '')
        .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
        .trim();
      if (!cleaned || cleaned.length < 2 || cleaned.length > 40) return null;
      if (/\s/.test(cleaned)) return null;
      if (!/^[\p{L}\p{M}'’-]+$/u.test(cleaned)) return null;
      return cleaned;
    }

    maybeAutoLookupSingleSelectedWord() {
      if (!this.pendingSelection || !this.epub || this.viewEl.classList.contains('hidden')) return;
      const word = this.extractSingleLookupWord(this.pendingSelection.text);
      if (!word) return;

      const sig = `${this.chapterIndex}:${(this.pendingSelection.prefix || '').slice(-12)}:${word.toLowerCase()}`;
      if (this._lastAutoLookupSig === sig) return;
      this._lastAutoLookupSig = sig;

      // Hide bottom selection bar so Dictionary sheet appears cleanly without overlapping bars
      this.selBar?.classList.remove('open');
      this.cb.openDictionary({
        query: word,
        context: this.pendingSelection.context,
        bookId: this.bookMeta?.id || '',
        bookTitle: this.bookMeta?.title || '',
      });
    }

    onSelectionChange(immediateLookup = false) {
      clearTimeout(this._singleWordSettleTimer);
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        this.pendingSelection = null;
        this._lastAutoLookupSig = '';
        this.selBar?.classList.remove('open');
        return;
      }
      const range = sel.getRangeAt(0);
      if (!this.contentEl.contains(range.commonAncestorContainer)) {
        this.pendingSelection = null;
        this._lastAutoLookupSig = '';
        this.selBar?.classList.remove('open');
        return;
      }
      const text = sel.toString().replace(/\s+/g, ' ').trim();
      if (!text) {
        this.pendingSelection = null;
        this._lastAutoLookupSig = '';
        this.selBar?.classList.remove('open');
        return;
      }

      // Compute prefix & suffix in full chapter plain text for rock-solid highlight re-anchoring
      const preRange = document.createRange();
      preRange.selectNodeContents(this.contentEl);
      preRange.setEnd(range.startContainer, range.startOffset);
      const beforeText = preRange.toString();

      const postRange = document.createRange();
      postRange.selectNodeContents(this.contentEl);
      postRange.setStart(range.endContainer, range.endOffset);
      const afterText = postRange.toString();

      const prefix = beforeText.slice(-36);
      const suffix = afterText.slice(0, 36);
      const context = `${beforeText.slice(-70)}${text}${afterText.slice(0, 70)}`
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 220);

      this.pendingSelection = { text, prefix, suffix, context };

      const singleWord = this.extractSingleLookupWord(text);
      if (singleWord && (immediateLookup || !this._selectPointerDown)) {
        this.maybeAutoLookupSingleSelectedWord();
        return;
      }

      this.selBar?.classList.add('open');

      // Also support native mobile long-press word selection while finger rests briefly on the word
      if (singleWord) {
        this._singleWordSettleTimer = setTimeout(() => {
          this.maybeAutoLookupSingleSelectedWord();
        }, 420);
      }
    }

    clearSelection() {
      clearTimeout(this._singleWordSettleTimer);
      this.pendingSelection = null;
      this._lastAutoLookupSig = '';
      this.selBar?.classList.remove('open');
      try {
        window.getSelection()?.removeAllRanges();
      } catch (_) {}
    }

    createHighlightFromSelection(color, openNoteModal) {
      if (!this.pendingSelection || !this.bookMeta || !this.epub) return;
      const chap = this.epub.spine[this.chapterIndex];
      const hl = {
        id: uid('hl'),
        chapterIndex: this.chapterIndex,
        chapterTitle: chap?.title || `Chương ${this.chapterIndex + 1}`,
        progressRatio: this.getChapterRatio(),
        text: this.pendingSelection.text,
        prefix: this.pendingSelection.prefix,
        suffix: this.pendingSelection.suffix,
        color,
        note: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.cb.addHighlight(this.bookMeta.id, hl);
      this.clearSelection();
      this.reRenderHighlights();
      if (openNoteModal) {
        this.openHighlightModal(hl.id);
      } else {
        this.cb.toast('Đã highlight đoạn văn');
      }
    }

    reRenderHighlights() {
      if (!this.bookMeta || !this.contentEl) return;
      // Unwrap existing <mark class="pi-hl"> first
      const existingMarks = Array.from(this.contentEl.querySelectorAll('mark.pi-hl'));
      for (const m of existingMarks) {
        const parent = m.parentNode;
        while (m.firstChild) parent.insertBefore(m.firstChild, m);
        parent.removeChild(m);
        parent.normalize();
      }

      const highlights = this.cb
        .getHighlights(this.bookMeta.id)
        .filter((h) => h.chapterIndex === this.chapterIndex);
      if (!highlights.length) return;

      for (const hl of highlights) {
        this.wrapQuoteInDom(hl);
      }
    }

    wrapQuoteInDom(hl) {
      if (!hl || !hl.text) return;
      // Build flat text map of all text nodes inside contentEl
      const walker = document.createTreeWalker(this.contentEl, NodeFilter.SHOW_TEXT, null);
      const nodes = [];
      let full = '';
      let n;
      while ((n = walker.nextNode())) {
        if (!n.nodeValue) continue;
        nodes.push({ node: n, start: full.length, end: full.length + n.nodeValue.length });
        full += n.nodeValue;
      }

      // Match with prefix/suffix context first, fallback to exact match
      let matchIdx = -1;
      const target = hl.text;
      if (hl.prefix) {
        const needle = hl.prefix.slice(-16) + target;
        const idx = full.indexOf(needle);
        if (idx !== -1) matchIdx = idx + hl.prefix.slice(-16).length;
      }
      if (matchIdx === -1 && hl.suffix) {
        const needle = target + hl.suffix.slice(0, 16);
        const idx = full.indexOf(needle);
        if (idx !== -1) matchIdx = idx;
      }
      if (matchIdx === -1) {
        matchIdx = full.indexOf(target);
      }
      if (matchIdx === -1) return;

      const matchEnd = matchIdx + target.length;

      // Wrap overlapping text nodes cleanly (reverse order so node splits don't shift indices)
      const affected = nodes.filter((it) => it.end > matchIdx && it.start < matchEnd);
      for (let i = affected.length - 1; i >= 0; i--) {
        const it = affected[i];
        const localStart = Math.max(0, matchIdx - it.start);
        const localEnd = Math.min(it.node.nodeValue.length, matchEnd - it.start);
        if (localEnd <= localStart) continue;

        let targetNode = it.node;
        if (localEnd < targetNode.nodeValue.length) {
          targetNode.splitText(localEnd);
        }
        if (localStart > 0) {
          targetNode = targetNode.splitText(localStart);
        }

        const mark = document.createElement('mark');
        mark.className = `pi-hl pi-hl-${hl.color || 'sepia'}${hl.note ? ' has-note' : ''}`;
        mark.dataset.hlId = hl.id;
        targetNode.parentNode.insertBefore(mark, targetNode);
        mark.appendChild(targetNode);
      }
    }

    getActiveHighlight() {
      if (!this.bookMeta || !this.activeHighlightId) return null;
      return (
        this.cb.getHighlights(this.bookMeta.id).find((h) => h.id === this.activeHighlightId) || null
      );
    }

    syncHighlightModalColors(activeColor) {
      document.querySelectorAll('.hl-edit-color').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.color === activeColor);
      });
    }

    openHighlightModal(hlId) {
      this.activeHighlightId = hlId;
      const hl = this.getActiveHighlight();
      if (!hl) return;
      this.hlQuoteEl.textContent = `“${hl.text}”`;
      this.hlNoteInput.value = hl.note || '';
      this.syncHighlightModalColors(hl.color || 'sepia');
      this.hlBackdrop?.classList.add('open');
      this.hlModal?.classList.add('open');
    }

    closeHighlightModal() {
      this.activeHighlightId = null;
      this.hlBackdrop?.classList.remove('open');
      this.hlModal?.classList.remove('open');
    }
  }

  window.PaperInkReader = PaperInkReader;
})();
