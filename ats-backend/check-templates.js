import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTemplates() {
  try {
    const templates = await prisma.template.findMany();
    console.log('Templates in database:', templates);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplates();