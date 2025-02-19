import type { APIRoute } from 'astro';
import { auth } from '../../../lib/auth';
import { requireApiAuth } from '../../../middleware/auth';

export const POST: APIRoute = async (context) => {
  console.log('Password change request received');
  
  try {
    // 验证管理员身份
    const authResponse = await requireApiAuth(context);
    if (authResponse) {
      console.log('Authentication failed');
      return authResponse;
    }

    const body = await context.request.json();
    console.log('Request body parsed');

    const { currentPassword, newPassword } = body;

    // 验证请求数据
    if (!currentPassword || !newPassword) {
      console.log('Missing required fields');
      return new Response(JSON.stringify({ error: '请输入所有必填项' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      console.log('New password too short');
      return new Response(JSON.stringify({ error: '新密码长度不能小于6位' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取当前会话信息
    const sessionId = context.cookies.get('session')?.value;
    if (!sessionId) {
      console.log('No session found');
      return new Response(JSON.stringify({ error: '会话已过期' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = auth.verifySession(sessionId);
    if (!session || !session.username) {
      console.log('Invalid session');
      return new Response(JSON.stringify({ error: '会话已过期' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Verifying current password');
    // 验证当前密码
    const admin = auth.verifyCredentials(session.username, currentPassword);
    if (!admin) {
      console.log('Current password incorrect');
      return new Response(JSON.stringify({ error: '当前密码错误' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Updating password');
    // 更新密码
    const updateResult = auth.updatePassword(session.username, newPassword);
    if (!updateResult?.changes) {
      console.log('Password update failed');
      throw new Error('密码更新失败');
    }

    console.log('Deleting all sessions');
    // 删除所有会话，强制重新登录
    auth.deleteAllSessions(session.username);

    console.log('Password change successful');
    return new Response(JSON.stringify({ 
      success: true,
      message: '密码修改成功，请重新登录'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in password change:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : '密码修改失败，请重试'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 