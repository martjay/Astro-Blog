## SpecStory

## Astro Blog Codebase Overview (2025/2/18 17:57:17)

_**User**_

hi

---

_**Assistant**_

你好！我看到你提供了一个基于 Astro 框架的博客系统的代码库。这个系统包含了很多功能,包括:

1. 响应式设计和暗色主题支持

```1:37:src/components/ThemeToggle.astro
---
---
<button id="themeToggle" class="p-2">
  <svg width="20" height="20" viewBox="0 0 24 24" class="dark:hidden">
    <path
      fill="currentColor"
      d="M12 18c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6zm0-10c-2.206 0-4 1.794-4 4s1.794 4 4 4 4-1.794 4-4-1.794-4-4-4z"
    />
  </svg>
  <svg width="20" height="20" viewBox="0 0 24 24" class="hidden dark:block">
    <path
      fill="currentColor"
      d="M12 11.807A9.002 9.002 0 0 1 10.049 2a9.942 9.942 0 0 0-5.12 2.735c-3.905 3.905-3.905 10.237 0 14.142 3.906 3.906 10.237 3.905 14.143 0a9.946 9.946 0 0 0 2.735-5.119A9.003 9.003 0 0 1 12 11.807z"
    />
  </svg>
</button>

<script>
  function handleThemeToggle() {
    const button = document.getElementById('themeToggle');
    if (!button) return;

    button.addEventListener('click', () => {
      const element = document.documentElement;
      element.classList.toggle('dark');

      const isDark = element.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  // 初始化主题切换按钮
  handleThemeToggle();

  // 在页面切换后重新初始化
  document.addEventListener('astro:page-load', handleThemeToggle);
</script> 
```


2. 文章目录导航

```1:66:src/components/TableOfContents.astro
---
const { headings } = Astro.props;

type Heading = {
  depth: number;
  slug: string;
  text: string;
};

function buildToc(headings: Heading[]) {
  const toc: Heading[] = [];
  const parentHeadings = new Map();
  
  headings.forEach((h) => {
    const heading = { ...h, subheadings: [] };
    parentHeadings.set(h.depth, heading);
    
    if (h.depth === 2) {
      toc.push(heading);
    } else {
      const parent = parentHeadings.get(h.depth - 1);
      if (parent) {
        parent.subheadings.push(heading);
      }
    }
  });
  
  return toc;
}

const toc = buildToc(headings);
---

<nav class="toc hidden lg:block">
  <h2 class="text-lg font-semibold mb-4">目录</h2>
  <ul class="space-y-2">
    {toc.map((heading) => (
      <li>
        <a href={`#${heading.slug}`} class="hover:text-blue-500 transition-colors">
          {heading.text}
        </a>
        {heading.subheadings.length > 0 && (
          <ul class="ml-4 mt-2 space-y-2">
            {heading.subheadings.map((subheading) => (
              <li>
                <a href={`#${subheading.slug}`} class="hover:text-blue-500 transition-colors">
                  {subheading.text}
                </a>
              </li>
            ))}
          </ul>
        )}
      </li>
    ))}
  </ul>
</nav>

<style>
  .toc {
    position: sticky;
    top: 2rem;
    max-height: calc(100vh - 4rem);
    overflow-y: auto;
    padding-right: 1rem;
  }
</style> 
```


3. 评论系统

```39:155:src/components/Comments.astro
<div class={`comments ${className}`}>
  <h3 class="text-xl font-bold mb-6">评论</h3>
  
  <form id="comment-form" class="mb-8">
    <div class="mb-4">
      <label for="author" class="block text-sm font-medium mb-1">昵称</label>
      <input
        type="text"
        id="author"
        name="author"
        required
        class="w-full px-3 py-2 border dark:border-gray-700 rounded-lg bg-transparent"
      />
    </div>
    <div class="mb-4">
      <label for="content" class="block text-sm font-medium mb-1">评论内容</label>
      <textarea
        id="content"
        name="content"
        required
        rows="4"
        class="w-full px-3 py-2 border dark:border-gray-700 rounded-lg bg-transparent"
      ></textarea>
    </div>
    <div class="mb-4">
      <label for="captcha" class="block text-sm font-medium mb-1">验证码</label>

...

  <div class="space-y-6" id="comments-list">
    {commentTree.length > 0 ? (
      commentTree.map(comment => (
        <article class="border dark:border-gray-700 rounded-lg p-4">
          <div class="flex justify-between items-start mb-2">
            <span class="font-medium">{comment.author}</span>
            <time class="text-sm text-gray-500">
              {new Date(comment.created_at).toLocaleString('zh-CN')}
            </time>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-2">{comment.content}</p>
          <button
            class="text-sm text-blue-500 hover:text-blue-600"
            onclick={`replyTo(${comment.id}, '${comment.author}')`}
          >
            回复
          </button>
          
          {comment.replies?.length > 0 && (
            <div class="ml-8 mt-4 space-y-4">
              {comment.replies.map(reply => (
                <article class="border dark:border-gray-700 rounded-lg p-4">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <span class="font-medium">{reply.author}</span>
                      <span class="text-gray-500 text-sm ml-2">
                        回复 {comment.author}
                      </span>
                    </div>
                    <time class="text-sm text-gray-500">
                      {new Date(reply.created_at).toLocaleString('zh-CN')}
                    </time>
                  </div>
                  <p class="text-gray-600 dark:text-gray-400 mb-2">{reply.content}</p>
                  <button
                    class="text-sm text-blue-500 hover:text-blue-600"
                    onclick={`replyTo(${reply.id}, '${reply.author}')`}
                  >
                    回复
                  </button>
                </article>
              ))}
            </div>
          )}
        </article>
      ))
    
```


4. 搜索功能

```1:110:src/components/SearchModal.astro
---
---
<div
  x-data="searchModal"
  @keydown.window.escape="closeSearch()"
  @keydown.window.slash.prevent="openSearch()"
>
  <button
    @click="openSearch()"
    class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
    </svg>
    <span class="hidden sm:inline">搜索</span>
    <span class="text-sm text-gray-400">/</span>
  </button>

  <!-- 搜索模态框 -->
  <div
    x-show="isOpen"
    x-transition:enter="transition ease-out duration-200"
    x-transition:enter-start="opacity-0"
    x-transition:enter-end="opacity-100"
    x-transition:leave="transition ease-in duration-200"
    x-transition:leave-start="opacity-100"
    x-transition:leave-end="opacity-0"
    class="fixed inset-0 z-50 overflow-y-auto"
    style="display: none;"
  >
    <div class="min-h-screen px-4 text-center">
      <div
        @click="closeSearch()"
        class="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
      ></div>

      <div
        class="inline-block w-full max-w-2xl my-8 p-4 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg"
      >
        <div class="relative">
          <input
            x-ref="searchInput"
            x-model="searchQuery"
            @input="updateResults($event.target.value)"
            @keydown.arrow-down.prevent="navigateResults('down')"
            @keydown.arrow-up.prevent="navigateResults('up')"
            @keydown.enter="goToResult()"
            type="text"
            placeholder="搜索文章..."
            class="w-full p-4 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none"
          />
        </div>

        <div class="mt-4 max-h-96 overflow-y-auto">
          <template x-if="results.length === 0 && searchQuery">
            <p class="text-gray-500 dark:text-gray-400 p-4">未找到相关文章</p>
          </template>

          <template x-for="(result, index) in results" :key="result.slug">
            <a
              :href="`/blog/${result.slug}`"
              @click="closeSearch()"
              :class="{'bg-gray-100 dark:bg-gray-700': selectedIndex === index}"
              class="block p-4 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <h3 x-text="result.title" class="font-medium"></h3>
              <p x-text="result.description" class="text-sm text-gray-600 dark:text-gray-400"></p>
            </a>
          </template>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  if (typeof window !== 'undefined') {
    document.addEventListener('alpine:init', () => {
      Alpine.data('searchModal', () => ({
        isOpen: false,
        searchQuery: '',
        results: [],
        selectedIndex: 0,
        posts: [],

        async init() {
          try {
            const response = await fetch('/search-index.json');
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.posts = await response.json();
          } catch (error) {
            console.error('Error loading search index:', error);
            this.posts = [];
          }
        },

        openSearch() {
          this.isOpen = true;
          this.searchQuery = '';
          this.results = [];
          this.selectedIndex = 0;
          setTimeout(() => {
            if (this.$refs.searchInput) {
              this.$refs.searchInput.focus();
            }
          }, 50);
        },

```


5. 国际化支持

```1:239:public/tinymce/langs/zh_CN.js
tinymce.addI18n('zh_CN', {
  "Redo": "\u91cd\u505a",
  "Undo": "\u64a4\u9500",
  "Cut": "\u526a\u5207",
  "Copy": "\u590d\u5236",
  "Paste": "\u7c98\u8d34",
  "Select all": "\u5168\u9009",
  "New document": "\u65b0\u6587\u6863",
  "Ok": "\u786e\u5b9a",
  "Cancel": "\u53d6\u6d88",
  "Visual aids": "\u7f51\u683c\u7ebf",
  "Bold": "\u7c97\u4f53",
  "Italic": "\u659c\u4f53",
  "Underline": "\u4e0b\u5212\u7ebf",
  "Strikethrough": "\u5220\u9664\u7ebf",
  "Superscript": "\u4e0a\u6807",
  "Subscript": "\u4e0b\u6807",
  "Clear formatting": "\u6e05\u9664\u683c\u5f0f",
  "Remove": "\u5220\u9664",
  "Align left": "\u5de6\u5bf9\u9f50",
  "Align center": "\u5c45\u4e2d",
  "Align right": "\u53f3\u5bf9\u9f50",
  "No alignment": "\u9ed8\u8ba4\u5bf9\u9f50",
  "Justify": "\u4e24\u7aef\u5bf9\u9f50",
  "Bullet list": "\u9879\u76ee\u7b26\u53f7",
  "Numbered list": "\u7f16\u53f7\u5217\u8868",
  "Decrease indent": "\u51cf\u5c11\u7f29\u8fdb",
  "Increase indent": "\u589e\u52a0\u7f29\u8fdb",
  "Close": "\u5173\u95ed",
  "Formats": "\u683c\u5f0f",
  "Your browser doesn't support direct access to the clipboard. Please use the Ctrl+X/C/V keyboard shortcuts instead.": "\u5f53\u524d\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u8bbf\u95ee\u526a\u8d34\u677f\uff0c\u8bf7\u4f7f\u7528\u5feb\u6377\u952e(Ctrl/Cmd+X/C/V)\u6765\u5b8c\u6210\u76f8\u5e94\u64cd\u4f5c\u3002",
  "Headings": "\u6807\u9898",
  "Heading 1": "\u6807\u98981",
  "Heading 2": "\u6807\u98982",
  "Heading 3": "\u6807\u98983",
  "Heading 4": "\u6807\u98984",
  "Heading 5": "\u6807\u98985",
  "Heading 6": "\u6807\u98986",
  "Preformatted": "\u9884\u683c\u5f0f\u5316",
  "Div": "Div\u533a\u5757",
  "Pre": "\u9884\u683c\u5f0f\u6587\u672c",
  "Code": "\u4ee3\u7801",
  "Paragraph": "\u6bb5\u843d",
  "Blockquote": "\u5f15\u7528",
  "Inline": "\u6587\u672c",
  "Blocks": "\u533a\u5757",

  ...

  "hryvnia sign": "格里夫尼亚符号",
  "cedi sign": "塞地符号",
  "livre tournois sign": "里弗尔符号",
  "spesmilo sign": "spesmilo符号",
  "tenge sign": "坚戈符号",
  "indian rupee sign": "印度卢比符号",
  "turkish lira sign": "土耳其里拉符号",
  "nordic mark sign": "北欧马克符号",
  "manat sign": "马纳特符号",
  "ruble sign": "卢布符号",
  "yen character": "日元符号",
  "yuan character": "人民币符号",
  "yuan character, in hong kong and taiwan": "元符号（港台）",
  "yen/yuan character variant one": "元符号（大写）",
  "Emojis": "表情",
  "Emojis...": "表情...",
  "Loading emojis...": "正在加载表情...",
  "Could not load emojis": "无法加载表情",
  "People": "人物",
  "Animals and Nature": "动物和自然",
  "Food and Drink": "食物和饮品",
  "Activity": "活动",
  "Travel and Places": "旅游和地点",
  "Objects": "物品",
  "Flags": "旗帜",
  "Characters": "字符",
  "Characters (no spaces)": "字符（无空格）",
  "{0} characters": "{0} 个字符",
  "Error: Form submit field collision.": "错误: 表单提交字段冲突。",
  "Error: No form element found.": "错误: 未找到表单元素。",
  "Color swatch": "颜色样本",
  "Color Picker": "颜色选择器",
  "Invalid hex color code: {0}": "无效的十六进制颜色代码：{0}",
  "Invalid input": "无效输入",
  "R": "R",
  "Red component": "红色部分",
  "G": "G",
  "Green component": "绿色部分",
  "B": "B",
  "Blue component": "蓝色部分",
  "#": "#",
  "Hex color code": "十六进制颜色代码",
  "Range 0 to 255": "范围从0到255",
  "Turquoise": "青绿",
  "Green": "绿色",
  "Blue": "蓝色",
  "Purple": "紫色",
  "Navy Blue": "海军蓝",
  "Dark Turquoise": "深青绿",
  "Dark Green": "深绿",
  "Medium Blue": "中蓝",
  "Medium Purple": "中紫",
  "Midnight Blue": "深蓝",
  "Yellow": "黄色",
```


如果你需要了解某个具体功能的实现细节,或者想要添加新的功能,我很乐意为你提供帮助。你可以告诉我你感兴趣的具体方面。

---



---

