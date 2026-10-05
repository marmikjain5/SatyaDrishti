import { describe, expect, it } from 'vitest';
import { extractAllLegalDeclarations } from './fieldExtractors';
import type { MultiPassOCRData } from './fieldExtractors';

const bbox = { x0: 0, y0: 0, x1: 500, y1: 40 };

function pass(lines: string[], source = 'declaration_panel_zoom'): MultiPassOCRData {
  return {
    text: lines.join('\n'),
    confidence: 95,
    source,
    scale: source === 'declaration_panel_zoom' ? 2.2 : 1,
    cropX: 0,
    cropY: source === 'declaration_panel_zoom' ? 800 : 0,
    lines: lines.map((text, index) => ({
      text,
      confidence: 90,
      bbox: { ...bbox, y0: index * 45, y1: index * 45 + 40 },
    })),
  };
}

describe('statutory declaration extraction regressions', () => {
  it('keeps MRP and USP separate when they share a compact sticker line', () => {
    const declarations = extractAllLegalDeclarations(
      [pass([
        'MRP (Incl. of all taxes), USP, 550 1.38/ml',
        'Net Content (when packed): 400ml',
        'Batch No., 342133650 04',
        'MFD. (M) & 05/24',
        'UseBefore(U): 10/26',
      ])],
      { width: 720, height: 1280 },
      'MRP (Incl. of all taxes), USP, 550 1.38/ml',
    );

    expect(declarations.mrp.value).toBe('₹550.00');
    expect(declarations.unitSalePrice.value).toBe('₹1.38 per ml');
    expect(declarations.mrp.value).not.toContain('1.38');
    expect(declarations.unitSalePrice.value).not.toContain('550');
  });

  it('recognizes product identity and rejects a domain as a batch number', () => {
    const declarations = extractAllLegalDeclarations(
      [pass([
        'NIVEA Natural Glow Cell Repair SPF 15 Lotion',
        'care@beiersdorf.com',
        'Batch No., B42133650 04',
      ], 'product_identity_zoom')],
      { width: 720, height: 1280 },
      'NIVEA Natural Glow Cell Repair SPF 15 Lotion care@beiersdorf.com Batch No., 342133650 04',
    );

    expect(declarations.productName.value).toContain('NIVEA Natural Glow Cell Repair SPF 15 Lotion');
    expect(declarations.batchNumber.value).toBe('B42133650 04');
    expect(declarations.batchNumber.value).not.toContain('beiersdorf');
  });
});
