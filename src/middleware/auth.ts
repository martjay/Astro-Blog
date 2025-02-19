import type { APIContext } from 'astro';
import { auth } from '../lib/auth';

// 从请求中获取cookie值
function getCookieFromRequest(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies[name];
}

export async function isAuthenticated(context: APIContext | { request: Request, cookies?: { get: (name: string) => { value: string } | undefined } }) {
  // 尝试从不同来源获取session
  const sessionId = context.cookies?.get('session')?.value || getCookieFromRequest(context.request, 'session');
  if (!sessionId) return false;

  const session = auth.verifySession(sessionId);
  return !!session;
}

export async function requireAuth(context: APIContext | { request: Request, cookies?: { get: (name: string) => { value: string } | undefined }, redirect: (path: string) => Response }) {
  if (!await isAuthenticated(context)) {
    // 保存原始请求URL
    const requestedUrl = new URL(context.request.url).pathname;
    const searchParams = new URLSearchParams();
    searchParams.set('redirect', requestedUrl);
    
    return context.redirect(`/admin/login?${searchParams.toString()}`);
  }
  return null; // 明确返回null表示验证通过
}

// API认证中间件
export async function requireApiAuth(context: { request: Request, cookies?: { get: (name: string) => { value: string } | undefined } }) {
  if (!await isAuthenticated(context)) {
    return new Response(JSON.stringify({ error: '未授权访问' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return null; // 明确返回null表示验证通过
} 