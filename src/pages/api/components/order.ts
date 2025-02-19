import type { APIRoute } from 'astro';
import { requireApiAuth } from '../../../middleware/auth';
import { settings } from '../../../lib/settings';

export const PUT: APIRoute = async (context) => {
  // 验证管理员身份
  const authResponse = await requireApiAuth(context);
  if (authResponse) return authResponse;

  try {
    const { orderedIds } = await context.request.json();
    
    if (!Array.isArray(orderedIds)) {
      return new Response(JSON.stringify({ error: '无效的顺序数据' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    settings.updateHomeComponentOrder(orderedIds);

    return new Response(JSON.stringify({ 
      success: true,
      message: '顺序更新成功'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating component order:', error);
    return new Response(JSON.stringify({ error: '更新失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 