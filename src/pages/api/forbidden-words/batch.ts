import type { APIRoute } from 'astro';
import { comments } from '../../../lib/db';
import { requireApiAuth } from '../../../middleware/auth';

export const POST: APIRoute = async (context) => {
  // 验证管理员身份
  const authResponse = await requireApiAuth(context);
  if (authResponse) return authResponse;

  try {
    const { nicknames, words } = await context.request.json();

    // 验证数据格式
    if (!Array.isArray(nicknames) || !Array.isArray(words)) {
      return new Response(JSON.stringify({ error: '无效的数据格式' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 更新禁止昵称
    await comments.updateForbiddenNicknames(nicknames);
    // 更新违禁词
    await comments.updateForbiddenWords(words);

    return new Response(JSON.stringify({ 
      success: true,
      message: '保存成功'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating forbidden words:', error);
    return new Response(JSON.stringify({ 
      error: '保存失败：' + (error.message || '未知错误') 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 