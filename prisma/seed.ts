import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Use bcrypt for password hashing (same as auth.ts)
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌱 Starting seed...');

  // Create settings
  console.log('Creating settings...');
  const settings = [
    { key: 'company_name', value: 'QRBag' },
    { key: 'company_address', value: 'Poissy, France' },
    { key: 'company_phone', value: '+33 7 45 34 93 39' },
    { key: 'company_email', value: 'contact@qrbag.com' },
    { key: 'seo_title', value: 'QRBag - Protection intelligente des bagages' },
    { key: 'seo_description', value: 'Protégez vos bagages avec un autocollant QR intelligent. Sans application, sans batterie, sans GPS.' },
    { key: 'seo_keywords', value: 'QR, bagage, voyage, hajj, protection, sticker' },
    { key: 'languages', value: 'fr,en,ar' },
    { key: 'default_language', value: 'fr' },
    { key: 'currency', value: 'EUR' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  // Create demo agency
  console.log('Creating demo agency...');
  const agency = await prisma.agency.upsert({
    where: { slug: 'ashraf_voyages' },
    update: {},
    create: {
      id: 'demo-agency-1',
      name: 'Ashraf Voyages',
      slug: 'ashraf_voyages',
      email: 'contact@ashrafvoyages.com',
      phone: '+33 6 00 00 00 00',
      address: 'Paris, France',
    },
  });

  // Create superadmin user
  console.log('Creating superadmin user...');
  await prisma.user.upsert({
    where: { email: 'admin@qrbag.com' },
    update: {
      password: await hashPassword('admin123'),
    },
    create: {
      email: 'admin@qrbag.com',
      name: 'SuperAdmin',
      password: await hashPassword('admin123'),
      role: 'superadmin',
    },
  });

  // Create agency user
  console.log('Creating agency user...');
  await prisma.user.upsert({
    where: { email: 'agency@qrbag.com' },
    update: {
      password: await hashPassword('agency123'),
    },
    create: {
      email: 'agency@qrbag.com',
      name: 'Chef Agence',
      password: await hashPassword('agency123'),
      role: 'agency',
      agencyId: agency.id,
    },
  });

  // Create sample baggages
  console.log('Creating sample baggages...');
  
  // Hajj baggages (3 per pilgrim)
  const hajjReferences = [
    'HAJJ25-MLQGY7',
    'HAJJ25-K9X2P4',
    'HAJJ25-ABC123',
  ];

  for (let i = 0; i < hajjReferences.length; i++) {
    await prisma.baggage.create({
      data: {
        reference: hajjReferences[i],
        type: 'hajj',
        agencyId: agency.id,
        baggageIndex: i + 1,
        baggageType: i === 0 ? 'cabine' : 'soute',
        status: 'pending_activation',
      },
    });
  }

  // Voyageur baggage (activated)
  await prisma.baggage.create({
    data: {
      reference: 'VOL25-DEMO01',
      type: 'voyageur',
      agencyId: null,
      travelerFirstName: 'Marie',
      travelerLastName: 'Dupont',
      whatsappOwner: '+33612345678',
      flightNumber: 'AF1234',
      destination: 'Tokyo',
      baggageIndex: 1,
      baggageType: 'cabine',
      status: 'active',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
    },
  });

  // Hajj baggage (activated)
  await prisma.baggage.create({
    data: {
      reference: 'HAJJ25-ACTIVE',
      type: 'hajj',
      agencyId: agency.id,
      travelerFirstName: 'Ahmed',
      travelerLastName: 'Diop',
      whatsappOwner: '+221784858226',
      baggageIndex: 1,
      baggageType: 'cabine',
      status: 'active',
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    },
  });

  // Lost baggage
  await prisma.baggage.create({
    data: {
      reference: 'HAJJ25-LOST01',
      type: 'hajj',
      agencyId: agency.id,
      travelerFirstName: 'Fatou',
      travelerLastName: 'Ndiaye',
      whatsappOwner: '+22177123456',
      baggageIndex: 1,
      baggageType: 'cabine',
      status: 'lost',
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      lastScanDate: new Date(),
      lastLocation: 'Aéroport de Jeddah',
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📋 Demo credentials:');
  console.log('  SuperAdmin: admin@qrbag.com / admin123');
  console.log('  Agency: agency@qrbag.com / agency123');
  console.log('');
  console.log('📱 Test QR codes:');
  console.log('  VOL25-DEMO01 - Active traveler baggage');
  console.log('  HAJJ25-ACTIVE - Active Hajj baggage');
  console.log('  HAJJ25-LOST01 - Lost Hajj baggage');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
