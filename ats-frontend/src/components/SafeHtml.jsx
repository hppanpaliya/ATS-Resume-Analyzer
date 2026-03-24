import React from 'react';
import { sanitizeHtml } from '../utils/sanitizer';

/**
 * SafeHtml Component
 * Safely renders HTML content with XSS protection
 * 
 * Usage:
 * <SafeHtml html={userContent} allowedTags={['b', 'i', 'p']} />
 */
export function SafeHtml({
  html,
  className = '',
  allowedTags = ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li', 'a'],
  tag = 'div',
}) {
  const sanitized = sanitizeHtml(html, allowedTags);

  const Tag = tag;

  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

export default SafeHtml;
