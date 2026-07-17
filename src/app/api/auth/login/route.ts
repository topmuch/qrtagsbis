import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSession, logLoginAttempt } from '@/lib/session';

/**
 * Safely log a login attempt - never throws
 */
async function safeLogLoginAttempt(params: {
  userId?: string;
  email: string;
  success: boolean;
  failureReason?: string;
}) {
  try {
    await logLoginAttempt(params);
  } catch (error) {
    console.error('Failed to log login attempt:', error);
  }
}

export async function POST(request: NextRequest) {
  const { email, password, role } = await request.json();

  try {
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Rechercher l'utilisateur
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        agency: true,
      },
    });

    if (!user) {
      // Log failed attempt - user not found
      await safeLogLoginAttempt({
        email,
        success: false,
        failureReason: 'Utilisateur non trouvé',
      });

      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const isValidPassword = user.password ? await bcrypt.compare(password, user.password) : false;
    if (!isValidPassword) {
      // Log failed attempt - wrong password
      await safeLogLoginAttempt({
        userId: user.id,
        email,
        success: false,
        failureReason: 'Mot de passe incorrect',
      });

      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Vérifier le rôle
    if ((role === 'admin' || role === 'superadmin') && user.role !== 'superadmin') {
      await safeLogLoginAttempt({
        userId: user.id,
        email,
        success: false,
        failureReason: 'Accès admin non autorisé',
      });

      return NextResponse.json(
        { error: 'Accès non autorisé - Administrateur requis' },
        { status: 403 }
      );
    }

    if (role === 'agency' && user.role !== 'agency' && user.role !== 'superadmin') {
      await safeLogLoginAttempt({
        userId: user.id,
        email,
        success: false,
        failureReason: 'Accès agence non autorisé',
      });

      return NextResponse.json(
        { error: 'Accès non autorisé - Agence requise' },
        { status: 403 }
      );
    }

    // Créer une session sécurisée avec cookie HTTP-only
    await createSession(user.id);

    // Log successful login
    await safeLogLoginAttempt({
      userId: user.id,
      email,
      success: true,
    });

    // Retourner les infos utilisateur (sans le mot de passe)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        agencyId: user.agencyId,
        agency: user.agency,
      },
      redirectUrl: user.role === 'superadmin' ? '/admin/tableau-de-bord' : '/agence/tableau-de-bord',
    });
  } catch (error) {
    console.error('Login error:', error);

    // Log error (wrapped in try/catch to prevent double-throw)
    await safeLogLoginAttempt({
      email,
      success: false,
      failureReason: 'Erreur serveur',
    });

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
