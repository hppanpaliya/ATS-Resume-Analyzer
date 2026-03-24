import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

/**
 * Mock data factory for generating test fixtures
 * Provides methods to create realistic test data for all database models
 */

export class MockDataFactory {
  /**
   * Generate a test user object
   */
  static createUser(overrides: any = {}) {
    const id = randomUUID();
    return {
      id,
      email: `test${id.substring(0, 8)}@example.com`,
      firstName: 'John',
      lastName: 'Doe',
      passwordHash: 'hashed_password_123',
      resumesCreated: 0,
      analysesCompleted: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      lastLoginAt: null,
      ...overrides,
    };
  }

  /**
   * Generate a test resume object
   */
  static createResume(userId: string, overrides: any = {}) {
    return {
      id: randomUUID(),
      userId,
      title: 'My Resume',
      content: 'Sample resume content',
      extractedText: 'Sample resume text content',
      structuredData: null,
      templateId: null,
      status: 'draft',
      originalFileId: null,
      originalFileName: null,
      originalFileSize: null,
      originalFileType: null,
      fileProcessedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...overrides,
    };
  }

  /**
   * Generate a test analysis object
   */
  static createAnalysis(resumeId: string, userId: string, overrides: any = {}) {
    return {
      id: randomUUID(),
      resumeId,
      userId,
      jobDescription: 'Sample job description',
      overallScore: 75,
      skillsAnalysis: JSON.stringify({
        score: 80,
        matchedKeywords: ['JavaScript', 'React'],
        missingKeywords: ['TypeScript'],
        recommendations: ['Learn TypeScript'],
      }),
      formattingScore: JSON.stringify({
        score: 70,
        issues: ['Inconsistent formatting'],
        suggestions: ['Use consistent fonts'],
      }),
      experienceRelevance: JSON.stringify({
        score: 75,
        relevantExperience: 'Good match',
        gaps: ['Leadership experience'],
      }),
      actionableAdvice: JSON.stringify(['Improve formatting', 'Add more metrics']),
      modelUsed: JSON.stringify({
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'OpenAI',
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...overrides,
    };
  }

  /**
   * Generate a test refresh session object
   */
  static createRefreshSession(userId: string, overrides: any = {}) {
    return {
      id: randomUUID(),
      userId,
      tokenHash: 'hashed_token_123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      lastUsedAt: new Date(),
      replacedBySessionId: null,
      createdAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Generate a test template object
   */
  static createTemplate(overrides: any = {}) {
    return {
      id: randomUUID(),
      name: 'Modern Resume',
      description: 'A modern resume template',
      design: JSON.stringify({ color: 'blue', font: 'Arial' }),
      structure: JSON.stringify({
        sections: ['CONTACT', 'SUMMARY', 'EXPERIENCE', 'EDUCATION'],
      }),
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Generate a test job description object
   */
  static createJobDescription(userId: string, overrides: any = {}) {
    return {
      id: randomUUID(),
      userId,
      title: 'Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      description: 'We are looking for a software engineer...',
      salary: null,
      url: 'https://example.com/jobs/123',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...overrides,
    };
  }

  /**
   * Generate a test password hash
   */
  static async createPasswordHash(password: string = 'testPassword123'): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Generate mock JWT tokens for testing
   */
  static generateMockTokens(userId: string, email: string) {
    return {
      accessToken: `mock_access_token_${userId}`,
      refreshToken: `mock_refresh_token_${userId}`,
      userId,
      email,
    };
  }

  /**
   * Generate test resume text content
   */
  static generateResumeText(): string {
    return `John Doe
Email: john@example.com
Phone: (555) 123-4567

SUMMARY
Experienced software engineer with 5 years of experience in web development.

EXPERIENCE
Senior Developer | Tech Corp | 2021-Present
- Led team of 5 engineers
- Improved performance by 40%
- Built scalable microservices

Developer | Start Up Inc | 2019-2021
- Developed full-stack applications
- Implemented CI/CD pipelines

EDUCATION
Bachelor of Science in Computer Science
University of Tech | 2019

SKILLS
JavaScript, TypeScript, React, Node.js, Python, SQL, AWS, Docker`;
  }

  /**
   * Generate test job description text
   */
  static generateJobDescription(): string {
    return `Senior Software Engineer

We are seeking a talented Senior Software Engineer to join our team.

Requirements:
- 5+ years of experience in software development
- Strong JavaScript/TypeScript skills
- React and Node.js experience
- Experience with AWS
- Bachelor's degree in Computer Science or related field

Responsibilities:
- Design and implement scalable systems
- Mentor junior engineers
- Contribute to architecture decisions
- Lead code reviews`;
  }

  /**
   * Generate test analysis result
   */
  static generateAnalysisResult(overrides: any = {}) {
    return {
      overallScore: 78,
      skillsAnalysis: {
        score: 82,
        matchedKeywords: ['JavaScript', 'React', 'Node.js', 'AWS'],
        missingKeywords: ['TypeScript', 'Kubernetes'],
        recommendations: [
          'Add TypeScript to your skills section',
          'Highlight AWS experience more prominently',
        ],
      },
      formattingScore: {
        score: 75,
        issues: ['Inconsistent date formatting', 'Could improve spacing'],
        suggestions: [
          'Use MM/YYYY format consistently',
          'Add more white space between sections',
        ],
      },
      experienceRelevance: {
        score: 80,
        relevantExperience: 'Strong alignment with team leadership requirements',
        gaps: ['No Kubernetes experience mentioned'],
      },
      actionableAdvice: [
        'Highlight the 40% performance improvement with metrics',
        'Add more quantified achievements',
        'Consider adding a professional summary',
      ],
      modelUsed: {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'OpenAI',
      },
      ...overrides,
    };
  }
}
