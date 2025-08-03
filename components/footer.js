/**
 * Footer component with social links
 * @returns {string} HTML for the footer
 */
function renderFooter() {
    return `
      <footer class="footer">
        <div class="social-links">
          ${renderSocialLink('https://github.com/willianmrs', 'social-github',
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">' +
        '<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>' +
        '</svg>',
        '/willianmrs')}
          ${renderSocialLink('https://linkedin.com/in/willianmrs', 'social-linkedin',
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">' +
            '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>' +
            '</svg>',
            '/in/willianmrs')}
          ${renderSocialLink('https://medium.com/@willianmrs', 'social-medium',
                '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">' +
                '<path d="M2.846 6.887c.03-.295-.083-.586-.303-.784l-2.24-2.7v-.403h6.958l5.378 11.795 4.728-11.795h6.633v.403l-1.916 1.837c-.165.126-.247.333-.213.538v13.498c-.034.204.048.411.213.537l1.871 1.837v.403h-9.412v-.403l1.939-1.882c.19-.19.19-.246.19-.537v-10.91l-5.389 13.688h-.728l-6.275-13.688v9.174c-.052.385.076.774.347 1.052l2.521 3.058v.404h-7.148v-.404l2.521-3.058c.27-.279.39-.67.325-1.052v-10.608z"/>' +
                '</svg>',
                '@willianmrs')}
        </div>
        <p>© ${new Date().getFullYear()} Wilian's Lab. Branch: main | Status: shipped 🚀</p>
      </footer>
  `;
}

/**
 * Individual social link component
 * @param {string} url - The URL for the social link
 * @param {string} className - CSS class for styling
 * @param {string} icon - SVG icon HTML
 * @param {string} username - Username to display
 * @returns {string} HTML for a social link
 */
function renderSocialLink(url, className, icon, username) {
    return `
          <a href="${url}" target="_blank" class="${className}">
            ${icon}
            <span class="username">${username}</span>
          </a>
  `;
}

/**
 * Footer styles
 * @returns {string} CSS for the footer and social links
 */
function footerStyles() {
    return `
    .footer {
      padding: 2rem 0 1rem;
      margin-top: 3rem;
      border-top: 1px solid #e8ecf0;
      text-align: center;
    }
    .social-links {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-bottom: 1rem;
    }
    .social-links a {
      color: #667eea;
      text-decoration: none;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      border: 1px solid #e8ecf0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .social-links a:hover {
      color: #764ba2;
      border-color: #667eea;
      background: #f8f9ff;
      transform: translateY(-1px);
    }
    .social-links svg {
      opacity: 0.8;
      transition: opacity 0.2s ease;
    }
    .social-links a:hover svg {
      opacity: 1;
    }
    .social-links .username {
      font-weight: 500;
      margin-left: 4px;
    }
    .footer p {
      color: #888;
      font-size: 0.8rem;
      margin: 0;
    }
  `;
}

module.exports = {
    renderFooter,
    footerStyles
};
