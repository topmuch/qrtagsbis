import prisma from './prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Email provider types
export type EmailProvider = 'console' | 'smtp';

// Email settings interface
export interface EmailConfig {
  provider: EmailProvider;
  fromEmail: string;
  fromName: string;
  recipientEmail?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPassword?: string | null;
  smtpEncryption?: string;
}

// Email data interface
export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  type?: string;
  userId?: string;
  agencyId?: string;
  data?: Record<string, unknown>;
  // refonte-8: PDF/email attachments (nodemailer-native)
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Generate random token
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate 6-digit code
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get email settings from database
export async function getEmailSettings(): Promise<EmailConfig | null> {
  try {
    const settings = await prisma.emailSettings.findFirst();
    if (!settings) {
      // Return default console provider settings
      return {
        provider: 'console',
        fromEmail: 'noreply@qrtags.com',
        fromName: 'QRTags',
        smtpEncryption: 'tls',
      };
    }
    return {
      provider: settings.provider as EmailProvider,
      fromEmail: settings.fromEmail,
      fromName: settings.fromName,
      recipientEmail: settings.recipientEmail || null,
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUser: settings.smtpUser,
      smtpPassword: settings.smtpPassword,
      smtpEncryption: settings.smtpEncryption || 'tls',
    };
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return null;
  }
}

// Save email settings to database
export async function saveEmailSettings(config: Partial<EmailConfig>): Promise<EmailConfig | null> {
  try {
    const existing = await prisma.emailSettings.findFirst();
    
    if (existing) {
      const updated = await prisma.emailSettings.update({
        where: { id: existing.id },
        data: {
          provider: config.provider || existing.provider,
          fromEmail: config.fromEmail || existing.fromEmail,
          fromName: config.fromName || existing.fromName,
          recipientEmail: config.recipientEmail !== undefined ? config.recipientEmail || null : existing.recipientEmail,
          smtpHost: config.smtpHost,
          smtpPort: config.smtpPort,
          smtpUser: config.smtpUser,
          smtpPassword: config.smtpPassword,
          smtpEncryption: config.smtpEncryption || existing.smtpEncryption,
        },
      });
      return {
        provider: updated.provider as EmailProvider,
        fromEmail: updated.fromEmail,
        fromName: updated.fromName,
        recipientEmail: updated.recipientEmail || null,
        smtpHost: updated.smtpHost,
        smtpPort: updated.smtpPort,
        smtpUser: updated.smtpUser,
        smtpPassword: updated.smtpPassword,
        smtpEncryption: updated.smtpEncryption || 'tls',
      };
    } else {
      const created = await prisma.emailSettings.create({
        data: {
          provider: config.provider || 'console',
          fromEmail: config.fromEmail || 'noreply@qrtags.com',
          fromName: config.fromName || 'QRTags',
          recipientEmail: config.recipientEmail || null,
          smtpHost: config.smtpHost,
          smtpPort: config.smtpPort,
          smtpUser: config.smtpUser,
          smtpPassword: config.smtpPassword,
          smtpEncryption: config.smtpEncryption || 'tls',
        },
      });
      return {
        provider: created.provider as EmailProvider,
        fromEmail: created.fromEmail,
        fromName: created.fromName,
        recipientEmail: created.recipientEmail || null,
        smtpHost: created.smtpHost,
        smtpPort: created.smtpPort,
        smtpUser: created.smtpUser,
        smtpPassword: created.smtpPassword,
        smtpEncryption: created.smtpEncryption || 'tls',
      };
    }
  } catch (error) {
    console.error('Error saving email settings:', error);
    return null;
  }
}

// Log email to database
async function logEmail(
  to: string,
  subject: string,
  type: string,
  status: 'pending' | 'sent' | 'failed',
  error?: string,
  userId?: string,
  agencyId?: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        type,
        status,
        error,
        userId,
        agencyId,
        data: data ? JSON.stringify(data) : null,
        sentAt: status === 'sent' ? new Date() : null,
      },
    });
  } catch (logError) {
    console.error('Error logging email:', logError);
  }
}

// Update email test status
export async function updateTestStatus(success: boolean, error?: string): Promise<void> {
  try {
    const existing = await prisma.emailSettings.findFirst();
    if (existing) {
      await prisma.emailSettings.update({
        where: { id: existing.id },
        data: {
          lastTestAt: new Date(),
          lastTestStatus: success ? 'success' : 'failed',
          lastTestError: error || null,
        },
      });
    }
  } catch (updateError) {
    console.error('Error updating test status:', updateError);
  }
}

// Send via SMTP using nodemailer
async function sendViaSMTP(config: EmailConfig, emailData: EmailData): Promise<{ success: boolean; error?: string }> {
  if (!config.smtpHost || !config.smtpPort) {
    return { success: false, error: 'Configuration SMTP incomplète (hôte ou port manquant)' };
  }

  try {
    console.log('📧 SMTP Email — Connecting to:', config.smtpHost, 'port:', config.smtpPort);

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: Number(config.smtpPort),
      secure: config.smtpEncryption === 'ssl' || Number(config.smtpPort) === 465,
      auth: {
        user: config.smtpUser || '',
        pass: config.smtpPassword || '',
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify transporter connection
    await transporter.verify();
    console.log('📧 SMTP Email — Connection verified successfully');

    const toAddresses = Array.isArray(emailData.to) ? emailData.to : [emailData.to];

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: toAddresses.join(', '),
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      // refonte-8: pass through attachments (PDF, etc.) if provided
      ...(emailData.attachments && emailData.attachments.length > 0
        ? { attachments: emailData.attachments }
        : {}),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 SMTP Email — Sent successfully, Message ID:', info.messageId);

    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('📧 SMTP Email — Failed:', err.message);
    return { success: false, error: `Erreur SMTP: ${err.message}` };
  }
}

// Main send email function
export async function sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
  const config = await getEmailSettings();
  
  if (!config) {
    const error = 'Configuration email non trouvée';
    await logEmail(
      Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
      emailData.subject,
      emailData.type || 'general',
      'failed',
      error,
      emailData.userId,
      emailData.agencyId,
      emailData.data
    );
    return { success: false, error };
  }

  const toEmail = Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to;
  let result: { success: boolean; error?: string };

  switch (config.provider) {
    case 'smtp':
      result = await sendViaSMTP(config, emailData);
      break;
    case 'console':
    default:
      // Console mode - just log the email
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 EMAIL (Console Mode)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`From: ${config.fromName} <${config.fromEmail}>`);
      console.log(`To: ${toEmail}`);
      console.log(`Subject: ${emailData.subject}`);
      console.log(`Type: ${emailData.type || 'general'}`);
      if (emailData.attachments && emailData.attachments.length > 0) {
        console.log(`Attachments: ${emailData.attachments.map(a => `${a.filename} (${typeof a.content === 'string' ? a.content.length : a.content.length} bytes)`).join(', ')}`);
      }
      console.log('────────────────────────────────────────────────');
      console.log(emailData.text || emailData.html?.replace(/<[^>]*>/g, ''));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      result = { success: true };
      break;
  }

  // Log the email
  await logEmail(
    toEmail,
    emailData.subject,
    emailData.type || 'general',
    result.success ? 'sent' : 'failed',
    result.error,
    emailData.userId,
    emailData.agencyId,
    emailData.data
  );

  return result;
}

// ============ EMAIL TEMPLATES ============

export function getVerificationEmailTemplate(name: string, verificationUrl: string, code: string): { html: string; text: string } {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10B981; margin: 0;">QRTags</h1>
        </div>
        <div style="background: #f9f9f9; border-radius: 10px; padding: 30px;">
          <h2 style="color: #333; margin-top: 0;">Vérification de votre email</h2>
          <p style="color: #666;">Bonjour ${name},</p>
          <p style="color: #666;">Merci de vous être inscrit sur QRTags. Vérifiez votre adresse email en utilisant le code ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #fff; border: 2px solid #2563EB; border-radius: 10px; padding: 20px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563EB;">${code}</span>
            </div>
          </div>
          <p style="color: #666; text-align: center;">Ou cliquez sur le bouton suivant :</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${verificationUrl}" style="background: #2563EB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Vérifier mon email</a>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center;">Ce code expire dans 24 heures. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>© QRTags - Tous droits réservés</p>
        </div>
      </div>
    `,
    text: `QRTags - Vérification de votre email\n\nBonjour ${name},\n\nMerci de vous être inscrit sur QRTags.\n\nVotre code de vérification : ${code}\n\nOu utilisez ce lien : ${verificationUrl}\n\nCe code expire dans 24 heures. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.\n\n© QRTags`,
  };
}

export function getPasswordResetEmailTemplate(name: string, resetUrl: string, code: string): { html: string; text: string } {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10B981; margin: 0;">QRTags</h1>
        </div>
        <div style="background: #f9f9f9; border-radius: 10px; padding: 30px;">
          <h2 style="color: #333; margin-top: 0;">Réinitialisation de votre mot de passe</h2>
          <p style="color: #666;">Bonjour ${name},</p>
          <p style="color: #666;">Vous avez demandé la réinitialisation de votre mot de passe. Utilisez le code ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #fff; border: 2px solid #2563EB; border-radius: 10px; padding: 20px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563EB;">${code}</span>
            </div>
          </div>
          <p style="color: #666; text-align: center;">Ou cliquez sur le bouton suivant :</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" style="background: #2563EB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Réinitialiser mon mot de passe</a>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center;">Ce code expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>© QRTags - Tous droits réservés</p>
        </div>
      </div>
    `,
    text: `QRTags - Réinitialisation de votre mot de passe\n\nBonjour ${name},\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nVotre code : ${code}\n\nOu utilisez ce lien : ${resetUrl}\n\nCe code expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.\n\n© QRTags`,
  };
}

export function getTestEmailTemplate(): { html: string; text: string } {
  const now = new Date().toLocaleString('fr-FR');
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10B981; margin: 0;">QRTags</h1>
        </div>
        <div style="background: #f9f9f9; border-radius: 10px; padding: 30px;">
          <h2 style="color: #333; margin-top: 0;">Email de test</h2>
          <p style="color: #666;">Ceci est un email de test envoyé depuis le panneau d'administration QRTags.</p>
          <p style="color: #666;">Si vous recevez cet email, votre configuration email fonctionne correctement !</p>
          <div style="background: #e8f5e9; border-radius: 5px; padding: 15px; margin-top: 20px;">
            <p style="color: #2e7d32; margin: 0; font-weight: bold;">✓ Configuration email valide</p>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 12px;">Envoyé le ${now}</p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>© QRTags - Tous droits réservés</p>
        </div>
      </div>
    `,
    text: `QRTags - Email de test\n\nCeci est un email de test envoyé depuis le panneau d'administration QRTags.\n\nSi vous recevez cet email, votre configuration email fonctionne correctement !\n\n✓ Configuration email valide\nEnvoyé le ${now}\n\n© QRTags`,
  };
}

// ============ EMAIL TOKEN MANAGEMENT ============

export async function createEmailToken(email: string, type: 'email_verification' | 'password_reset'): Promise<{ token: string; code: string }> {
  const token = generateToken();
  const code = generateCode();
  
  // Set expiration: 24h for verification, 1h for password reset
  const expiresHours = type === 'email_verification' ? 24 : 1;
  const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000);
  
  // Delete any existing tokens for this email and type
  await prisma.emailToken.deleteMany({
    where: { email, type }
  });
  
  // Create new token
  await prisma.emailToken.create({
    data: {
      email,
      token,
      code,
      type,
      expiresAt,
    }
  });
  
  return { token, code };
}

export async function verifyEmailToken(token: string, type: 'email_verification' | 'password_reset'): Promise<{ valid: boolean; email?: string; error?: string }> {
  const emailToken = await prisma.emailToken.findFirst({
    where: {
      token,
      type,
      used: false,
      expiresAt: { gt: new Date() }
    }
  });
  
  if (!emailToken) {
    return { valid: false, error: 'Token invalide ou expiré' };
  }
  
  // Mark as used
  await prisma.emailToken.update({
    where: { id: emailToken.id },
    data: { used: true, usedAt: new Date() }
  });
  
  return { valid: true, email: emailToken.email };
}

export function getBaggageLostEmailTemplate(data: {
  reference: string;
  agencyName?: string;
  travelerName?: string;
  baggageType?: string;
  destination?: string;
  flightNumber?: string;
}): { html: string; text: string } {
  const now = new Date().toLocaleString('fr-FR');
  const travelerDisplay = data.travelerName ? `${data.travelerName}` : 'Non renseigné';
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10B981; margin: 0;">QRTags</h1>
        </div>
        <div style="background: #fff3f3; border: 2px solid #e74c3c; border-radius: 10px; padding: 30px;">
          <h2 style="color: #e74c3c; margin-top: 0;">🚨 Bagage déclaré comme perdu</h2>
          <p style="color: #666;">Un bagage a été signalé comme perdu. Voici les détails :</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Référence</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${data.reference}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Voyageur</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${travelerDisplay}</td>
            </tr>
            ${data.agencyName ? `
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Agence</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${data.agencyName}</td>
            </tr>` : ''}
            ${data.baggageType ? `
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Type de bagage</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${data.baggageType}</td>
            </tr>` : ''}
            ${data.flightNumber ? `
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Vol</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${data.flightNumber}</td>
            </tr>` : ''}
            ${data.destination ? `
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px;">Destination</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">${data.destination}</td>
            </tr>` : ''}
          </table>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">Notification automatique QRTags — ${now}</p>
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>© QRTags - Tous droits réservés</p>
        </div>
      </div>
    `,
    text: `🚨 QRTags - Bagage déclaré comme perdu\n\nRéférence: ${data.reference}\nVoyageur: ${travelerDisplay}\nAgence: ${data.agencyName || 'Non renseignée'}\nType: ${data.baggageType || 'Non renseigné'}\nVol: ${data.flightNumber || 'Non renseigné'}\nDestination: ${data.destination || 'Non renseignée'}\n\nNotification automatique QRTags — ${now}\n© QRTags`,
  };
}

export function getBaggageFoundEmailTemplate(data: {
  reference: string;
  agencyName?: string;
  travelerName?: string;
  baggageType?: string;
}): { html: string; text: string } {
  const now = new Date().toLocaleString('fr-FR');
  const travelerDisplay = data.travelerName ? `${data.travelerName}` : 'Non renseigné';
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10B981; margin: 0;">QRTags</h1>
        </div>
        <div style="background: #e8f5e9; border: 2px solid #27ae60; border-radius: 10px; padding: 30px;">
          <h2 style="color: #27ae60; margin-top: 0;">✅ Bagage retrouvé !</h2>
          <p style="color: #666;">Un bagage précédemment signalé comme perdu a été retrouvé. Voici les détails :</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Référence</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${data.reference}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Voyageur</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${travelerDisplay}</td>
            </tr>
            ${data.agencyName ? `
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Agence</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${data.agencyName}</td>
            </tr>` : ''}
            ${data.baggageType ? `
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px;">Type de bagage</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">${data.baggageType}</td>
            </tr>` : ''}
          </table>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">Notification automatique QRTags — ${now}</p>
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>© QRTags - Tous droits réservés</p>
        </div>
      </div>
    `,
    text: `✅ QRTags - Bagage retrouvé !\n\nRéférence: ${data.reference}\nVoyageur: ${travelerDisplay}\nAgence: ${data.agencyName || 'Non renseignée'}\nType: ${data.baggageType || 'Non renseigné'}\n\nNotification automatique QRTags — ${now}\n© QRTags`,
  };
}

export function getNewAgencyEmailTemplate(data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}): { html: string; text: string } {
  const now = new Date().toLocaleString('fr-FR');
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10B981; margin: 0;">QRTags</h1>
        </div>
        <div style="background: #eef2ff; border: 2px solid #6366f1; border-radius: 10px; padding: 30px;">
          <h2 style="color: #4f46e5; margin-top: 0;">🏢 Nouvelle agence créée</h2>
          <p style="color: #666;">Une nouvelle agence a été ajoutée au système :</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Nom de l'agence</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${data.name}</td>
            </tr>
            ${data.email ? `
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Email</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${data.email}</td>
            </tr>` : ''}
            ${data.phone ? `
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Téléphone</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${data.phone}</td>
            </tr>` : ''}
            ${data.address ? `
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px;">Adresse</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">${data.address}</td>
            </tr>` : ''}
          </table>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">Notification automatique QRTags — ${now}</p>
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>© QRTags - Tous droits réservés</p>
        </div>
      </div>
    `,
    text: `🏢 QRTags - Nouvelle agence créée\n\nNom: ${data.name}\nEmail: ${data.email || 'Non renseigné'}\nTéléphone: ${data.phone || 'Non renseigné'}\nAdresse: ${data.address || 'Non renseignée'}\n\nNotification automatique QRTags — ${now}\n© QRTags`,
  };
}

export function getAgencyMessageEmailTemplate(data: {
  agencyName: string;
  subject?: string;
  message: string;
  priority?: string;
  senderEmail?: string;
}): { html: string; text: string } {
  const now = new Date().toLocaleString('fr-FR');
  const priorityBadge = data.priority === 'urgent'
    ? '<span style="background:#fee2e2;color:#dc2626;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:bold;">🔴 URGENT</span>'
    : data.priority === 'high'
    ? '<span style="background:#fef3c7;color:#d97706;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:bold;">🟡 HAUTE</span>'
    : '';
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10B981; margin: 0;">QRTags</h1>
        </div>
        <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 10px; padding: 30px;">
          <h2 style="color: #d97706; margin-top: 0;">💬 Nouveau message d'une agence</h2>
          ${priorityBadge ? `<div style="margin: 10px 0;">${priorityBadge}</div>` : ''}
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Agence</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${data.agencyName}</td>
            </tr>
            ${data.subject ? `
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Sujet</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${data.subject}</td>
            </tr>` : ''}
            ${data.senderEmail ? `
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Email agence</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${data.senderEmail}</td>
            </tr>` : ''}
          </table>
          <div style="background: #fff; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin-top: 20px;">
            <p style="color: #333; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
          </div>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">Notification automatique QRTags — ${now}</p>
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>© QRTags - Tous droits réservés</p>
        </div>
      </div>
    `,
    text: `💬 QRTags - Nouveau message d'une agence\n\nAgence: ${data.agencyName}\n${data.subject ? `Sujet: ${data.subject}\n` : ''}${data.senderEmail ? `Email: ${data.senderEmail}\n` : ''}${data.priority ? `Priorité: ${data.priority}\n` : ''}\nMessage:\n${data.message}\n\nNotification automatique QRTags — ${now}\n© QRTags`,
  };
}

export function getNewLeadEmailTemplate(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  notes?: string;
}): { html: string; text: string } {
  const now = new Date().toLocaleString('fr-FR');
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10B981; margin: 0;">QRTags</h1>
        </div>
        <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 10px; padding: 30px;">
          <h2 style="color: #2563EB; margin-top: 0;">🆕 Nouveau lead CRM</h2>
          <p style="color: #666;">Un nouveau prospect a été ajouté :</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Nom</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Email</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${data.email}</td>
            </tr>
            ${data.phone ? `
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Téléphone</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${data.phone}</td>
            </tr>` : ''}
            ${data.company ? `
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px; border-bottom: 1px solid #eee;">Entreprise</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333; border-bottom: 1px solid #eee;">${data.company}</td>
            </tr>` : ''}
            ${data.source ? `
            <tr>
              <td style="padding: 8px 0; color: #999; font-size: 14px;">Source</td>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">${data.source}</td>
            </tr>` : ''}
          </table>
          ${data.notes ? `<div style="background: #fff; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin-top: 20px;"><p style="color: #666; font-size: 14px;"><strong>Notes :</strong> ${data.notes}</p></div>` : ''}
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">Notification automatique QRTags — ${now}</p>
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>© QRTags - Tous droits réservés</p>
        </div>
      </div>
    `,
    text: `🆕 QRTags - Nouveau lead CRM\n\nNom: ${data.name}\nEmail: ${data.email}\nTéléphone: ${data.phone || 'Non renseigné'}\nEntreprise: ${data.company || 'Non renseignée'}\nSource: ${data.source || 'Non renseignée'}\n${data.notes ? `Notes: ${data.notes}\n` : ''}\nNotification automatique QRTags — ${now}\n© QRTags`,
  };
}

export async function verifyEmailCode(code: string, email: string, type: 'email_verification' | 'password_reset'): Promise<{ valid: boolean; error?: string }> {
  const emailToken = await prisma.emailToken.findFirst({
    where: {
      email,
      code,
      type,
      used: false,
      expiresAt: { gt: new Date() }
    }
  });
  
  if (!emailToken) {
    return { valid: false, error: 'Code invalide ou expiré' };
  }
  
  // Mark as used
  await prisma.emailToken.update({
    where: { id: emailToken.id },
    data: { used: true, usedAt: new Date() }
  });
  
  return { valid: true };
}

// ═══════════════════════════════════════════════════════
//  refonte-8: CHECKLIST EMAIL TEMPLATE
// ═══════════════════════════════════════════════════════

export interface ChecklistEmailData {
  firstName: string;
  lastName: string;
  code: string;            // public 6-char code
  verificationKey: string; // 8-char key required to view PDF
  publicUrl: string;       // absolute URL to /checklist/[code]
  itemsCount: number;
  destination: string;
  departureDate: string;
}

export function getChecklistEmailTemplate(data: ChecklistEmailData): { html: string; text: string } {
  const { firstName, lastName, code, verificationKey, publicUrl, itemsCount, destination, departureDate } = data;
  const fullName = `${firstName} ${lastName}`.trim();

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Attestation d'inventaire QRTags</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FDFBF7;">

  <!-- Header band -->
  <div style="background: #c5a643; padding: 20px 24px; border-radius: 12px 12px 0 0; border: 2px solid #1a1a1a; border-bottom: none;">
    <div style="font-size: 22px; font-weight: bold; color: #1a1a1a;">🏷️ QRTags</div>
    <div style="font-size: 12px; color: #1a1a1a; opacity: 0.75;">Attestation d'inventaire de voyage</div>
  </div>

  <!-- Body -->
  <div style="background: #ffffff; padding: 30px 24px; border: 2px solid #1a1a1a; border-top: none;">
    <h1 style="color: #1a1a1a; font-size: 22px; margin: 0 0 16px 0;">Bonjour ${firstName},</h1>

    <p style="color: #1a1a1a; line-height: 1.6; margin: 0 0 16px 0;">
      Votre attestation d'inventaire de voyage a été générée et certifiée électroniquement par QRTags.
      Elle contient <strong>${itemsCount} article${itemsCount > 1 ? 's' : ''}</strong> pour votre voyage vers
      <strong>${destination}</strong> prévu le <strong>${departureDate}</strong>.
    </p>

    <p style="color: #1a1a1a; line-height: 1.6; margin: 0 0 24px 0;">
      Le PDF horodaté est joint à cet email. Vous pouvez également le consulter en ligne sur la page publique ci-dessous.
    </p>

    <!-- Public URL block -->
    <div style="background: #fffbe6; border: 2px dashed #1a1a1a; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px;">
      <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">🔗 URL publique de l'attestation</div>
      <div style="font-size: 14px; color: #1a1a1a; font-weight: bold; word-break: break-all;">${publicUrl}</div>
    </div>

    <!-- Verification key block -->
    <div style="background: #fef2f2; border: 2px solid #c0392b; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
      <div style="font-size: 11px; color: #c0392b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">🔑 Clé de vérification (requise pour consulter le PDF en ligne)</div>
      <div style="font-size: 24px; color: #c0392b; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 4px;">${verificationKey}</div>
      <div style="font-size: 11px; color: #666; margin-top: 6px;">Code public : <strong>${code}</strong></div>
    </div>

    <!-- How to use -->
    <div style="background: #f9f9f9; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
      <div style="font-size: 13px; font-weight: bold; color: #1a1a1a; margin-bottom: 8px;">📌 Comment utiliser votre attestation :</div>
      <ol style="color: #555; line-height: 1.7; padding-left: 20px; margin: 0; font-size: 12px;">
        <li>Ouvrez l'URL publique ci-dessus dans votre navigateur.</li>
        <li>Saisissez la clé de vérification à 8 caractères.</li>
        <li>Consultez, téléchargez ou imprimez votre attestation horodatée.</li>
        <li>Le QR code sur le PDF permet à toute personne de vérifier son authenticité.</li>
      </ol>
    </div>

    <p style="color: #666; font-size: 12px; line-height: 1.5; margin: 0;">
      Conservez précieusement cet email. Il constitue votre preuve d'inventaire en cas de litige avec une compagnie aérienne.
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #1a1a1a; padding: 16px 24px; border-radius: 0 0 12px 12px; border: 2px solid #1a1a1a; border-top: none;">
    <div style="color: #c5a643; font-size: 12px; font-weight: bold;">QRTags — Plateforme objets perdus & trouvés</div>
    <div style="color: #999; font-size: 11px; margin-top: 4px;">qrtags.com • Document protégé par le protocole de certification QRTags</div>
  </div>

</body>
</html>
  `.trim();

  const text = `🏷️ QRTags — Attestation d'inventaire de voyage

Bonjour ${fullName},

Votre attestation d'inventaire de voyage a été générée et certifiée électroniquement par QRTags.
Elle contient ${itemsCount} article${itemsCount > 1 ? 's' : ''} pour votre voyage vers ${destination} prévu le ${departureDate}.

Le PDF horodaté est joint à cet email.

═══════════════════════════════════════════════
🔗 URL PUBLIQUE DE L'ATTESTATION
${publicUrl}

🔑 CLÉ DE VÉRIFICATION (requise pour consulter le PDF en ligne)
${verificationKey}

Code public : ${code}
═══════════════════════════════════════════════

Comment utiliser votre attestation :
1. Ouvrez l'URL publique ci-dessus dans votre navigateur.
2. Saisissez la clé de vérification à 8 caractères.
3. Consultez, téléchargez ou imprimez votre attestation.
4. Le QR code sur le PDF permet de vérifier son authenticité.

Conservez précieusement cet email. Il constitue votre preuve d'inventaire en cas de litige.

— L'équipe QRTags
qrtags.com
`.trim();

  return { html, text };
}
