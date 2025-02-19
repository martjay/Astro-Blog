import type { APIRoute } from 'astro';
import { requireApiAuth } from '../../../middleware/auth';
import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database(join(process.cwd(), 'data/blog.db'));

export const POST: APIRoute = async (context) => {
  // 验证管理员身份
  const authResponse = await requireApiAuth(context);
  if (authResponse) return authResponse;

  try {
    const { id } = await context.request.json();
    
    if (!id) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取要还原的版本内容
    const version = db.prepare('SELECT content FROM about_page WHERE id = ?').get(id);
    if (!version) {
      return new Response(JSON.stringify({ error: '版本不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 创建新版本（使用历史版本的内容）
    db.prepare('INSERT INTO about_page (content) VALUES (?)').run(version.content);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error restoring about page version:', error);
    return new Response(JSON.stringify({ error: '还原失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 