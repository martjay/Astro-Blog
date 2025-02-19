import type { APIRoute } from 'astro';
import { comments } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { keyword } = await request.json();
    
    if (!keyword) {
      return new Response(JSON.stringify({ error: '缺少关键词' }), {
        status: 400,
      });
    }

    const result = comments.addSpamKeyword(keyword);
    return new Response(JSON.stringify(result), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { keyword } = await request.json();
    
    if (!keyword) {
      return new Response(JSON.stringify({ error: '缺少关键词' }), {
        status: 400,
      });
    }

    const result = comments.removeSpamKeyword(keyword);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
    });
  }
}; 