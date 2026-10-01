/**
 * Barcode & 1D/2D Optical Code Detection Service
 *
 * Uses @zxing/browser and @zxing/library to decode GS1/EAN-13, EAN-8, UPC, Code-128,
 * and QR codes directly from packaging images.
 *
 * Automatically attempts 0°, 90°, 180°, and 270° rotations to capture side-printed
 * vertical barcodes on bottles, cans, tubes, and curved packaging.
 */

import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

export interface BarcodeDetectionResult {
  text: string;
  format: string;
  confidence: number;
}

class BarcodeService {
  private reader: BrowserMultiFormatReader;

  constructor() {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    this.reader = new BrowserMultiFormatReader(hints);
  }

  /**
   * Decodes barcode from an image dataUrl or URL.
   * Tests multi-angle orientations (0°, 90°, 180°, 270°) and region crops (right edge, left edge, bottom).
   */
  async decodeBarcode(dataUrl: string): Promise<BarcodeDetectionResult | null> {
    // 1. Direct pass (0°)
    try {
      const res = await this.reader.decodeFromImageUrl(dataUrl);
      if (res && res.getText()) {
        const text = res.getText().trim();
        console.log(`✅ [ZXing Barcode] Detected directly (0°): ${text} (${res.getBarcodeFormat()})`);
        return {
          text,
          format: res.getBarcodeFormat().toString(),
          confidence: 99,
        };
      }
    } catch {
      // Continue to rotated passes
    }

    try {
      const img = await this.loadImage(dataUrl);

      // 2. Full Image Rotations (90°, 270°, 180°)
      for (const angle of [90, 270, 180]) {
        try {
          const canvas = document.createElement('canvas');
          const isRotated90 = angle === 90 || angle === 270;
          canvas.width = isRotated90 ? img.height : img.width;
          canvas.height = isRotated90 ? img.width : img.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((angle * Math.PI) / 180);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);

          const res = await this.reader.decodeFromCanvas(canvas);
          if (res && res.getText()) {
            const text = res.getText().trim();
            console.log(`✅ [ZXing Barcode] Detected on full ${angle}° rotated pass: ${text} (${res.getBarcodeFormat()})`);
            return {
              text,
              format: res.getBarcodeFormat().toString(),
              confidence: 99,
            };
          }
        } catch {
          // try next
        }
      }

      // 3. Side Edge & Region Crops (Barcodes on bottles & tubes are frequently vertical on left/right edges or bottom)
      const regions = [
        // Right edge (common on bottles, e.g. Nivea)
        { sx: 0.55, sy: 0.15, sw: 0.45, sh: 0.85, name: 'right_vertical_edge' },
        // Left edge
        { sx: 0.0, sy: 0.15, sw: 0.45, sh: 0.85, name: 'left_vertical_edge' },
        // Bottom region (common on cartons and boxes)
        { sx: 0.05, sy: 0.45, sw: 0.90, sh: 0.55, name: 'bottom_declaration_panel' },
      ];

      for (const reg of regions) {
        try {
          const rx = Math.floor(img.width * reg.sx);
          const ry = Math.floor(img.height * reg.sy);
          const rw = Math.floor(img.width * reg.sw);
          const rh = Math.floor(img.height * reg.sh);

          const baseCropCanvas = document.createElement('canvas');
          baseCropCanvas.width = rw;
          baseCropCanvas.height = rh;
          const bctx = baseCropCanvas.getContext('2d');
          if (!bctx) continue;

          bctx.drawImage(img, rx, ry, rw, rh, 0, 0, rw, rh);

          // Test 0°, 90°, 270°, 180° on cropped region
          for (const angle of [90, 270, 0, 180]) {
            try {
              const testCanvas = document.createElement('canvas');
              const isRotated90 = angle === 90 || angle === 270;
              testCanvas.width = isRotated90 ? rh : rw;
              testCanvas.height = isRotated90 ? rw : rh;
              const tctx = testCanvas.getContext('2d');
              if (!tctx) continue;

              tctx.translate(testCanvas.width / 2, testCanvas.height / 2);
              tctx.rotate((angle * Math.PI) / 180);
              tctx.drawImage(baseCropCanvas, -rw / 2, -rh / 2);

              const res = await this.reader.decodeFromCanvas(testCanvas);
              if (res && res.getText()) {
                const text = res.getText().trim();
                console.log(`✅ [ZXing Barcode] Detected on ${reg.name} (${angle}°): ${text} (${res.getBarcodeFormat()})`);
                return {
                  text,
                  format: res.getBarcodeFormat().toString(),
                  confidence: 99,
                };
              }
            } catch {
              // try next angle
            }
          }
        } catch {
          // try next region
        }
      }
    } catch (e) {
      console.warn('Barcode decoding pipeline error:', e);
    }

    return null;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
}

export const barcodeService = new BarcodeService();
