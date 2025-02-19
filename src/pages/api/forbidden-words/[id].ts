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
      return new Response(JSON.stringify({ error: '无效的ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = comments.removeForbiddenWord(Number(id));
    return new Response(JSON.stringify({ 
      success: true,
      message: '删除成功',
      result 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: '删除失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 