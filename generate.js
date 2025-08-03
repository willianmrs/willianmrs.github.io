const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const yaml = require('js-yaml');

// Inicializa o parser markdown
const md = new MarkdownIt();

// Import components
const { renderHeader } = require('./components/header');
const { renderFooter } = require('./components/footer');
const { renderPostItem } = require('./components/post');
const { renderPage } = require('./components/layout');

// Configure directories
const POSTS_DIR = path.join(__dirname, 'posts');
const PUBLIC_DIR = path.join(__dirname, 'public');
const ASSETS_DIR = path.join(__dirname, 'assets');

/**
 * Ensure directory exists
 * @param {string} dir - Directory path to check/create
 */
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Parse markdown content with front matter
 * @param {string} content - Raw markdown content
 * @returns {Object} Parsed front matter and HTML content
 */
function parseMarkdown(content) {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);

  if (!match) {
    return { 
      frontMatter: {}, 
      content: md.render(content) 
    };
  }
  
  const frontMatter = yaml.load(match[1]);
  const markdownContent = match[2];
  const htmlContent = md.render(markdownContent);
    return { frontMatter, content: htmlContent };
}

/**
 * Extract excerpt from HTML content
 * @param {string} html - HTML content
 * @returns {string} Excerpt text
 */
function extractExcerpt(html) {
  const text = html.replace(/<[^>]+>/g, '');
  return text.slice(0, 200) + (text.length > 200 ? '...' : '');
}

/**
 * Generate slug from filename
 * @param {string} filename - Original filename
 * @returns {string} URL-friendly slug
 */
function generateSlug(filename) {
  // Remove date and extension
  return filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
}

/**
 * Format date string
 * @param {string} dateStr - Date string from filename or front matter
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get all blog posts
 * @returns {Array} List of post objects
 */
function getPosts() {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(POSTS_DIR)
    .filter(file => file.endsWith('.md'));

  const posts = files.map(file => {
    const filePath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { frontMatter, content: htmlContent } = parseMarkdown(content);

    // Extract date from filename or front matter
    let date = frontMatter.date;
    if (!date) {
      const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        date = dateMatch[1];
      }
    }

    // Generate URL from filename
    const slug = generateSlug(file);
    const url = `${slug}.html`;

    return {
      title: frontMatter.title || 'Untitled',
      subtitle: frontMatter.subtitle || '',
      date: formatDate(date),
      rawDate: date, // For sorting
      content: htmlContent,
      excerpt: frontMatter.excerpt || extractExcerpt(htmlContent),
      slug,
      url,
      file
    };
  });

  // Sort posts by date, newest first
  return posts.sort((a, b) => {
    if (!a.rawDate) return 1;
    if (!b.rawDate) return -1;
    return new Date(b.rawDate) - new Date(a.rawDate);
  });
}

/**
 * Generate post navigation links
 * @param {Object} currentPost - Current post object
 * @param {Array} allPosts - All post objects
 * @returns {string} HTML for navigation links
 */
function generatePostNavigation(currentPost, allPosts) {
  const currentIndex = allPosts.findIndex(post => post.slug === currentPost.slug);

  const prevPosts = allPosts.slice(0, currentIndex).slice(-3);
  const nextPosts = allPosts.slice(currentIndex + 1, currentIndex + 4);

  let navHtml = '<div class="post-navigation">';

  if (nextPosts.length > 0) {
    navHtml += '<div class="nav-section nav-previous"><h3>← Posts Anteriores</h3><ul>';
    nextPosts.forEach(post => {
      navHtml += `<li><a href="${post.url}">${post.title}</a> <span class="date">(${post.date})</span></li>`;
    });
    navHtml += '</ul></div>';
  }

  if (prevPosts.length > 0) {
    navHtml += '<div class="nav-section nav-next"><h3>Posts Recentes →</h3><ul>';
    prevPosts.reverse().forEach(post => {
      navHtml += `<li><a href="${post.url}">${post.title}</a> <span class="date">(${post.date})</span></li>`;
    });
    navHtml += '</ul></div>';
  }

  navHtml += '</div>';
  return navHtml;
}

/**
 * Generate HTML for a single post
 * @param {Object} post - Post object
 * @param {Array} allPosts - All post objects for navigation
 */
function generatePost(post, allPosts) {
  // Ensure public directory exists
  ensureDirectoryExists(PUBLIC_DIR);

  const navHtml = generatePostNavigation(post, allPosts);

  const content = `
  ${renderHeader()}
  <main>
    <div class="post-container">
      <h1>${post.title}</h1>
      ${post.subtitle ? `<h2 class="subtitle">${post.subtitle}</h2>` : ''}
      ${post.date ? `<div class="post-date">${post.date}</div>` : ''}
      <div class="content">${post.content}</div>
      <div class="nav-links">${navHtml}</div>
      ${renderFooter()}
    </div>
  </main>
  `;

  const html = renderPage(`${post.title} | Wilian's Lab`, content);

  fs.writeFileSync(path.join(PUBLIC_DIR, post.url), html);
  console.log(`Generated: ${post.url}`);
}

/**
 * Generate index page with post listings
 * @param {Array} posts - All post objects
 */
function generateIndex(posts) {
  // Ensure public directory exists
  ensureDirectoryExists(PUBLIC_DIR);

  const postsHtml = posts.map(post => renderPostItem(post)).join('');

  const content = `
  ${renderHeader()}
  <main id="posts-container">
    ${postsHtml}
  </main>
  <div id="sentinel"></div>
  ${renderFooter()}
  `;

  const html = renderPage("Wilian's Lab", content);

  fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), html);
  console.log('Generated: index.html');
}

/**
 * Generate posts.json for potential API usage
 * @param {Array} posts - All post objects
 */
function generatePostsJson(posts) {
  // Ensure public directory exists
  ensureDirectoryExists(PUBLIC_DIR);

  const postsData = posts.map(post => ({
    title: post.title,
    subtitle: post.subtitle,
    date: post.date,
    excerpt: post.excerpt,
    url: post.url
  }));

  fs.writeFileSync(
    path.join(PUBLIC_DIR, 'posts.json'),
    JSON.stringify(postsData, null, 2)
  );
  console.log('Generated: posts.json');
}

/**
 * Copy static assets
 */
function copyAssets() {
  // Ensure public directory exists
  ensureDirectoryExists(PUBLIC_DIR);

  if (fs.existsSync(ASSETS_DIR)) {
    const assets = fs.readdirSync(ASSETS_DIR);

    assets.forEach(asset => {
      const sourcePath = path.join(ASSETS_DIR, asset);
      const destPath = path.join(PUBLIC_DIR, asset);

      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied asset: ${asset}`);
    });
  }
}

// Main function to generate the blog
function generateBlog() {
  console.log("Generating blog with component-based approach...");

  // Ensure the public directory exists at the start
  ensureDirectoryExists(PUBLIC_DIR);

  const posts = getPosts();

  // Generate individual post pages
  posts.forEach(post => {
    generatePost(post, posts);
  });

  // Generate index page
  generateIndex(posts);

  // Generate posts.json
  generatePostsJson(posts);

  // Copy assets
  copyAssets();

  // Create .nojekyll file for GitHub Pages
  const nojekyllPath = path.join(PUBLIC_DIR, '.nojekyll');
  fs.writeFileSync(nojekyllPath, '');
  console.log('Created: .nojekyll');

  console.log("\nBlog generated successfully with new component-based architecture!");
  console.log(`Total posts: ${posts.length}`);
  console.log("Benefits of component-based approach:");
  console.log("1. Consistent styling across all pages");
  console.log("2. Modular and maintainable code");
  console.log("3. Easier to add new features");
  console.log("4. Better separation of concerns");
}

// Run the generator
generateBlog();
