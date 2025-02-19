import type { APIRoute } from 'astro';
import { requireApiAuth } from '../../../middleware/auth';
import { categories } from '../../../lib/categories';

export const PUT: APIRoute = async (context) => {
  // 验证管理员身份
  const authResponse = await requireApiAuth(context);
  if (authResponse) return authResponse;

  try {
    const { id } = context.params;
    if (!id) {
      return new Response(JSON.stringify({ error: '无效的分类ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await context.request.json();
    
    // 验证必填字段
    if (!data.name || !data.slug) {
      return new Response(JSON.stringify({ error: '名称和别名不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证slug格式
    if (!/^[a-z0-9-]+$/.test(data.slug)) {
      return new Response(JSON.stringify({ error: '别名只能包含小写字母、数字和连字符' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查slug是否已存在
    if (categories.slugExists(data.slug, Number(id))) {
      return new Response(JSON.stringify({ error: '别名已存在' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = categories.update(Number(id), data);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return new Response(JSON.stringify({ error: '更新分类失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async (context) => {
  // 验证管理员身份
  const authResponse = await requireApiAuth(context);
  if (authResponse) return authResponse;

  try {
    const { id } = context.params;
    if (!id) {
      return new Response(JSON.stringify({ error: '无效的分类ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = categories.delete(Number(id));
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return new Response(JSON.stringify({ error: '删除分类失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 