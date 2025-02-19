import type { APIRoute } from 'astro';
import { comments } from '../../../lib/db';
import { requireApiAuth } from '../../../middleware/auth';

export const POST: APIRoute = async (context) => {
  // 验证管理员身份
  const authResponse = await requireApiAuth(context);
  if (authResponse) return authResponse;

  try {
    const body = await context.request.json();
    const { nickname, category, description } = body;

    if (!nickname || !category) {
      return new Response(JSON.stringify({ error: '昵称和分类不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = comments.addForbiddenNickname(nickname, category, description);
    return new Response(JSON.stringify({ 
      success: true,
      message: '添加成功',
      result 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: '添加失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 