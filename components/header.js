/**
 * Header component
 * @param {string} title - The title to display in the header
 * @returns {string} HTML for the header
 */
function renderHeader(title = "Wilian's Lab") {
    return `
  <header>
    <h1><a href="/">${title}</a></h1>
  </header>
  `;
}

/**
 * Header styles
 * @returns {string} CSS for the header
 */
function headerStyles() {
    return `
    header { 
      background: #fff; 
      color: #333; 
      padding: 1.5rem 1rem 1rem 1rem; 
      text-align: center; 
      border-bottom: 1px solid #e8ecf0;
      margin-bottom: 2rem;
    }
    header h1 { 
      margin: 0; 
      font-size: 2rem; 
      font-weight: 400; 
      letter-spacing: -0.5px;
      color: #2c3e50;
      font-family: Georgia, 'Times New Roman', serif;
    }
    header h1 a {
      color: #2c3e50;
      text-decoration: none;
      transition: color 0.2s ease;
    }
    header h1 a:hover {
      color: #667eea;
    }
  `;
}

module.exports = {
    renderHeader,
    headerStyles
};
