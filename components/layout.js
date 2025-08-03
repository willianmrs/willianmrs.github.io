/**
 * Main layout styles
 * @returns {string} CSS for the main layout
 */
function layoutStyles() {
    return `
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6; 
      margin: 0; 
      background: #f5f7fa;
    }
    main {
      width: 100%;
      margin: 0 auto 3rem auto; 
      padding: 0 2rem;
      display: flex;
      justify-content: center;
    }
    #posts-container { 
      width: 100%; 
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  `;
}

/**
 * Media query styles for responsive design
 * @returns {string} CSS for responsive design
 */
function responsiveStyles() {
    return `
    @media (max-width: 768px) {
      header { padding: 1.5rem 1rem; }
      header h1 { font-size: 1.6rem; }
      main { padding: 0 1rem; }
      .social-links .username { font-weight: 500; }
      .post-item { 
        padding: 2rem; 
        border-radius: 12px;
      }
      .post-container {
        padding: 2rem;
        width: 100%;
        border-radius: 12px;
      }
      h1 { font-size: 2rem; }
      .subtitle { font-size: 1.3rem; }
      .nav-section {
        flex: 0 0 100%;
        margin-bottom: 1.5rem;
      }
      
      /* Responsive table styles */
      table {
        font-size: 0.85rem;
      }
      th, td {
        padding: 0.5rem;
        min-width: 80px;
      }
    }
    
    @media (max-width: 480px) {
      .post-item { padding: 1.5rem; }
      .post-container { padding: 1.5rem; }
      h1 { font-size: 1.8rem; }
      .subtitle { font-size: 1.2rem; }
      
      /* Mobile table styles */
      table {
        font-size: 0.8rem;
      }
      th, td {
        padding: 0.4rem;
        min-width: 70px;
      }
    }
  `;
}

/**
 * Render base HTML structure for a page
 * @param {string} title - Page title
 * @param {string} content - Page content
 * @param {string} styles - Additional page-specific styles
 * @returns {string} Complete HTML document
 */
function renderPage(title, content, styles = '') {
    const { headerStyles } = require('./header');
    const { footerStyles } = require('./footer');
    const { postStyles, postContentStyles } = require('./post');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${layoutStyles()}
    ${headerStyles()}
    ${footerStyles()}
    ${postStyles()}
    ${postContentStyles()}
    ${responsiveStyles()}
    ${styles}
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
}

module.exports = {
    layoutStyles,
    responsiveStyles,
    renderPage
};
