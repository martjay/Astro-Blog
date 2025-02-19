import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../src/content/blog');

// 监视内容目录的变化
fs.watch(CONTENT_DIR, { recursive: true }, (eventType, filename) => {
  if (filename && (filename.endsWith('.md') || filename.endsWith('.mdx'))) {
    console.log(`检测到内容变化: ${filename}`);
    // 运行搜索索引生成脚本
    const generateScript = path.join(__dirname, 'generate-search-index.js');
    const child = spawn('node', [generateScript], {
      stdio: 'inherit',
      shell: true
    });

    child.on('error', (error) => {
      console.error('Error running generate-search-index.js:', error);
    });
  }
}); 