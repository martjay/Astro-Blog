import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import Database from 'better-sqlite3';
import { join } from 'path';
import { readdirSync, readFileSync, statSync } from 'fs';
import matter from 'gray-matter';
import { marked } from 'marked';
import { remark } from 'remark';
import remarkToc from 'remark-toc';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkPrism from 'remark-prism';

const db = new Database(join(process.cwd(), 'data/blog.db'));

// 创建文章相关表
db.exec(`
  CREATE TABLE IF NOT EXISTS post_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_slug TEXT NOT NULL UNIQUE,
    views INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS post_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_slug TEXT NOT NULL,
    ip TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_slug, ip)
  );

  CREATE TABLE IF NOT EXISTS post_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS post_tag_relations (
    post_slug TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    FOREIGN KEY (tag_id) REFERENCES post_tags(id),
    UNIQUE(post_slug, tag_id)
  );
`);

export interface Post {
  slug: string;
  title: string;
  date: string;
  content: string;
  excerpt: string;
  tags: string[];
  cover?: string;
  author?: string;
  draft?: boolean;
  views: number;
  likes: number;
  readingTime: number;
  toc: string;
}

const POSTS_DIR = join(process.cwd(), 'src/content/posts');

export const posts = {
  getAll: async (includeDrafts = false) => {
    const posts = await getCollection('blog');
    return posts
      .filter(post => includeDrafts || !post.data.draft)
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  },

  getBySlug: async (slug: string) => {
    const posts = await getCollection('blog');
    return posts.find(post => post.slug === slug);
  },

  getByTag: async (tag: string) => {
    const posts = await getCollection('blog');
    return posts.filter(post => post.data.tags.includes(tag));
  },

  getAllTags: async () => {
    const posts = await getCollection('blog');
    const tagCounts = new Map<string, number>();

    posts.forEach(post => {
      post.data.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries()).map(([name, count]) => ({
      name,
      count
    }));
  },

  incrementViews: (slug: string) => {
    db.prepare(`
      INSERT INTO post_views (post_slug, views) 
      VALUES (?, 1)
      ON CONFLICT(post_slug) DO UPDATE SET views = views + 1
    `).run(slug);
  },

  getViews: (slug: string) => {
    return db.prepare('SELECT views FROM post_views WHERE post_slug = ?').get(slug)?.views || 0;
  },

  toggleLike: (slug: string, ip: string) => {
    try {
      db.prepare(`
        INSERT INTO post_likes (post_slug, ip)
        VALUES (?, ?)
      `).run(slug, ip);
      return true;
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        db.prepare('DELETE FROM post_likes WHERE post_slug = ? AND ip = ?').run(slug, ip);
        return false;
      }
      throw error;
    }
  },

  getLikes: (slug: string) => {
    return db.prepare('SELECT COUNT(*) as count FROM post_likes WHERE post_slug = ?').get(slug)?.count || 0;
  },

  getRelated: async (currentSlug: string, limit = 3) => {
    const posts = await getCollection('blog');
    const currentPost = posts.find(post => post.slug === currentSlug);
    if (!currentPost) return [];
    
    return posts
      .filter(post => post.slug !== currentSlug)
      .map(post => ({
        post,
        commonTags: post.data.tags.filter(tag => currentPost.data.tags.includes(tag)).length
      }))
      .sort((a, b) => b.commonTags - a.commonTags)
      .slice(0, limit)
      .map(({ post }) => post);
  },

  getArchive: async () => {
    const posts = await getCollection('blog');
    const archive = new Map<string, CollectionEntry<'blog'>[]>();

    posts.forEach(post => {
      const year = post.data.pubDate.getFullYear().toString();
      if (!archive.has(year)) {
        archive.set(year, []);
      }
      archive.get(year)!.push(post);
    });

    return Array.from(archive.entries())
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([year, posts]) => ({
        year,
        posts: posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      }));
  },

  search: async (query: string) => {
    const posts = await getCollection('blog');
    const searchTerms = query.toLowerCase().split(' ');

    return posts.filter(post => {
      const searchText = `${post.data.title} ${post.data.description} ${post.data.tags.join(' ')}`.toLowerCase();
      return searchTerms.every(term => searchText.includes(term));
    });
  }
}; 