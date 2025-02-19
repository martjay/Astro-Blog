# Astro 个人博客系统

一个基于 Astro 构建的现代化个人博客系统，具有美观的界面和强大的后台管理功能。

## 功能特性

### 前台功能
- 响应式设计，支持移动端和桌面端
- 深色模式支持
- 文章搜索功能
- 文章分类和标签系统
- 文章归档功能
- 相关文章推荐
- 评论系统
- RSS 订阅支持
- 图片预览功能
- 阅读进度指示器
- SEO 优化

### 后台功能
- 安全的管理员登录系统
- 文章管理（创建、编辑、删除）
- 富文本编辑器（TinyMCE）
- 图片上传功能
- 评论管理系统
- 首页组件管理
- 网站设置管理
- 数据库管理界面
- 访问统计
- 垃圾评论过滤

## 技术栈

- **框架**: Astro v4.x
- **UI**: TailwindCSS
- **数据库**: SQLite3 (better-sqlite3)
- **编辑器**: TinyMCE
- **认证**: 自定义 Session 管理
- **其他工具**:
  - AlpineJS (交互功能)
  - Chart.js (数据可视化)
  - marked (Markdown 渲染)
  - sanitize-html (XSS 防护)
  - svg-captcha (验证码生成)

## 安装说明

1. 克隆仓库：
\`\`\`bash
git clone https://github.com/yourusername/blog.git
cd blog
\`\`\`

2. 安装依赖：
\`\`\`bash
npm install
\`\`\`

3. 创建环境配置文件：
\`\`\`bash
cp .env.example .env
\`\`\`

4. 修改 .env 文件，配置必要的环境变量：
\`\`\`
PUBLIC_TINYMCE_API_KEY=your_tinymce_api_key
SITE_URL=http://localhost:4321
\`\`\`

5. 初始化数据库和管理员账户：
\`\`\`bash
node scripts/init-admin.js
\`\`\`

6. 启动开发服务器：
\`\`\`bash
npm run dev
\`\`\`

或者使用提供的启动脚本：
\`\`\`bash
./start.bat  # Windows
\`\`\`

## 目录结构

\`\`\`
├── data/               # 数据库文件目录
├── public/            # 静态资源
│   ├── uploads/      # 上传的文件
│   └── tinymce/      # 编辑器资源
├── scripts/          # 脚本文件
├── src/
│   ├── components/   # 组件
│   ├── content/      # 博客内容
│   ├── layouts/      # 页面布局
│   ├── lib/          # 工具库
│   ├── middleware/   # 中间件
│   ├── pages/        # 页面
│   └── styles/       # 样式文件
└── .env              # 环境变量
\`\`\`

## 使用说明

1. 访问 \`http://localhost:4321\` 查看博客前台
2. 访问 \`http://localhost:4321/admin/login\` 进入管理后台
   - 默认管理员账号：admin
   - 默认密码：admin123（请及时修改）

## 部署说明

1. 构建项目：
\`\`\`bash
npm run build
\`\`\`

2. 启动生产服务器：
\`\`\`bash
npm run start
\`\`\`

## 注意事项

- 请及时修改默认管理员密码
- 定期备份数据库文件
- 确保上传目录具有适当的写入权限
- 生产环境部署时建议使用反向代理（如 Nginx）

## 开发计划

- [ ] 评论系统邮件通知
- [ ] 文章版本控制
- [ ] 自定义主题支持
- [ ] 多语言支持
- [ ] 图片压缩和优化
- [ ] 文章导入/导出功能

## 贡献指南

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT License 