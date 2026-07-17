// QRTags - Create SuperAdmin User
// This script creates the default superadmin user on first deployment
// Run with: node scripts/create-admin.cjs

/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Force DATABASE_URL for Docker environment
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:/app/data/qrtags.db';
}

const prisma = new PrismaClient({
  log: ['error'],
});

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@qrtags.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.ADMIN_NAME || 'Super Admin QRTags';

  try {
    console.log(`[create-admin] Checking admin user: ${adminEmail}`);
    console.log(`[create-admin] DATABASE_URL: ${process.env.DATABASE_URL}`);

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log(`[create-admin] Admin user already exists: ${adminEmail} (role: ${existingAdmin.role})`);
      return;
    }

    // Hash password
    console.log('[create-admin] Hashing password...');
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create superadmin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: 'superadmin',
        permissions: JSON.stringify([
          'VIEW_DASHBOARD',
          'MANAGE_TAGS',
          'MANAGE_AGENCIES',
          'MANAGE_USERS',
          'MANAGE_AGENCY_TYPES',
          'MANAGE_SUBSCRIPTIONS',
          'MANAGE_PAYMENTS',
          'MANAGE_SETTINGS',
          'MANAGE_FEATURES',
          'VIEW_WALLET',
          'MANAGE_STAFF',
          'MANAGE_WHITE_LABEL',
          'MANAGE_MESSAGES',
          'MANAGE_BLOG',
          'MANAGE_ADVERTISEMENTS',
          'MANAGE_CRM',
          'VIEW_REPORTS',
          'MANAGE_BACKUP',
          'MANAGE_SECURITY',
        ]),
        isActive: true,
      }
    });

    console.log(`[create-admin] SuperAdmin created successfully!`);
    console.log(`[create-admin]    Email: ${adminEmail}`);
    console.log(`[create-admin]    Role: ${admin.role}`);
    console.log(`[create-admin]    WARNING: Change the default password after first login!`);
  } catch (error) {
    console.error('[create-admin] Error:', error.message);
    // Exit with error code so Docker knows something went wrong
    // But don't block the server from starting
    process.exitCode = 0;
  } finally {
    await prisma.$disconnect();
  }
}

main();
