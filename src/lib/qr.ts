import { db } from './db';

// Agency type prefixes for serial number generation
export type AgencyType = 'hotel' | 'bus' | 'school' | 'clinic' | 'car_rental' | 'luggage_storage' | 'enterprise' | 'event';

export const AGENCY_TYPE_PREFIXES: Record<AgencyType, string> = {
  hotel: 'HOTEL',
  bus: 'BUS',
  school: 'SCHOOL',
  clinic: 'CLINIC',
  car_rental: 'CAR',
  luggage_storage: 'LOCKER',
  enterprise: 'CORP',
  event: 'EVENT',
};

export const ALL_AGENCY_TYPES: AgencyType[] = [
  'hotel', 'bus', 'school', 'clinic', 'car_rental', 'luggage_storage', 'enterprise', 'event'
];

// Tag type for expiration calculation
export type TagType = 'starter' | 'pro' | 'enterprise';

// Generate random alphanumeric string
export function generateRandomCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: I, O, 0, 1
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate unique serial number (single - for individual use)
// Format: TAG-{TYPE}-{6CHARS} e.g. TAG-HOTEL-MLQGY7, TAG-BUS-K9X2P4
export async function generateSerialNumber(agencyType: AgencyType): Promise<string> {
  const prefix = AGENCY_TYPE_PREFIXES[agencyType];

  let serial = '';
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    serial = `TAG-${prefix}-${generateRandomCode(6)}`;

    const existing = await db.baggage.findUnique({
      where: { reference: serial }
    });

    if (!existing) {
      return serial;
    }
    attempts++;
  }

  throw new Error('Failed to generate unique serial number');
}

/**
 * Generate multiple unique serial numbers in bulk - MUCH faster than calling generateSerialNumber one-by-one.
 * Generates all candidates, then checks uniqueness in a single DB query.
 * Replaces any duplicates and re-checks until all are unique.
 */
export async function generateSerialNumbersBulk(agencyType: AgencyType, count: number): Promise<string[]> {
  const prefix = AGENCY_TYPE_PREFIXES[agencyType];
  const uniqueSerials = new Set<string>();
  let iterations = 0;
  const maxIterations = 10; // Safety limit

  while (uniqueSerials.size < count && iterations < maxIterations) {
    // Generate candidates to fill the remaining slots
    const needed = count - uniqueSerials.size;
    const candidates: string[] = [];
    for (let i = 0; i < needed; i++) {
      candidates.push(`TAG-${prefix}-${generateRandomCode(6)}`);
    }

    // Check which ones already exist in DB (single query for all)
    const existing = await db.baggage.findMany({
      where: { reference: { in: candidates } },
      select: { reference: true },
    });
    const existingSet = new Set(existing.map(b => b.reference));

    // Add non-existing candidates
    for (const candidate of candidates) {
      if (!existingSet.has(candidate) && !uniqueSerials.has(candidate)) {
        uniqueSerials.add(candidate);
      }
    }

    iterations++;
  }

  if (uniqueSerials.size < count) {
    throw new Error(`Failed to generate ${count} unique serial numbers (only got ${uniqueSerials.size})`);
  }

  return Array.from(uniqueSerials);
}

// Generate multiple tags for an agency
export interface GenerateTagOptions {
  agencyType: AgencyType;
  agencyId?: string;
  count: number;
}

// Generate unique set ID
export function generateSetId(agencyType: AgencyType): string {
  const prefix = AGENCY_TYPE_PREFIXES[agencyType];
  const random = generateRandomCode(4);
  return `${prefix}-${new Date().getFullYear()}-${random}`;
}

/**
 * @deprecated Use bulk generation from the API route instead for large batches.
 * This function is kept for backwards compatibility with small individual generations.
 */
export async function generateTags(options: GenerateTagOptions): Promise<string[]> {
  const { agencyType, agencyId, count } = options;

  // Generate a unique set ID for this batch
  const setId = generateSetId(agencyType);

  // Use bulk serial number generation for efficiency
  const serialNumbers = await generateSerialNumbersBulk(agencyType, count);

  // Batch create all tags at once
  await db.baggage.createMany({
    data: serialNumbers.map((reference, i) => ({
      reference,
      type: agencyType,
      setId,
      agencyId: agencyId || null,
      baggageIndex: i + 1,
      baggageType: 'tag',
      status: 'created',
    })),
  });

  return serialNumbers;
}

// Calculate expiration date based on agency type and tag type
// starter: 30 days, pro: 365 days, enterprise: no expiry
export function calculateExpirationDate(agencyType: AgencyType, tagType: TagType = 'starter'): Date {
  const now = new Date();

  switch (tagType) {
    case 'starter':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days
    case 'pro':
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // +365 days
    case 'enterprise':
      // No expiry — set far future date (10 years)
      return new Date(now.getTime() + 3650 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
  }
}

// Validate serial number format
// Format: TAG-{TYPE}-{6CHARS} e.g. TAG-HOTEL-MLQGY7
export function isValidSerialNumberFormat(serial: string): boolean {
  const pattern = /^TAG-(HOTEL|BUS|SCHOOL|CLINIC|CAR|LOCKER|CORP|EVENT)-[A-Z0-9]{6}$/;
  return pattern.test(serial);
}

// Get tag status info
export function getTagStatusInfo(status: string) {
  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    created: {
      label: 'Créé',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    activated: {
      label: 'Activé',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    scanned: {
      label: 'Scanné',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    lost: {
      label: 'Perdu',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    found: {
      label: 'Retrouvé',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    blocked: {
      label: 'Bloqué',
      color: 'text-gray-800',
      bgColor: 'bg-gray-200'
    },
    expired: {
      label: 'Expiré',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
  };

  return statusMap[status] || {
    label: status,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  };
}
