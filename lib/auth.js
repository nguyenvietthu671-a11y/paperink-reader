const crypto = require('crypto');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

class AuthManager {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.usersFile = path.join(dataDir, 'users.json');
    this.secret = 'paperink-secret-salt-' + osSecretKey(dataDir);
    this.users = new Map(); // username -> user record
    this.usersById = new Map(); // id -> user record
  }

  async init() {
    await fsp.mkdir(this.dataDir, { recursive: true });
    await this.loadUsers();
  }

  async loadUsers() {
    try {
      const raw = await fsp.readFile(this.usersFile, 'utf8');
      const data = JSON.parse(raw);
      if (data && typeof data.users === 'object') {
        for (const u of Object.values(data.users)) {
          if (!u || !u.username) continue;
          this.users.set(u.username.toLowerCase(), u);
          this.usersById.set(u.id, u);
        }
      }
    } catch (_) {
      // File may not exist yet
    }
  }

  async saveUsers() {
    try {
      const obj = { users: {} };
      for (const [uname, u] of this.users.entries()) {
        obj.users[u.id] = u;
      }
      await fsp.writeFile(this.usersFile, JSON.stringify(obj, null, 2), 'utf8');
    } catch (err) {
      console.warn('[PaperInk Auth] Failed to save users.json:', err.message);
    }
  }

  hashPassword(password, salt) {
    return crypto.scryptSync(password, salt, 32).toString('hex');
  }

  async register(username, password, displayName = '') {
    const cleanUser = String(username || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();
    if (!cleanUser || cleanUser.length < 2) {
      return { ok: false, error: 'Tên tài khoản phải từ 2 ký tự trở lên' };
    }
    if (!cleanPass || cleanPass.length < 4) {
      return { ok: false, error: 'Mật khẩu phải từ 4 ký tự trở lên' };
    }
    if (this.users.has(cleanUser)) {
      return { ok: false, error: 'Tên tài khoản đã tồn tại, vui lòng chọn tên khác hoặc đăng nhập' };
    }

    const id = 'user_' + crypto.randomBytes(8).toString('hex');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = this.hashPassword(cleanPass, salt);
    const now = Date.now();

    const user = {
      id,
      username: cleanUser,
      displayName: String(displayName || cleanUser).trim(),
      salt,
      hash,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    this.users.set(cleanUser, user);
    this.usersById.set(id, user);
    await this.saveUsers();

    const token = this.generateToken(user);
    return {
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    };
  }

  async login(username, password) {
    const cleanUser = String(username || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();
    const user = this.users.get(cleanUser);
    if (!user) {
      return { ok: false, error: 'Tài khoản không tồn tại. Bạn hãy bấm Đăng ký để tạo tài khoản mới.' };
    }

    const testHash = this.hashPassword(cleanPass, user.salt);
    if (testHash !== user.hash) {
      return { ok: false, error: 'Mật khẩu không chính xác' };
    }

    user.lastLoginAt = Date.now();
    await this.saveUsers();

    const token = this.generateToken(user);
    return {
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    };
  }

  generateToken(user) {
    const payload = `${user.id}:${user.username}:${Date.now()}`;
    const sig = crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
    return Buffer.from(`${payload}:${sig}`).toString('base64');
  }

  verifyToken(tokenStr) {
    if (!tokenStr) return null;
    try {
      const decoded = Buffer.from(tokenStr, 'base64').toString('utf8');
      const parts = decoded.split(':');
      if (parts.length < 4) return null;
      const [userId, username, timeStr, sig] = parts;
      const payload = `${userId}:${username}:${timeStr}`;
      const expectedSig = crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
      if (sig !== expectedSig) return null;

      const user = this.usersById.get(userId);
      if (!user || user.username !== username) return null;
      return user;
    } catch (_) {
      return null;
    }
  }
}

function osSecretKey(dataDir) {
  try {
    const h = crypto.createHash('sha256').update(dataDir + (process.env.COMPUTERNAME || 'paperink')).digest('hex');
    return h.slice(0, 16);
  } catch (_) {
    return 'defaultkey';
  }
}

module.exports = { AuthManager };
