import type { APIRoute } from 'astro';
import { requireApiAuth } from '../../../middleware/auth';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { getCollection } from 'astro:content';

export const PUT: APIRoute = async (context) => {
  console.log('PUT request received for article update');
  
  try {
    // 验证管理员身份
    const authResponse = await requireApiAuth(context);
    if (authResponse) {
      console.log('Authentication failed');
      return authResponse;
    }

    const { slug } = context.params;
    if (!slug) {
      console.error('No slug provided');
      return new Response(JSON.stringify({ error: '无效的文章ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const decodedSlug = decodeURIComponent(slug);
    console.log('Processing update for slug:', decodedSlug);

    // 验证文章是否存在
    const posts = await getCollection('blog');
    const post = posts.find(p => p.slug === decodedSlug);
    
    if (!post) {
      console.error('Article not found in collection');
      return new Response(JSON.stringify({ error: '文章不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let requestBody;
    try {
      requestBody = await context.request.json();
      console.log('Request body received');
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(JSON.stringify({ error: '无效的请求数据' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { content } = requestBody;
    if (!content) {
      console.error('No content provided');
      return new Response(JSON.stringify({ error: '文章内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证文章内容格式
    try {
      console.log('Validating article content format');
      const { data } = matter(content);
      
      // 验证必需字段
      const requiredFields = ['title', 'description', 'pubDate', 'tags'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        return new Response(JSON.stringify({ 
          error: `文章缺少必需字段: ${missingFields.join(', ')}` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 验证日期格式
      if (!(data.pubDate instanceof Date) && isNaN(new Date(data.pubDate).getTime())) {
        console.error('Invalid date format');
        return new Response(JSON.stringify({ error: '发布日期格式无效' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 验证标签格式
      if (!Array.isArray(data.tags)) {
        console.error('Invalid tags format');
        return new Response(JSON.stringify({ error: '标签必须是数组格式' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log('Article content validation passed');
    } catch (error) {
      console.error('Invalid article format:', error);
      return new Response(JSON.stringify({ error: '文章格式无效：' + error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查文章目录是否存在
    const blogDir = path.join(process.cwd(), 'src/content/blog');
    console.log('Blog directory path:', blogDir);
    
    try {
      await fs.access(blogDir);
      console.log('Blog directory exists');
    } catch {
      console.log('Creating blog directory');
      await fs.mkdir(blogDir, { recursive: true });
    }

    // 保存文件
    const filePath = path.join(blogDir, `${decodedSlug}.md`);
    console.log('Article file path:', filePath);
    
    try {
      console.log('Writing article content to file');
      await fs.writeFile(filePath, content, 'utf-8');
      console.log('Article content written successfully');
    } catch (error) {
      console.error('Error writing file:', error);
      return new Response(JSON.stringify({ error: '保存文件失败：' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Article update completed successfully');
    return new Response(JSON.stringify({ 
      success: true,
      message: '文章已保存'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return new Response(JSON.stringify({ error: '更新文章失败：' + (error.message || '未知错误') }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async (context) => {
  console.log('DELETE request received for article');
  
  try {
    // 验证管理员身份
    const authResponse = await requireApiAuth(context);
    if (authResponse) {
      console.log('Authentication failed');
      return authResponse;
    }

    const { slug } = context.params;
    if (!slug) {
      console.error('No slug provided');
      return new Response(JSON.stringify({ error: '无效的文章ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const filePath = path.join(process.cwd(), 'src/content/blog', `${slug}.md`);
    console.log('Article file path:', filePath);

    // 检查文件是否存在
    try {
      await fs.access(filePath);
      console.log('Article file exists');
    } catch {
      console.error('Article file not found');
      return new Response(JSON.stringify({ error: '文章不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 删除文件
    try {
      console.log('Deleting article file');
      await fs.unlink(filePath);
      console.log('Article file deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      return new Response(JSON.stringify({ error: '删除文件失败：' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Article deletion completed successfully');
    return new Response(JSON.stringify({ 
      success: true,
      message: '文章已删除'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return new Response(JSON.stringify({ error: '删除文章失败：' + (error.message || '未知错误') }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 