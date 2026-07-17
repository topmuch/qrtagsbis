import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// POST - Import database from JSON file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const content = await file.text();
    const backup = JSON.parse(content);

    // Validate backup structure
    if (!backup.version || !backup.data) {
      return NextResponse.json(
        { error: 'Invalid backup file format' },
        { status: 400 }
      );
    }

    // Start transaction for atomic import
    const result = await db.$transaction(async (tx) => {
      let imported = {
        users: 0,
        agencies: 0,
        baggages: 0,
        scanLogs: 0,
        settings: 0,
        pages: 0,
        banners: 0,
        featureFlags: 0,
        messages: 0,
      };

      // Clear existing data (optional - comment out if you want to merge)
      // await tx.scanLog.deleteMany();
      // await tx.baggage.deleteMany();
      // await tx.user.deleteMany();
      // await tx.agency.deleteMany();
      // await tx.setting.deleteMany();
      // await tx.page.deleteMany();
      // await tx.banner.deleteMany();
      // await tx.featureFlag.deleteMany();
      // await tx.message.deleteMany();

      // Import agencies first (no dependencies)
      if (backup.data.agencies?.length > 0) {
        for (const agency of backup.data.agencies) {
          try {
            await tx.agency.upsert({
              where: { id: agency.id },
              create: agency,
              update: agency,
            });
            imported.agencies++;
          } catch (e) {
            console.error('Agency import error:', e);
          }
        }
      }

      // Import users (depends on agencies)
      if (backup.data.users?.length > 0) {
        for (const user of backup.data.users) {
          try {
            await tx.user.upsert({
              where: { id: user.id },
              create: user,
              update: user,
            });
            imported.users++;
          } catch (e) {
            console.error('User import error:', e);
          }
        }
      }

      // Import baggages (depends on agencies)
      if (backup.data.baggages?.length > 0) {
        for (const baggage of backup.data.baggages) {
          try {
            await tx.baggage.upsert({
              where: { id: baggage.id },
              create: baggage,
              update: baggage,
            });
            imported.baggages++;
          } catch (e) {
            console.error('Baggage import error:', e);
          }
        }
      }

      // Import scan logs (depends on baggages)
      if (backup.data.scanLogs?.length > 0) {
        for (const scanLog of backup.data.scanLogs) {
          try {
            await tx.scanLog.upsert({
              where: { id: scanLog.id },
              create: scanLog,
              update: scanLog,
            });
            imported.scanLogs++;
          } catch (e) {
            console.error('ScanLog import error:', e);
          }
        }
      }

      // Import settings
      if (backup.data.settings?.length > 0) {
        for (const setting of backup.data.settings) {
          try {
            await tx.setting.upsert({
              where: { id: setting.id },
              create: setting,
              update: setting,
            });
            imported.settings++;
          } catch (e) {
            console.error('Setting import error:', e);
          }
        }
      }

      // Import pages
      if (backup.data.pages?.length > 0) {
        for (const page of backup.data.pages) {
          try {
            await tx.page.upsert({
              where: { id: page.id },
              create: page,
              update: page,
            });
            imported.pages++;
          } catch (e) {
            console.error('Page import error:', e);
          }
        }
      }

      // Import banners
      if (backup.data.banners?.length > 0) {
        for (const banner of backup.data.banners) {
          try {
            await tx.banner.upsert({
              where: { id: banner.id },
              create: banner,
              update: banner,
            });
            imported.banners++;
          } catch (e) {
            console.error('Banner import error:', e);
          }
        }
      }

      // Import feature flags
      if (backup.data.featureFlags?.length > 0) {
        for (const featureFlag of backup.data.featureFlags) {
          try {
            await tx.featureFlag.upsert({
              where: { id: featureFlag.id },
              create: featureFlag,
              update: featureFlag,
            });
            imported.featureFlags++;
          } catch (e) {
            console.error('FeatureFlag import error:', e);
          }
        }
      }

      // Import messages
      if (backup.data.messages?.length > 0) {
        for (const message of backup.data.messages) {
          try {
            await tx.message.upsert({
              where: { id: message.id },
              create: message,
              update: message,
            });
            imported.messages++;
          } catch (e) {
            console.error('Message import error:', e);
          }
        }
      }

      return imported;
    });

    return NextResponse.json({
      success: true,
      message: 'Database imported successfully',
      imported: result,
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import database' },
      { status: 500 }
    );
  }
}
