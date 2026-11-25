const { execSync } = require('child_process');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const QRCode = require('qrcode');

const FILE_NAME = 'paperink-sync-state.json';
const GITHUB_PAGES_BASE = 'https://nguyenvietthu671-a11y.github.io/paperink-reader/';

function detectGitHubToken() {
  if (process.env.PAPERINK_CLOUD_TOKEN) return process.env.PAPERINK_CLOUD_TOKEN.trim();
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim();
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN.trim();
  try {
    const out = execSync('gh auth token', {
      shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/sh',
      encoding: 'utf8',
      timeout: 3000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (out && (out.startsWith('gho_') || out.startsWith('ghp_'))) {
      return out;
    }
  } catch (_) {}
  return '';
}

class ServerCloudSync {
  constructor(dataDir, stateStore) {
    this.dataDir = dataDir;
    this.stateStore = stateStore;
    this.configFile = path.join(dataDir, 'cloud-sync.json');
    this.token = '';
    this.gistId = '';
    this.cloudQrSvg = '';
    this.syncUrl = '';
    this.syncTimer = null;
    this.lastSyncedAt = 0;
  }

  async init() {
    await fsp.mkdir(this.dataDir, { recursive: true });
    await this.loadConfig();

    if (!this.token) {
      this.token = detectGitHubToken();
      if (this.token) {
        await this.saveConfig();
      }
    }

    if (this.token) {
      await this.ensureGist();
      await this.syncPull();
      this.startBackgroundSync();
    }
  }

  async loadConfig() {
    try {
      const data = await fsp.readFile(this.configFile, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed.token) this.token = parsed.token.trim();
      if (parsed.gistId) this.gistId = parsed.gistId.trim();
      if (parsed.lastSyncedAt) this.lastSyncedAt = parsed.lastSyncedAt;
    } catch (_) {}
  }

  async saveConfig() {
    try {
      await fsp.writeFile(
        this.configFile,
        JSON.stringify(
          {
            token: this.token,
            gistId: this.gistId,
            lastSyncedAt: this.lastSyncedAt,
            updatedAt: Date.now(),
          },
          null,
          2
        ),
        'utf8'
      );
    } catch (_) {}
  }

  async ensureGist() {
    if (!this.token) return;
    const headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'PaperInk-Server',
    };

    try {
      if (this.gistId) {
        const checkRes = await fetch(`https://api.github.com/gists/${encodeURIComponent(this.gistId)}`, { headers });
        if (checkRes.ok) {
          await this.buildQrCode();
          return;
        }
        if (checkRes.status === 404) {
          this.gistId = '';
        }
      }

      // Find existing sync gist in user's gists
      const listRes = await fetch('https://api.github.com/gists?per_page=30', { headers });
      if (listRes.ok) {
        const gists = await listRes.json();
        const found = (gists || []).find((g) => g.files && g.files[FILE_NAME]);
        if (found) {
          this.gistId = found.id;
          await this.saveConfig();
          await this.buildQrCode();
          return;
        }
      }

      // Create new private Gist for sync
      const createRes = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          description: 'PaperInk Private Sync (Reading Progress, Notes & S Pen Ink)',
          public: false,
          files: {
            [FILE_NAME]: {
              content: JSON.stringify({
                app: 'PaperInk',
                version: 4,
                syncedAt: Date.now(),
                state: this.stateStore.getState(),
              }),
            },
          },
        }),
      });

      if (createRes.ok) {
        const created = await createRes.json();
        this.gistId = created.id;
        await this.saveConfig();
        await this.buildQrCode();
      }
    } catch (err) {
      console.warn('[PaperInk CloudSync] ensureGist error:', err.message);
    }
  }

  async buildQrCode() {
    if (!this.token) return;
    this.syncUrl = `${GITHUB_PAGES_BASE}#cloud_token=${encodeURIComponent(this.token)}${
      this.gistId ? `&gist_id=${encodeURIComponent(this.gistId)}` : ''
    }`;
    try {
      this.cloudQrSvg = await QRCode.toString(this.syncUrl, {
        type: 'svg',
        margin: 1,
        width: 220,
        color: { dark: '#0b57d0', light: '#00000000' },
      });
    } catch (_) {}
  }

  async syncPull() {
    if (!this.token || !this.gistId) return;
    const headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'PaperInk-Server',
    };
    try {
      const res = await fetch(`https://api.github.com/gists/${encodeURIComponent(this.gistId)}`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      const fileObj = data?.files?.[FILE_NAME];
      if (!fileObj) return;

      let rawText = fileObj.content || '';
      if (fileObj.truncated && fileObj.raw_url) {
        const rawRes = await fetch(fileObj.raw_url);
        if (rawRes.ok) rawText = await rawRes.text();
      }
      if (rawText) {
        const parsed = JSON.parse(rawText);
        const remoteState = parsed?.state || parsed;
        if (remoteState && typeof remoteState === 'object') {
          this.stateStore.mergeState(remoteState);
          this.lastSyncedAt = Date.now();
          await this.saveConfig();
        }
      }
    } catch (err) {
      console.warn('[PaperInk CloudSync] pull error:', err.message);
    }
  }

  async syncPush() {
    if (!this.token || !this.gistId) return;
    const headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'PaperInk-Server',
    };
    try {
      const payload = JSON.stringify({
        app: 'PaperInk',
        version: 4,
        syncedAt: Date.now(),
        state: this.stateStore.getState(),
      });
      const patchRes = await fetch(`https://api.github.com/gists/${encodeURIComponent(this.gistId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ files: { [FILE_NAME]: { content: payload } } }),
      });
      if (patchRes.ok) {
        this.lastSyncedAt = Date.now();
        await this.saveConfig();
      }
    } catch (err) {
      console.warn('[PaperInk CloudSync] push error:', err.message);
    }
  }

  startBackgroundSync() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    // Periodically sync every 60 seconds
    this.syncTimer = setInterval(async () => {
      await this.syncPull();
      await this.syncPush();
    }, 60000);
  }

  getInfo() {
    return {
      enabled: Boolean(this.token && this.gistId),
      token: this.token,
      gistId: this.gistId,
      syncUrl: this.syncUrl,
      qrSvg: this.cloudQrSvg,
      lastSyncedAt: this.lastSyncedAt,
    };
  }

  destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
}

module.exports = { ServerCloudSync };
