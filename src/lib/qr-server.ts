import { Buffer } from 'buffer';

// Dynamic import cache (bypasses Turbopack bundling, works with serverExternalPackages)
let _qrCodeModule: any = null;
async function loadQRCode() {
  if (!_qrCodeModule) {
    _qrCodeModule = await import('qrcode');
  }
  return _qrCodeModule;
}

/**
 * QR Code Server-Side Generation Module for QRTags
 * Generates QR code PNG images on the server for bulk export.
 * Each QR code encodes the scan URL: https://domain/scan/{serialNumber}
 */

export interface QRCodeImageOptions {
  serialNumber: string;
  tagType: string;
  agencyType?: string;
  baseUrl?: string;
  size?: number; // PNG width/height in pixels (default 400)
}

export interface GeneratedQRImage {
  serialNumber: string;
  buffer: Buffer;
  filename: string;
}

/**
 * Generate a single QR code PNG image buffer
 */
export async function generateQRCodeImage(options: QRCodeImageOptions): Promise<GeneratedQRImage> {
  const {
    serialNumber,
    tagType,
    agencyType,
    baseUrl = '',
    size = 400,
  } = options;

  const scanUrl = baseUrl ? `${baseUrl}/scan/${serialNumber}` : `/scan/${serialNumber}`;
  const qrColor = '#10B981'; // QRTags emerald

  // Load qrcode (dynamic import, bypasses Turbopack bundling)
  const QRCode = await loadQRCode();

  // Generate QR code as PNG buffer with high quality
  const qrBuffer = await QRCode.toBuffer(scanUrl, {
    type: 'png',
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: qrColor,
      light: '#ffffff',
    },
  });

  const filename = `tag-${serialNumber}.png`;

  return {
    serialNumber,
    buffer: qrBuffer,
    filename,
  };
}

/**
 * Generate QR code images for multiple tags grouped by set
 * Returns a map of setId -> GeneratedQRImage[]
 */
export async function generateQRCodeImagesForTags(
  tags: Array<{
    serialNumber: string;
    tagType: string;
    setId: string | null;
    ownerName: string | null;
    agencyType?: string;
  }>,
  baseUrl?: string,
): Promise<Map<string, GeneratedQRImage[]>> {
  const groupedBySetId = new Map<string, GeneratedQRImage[]>();

  // Process in batches of 50 to avoid memory issues
  const batchSize = 50;
  
  for (let i = 0; i < tags.length; i += batchSize) {
    const batch = tags.slice(i, i + batchSize);
    
    const results = await Promise.all(
      batch.map(async (tag) => {
        const image = await generateQRCodeImage({
          serialNumber: tag.serialNumber,
          tagType: tag.tagType,
          agencyType: tag.agencyType,
          baseUrl,
        });

        const setId = tag.setId || tag.serialNumber.split('-')[0];
        return { setId, image };
      })
    );

    for (const { setId, image } of results) {
      if (!groupedBySetId.has(setId)) {
        groupedBySetId.set(setId, []);
      }
      groupedBySetId.get(setId)!.push(image);
    }
  }

  return groupedBySetId;
}

/**
 * Format a folder name for a set of tags
 * Example: "Set-001-TAG-HOTEL-ABCD" or "Set-001-Ahmed-DIOP"
 */
export function formatSetFolderName(
  index: number,
  setId: string,
  ownerName?: string | null,
): string {
  const paddedIndex = String(index + 1).padStart(3, '0');
  
  if (ownerName) {
    const cleanName = ownerName.replace(/[^a-zA-ZÀ-ÿ]/g, '').substring(0, 25);
    return `Set-${paddedIndex}-${cleanName}`;
  }
  
  return `Set-${paddedIndex}-${setId}`;
}

// Backward-compatible aliases
export const generateQRCodeImagesForBaggages = generateQRCodeImagesForTags;

export interface QRCodeImageOptionsLegacy {
  reference: string;
  type: string;
  baggageIndex: number;
  baggageType: string;
  baseUrl?: string;
  size?: number;
}

export interface GeneratedQRImageLegacy {
  reference: string;
  baggageIndex: number;
  baggageType: string;
  buffer: Buffer;
  filename: string;
}
