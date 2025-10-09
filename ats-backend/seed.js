import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  try {
    // Create a test user
    const passwordHash = await bcrypt.hash('password123', 10);

    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
      },
    });

    console.log('Test user created:', user);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();