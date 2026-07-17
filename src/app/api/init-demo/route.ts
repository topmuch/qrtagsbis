import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Initialize demo users for login
export async function GET() {
  try {
    // Check if superadmin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@qrtags.com' }
    });

    if (!existingAdmin) {
      // Hash passwords
      const adminPassword = await bcrypt.hash('admin123', 10);
      const agencyPassword = await bcrypt.hash('agence123', 10);

      // Create superadmin user
      await prisma.user.create({
        data: {
          email: 'admin@qrtags.com',
          name: 'Super Admin',
          password: adminPassword,
          role: 'superadmin',
        }
      });

      // Create demo agency first
      const demoAgency = await prisma.agency.create({
        data: {
          name: 'FRANCINE MAKELA',
          slug: 'francine-makela',
          email: 'contact@francine-makela.com',
          phone: '+221 77 123 45 67',
          address: 'Dakar, Sénégal',
          active: true,
        }
      });

      // Create demo agency user
      await prisma.user.create({
        data: {
          email: 'agence@qrtags.com',
          name: 'FRANCINE MAKELA',
          password: agencyPassword,
          role: 'agency',
          agencyId: demoAgency.id,
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Demo users created successfully',
        users: [
          { email: 'admin@qrtags.com', password: 'admin123', role: 'superadmin' },
          { email: 'agence@qrtags.com', password: 'agence123', role: 'agency' }
        ]
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Demo users already exist',
      users: [
        { email: 'admin@qrtags.com', password: 'admin123', role: 'superadmin' },
        { email: 'agence@qrtags.com', password: 'agence123', role: 'agency' }
      ]
    });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize demo users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
