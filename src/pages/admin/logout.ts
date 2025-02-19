import type { APIRoute } from 'astro';
import { auth } from '../../lib/auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const sessionId = cookies.get('session')?.value;
  if (sessionId) {
    auth.deleteSession(sessionId);
    cookies.delete('session', { path: '/' });
  }
  return redirect('/admin/login');
}; 