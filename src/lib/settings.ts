import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database(join(process.cwd(), 'data/blog.db'));

// 创建设置表
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS about_page (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS home_components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export interface Settings {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  siteAuthor: string;
  siteEmail: string;
  postsPerPage: number;
  enableComments: boolean;
  enableEmailNotification: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  icpNumber: string;
  analyticsCode: string;
  heroTitle: string;
  heroSubtitle: string;
  showHero: boolean;
}

const defaultSettings: Settings = {
  siteTitle: '我的博客',
  siteDescription: '一个基于 Astro 的博客',
  siteKeywords: 'blog,astro,typescript',
  siteAuthor: 'Admin',
  siteEmail: 'admin@example.com',
  postsPerPage: 10,
  enableComments: true,
  enableEmailNotification: false,
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  icpNumber: '',
  analyticsCode: '',
  heroTitle: '欢迎来到我的博客',
  heroSubtitle: '分享技术，记录生活，探索未知的可能',
  showHero: true
};

// 初始化默认设置
const initDefaultSettings = () => {
  const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  Object.entries(defaultSettings).forEach(([key, value]) => {
    stmt.run(key, String(value));
  });
};

// 确保默认设置存在
initDefaultSettings();

// 默认的关于页面内容模板
const defaultAboutContent = `
<div class="grid gap-8 md:grid-cols-2">
  <!-- 个人简介 -->
  <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
    <div class="flex items-center gap-4 mb-4">
      <div class="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
      </div>
      <h2 class="text-2xl font-bold gradient-text">个人简介</h2>
    </div>
    <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
      我是一名热爱技术的开发者，喜欢探索新技术，分享学习心得。
      这个博客主要记录我在技术学习和工作中的经验和思考。
    </p>
  </div>

  <!-- 联系方式 -->
  <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
    <div class="flex items-center gap-4 mb-4">
      <div class="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
      </div>
      <h2 class="text-2xl font-bold gradient-text">联系方式</h2>
    </div>
    <ul class="space-y-3 text-gray-600 dark:text-gray-400">
      <li class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
        <span>your.email@example.com</span>
      </li>
      <li class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
        </svg>
        <a href="https://github.com/yourusername" target="_blank" class="hover:text-blue-500">GitHub</a>
      </li>
    </ul>
  </div>
</div>

<!-- 关于本站 -->
<div class="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
  <div class="flex items-center gap-4 mb-6">
    <div class="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
      </svg>
    </div>
    <h2 class="text-2xl font-bold gradient-text">关于本站</h2>
  </div>
  
  <div class="space-y-6 text-gray-600 dark:text-gray-400">
    <p class="leading-relaxed">
      本站使用 Astro 构建，采用以下技术：
    </p>
    <div class="grid gap-4 md:grid-cols-3">
      <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h3 class="font-bold mb-2">Astro</h3>
        <p class="text-sm">静态站点生成器，提供极致的性能和开发体验</p>
      </div>
      <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h3 class="font-bold mb-2">TailwindCSS</h3>
        <p class="text-sm">原子化 CSS 框架，实现灵活的样式定制</p>
      </div>
      <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h3 class="font-bold mb-2">SQLite</h3>
        <p class="text-sm">轻量级数据库，存储评论和其他动态数据</p>
      </div>
    </div>
  </div>
</div>

<!-- 版权声明 -->
<div class="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
  <div class="flex items-center gap-4 mb-4">
    <div class="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path>
      </svg>
    </div>
    <h2 class="text-2xl font-bold gradient-text">版权声明</h2>
  </div>
  <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
    除特别声明外，本站所有文章均采用
    <a
      href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
      target="_blank"
      class="text-blue-500 hover:text-blue-600"
    >
      知识共享署名-非商业性使用-相同方式共享 4.0 国际许可协议
    </a>
    进行许可。
  </p>
</div>
`;

// 默认的首页组件
const defaultComponents = [
  {
    type: 'tech',
    title: '技术探索',
    description: '分享最新的技术趋势和开发经验，深入浅出的技术文章。',
    icon: 'code',
    order_index: 0
  },
  {
    type: 'life',
    title: '生活感悟',
    description: '记录生活中的点点滴滴，分享个人成长和思考。',
    icon: 'heart',
    order_index: 1
  },
  {
    type: 'knowledge',
    title: '知识分享',
    description: '整理学习笔记，构建知识体系，与读者共同进步。',
    icon: 'book',
    order_index: 2
  }
];

// 初始化默认组件
const initDefaultComponents = () => {
  // 先检查是否已有组件
  const count = db.prepare('SELECT COUNT(*) as count FROM home_components').get() as { count: number };
  
  // 只有在没有组件时才初始化
  if (count.count === 0) {
    const stmt = db.prepare(`
      INSERT INTO home_components (type, title, description, icon, order_index, is_visible)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    
    defaultComponents.forEach(comp => {
      stmt.run(comp.type, comp.title, comp.description, comp.icon, comp.order_index);
    });
  }
};

// 确保默认组件存在
initDefaultComponents();

export interface HomeComponent {
  id: number;
  type: string;
  title: string;
  description: string;
  icon: string;
  order_index: number;
  is_visible: boolean;
  updated_at: string;
}

export const settings = {
  // 获取所有设置
  getAll: (): Settings => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: keyof Settings; value: string }[];
    const result = { ...defaultSettings };
    
    rows.forEach(row => {
      const value = row.value;
      const key = row.key as keyof Settings;
      
      if (key in defaultSettings) {
        if (typeof defaultSettings[key] === 'boolean') {
          (result[key] as boolean) = value === 'true';
        } else if (typeof defaultSettings[key] === 'number') {
          (result[key] as number) = Number(value);
        } else {
          (result[key] as string) = value;
        }
      }
    });
    
    return result;
  },

  // 更新单个设置
  update: (key: keyof Settings, value: string | number | boolean) => {
    return db.prepare(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'
    ).run(key, String(value));
  },

  // 更新所有设置
  updateAll: (newSettings: Partial<Settings>) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    
    Object.entries(newSettings).forEach(([key, value]) => {
      if (value !== undefined && key in defaultSettings) {
        stmt.run(key, String(value));
      }
    });
  },

  // 获取关于页面内容
  getAboutContent: () => {
    const row = db.prepare('SELECT content FROM about_page ORDER BY id DESC LIMIT 1').get();
    return row?.content || defaultAboutContent;
  },

  // 更新关于页面内容
  updateAboutContent: (content: string) => {
    return db.prepare('INSERT INTO about_page (content) VALUES (?)').run(content);
  },

  // 获取关于页面更新历史
  getAboutHistory: () => {
    return db.prepare(`
      SELECT id, content, updated_at 
      FROM about_page 
      ORDER BY id DESC 
      LIMIT 10
    `).all();
  },

  // 获取所有首页组件
  getHomeComponents: () => {
    return db.prepare(`
      SELECT * FROM home_components 
      ORDER BY order_index ASC, id ASC
    `).all() as HomeComponent[];
  },

  // 获取可见的首页组件
  getVisibleHomeComponents: () => {
    return db.prepare(`
      SELECT * FROM home_components 
      WHERE is_visible = 1
      ORDER BY order_index ASC, id ASC
    `).all() as HomeComponent[];
  },

  // 更新组件
  updateHomeComponent: (id: number, data: Partial<HomeComponent>) => {
    const fields = Object.keys(data)
      .map(key => `${key} = @${key}`)
      .join(', ');
    const stmt = db.prepare(`UPDATE home_components SET ${fields} WHERE id = @id`);
    return stmt.run({ ...data, id });
  },

  // 更新组件顺序
  updateHomeComponentOrder: (orderedIds: number[]) => {
    const stmt = db.prepare('UPDATE home_components SET order_index = ? WHERE id = ?');
    orderedIds.forEach((id, index) => {
      stmt.run(index, id);
    });
  },

  // 切换组件可见性
  toggleHomeComponentVisibility: (id: number) => {
    return db.prepare(`
      UPDATE home_components 
      SET is_visible = NOT is_visible 
      WHERE id = ?
    `).run(id);
  },

  // 重置为默认组件
  resetHomeComponents: () => {
    db.prepare('DELETE FROM home_components').run();
    initDefaultComponents();
    return settings.getHomeComponents();
  }
}; 