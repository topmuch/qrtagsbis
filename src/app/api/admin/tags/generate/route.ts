import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateSerialNumbersBulk, generateSetId, calculateExpirationDate, type AgencyType } from '@/lib/qr';
import { db } from '@/lib/db';
import { requireAuthApi } from '@/lib/auth-middleware';
import { AGENCY_TYPE_LIST } from '@/lib/agency-types';

// Schema for individual generation
const individualSchema = z.object({
  mode: z.literal('individual'),
  agencyType: z.enum(AGENCY_TYPE_LIST as unknown as [string, ...string[]]),
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().email().optional().or(z.literal('')),
  itemName: z.string().optional(),
  itemDescription: z.string().optional(),
  itemCategory: z.string().optional(),
  customData: z.record(z.string()).optional(),
  agencyId: z.string().optional(),
});

// Schema for batch generation
const batchSchema = z.object({
  mode: z.literal('batch'),
  agencyType: z.enum(AGENCY_TYPE_LIST as unknown as [string, ...string[]]),
  agencyId: z.string().min(1),
  count: z.number().min(1).max(1000),
});

// Combined schema using discriminated union
const combinedSchema = z.discriminatedUnion('mode', [
  individualSchema,
  batchSchema
]);

export async function POST(request: NextRequest) {
  try {
    await requireAuthApi();

    const body = await request.json();
    const validatedData = combinedSchema.parse(body);

    if (validatedData.mode === 'individual') {
      // Generate a single tag
      const references = await generateTagsIndividual({
        agencyType: validatedData.agencyType as AgencyType,
        ownerName: validatedData.ownerName,
        ownerPhone: validatedData.ownerPhone,
        ownerEmail: validatedData.ownerEmail || undefined,
        itemName: validatedData.itemName,
        itemDescription: validatedData.itemDescription,
        itemCategory: validatedData.itemCategory,
        customData: validatedData.customData,
        agencyId: validatedData.agencyId,
      });

      return NextResponse.json({
        success: true,
        generated: references.length,
        references
      });
    } else {
      // Generate tags in batch
      const result = await generateTagsBatch({
        agencyType: validatedData.agencyType as AgencyType,
        agencyId: validatedData.agencyId,
        count: validatedData.count,
      });

      return NextResponse.json({
        success: true,
        generated: result.length,
        references: result
      });
    }
  } catch (error) {
    console.error('Generate tags error:', error);

    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * Generate a single tag with optional owner info
 */
async function generateTagsIndividual(options: {
  agencyType: AgencyType;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  itemName?: string;
  itemDescription?: string;
  itemCategory?: string;
  customData?: Record<string, string>;
  agencyId?: string;
}): Promise<string[]> {
  const { agencyType, ownerName, ownerPhone, ownerEmail, itemName, itemDescription, itemCategory, customData, agencyId } = options;

  const setId = generateSetId(agencyType);
  const expiresAt = calculateExpirationDate(agencyType, 'starter');

  // Generate 1 unique serial number
  const serialNumbers = await generateSerialNumbersBulk(agencyType, 1);

  await db.tag.create({
    data: {
      serialNumber: serialNumbers[0],
      tagType: 'standard',
      setId,
      agencyId: agencyId || null,
      status: ownerName ? 'activated' : 'created',
      ownerName: ownerName || null,
      ownerPhone: ownerPhone || null,
      ownerEmail: ownerEmail || null,
      itemName: itemName || null,
      itemDescription: itemDescription || null,
      itemCategory: itemCategory || null,
      customData: customData ? JSON.stringify(customData) : '{}',
      activatedAt: ownerName ? new Date() : null,
      expiresAt,
    },
  });

  return serialNumbers;
}

/**
 * Generate tags in batch for an agency
 */
async function generateTagsBatch(options: {
  agencyType: AgencyType;
  agencyId: string;
  count: number;
}): Promise<string[]> {
  const { agencyType, agencyId, count } = options;

  console.log(`[GENERATE-TAGS] Starting bulk generation: ${count} tags for agency ${agencyId}`);

  // Generate all serial numbers in bulk
  const allSerialNumbers = await generateSerialNumbersBulk(agencyType, count);

  // Build all tag data
  const allData = allSerialNumbers.map((serialNumber, i) => ({
    serialNumber,
    tagType: 'standard',
    setId: generateSetId(agencyType),
    agencyId,
    status: 'created',
    customData: '{}',
  }));

  // Batch insert in chunks of 200
  const BATCH_SIZE = 200;
  for (let i = 0; i < allData.length; i += BATCH_SIZE) {
    const batch = allData.slice(i, i + BATCH_SIZE);
    await db.tag.createMany({ data: batch });
    console.log(`[GENERATE-TAGS] Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} tags`);
  }

  console.log(`[GENERATE-TAGS] Complete: ${count} tags generated`);
  return allSerialNumbers;
}
