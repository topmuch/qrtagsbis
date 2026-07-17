import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateExpirationDate } from '@/lib/qr';
import { z } from 'zod';

// Validation schema for activation
const activateSchema = z.object({
  reference: z.string().min(1, 'Reference is required'),
  travelerFirstName: z.string().min(1, 'First name is required'),
  travelerLastName: z.string().min(1, 'Last name is required'),
  whatsappOwner: z.string().min(1, 'WhatsApp number is required'),
  airlineName: z.string().optional(),
  flightNumber: z.string().optional(),
  destination: z.string().optional(),
  departureDate: z.string().optional(),
  departureTime: z.string().optional(),
  // Transport mode support
  transportMode: z.enum(['flight', 'train', 'boat', 'bus']).optional(),
  trainCompany: z.string().optional(),
  trainNumber: z.string().optional(),
  shipName: z.string().optional(),
  shipCabin: z.string().optional(),
  busCompany: z.string().optional(),
  busLineNumber: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = activateSchema.parse(body);

    // Find the tag by serialNumber
    let tag = await db.tag.findUnique({
      where: { serialNumber: validatedData.reference },
      include: { agency: true }
    });

    // Fallback: try by id if it looks like a cuid
    if (!tag && validatedData.reference.startsWith('cm')) {
      tag = await db.tag.findUnique({
        where: { id: validatedData.reference },
        include: { agency: true }
      });
    }

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found', message: 'Code QR non valide' },
        { status: 404 }
      );
    }

    if (tag.status !== 'created') {
      return NextResponse.json(
        { error: 'Already activated', message: 'Ce tag a déjà été activé' },
        { status: 400 }
      );
    }

    // Calculate expiration date
    const expiresAt = calculateExpirationDate('voyageur', 'sticker');

    // Update tag with owner info
    const updatedTag = await db.tag.update({
      where: { id: tag.id },
      data: {
        ownerName: `${validatedData.travelerFirstName} ${validatedData.travelerLastName}`,
        ownerPhone: validatedData.whatsappOwner,
        ownerEmail: null,
        itemName: validatedData.transportMode === 'flight' ? 'Bagage vol' : 
                  validatedData.transportMode === 'train' ? 'Bagage train' :
                  validatedData.transportMode === 'boat' ? 'Bagage bateau' : 'Objet',
        itemDescription: validatedData.destination ? `Destination: ${validatedData.destination}` : null,
        itemCategory: 'bagage',
        locationNote: validatedData.destination || null,
        customData: JSON.stringify({
          transportMode: validatedData.transportMode || 'flight',
          airlineName: validatedData.airlineName || null,
          flightNumber: validatedData.flightNumber || null,
          trainCompany: validatedData.trainCompany || null,
          trainNumber: validatedData.trainNumber || null,
          shipName: validatedData.shipName || null,
          shipCabin: validatedData.shipCabin || null,
          busCompany: validatedData.busCompany || null,
          busLineNumber: validatedData.busLineNumber || null,
          departureDate: validatedData.departureDate || null,
          departureTime: validatedData.departureTime || null,
          travelerFirstName: validatedData.travelerFirstName,
          travelerLastName: validatedData.travelerLastName,
        }),
        status: 'activated',
        activatedAt: new Date(),
        expiresAt,
      }
    });

    // Create booking record
    if (tag.agencyId) {
      await db.booking.create({
        data: {
          tagId: tag.id,
          agencyId: tag.agencyId,
          customData: JSON.stringify({
            transportMode: validatedData.transportMode || 'flight',
            departureDate: validatedData.departureDate || null,
          }),
          status: 'active',
        }
      });
    }

    return NextResponse.json({
      success: true,
      baggage: {
        id: updatedTag.id,
        reference: updatedTag.serialNumber,
        type: updatedTag.tagType,
        status: updatedTag.status,
        expiresAt: updatedTag.expiresAt,
      }
    });

  } catch (error) {
    console.error('Activation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
