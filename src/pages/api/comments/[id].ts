import type { APIRoute } from 'astro';
import { comments } from '../../../lib/db';
import { requireApiAuth } from '../../../middleware/auth';

export const DELETE: APIRoute = async (context) => {
  // 验证管理员身份
  const authResponse = await requireApiAuth(context);
  if (authResponse) return authResponse;

  try {
    const { id } = context.params;
    if (!id || isNaN(Number(id))) {
      return new Response(JSON.stringify({ error: '无效的评论ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = comments.delete(Number(id));
    
    return new Response(JSON.stringify({ 
      success: true,
      message: '评论已删除',
      result 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return new Response(JSON.stringify({ 
      error: '删除评论失败：' + (error.message || '未知错误') 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 