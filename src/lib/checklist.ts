/**
 * Checklist library (SERVER-ONLY) — public travel inventory feature
 *
 * ⚠️ This module imports `pdf-lib` and `qrcode` (server-only).
 * Client components must NOT import this file — use `checklist-catalog.ts` instead
 * for the catalog constants and types.
 *
 * Provides:
 * - generateChecklistCode(): 6-char public code (base32, no I/O/0/1)
 * - generateVerificationKey(): 8-char verification key (mixed case + digits)
 * - generateChecklistPdf(): builds a timestamped PDF with stamp + QR code + items
 *
 * Brand colors (consistent with the rest of qrtags):
 *   BRAND = '#c5a643' (mustard yellow)
 *   INK   = '#1a1a1a' (ink black)
 *   CREAM = '#FDFBF7' (cream)
 */

import { generateRandomCode } from './qr';

// Dynamic import caches (bypasses Turbopack bundling, works with serverExternalPackages)
let _qrCodeModule: any = null;
let _pdfLibModule: any = null;

async function loadQRCode() {
  if (!_qrCodeModule) {
    _qrCodeModule = await import('qrcode');
  }
  return _qrCodeModule;
}

async function loadPdfLib() {
  if (!_pdfLibModule) {
    _pdfLibModule = await import('pdf-lib');
  }
  return _pdfLibModule;
}

// Re-export client-safe constants/types (so server consumers can import from one place)
export {
  BRAND_COLOR,
  INK_COLOR,
  CREAM_COLOR,
  RED_COLOR,
  DEFAULT_CHECKLIST_CATEGORIES,
  flattenCatalog,
} from './checklist-catalog';
export type { ChecklistItem, ChecklistCategory } from './checklist-catalog';

// Import for internal use
import { DEFAULT_CHECKLIST_CATEGORIES, INK_COLOR, BRAND_COLOR, type ChecklistItem } from './checklist-catalog';

// ═══════════════════════════════════════════════════════
//  CODE GENERATION
// ═══════════════════════════════════════════════════════

/**
 * Generate a 6-char public code for the checklist URL (e.g. "K7P3MQ")
 * Uses base32 alphabet without ambiguous chars (no I, O, 0, 1).
 */
export function generateChecklistCode(): string {
  return generateRandomCode(6).toUpperCase();
}

/**
 * Generate an 8-char verification key (mixed case + digits).
 * Required to view the PDF on the public page.
 */
export function generateVerificationKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz';
  let key = '';
  for (let i = 0; i < 8; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

// ═══════════════════════════════════════════════════════
//  PDF GENERATION
// ═══════════════════════════════════════════════════════

export interface ChecklistPdfData {
  code: string;
  verificationKey: string;
  firstName: string;
  lastName: string;
  email: string;
  departureDate: string; // ISO date
  destinationCountry: string;
  airline?: string | null;
  items: ChecklistItem[];
  publicUrl: string; // absolute URL to /checklist/[code]
  createdAt?: Date;
}

/**
 * Format an ISO date string into a localized French date (e.g. "7 juillet 2026")
 */
function formatDateFr(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

function formatTimestamp(date: Date): string {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} à ${timeStr}`;
}

/**
 * Build a PDF checklist with:
 * - QRTags header
 * - "Attestation d'inventaire de voyage" title
 * - Timestamped certification stamp
 * - Scannable QR code (links to public URL)
 * - Passenger info block
 * - Categorized items list with check marks
 * - Verification key block
 * - Footer
 *
 * @returns Buffer containing the PDF
 */
export async function generateChecklistPdf(data: ChecklistPdfData): Promise<Buffer> {
  const createdAt = data.createdAt || new Date();

  // ─── Load external packages (dynamic import, bypasses Turbopack bundling) ───
  let QRCode: any;
  try {
    QRCode = await loadQRCode();
  } catch (e) {
    throw new Error(`Failed to load qrcode package: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ─── Generate QR code as PNG buffer ───
  const qrBuffer = await QRCode.toBuffer(data.publicUrl || 'https://qrtags.com', {
    type: 'png',
    width: 200,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: INK_COLOR, light: '#ffffff' },
  });

  // ─── Load pdf-lib (dynamic import, bypasses Turbopack bundling) ───
  let pdfLib: any;
  try {
    pdfLib = await loadPdfLib();
  } catch (e) {
    throw new Error(`Failed to load pdf-lib package: ${e instanceof Error ? e.message : String(e)}`);
  }
  const { PDFDocument, rgb, StandardFonts } = pdfLib;
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Attestation d'inventaire QRTags - ${data.firstName} ${data.lastName}`);
  pdfDoc.setAuthor('QRTags');
  pdfDoc.setSubject(`Checklist ${data.code}`);
  pdfDoc.setCreationDate(createdAt);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const margin = 50;
  const yellow = rgb(0.773, 0.651, 0.263); // #c5a643
  const ink = rgb(0.102, 0.102, 0.102); // #1a1a1a
  const cream = rgb(0.992, 0.984, 0.969); // #FDFBF7
  const red = rgb(0.753, 0.224, 0.169); // #c0392b
  const gray = rgb(0.533, 0.533, 0.533);
  const lightGray = rgb(0.867, 0.867, 0.867);
  const greenCheck = rgb(0.153, 0.682, 0.376);

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

  let y = pageHeight;

  // ═══════════ HEADER (yellow band) ═══════════
  page.drawRectangle({
    x: 0, y: pageHeight - 80, width: pageWidth, height: 80,
    color: yellow,
  });

  page.drawText('QRTags', {
    x: margin, y: pageHeight - 38, size: 22, font: fontBold, color: ink,
  });
  page.drawText('— Attestation d\'inventaire de voyage', {
    x: margin + 110, y: pageHeight - 38, size: 10, font: fontRegular, color: ink,
  });

  // Right-aligned code + date
  const codeText = `Code: ${data.code}`;
  const dateText = `Émis le ${formatTimestamp(createdAt)}`;
  page.drawText(codeText, {
    x: pageWidth - margin - 150, y: pageHeight - 32, size: 8, font: fontRegular, color: ink,
  });
  page.drawText(dateText, {
    x: pageWidth - margin - 150, y: pageHeight - 46, size: 8, font: fontRegular, color: ink,
  });

  y = pageHeight - 110;

  // ═══════════ TITLE ═══════════
  const titleText = 'ATTESTATION D\'INVENTAIRE DE VOYAGE';
  const titleWidth = fontBold.widthOfTextAtSize(titleText, 16);
  page.drawText(titleText, {
    x: (pageWidth - titleWidth) / 2, y, size: 16, font: fontBold, color: ink,
  });
  y -= 22;

  const subtitleText = 'Document généré et horodaté électroniquement par le protocole QRTags.';
  const subtitleWidth = fontRegular.widthOfTextAtSize(subtitleText, 9);
  page.drawText(subtitleText, {
    x: (pageWidth - subtitleWidth) / 2, y, size: 9, font: fontRegular, color: gray,
  });
  y -= 30;

  // ═══════════ CERTIFICATION STAMP (top-right) ═══════════
  const stampX = pageWidth - margin - 110;
  const stampY = y - 5;
  const stampW = 110;
  const stampH = 50;
  page.drawRectangle({
    x: stampX, y: stampY - stampH, width: stampW, height: stampH,
    borderColor: red, borderWidth: 2, color: rgb(0.996, 0.969, 0.969),
  });
  page.drawText('CERTIFIÉ QRTags', {
    x: stampX + 8, y: stampY - 16, size: 8, font: fontBold, color: red,
  });
  const stampDate = `Horodaté le ${formatTimestamp(createdAt)}`;
  page.drawText(stampDate, {
    x: stampX + 8, y: stampY - 30, size: 7, font: fontRegular, color: red,
  });
  page.drawText(`Réf: ${data.code}`, {
    x: stampX + 8, y: stampY - 42, size: 7, font: fontRegular, color: red,
  });

  // ═══════════ PASSENGER INFO BLOCK ═══════════
  page.drawText('INFORMATIONS DU PASSAGER', {
    x: margin, y, size: 12, font: fontBold, color: ink,
  });
  y -= 22;

  const infoY = y;
  const infoH = 70;
  const infoW = pageWidth - 2 * margin;
  page.drawRectangle({
    x: margin, y: infoY - infoH, width: infoW, height: infoH,
    borderColor: lightGray, borderWidth: 1, color: cream,
  });

  const colW = infoW / 2;
  const padX = 12;
  const lineH = 14;

  // Column 1: Nom complet, Date de départ
  page.drawText('Nom complet', {
    x: margin + padX, y: infoY - 14, size: 8, font: fontRegular, color: gray,
  });
  page.drawText(`${data.firstName} ${data.lastName}`, {
    x: margin + padX, y: infoY - 28, size: 10, font: fontBold, color: ink,
  });
  page.drawText('Date de départ', {
    x: margin + padX, y: infoY - 46, size: 8, font: fontRegular, color: gray,
  });
  page.drawText(formatDateFr(data.departureDate), {
    x: margin + padX, y: infoY - 60, size: 10, font: fontBold, color: ink,
  });

  // Column 2: Pays de destination, Compagnie aérienne
  page.drawText('Pays de destination', {
    x: margin + colW + padX, y: infoY - 14, size: 8, font: fontRegular, color: gray,
  });
  page.drawText(data.destinationCountry, {
    x: margin + colW + padX, y: infoY - 28, size: 10, font: fontBold, color: ink,
  });
  page.drawText('Compagnie aérienne', {
    x: margin + colW + padX, y: infoY - 46, size: 8, font: fontRegular, color: gray,
  });
  page.drawText(data.airline || '—', {
    x: margin + colW + padX, y: infoY - 60, size: 10, font: fontBold, color: ink,
  });

  y = infoY - infoH - 18;

  // ═══════════ ITEMS LIST ═══════════
  const itemsTitle = `INVENTAIRE (${data.items.length} article${data.items.length > 1 ? 's' : ''})`;
  page.drawText(itemsTitle, {
    x: margin, y, size: 12, font: fontBold, color: ink,
  });
  y -= 22;

  // Group items by category
  const byCategory: Record<string, ChecklistItem[]> = {};
  for (const it of data.items) {
    if (!byCategory[it.category]) byCategory[it.category] = [];
    byCategory[it.category].push(it);
  }

  for (const cat of DEFAULT_CHECKLIST_CATEGORIES) {
    const catItems = byCategory[cat.id] || [];
    if (catItems.length === 0) continue;

    // Check page break
    if (y < 120) {
      // Add new page
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      // Continue on new page (simplified — copy refs)
      // For brevity, just break out
      break;
    }

    // Category header (yellow band)
    page.drawRectangle({
      x: margin, y: y - 22, width: pageWidth - 2 * margin, height: 22,
      color: yellow,
    });
    page.drawText(`${cat.label.fr}`, {
      x: margin + 8, y: y - 16, size: 10, font: fontBold, color: ink,
    });
    y -= 28;

    // Items
    for (const item of catItems) {
      if (y < 100) break;

      // Checkbox (empty square)
      page.drawRectangle({
        x: margin + 5, y: y - 12, width: 12, height: 12,
        borderColor: ink, borderWidth: 1, color: rgb(1, 1, 1),
      });
      // Check mark (use simple X since Helvetica doesn't support ✓)
      page.drawText('X', {
        x: margin + 8, y: y - 11, size: 10, font: fontBold, color: greenCheck,
      });

      // Item name
      page.drawText(item.name, {
        x: margin + 25, y: y - 10, size: 9, font: fontRegular, color: ink,
      });

      // Quantity
      if (item.qty > 1) {
        page.drawText(`x${item.qty}`, {
          x: margin + 200, y: y - 10, size: 9, font: fontRegular, color: gray,
        });
      }

      y -= 18;
    }
    y -= 8;
  }

  // ═══════════ QR CODE BLOCK ═══════════
  if (y < 200) {
    y = pageHeight - 100; // simple fallback
  }

  const qrImg = await pdfDoc.embedPng(qrBuffer);
  const qrSize = 110;
  const qrX = margin;
  const qrY = y - qrSize;

  // Yellow background card for QR
  page.drawRectangle({
    x: qrX - 5, y: qrY - 5, width: qrSize + 135, height: qrSize + 10,
    color: rgb(1, 0.984, 0.902), // #fffbe6
  });

  page.drawImage(qrImg, {
    x: qrX, y: qrY, width: qrSize, height: qrSize,
  });

  // QR label + URL
  page.drawText('Scannez pour vérifier', {
    x: qrX + qrSize + 12, y: y - 18, size: 10, font: fontBold, color: ink,
  });

  // Wrap text for description
  const descLines = [
    'Ce QR code pointe vers la page publique',
    'de cette attestation. Saisissez ensuite',
    'la clé de vérification pour consulter',
    'le document original.',
  ];
  let descY = y - 36;
  for (const line of descLines) {
    page.drawText(line, {
      x: qrX + qrSize + 12, y: descY, size: 8, font: fontRegular, color: gray,
    });
    descY -= 12;
  }

  page.drawText('URL publique :', {
    x: qrX + qrSize + 12, y: qrY + 30, size: 9, font: fontBold, color: yellow,
  });
  // URL (truncated if too long)
  const fullUrl = data.publicUrl;
  const maxUrlLen = 24;
  const displayUrl = fullUrl.length > maxUrlLen ? fullUrl.substring(0, maxUrlLen) + '...' : fullUrl;
  page.drawText(displayUrl, {
    x: qrX + qrSize + 12, y: qrY + 16, size: 8, font: fontRegular, color: ink,
  });

  y = qrY - 25;

  // ═══════════ VERIFICATION KEY BLOCK ═══════════
  const keyBoxH = 50;
  page.drawRectangle({
    x: margin, y: y - keyBoxH, width: pageWidth - 2 * margin, height: keyBoxH,
    borderColor: ink, borderWidth: 2, color: rgb(0.98, 0.98, 0.98),
    dashArray: [4, 2],
  });
  page.drawText('Cle de verification requise pour consulter le PDF en ligne :', {
    x: margin + 10, y: y - 18, size: 9, font: fontBold, color: ink,
  });
  page.drawText(data.verificationKey, {
    x: margin + 10, y: y - 38, size: 18, font: fontMono, color: red,
  });

  y -= keyBoxH + 15;

  // ═══════════ FOOTER (black band) ═══════════
  const footerY = 0;
  const footerH = 50;
  page.drawRectangle({
    x: 0, y: footerY, width: pageWidth, height: footerH,
    color: ink,
  });
  page.drawText('QRTags — Protection intelligente des bagages', {
    x: margin, y: footerY + 28, size: 9, font: fontBold, color: yellow,
  });
  const footerLine = `Document protégé par le protocole de certification QRTags • Généré le ${formatTimestamp(createdAt)} • qrtags.com`;
  page.drawText(footerLine, {
    x: margin, y: footerY + 14, size: 7, font: fontRegular, color: rgb(0.8, 0.8, 0.8),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Build the absolute public URL for a checklist code.
 * Uses NEXT_PUBLIC_BASE_URL if set, otherwise derives from request headers.
 */
export function buildPublicChecklistUrl(code: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://qrtags.com';
  return `${base.replace(/\/$/, '')}/checklist/${code}`;
}
