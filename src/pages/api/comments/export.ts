import type { APIRoute } from 'astro';
import { comments } from '../../../lib/db';
import { isAuthenticated } from '../../../middleware/auth';
import { createObjectCsvWriter } from 'csv-writer';
import { join } from 'path';
import { mkdir, readFile } from 'fs/promises';

export const GET: APIRoute = async (context) => {
  if (!await isAuthenticated(context)) {
    return new Response(JSON.stringify({ error: '未授权' }), { status: 401 });
  }

  try {
    const allComments = comments.getAllForAdmin();
    
    // 确保导出目录存在
    const exportDir = join(process.cwd(), 'tmp');
    try {
      await mkdir(exportDir, { recursive: true });
    } catch (err) {
      // 如果目录已存在，忽略错误
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }

    const exportPath = join(exportDir, 'comments-export.csv');
    
    // 创建 CSV 文件
    const csvWriter = createObjectCsvWriter({
      path: exportPath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'post_slug', title: '文章' },
        { id: 'author', title: '作者' },
        { id: 'content', title: '内容' },
        { id: 'status', title: '状态' },
        { id: 'created_at', title: '创建时间' },
        { id: 'ip', title: 'IP地址' },
      ],
      encoding: 'utf8',
    });

    await csvWriter.writeRecords(allComments);

    // 读取生成的文件
    const file = await readFile(exportPath, 'utf8');

    return new Response(file, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=comments-export.csv'
      }
    });
  } catch (error) {
    console.error('Error exporting comments:', error);
    return new Response(JSON.stringify({ error: '导出失败：' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 