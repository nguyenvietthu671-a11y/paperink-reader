(function () {
  class PaperInkP2P {
    constructor(app) {
      this.app = app;
      this.peer = null;
      this.peerId = null;
      this.connections = new Map(); // peerId -> DataConnection
      this.activeHostConn = null; // DataConnection to host when acting as client
      this.isHost = false;
      this.isClient = false;
      this.pendingBookRequests = new Map(); // bookId -> { resolve, reject, timer }
      this.batchSyncActive = false;
    }

    isSupported() {
      return typeof window.RTCPeerConnection !== 'undefined';
    }

    async ensurePeerLib() {
      if (typeof window.Peer !== 'undefined') return true;
      return new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = './vendor/peerjs.min.js';
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
      });
    }

    cleanPeerId(raw) {
      return String(raw || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
    }

    // --- HOST ROLE (Usually PC) ---
    async startHost(customCode = null) {
      const ok = await this.ensurePeerLib();
      if (!ok || typeof window.Peer === 'undefined') {
        this.app.toast('Trình duyệt không hỗ trợ WebRTC P2P');
        return null;
      }

      if (this.peer && !this.peer.destroyed) {
        this.peer.destroy();
      }

      const roomCode = customCode ? this.cleanPeerId(customCode) : `ink-${Math.random().toString(36).slice(2, 8)}`;
      const peerId = `paperink-${roomCode}`;

      return new Promise((resolve) => {
        const p = new window.Peer(peerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          },
        });

        p.on('open', (id) => {
          this.peer = p;
          this.peerId = id;
          this.isHost = true;
          this.isClient = false;
          console.log('[PaperInk P2P] Host opened with ID:', id);
          this.setupHostListeners();
          resolve({ peerId: id, roomCode });
        });

        p.on('error', (err) => {
          console.warn('[PaperInk P2P] Host error:', err);
          if (err.type === 'unavailable-id') {
            // Retry with random suffix
            resolve(this.startHost());
          } else {
            this.app.toast('Lỗi tạo phòng P2P: ' + (err.message || err.type));
            resolve(null);
          }
        });
      });
    }

    setupHostListeners() {
      if (!this.peer) return;
      this.peer.on('connection', (conn) => {
        console.log('[PaperInk P2P] Client connecting:', conn.peer);
        conn.on('open', () => {
          this.connections.set(conn.peer, conn);
          this.app.toast('Đã kết nối trực tiếp với điện thoại!');
          this.updateUiStatus();

          // 1. Send all books catalog
          const allBooks = this.app.getMergedBooks();
          const catalog = allBooks.map((b) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            series: b.series || '',
            seriesIndex: b.seriesIndex ?? null,
            genres: Array.isArray(b.genres) ? b.genres : [],
            tags: Array.isArray(b.tags) ? b.tags : [],
            description: b.description || '',
            language: b.language || 'en',
            fileName: b.fileName || '',
            size: b.size || 0,
            hasCover: Boolean(b.coverUrl || b.hasCover),
          }));

          conn.send({
            type: 'CATALOG',
            books: catalog,
            totalCount: catalog.length,
          });

          // 2. Send state (progress, highlights, bookmarks, inkNotes, seriesMeta)
          conn.send({
            type: 'STATE_SYNC',
            state: this.app.state,
          });
        });

        conn.on('data', async (data) => {
          await this.handleHostIncomingData(conn, data);
        });

        conn.on('close', () => {
          this.connections.delete(conn.peer);
          this.updateUiStatus();
        });

        conn.on('error', (err) => {
          console.warn('[PaperInk P2P] Conn error:', err);
          this.connections.delete(conn.peer);
          this.updateUiStatus();
        });
      });
    }

    async handleHostIncomingData(conn, data) {
      if (!data || typeof data !== 'object') return;

      if (data.type === 'STATE_SYNC' && data.state) {
        this.app.mergeIncomingState(data.state);
        await window.PaperInkDB.setKV('state', this.app.state);
        this.app.applySettingsToDOM();
        this.app.scheduleSync();
        this.app.renderCurrentRoute();
        return;
      }

      if (data.type === 'REQUEST_BOOK' && data.bookId) {
        const bookId = data.bookId;
        console.log('[PaperInk P2P] Client requested book:', bookId);
        try {
          let blob = null;
          // Check offline DB first
          const off = await window.PaperInkDB.getOfflineBook(bookId);
          if (off && off.epubBlob) {
            blob = off.epubBlob;
          } else if (this.app.isOnlineToServer) {
            const res = await fetch(this.app.apiUrl(`/api/books/${encodeURIComponent(bookId)}/file`));
            if (res.ok) blob = await res.blob();
          }

          if (blob) {
            const buf = await blob.arrayBuffer();
            conn.send({
              type: 'BOOK_FILE',
              bookId,
              fileName: data.fileName || `${bookId}.epub`,
              buffer: buf,
              size: buf.byteLength,
            });
          } else {
            conn.send({ type: 'BOOK_FILE_ERROR', bookId, error: 'Book not found on PC' });
          }
        } catch (err) {
          conn.send({ type: 'BOOK_FILE_ERROR', bookId, error: err.message });
        }
        return;
      }

      if (data.type === 'REQUEST_ALL_BOOKS') {
        const allBooks = this.app.getMergedBooks();
        console.log(`[PaperInk P2P] Starting batch transfer of ${allBooks.length} books...`);
        conn.send({ type: 'BATCH_START', total: allBooks.length });

        for (let i = 0; i < allBooks.length; i++) {
          const b = allBooks[i];
          try {
            let blob = null;
            const off = await window.PaperInkDB.getOfflineBook(b.id);
            if (off && off.epubBlob) {
              blob = off.epubBlob;
            } else if (this.app.isOnlineToServer) {
              const res = await fetch(this.app.apiUrl(`/api/books/${encodeURIComponent(b.id)}/file`));
              if (res.ok) blob = await res.blob();
            }

            if (blob) {
              const buf = await blob.arrayBuffer();
              conn.send({
                type: 'BATCH_ITEM',
                index: i + 1,
                total: allBooks.length,
                bookId: b.id,
                title: b.title,
                fileName: b.fileName || `${b.id}.epub`,
                buffer: buf,
              });
            }
          } catch (err) {
            console.warn('[PaperInk P2P] Failed to send book in batch:', b.title, err);
          }
        }

        conn.send({ type: 'BATCH_COMPLETE', total: allBooks.length });
        return;
      }
    }

    // --- CLIENT ROLE (Usually Phone) ---
    async connectToHost(rawTarget) {
      const ok = await this.ensurePeerLib();
      if (!ok || typeof window.Peer === 'undefined') {
        this.app.toast('Trình duyệt không hỗ trợ WebRTC P2P');
        return false;
      }

      let targetId = this.cleanPeerId(rawTarget);
      if (!targetId.startsWith('paperink-')) {
        targetId = `paperink-${targetId}`;
      }

      if (this.peer && !this.peer.destroyed) {
        this.peer.destroy();
      }

      this.app.toast('Đang kết nối P2P tới Máy tính…');

      return new Promise((resolve) => {
        const clientPeerId = `paperink-client-${Math.random().toString(36).slice(2, 8)}`;
        const p = new window.Peer(clientPeerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          },
        });

        p.on('open', () => {
          this.peer = p;
          this.isHost = false;
          this.isClient = true;

          const conn = p.connect(targetId, { reliable: true });
          this.activeHostConn = conn;

          conn.on('open', () => {
            console.log('[PaperInk P2P] Connected to host PC successfully!');
            this.app.toast('Đã kết nối thành công với Máy tính qua P2P!');
            this.updateUiStatus();
            resolve(true);
          });

          conn.on('data', async (data) => {
            await this.handleClientIncomingData(conn, data);
          });

          conn.on('close', () => {
            console.log('[PaperInk P2P] Host disconnected');
            this.activeHostConn = null;
            this.updateUiStatus();
          });

          conn.on('error', (err) => {
            console.warn('[PaperInk P2P] Connection error:', err);
            this.app.toast('Không thể kết nối máy tính (kiểm tra mã kết nối)');
            resolve(false);
          });
        });

        p.on('error', (err) => {
          console.warn('[PaperInk P2P] Client peer error:', err);
          this.app.toast('Lỗi P2P: ' + (err.message || err.type));
          resolve(false);
        });

        setTimeout(() => {
          if (!this.activeHostConn || !this.activeHostConn.open) {
            resolve(false);
          }
        }, 12000);
      });
    }

    async handleClientIncomingData(conn, data) {
      if (!data || typeof data !== 'object') return;

      // 1. Catalog received: all books from PC are now visible on Phone!
      if (data.type === 'CATALOG' && Array.isArray(data.books)) {
        console.log(`[PaperInk P2P] Received catalog with ${data.books.length} books from PC!`);
        this.app.serverBooks = data.books.map((b) => ({
          ...b,
          isP2P: true,
          coverUrl: null, // Covers will render cleanly via SVG / title fallbacks or offline cache
        }));
        this.app.isOnlineToServer = true;
        this.app.knownServerBookIds = new Set(data.books.map((b) => b.id));
        await window.PaperInkDB.setKV('libraryCatalog', this.app.serverBooks).catch(() => {});
        this.app.renderCurrentRoute();
        this.app.updateSyncStatusUI();
        this.app.toast(`Đã đồng bộ danh mục ${data.books.length} cuốn sách từ Máy tính!`);
        return;
      }

      // 2. State sync: progress, bookmarks, notes, S Pen handwriting
      if (data.type === 'STATE_SYNC' && data.state) {
        this.app.mergeIncomingState(data.state);
        await window.PaperInkDB.setKV('state', this.app.state);
        this.app.applySettingsToDOM();
        this.app.renderCurrentRoute();
        return;
      }

      // 3. Single book file arrived
      if (data.type === 'BOOK_FILE' && data.bookId && data.buffer) {
        const req = this.pendingBookRequests.get(data.bookId);
        const epubBlob = new Blob([data.buffer], { type: 'application/epub+zip' });
        if (req) {
          clearTimeout(req.timer);
          this.pendingBookRequests.delete(data.bookId);
          req.resolve(epubBlob);
        }
        return;
      }

      if (data.type === 'BOOK_FILE_ERROR' && data.bookId) {
        const req = this.pendingBookRequests.get(data.bookId);
        if (req) {
          clearTimeout(req.timer);
          this.pendingBookRequests.delete(data.bookId);
          req.reject(new Error(data.error || 'Failed to download book'));
        }
        return;
      }

      // 4. Batch items arrived
      if (data.type === 'BATCH_START') {
        this.batchSyncActive = true;
        this.app.toast(`Bắt đầu đồng bộ ${data.total} cuốn sách từ máy tính…`);
        this.updateBatchProgressUi(0, data.total, '');
        return;
      }

      if (data.type === 'BATCH_ITEM' && data.buffer) {
        const epubBlob = new Blob([data.buffer], { type: 'application/epub+zip' });
        const existing = this.app.serverBooks.find((b) => b.id === data.bookId);
        const rec = {
          id: data.bookId,
          title: data.title || existing?.title || 'Untitled',
          author: existing?.author || 'Unknown Author',
          series: existing?.series || '',
          seriesIndex: existing?.seriesIndex ?? null,
          genres: existing?.genres || [],
          tags: existing?.tags || [],
          description: existing?.description || '',
          language: existing?.language || 'en',
          fileName: data.fileName,
          size: data.buffer.byteLength,
          savedAt: Date.now(),
          isLocalImport: false,
          coverBlob: null,
          epubBlob,
        };
        await window.PaperInkDB.saveOfflineBook(rec).catch(() => {});
        this.updateBatchProgressUi(data.index, data.total, data.title);
        return;
      }

      if (data.type === 'BATCH_COMPLETE') {
        this.batchSyncActive = false;
        await this.app.reloadOfflineMeta();
        this.app.renderCurrentRoute();
        this.updateBatchProgressUi(data.total, data.total, 'Hoàn tất');
        this.app.toast(`Đã tải xong toàn bộ ${data.total} cuốn sách về điện thoại!`);
        return;
      }
    }

    async requestBookFromHost(bookId, fileName = '') {
      if (!this.activeHostConn || !this.activeHostConn.open) {
        return null;
      }

      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pendingBookRequests.delete(bookId);
          reject(new Error('P2P download timeout'));
        }, 30000);

        this.pendingBookRequests.set(bookId, { resolve, reject, timer });
        this.activeHostConn.send({
          type: 'REQUEST_BOOK',
          bookId,
          fileName,
        });
      });
    }

    requestBatchDownloadAll() {
      if (!this.activeHostConn || !this.activeHostConn.open) {
        this.app.toast('Chưa kết nối với Máy tính');
        return;
      }
      this.activeHostConn.send({ type: 'REQUEST_ALL_BOOKS' });
    }

    broadcastState(state) {
      if (this.isHost) {
        for (const conn of this.connections.values()) {
          if (conn.open) {
            conn.send({ type: 'STATE_SYNC', state });
          }
        }
      } else if (this.isClient && this.activeHostConn && this.activeHostConn.open) {
        this.activeHostConn.send({ type: 'STATE_SYNC', state });
      }
    }

    isConnected() {
      if (this.isHost) return this.connections.size > 0;
      if (this.isClient) return Boolean(this.activeHostConn && this.activeHostConn.open);
      return false;
    }

    updateUiStatus() {
      const p2pBadge = document.getElementById('p2p-status-badge');
      const p2pBatchBtn = document.getElementById('p2p-batch-download-btn');
      const connected = this.isConnected();

      if (p2pBadge) {
        if (connected) {
          const count = this.isHost ? this.connections.size : 1;
          p2pBadge.textContent = this.isHost
            ? `🟢 Đã kết nối với điện thoại (${count} thiết bị)`
            : '🟢 Đã kết nối trực tiếp với Máy tính (P2P)';
          p2pBadge.classList.add('connected');
        } else {
          p2pBadge.textContent = '⚪ Chưa kết nối P2P';
          p2pBadge.classList.remove('connected');
        }
      }

      if (p2pBatchBtn) {
        p2pBatchBtn.classList.toggle('hidden', !this.isClient || !connected);
      }
      this.app.updateSyncStatusUI();
    }

    updateBatchProgressUi(current, total, title) {
      const box = document.getElementById('p2p-batch-progress-box');
      const text = document.getElementById('p2p-batch-progress-text');
      const bar = document.getElementById('p2p-batch-progress-fill');
      if (!box) return;

      if (current >= total && total > 0) {
        box.classList.add('hidden');
        return;
      }

      box.classList.remove('hidden');
      const pct = total > 0 ? Math.round((current / total) * 100) : 0;
      if (text) text.textContent = `Đang tải sách từ máy tính: ${current}/${total} cuốn (${pct}%) — ${title}`;
      if (bar) bar.style.width = `${pct}%`;
    }
  }

  window.PaperInkP2P = PaperInkP2P;
})();
