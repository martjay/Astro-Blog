import Database from 'better-sqlite3';
import { join } from 'path';
import nodemailer from 'nodemailer';

const db = new Database(join(process.cwd(), 'data/comments.db'));

// 创建通知表
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notification_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    notify_new_comments BOOLEAN DEFAULT 1,
    notify_replies BOOLEAN DEFAULT 1
  );
`);

// 配置邮件发送
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const notifications = {
  // 添加通知
  add: async (type: 'new_comment' | 'reply', content: string) => {
    // 存储通知
    const result = db.prepare(`
      INSERT INTO notifications (type, content)
      VALUES (?, ?)
    `).run(type, content);

    // 获取通知设置
    const settings = db.prepare('SELECT * FROM notification_settings').all();

    // 发送邮件通知
    for (const setting of settings) {
      if ((type === 'new_comment' && setting.notify_new_comments) ||
          (type === 'reply' && setting.notify_replies)) {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: setting.email,
            subject: type === 'new_comment' ? '新评论通知' : '评论回复通知',
            html: content,
          });
        } catch (error) {
          console.error('Failed to send notification email:', error);
        }
      }
    }

    return result;
  },

  // 获取未读通知
  getUnread: () => {
    return db.prepare('SELECT * FROM notifications WHERE is_read = 0 ORDER BY created_at DESC').all();
  },

  // 标记通知为已读
  markAsRead: (id: number) => {
    return db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  },

  // 更新通知设置
  updateSettings: (email: string, settings: { notify_new_comments?: boolean; notify_replies?: boolean }) => {
    const existing = db.prepare('SELECT * FROM notification_settings WHERE email = ?').get(email);
    
    if (existing) {
      return db.prepare(`
        UPDATE notification_settings 
        SET notify_new_comments = ?, notify_replies = ?
        WHERE email = ?
      `).run(
        settings.notify_new_comments ?? existing.notify_new_comments,
        settings.notify_replies ?? existing.notify_replies,
        email
      );
    } else {
      return db.prepare(`
        INSERT INTO notification_settings (email, notify_new_comments, notify_replies)
        VALUES (?, ?, ?)
      `).run(email, settings.notify_new_comments ?? true, settings.notify_replies ?? true);
    }
  }
};

// 更新评论函数以添加通知
export async function notifyNewComment(comment: any) {
  const content = `
    <div>
      <p><strong>${comment.author}</strong> 发表了新评论：</p>
      <p>${comment.content}</p>
      <p>文章：${comment.post_slug}</p>
      <p>时间：${new Date().toLocaleString('zh-CN')}</p>
    </div>
  `;

  await notifications.add('new_comment', content);
}

export async function notifyCommentReply(comment: any, parentComment: any) {
  const content = `
    <div>
      <p><strong>${comment.author}</strong> 回复了 ${parentComment.author} 的评论：</p>
      <p>原评论：${parentComment.content}</p>
      <p>回复内容：${comment.content}</p>
      <p>文章：${comment.post_slug}</p>
      <p>时间：${new Date().toLocaleString('zh-CN')}</p>
    </div>
  `;

  await notifications.add('reply', content);
} 