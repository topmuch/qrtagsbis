import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail, getEmailSettings, getBaggageLostEmailTemplate } from '@/lib/email';

// PUT - Declare baggage as lost
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const baggage = await db.baggage.findUnique({
      where: { id },
      include: { agency: true }
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Baggage not found' },
        { status: 404 }
      );
    }

    // Only allow declaring active or scanned baggages as lost
    if (baggage.status !== 'active' && baggage.status !== 'scanned') {
      return NextResponse.json(
        { error: 'Cannot declare this baggage as lost' },
        { status: 400 }
      );
    }

    // Update baggage status and set declaredLostAt timestamp
    const updatedBaggage = await db.baggage.update({
      where: { id },
      data: {
        status: 'lost',
        declaredLostAt: new Date(),
      }
    });

    // 🔔 Create notification for SuperAdmin
    await db.notification.create({
      data: {
        type: 'baggage_declared_lost',
        userId: null, // broadcast to all superadmins
        agencyId: baggage.agencyId,
        baggageId: baggage.id,
        message: `🚨 L'agence ${baggage.agency?.name || 'Inconnue'} a déclaré le bagage ${baggage.reference} comme perdu`,
        data: JSON.stringify({
          reference: baggage.reference,
          agencyName: baggage.agency?.name,
          type: baggage.type,
        }),
        read: false,
      }
    });

    // 📧 Send email notifications
    try {
      const emailSettings = await getEmailSettings();
      if (emailSettings) {
        const template = getBaggageLostEmailTemplate({
          reference: baggage.reference,
          agencyName: baggage.agency?.name || undefined,
          travelerName: baggage.travelerFirstName && baggage.travelerLastName
            ? `${baggage.travelerFirstName} ${baggage.travelerLastName}`
            : baggage.travelerFirstName || undefined,
          baggageType: baggage.baggageType,
          destination: baggage.destination || undefined,
          flightNumber: baggage.flightNumber || undefined,
        });

        // Build recipients list
        const recipients: string[] = [];
        // Add admin recipient email
        if (emailSettings.recipientEmail) {
          recipients.push(emailSettings.recipientEmail);
        }
        // Add agency email
        if (baggage.agency?.email && !recipients.includes(baggage.agency.email)) {
          recipients.push(baggage.agency.email);
        }

        if (recipients.length > 0) {
          await sendEmail({
            to: recipients,
            subject: `🚨 Bagage perdu — ${baggage.reference}`,
            html: template.html,
            text: template.text,
            type: 'baggage_declared_lost',
            agencyId: baggage.agencyId || undefined,
            data: { reference: baggage.reference, agencyName: baggage.agency?.name, baggageId: baggage.id },
          });
          console.log(`📧 Lost baggage notification sent for ${baggage.reference} to ${recipients.join(', ')}`);
        }
      }
    } catch (emailError) {
      console.error('Failed to send lost baggage email notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Baggage declared as lost',
      baggage: {
        id: updatedBaggage.id,
        reference: updatedBaggage.reference,
        status: updatedBaggage.status,
        declaredLostAt: updatedBaggage.declaredLostAt,
      }
    });

  } catch (error) {
    console.error('Declare lost error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
