/**
 * Post listing component for index page
 * @param {Object} post - Post object with title, date, etc.
 * @returns {string} HTML for post listing
 */
function renderPostItem(post) {
    return `
    <div class="post-item">
      <div class="post-header">
        <h2><a href="${post.url}">${post.title}</a></h2>
        ${post.date ? `<div class="post-date">${post.date}</div>` : ''}
      </div>
      ${post.subtitle ? `<h3 class="post-subtitle">${post.subtitle}</h3>` : ''}
      <div class="post-excerpt">${post.excerpt}</div>
      <a href="${post.url}" class="read-more">Continue reading →</a>
    </div>
  `;
}

/**
 * Post page styles
 * @returns {string} CSS for post items
 */
function postStyles() {
    return `
    .post-item { 
      background: white;
      padding: 3rem; 
      margin-bottom: 2rem;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid #e8ecf0;
      width: 100%;
      max-width: 800px;
      box-sizing: border-box;
    }
    .post-header {
      margin-bottom: 1rem;
    }
    .post-item h2 { 
      margin: 0 0 0.5rem 0; 
      color: #2c3e50;
      font-size: 1.8rem;
      line-height: 1.3;
      word-wrap: break-word;
      hyphens: auto;
    }
    .post-item h2 a { 
      color: #2c3e50; 
      text-decoration: none;
      transition: color 0.2s ease;
    }
    .post-item h2 a:hover { 
      color: #667eea; 
    }
    .post-date { 
      color: #8892b0; 
      font-size: 0.85rem;
      font-weight: 500;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .post-subtitle {
      color: #718096;
      font-weight: 400;
      margin: 1rem 0;
      font-size: 1.1rem;
    }
    .post-excerpt {
      color: #4a5568;
      margin-bottom: 1.5rem;
    }
    .read-more {
      display: inline-block;
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
    }
    .read-more:hover {
      color: #764ba2;
    }
  `;
}

/**
 * Post content styles for individual post pages
 * @returns {string} CSS for post content
 */
function postContentStyles() {
    return `
    .post-container {
      background: white;
      padding: 4rem;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid #e8ecf0;
      width: 60%;
      max-width: 800px;
      min-width: 320px;
      box-sizing: border-box;
    }
    h1 { 
      margin-top: 0; 
      color: #2c3e50;
      font-size: 2.5rem;
      line-height: 1.2;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 1.5rem;
      font-weight: 400;
      color: #718096;
      margin-top: -0.5rem;
      margin-bottom: 1.5rem;
    }
    .post-date {
      color: #718096;
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }
    .content {
      line-height: 1.8;
      color: #2d3748;
    }
    p {
      margin-bottom: 1.5rem;
    }
    pre {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
      margin: 1.5rem 0;
    }
    code {
      font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.9em;
    }
    a {
      color: #4a7cf6;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    img {
      max-width: 100%;
      border-radius: 8px;
      margin: 1.5rem 0;
    }
    blockquote {
      border-left: 4px solid #e8ecf0;
      padding-left: 1rem;
      margin-left: 0;
      color: #718096;
    }
    ul, ol {
      padding-left: 1.5rem;
      margin-bottom: 1.5rem;
    }
    li {
      margin-bottom: 0.5rem;
    }
    h2 {
      color: #2c3e50;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
    }
    h3 {
      color: #2c3e50;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      overflow-x: auto;
      display: block;
      white-space: nowrap;
    }
    .table-container {
      overflow-x: auto;
      margin: 1.5rem 0;
      border-radius: 8px;
      border: 1px solid #e8ecf0;
    }
    .table-container table {
      margin: 0;
      border: none;
      min-width: 100%;
      display: table;
    }
    th, td {
      border: 1px solid #e8ecf0;
      padding: 0.75rem;
      text-align: left;
      vertical-align: top;
      word-wrap: break-word;
      min-width: 100px;
    }
    th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #2c3e50;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    td {
      background-color: white;
    }
    tr:hover td {
      background-color: #f8f9ff;
    }
    .nav-links {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e8ecf0;
    }
    .post-navigation {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 1rem;
    }
    .nav-section {
      flex: 0 0 48%;
      min-width: 280px;
    }
    .nav-section h3 {
      font-size: 1rem;
      margin-bottom: 0.75rem;
      color: #718096;
      font-weight: 600;
    }
    .nav-section ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .nav-section li {
      margin-bottom: 1rem;
      line-height: 1.4;
    }
    .nav-section a {
      color: #718096;
      text-decoration: none;
      transition: all 0.2s ease;
      display: block;
      position: relative;
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    .nav-section a:hover {
      color: #667eea;
      transform: translateX(2px);
    }
    .nav-section .date {
      color: #8892b0;
      font-size: 0.7rem;
      font-weight: 400;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `;
}

module.exports = {
    renderPostItem,
    postStyles,
    postContentStyles
};
