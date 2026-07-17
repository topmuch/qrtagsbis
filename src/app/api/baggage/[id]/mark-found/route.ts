import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail, getEmailSettings, getBaggageFoundEmailTemplate } from '@/lib/email';

// PUT - Mark lost baggage as found
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

    // Only allow marking lost baggages as found
    if (baggage.status !== 'lost') {
      return NextResponse.json(
        { error: 'This baggage is not marked as lost' },
        { status: 400 }
      );
    }

    // Update baggage status and set foundAt timestamp
    const updatedBaggage = await db.baggage.update({
      where: { id },
      data: {
        status: 'found',
        foundAt: new Date(),
      }
    });

    // Mark any existing "baggage_declared_lost" notifications for this baggage as read
    await db.notification.updateMany({
      where: {
        baggageId: baggage.id,
        type: 'baggage_declared_lost',
        read: false,
      },
      data: {
        read: true,
      }
    });

    // 🔔 Create notification for SuperAdmin
    await db.notification.create({
      data: {
        type: 'baggage_found',
        userId: null, // broadcast to all superadmins
        agencyId: baggage.agencyId,
        baggageId: baggage.id,
        message: `Le bagage ${baggage.reference} a été marqué comme retrouvé !`,
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
        const template = getBaggageFoundEmailTemplate({
          reference: baggage.reference,
          agencyName: baggage.agency?.name || undefined,
          travelerName: baggage.travelerFirstName && baggage.travelerLastName
            ? `${baggage.travelerFirstName} ${baggage.travelerLastName}`
            : baggage.travelerFirstName || undefined,
          baggageType: baggage.baggageType,
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
            subject: `✅ Bagage retrouvé — ${baggage.reference}`,
            html: template.html,
            text: template.text,
            type: 'baggage_found',
            agencyId: baggage.agencyId || undefined,
            data: { reference: baggage.reference, agencyName: baggage.agency?.name, baggageId: baggage.id },
          });
          console.log(`📧 Found baggage notification sent for ${baggage.reference} to ${recipients.join(', ')}`);
        }
      }
    } catch (emailError) {
      console.error('Failed to send found baggage email notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Baggage marked as found',
      baggage: {
        id: updatedBaggage.id,
        reference: updatedBaggage.reference,
        status: updatedBaggage.status,
        foundAt: updatedBaggage.foundAt,
      }
    });

  } catch (error) {
    console.error('Mark found error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
