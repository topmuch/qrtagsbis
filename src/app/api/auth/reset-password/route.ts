import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyEmailToken, verifyEmailCode } from '@/lib/email';

// POST - Reset password with token or code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, code, email, password } = body;

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    let userEmail: string | null = null;

    // Verify token or code
    if (token) {
      const result = await verifyEmailToken(token, 'password_reset');
      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      userEmail = result.email || null;
    } else if (code && email) {
      const result = await verifyEmailCode(code, email, 'password_reset');
      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      userEmail = email;
    } else {
      return NextResponse.json(
        { error: 'Token ou code requis' },
        { status: 400 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Impossible de vérifier l\'identité' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Mot de passe réinitialisé avec succès' 
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation du mot de passe' },
      { status: 500 }
    );
  }
}
