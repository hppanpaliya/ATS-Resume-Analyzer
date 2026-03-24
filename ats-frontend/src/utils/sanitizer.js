import DOMPurify from 'dompurify';

/**
 * Sanitizer utility for preventing XSS attacks on the frontend
 * Provides comprehensive input sanitization for React components
 */

/**
 * Sanitizes HTML input for safe display in the DOM
 * @param html - Raw HTML string
 * @param allowedTags - Optional array of allowed HTML tags
 * @returns Sanitized HTML string safe to display
 */
export function sanitizeHtml(
  html: string | undefined | null,
  allowedTags = ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li', 'a']
) {
  if (!html) {
    return '';
  }

  const config = {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    KEEP_CONTENT: true,
  };

  return DOMPurify.sanitize(html, config);
}

/**
 * Sanitizes plain text by escaping HTML special characters
 * @param text - Raw text input
 * @returns Sanitized text safe to display
 */
export function sanitizeText(text: string | undefined | null) {
  if (!text) {
    return '';
  }

  // Remove HTML tags and escape special characters
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes user input before form submission
 * @param input - Form input value
 * @returns Sanitized input ready to send to API
 */
export function sanitizeInput(input: string | undefined | null) {
  if (!input) {
    return '';
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Trim and limit length for most inputs
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Recursively sanitizes all string values in an object
 * @param obj - Object to sanitize
 * @param keysToSkip - Keys that should not be sanitized
 * @returns Sanitized object
 */
export function sanitizeObject(obj, keysToSkip = []) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, keysToSkip));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (keysToSkip.includes(key)) {
          sanitized[key] = obj[key];
        } else if (typeof obj[key] === 'string') {
          sanitized[key] = sanitizeInput(obj[key]);
        } else if (typeof obj[key] === 'object') {
          sanitized[key] = sanitizeObject(obj[key], keysToSkip);
        } else {
          sanitized[key] = obj[key];
        }
      }
    }
    return sanitized;
  }

  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }

  return obj;
}

/**
 * Sanitizes email address
 * @param email - Email to sanitize
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string | undefined | null) {
  if (!email) {
    return '';
  }

  const sanitized = sanitizeInput(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(sanitized) ? sanitized.toLowerCase() : '';
}

/**
 * Sanitizes URL to prevent XSS
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string
 */
export function sanitizeUrl(url: string | undefined | null) {
  if (!url) {
    return '';
  }

  const sanitized = sanitizeInput(url).trim();

  // Reject dangerous protocols
  if (
    /^(javascript|data|vbscript):/i.test(sanitized) ||
    /^\s*javascript:/i.test(sanitized)
  ) {
    return '';
  }

  // Allow http, https, and relative URLs
  if (
    sanitized.startsWith('http://') ||
    sanitized.startsWith('https://') ||
    sanitized.startsWith('/')
  ) {
    return sanitized;
  }

  return '';
}

/**
 * Creates safe HTML for React components using dangerouslySetInnerHTML
 * Only use when you're certain the content is safe or has been sanitized
 * @param html - HTML string to sanitize
 * @returns Object for dangerouslySetInnerHTML prop
 */
export function createSafeHtml(html) {
  return {
    __html: sanitizeHtml(html),
  };
}

/**
 * Hook-compatible sanitizer for form inputs
 * Sanitizes resume title (max 200 chars)
 */
export function sanitizeResumeTitle(title: string | undefined | null) {
  const sanitized = sanitizeInput(title);
  return sanitized.substring(0, 200);
}

/**
 * Hook-compatible sanitizer for resume content
 * Preserves some formatting, max 100k chars
 */
export function sanitizeResumeContent(content: string | undefined | null) {
  const sanitized = sanitizeHtml(content, ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li']);
  return sanitized.substring(0, 100000);
}

/**
 * Hook-compatible sanitizer for job description title
 */
export function sanitizeJobTitle(title: string | undefined | null) {
  const sanitized = sanitizeInput(title);
  return sanitized.substring(0, 200);
}

/**
 * Hook-compatible sanitizer for job description body
 */
export function sanitizeJobDescription(description: string | undefined | null) {
  const sanitized = sanitizeInput(description);
  return sanitized.substring(0, 20000);
}

/**
 * Hook-compatible sanitizer for company name
 */
export function sanitizeCompanyName(company: string | undefined | null) {
  if (!company) {
    return '';
  }
  const sanitized = sanitizeInput(company);
  return sanitized.substring(0, 200);
}

/**
 * Hook-compatible sanitizer for location
 */
export function sanitizeLocation(location: string | undefined | null) {
  if (!location) {
    return '';
  }
  const sanitized = sanitizeInput(location);
  return sanitized.substring(0, 200);
}
