import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail, getEmailSettings, getAgencyMessageEmailTemplate } from '@/lib/email';

export const dynamic = 'force-dynamic';

// GET - Fetch messages for agency
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const type = searchParams.get('type');
    const unreadOnly = searchParams.get('unread') === 'true';

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    // If just requesting unread count
    if (searchParams.get('count') === 'true') {
      const unreadCount = await db.message.count({
        where: {
          OR: [
            { type: 'reponse_assistance', recipientAgencyId: agencyId, status: 'non_lu' },
            { type: 'message_superadmin', recipientAgencyId: agencyId, status: 'non_lu' },
          ],
        },
      });
      return NextResponse.json({ unreadCount });
    }

    const where: Record<string, unknown> = {};

    // Filter by type
    if (type === 'assistance_agence') {
      where.type = 'assistance_agence';
      where.agencyId = agencyId;
    } else if (type === 'reponse_assistance') {
      where.type = 'reponse_assistance';
      where.recipientAgencyId = agencyId;
    } else if (type === 'message_superadmin') {
      where.type = 'message_superadmin';
      where.recipientAgencyId = agencyId;
    }

    // Filter unread only
    if (unreadOnly) {
      where.status = 'non_lu';
    }

    const messages = await db.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Get unread count for incoming messages
    const unreadCount = await db.message.count({
      where: {
        OR: [
          { type: 'reponse_assistance', recipientAgencyId: agencyId, status: 'non_lu' },
          { type: 'message_superadmin', recipientAgencyId: agencyId, status: 'non_lu' },
        ],
      },
    });

    return NextResponse.json(
      { messages, unreadCount },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );

  } catch (error) {
    console.error('Error fetching agency messages:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des messages' },
      { status: 500 }
    );
  }
}

// POST - Create a new message from agency to superadmin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, agencyId, senderName, subject, content } = body;

    if (!type || !agencyId || !content) {
      return NextResponse.json(
        { error: 'Type, agency ID et contenu requis' },
        { status: 400 }
      );
    }

    const message = await db.message.create({
      data: {
        type,
        agencyId,
        senderName: senderName || null,
        subject: subject || null,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        status: 'non_lu',
      },
    });

    // 📧 Send email notification to superadmin
    try {
      const emailSettings = await getEmailSettings();
      if (emailSettings) {
        const recipientEmail = emailSettings.recipientEmail || emailSettings.fromEmail;
        if (recipientEmail) {
          const contentObj = typeof content === 'string' ? {} : content;
          const template = getAgencyMessageEmailTemplate({
            agencyName: senderName || 'Agence',
            subject: subject || undefined,
            message: typeof content === 'string' ? content : (contentObj.message || contentObj.description || JSON.stringify(content)),
            priority: typeof content === 'object' ? contentObj.priority : undefined,
            senderEmail: typeof content === 'object' ? contentObj.agencyEmail : undefined,
          });

          await sendEmail({
            to: recipientEmail,
            subject: `💬 Message de ${senderName || 'Agence'}${subject ? ` — ${subject}` : ''}`,
            html: template.html,
            text: template.text,
            type: 'agency_message',
            agencyId,
          });
          console.log(`📧 Agency message notification sent from ${senderName || 'Agence'} to ${recipientEmail}`);
        }
      }
    } catch (emailError) {
      console.error('Failed to send agency message email:', emailError);
    }

    // 🔔 Create in-app notification for SuperAdmin
    await db.notification.create({
      data: {
        type: 'agency_message',
        agencyId,
        message: `💬 ${senderName || 'Une agence'} vous a envoyé un message${subject ? ` : ${subject}` : ''}`,
        read: false,
      }
    });

    return NextResponse.json({ success: true, message });

  } catch (error) {
    console.error('Error creating agency message:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du message' },
      { status: 500 }
    );
  }
}

// PUT - Update message status (mark as read)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID et statut requis' },
        { status: 400 }
      );
    }

    const message = await db.message.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, message });

  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
