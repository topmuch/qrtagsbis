import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// GET - Export database as JSON file
export async function GET(request: NextRequest) {
  try {
    // Fetch all data from database
    const [
      users,
      agencies,
      baggages,
      scanLogs,
      settings,
      pages,
      banners,
      featureFlags,
      messages,
    ] = await Promise.all([
      db.user.findMany(),
      db.agency.findMany(),
      db.baggage.findMany(),
      db.scanLog.findMany(),
      db.setting.findMany(),
      db.page.findMany(),
      db.banner.findMany(),
      db.featureFlag.findMany(),
      db.message.findMany(),
    ]);

    // Create backup object
    const backup = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      data: {
        users,
        agencies,
        baggages,
        scanLogs,
        settings,
        pages,
        banners,
        featureFlags,
        messages,
      },
      stats: {
        users: users.length,
        agencies: agencies.length,
        baggages: baggages.length,
        scanLogs: scanLogs.length,
        settings: settings.length,
        pages: pages.length,
        banners: banners.length,
        featureFlags: featureFlags.length,
        messages: messages.length,
      }
    };

    // Create filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `qrtags-backup-${date}.json`;

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export database' },
      { status: 500 }
    );
  }
}
