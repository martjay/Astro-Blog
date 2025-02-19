import Database from 'better-sqlite3';
import { join } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 修正数据库路径
const dbPath = join(process.cwd(), 'data', 'blog.db');
console.log('Database path:', dbPath);

const db = new Database(dbPath);

// 创建管理员表
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admins(id)
  );
`);

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

export const auth = {
  createAdmin: (username, password) => {
    const passwordHash = hashPassword(password);
    return db.prepare(
      'INSERT INTO admins (username, password_hash) VALUES (?, ?)'
    ).run(username, passwordHash);
  },

  verifyCredentials: (username, password) => {
    const passwordHash = hashPassword(password);
    const admin = db.prepare(
      'SELECT * FROM admins WHERE username = ? AND password_hash = ?'
    ).get(username, passwordHash);
    return admin || null;
  },

  createSession: (userId) => {
    const sessionId = createHash('sha256').update(Math.random().toString()).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7天后过期

    db.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).run(sessionId, userId, expiresAt.toISOString());

    return sessionId;
  },

  verifySession: (sessionId) => {
    const session = db.prepare(`
      SELECT sessions.*, admins.username 
      FROM sessions 
      JOIN admins ON sessions.user_id = admins.id 
      WHERE sessions.id = ? AND sessions.expires_at > datetime('now')
    `).get(sessionId);
    return session || null;
  },

  deleteSession: (sessionId) => {
    return db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  },

  // 更新密码
  updatePassword: (username, newPassword) => {
    console.log('Updating password for user:', username);
    const passwordHash = hashPassword(newPassword);
    const result = db.prepare(
      'UPDATE admins SET password_hash = ? WHERE username = ?'
    ).run(passwordHash, username);
    console.log('Update result:', result);
    return result;
  },

  // 删除所有会话
  deleteAllSessions: (username) => {
    console.log('Deleting all sessions for user:', username);
    const result = db.prepare(`
      DELETE FROM sessions 
      WHERE user_id IN (SELECT id FROM admins WHERE username = ?)
    `).run(username);
    console.log('Delete sessions result:', result);
    return result;
  }
}; 