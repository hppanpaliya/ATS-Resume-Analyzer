import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TemplateService {
  async getTemplates(category?: string, includeInactive = false) {
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (!includeInactive) {
      where.isActive = true;
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: { usageCount: 'desc' },
    });

    // Parse structure and defaultData for each template
    return templates.map(template => ({
      ...template,
      structure: template.structure ? JSON.parse(template.structure) : null,
      defaultData: template.defaultData ? JSON.parse(template.defaultData) : null,
    }));
  }

  async getTemplateById(templateId: string) {
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    return {
      ...template,
      structure: template.structure ? JSON.parse(template.structure) : null,
      defaultData: template.defaultData ? JSON.parse(template.defaultData) : null,
    };
  }

  async createTemplate(templateData: {
    name: string;
    description?: string;
    category?: string;
    design: string;
    structure?: any;
    defaultData?: any;
    previewImageUrl?: string;
    isPremium?: boolean;
    atsScore?: number;
  }) {
    const template = await prisma.template.create({
      data: {
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        design: templateData.design,
        structure: templateData.structure ? JSON.stringify(templateData.structure) : null,
        defaultData: templateData.defaultData ? JSON.stringify(templateData.defaultData) : null,
        previewImageUrl: templateData.previewImageUrl,
        isPremium: templateData.isPremium || false,
        atsScore: templateData.atsScore,
      },
    });

    return {
      ...template,
      structure: template.structure ? JSON.parse(template.structure) : null,
      defaultData: template.defaultData ? JSON.parse(template.defaultData) : null,
    };
  }

  async updateTemplate(templateId: string, updates: Partial<{
    name: string;
    description: string;
    category: string;
    design: string;
    structure: any;
    defaultData: any;
    previewImageUrl: string;
    isActive: boolean;
    isPremium: boolean;
    atsScore: number;
  }>) {
    const updateData: any = { ...updates };

    // Stringify JSON fields
    if (updates.structure !== undefined) {
      updateData.structure = updates.structure ? JSON.stringify(updates.structure) : null;
    }
    if (updates.defaultData !== undefined) {
      updateData.defaultData = updates.defaultData ? JSON.stringify(updates.defaultData) : null;
    }

    const template = await prisma.template.update({
      where: { id: templateId },
      data: updateData,
    });

    return {
      ...template,
      structure: template.structure ? JSON.parse(template.structure) : null,
      defaultData: template.defaultData ? JSON.parse(template.defaultData) : null,
    };
  }

  async incrementUsage(templateId: string) {
    await prisma.template.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });
  }

  async deleteTemplate(templateId: string) {
    // Check if template is being used
    const resumeCount = await prisma.resume.count({
      where: { templateId: templateId },
    });

    if (resumeCount > 0) {
      // Soft delete - just mark as inactive
      await prisma.template.update({
        where: { id: templateId },
        data: { isActive: false },
      });
      return { deleted: false, deactivated: true };
    } else {
      // Hard delete
      await prisma.template.delete({
        where: { id: templateId },
      });
      return { deleted: true, deactivated: false };
    }
  }

  // Seed some default templates
  async seedDefaultTemplates() {
    const defaultTemplates = [
      {
        name: 'Modern Professional',
        description: 'Clean and contemporary design perfect for tech and business roles',
        category: 'professional',
        design: `
          .resume-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
          .section-title { color: #667eea; border-bottom: 2px solid #667eea; }
          .experience-item { border-left: 3px solid #e5e7eb; padding-left: 1rem; }
        `,
        structure: {
          sections: ['personalInfo', 'summary', 'experience', 'education', 'skills'],
          layout: 'single-column',
          fonts: { primary: 'Inter', secondary: 'Inter' }
        },
        defaultData: {
          personalInfo: {
            fullName: 'Your Name',
            email: 'your.email@example.com',
            phone: '(555) 123-4567',
            location: 'City, State'
          },
          summary: 'Professional summary highlighting your key strengths and career goals.',
          experience: [],
          education: [],
          skills: []
        },
        atsScore: 95
      },
      {
        name: 'Classic Corporate',
        description: 'Traditional business format ideal for conservative industries',
        category: 'corporate',
        design: `
          .resume-header { background: #2d3748; color: white; }
          .section-title { color: #2d3748; font-weight: bold; text-transform: uppercase; }
          .experience-item { margin-bottom: 1.5rem; }
        `,
        structure: {
          sections: ['personalInfo', 'summary', 'experience', 'education', 'skills'],
          layout: 'single-column',
          fonts: { primary: 'Times New Roman', secondary: 'Arial' }
        },
        defaultData: {
          personalInfo: {
            fullName: 'Your Name',
            email: 'your.email@example.com',
            phone: '(555) 123-4567',
            location: 'City, State'
          },
          summary: 'Professional summary highlighting your key strengths and career goals.',
          experience: [],
          education: [],
          skills: []
        },
        atsScore: 98
      },
      {
        name: 'Creative Portfolio',
        description: 'Showcase your creative work with a modern, artistic layout',
        category: 'creative',
        design: `
          .resume-header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }
          .section-title { color: #f5576c; font-style: italic; }
          .experience-item { background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
        `,
        structure: {
          sections: ['personalInfo', 'summary', 'experience', 'education', 'skills', 'portfolio'],
          layout: 'two-column',
          fonts: { primary: 'Poppins', secondary: 'Open Sans' }
        },
        defaultData: {
          personalInfo: {
            fullName: 'Your Name',
            email: 'your.email@example.com',
            phone: '(555) 123-4567',
            location: 'City, State',
            portfolio: 'https://yourportfolio.com'
          },
          summary: 'Creative professional with a passion for innovative design and problem-solving.',
          experience: [],
          education: [],
          skills: [],
          portfolio: []
        },
        atsScore: 85
      }
    ];

    const createdTemplates = [];
    for (const template of defaultTemplates) {
      try {
        const existing = await prisma.template.findUnique({
          where: { name: template.name }
        });

        if (!existing) {
          const created = await this.createTemplate(template);
          createdTemplates.push(created);
        }
      } catch (error) {
        console.error(`Failed to create template ${template.name}:`, error);
      }
    }

    return createdTemplates;
  }
}