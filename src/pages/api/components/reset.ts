import type { APIRoute } from 'astro';
import { requireApiAuth } from '../../../middleware/auth';
import { settings } from '../../../lib/settings';

export const POST: APIRoute = async (context) => {
  // 验证管理员身份
  const authResponse = await requireApiAuth(context);
  if (authResponse) return authResponse;

  try {
    const result = settings.resetHomeComponents();

    return new Response(JSON.stringify({ 
      success: true,
      message: '重置成功',
      result 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error resetting components:', error);
    return new Response(JSON.stringify({ error: '重置失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 