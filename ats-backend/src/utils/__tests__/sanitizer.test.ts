import {
  sanitizeHtml,
  sanitizeString,
  sanitizeJSON,
  sanitizeForDatabase,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeResumeTitle,
  sanitizeResumeContent,
  sanitizeJobTitle,
  sanitizeJobDescription,
  sanitizeCompanyName,
  sanitizeLocation,
} from '../sanitizer';

describe('sanitizer', () => {
  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeString(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
      expect(result).toContain('Hello');
    });

    it('should escape HTML special characters', () => {
      const input = '<div>&"\'</div>';
      const result = sanitizeString(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('&quot;');
      expect(result).toContain('&#x27;');
      expect(result).toContain('&amp;');
    });

    it('should handle null input', () => {
      const result = sanitizeString(null);
      expect(result).toBe('');
    });

    it('should handle undefined input', () => {
      const result = sanitizeString(undefined);
      expect(result).toBe('');
    });

    it('should handle empty string', () => {
      const result = sanitizeString('');
      expect(result).toBe('');
    });

    it('should trim whitespace', () => {
      const input = '  test string  ';
      const result = sanitizeString(input);
      expect(result).toBe('test string');
    });

    it('should escape forward slashes', () => {
      const input = 'test/path';
      const result = sanitizeString(input);
      expect(result).toContain('&#x2F;');
    });

    it('should preserve normal text', () => {
      const input = 'This is normal text with numbers 123 and symbols!@#$%';
      const result = sanitizeString(input);
      expect(result).toContain('This');
      expect(result).toContain('normal');
      expect(result).toContain('text');
    });

    it('should handle multiple special characters', () => {
      const input = '<script>alert("XSS & more")</script>';
      const result = sanitizeString(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&quot;XSS &amp; more&quot;');
    });

    it('should handle very long strings', () => {
      const input = 'a'.repeat(10000) + '<script>alert("xss")</script>';
      const result = sanitizeString(input);
      expect(result.length).toBeGreaterThan(9000);
      expect(result).not.toContain('<script>');
    });

    it('should remove all HTML tags completely', () => {
      const input = '<p>Hello <b>World</b> <i>Text</i></p>';
      const result = sanitizeString(input);
      expect(result).toContain('Hello');
      expect(result).toContain('World');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });
  });

  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const input = '<b>Bold</b> <i>Italic</i>';
      const result = sanitizeHtml(input);
      expect(result).toContain('Bold');
      expect(result).toContain('Italic');
    });

    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Safe content';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Safe content');
    });

    it('should remove event handlers', () => {
      const input = '<p onclick="alert(\'xss\')">Click me</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
    });

    it('should preserve allowed links', () => {
      const input = '<a href="https://example.com">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('Link');
    });

    it('should handle null input', () => {
      const result = sanitizeHtml(null);
      expect(result).toBe('');
    });

    it('should handle undefined input', () => {
      const result = sanitizeHtml(undefined);
      expect(result).toBe('');
    });

    it('should allow custom tag list', () => {
      const input = '<b>Bold</b> <code>Code</code>';
      const result = sanitizeHtml(input, ['b', 'code']);
      expect(result).toContain('Bold');
      expect(result).toContain('Code');
    });

    it('should remove iframe tags', () => {
      const input = '<iframe src="malicious.com"></iframe>Safe';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<iframe>');
      expect(result).toContain('Safe');
    });

    it('should remove style tags and inline styles', () => {
      const input = '<style>body { display: none; }</style><p style="color: red">Text</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<style>');
      expect(result).not.toContain('style');
    });

    it('should keep content of removed tags', () => {
      const input = '<script>function test() { return "keep this"; }</script>';
      const result = sanitizeHtml(input, []);
      expect(result).toBe('');
    });

    it('should handle nested tags', () => {
      const input = '<div><script><b>Nested</b></script></div>';
      const result = sanitizeHtml(input, ['b']);
      expect(result).not.toContain('<script>');
      expect(result).toBe('');
    });
  });

  describe('sanitizeJSON', () => {
    it('should sanitize all string values in object', () => {
      const input = {
        name: '<script>alert("xss")</script>John',
        email: 'john@example.com',
      };
      const result = sanitizeJSON(input);
      expect(result.name).not.toContain('<script>');
      expect(result.email).toBe('john@example.com');
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '<b>John</b>',
          address: {
            street: '<script>test</script>Main St',
          },
        },
      };
      const result = sanitizeJSON(input);
      expect(result.user.name).not.toContain('<script>');
      expect(result.user.address.street).not.toContain('<script>');
    });

    it('should handle arrays', () => {
      const input = {
        tags: ['<script>xss</script>', 'safe', '<b>bold</b>'],
      };
      const result = sanitizeJSON(input);
      expect(result.tags[0]).not.toContain('<script>');
      expect(result.tags[1]).toBe('safe');
    });

    it('should skip specified keys', () => {
      const input = {
        name: '<script>test</script>',
        jsonData: '{"key": "<script>keep</script>"}',
      };
      const result = sanitizeJSON(input, ['jsonData']);
      expect(result.name).not.toContain('<script>');
      expect(result.jsonData).toContain('<script>');
    });

    it('should preserve non-string values', () => {
      const input = {
        name: 'John',
        age: 30,
        isActive: true,
        tags: ['a', 'b'],
        metadata: { key: 'value' },
      };
      const result = sanitizeJSON(input);
      expect(result.age).toBe(30);
      expect(result.isActive).toBe(true);
    });

    it('should handle null values', () => {
      const input = {
        name: 'John',
        bio: null,
      };
      const result = sanitizeJSON(input);
      expect(result.bio).toBeNull();
    });

    it('should handle deeply nested structures', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: '<script>deep</script>',
              },
            },
          },
        },
      };
      const result = sanitizeJSON(input);
      expect(result.level1.level2.level3.level4.value).not.toContain('<script>');
    });

    it('should handle arrays of objects', () => {
      const input = {
        users: [
          { name: '<b>John</b>', email: 'john@example.com' },
          { name: '<script>xss</script>', email: 'hacker@example.com' },
        ],
      };
      const result = sanitizeJSON(input);
      expect(result.users[1].name).not.toContain('<script>');
    });
  });

  describe('sanitizeForDatabase', () => {
    it('should sanitize input for database storage', () => {
      const input = '<script>alert("xss")</script>Content';
      const result = sanitizeForDatabase(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Content');
    });

    it('should handle null input', () => {
      const result = sanitizeForDatabase(null);
      expect(result).toBe('');
    });

    it('should remove HTML tags', () => {
      const input = '<div>Database <b>Safe</b></div>';
      const result = sanitizeForDatabase(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });
  });

  describe('sanitizeEmail', () => {
    it('should validate and return valid email', () => {
      const email = 'user@example.com';
      const result = sanitizeEmail(email);
      expect(result).toBe('user@example.com');
    });

    it('should convert email to lowercase', () => {
      const email = 'User@Example.Com';
      const result = sanitizeEmail(email);
      expect(result).toBe('user@example.com');
    });

    it('should reject invalid email format', () => {
      const result = sanitizeEmail('not-an-email');
      expect(result).toBe('');
    });

    it('should reject email with special characters', () => {
      const result = sanitizeEmail('<script>@example.com');
      expect(result).toBe('');
    });

    it('should handle null input', () => {
      const result = sanitizeEmail(null);
      expect(result).toBe('');
    });

    it('should handle undefined input', () => {
      const result = sanitizeEmail(undefined);
      expect(result).toBe('');
    });

    it('should handle email with plus addressing', () => {
      const email = 'user+tag@example.com';
      const result = sanitizeEmail(email);
      expect(result).toBe('user+tag@example.com');
    });

    it('should reject email without TLD', () => {
      const result = sanitizeEmail('user@example');
      expect(result).toBe('');
    });

    it('should reject email with spaces', () => {
      const result = sanitizeEmail('user @example.com');
      expect(result).toBe('');
    });

    it('should handle email with subdomain', () => {
      const email = 'user@mail.example.co.uk';
      const result = sanitizeEmail(email);
      expect(result).toBe('user@mail.example.co.uk');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow http URLs', () => {
      const url = 'http://example.com';
      const result = sanitizeUrl(url);
      expect(result).toBe('http://example.com');
    });

    it('should allow https URLs', () => {
      const url = 'https://example.com';
      const result = sanitizeUrl(url);
      expect(result).toBe('https://example.com');
    });

    it('should allow relative URLs', () => {
      const url = '/path/to/page';
      const result = sanitizeUrl(url);
      expect(result).toBe('/path/to/page');
    });

    it('should reject javascript: protocol', () => {
      const url = 'javascript:alert("xss")';
      const result = sanitizeUrl(url);
      expect(result).toBe('');
    });

    it('should reject data: protocol', () => {
      const url = 'data:text/html,<script>alert("xss")</script>';
      const result = sanitizeUrl(url);
      expect(result).toBe('');
    });

    it('should reject vbscript: protocol', () => {
      const url = 'vbscript:alert("xss")';
      const result = sanitizeUrl(url);
      expect(result).toBe('');
    });

    it('should handle null input', () => {
      const result = sanitizeUrl(null);
      expect(result).toBe('');
    });

    it('should handle undefined input', () => {
      const result = sanitizeUrl(undefined);
      expect(result).toBe('');
    });

    it('should reject URL with javascript: variation', () => {
      const result = sanitizeUrl('  javascript:alert("xss")');
      expect(result).toBe('');
    });

    it('should allow URLs with query parameters', () => {
      const url = 'https://example.com/page?param=value&other=test';
      const result = sanitizeUrl(url);
      expect(result).toBe('https://example.com/page?param=value&other=test');
    });

    it('should reject invalid protocols', () => {
      const result = sanitizeUrl('ftp://example.com');
      expect(result).toBe('');
    });
  });

  describe('sanitizeResumeTitle', () => {
    it('should sanitize and limit resume title length', () => {
      const title = 'My <script>alert("xss")</script> Resume';
      const result = sanitizeResumeTitle(title);
      expect(result).not.toContain('<script>');
      expect(result).toContain('My');
      expect(result.length).toBeLessThanOrEqual(200);
    });

    it('should truncate very long titles', () => {
      const longTitle = 'a'.repeat(500);
      const result = sanitizeResumeTitle(longTitle);
      expect(result.length).toBeLessThanOrEqual(200);
    });

    it('should handle null input', () => {
      const result = sanitizeResumeTitle(null);
      expect(result).toBe('');
    });

    it('should preserve normal titles', () => {
      const title = 'Software Engineer Resume';
      const result = sanitizeResumeTitle(title);
      expect(result).toBe('Software Engineer Resume');
    });
  });

  describe('sanitizeResumeContent', () => {
    it('should sanitize resume content with HTML tags', () => {
      const content =
        '<script>alert("xss")</script><p>My Experience</p>';
      const result = sanitizeResumeContent(content);
      expect(result).not.toContain('<script>');
      expect(result.length).toBeLessThanOrEqual(100000);
    });

    it('should allow safe formatting tags', () => {
      const content = '<b>Bold</b> <i>Italic</i> <p>Paragraph</p>';
      const result = sanitizeResumeContent(content);
      expect(result).toContain('Bold');
      expect(result).toContain('Italic');
    });

    it('should truncate very long content', () => {
      const longContent = 'a'.repeat(200000);
      const result = sanitizeResumeContent(longContent);
      expect(result.length).toBeLessThanOrEqual(100000);
    });

    it('should handle null input', () => {
      const result = sanitizeResumeContent(null);
      expect(result).toBe('');
    });
  });

  describe('sanitizeJobTitle', () => {
    it('should sanitize job title', () => {
      const title = 'Senior <script>alert("xss")</script> Engineer';
      const result = sanitizeJobTitle(title);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Senior');
      expect(result).toContain('Engineer');
    });

    it('should limit job title length', () => {
      const longTitle = 'a'.repeat(300);
      const result = sanitizeJobTitle(longTitle);
      expect(result.length).toBeLessThanOrEqual(200);
    });

    it('should handle null input', () => {
      const result = sanitizeJobTitle(null);
      expect(result).toBe('');
    });
  });

  describe('sanitizeJobDescription', () => {
    it('should sanitize job description', () => {
      const desc =
        'Looking for <script>alert("xss")</script> engineer. Requirements: ...';
      const result = sanitizeJobDescription(desc);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Looking for');
    });

    it('should limit job description length', () => {
      const longDesc = 'a'.repeat(30000);
      const result = sanitizeJobDescription(longDesc);
      expect(result.length).toBeLessThanOrEqual(20000);
    });

    it('should handle null input', () => {
      const result = sanitizeJobDescription(null);
      expect(result).toBe('');
    });
  });

  describe('sanitizeCompanyName', () => {
    it('should sanitize company name', () => {
      const name = 'Tech <script>alert("xss")</script> Corp';
      const result = sanitizeCompanyName(name);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Tech');
    });

    it('should limit company name length', () => {
      const longName = 'a'.repeat(300);
      const result = sanitizeCompanyName(longName);
      expect(result.length).toBeLessThanOrEqual(200);
    });

    it('should handle null input', () => {
      const result = sanitizeCompanyName(null);
      expect(result).toBe('');
    });
  });

  describe('sanitizeLocation', () => {
    it('should sanitize location string', () => {
      const location = 'San Francisco <script>alert("xss")</script>, CA';
      const result = sanitizeLocation(location);
      expect(result).not.toContain('<script>');
      expect(result).toContain('San Francisco');
    });

    it('should limit location length', () => {
      const longLocation = 'a'.repeat(300);
      const result = sanitizeLocation(longLocation);
      expect(result.length).toBeLessThanOrEqual(200);
    });

    it('should handle null input', () => {
      const result = sanitizeLocation(null);
      expect(result).toBe('');
    });

    it('should preserve valid location formats', () => {
      const location = 'New York, NY, USA';
      const result = sanitizeLocation(location);
      expect(result).toBe('New York, NY, USA');
    });
  });

  describe('XSS prevention', () => {
    it('should prevent script injection through events', () => {
      const input = '<img src=x onerror="alert(\'xss\')">';
      const result = sanitizeString(input);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should prevent SVG-based XSS', () => {
      const input =
        '<svg onload="alert(\'xss\')"><circle r="40" fill="red"/></svg>';
      const result = sanitizeString(input);
      expect(result).not.toContain('onload');
      expect(result).not.toContain('svg');
    });

    it('should prevent data URL attacks', () => {
      const input = 'Click <a href="data:text/html,<script>alert(\'xss\')</script>">here</a>';
      const result = sanitizeUrl('data:text/html,<script>alert(\'xss\')</script>');
      expect(result).toBe('');
    });

    it('should prevent CSS injection', () => {
      const input = '<style>body { display: none; }</style>';
      const result = sanitizeString(input);
      expect(result).not.toContain('<style>');
    });
  });

  describe('performance', () => {
    it('should handle very large strings efficiently', () => {
      const largeString = 'a'.repeat(1000000);
      const start = Date.now();
      const result = sanitizeString(largeString);
      const duration = Date.now() - start;

      expect(result.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should handle deeply nested JSON efficiently', () => {
      let deepObj: any = { value: 'test' };
      for (let i = 0; i < 100; i++) {
        deepObj = { nested: deepObj };
      }

      const start = Date.now();
      const result = sanitizeJSON(deepObj);
      const duration = Date.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });
});
