import type { APIRoute } from 'astro';
import { requireApiAuth } from '../../../middleware/auth';
import { settings } from '../../../lib/settings';

export const PUT: APIRoute = async (context) => {
  // 验证管理员身份
  const authResponse = await requireApiAuth(context);
  if (authResponse) return authResponse;

  try {
    const { id } = context.params;
    if (!id || isNaN(Number(id))) {
      return new Response(JSON.stringify({ error: '无效的组件ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await context.request.json();
    const result = settings.updateHomeComponent(Number(id), data);

    return new Response(JSON.stringify({ 
      success: true,
      message: '更新成功',
      result 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating component:', error);
    return new Response(JSON.stringify({ error: '更新失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 