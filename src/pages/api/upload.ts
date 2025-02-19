import type { APIRoute } from 'astro';
import { requireApiAuth } from '../../middleware/auth';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

export const POST: APIRoute = async (context) => {
  // 验证管理员身份
  const authResponse = await requireApiAuth(context);
  if (authResponse) return authResponse;

  try {
    const formData = await context.request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: '没有找到上传的文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: '只允许上传图片文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证文件大小（限制为5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: '文件大小不能超过5MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 生成安全的文件名
    const timestamp = Date.now();
    const originalName = file.name.toLowerCase();
    const extension = originalName.split('.').pop() || '';
    const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 保存文件
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // 返回上传成功的响应
    // TinyMCE 期望的响应格式
    return new Response(JSON.stringify({
      location: `/uploads/${fileName}`, // 返回相对路径
      title: originalName.replace(`.${extension}`, ''), // 添加标题
      alt: originalName.replace(`.${extension}`, ''), // 添加替代文本
      size: file.size, // 添加文件大小
      type: file.type, // 添加文件类型
      width: 800, // 默认宽度
      height: 600 // 默认高度
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return new Response(JSON.stringify({ error: '文件上传失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 