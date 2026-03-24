// Mock for isomorphic-dompurify - used to avoid ESM import issues in Jest
// This mock implements the core functionality of DOMPurify for testing

const defaultConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  KEEP_CONTENT: true,
};

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

function sanitizeInternal(input, config = {}) {
  if (!input || typeof input !== 'string') return '';

  const mergedConfig = { ...defaultConfig, ...config };
  let result = input;

  // Remove script and style tags and their content
  result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  result = result.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  result = result.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '');

  // If KEEP_CONTENT is true, remove tags but keep content
  if (mergedConfig.KEEP_CONTENT) {
    const tagPattern = /<\/?\w+[^>]*>/gi;
    result = result.replace(tagPattern, '');
  }

  return result;
}

const DOMPurify = {
  sanitize(input, config) {
    return sanitizeInternal(input, config);
  },

  sanitizeHtml(input, config) {
    return sanitizeInternal(input, config);
  },
};

// Export both as default and named export for compatibility
module.exports = DOMPurify;
module.exports.default = DOMPurify;
