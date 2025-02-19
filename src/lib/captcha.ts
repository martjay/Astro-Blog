import svgCaptcha from 'svg-captcha';
import { createHash } from 'crypto';
import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database(join(process.cwd(), 'data/comments.db'));

// 创建验证码会话表
db.exec(`
  CREATE TABLE IF NOT EXISTS captcha_sessions (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now')),
    expires_at DATETIME NOT NULL
  )
`);

// 定期清理过期的验证码
setInterval(() => {
  try {
    db.prepare("DELETE FROM captcha_sessions WHERE expires_at < datetime('now')").run();
  } catch (error) {
    console.error('Error cleaning expired captchas:', error);
  }
}, 1000 * 60 * 5); // 每5分钟清理一次

export const captcha = {
  generate: () => {
    try {
      // 生成验证码
      const captcha = svgCaptcha.create({
        size: 4, // 验证码长度
        noise: 2, // 干扰线条数
        color: true, // 随机颜色
        width: 120,
        height: 40,
        fontSize: 50,
      });

      // 生成会话ID
      const sessionId = createHash('sha256')
        .update(Math.random().toString())
        .digest('hex');

      // 设置过期时间（10分钟）
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      // 存储验证码
      db.prepare(`
        INSERT INTO captcha_sessions (id, code, expires_at)
        VALUES (?, ?, ?)
      `).run(sessionId, captcha.text.toLowerCase(), expiresAt.toISOString());

      return {
        svg: captcha.data,
        sessionId
      };
    } catch (error) {
      console.error('Error generating captcha:', error);
      throw new Error('验证码生成失败');
    }
  },

  verify: (sessionId: string, code: string): boolean => {
    try {
      if (!sessionId || !code) {
        return false;
      }

      // 验证并删除验证码
      const result = db.prepare(`
        DELETE FROM captcha_sessions 
        WHERE id = ? 
        AND code = ? 
        AND expires_at > datetime('now')
        RETURNING id
      `).get(sessionId, code.toLowerCase());

      return !!result;
    } catch (error) {
      console.error('Error verifying captcha:', error);
      return false;
    }
  }
}; 