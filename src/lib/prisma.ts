import { PrismaClient } from '@prisma/client';

// Pour éviter les problèmes de hot-reload en dev
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
