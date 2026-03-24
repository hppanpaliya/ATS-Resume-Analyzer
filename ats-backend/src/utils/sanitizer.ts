import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizer utility for preventing XSS attacks
 * Provides comprehensive input sanitization for both HTML and plain text
 */

/**
 * Sanitizes HTML/text input by removing potentially dangerous characters and tags
 * @param input - Raw HTML/text input
 * @param allowedTags - Optional array of allowed HTML tags (defaults to common safe tags)
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(
  input: string | undefined | null,
  allowedTags: string[] = ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li', 'a']
): string {
  if (!input) {
    return '';
  }

  const config: DOMPurify.Config = {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    KEEP_CONTENT: true,
  };

  return DOMPurify.sanitize(input, config);
}

/**
 * Sanitizes plain text by escaping HTML special characters
 * Removes any HTML tags completely
 * @param input - Raw text input
 * @returns Sanitized plain text
 */
export function sanitizeString(input: string | undefined | null): string {
  if (!input) {
    return '';
  }

  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Escape special characters that could be used in XSS
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized.trim();
}

/**
 * Recursively sanitizes all string values in a JSON object
 * @param obj - Object to sanitize (can be nested)
 * @param keysToSkip - Array of keys that should not be sanitized (e.g., for already-processed fields)
 * @returns Sanitized object with same structure
 */
export function sanitizeJSON(
  obj: any,
  keysToSkip: string[] = []
): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeJSON(item, keysToSkip));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (keysToSkip.includes(key)) {
          // Skip sanitization for specified keys
          sanitized[key] = obj[key];
        } else if (typeof obj[key] === 'string') {
          sanitized[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object') {
          sanitized[key] = sanitizeJSON(obj[key], keysToSkip);
        } else {
          sanitized[key] = obj[key];
        }
      }
    }
    return sanitized;
  }

  // Handle strings
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  // Return other types as-is
  return obj;
}

/**
 * Sanitizes user input for database storage
 * Removes HTML tags and escapes dangerous characters
 * @param input - Raw user input
 * @returns Safe string for database storage
 */
export function sanitizeForDatabase(input: string | undefined | null): string {
  return sanitizeString(input);
}

/**
 * Sanitizes email addresses (basic validation)
 * @param email - Email address to sanitize
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string | undefined | null): string {
  if (!email) {
    return '';
  }

  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return '';
  }

  // Ensure there are no HTML entities or dangerous characters
  // by checking if sanitization alters the string
  const sanitized = sanitizeString(trimmed);
  if (sanitized !== trimmed) {
    return '';
  }

  return trimmed.toLowerCase();
}

/**
 * Sanitizes URLs to prevent javascript: and data: protocols
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) {
    return '';
  }

  const sanitized = url.trim();

  // Reject javascript:, data:, and vbscript: protocols
  if (
    /^(javascript|data|vbscript):/i.test(sanitized) ||
    /^\s*javascript:/i.test(sanitized)
  ) {
    return '';
  }

  // Allow only http, https, and relative URLs
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
 * Sanitizes a resume title
 * @param title - Resume title
 * @returns Sanitized title (max 200 chars, no HTML)
 */
export function sanitizeResumeTitle(title: string | undefined | null): string {
  const sanitized = sanitizeString(title);
  return sanitized.substring(0, 200);
}

/**
 * Sanitizes resume content
 * Allows some formatting but removes dangerous content
 * @param content - Resume content
 * @returns Sanitized content (max 100000 chars)
 */
export function sanitizeResumeContent(content: string | undefined | null): string {
  const sanitized = sanitizeHtml(content, ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li']);
  return sanitized.substring(0, 100000);
}

/**
 * Sanitizes a job description title
 * @param title - Job title
 * @returns Sanitized title (max 200 chars, no HTML)
 */
export function sanitizeJobTitle(title: string | undefined | null): string {
  const sanitized = sanitizeString(title);
  return sanitized.substring(0, 200);
}

/**
 * Sanitizes a job description body
 * @param description - Job description
 * @returns Sanitized description (max 20000 chars, no HTML)
 */
export function sanitizeJobDescription(description: string | undefined | null): string {
  const sanitized = sanitizeString(description);
  return sanitized.substring(0, 20000);
}

/**
 * Sanitizes a company name
 * @param company - Company name
 * @returns Sanitized company name (max 200 chars, no HTML)
 */
export function sanitizeCompanyName(company: string | undefined | null): string {
  if (!company) {
    return '';
  }
  const sanitized = sanitizeString(company);
  return sanitized.substring(0, 200);
}

/**
 * Sanitizes a location string
 * @param location - Location string
 * @returns Sanitized location (max 200 chars, no HTML)
 */
export function sanitizeLocation(location: string | undefined | null): string {
  if (!location) {
    return '';
  }
  const sanitized = sanitizeString(location);
  return sanitized.substring(0, 200);
}
