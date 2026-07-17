import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * Run auto-migration: add missing columns to the database.
 * This is needed because `prisma db push` may fail silently in Docker.
 */
async function autoMigrate() {
  const results: string[] = [];

  const expectedColumns: Record<string, Array<{ name: string; type: string; default?: string }>> = {
    User: [
      { name: 'name', type: 'TEXT', default: null },
      { name: 'staffRole', type: 'TEXT', default: null },
      { name: 'permissions', type: 'TEXT', default: "'[]'" },
      { name: 'isActive', type: 'BOOLEAN', default: '1' },
    ],
    Session: [
      { name: 'userAgent', type: 'TEXT', default: null },
      { name: 'ipAddress', type: 'TEXT', default: null },
      { name: 'lastActivity', type: 'DATETIME', default: "CURRENT_TIMESTAMP" },
    ],
    LoginLog: [
      { name: 'userId', type: 'TEXT', default: null },
      { name: 'email', type: 'TEXT', default: null },
      { name: 'success', type: 'BOOLEAN', default: '0' },
      { name: 'failureReason', type: 'TEXT', default: null },
      { name: 'ipAddress', type: 'TEXT', default: null },
      { name: 'userAgent', type: 'TEXT', default: null },
      { name: 'country', type: 'TEXT', default: null },
      { name: 'city', type: 'TEXT', default: null },
    ],
    Agency: [
      { name: 'agencyTypeId', type: 'TEXT', default: null },
      { name: 'logoUrl', type: 'TEXT', default: null },
      { name: 'primaryColor', type: 'TEXT', default: "'#2563EB'" },
      { name: 'secondaryColor', type: 'TEXT', default: "'#F59E0B'" },
      { name: 'customMessage', type: 'TEXT', default: null },
      { name: 'contactEmail', type: 'TEXT', default: null },
      { name: 'contactPhone', type: 'TEXT', default: null },
      { name: 'active', type: 'BOOLEAN', default: '1' },
      { name: 'onboardingCompleted', type: 'BOOLEAN', default: '0' },
      { name: 'onboardingStep', type: 'INTEGER', default: '0' },
    ],
  };

  for (const [tableName, columns] of Object.entries(expectedColumns)) {
    try {
      const tableInfo = await db.$queryRawUnsafe(
        `PRAGMA table_info("${tableName}")`
      ) as Array<{ name: string }>;
      const existingColumns = tableInfo.map((col) => col.name);

      for (const col of columns) {
        if (!existingColumns.includes(col.name)) {
          try {
            const defaultClause = col.default ? ` DEFAULT ${col.default}` : '';
            await db.$executeRawUnsafe(
              `ALTER TABLE "${tableName}" ADD COLUMN "${col.name}" ${col.type}${defaultClause}`
            );
            results.push(`Added ${tableName}.${col.name}`);
            console.log(`[auth/init] Migrated: added column ${tableName}.${col.name}`);
          } catch (alterError) {
            const msg = alterError instanceof Error ? alterError.message : String(alterError);
            if (!msg.includes('duplicate column name')) {
              console.error(`[auth/init] Migration error ${tableName}.${col.name}:`, msg);
            }
          }
        }
      }
    } catch {
      // Table doesn't exist - will be created by prisma
    }
  }

  return results;
}

/**
 * POST /api/auth/init
 * Auto-migrate database schema + initialize admin user.
 * Called automatically by the login page.
 */
export async function POST() {
  try {
    // Step 1: Auto-migrate missing columns
    console.log('[auth/init] Running auto-migration...');
    const migrationResults = await autoMigrate();

    // Step 2: Check/create admin user
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@qrtags.com').toLowerCase();

    // Try to find admin - use raw query as fallback in case schema is still broken
    let existingAdmin: { id: string; email: string; role: string; isActive: number } | null = null;
    try {
      existingAdmin = await db.user.findUnique({
        where: { email: adminEmail },
        select: { id: true, email: true, role: true, isActive: true },
      });
    } catch {
      // If Prisma query fails, try raw SQL
      try {
        const rawResult = await db.$queryRawUnsafe(
          `SELECT id, email, role, isActive FROM User WHERE email = '${adminEmail}'`
        ) as Array<{ id: string; email: string; role: string; isActive: number }>;
        existingAdmin = rawResult[0] || null;
      } catch (rawError) {
        console.error('[auth/init] Raw query also failed:', rawError);
      }
    }

    if (existingAdmin) {
      return NextResponse.json({
        initialized: false,
        message: 'Admin user already exists',
        email: adminEmail,
        migrated: migrationResults,
      });
    }

    // Create the superadmin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Super Admin QRTags';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    try {
      const admin = await db.user.create({
        data: {
          email: adminEmail,
          name: adminName,
          password: hashedPassword,
          role: 'superadmin',
          permissions: JSON.stringify([
            'VIEW_DASHBOARD', 'MANAGE_TAGS', 'MANAGE_AGENCIES', 'MANAGE_USERS',
            'MANAGE_AGENCY_TYPES', 'MANAGE_SUBSCRIPTIONS', 'MANAGE_PAYMENTS',
            'MANAGE_SETTINGS', 'MANAGE_FEATURES', 'VIEW_WALLET', 'MANAGE_STAFF',
            'MANAGE_WHITE_LABEL', 'MANAGE_MESSAGES', 'MANAGE_BLOG',
            'MANAGE_ADVERTISEMENTS', 'MANAGE_CRM', 'VIEW_REPORTS',
            'MANAGE_BACKUP', 'MANAGE_SECURITY',
          ]),
          isActive: true,
        },
      });

      console.log(`[auth/init] SuperAdmin created: ${adminEmail}`);

      return NextResponse.json({
        initialized: true,
        message: 'Admin user created successfully',
        email: admin.email,
        migrated: migrationResults,
        warning: 'Change the default password after first login!',
      });
    } catch (createError) {
      console.error('[auth/init] Prisma create failed, trying raw SQL:', createError);

      // Fallback: create with raw SQL (minimal columns)
      const id = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const now = new Date().toISOString();
      try {
        await db.$executeRawUnsafe(
          `INSERT INTO User (id, email, name, password, role, permissions, isActive, createdAt, updatedAt)
           VALUES ('${id}', '${adminEmail}', '${adminName}', '${hashedPassword}', 'superadmin', '${JSON.stringify(['VIEW_DASHBOARD'])}', 1, '${now}', '${now}')`
        );
        console.log(`[auth/init] SuperAdmin created via raw SQL: ${adminEmail}`);
        return NextResponse.json({
          initialized: true,
          message: 'Admin user created via raw SQL',
          email: adminEmail,
          migrated: migrationResults,
          warning: 'Change the default password after first login!',
        });
      } catch (rawCreateError) {
        console.error('[auth/init] Raw SQL create also failed:', rawCreateError);
        return NextResponse.json(
          { error: 'Failed to create admin user', details: String(rawCreateError), migrated: migrationResults },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('[auth/init] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/init
 * Check if the admin user exists + check schema health
 */
export async function GET() {
  try {
    // Auto-migrate on GET too (for health checks)
    const migrationResults = await autoMigrate();

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@qrtags.com').toLowerCase();
    let adminExists = false;
    let adminInfo = null;

    try {
      const existingAdmin = await db.user.findUnique({
        where: { email: adminEmail },
        select: { id: true, email: true, role: true, isActive: true },
      });
      adminExists = !!existingAdmin;
      if (existingAdmin) {
        adminInfo = { email: existingAdmin.email, role: existingAdmin.role, isActive: existingAdmin.isActive };
      }
    } catch {
      // Schema might be broken - try raw query
      try {
        const rawResult = await db.$queryRawUnsafe(
          `SELECT id, email, role, isActive FROM User WHERE email = '${adminEmail}'`
        ) as Array<{ id: string; email: string; role: string; isActive: number }>;
        adminExists = rawResult.length > 0;
        if (adminExists) {
          adminInfo = { email: rawResult[0].email, role: rawResult[0].role, isActive: !!rawResult[0].isActive };
        }
      } catch {
        // Table might not exist at all
      }
    }

    return NextResponse.json({
      adminExists,
      admin: adminInfo,
      migrated: migrationResults,
    });
  } catch (error) {
    console.error('[auth/init] Error checking admin:', error);
    return NextResponse.json(
      { adminExists: false, error: String(error) },
      { status: 500 }
    );
  }
}
