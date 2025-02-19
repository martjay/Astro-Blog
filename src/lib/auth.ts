import Database from 'better-sqlite3';
import { join } from 'path';
import { createHash } from 'crypto';

const db = new Database(join(process.cwd(), 'data/blog.db'));

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

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export const auth = {
  createAdmin: (username: string, password: string) => {
    const passwordHash = hashPassword(password);
    return db.prepare(
      'INSERT INTO admins (username, password_hash) VALUES (?, ?)'
    ).run(username, passwordHash);
  },

  verifyCredentials: (username: string, password: string) => {
    const passwordHash = hashPassword(password);
    const admin = db.prepare(
      'SELECT * FROM admins WHERE username = ? AND password_hash = ?'
    ).get(username, passwordHash);
    return admin || null;
  },

  createSession: (userId: number) => {
    const sessionId = createHash('sha256').update(Math.random().toString()).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7天后过期

    db.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).run(sessionId, userId, expiresAt.toISOString());

    return sessionId;
  },

  verifySession: (sessionId: string) => {
    const session = db.prepare(`
      SELECT sessions.*, admins.username 
      FROM sessions 
      JOIN admins ON sessions.user_id = admins.id 
      WHERE sessions.id = ? AND sessions.expires_at > datetime('now')
    `).get(sessionId);
    return session || null;
  },

  deleteSession: (sessionId: string) => {
    return db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  },

  // 更新密码
  updatePassword: (username: string, newPassword: string) => {
    const passwordHash = hashPassword(newPassword);
    return db.prepare(
      'UPDATE admins SET password_hash = ? WHERE username = ?'
    ).run(passwordHash, username);
  },

  // 删除所有会话
  deleteAllSessions: (username: string) => {
    return db.prepare(`
      DELETE FROM sessions 
      WHERE user_id IN (SELECT id FROM admins WHERE username = ?)
    `).run(username);
  }
}; 