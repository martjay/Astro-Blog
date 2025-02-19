import type { APIRoute } from 'astro';
import { comments } from '../../../lib/db';
import { requireApiAuth } from '../../../middleware/auth';

export const POST: APIRoute = async (context) => {
  // 验证管理员身份
  const authResponse = await requireApiAuth(context);
  if (authResponse) return authResponse;

  try {
    const { id, status } = await context.request.json();
    
    if (!id || !status) {
      return new Response(JSON.stringify({ error: '缺少必要字段' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // 验证状态值
    if (!['pending', 'approved', 'spam', 'rejected'].includes(status)) {
      return new Response(JSON.stringify({ error: '无效的状态值' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const result = comments.updateStatus(id, status);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error updating comment status:', error);
    return new Response(JSON.stringify({ error: '更新评论状态失败' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 