import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// 从文章内容中提取第一张图片URL
function extractFirstImage(content: string): string | null {
  // 匹配 Markdown 图片语法 ![alt](url)
  const markdownImgRegex = /!\[.*?\]\((.*?)\)/;
  // 匹配 HTML 图片标签 <img src="url" />
  const htmlImgRegex = /<img[^>]+src="([^">]+)"/;
  
  // 先尝试匹配 Markdown 格式
  const markdownMatch = content.match(markdownImgRegex);
  if (markdownMatch) {
    return markdownMatch[1];
  }
  
  // 如果没有找到 Markdown 格式的图片，尝试匹配 HTML 格式
  const htmlMatch = content.match(htmlImgRegex);
  return htmlMatch ? htmlMatch[1] : null;
}

export const GET: APIRoute = async () => {
  try {
    const posts = await getCollection('blog');
    const postList = posts
      .filter(post => !post.data.draft)
      .map(post => {
        // 优先使用文章的 heroImage，如果没有则尝试从内容中提取第一张图片
        const firstImage = post.data.heroImage || extractFirstImage(post.body);
        console.log(`Post "${post.slug}": Found image - ${firstImage}`); // 添加日志
        return {
          title: post.data.title,
          slug: post.slug,
          pubDate: post.data.pubDate,
          description: post.data.description,
          coverImage: firstImage,
          category: post.data.category,
          tags: post.data.tags
        };
      })
      .sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

    return new Response(JSON.stringify(postList), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error getting post list:', error);
    return new Response(JSON.stringify({ error: '获取文章列表失败' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 