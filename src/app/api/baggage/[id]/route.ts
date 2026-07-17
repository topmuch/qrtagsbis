import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT - Update a baggage by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if baggage exists
    const existingBaggage = await db.baggage.findUnique({
      where: { id },
    });

    if (!existingBaggage) {
      return NextResponse.json(
        { error: 'Baggage not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    
    if (body.travelerFirstName !== undefined) {
      updateData.travelerFirstName = body.travelerFirstName || null;
    }
    if (body.travelerLastName !== undefined) {
      updateData.travelerLastName = body.travelerLastName || null;
    }
    if (body.whatsappOwner !== undefined) {
      updateData.whatsappOwner = body.whatsappOwner || null;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    // Update the baggage
    const updatedBaggage = await db.baggage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      baggage: {
        id: updatedBaggage.id,
        reference: updatedBaggage.reference,
        travelerFirstName: updatedBaggage.travelerFirstName,
        travelerLastName: updatedBaggage.travelerLastName,
        whatsappOwner: updatedBaggage.whatsappOwner,
        status: updatedBaggage.status,
      }
    });

  } catch (error) {
    console.error('Update baggage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a baggage by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if baggage exists
    const baggage = await db.baggage.findUnique({
      where: { id },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Baggage not found' },
        { status: 404 }
      );
    }

    // Delete related scan logs first
    await db.scanLog.deleteMany({
      where: { baggageId: id },
    });

    // Delete the baggage
    await db.baggage.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Baggage deleted successfully'
    });

  } catch (error) {
    console.error('Delete baggage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get a single baggage by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const baggage = await db.baggage.findUnique({
      where: { id },
      include: { agency: true },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Baggage not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: baggage.id,
      reference: baggage.reference,
      type: baggage.type,
      travelerFirstName: baggage.travelerFirstName,
      travelerLastName: baggage.travelerLastName,
      whatsappOwner: baggage.whatsappOwner,
      baggageIndex: baggage.baggageIndex,
      baggageType: baggage.baggageType,
      status: baggage.status,
      agencyId: baggage.agencyId,
      agency: baggage.agency ? {
        id: baggage.agency.id,
        name: baggage.agency.name,
        email: baggage.agency.email,
        phone: baggage.agency.phone,
      } : null,
      createdAt: baggage.createdAt,
      expiresAt: baggage.expiresAt,
      lastScanDate: baggage.lastScanDate,
      lastLocation: baggage.lastLocation,
      declaredLostAt: baggage.declaredLostAt,
      foundAt: baggage.foundAt,
    });

  } catch (error) {
    console.error('Get baggage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
