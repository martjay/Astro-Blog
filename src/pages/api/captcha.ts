import type { APIRoute } from 'astro';
import { captcha } from '../../lib/captcha';

export const GET: APIRoute = async () => {
  const { svg, sessionId } = captcha.generate();

  return new Response(JSON.stringify({ svg, sessionId }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}; 