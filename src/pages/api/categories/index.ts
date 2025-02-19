import type { APIRoute } from 'astro';
import { requireApiAuth } from '../../../middleware/auth';
import { categories } from '../../../lib/categories';

export const POST: APIRoute = async (context) => {
  // 验证管理员身份
  const authResponse = await requireApiAuth(context);
  if (authResponse) return authResponse;

  try {
    const data = await context.request.json();
    
    // 验证必填字段
    if (!data.name || !data.slug) {
      return new Response(JSON.stringify({ error: '名称和别名不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证slug格式
    const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    if (!slugRegex.test(data.slug)) {
      return new Response(JSON.stringify({ error: '别名只能包含小写字母、数字和连字符，且不能以连字符开头或结尾' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查slug是否已存在
    if (categories.slugExists(data.slug)) {
      return new Response(JSON.stringify({ error: '别名已存在' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 处理可选字段
    const categoryData = {
      name: data.name.trim(),
      slug: data.slug.trim(),
      description: data.description?.trim(),
      parent_id: data.parent_id ? Number(data.parent_id) : null,
      order_index: data.order_index ? Number(data.order_index) : 0
    };

    const result = categories.add(categoryData);
    return new Response(JSON.stringify({
      success: true,
      message: '分类添加成功',
      result
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : '创建分类失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 