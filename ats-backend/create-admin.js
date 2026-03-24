#!/usr/bin/env node

const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const prisma = new PrismaClient();

const usage = [
  'Usage:',
  '  npm run create-admin -- <email>',
  '  npm run create-admin <email>',
].join('\n');

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getEmailArgument = () => {
  const directArg = process.argv.slice(2).find((arg) => Boolean(arg && arg.trim()));
  if (directArg) {
    return directArg;
  }

  const npmArgvRaw = process.env.npm_config_argv;
  if (!npmArgvRaw) {
    return undefined;
  }

  try {
    const npmArgv = JSON.parse(npmArgvRaw);
    const originalArgs = Array.isArray(npmArgv?.original) ? npmArgv.original : [];

    const scriptIndex = originalArgs.findIndex((arg) => arg === 'create-admin');
    if (scriptIndex >= 0) {
      const candidate = originalArgs[scriptIndex + 1];
      if (candidate && candidate !== '--') {
        return candidate;
      }
    }

    const dashIndex = originalArgs.findIndex((arg) => arg === '--');
    if (dashIndex >= 0) {
      const candidate = originalArgs[dashIndex + 1];
      if (candidate) {
        return candidate;
      }
    }
  } catch (_error) {
    return undefined;
  }

  return undefined;
};

async function main() {
  const email = String(getEmailArgument() || '')
    .trim()
    .toLowerCase();

  if (!email || !isValidEmail(email)) {
    console.error('❌ Please provide a valid email address.');
    console.error(usage);
    process.exitCode = 1;
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      subscriptionTier: true,
      emailVerified: true,
      deletedAt: true,
    },
  });

  if (!existingUser) {
    console.error(`❌ User not found for email: ${email}`);
    process.exitCode = 1;
    return;
  }

  const updateData = {};

  if (existingUser.subscriptionTier !== 'admin') {
    updateData.subscriptionTier = 'admin';
  }

  if (!existingUser.emailVerified) {
    updateData.emailVerified = true;
  }

  if (existingUser.deletedAt) {
    updateData.deletedAt = null;
  }

  if (Object.keys(updateData).length === 0) {
    console.log(`✅ ${existingUser.email} is already an active admin.`);
    return;
  }

  const updatedUser = await prisma.user.update({
    where: { id: existingUser.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      subscriptionTier: true,
      emailVerified: true,
      deletedAt: true,
      updatedAt: true,
    },
  });

  console.log('✅ User promoted to admin successfully:');
  console.log(updatedUser);
}

main()
  .catch((error) => {
    console.error('❌ Failed to promote user to admin.');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
