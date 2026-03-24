import { useCallback } from 'react';
import { sanitizeInput, sanitizeEmail, sanitizeUrl } from '../utils/sanitizer';

/**
 * useSanitizer Hook
 * Provides sanitization functions for form inputs
 * 
 * Usage:
 * const { sanitize, sanitizeEmail, sanitizeUrl } = useSanitizer();
 */
export function useSanitizer() {
  const sanitize = useCallback((value) => {
    return sanitizeInput(value);
  }, []);

  const sanitizeEmailValue = useCallback((value) => {
    return sanitizeEmail(value);
  }, []);

  const sanitizeUrlValue = useCallback((value) => {
    return sanitizeUrl(value);
  }, []);

  return {
    sanitize,
    sanitizeEmail: sanitizeEmailValue,
    sanitizeUrl: sanitizeUrlValue,
  };
}

export default useSanitizer;
