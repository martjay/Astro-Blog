import type { APIRoute } from 'astro';
import { requireApiAuth } from '../../middleware/auth';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

export const POST: APIRoute = async (context) => {
  console.log('POST request received for new article');
  
  try {
    // 验证管理员身份
    const authResponse = await requireApiAuth(context);
    if (authResponse) {
      console.log('Authentication failed');
      return authResponse;
    }

    const { slug, content } = await context.request.json();
    console.log('Request body parsed:', { slug });

    if (!slug || !content) {
      console.error('Missing required fields');
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
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

    // 检查文件是否已存在
    const filePath = path.join(blogDir, `${slug}.md`);
    console.log('Article file path:', filePath);
    
    try {
      await fs.access(filePath);
      console.error('Article already exists');
      return new Response(JSON.stringify({ error: '文章已存在' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {
      // 文件不存在，可以继续
      console.log('Article file does not exist, proceeding with creation');
    }

    // 保存文件
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

    console.log('Article creation completed successfully');
    return new Response(JSON.stringify({ 
      success: true,
      message: '文章已保存'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating article:', error);
    return new Response(JSON.stringify({ error: '创建文章失败：' + (error.message || '未知错误') }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 