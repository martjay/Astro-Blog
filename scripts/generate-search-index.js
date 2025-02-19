import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../src/content/blog');
const OUTPUT_FILE = path.join(__dirname, '../public/search-index.json');

async function generateSearchIndex() {
  try {
    // 确保 public 目录存在
    const publicDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // 读取所有 markdown 文件
    const files = fs.readdirSync(CONTENT_DIR);
    const posts = files
      .filter(file => file.endsWith('.md') || file.endsWith('.mdx'))
      .map(file => {
        const filePath = path.join(CONTENT_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const { data } = matter(content);
        
        return {
          title: data.title || '',
          description: data.description || '',
          slug: file.replace(/\.(md|mdx)$/, ''),
          date: data.date ? new Date(data.date).toISOString() : null,
          tags: data.tags || []
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // 写入搜索索引文件
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2));
    console.log('Search index generated successfully!');
  } catch (error) {
    console.error('Error generating search index:', error);
    process.exit(1);
  }
}

generateSearchIndex(); 