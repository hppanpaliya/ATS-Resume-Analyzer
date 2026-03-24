/**
 * Resume Export Service
 * Handles PDF and Word document export functionality for resumes
 */

import prisma from '../lib/prisma';
import { safeJsonParse } from '../lib/json';
import puppeteer from 'puppeteer';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

export class ResumeExportService {
  /**
   * Exports resume to PDF format
   * @param resumeId - Resume ID to export
   * @param userId - User ID (for authorization)
   * @returns PDF buffer
   * @throws Error if resume not found or PDF generation fails
   */
  async exportToPDF(resumeId: string, userId: string): Promise<Buffer> {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId, deletedAt: null },
      include: { template: true },
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    // Parse resume content for structured data
    let structuredContent: any;
    if (typeof resume.content === 'string') {
      const parsedContent = safeJsonParse<Record<string, any> | null>(resume.content, null);
      if (parsedContent) {
        structuredContent = parsedContent;
      } else {
        structuredContent = {
          personalInfo: { fullName: 'Your Name' },
          summary: resume.content,
          experience: [],
          education: [],
          skills: [],
        };
      }
    } else if (resume.content && typeof resume.content === 'object') {
      structuredContent = resume.content;
    } else {
      structuredContent = {
        personalInfo: {},
        summary: '',
        experience: [],
        education: [],
        skills: [],
      };
    }

    // Generate HTML from structured content
    const html = this.generateFormattedHTML(structuredContent, resume.template);

    // Convert HTML to PDF using puppeteer
    let browser;
    try {
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
      browser = await puppeteer.launch({
        headless: true, // Use new headless mode
        executablePath: executablePath || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=VizDisplayCompositor'
        ]
      });
      const page = await browser.newPage();

      // Set viewport for better PDF rendering
      await page.setViewport({
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        deviceScaleFactor: 1
      });

      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      // Wait for fonts and styles to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: false,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
        },
        timeout: 30000
      });

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Generated PDF is empty');
      }

      return Buffer.from(pdfBuffer);
    } catch (error) {
      throw new Error(`Failed to generate PDF: ${(error as any).message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Exports resume to Word (DOCX) format
   * @param resumeId - Resume ID to export
   * @param userId - User ID (for authorization)
   * @returns Word document buffer
   * @throws Error if resume not found or document generation fails
   */
  async exportToWord(resumeId: string, userId: string): Promise<Buffer> {
    try {
      const resume = await prisma.resume.findFirst({
        where: { id: resumeId, userId, deletedAt: null },
        include: { template: true }
      });

      if (!resume) {
        throw new Error('Resume not found');
      }

      // Get structured data - prefer structuredData field, fallback to content
      let structuredResume;
      if ((resume as any).structuredData) {
        structuredResume = safeJsonParse<Record<string, any> | null>((resume as any).structuredData, null);
      } else if (resume.content) {
        structuredResume = safeJsonParse<Record<string, any> | null>(resume.content, null);
      } else {
        throw new Error('Resume has no structured data');
      }

      if (!structuredResume) {
        throw new Error('Resume structured data is invalid');
      }

      const { personalInfo, summary, experience, education, skills } = structuredResume;

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Header
            new Paragraph({
              children: [
                new TextRun({
                  text: personalInfo?.fullName || 'Your Name',
                  bold: true,
                  size: 32,
                  color: '2563eb'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: [personalInfo?.email, personalInfo?.phone, personalInfo?.location]
                    .filter(Boolean)
                    .join(' • '),
                  size: 20,
                  color: '64748b'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),

            // Summary
            ...(summary ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Professional Summary',
                    bold: true,
                    size: 24,
                    color: '2563eb'
                  })
                ],
                spacing: { after: 200 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: summary,
                    size: 22
                  })
                ],
                spacing: { after: 400 }
              })
            ] : []),

            // Experience
            ...(experience?.length ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Experience',
                    bold: true,
                    size: 24,
                    color: '2563eb'
                  })
                ],
                spacing: { after: 200 }
              }),
              ...experience.flatMap((exp: any) => [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: exp.title || 'Position',
                      bold: true,
                      size: 22
                    })
                  ],
                  spacing: { after: 100 }
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${exp.company || ''}${exp.location ? `, ${exp.location}` : ''}`,
                      italics: true,
                      color: '64748b',
                      size: 20
                    })
                  ],
                  spacing: { after: 100 }
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
                      color: '64748b',
                      size: 18
                    })
                  ],
                  spacing: { after: 200 }
                }),
                ...(exp.description ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: exp.description,
                        size: 20
                      })
                    ],
                    spacing: { after: 200 }
                  })
                ] : [])
              ])
            ] : []),

            // Education
            ...(education?.length ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Education',
                    bold: true,
                    size: 24,
                    color: '2563eb'
                  })
                ],
                spacing: { after: 200 }
              }),
              ...education.flatMap((edu: any) => [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: edu.degree || 'Degree',
                      bold: true,
                      size: 22
                    })
                  ],
                  spacing: { after: 100 }
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${edu.institution || ''}${edu.location ? `, ${edu.location}` : ''}`,
                      italics: true,
                      color: '64748b',
                      size: 20
                    })
                  ],
                  spacing: { after: 100 }
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: edu.graduationDate || '',
                      color: '64748b',
                      size: 18
                    })
                  ],
                  spacing: { after: 200 }
                })
              ])
            ] : []),

            // Skills
            ...(skills?.length ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Skills',
                    bold: true,
                    size: 24,
                    color: '2563eb'
                  })
                ],
                spacing: { after: 200 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: skills.join(', '),
                    size: 20
                  })
                ],
                spacing: { after: 400 }
              })
            ] : [])
          ]
        }]
      });

      return await Packer.toBuffer(doc);
    } catch (error: any) {
      throw new Error(`Failed to generate Word document: ${error.message}`);
    }
  }

  /**
   * Generates HTML representation of resume for PDF export
   * @param structuredResume - Structured resume data
   * @param template - Optional template configuration
   * @returns HTML string
   */
  generateFormattedHTML(structuredResume: any, template: any = null): string {
    // Escape HTML to prevent issues
    const escapeHtml = (text: string) => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    const { personalInfo, summary, experience, education, skills } = structuredResume;

    // Create minimal, valid HTML
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(personalInfo?.fullName || 'Resume')}</title>
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
.header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
.name { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
.contact { font-size: 14px; color: #64748b; }
.section { margin-bottom: 25px; }
.section-title { font-size: 18px; font-weight: bold; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; }
.item { margin-bottom: 15px; }
.job-title { font-weight: bold; font-size: 16px; }
.company { color: #64748b; font-style: italic; }
.date { color: #64748b; font-size: 14px; }
</style>
</head>
<body>
<div class="header">
<div class="name">${escapeHtml(personalInfo?.fullName || 'Your Name')}</div>
<div class="contact">${escapeHtml([personalInfo?.email, personalInfo?.phone, personalInfo?.location].filter(Boolean).join(' • '))}</div>
</div>
${summary ? `<div class="section"><div class="section-title">Professional Summary</div><p>${escapeHtml(summary)}</p></div>` : ''}
${experience?.length ? `<div class="section"><div class="section-title">Experience</div>${experience.map((exp: any) => `<div class="item"><div class="job-title">${escapeHtml(exp.title || 'Position')}</div><div class="company">${escapeHtml(exp.company || '')}${exp.location ? `, ${escapeHtml(exp.location)}` : ''}</div><div class="date">${escapeHtml(exp.startDate || '')} - ${escapeHtml(exp.endDate || 'Present')}</div>${exp.description ? `<p>${escapeHtml(exp.description)}</p>` : ''}</div>`).join('')}</div>` : ''}
${education?.length ? `<div class="section"><div class="section-title">Education</div>${education.map((edu: any) => `<div class="item"><div class="job-title">${escapeHtml(edu.degree || 'Degree')}</div><div class="company">${escapeHtml(edu.institution || '')}${edu.location ? `, ${escapeHtml(edu.location)}` : ''}</div><div class="date">${escapeHtml(edu.graduationDate || '')}</div></div>`).join('')}</div>` : ''}
${skills?.length ? `<div class="section"><div class="section-title">Skills</div><p>${escapeHtml(skills.join(', '))}</p></div>` : ''}
</body>
</html>`;

    return html;
  }
}
