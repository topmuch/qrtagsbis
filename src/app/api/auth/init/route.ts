import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * POST /api/auth/init
 * Initialize the default superadmin user if it doesn't exist.
 * This is called automatically by the login page to ensure
 * the admin account is always available.
 */
export async function POST() {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@qrtags.com').toLowerCase();

    // Check if admin already exists
    const existingAdmin = await db.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      return NextResponse.json({
        initialized: false,
        message: 'Admin user already exists',
        email: adminEmail,
      });
    }

    // Create the superadmin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Super Admin QRTags';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await db.user.create({
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
      },
    });

    console.log(`[auth/init] SuperAdmin created: ${adminEmail}`);

    return NextResponse.json({
      initialized: true,
      message: 'Admin user created successfully',
      email: admin.email,
      warning: 'Change the default password after first login!',
    });
  } catch (error) {
    console.error('[auth/init] Error creating admin:', error);
    return NextResponse.json(
      { error: 'Failed to initialize admin user', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/init
 * Check if the admin user exists (for health check)
 */
export async function GET() {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@qrtags.com').toLowerCase();
    const existingAdmin = await db.user.findUnique({
      where: { email: adminEmail },
      select: { id: true, email: true, role: true, isActive: true },
    });

    return NextResponse.json({
      adminExists: !!existingAdmin,
      admin: existingAdmin ? { email: existingAdmin.email, role: existingAdmin.role, isActive: existingAdmin.isActive } : null,
    });
  } catch (error) {
    console.error('[auth/init] Error checking admin:', error);
    return NextResponse.json(
      { adminExists: false, error: String(error) },
      { status: 500 }
    );
  }
}
