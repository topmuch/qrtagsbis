import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createEmailToken, sendEmail, getVerificationEmailTemplate } from '@/lib/email';

// POST - Resend verification email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({ 
        success: true, 
        message: 'Si un compte existe, un email de vérification a été envoyé' 
      });
    }

    // Create new verification token
    const { token, code } = await createEmailToken(email, 'email_verification');
    
    // Build verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
    
    // Send verification email
    const template = getVerificationEmailTemplate(
      user.name || 'Utilisateur',
      verificationUrl,
      code
    );
    
    await sendEmail({
      to: email,
      subject: 'QRTags - Vérification de votre email',
      html: template.html,
      text: template.text,
      type: 'verification',
      userId: user.id
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Si un compte existe, un email de vérification a été envoyé' 
    });
  } catch (error) {
    console.error('Error resending verification:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    );
  }
}
