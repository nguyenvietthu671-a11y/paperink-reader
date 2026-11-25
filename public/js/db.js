(function () {
  const DB_NAME = 'PaperInkDB';
  const DB_VERSION = 3;

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('offlineBooks')) {
          db.createObjectStore('offlineBooks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('dictCache')) {
          db.createObjectStore('dictCache', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('customStickers')) {
          db.createObjectStore('customStickers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('customFonts')) {
          db.createObjectStore('customFonts', { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function withStore(storeName, mode, fn) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      let result;
      try {
        result = fn(store);
      } catch (err) {
        reject(err);
        return;
      }
      if (result && typeof result.onsuccess !== 'undefined') {
        result.onsuccess = () => resolve(result.result);
        result.onerror = () => reject(result.error);
      } else {
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
      }
    });
  }

  window.PaperInkDB = {
    async saveOfflineBook(record) {
      return withStore('offlineBooks', 'readwrite', (s) => s.put(record));
    },

    async getOfflineBook(id) {
      return withStore('offlineBooks', 'readonly', (s) => s.get(id));
    },

    async deleteOfflineBook(id) {
      return withStore('offlineBooks', 'readwrite', (s) => s.delete(id));
    },

    async listOfflineBookMeta() {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('offlineBooks', 'readonly');
        const store = tx.objectStore('offlineBooks');
        const out = [];
        const req = store.openCursor();
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) {
            resolve(out);
            return;
          }
          const v = cursor.value;
          out.push({
            id: v.id,
            title: v.title,
            author: v.author,
            series: v.series || '',
            seriesIndex: v.seriesIndex ?? null,
            genres: Array.isArray(v.genres) && v.genres.length ? v.genres : [],
            tags: Array.isArray(v.tags) ? v.tags : [],
            description: v.description || '',
            language: v.language || 'en',
            fileName: v.fileName || '',
            size: v.size || (v.epubBlob ? v.epubBlob.size : 0),
            savedAt: v.savedAt || Date.now(),
            isLocalImport: Boolean(v.isLocalImport),
            isDemoSample: Boolean(v.isDemoSample),
            hasCoverBlob: Boolean(v.coverBlob),
            coverBlob: v.coverBlob || null,
          });
          cursor.continue();
        };
        req.onerror = () => reject(req.error);
      });
    },

    async saveCustomSticker(record) {
      return withStore('customStickers', 'readwrite', (s) => s.put(record));
    },

    async deleteCustomSticker(id) {
      return withStore('customStickers', 'readwrite', (s) => s.delete(id));
    },

    async listCustomStickers() {
      return withStore('customStickers', 'readonly', (s) => s.getAll());
    },

    async saveCustomFont(record) {
      return withStore('customFonts', 'readwrite', (s) => s.put(record));
    },

    async deleteCustomFont(id) {
      return withStore('customFonts', 'readwrite', (s) => s.delete(id));
    },

    async listCustomFonts() {
      return withStore('customFonts', 'readonly', (s) => s.getAll());
    },

    async getKV(key) {
      const row = await withStore('kv', 'readonly', (s) => s.get(key));
      return row ? row.value : null;
    },

    async setKV(key, value) {
      return withStore('kv', 'readwrite', (s) => s.put({ key, value }));
    },

    async getDictCache(word) {
      const key = String(word || '').trim().toLowerCase();
      if (!key) return null;
      const row = await withStore('dictCache', 'readonly', (s) => s.get(key));
      return row ? row.data : null;
    },

    async setDictCache(word, data) {
      const key = String(word || '').trim().toLowerCase();
      if (!key) return;
      return withStore('dictCache', 'readwrite', (s) =>
        s.put({ key, data, savedAt: Date.now() })
      );
    },
  };
})();
