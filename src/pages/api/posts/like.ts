import type { APIRoute } from 'astro';
import { posts } from '../../../lib/posts';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { slug } = await request.json();
    
    // 获取客户端IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1';

    const liked = posts.toggleLike(slug, ip.split(',')[0].trim());
    const post = posts.getBySlug(slug);

    return new Response(JSON.stringify({
      liked,
      count: post.likes
    }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: '操作失败' }), {
      status: 500,
    });
  }
}; 