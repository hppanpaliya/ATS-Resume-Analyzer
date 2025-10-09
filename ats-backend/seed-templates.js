import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTemplates() {
  try {
    const templates = [
      {
        id: 'modern',
        name: 'Modern Professional',
        description: 'Clean and contemporary design',
        category: 'Professional',
        design: JSON.stringify({
          fontFamily: 'Inter',
          primaryColor: '#2563eb',
          layout: 'modern'
        }),
        isActive: true,
        isPremium: false,
        atsScore: 95
      },
      {
        id: 'classic',
        name: 'Classic Corporate',
        description: 'Traditional business format',
        category: 'Corporate',
        design: JSON.stringify({
          fontFamily: 'Times New Roman',
          primaryColor: '#1f2937',
          layout: 'classic'
        }),
        isActive: true,
        isPremium: false,
        atsScore: 98
      },
      {
        id: 'creative',
        name: 'Creative Portfolio',
        description: 'Showcase your creative work',
        category: 'Creative',
        design: JSON.stringify({
          fontFamily: 'Poppins',
          primaryColor: '#7c3aed',
          layout: 'creative'
        }),
        isActive: true,
        isPremium: false,
        atsScore: 90
      }
    ];

    for (const template of templates) {
      await prisma.template.upsert({
        where: { id: template.id },
        update: template,
        create: template,
      });
    }

    console.log('Templates seeded successfully');
  } catch (error) {
    console.error('Error seeding templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTemplates();