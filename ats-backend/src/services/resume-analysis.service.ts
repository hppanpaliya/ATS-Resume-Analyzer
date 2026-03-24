/**
 * Resume Analysis Service
 * Handles AI-powered parsing and analysis of resume content
 */

import { safeJsonParse } from '../lib/json';
import { extractTextFromStructuredData } from '../utils/resume-text-extractor';

import OpenAI from 'openai';

const AI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;

export class ResumeAnalysisService {
  /**
   * Extracts readable text from structured resume data
   * Delegates to shared utility for consistency across services
   * @param data - Structured resume data object
   * @returns Plain text representation of the resume
   */
  extractTextFromStructuredData(data: any): string {
    return extractTextFromStructuredData(data);
  }

  /**
   * Parses resume text using AI to extract structured data
   * @param text - Resume text to parse
   * @param userId - User ID (for tracking)
   * @returns Structured resume data as parsed by AI
   * @throws Error if parsing fails or AI service is unavailable
   */
  async parseResumeWithAI(text: string, userId: string) {
    const openai = new OpenAI({
        apiKey: AI_API_KEY,
        baseURL: process.env.BASE_URL || 'https://openrouter.ai/api/v1',
    });

    const model = process.env.ANALYSIS_MODEL || 'openrouter/free';

    try {
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: `Parse the following resume text into a structured JSON format. Extract the following sections:
            - personalInfo: { fullName, email, phone, location, linkedin, website }
            - summary: professional summary text
            - experience: array of { title, company, location, startDate, endDate, description, achievements }
            - education: array of { degree, institution, location, graduationDate, gpa }
            - skills: array of skill strings
            - certifications: array of { name, issuer, date, expiryDate }
            - projects: array of { name, description, technologies, url }

            Return only valid JSON, no markdown or explanations.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const responseContent = completion.choices[0].message.content;

      if (!responseContent) {
        throw new Error('AI response was empty');
      }

      // Clean the response - remove any markdown formatting
      const cleanedContent = responseContent.replace(/```json\s*|\s*```/g, '').trim();

      const parsedContent = safeJsonParse<Record<string, any> | null>(cleanedContent, null);
      if (!parsedContent) {
        throw new Error('Failed to parse structured response from AI');
      }

      return parsedContent;
    } catch (error: any) {
      throw new Error('Failed to parse resume with AI');
    }
  }

}
