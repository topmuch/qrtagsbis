import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { sendEmail, getEmailSettings, getNewLeadEmailTemplate } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Validation schema
const leadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(['new', 'contacted', 'in_discussion', 'qualified', 'converted', 'lost']).optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  agencyId: z.string().optional(),
  assignedToId: z.string().optional(),
});

// GET - List all leads
export async function GET() {
  try {
    const leads = await db.lead.findMany({
      include: {
        assignedTo: {
          select: { id: true, name: true }
        },
        _count: {
          select: { observations: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ leads });

  } catch (error) {
    console.error('Get leads error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Create new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received lead data:', body);

    const validatedData = leadSchema.parse(body);
    console.log('Validated data:', validatedData);

    const lead = await db.lead.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || '',
        company: validatedData.company || '',
        status: validatedData.status || 'new',
        source: validatedData.source || '',
        notes: validatedData.notes || '',
        agencyId: validatedData.agencyId || null,
        assignedToId: validatedData.assignedToId || null,
      }
    });

    console.log('Created lead:', lead);

    // 📧 Send email notification to superadmin
    try {
      const emailSettings = await getEmailSettings();
      if (emailSettings) {
        const recipientEmail = emailSettings.recipientEmail || emailSettings.fromEmail;
        if (recipientEmail) {
          const template = getNewLeadEmailTemplate({
            name: lead.name,
            email: lead.email,
            phone: lead.phone || undefined,
            company: lead.company || undefined,
            source: lead.source || undefined,
            notes: lead.notes || undefined,
          });

          await sendEmail({
            to: recipientEmail,
            subject: `🆕 Nouveau lead CRM — ${lead.name}${lead.company ? ` (${lead.company})` : ''}`,
            html: template.html,
            text: template.text,
            type: 'new_lead',
          });
          console.log(`📧 New lead notification sent for ${lead.name} to ${recipientEmail}`);
        }
      }
    } catch (emailError) {
      console.error('Failed to send new lead email:', emailError);
    }

    // 🔔 Create in-app notification for SuperAdmin
    await db.notification.create({
      data: {
        type: 'new_lead',
        message: `🆕 Nouveau lead : ${lead.name}${lead.company ? ` — ${lead.company}` : ''}`,
        read: false,
      }
    });

    return NextResponse.json({ lead });

  } catch (error) {
    console.error('Create lead error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: (error as z.ZodError).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update lead
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, email, phone, company, status, source, notes, agencyId, assignedToId } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    // Only include fields that are actually provided
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (status !== undefined) updateData.status = status;
    if (source !== undefined) updateData.source = source;
    if (notes !== undefined) updateData.notes = notes;
    if (agencyId !== undefined) updateData.agencyId = agencyId;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;

    const lead = await db.lead.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ lead });

  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete lead
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    await db.lead.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
