import type { APIRoute } from 'astro';
import { comments } from '../../lib/db';
import { captcha } from '../../lib/captcha';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    console.log('Received comment data:', body); // 添加日志

    // 验证码检查（如果不是管理员）
    if (!body.isAdmin) {
      if (!body.captcha || !body.captchaSession || 
          !captcha.verify(body.captchaSession, body.captcha)) {
        return new Response(JSON.stringify({ error: 'invalid_captcha' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }

    // 获取客户端IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';

    // 详细的字段验证
    const requiredFields = ['post_slug', 'author', 'content'];
    const missingFields = requiredFields.filter(field => !body[field]?.trim());
    
    if (missingFields.length > 0) {
      return new Response(JSON.stringify({ 
        error: `缺少必要字段: ${missingFields.join(', ')}`,
        missingFields
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // 添加评论，管理员评论直接设置为已审核状态
    const result = comments.add({
      post_slug: body.post_slug.trim(),
      author: body.author.trim(),
      content: body.content.trim(),
      parent_id: body.parent_id || null,
      ip: ip.split(',')[0].trim(),
      email: body.email?.trim() || null,
      status: body.isAdmin ? 'approved' : 'pending'
    });

    return new Response(JSON.stringify({
      success: true,
      message: body.isAdmin ? '评论已发表' : '评论已提交，等待审核',
      result
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in comments API:', error);

    if (error.message === 'IP已被封禁' || error.message === '评论太频繁，请稍后再试') {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({ error: '评论提交失败，请重试' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 