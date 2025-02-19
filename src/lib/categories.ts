import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database(join(process.cwd(), 'data/blog.db'));

// 创建分类表
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id INTEGER DEFAULT NULL,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
  );

  CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
`);

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  order_index: number;
  created_at: string;
}

export const categories = {
  // 获取所有分类
  getAll: () => {
    return db.prepare('SELECT * FROM categories ORDER BY order_index ASC, id ASC').all() as Category[];
  },

  // 获取分类树结构
  getTree: () => {
    const allCategories = categories.getAll();
    const categoryMap = new Map<number, Category & { children: Category[] }>();
    const roots: (Category & { children: Category[] })[] = [];

    allCategories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    allCategories.forEach(cat => {
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children.push(categoryMap.get(cat.id)!);
        }
      } else {
        roots.push(categoryMap.get(cat.id)!);
      }
    });

    return roots;
  },

  // 根据slug获取分类
  getBySlug: (slug: string) => {
    return db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug) as Category | undefined;
  },

  // 添加分类
  add: (category: Omit<Category, 'id' | 'created_at'>) => {
    const stmt = db.prepare(`
      INSERT INTO categories (name, slug, description, parent_id, order_index)
      VALUES (@name, @slug, @description, @parent_id, @order_index)
    `);
    return stmt.run(category);
  },

  // 更新分类
  update: (id: number, category: Partial<Omit<Category, 'id' | 'created_at'>>) => {
    const fields = Object.keys(category)
      .map(key => `${key} = @${key}`)
      .join(', ');
    const stmt = db.prepare(`UPDATE categories SET ${fields} WHERE id = @id`);
    return stmt.run({ ...category, id });
  },

  // 删除分类
  delete: (id: number) => {
    // 先将子分类的parent_id设为null
    db.prepare('UPDATE categories SET parent_id = NULL WHERE parent_id = ?').run(id);
    // 然后删除分类
    return db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  },

  // 检查slug是否已存在
  slugExists: (slug: string, excludeId?: number) => {
    const query = excludeId
      ? 'SELECT 1 FROM categories WHERE slug = ? AND id != ?'
      : 'SELECT 1 FROM categories WHERE slug = ?';
    const params = excludeId ? [slug, excludeId] : [slug];
    return !!db.prepare(query).get(params);
  }
}; 