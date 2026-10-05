/**
 * Image Preprocessor
 *
 * Canvas-based preprocessing pipeline that generates multiple optimized
 * image variants before OCR. Each variant targets a different text-readability
 * challenge common in product packaging photography.
 *
 * No external dependencies  -  uses HTMLCanvasElement + ImageData pixel manipulation.
 */

export interface PreprocessedVariant {
  name: string;
  dataUrl: string;
  description: string;
  scale: number;
  cropX?: number;
  cropY?: number;
}

export interface PreprocessingResult {
  variants: PreprocessedVariant[];
  dimensions: { width: number; height: number };
}

/**
 * Load an image source (data URL or blob URL) into an HTMLImageElement.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Create a canvas from an image, optionally scaling it.
 */
function imageToCanvas(
  img: HTMLImageElement,
  scale: number = 1
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d')!;
  if (scale !== 1) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

/**
 * Get pixel data from a canvas.
 */
function getPixels(ctx: CanvasRenderingContext2D, w: number, h: number): ImageData {
  return ctx.getImageData(0, 0, w, h);
}

/**
 * Write pixel data back to a canvas.
 */
function putPixels(ctx: CanvasRenderingContext2D, imageData: ImageData): void {
  ctx.putImageData(imageData, 0, 0);
}

// ─── Preprocessing Filters ─────────────────────────────────────

/**
 * Convert to grayscale using luminance-weighted formula.
 */
function grayscale(imageData: ImageData): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
  return imageData;
}

/**
 * Invert luminance (converts white text on dark packaging into dark text on light).
 */
function invertColors(imageData: ImageData): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  return imageData;
}

/**
 * Enhance contrast using histogram stretching.
 * Finds min/max pixel values and stretches them to 0-255 range,
 * then applies a contrast multiplier for extra punch.
 */
function enhanceContrast(imageData: ImageData, strength: number = 1.5): ImageData {
  const data = imageData.data;

  // Find min and max luminance
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    if (lum < min) min = lum;
    if (lum > max) max = lum;
  }

  // Avoid division by zero
  const range = max - min || 1;

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      // Stretch to full range
      let val = ((data[i + c] - min) / range) * 255;
      // Apply contrast multiplier around midpoint
      val = ((val - 128) * strength) + 128;
      data[i + c] = Math.max(0, Math.min(255, Math.round(val)));
    }
  }
  return imageData;
}

/**
 * Sharpen using an unsharp mask convolution kernel.
 * Kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0]
 */
function sharpen(imageData: ImageData, width: number): ImageData {
  const src = new Uint8ClampedArray(imageData.data);
  const dst = imageData.data;
  const h = imageData.height;
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += src[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        const idx = (y * width + x) * 4 + c;
        dst[idx] = Math.max(0, Math.min(255, sum));
      }
    }
  }
  return imageData;
}

/**
 * Denoise using a 3×3 median filter.
 * Effective against salt-and-pepper noise common in phone photos.
 */
function medianDenoise(imageData: ImageData, width: number): ImageData {
  const src = new Uint8ClampedArray(imageData.data);
  const dst = imageData.data;
  const h = imageData.height;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const neighbors: number[] = [];
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            neighbors.push(src[((y + ky) * width + (x + kx)) * 4 + c]);
          }
        }
        neighbors.sort((a, b) => a - b);
        dst[(y * width + x) * 4 + c] = neighbors[4]; // median of 9
      }
    }
  }
  return imageData;
}

/**
 * Adaptive thresholding (local mean).
 * For each pixel, compute the mean of a local block and threshold against it.
 * Produces clean binary text even on uneven backgrounds.
 */
function adaptiveThreshold(imageData: ImageData, width: number, blockSize: number = 15, C: number = 8): ImageData {
  const data = imageData.data;
  const h = imageData.height;
  const halfBlock = Math.floor(blockSize / 2);

  // First, ensure grayscale
  const grayValues = new Uint8Array(width * h);
  for (let i = 0; i < width * h; i++) {
    grayValues[i] = Math.round(
      data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114
    );
  }

  // Compute integral image for fast local mean
  const integral = new Float64Array(width * h);
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += grayValues[y * width + x];
      integral[y * width + x] = rowSum + (y > 0 ? integral[(y - 1) * width + x] : 0);
    }
  }

  // Get sum of block using integral image
  function blockSum(x1: number, y1: number, x2: number, y2: number): number {
    x1 = Math.max(0, x1);
    y1 = Math.max(0, y1);
    x2 = Math.min(width - 1, x2);
    y2 = Math.min(h - 1, y2);
    let sum = integral[y2 * width + x2];
    if (x1 > 0) sum -= integral[y2 * width + (x1 - 1)];
    if (y1 > 0) sum -= integral[(y1 - 1) * width + x2];
    if (x1 > 0 && y1 > 0) sum += integral[(y1 - 1) * width + (x1 - 1)];
    return sum;
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < width; x++) {
      const x1 = x - halfBlock;
      const y1 = y - halfBlock;
      const x2 = x + halfBlock;
      const y2 = y + halfBlock;
      const count =
        (Math.min(width - 1, x2) - Math.max(0, x1) + 1) *
        (Math.min(h - 1, y2) - Math.max(0, y1) + 1);
      const mean = blockSum(x1, y1, x2, y2) / count;
      const val = grayValues[y * width + x] > mean - C ? 255 : 0;

      const idx = (y * width + x) * 4;
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
    }
  }

  return imageData;
}

/**
 * Generate all preprocessed variants of an image with dimensions metadata.
 * Returns original plus 5 processed variants.
 */
export async function preprocessImage(imageSource: string): Promise<PreprocessingResult> {
  const img = await loadImage(imageSource);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const variants: PreprocessedVariant[] = [];

  // 1. High Contrast Clean (reads general packaging text: brand, mfg, address, origin, net qty)
  {
    const { canvas, ctx } = imageToCanvas(img, 1);
    let pixels = getPixels(ctx, canvas.width, canvas.height);
    pixels = grayscale(pixels);
    pixels = enhanceContrast(pixels, 1.5);
    pixels = sharpen(pixels, canvas.width);
    putPixels(ctx, pixels);
    variants.push({
      name: 'high_contrast',
      dataUrl: canvas.toDataURL('image/png'),
      description: 'Grayscale + high contrast + edge sharpen',
      scale: 1,
      cropX: 0,
      cropY: 0,
    });
  }

  // 2. Statutory Declaration Panel Zoom (lower 36% focused crop for small print: MRP, USP, Net Qty, dates)
  {
    const cropY = Math.floor(height * 0.64);
    const cropH = height - cropY;
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(width * 2.2);
    canvas.height = Math.floor(cropH * 2.2);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, cropY, width, cropH, 0, 0, canvas.width, canvas.height);
    let pixels = getPixels(ctx, canvas.width, canvas.height);
    pixels = grayscale(pixels);
    pixels = enhanceContrast(pixels, 1.6);
    pixels = sharpen(pixels, canvas.width);
    putPixels(ctx, pixels);
    variants.push({
      name: 'declaration_panel_zoom',
      dataUrl: canvas.toDataURL('image/png'),
      description: 'Statutory declaration panel zoom (MRP, USP, Stamp)',
      scale: 2.2,
      cropX: 0,
      cropY: cropY,
    });
  }

  // 2b. Product identity zoom. Product names are often printed in the upper
  // middle label while the full-frame pass spends most of its pixels on the
  // bottle/background. Keep a generous horizontal margin so this also works
  // for boxes and pouches where the label is not perfectly centred.
  {
    const cropX = Math.floor(width * 0.12);
    const cropY = Math.floor(height * 0.30);
    const cropW = Math.floor(width * 0.82);
    const cropH = Math.floor(height * 0.38);
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(cropW * 2.4);
    canvas.height = Math.floor(cropH * 2.4);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    let pixels = getPixels(ctx, canvas.width, canvas.height);
    pixels = grayscale(pixels);
    pixels = enhanceContrast(pixels, 1.7);
    pixels = sharpen(pixels, canvas.width);
    putPixels(ctx, pixels);
    variants.push({
      name: 'product_identity_zoom',
      dataUrl: canvas.toDataURL('image/png'),
      description: 'Product identity and brand panel zoom',
      scale: 2.4,
      cropX,
      cropY,
    });
  }

  // 3. Dot-Matrix & Faint Stamp Normalization (lower 28% focused on white stamp box with min-max contrast stretch)
  {
    const cropY = Math.floor(height * 0.72);
    const cropH = height - cropY;
    const cropX = Math.floor(width * 0.15);
    const cropW = Math.floor(width * 0.75);
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(cropW * 2.5);
    canvas.height = Math.floor(cropH * 2.5);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    let pixels = getPixels(ctx, canvas.width, canvas.height);
    pixels = grayscale(pixels);

    // Min-Max stretch for dot-matrix stamp ink on white boxes
    const d = pixels.data;
    let min = 255;
    let max = 0;
    for (let i = 0; i < d.length; i += 4) {
      const v = d[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = max > min ? max - min : 1;
    for (let i = 0; i < d.length; i += 4) {
      const norm = Math.floor(((d[i] - min) / range) * 255);
      d[i] = norm;
      d[i + 1] = norm;
      d[i + 2] = norm;
    }
    pixels = sharpen(pixels, canvas.width);
    putPixels(ctx, pixels);
    variants.push({
      name: 'dot_matrix_stamp',
      dataUrl: canvas.toDataURL('image/png'),
      description: 'Isolated stamp panel + contrast stretch',
      scale: 2.5,
      cropX: cropX,
      cropY: cropY,
    });
  }

  // 4. Inverted Luminance Pass (Transforms white text on dark packaging into crisp dark-on-white text for Tesseract)
  {
    const { canvas, ctx } = imageToCanvas(img, 1);
    let pixels = getPixels(ctx, canvas.width, canvas.height);
    pixels = grayscale(pixels);
    pixels = invertColors(pixels);
    pixels = enhanceContrast(pixels, 1.6);
    pixels = sharpen(pixels, canvas.width);
    putPixels(ctx, pixels);
    variants.push({
      name: 'inverted_dark_packaging',
      dataUrl: canvas.toDataURL('image/png'),
      description: 'Inverted luminance for white text on dark packaging (dark bottles, blue tubes, dark boxes)',
      scale: 1,
      cropX: 0,
      cropY: 0,
    });
  }

  return {
    variants,
    dimensions: { width, height },
  };
}
