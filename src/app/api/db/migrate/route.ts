import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/db/migrate
 * Auto-migrate: adds missing columns to the SQLite database.
 * This is needed because `prisma db push` may fail silently in Docker.
 * Safe to call multiple times (uses SQLite ALTER TABLE ADD COLUMN which
 * is idempotent if the column already exists).
 */
export async function GET() {
  const results: { table: string; column: string; status: string; error?: string }[] = [];

  // Define all expected columns for each table
  // This must match the Prisma schema
  const expectedColumns: Record<string, Array<{ name: string; type: string; default?: string }>> = {
    User: [
      { name: 'id', type: 'TEXT', default: null },
      { name: 'email', type: 'TEXT', default: null },
      { name: 'name', type: 'TEXT', default: null },
      { name: 'password', type: 'TEXT', default: null },
      { name: 'role', type: 'TEXT', default: "'agency'" },
      { name: 'agencyId', type: 'TEXT', default: null },
      { name: 'staffRole', type: 'TEXT', default: null },
      { name: 'permissions', type: 'TEXT', default: "'[]'" },
      { name: 'isActive', type: 'BOOLEAN', default: '1' },
      { name: 'createdAt', type: 'DATETIME', default: "CURRENT_TIMESTAMP" },
      { name: 'updatedAt', type: 'DATETIME', default: "CURRENT_TIMESTAMP" },
    ],
    Session: [
      { name: 'id', type: 'TEXT', default: null },
      { name: 'userId', type: 'TEXT', default: null },
      { name: 'userAgent', type: 'TEXT', default: null },
      { name: 'ipAddress', type: 'TEXT', default: null },
      { name: 'lastActivity', type: 'DATETIME', default: "CURRENT_TIMESTAMP" },
      { name: 'expiresAt', type: 'DATETIME', default: null },
      { name: 'createdAt', type: 'DATETIME', default: "CURRENT_TIMESTAMP" },
    ],
    LoginLog: [
      { name: 'id', type: 'TEXT', default: null },
      { name: 'userId', type: 'TEXT', default: null },
      { name: 'email', type: 'TEXT', default: null },
      { name: 'success', type: 'BOOLEAN', default: '0' },
      { name: 'failureReason', type: 'TEXT', default: null },
      { name: 'ipAddress', type: 'TEXT', default: null },
      { name: 'userAgent', type: 'TEXT', default: null },
      { name: 'country', type: 'TEXT', default: null },
      { name: 'city', type: 'TEXT', default: null },
      { name: 'createdAt', type: 'DATETIME', default: "CURRENT_TIMESTAMP" },
    ],
    AgencyType: [
      { name: 'id', type: 'TEXT', default: null },
      { name: 'name', type: 'TEXT', default: null },
      { name: 'label', type: 'TEXT', default: null },
      { name: 'icon', type: 'TEXT', default: null },
      { name: 'description', type: 'TEXT', default: null },
      { name: 'customFields', type: 'TEXT', default: "'[]'" },
      { name: 'color', type: 'TEXT', default: "'#2563EB'" },
      { name: 'isActive', type: 'BOOLEAN', default: '1' },
      { name: 'sortOrder', type: 'INTEGER', default: '0' },
      { name: 'createdAt', type: 'DATETIME', default: "CURRENT_TIMESTAMP" },
      { name: 'updatedAt', type: 'DATETIME', default: "CURRENT_TIMESTAMP" },
    ],
    Agency: [
      { name: 'id', type: 'TEXT', default: null },
      { name: 'name', type: 'TEXT', default: null },
      { name: 'slug', type: 'TEXT', default: null },
      { name: 'agencyTypeId', type: 'TEXT', default: null },
      { name: 'email', type: 'TEXT', default: null },
      { name: 'phone', type: 'TEXT', default: null },
      { name: 'address', type: 'TEXT', default: null },
      { name: 'city', type: 'TEXT', default: null },
      { name: 'country', type: 'TEXT', default: null },
      { name: 'logoUrl', type: 'TEXT', default: null },
      { name: 'primaryColor', type: 'TEXT', default: "'#2563EB'" },
      { name: 'secondaryColor', type: 'TEXT', default: "'#F59E0B'" },
      { name: 'customMessage', type: 'TEXT', default: null },
      { name: 'contactEmail', type: 'TEXT', default: null },
      { name: 'contactPhone', type: 'TEXT', default: null },
      { name: 'active', type: 'BOOLEAN', default: '1' },
      { name: 'onboardingCompleted', type: 'BOOLEAN', default: '0' },
      { name: 'onboardingStep', type: 'INTEGER', default: '0' },
      { name: 'createdAt', type: 'DATETIME', default: "CURRENT_TIMESTAMP" },
      { name: 'updatedAt', type: 'DATETIME', default: "CURRENT_TIMESTAMP" },
    ],
    Tag: [
      { name: 'id', type: 'TEXT', default: null },
      { name: 'serialNumber', type: 'TEXT', default: null },
      { name: 'qrCodeUrl', type: 'TEXT', default: null },
      { name: 'tagType', type: 'TEXT', default: "'standard'" },
      { name: 'agencyId', type: 'TEXT', default: null },
      { name: 'endUserId', type: 'TEXT', default: null },
      { name: 'status', type: 'TEXT', default: "'created'" },
      { name: 'customData', type: 'TEXT', default: "'{}'" },
      { name: 'ownerName', type: 'TEXT', default: null },
      { name: 'ownerPhone', type: 'TEXT', default: null },
      { name: 'ownerEmail', type: 'TEXT', default: null },
      { name: 'itemName', type: 'TEXT', default: null },
      { name: 'itemDescription', type: 'TEXT', default: null },
      { name: 'itemCategory', type: 'TEXT', default: null },
      { name: 'locationBuilding', type: 'TEXT', default: null },
      { name: 'locationRoom', type: 'TEXT', default: null },
      { name: 'locationNote', type: 'TEXT', default: null },
      { name: 'activatedAt', type: 'DATETIME', default: null },
      { name: 'expiresAt', type: 'DATETIME', default: null },
      { name: 'lastScanDate', type: 'DATETIME', default: null },
      { name: 'lastLocation', type: 'TEXT', default: null },
      { name: 'declaredLostAt', type: 'DATETIME', default: null },
      { name: 'foundAt', type: 'DATETIME', default: null },
      { name: 'founderName', type: 'TEXT', default: null },
      { name: 'founderPhone', type: 'TEXT', default: null },
      { name: 'founderEmail', type: 'TEXT', default: null },
      { name: 'founderMessage', type: 'TEXT', default: null },
      { name: 'founderAt', type: 'DATETIME', default: null },
      { name: 'setId', type: 'TEXT', default: null },
      { name: 'createdAt', type: 'DATETIME', default: "CURRENT_TIMESTAMP" },
      { name: 'updatedAt', type: 'DATETIME', default: "CURRENT_TIMESTAMP" },
    ],
  };

  try {
    for (const [tableName, columns] of Object.entries(expectedColumns)) {
      // Get existing columns for this table
      let existingColumns: string[] = [];
      try {
        const tableInfo = await db.$queryRawUnsafe(
          `PRAGMA table_info("${tableName}")`
        ) as Array<{ name: string }>;
        existingColumns = tableInfo.map((col) => col.name);
      } catch {
        // Table doesn't exist - it will be created by prisma db push
        for (const col of columns) {
          results.push({ table: tableName, column: col.name, status: 'table_missing' });
        }
        continue;
      }

      // Add missing columns
      for (const col of columns) {
        if (!existingColumns.includes(col.name)) {
          try {
            const defaultClause = col.default ? ` DEFAULT ${col.default}` : '';
            await db.$executeRawUnsafe(
              `ALTER TABLE "${tableName}" ADD COLUMN "${col.name}" ${col.type}${defaultClause}`
            );
            results.push({ table: tableName, column: col.name, status: 'added' });
            console.log(`[db/migrate] Added column ${tableName}.${col.name}`);
          } catch (alterError) {
            const msg = alterError instanceof Error ? alterError.message : String(alterError);
            // Column might already exist (race condition) - that's OK
            if (msg.includes('duplicate column name')) {
              results.push({ table: tableName, column: col.name, status: 'already_exists' });
            } else {
              results.push({ table: tableName, column: col.name, status: 'error', error: msg });
              console.error(`[db/migrate] Error adding ${tableName}.${col.name}:`, msg);
            }
          }
        } else {
          results.push({ table: tableName, column: col.name, status: 'exists' });
        }
      }
    }

    const added = results.filter(r => r.status === 'added').length;
    const errors = results.filter(r => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      message: added > 0
        ? `Migration complete: ${added} column(s) added, ${errors} error(s)`
        : 'Database schema is up to date',
      added,
      errors,
      details: results.filter(r => r.status !== 'exists'),
    });
  } catch (error) {
    console.error('[db/migrate] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        details: results,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/db/migrate
 * Same as GET but can be called programmatically
 */
export async function POST() {
  return GET();
}
