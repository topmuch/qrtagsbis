import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force new PrismaClient to get latest schema changes
// This ensures we have access to all models including Lead
const createPrismaClient = () => {
  return new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Export type for TypeScript support
export type { PrismaClient }
