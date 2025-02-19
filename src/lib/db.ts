import Database from 'better-sqlite3';
import { join } from 'path';
import { createHash } from 'crypto';

const db = new Database(join(process.cwd(), 'data/comments.db'));

// 更新评论表结构
db.exec(`
  -- 评论表
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_slug TEXT NOT NULL,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    parent_id INTEGER,
    ip TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES comments(id)
  );

  -- 垃圾关键词表
  CREATE TABLE IF NOT EXISTS spam_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- IP 封禁表
  CREATE TABLE IF NOT EXISTS banned_ips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL UNIQUE,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
  );

  -- IP 记录表用于跟踪评论频率
  CREATE TABLE IF NOT EXISTS ip_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 验证码会话表
  CREATE TABLE IF NOT EXISTS captcha_sessions (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now')),
    expires_at DATETIME NOT NULL
  );

  -- 通知表
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 通知设置表
  CREATE TABLE IF NOT EXISTS notification_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    notify_new_comments BOOLEAN DEFAULT 1,
    notify_replies BOOLEAN DEFAULT 1
  );

  -- 删除旧表
  DROP TABLE IF EXISTS forbidden_nicknames;
  DROP TABLE IF EXISTS forbidden_words;

  -- 创建新的简化版表
  CREATE TABLE IF NOT EXISTS forbidden_nicknames (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS forbidden_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL UNIQUE
  );

  -- 创建索引
  CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments(post_slug);
  CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
  CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
  CREATE INDEX IF NOT EXISTS idx_banned_ips_ip ON banned_ips(ip);
  CREATE INDEX IF NOT EXISTS idx_ip_records_ip ON ip_records(ip);
  CREATE INDEX IF NOT EXISTS idx_ip_records_created_at ON ip_records(created_at);
`);

// 定期清理过期的验证码
setInterval(() => {
  db.prepare("DELETE FROM captcha_sessions WHERE expires_at < datetime('now')").run();
}, 1000 * 60 * 5); // 每5分钟清理一次

export interface Comment {
  id: number;
  post_slug: string;
  author: string;
  content: string;
  email?: string;
  ip?: string;
  status: 'pending' | 'approved' | 'spam' | 'rejected';
  created_at: string;
  parent_id?: number;
}

// 垃圾评论检测
function isSpam(content: string, author: string): boolean {
  const spamKeywords = db.prepare('SELECT keyword FROM spam_keywords').all();
  const textToCheck = `${content.toLowerCase()} ${author.toLowerCase()}`;
  
  // 检查垃圾关键词
  for (const { keyword } of spamKeywords) {
    if (textToCheck.includes(keyword.toLowerCase())) {
      return true;
    }
  }

  // 检查链接数量
  const urlCount = (textToCheck.match(/https?:\/\//g) || []).length;
  if (urlCount > 2) {
    return true;
  }

  return false;
}

// IP 控制相关函数
export const ipControl = {
  banIP: (ip: string, reason: string, duration?: number, bannedBy?: number) => {
    const bannedUntil = duration 
      ? new Date(Date.now() + duration * 1000).toISOString()
      : null;

    return db.prepare(`
      INSERT INTO banned_ips (ip, reason, banned_until, banned_by)
      VALUES (?, ?, ?, ?)
    `).run(ip, reason, bannedUntil, bannedBy);
  },

  unbanIP: (ip: string) => {
    return db.prepare('DELETE FROM banned_ips WHERE ip = ?').run(ip);
  },

  isIPBanned: (ip: string): boolean => {
    const banned = db.prepare(`
      SELECT * FROM banned_ips 
      WHERE ip = ? AND (banned_until IS NULL OR banned_until > datetime('now'))
    `).get(ip);
    return !!banned;
  },

  getBannedIPs: () => {
    return db.prepare(`
      SELECT * FROM banned_ips 
      WHERE banned_until IS NULL OR banned_until > datetime('now')
      ORDER BY banned_at DESC
    `).all();
  },

  // 记录 IP 活动
  recordIPActivity: (ip: string, action: string) => {
    return db.prepare(
      'INSERT INTO ip_records (ip, action) VALUES (?, ?)'
    ).run(ip, action);
  },

  // 检查 IP 是否超过频率限制
  isIPRateLimited: (ip: string, timeWindow: number = 3600, limit: number = 10): boolean => {
    const count = db.prepare(`
      SELECT COUNT(*) as count 
      FROM ip_records 
      WHERE ip = ? 
      AND created_at > datetime('now', '-' || ? || ' seconds')
    `).get(ip, timeWindow).count;

    return count >= limit;
  },

  // 获取 IP 活动统计
  getIPStats: (ip: string) => {
    return {
      total: db.prepare('SELECT COUNT(*) as count FROM ip_records WHERE ip = ?').get(ip).count,
      last24h: db.prepare(`
        SELECT COUNT(*) as count 
        FROM ip_records 
        WHERE ip = ? AND created_at > datetime('now', '-24 hours')
      `).get(ip).count,
      lastActions: db.prepare(`
        SELECT * FROM ip_records 
        WHERE ip = ? 
        ORDER BY created_at DESC 
        LIMIT 10
      `).all(ip)
    };
  }
};

export const comments = {
  getAll: (post_slug: string) => {
    return db.prepare(`
      SELECT * FROM comments 
      WHERE post_slug = ? AND status = 'approved' 
      ORDER BY created_at DESC
    `).all(post_slug) as Comment[];
  },

  getAllForAdmin: (status?: string) => {
    const query = status 
      ? 'SELECT * FROM comments WHERE status = ? ORDER BY created_at DESC'
      : 'SELECT * FROM comments ORDER BY created_at DESC';
    return db.prepare(query).all(status ? [status] : []) as Comment[];
  },

  add: (comment: Omit<Comment, 'id' | 'created_at'>) => {
    // 检查IP是否被封禁
    const bannedIp = db.prepare(`
      SELECT * FROM banned_ips 
      WHERE ip = ?
    `).get(comment.ip);

    if (bannedIp) {
      throw new Error('IP已被封禁');
    }

    // 检查评论频率
    const recentComments = db.prepare(`
      SELECT COUNT(*) as count 
      FROM comments 
      WHERE ip = ? 
      AND created_at > datetime('now', '-5 minutes')
    `).get(comment.ip);

    if (recentComments.count >= 5) {
      throw new Error('评论太频繁，请稍后再试');
    }

    // 添加评论
    return db.prepare(`
      INSERT INTO comments (
        post_slug, author, content, parent_id, 
        ip, email, status, created_at
      ) VALUES (
        @post_slug, @author, @content, @parent_id,
        @ip, @email, @status, datetime('now')
      )
    `).run(comment);
  },

  updateStatus: (id: number, status: Comment['status']) => {
    return db.prepare('UPDATE comments SET status = ? WHERE id = ?').run(status, id);
  },

  delete: (id: number) => {
    // 开始事务
    const transaction = db.transaction(() => {
      // 先删除子评论
      db.prepare('DELETE FROM comments WHERE parent_id = ?').run(id);
      // 再删除主评论
      const result = db.prepare('DELETE FROM comments WHERE id = ?').run(id);
      return result;
    });

    // 执行事务
    return transaction();
  },

  // 垃圾关键词管理
  addSpamKeyword: (keyword: string) => {
    return db.prepare('INSERT OR IGNORE INTO spam_keywords (keyword) VALUES (?)').run(keyword);
  },

  removeSpamKeyword: (keyword: string) => {
    return db.prepare('DELETE FROM spam_keywords WHERE keyword = ?').run(keyword);
  },

  getSpamKeywords: () => {
    return db.prepare('SELECT * FROM spam_keywords ORDER BY created_at DESC').all();
  },

  // 禁止昵称管理
  getForbiddenNicknames: () => {
    return db.prepare('SELECT nickname FROM forbidden_nicknames').all();
  },

  // 批量更新禁止昵称
  updateForbiddenNicknames: (nicknames: string[]) => {
    const transaction = db.transaction(() => {
      // 清空现有数据
      db.prepare('DELETE FROM forbidden_nicknames').run();
      // 批量插入新数据
      const stmt = db.prepare('INSERT INTO forbidden_nicknames (nickname) VALUES (?)');
      for (const nickname of nicknames) {
        if (nickname.trim()) {
          stmt.run(nickname.trim());
        }
      }
    });
    return transaction();
  },

  // 违禁词管理
  getForbiddenWords: () => {
    return db.prepare('SELECT word FROM forbidden_words').all();
  },

  // 批量更新违禁词
  updateForbiddenWords: (words: string[]) => {
    const transaction = db.transaction(() => {
      // 清空现有数据
      db.prepare('DELETE FROM forbidden_words').run();
      // 批量插入新数据
      const stmt = db.prepare('INSERT INTO forbidden_words (word) VALUES (?)');
      for (const word of words) {
        if (word.trim()) {
          stmt.run(word.trim());
        }
      }
    });
    return transaction();
  },

  // 检查昵称是否合法
  validateNickname: (nickname: string): { valid: boolean; reason?: string } => {
    // 检查长度
    if (nickname.length < 2 || nickname.length > 20) {
      return { valid: false, reason: '昵称长度必须在2-20个字符之间' };
    }

    // 检查特殊字符
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/.test(nickname)) {
      return { valid: false, reason: '昵称只能包含中文、英文、数字、下划线和连字符' };
    }

    // 检查违禁昵称
    const forbiddenNicknames = db.prepare('SELECT nickname FROM forbidden_nicknames').all();
    for (const { nickname: forbidden } of forbiddenNicknames) {
      if (nickname.toLowerCase().includes(forbidden.toLowerCase())) {
        return { valid: false, reason: '昵称包含违规词汇' };
      }
    }

    // 检查违禁词
    const forbiddenWords = db.prepare('SELECT word FROM forbidden_words').all();
    for (const { word } of forbiddenWords) {
      if (nickname.toLowerCase().includes(word.toLowerCase())) {
        return { valid: false, reason: '昵称包含违规词汇' };
      }
    }

    return { valid: true };
  }
}; 