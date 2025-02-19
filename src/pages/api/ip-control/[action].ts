import type { APIRoute } from 'astro';
import { ipControl } from '../../../lib/db';
import { isAuthenticated } from '../../../middleware/auth';

export const POST: APIRoute = async (context) => {
  if (!await isAuthenticated(context)) {
    return new Response(JSON.stringify({ error: '未授权' }), { status: 401 });
  }

  const { action } = context.params;
  
  try {
    const body = await context.request.json();

    switch (action) {
      case 'ban':
        const { ip, reason, duration } = body;
        if (!ip || !reason) {
          return new Response(JSON.stringify({ error: '缺少必要参数' }), {
            status: 400,
          });
        }
        const result = ipControl.banIP(ip, reason, duration);
        return new Response(JSON.stringify(result), { status: 200 });

      case 'unban':
        const { ip: unbanIP } = body;
        if (!unbanIP) {
          return new Response(JSON.stringify({ error: '缺少IP地址' }), {
            status: 400,
          });
        }
        const unbanResult = ipControl.unbanIP(unbanIP);
        return new Response(JSON.stringify(unbanResult), { status: 200 });

      default:
        return new Response(JSON.stringify({ error: '无效的操作' }), {
          status: 400,
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
    });
  }
};

export const GET: APIRoute = async (context) => {
  if (!await isAuthenticated(context)) {
    return new Response(JSON.stringify({ error: '未授权' }), { status: 401 });
  }

  const { action } = context.params;
  
  if (action === 'stats') {
    const ip = context.params.ip;
    if (!ip) {
      return new Response(JSON.stringify({ error: '缺少IP地址' }), {
        status: 400,
      });
    }

    const stats = ipControl.getIPStats(ip);
    return new Response(JSON.stringify(stats), { status: 200 });
  }

  return new Response(JSON.stringify({ error: '无效的操作' }), {
    status: 400,
  });
}; 