import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ResumeService {
  async createResume(userId: string, title: string, content: any, templateId?: string) {
    const resume = await prisma.resume.create({
      data: {
        userId,
        title,
        content,
        templateId,
        status: 'draft',
      },
    });

    // Increment user's resume count
    await prisma.user.update({
      where: { id: userId },
      data: { resumesCreated: { increment: 1 } },
    });

    return resume;
  }

  async getResumes(userId: string, page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    const [resumes, total] = await Promise.all([
      prisma.resume.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          template: {
            select: { id: true, name: true, category: true },
          },
        },
      }),
      prisma.resume.count({ where }),
    ]);

    return {
      resumes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getResumeById(resumeId: string, userId: string) {
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId,
        deletedAt: null,
      },
      include: {
        template: true,
      },
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    // Update last accessed
    await prisma.resume.update({
      where: { id: resumeId },
      data: { lastAccessedAt: new Date() },
    });

    return resume;
  }

  async updateResume(resumeId: string, userId: string, data: any) {
    // Verify ownership
    const existing = await prisma.resume.findFirst({
      where: { id: resumeId, userId, deletedAt: null },
    });

    if (!existing) {
      throw new Error('Resume not found');
    }

    // Create version before updating
    await prisma.resumeVersion.create({
      data: {
        resumeId,
        versionNumber: existing.version,
        content: existing.content as any,
        changeSummary: 'Manual edit',
        changeType: 'manual',
      },
    });

    // Update resume
    const updated = await prisma.resume.update({
      where: { id: resumeId },
      data: {
        ...data,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  async deleteResume(resumeId: string, userId: string) {
    const existing = await prisma.resume.findFirst({
      where: { id: resumeId, userId, deletedAt: null },
    });

    if (!existing) {
      throw new Error('Resume not found');
    }

    await prisma.resume.update({
      where: { id: resumeId },
      data: { deletedAt: new Date() },
    });
  }

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
      try {
        structuredContent = JSON.parse(resume.content);
        console.log('Successfully parsed resume content as JSON');
      } catch (parseError) {
        console.log('Failed to parse resume content as JSON, treating as plain text:', parseError);
        // If not JSON, create basic structure
        structuredContent = {
          personalInfo: { fullName: 'Your Name' },
          summary: resume.content,
          experience: [],
          education: [],
          skills: [],
        };
      }
    } else {
      structuredContent = resume.content;
    }

    console.log('Structured content keys:', Object.keys(structuredContent));

    // Generate HTML from structured content
    const html = this.generateFormattedHTML(structuredContent, resume.template);
    console.log('Generated HTML length:', html.length);
    console.log('HTML preview:', html.substring(0, 500) + '...');

    // Convert HTML to PDF using puppeteer
    const puppeteer = require('puppeteer');

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new', // Use new headless mode
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

      console.log('Setting HTML content...');
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      // Wait for fonts and styles to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Generating PDF...');
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

      console.log('Generated PDF buffer length:', pdfBuffer.length);

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Generated PDF is empty');
      }

      console.log('Generated PDF buffer length:', pdfBuffer.length);

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Generated PDF is empty');
      }

      // Basic validation - check if buffer looks like a PDF
      const header = pdfBuffer.subarray(0, 4).toString();
      console.log('PDF header (first 4 bytes):', header, 'bytes:', Array.from(pdfBuffer.subarray(0, 4)));

      console.log('PDF generation successful, returning buffer');
      return pdfBuffer;

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Generated PDF is empty');
      }

      return pdfBuffer;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`Failed to generate PDF: ${(error as any).message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async exportToWord(resumeId: string, userId: string): Promise<Buffer> {
    try {
      const resume = await prisma.resume.findFirst({
        where: { id: resumeId, userId },
        include: { template: true }
      });

      if (!resume) {
        throw new Error('Resume not found');
      }

      const structuredResume = JSON.parse(resume.content);
      const { personalInfo, summary, experience, education, skills, certifications, projects } = structuredResume;

      const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');

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

      const buffer = await Packer.toBuffer(doc);
      console.log('Word document generated successfully, buffer length:', buffer.length);
      return buffer;
    } catch (error: any) {
      console.error('Error generating Word document:', error);
      throw new Error(`Failed to generate Word document: ${error.message}`);
    }
  }

  async parseResumeWithAI(text: string, userId: string) {
    // Use OpenRouter configuration like the existing AI service
    const OpenAI = require('openai');

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.BASE_URL || 'https://openrouter.ai/api/v1',
    });

    const model = process.env.ANALYSIS_MODEL || 'google/gemini-2.0-flash-exp:free';

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
      console.log('AI Response:', responseContent); // Debug log

      // Clean the response - remove any markdown formatting
      const cleanedContent = responseContent.replace(/```json\s*|\s*```/g, '').trim();

      const parsedContent = JSON.parse(cleanedContent);
      return parsedContent;
    } catch (error: any) {
      console.error('AI parsing error:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw new Error('Failed to parse resume with AI');
    }
  }

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