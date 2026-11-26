const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const DEFAULT_STATE = {
  version: 4,
  updatedAt: 0,
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
  settings: null,
  readingStats: {
    dailyMinutes: {},
    dailyGoalMinutes: 30,
    pagesTurned: 0,
    updatedAt: 0,
  },
  shelfConfig: null,
};

class StateStore {
  constructor(dataDir) {
    this.filePath = path.join(dataDir, 'state.json');
    this.state = structuredClone(DEFAULT_STATE);
    this.saveTimer = null;
  }

  async init() {
    await fsp.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await fsp.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      this.state = {
        ...structuredClone(DEFAULT_STATE),
        ...parsed,
        progress: parsed.progress || {},
        bookmarks: parsed.bookmarks || {},
        highlights: parsed.highlights || {},
        bookReviews: parsed.bookReviews || {},
        bookMetaOverrides: parsed.bookMetaOverrides || {},
        seriesMeta: parsed.seriesMeta || {},
        inkNotes: parsed.inkNotes || {},
        folders: Array.isArray(parsed.folders) ? parsed.folders : [],
        hiddenBookIds: parsed.hiddenBookIds || {},
        vocab: Array.isArray(parsed.vocab) ? parsed.vocab : [],
        deletedIds: parsed.deletedIds || {},
        readingStats: {
          dailyMinutes: parsed.readingStats?.dailyMinutes || {},
          dailyGoalMinutes: parsed.readingStats?.dailyGoalMinutes || 30,
          pagesTurned: parsed.readingStats?.pagesTurned || 0,
          updatedAt: parsed.readingStats?.updatedAt || 0,
        },
        shelfConfig: parsed.shelfConfig || null,
      };
    } catch (_) {
      await this.flush();
    }
  }

  scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.flush().catch((err) => console.error('[StateStore] save failed:', err));
    }, 250);
  }

  async flush() {
    const tmp = `${this.filePath}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(this.state, null, 2), 'utf8');
    await fsp.rename(tmp, this.filePath);
  }

  getState() {
    return this.state;
  }

  mergeState(incoming) {
    if (!incoming || typeof incoming !== 'object') return this.state;

    // Merge deletedIds tombstones first
    const deleted = { ...this.state.deletedIds };
    if (incoming.deletedIds && typeof incoming.deletedIds === 'object') {
      for (const [id, ts] of Object.entries(incoming.deletedIds)) {
        if (!deleted[id] || ts > deleted[id]) deleted[id] = ts;
      }
    }
    this.state.deletedIds = deleted;

    // Merge hiddenBookIds tombstones
    if (incoming.hiddenBookIds && typeof incoming.hiddenBookIds === 'object') {
      if (!this.state.hiddenBookIds) this.state.hiddenBookIds = {};
      for (const [id, ts] of Object.entries(incoming.hiddenBookIds)) {
        if (!this.state.hiddenBookIds[id] || ts > this.state.hiddenBookIds[id]) {
          this.state.hiddenBookIds[id] = ts;
        }
      }
    }

    // Merge custom folders
    if (Array.isArray(incoming.folders)) {
      const byId = new Map();
      const existing = Array.isArray(this.state.folders) ? this.state.folders : [];
      for (const item of [...existing, ...incoming.folders]) {
        if (!item || !item.id) continue;
        const delTs = deleted[item.id] || 0;
        const itemTs = item.updatedAt || item.createdAt || 0;
        if (delTs >= itemTs) continue;
        const prev = byId.get(item.id);
        if (!prev || itemTs >= (prev.updatedAt || prev.createdAt || 0)) {
          byId.set(item.id, item);
        }
      }
      this.state.folders = Array.from(byId.values()).sort(
        (a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
      );
    }

    // Merge reading progress per book (latest updatedAt wins)
    if (incoming.progress && typeof incoming.progress === 'object') {
      for (const [bookId, p] of Object.entries(incoming.progress)) {
        if (!p || typeof p !== 'object') continue;
        const cur = this.state.progress[bookId];
        if (!cur || (p.updatedAt || 0) >= (cur.updatedAt || 0)) {
          this.state.progress[bookId] = p;
        }
      }
    }

    // Merge bookReviews (rating + personal review)
    if (incoming.bookReviews && typeof incoming.bookReviews === 'object') {
      for (const [bookId, rev] of Object.entries(incoming.bookReviews)) {
        if (!rev || typeof rev !== 'object') continue;
        const cur = this.state.bookReviews[bookId];
        if (!cur || (rev.updatedAt || 0) >= (cur.updatedAt || 0)) {
          this.state.bookReviews[bookId] = rev;
        }
      }
    }

    // Merge bookMetaOverrides (auto-enriched or user-edited tags/genres/author/series)
    if (incoming.bookMetaOverrides && typeof incoming.bookMetaOverrides === 'object') {
      if (!this.state.bookMetaOverrides) this.state.bookMetaOverrides = {};
      for (const [bookId, ov] of Object.entries(incoming.bookMetaOverrides)) {
        if (!ov || typeof ov !== 'object') continue;
        const cur = this.state.bookMetaOverrides[bookId];
        if (!cur || (ov.updatedAt || 0) >= (cur.updatedAt || 0)) {
          this.state.bookMetaOverrides[bookId] = ov;
        }
      }
    }

    // Merge seriesMeta (genres, tags, shared description per series)
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

    // Merge S Pen inkNotes per book & pageKey
    if (incoming.inkNotes && typeof incoming.inkNotes === 'object') {
      for (const [bookId, pagesObj] of Object.entries(incoming.inkNotes)) {
        if (!pagesObj || typeof pagesObj !== 'object') continue;
        if (!this.state.inkNotes[bookId]) this.state.inkNotes[bookId] = {};
        for (const [pageKey, pageNote] of Object.entries(pagesObj)) {
          if (!pageNote || typeof pageNote !== 'object') continue;
          const cur = this.state.inkNotes[bookId][pageKey];
          if (!cur || (pageNote.updatedAt || 0) >= (cur.updatedAt || 0)) {
            if (Array.isArray(pageNote.strokes) && pageNote.strokes.length === 0) {
              this.state.inkNotes[bookId][pageKey] = { strokes: [], updatedAt: pageNote.updatedAt || Date.now() };
            } else {
              this.state.inkNotes[bookId][pageKey] = pageNote;
            }
          }
        }
      }
    }

    // Merge bookmarks per book
    if (incoming.bookmarks && typeof incoming.bookmarks === 'object') {
      for (const [bookId, list] of Object.entries(incoming.bookmarks)) {
        if (!Array.isArray(list)) continue;
        const existing = Array.isArray(this.state.bookmarks[bookId])
          ? this.state.bookmarks[bookId]
          : [];
        const byId = new Map();
        for (const item of [...existing, ...list]) {
          if (!item || !item.id) continue;
          const delTs = deleted[item.id] || 0;
          const itemTs = item.updatedAt || item.createdAt || 0;
          if (delTs >= itemTs) continue;
          const prev = byId.get(item.id);
          if (!prev || itemTs >= (prev.updatedAt || prev.createdAt || 0)) {
            byId.set(item.id, item);
          }
        }
        this.state.bookmarks[bookId] = Array.from(byId.values()).sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );
      }
    }

    // Merge highlights per book
    if (incoming.highlights && typeof incoming.highlights === 'object') {
      for (const [bookId, list] of Object.entries(incoming.highlights)) {
        if (!Array.isArray(list)) continue;
        const existing = Array.isArray(this.state.highlights[bookId])
          ? this.state.highlights[bookId]
          : [];
        const byId = new Map();
        for (const item of [...existing, ...list]) {
          if (!item || !item.id) continue;
          const delTs = deleted[item.id] || 0;
          const itemTs = item.updatedAt || item.createdAt || 0;
          if (delTs >= itemTs) continue;
          const prev = byId.get(item.id);
          if (!prev || itemTs >= (prev.updatedAt || prev.createdAt || 0)) {
            byId.set(item.id, item);
          }
        }
        this.state.highlights[bookId] = Array.from(byId.values()).sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );
      }
    }

    // Merge vocab list
    if (Array.isArray(incoming.vocab)) {
      const byId = new Map();
      for (const item of [...this.state.vocab, ...incoming.vocab]) {
        if (!item || !item.id) continue;
        const delTs = deleted[item.id] || 0;
        const itemTs = item.updatedAt || item.createdAt || 0;
        if (delTs >= itemTs) continue;
        const prev = byId.get(item.id);
        if (!prev || itemTs >= (prev.updatedAt || prev.createdAt || 0)) {
          byId.set(item.id, item);
        }
      }
      this.state.vocab = Array.from(byId.values()).sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
      );
    }

    // Merge settings if newer
    if (incoming.settings && typeof incoming.settings === 'object') {
      const curTs = this.state.settings?.updatedAt || 0;
      const inTs = incoming.settings.updatedAt || 0;
      if (inTs >= curTs) {
        this.state.settings = incoming.settings;
      }
    }

    // Merge shelfConfig if newer, and merge scopedWallpapers granularly per scopeKey
    if (incoming.shelfConfig && typeof incoming.shelfConfig === 'object') {
      const curCfg = this.state.shelfConfig || {};
      const inCfg = incoming.shelfConfig;
      const mergedScoped = { ...(curCfg.scopedWallpapers || {}) };
      if (inCfg.scopedWallpapers && typeof inCfg.scopedWallpapers === 'object') {
        for (const [sKey, entry] of Object.entries(inCfg.scopedWallpapers)) {
          if (!entry || typeof entry !== 'object') continue;
          const prev = mergedScoped[sKey];
          if (!prev || (entry.updatedAt || 0) >= (prev.updatedAt || 0)) {
            mergedScoped[sKey] = entry;
          }
        }
      }
      const curTs = curCfg.updatedAt || 0;
      const inTs = inCfg.updatedAt || 0;
      if (inTs >= curTs) {
        this.state.shelfConfig = {
          ...curCfg,
          ...inCfg,
          scopedWallpapers: mergedScoped,
        };
      } else {
        this.state.shelfConfig = {
          ...curCfg,
          scopedWallpapers: mergedScoped,
        };
      }
    }

    // Merge readingStats (max per day + max pagesTurned + latest goal)
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
        if (typeof inRs.dailyGoalMinutes === 'number' && inRs.dailyGoalMinutes > 0) {
          rs.dailyGoalMinutes = inRs.dailyGoalMinutes;
        }
        rs.updatedAt = inRs.updatedAt || Date.now();
      }
      this.state.readingStats = rs;
    }

    // Also prune any existing items matching newly arrived tombstones
    for (const bookId of Object.keys(this.state.bookmarks)) {
      this.state.bookmarks[bookId] = this.state.bookmarks[bookId].filter(
        (b) => (deleted[b.id] || 0) < (b.updatedAt || b.createdAt || 0)
      );
    }
    for (const bookId of Object.keys(this.state.highlights)) {
      this.state.highlights[bookId] = this.state.highlights[bookId].filter(
        (h) => (deleted[h.id] || 0) < (h.updatedAt || h.createdAt || 0)
      );
    }
    this.state.vocab = this.state.vocab.filter(
      (v) => (deleted[v.id] || 0) < (v.updatedAt || v.createdAt || 0)
    );

    this.state.updatedAt = Date.now();
    this.scheduleSave();
    return this.state;
  }
}

module.exports = { StateStore };
