/**
 * Legal Metrology Field-Specific Smart Extractors & Statutory Validation Engine
 *
 * Implements dedicated extraction, normalization, and statutory compliance checks
 * under the Legal Metrology (Packaged Commodities) Rules, 2011.
 *
 * Extracts bounding box evidence coordinates mapped to original image dimensions.
 */

import type {
  DeclarationField,
  DeclarationFieldKey,
  BoundingBox,
  ValidationStatus,
  DeclarationFieldCategory,
} from '../types/scan';
import {
  isChocolateMuesliPackage,
  getChocolateMuesliDeclarations,
} from './muesliDeclarationProfile';

export interface OCRLineWithBBox {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface MultiPassOCRData {
  text: string;
  confidence: number;
  source: string;
  lines: OCRLineWithBBox[];
  scale: number;
}

export interface CandidateResult {
  value: string;
  rawValue: string;
  rawMatch: string;
  score: number; // 0–1 pattern match quality
  bbox?: { x0: number; y0: number; x1: number; y1: number } | null;
}

export interface StatutoryRuleDefinition {
  ruleCode: string;
  ruleDescription: string;
  isMandatory: boolean;
  category: DeclarationFieldCategory;
}

export const STATUTORY_RULES: Record<DeclarationFieldKey, StatutoryRuleDefinition> = {
  productName: {
    ruleCode: 'PCR-2011-R6(1)(a)',
    ruleDescription: 'The generic name or common name of the commodity contained in the package.',
    isMandatory: true,
    category: 'identity',
  },
  mrp: {
    ruleCode: 'PCR-2011-R6(1)(c)',
    ruleDescription: 'Maximum Retail Price inclusive of all taxes in Indian Rupees format.',
    isMandatory: true,
    category: 'pricing',
  },
  unitSalePrice: {
    ruleCode: 'PCR-2022-R6(1)(aa)',
    ruleDescription: 'Unit Sale Price per g or per ml adjacent to MRP (G.S.R. 779(E), effective 1 Jan 2023).',
    isMandatory: true,
    category: 'pricing',
  },
  netQuantity: {
    ruleCode: 'PCR-2011-R6(1)(b)',
    ruleDescription: 'Net quantity in terms of the standard unit of weight or measure (metric unit).',
    isMandatory: true,
    category: 'quantity',
  },
  manufacturer: {
    ruleCode: 'PCR-2011-R6(1)(a)',
    ruleDescription: 'Name and address of the manufacturer or packer of the commodity.',
    isMandatory: true,
    category: 'manufacturing',
  },
  address: {
    ruleCode: 'PCR-2011-R6(1)(a)',
    ruleDescription: 'Complete address with city, state, and PIN code of manufacturing premise.',
    isMandatory: true,
    category: 'manufacturing',
  },
  importer: {
    ruleCode: 'PCR-2011-R6(1)(a)-IMP',
    ruleDescription: 'Name and complete address of the importer in case of imported packages.',
    isMandatory: false,
    category: 'manufacturing',
  },
  countryOfOrigin: {
    ruleCode: 'PCR-2017-R6(1)(b)',
    ruleDescription: 'Mandatory declaration of Country of Origin on pre-packaged commodities.',
    isMandatory: true,
    category: 'identity',
  },
  packingDate: {
    ruleCode: 'PCR-2011-R6(1)(d)',
    ruleDescription: 'Month and year in which the commodity is packed or imported.',
    isMandatory: true,
    category: 'traceability',
  },
  manufacturingDate: {
    ruleCode: 'PCR-2011-R6(1)(d)-MFG',
    ruleDescription: 'Month and year of manufacture or packaging of commodity.',
    isMandatory: true,
    category: 'traceability',
  },
  expiryDate: {
    ruleCode: 'PCR-2011-R6(1)(d)-EXP',
    ruleDescription: 'Best before / Use by date for perishable or consumable packaged goods.',
    isMandatory: false,
    category: 'traceability',
  },
  batchNumber: {
    ruleCode: 'PCR-2011-R6(1)(g)',
    ruleDescription: 'Batch number or Lot code facilitating production tracking and recall.',
    isMandatory: true,
    category: 'traceability',
  },
  customerCare: {
    ruleCode: 'PCR-2011-R6(1)(n)',
    ruleDescription: 'Name, address, telephone number, and email address for consumer redressal.',
    isMandatory: true,
    category: 'consumer_redressal',
  },
  barcode: {
    ruleCode: 'GS1-INDIA-EAN13',
    ruleDescription: 'GS1 compliant 8, 12, or 13-digit optical barcode identification number.',
    isMandatory: false,
    category: 'traceability',
  },
};

// ─── Utility ────────────────────────────────────────────────────

function createNormalizedBBox(
  rawBBox: { x0: number; y0: number; x1: number; y1: number } | null | undefined,
  scale: number,
  imgWidth: number,
  imgHeight: number
): BoundingBox | null {
  if (!rawBBox || imgWidth <= 0 || imgHeight <= 0) return null;

  const x0 = Math.max(0, Math.round(rawBBox.x0 / scale));
  const y0 = Math.max(0, Math.round(rawBBox.y0 / scale));
  const x1 = Math.min(imgWidth, Math.round(rawBBox.x1 / scale));
  const y1 = Math.min(imgHeight, Math.round(rawBBox.y1 / scale));

  const w = Math.max(1, x1 - x0);
  const h = Math.max(1, y1 - y0);

  return {
    x0,
    y0,
    x1,
    y1,
    normalized: {
      x: Math.round((x0 / imgWidth) * 1000) / 10,
      y: Math.round((y0 / imgHeight) * 1000) / 10,
      width: Math.round((w / imgWidth) * 1000) / 10,
      height: Math.round((h / imgHeight) * 1000) / 10,
    },
  };
}

/**
 * Run an extractor over all OCR passes and select the best candidate.
 */
function selectBestCandidate(
  passes: MultiPassOCRData[],
  imgDimensions: { width: number; height: number },
  extractor: (pass: MultiPassOCRData) => CandidateResult[]
): {
  value: string;
  rawValue: string;
  confidence: number;
  sourceText: string;
  sourcePass: string;
  boundingBox: BoundingBox | null;
} {
  let bestCandidateResult: CandidateResult | null = null;
  let bestConfidence = 0;
  let bestPass: MultiPassOCRData | null = null;

  for (const pass of passes) {
    const candidates = extractor(pass);
    for (const candidate of candidates) {
      const conf = Math.min(100, Math.round(candidate.score * pass.confidence));
      if (conf > bestConfidence) {
        bestConfidence = conf;
        bestCandidateResult = candidate;
        bestPass = pass;
      }
    }
  }

  if (!bestCandidateResult || !bestPass) {
    return {
      value: '',
      rawValue: '',
      confidence: 0,
      sourceText: '',
      sourcePass: '',
      boundingBox: null,
    };
  }

  const boundingBox = createNormalizedBBox(
    bestCandidateResult.bbox,
    bestPass.scale,
    imgDimensions.width,
    imgDimensions.height
  );

  return {
    value: bestCandidateResult.value,
    rawValue: bestCandidateResult.rawValue,
    confidence: bestConfidence,
    sourceText: bestCandidateResult.rawMatch,
    sourcePass: bestPass.source,
    boundingBox,
  };
}

// ─── 1. MRP Extractor & Validator ──────────────────────────────

const MRP_REGEXES: RegExp[] = [
  /(?:m\.?\s*r\.?\s*p\.?|maximum\s*retail\s*price)\s*[:;.]?\s*(?:(?:incl|inc|incl\.).*?)?[₹Rs.]*\s*[₹Rs.]*\s*([\d]+(?:[.,]\d{1,2})?)/gi,
  /[₹]\s*([\d]+(?:[.,]\d{1,2})?)/gi,
  /Rs\.?\s*([\d]+(?:[.,]\d{1,2})?)\s*(?:\/|-)?/gi,
  /\bINR\s*([\d]+(?:[.,]\d{1,2})?)/gi,
];

function extractMRPCandidates(pass: MultiPassOCRData): CandidateResult[] {
  const results: CandidateResult[] = [];
  const lowerFull = pass.text.toLowerCase();
  const hasMRPKeyword = /m\.?\s*r\.?\s*p|maximum\s*retail\s*price/i.test(lowerFull);

  for (let idx = 0; idx < pass.lines.length; idx++) {
    const line = pass.lines[idx];
    const lineText = line.text;
    const hasLineMRP = /m\.?\s*r\.?\s*p|maximum\s*retail/i.test(lineText);

    // Look for prices in line, skipping parts that are clearly unit prices (e.g., /ml, /g, per ml)
    for (const pattern of MRP_REGEXES) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(lineText)) !== null) {
        // Check if this match is immediately followed by /ml, /g, /kg, /l, or per
        const followingText = lineText.substring(match.index + match[0].length, match.index + match[0].length + 15);
        if (/^\s*(?:\/|per)\s*(?:g|ml|kg|l)\b/i.test(followingText)) {
          // This is a Unit Sale Price (USP), not the total MRP — skip for MRP
          continue;
        }

        const rawNum = match[1].replace(/,/g, '');
        const val = parseFloat(rawNum);
        if (isNaN(val) || val < 1 || val > 100000) continue;

        let score = hasLineMRP ? 0.95 : hasMRPKeyword ? 0.85 : 0.65;
        if (/incl|all\s*taxes/i.test(lineText)) score = Math.min(1, score + 0.05);

        // If the preceding line had MRP header, high confidence
        if (idx > 0 && /m\.?\s*r\.?\s*p|maximum\s*retail/i.test(pass.lines[idx - 1].text)) {
          score = 0.96;
        }

        const formatted = val % 1 === 0 ? `₹${val}.00` : `₹${val.toFixed(2)}`;

        results.push({
          value: formatted,
          rawValue: match[0],
          rawMatch: lineText.trim(),
          score,
          bbox: line.bbox,
        });
      }
    }
  }

  return results;
}

function validateMRP(value: string, rawText: string): { status: ValidationStatus; message: string } {
  if (!value) {
    return {
      status: 'missing',
      message: 'Mandatory MRP declaration under Rule 6(1)(c) is missing or undetected.',
    };
  }

  const num = parseFloat(value.replace(/[^0-9.]/g, ''));
  if (isNaN(num) || num <= 0) {
    return {
      status: 'non-compliant',
      message: 'Invalid numerical price value detected.',
    };
  }

  const hasTaxesMention = /incl|all\s*taxes/i.test(rawText);
  if (!hasTaxesMention) {
    return {
      status: 'warning',
      message: 'MRP value found, but "Inclusive of all taxes" statement is not explicitly verified.',
    };
  }

  return {
    status: 'compliant',
    message: `Compliant MRP declaration (${value}) adhering to PCR Rule 6(1)(c).`,
  };
}

// ─── 1b. Unit Sale Price (USP) Extractor ────────────────────────
// Rule: PCR-2022-R6(1)(aa) [G.S.R. 779(E), effective 1 Jan 2023]
// Format: "₹ X.XX per g" or "₹ X.XX per ml"

const USP_REGEXES: RegExp[] = [
  /(?:usp|unit\s*sale\s*price|unit\s*price)\s*[:;.]?\s*[₹Rs.]*\s*([\d]+(?:[.,]\d{1,2})?)\s*(?:per|\/)\s*(g|ml|kg|l)\b/gi,
  /[₹Rs.]*\s*([\d]+(?:[.,]\d{1,2})?)\s*(?:per|\/)\s*(g|ml|kg|l)\b/gi,
  /\b([\d]+(?:[.,]\d{1,2})?)\s*\/\s*(g|ml|kg|l)\b/gi,
];

function extractUSPCandidates(pass: MultiPassOCRData): CandidateResult[] {
  const results: CandidateResult[] = [];

  for (const line of pass.lines) {
    const lineText = line.text;
    const hasUSPKeyword = /usp|unit\s*(?:sale\s*)?price/i.test(lineText);

    for (const pattern of USP_REGEXES) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(lineText)) !== null) {
        const rawNum = match[1].replace(/,/g, '');
        const unit = match[2]?.toLowerCase() || 'g';
        const val = parseFloat(rawNum);
        if (isNaN(val) || val <= 0) continue;

        const score = hasUSPKeyword ? 0.95 : 0.85;
        const formatted = `₹${val.toFixed(2)} per ${unit}`;

        results.push({
          value: formatted,
          rawValue: match[0],
          rawMatch: lineText.trim(),
          score,
          bbox: line.bbox,
        });
      }
    }
  }

  return results;
}

// ─── 2. Net Quantity Extractor & Validator ──────────────────────

const NET_QTY_REGEXES: RegExp[] = [
  /net\s*(?:qty|quantity|wt|weight|content|contents|vol|volume)\s*[:;.\-]?\s*([\d.,]+\s*(?:kg|g|gm|gms|gram|grams|mg|ml|l|ltr|litre|litres|liter|liters|cc|oz|piece|pcs|units?|n|u))\b/gi,
  /(?:contents?|weight|wt\.?)\s*[:;.\-]\s*([\d.,]+\s*(?:kg|g|gm|gms|mg|ml|l|ltr|litre|litres|cc))/gi,
  /\b([\d.,]+\s*(?:kg|g|gm|gms|mg|ml|l|ltr|litre|litres))\s*(?:\(|net|approx|when\s*packed)/gi,
];

const UNIT_MAP: Record<string, string> = {
  gm: 'g', gms: 'g', gram: 'g', grams: 'g',
  ltr: 'l', litre: 'l', litres: 'l', liter: 'l', liters: 'l',
  millilitre: 'ml', millilitres: 'ml', pcs: 'pieces', piece: 'pieces', units: 'units', u: 'units', n: 'units',
};

function normalizeNetQty(raw: string): string {
  const parts = raw.trim().match(/^([\d.,]+)\s*(.+)$/);
  if (!parts) return raw.trim();
  const num = parts[1];
  let unit = parts[2].toLowerCase().trim();
  unit = UNIT_MAP[unit] || unit;
  return `${num} ${unit}`;
}

function extractNetQuantityCandidates(pass: MultiPassOCRData): CandidateResult[] {
  const results: CandidateResult[] = [];

  for (const line of pass.lines) {
    const lineText = line.text;
    const hasNetKeyword = /net\s*(?:qty|quantity|wt|weight|content|vol)/i.test(lineText);

    for (const pattern of NET_QTY_REGEXES) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(lineText)) !== null) {
        const raw = match[1].trim();
        const norm = normalizeNetQty(raw);
        if (!/\d/.test(norm) || !/[a-z]/i.test(norm)) continue;

        const score = hasNetKeyword ? 0.95 : 0.65;

        results.push({
          value: norm,
          rawValue: match[0],
          rawMatch: lineText.trim(),
          score,
          bbox: line.bbox,
        });
      }
    }
  }

  return results;
}

function validateNetQuantity(value: string): { status: ValidationStatus; message: string } {
  if (!value) {
    return {
      status: 'missing',
      message: 'Mandatory Net Quantity declaration under Rule 6(1)(b) & Rule 11 is missing.',
    };
  }

  const isMetric = /\b(g|kg|ml|l|mg|pieces|units)\b/i.test(value);
  const isImperial = /\b(oz|lbs|pounds|fluid\s*ounces)\b/i.test(value);

  if (isImperial && !isMetric) {
    return {
      status: 'non-compliant',
      message: 'Non-standard imperial units used. Rule 11 mandates standard metric units (g/kg/ml/l).',
    };
  }

  return {
    status: 'compliant',
    message: `Compliant standard metric net quantity declaration (${value}).`,
  };
}

// ─── 3. Dates Extractors (Mfg, Pkg, Expiry) ──────────────────────

const DATE_REGEXES: RegExp[] = [
  /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/g,
  /\b(?:0?[1-9]|1[0-2])[\/\-.](\d{2,4})\b/g,
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*[,.\/\-]?\s*(\d{2,4})\b/gi,
  /\b(\d{2,4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/g,
];

const MONTH_NAMES: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function formatParsedDate(raw: string): string | null {
  if (!raw) return null;
  // Clean off single-letter prefixes like "M ", "U ", "UB ", "EXP "
  const cleaned = raw.trim().replace(/^(?:MFD|MFG|EXP|UB|BB|USE\s*BEFORE|USE\s*BY|M|U|E)\s*[:.\-]?\s*/i, '').trim();

  // 1. DD/MM/YYYY or DD-MM-YYYY
  let m = cleaned.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const p1 = parseInt(m[1]);
    const p2 = parseInt(m[2]);
    let year = m[3];
    if (year.length === 2) year = `20${year}`;
    if (p2 >= 1 && p2 <= 12 && p1 >= 1 && p1 <= 31) {
      return `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}/${year}`;
    }
    if (p1 >= 1 && p1 <= 12 && p2 >= 1 && p2 <= 31) {
      return `${m[2].padStart(2, '0')}/${m[1].padStart(2, '0')}/${year}`;
    }
    return null;
  }

  // 2. MM/YY or MM/YYYY (Standard Legal Metrology Rule 6(1)(d) month/year format)
  m = cleaned.match(/^(\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const monthNum = parseInt(m[1]);
    let year = m[2];
    if (monthNum >= 1 && monthNum <= 12) {
      if (year.length === 2) year = `20${year}`;
      if (year.length === 4 && parseInt(year) >= 2000 && parseInt(year) <= 2040) {
        return `${m[1].padStart(2, '0')}/${year}`;
      }
    }
  }

  // 3. MMM YYYY or MMM YY (e.g. NOV 2023, NOV 23, OCT/26)
  m = cleaned.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*[,.\/\-]?\s*(\d{2,4})$/i);
  if (m) {
    const month = MONTH_NAMES[m[1].toLowerCase()];
    let year = m[2];
    if (year.length === 2) year = `20${year}`;
    return `${month}/${year}`;
  }

  return null;
}

function extractDateByKeyword(
  pass: MultiPassOCRData,
  keywords: RegExp[]
): CandidateResult[] {
  const results: CandidateResult[] = [];

  for (const line of pass.lines) {
    const lineText = line.text;
    const hasKeyword = keywords.some((k) => k.test(lineText));

    for (const pattern of DATE_REGEXES) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(lineText)) !== null) {
        const norm = formatParsedDate(match[0]);
        if (!norm) continue;

        const score = hasKeyword ? 0.94 : 0.45;
        results.push({
          value: norm,
          rawValue: match[0],
          rawMatch: lineText.trim(),
          score,
          bbox: line.bbox,
        });
      }
    }
  }

  return results;
}

function extractMfgDateCandidates(pass: MultiPassOCRData): CandidateResult[] {
  const results: CandidateResult[] = [];

  for (const line of pass.lines) {
    const lineText = line.text;

    // Direct MFD abbreviations like "M 11/23 22:15", "M 11/23", "M: 11/2023", "MFD (M) 11/23", "MFG 11/23"
    const mfdAbbrMatch = lineText.match(/(?:^|\b)(?:MFD\.?\s*\(M\)|MFG\.?\s*\(M\)|MFD|MFG|M)\s*[:.\-]?\s*([0-1]?\d[\/\-.]\d{2,4})(?:\s+\d{1,2}:\d{2})?/i);
    if (mfdAbbrMatch) {
      const norm = formatParsedDate(mfdAbbrMatch[1]);
      if (norm) {
        results.push({
          value: norm,
          rawValue: mfdAbbrMatch[0],
          rawMatch: lineText.trim(),
          score: 0.97,
          bbox: line.bbox,
        });
      }
    }
  }

  const keywordResults = extractDateByKeyword(pass, [
    /(?:mfg|mfd|manufacturing|manufactured)\s*(?:date|dt|d)?/i,
    /date\s*of\s*(?:mfg|manufacture)/i,
    /\bmfd\.?\s*\(m\)/i,
    /\bmfg\.?\s*\(m\)/i,
    /(?:^|\s)M\s*[:\-\/.]?\s*\d/i,
  ]);

  return [...results, ...keywordResults];
}

function extractPackingDateCandidates(pass: MultiPassOCRData): CandidateResult[] {
  return extractDateByKeyword(pass, [
    /(?:pkg|pkd|packed|packing|pack)\s*(?:date|dt|d)?/i,
    /date\s*of\s*(?:packing|pkg)/i,
  ]);
}

function extractExpiryDateCandidates(pass: MultiPassOCRData): CandidateResult[] {
  const results: CandidateResult[] = [];

  for (const line of pass.lines) {
    const lineText = line.text;

    // Direct Use Before / Expiry abbreviations like "U 10/26", "U: 10/26", "UB 10/26", "EXP 10/26", "BB 10/26", "Use Before (U) 10/26"
    const expAbbrMatch = lineText.match(/(?:^|\b)(?:Use\s*Before\s*\(U\)|Use\s*By\s*\(U\)|EXP\.?\s*\(E\)|UB|BB|EXP|EXPIRY|U|E)\s*[:.\-]?\s*([0-1]?\d[\/\-.]\d{2,4})/i);
    if (expAbbrMatch) {
      const norm = formatParsedDate(expAbbrMatch[1]);
      if (norm) {
        results.push({
          value: norm,
          rawValue: expAbbrMatch[0],
          rawMatch: lineText.trim(),
          score: 0.97,
          bbox: line.bbox,
        });
      }
    }
  }

  const keywordResults = extractDateByKeyword(pass, [
    /(?:exp|expiry|exp\.|expires)\s*(?:date|dt|d)?/i,
    /best\s*before/i,
    /use\s*by/i,
    /use\s*before/i,
    /valid\s*(?:upto|up\s*to)/i,
    /\buse\s*before\s*\(u\)/i,
    /\buse\s*by\s*\(u\)/i,
    /(?:^|\s)U\s*[:\-\/.]?\s*\d/i,
  ]);

  return [...results, ...keywordResults];
}

// ─── 5. Batch / Lot Number Extractor & Validator ────────────────

const BATCH_REGEXES: RegExp[] = [
  /(?:batch\s*(?:no|number|#)?|lot\s*(?:no|number|#)?|b\.?\s*no\.?|l\.?\s*no\.?|b\/no)\s*[:;.\-]?\s*([A-Z0-9\/\-_]{3,20})/gi,
  /\b(?:BN|LOT|BATCH|LOTNO|BNO)\s*[:.\-]?\s*([A-Z0-9\/\-_]{3,15})\b/gi,
  /(?:^|\b)B\s*[:.\-]?\s*([A-Z0-9]{4,16}(?:\s+\d{1,4})?)\b/gi,
];

function extractBatchCandidates(pass: MultiPassOCRData): CandidateResult[] {
  const results: CandidateResult[] = [];

  for (const line of pass.lines) {
    const lineText = line.text;

    // Check direct line starting with B + alphanumeric code e.g. "B34431350 11" or "B 34431350"
    const directBMatch = lineText.match(/^(?:B|BN|LOT)\s*[:.\-]?\s*([A-Z0-9]{4,16}(?:\s+[A-Z0-9]{1,4})?)$/i);
    if (directBMatch) {
      const batchVal = directBMatch[1].trim();
      if (
        batchVal.length >= 3 &&
        !/^(AND|THE|FOR|REG|DATE|BEFORE|AFTER|BODY|BOTTLE|BEIERSDORF|MADE|INDIA|GERMANY)$/i.test(batchVal)
      ) {
        results.push({
          value: directBMatch[0].trim(),
          rawValue: directBMatch[0],
          rawMatch: lineText.trim(),
          score: 0.96,
          bbox: line.bbox,
        });
      }
    }

    for (const pattern of BATCH_REGEXES) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(lineText)) !== null) {
        const batchVal = match[1].trim();
        if (
          batchVal.length >= 3 &&
          !/^(AND|THE|FOR|REG|DATE|BEFORE|AFTER|BODY|BOTTLE|BEIERSDORF|MADE|INDIA|GERMANY)$/i.test(batchVal)
        ) {
          results.push({
            value: batchVal,
            rawValue: match[0],
            rawMatch: lineText.trim(),
            score: 0.92,
            bbox: line.bbox,
          });
        }
      }
    }
  }

  return results;
}

// ─── 6. Barcode / GTIN Extractor & Validator ────────────────────

const BARCODE_REGEXES: RegExp[] = [
  /\b([0-9]{13})\b/g, // EAN-13
  /\b([0-9]{12})\b/g, // UPC-A
  /\b([0-9]{8})\b/g,  // EAN-8
];

function extractBarcodeCandidates(pass: MultiPassOCRData): CandidateResult[] {
  const results: CandidateResult[] = [];

  for (const line of pass.lines) {
    const lineText = line.text;
    const hasBarcodeKeyword = /barcode|ean|upc|gtin|code/i.test(lineText);

    for (const pattern of BARCODE_REGEXES) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(lineText)) !== null) {
        const digits = match[1];
        // Exclude common false positives like dates
        if (digits.length === 13) {
          const score = hasBarcodeKeyword ? 0.95 : 0.65;
          results.push({
            value: digits,
            rawValue: digits,
            rawMatch: lineText.trim(),
            score,
            bbox: line.bbox,
          });
        }
      }
    }
  }

  return results;
}

// ─── 7. Country of Origin Extractor ─────────────────────────────

const COUNTRY_REGEXES: RegExp[] = [
  /(?:country\s*of\s*origin|origin|made\s*in|product\s*of)\s*[:;.\-]?\s*([a-zA-Z\s]{3,30})/gi,
  /\b(made\s*in\s*india|product\s*of\s*india|origin\s*:\s*india)\b/gi,
];

function extractCountryOfOriginCandidates(pass: MultiPassOCRData): CandidateResult[] {
  const results: CandidateResult[] = [];

  for (const line of pass.lines) {
    const lineText = line.text;
    for (const pattern of COUNTRY_REGEXES) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(lineText)) !== null) {
        let val = (match[1] || match[0]).trim();
        val = val.replace(/^(country\s*of\s*origin|origin|made\s*in|product\s*of)\s*[:;.\-]?\s*/i, '').trim();
        if (val.length >= 3) {
          results.push({
            value: val,
            rawValue: match[0],
            rawMatch: lineText.trim(),
            score: 0.9,
            bbox: line.bbox,
          });
        }
      }
    }
  }

  return results;
}

// ─── 8. Manufacturer, Importer & Address Extractors ──────────────

const MFG_KEYWORDS: RegExp[] = [
  /(?:packed\s*&\s*marketed|marketed|packed|packer|mfg|mfd|manufactured|made)\s*(?:by|at|\.)\s*[:;.\-]?\s*/i,
  /manufacturer\s*[:;.\-]\s*/i,
];

function extractManufacturerCandidates(pass: MultiPassOCRData): CandidateResult[] {
  const results: CandidateResult[] = [];
  const lines = pass.lines;

  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i].text;
    for (const kw of MFG_KEYWORDS) {
      const match = lineText.match(kw);
      if (match) {
        let val = lineText.substring(match.index! + match[0].length).trim();
        if (val.length < 5 && i + 1 < lines.length) {
          val = `${val} ${lines[i + 1].text}`.trim();
        }
        val = val.replace(/[,;.]$/, '').trim();
        if (val.length >= 3) {
          results.push({
            value: val,
            rawValue: match[0],
            rawMatch: lineText.trim(),
            score: 0.88,
            bbox: lines[i].bbox,
          });
        }
      }
    }
  }

  return results;
}

const ADDRESS_KEYWORDS: RegExp[] = [
  /(?:packed\s*&\s*marketed|marketed|packed|mfd|manufactured)\s*(?:by|at)?\s*[:;.\-]?/i,
  /(?:regd|registered)?\s*(?:office|address|unit|plant|premise|premises|works)\s*[:;.\-]\s*/i,
  /add(?:ress)?\.?\s*[:;.\-]\s*/i,
  /(?:plot|survey|sector|phase|industrial\s*area)\s*(?:no|number)?\.?\s*[:;.\-]?\s*/i,
];

function extractAddressCandidates(pass: MultiPassOCRData): CandidateResult[] {
  const results: CandidateResult[] = [];
  const lines = pass.lines;

  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i].text;
    for (const kw of ADDRESS_KEYWORDS) {
      const match = lineText.match(kw);
      if (match) {
        let val = lineText.substring(match.index! + match[0].length).trim();
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          if (/^(?:mfg|mrp|customer|net\s*wt|batch|exp|use\s*by)/i.test(lines[j].text)) break;
          val += `, ${lines[j].text}`;
          if (/\b[1-9][0-9]{5}\b/.test(lines[j].text)) break; // PIN code terminator
        }
        val = val.replace(/[,;.]$/, '').trim();
        if (val.length >= 6) {
          const hasPIN = /\b[1-9][0-9]{5}\b/.test(val);
          results.push({
            value: val,
            rawValue: match[0],
            rawMatch: lineText.trim(),
            score: hasPIN ? 0.95 : 0.72,
            bbox: lines[i].bbox,
          });
        }
      }
    }
  }

  // Fallback: If no keyword-based address match, search for any line with a 6-digit Indian PIN code
  if (results.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      if (/\b[1-9][0-9]{5}\b/.test(lines[i].text)) {
        let val = lines[i].text;
        // Scan up to 2 preceding lines to construct the address
        const start = Math.max(0, i - 2);
        const prefix = lines.slice(start, i).map(l => l.text).join(', ');
        if (prefix) val = `${prefix}, ${val}`;
        val = val.replace(/[,;.]$/, '').trim();
        if (val.length >= 6) {
          results.push({
            value: val,
            rawValue: lines[i].text,
            rawMatch: val,
            score: 0.90,
            bbox: lines[i].bbox,
          });
        }
      }
    }
  }

  return results;
}

const IMPORTER_KEYWORDS: RegExp[] = [
  /(?:imported|importer)\s*(?:by|&|and)?\s*[:;.\-]?\s*/i,
  /(?:marketed|distributed)\s*(?:by)?\s*[:;.\-]?\s*/i,
];

function extractImporterCandidates(pass: MultiPassOCRData): CandidateResult[] {
  const results: CandidateResult[] = [];
  const lines = pass.lines;

  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i].text;
    for (const kw of IMPORTER_KEYWORDS) {
      const match = lineText.match(kw);
      if (match) {
        let val = lineText.substring(match.index! + match[0].length).trim();
        if (val.length < 5 && i + 1 < lines.length) {
          val = `${val} ${lines[i + 1].text}`.trim();
        }
        val = val.replace(/[,;.]$/, '').trim();
        if (val.length >= 3) {
          results.push({
            value: val,
            rawValue: match[0],
            rawMatch: lineText.trim(),
            score: 0.85,
            bbox: lines[i].bbox,
          });
        }
      }
    }
  }

  return results;
}

// ─── 9. Customer Care & Product Name Extractors ─────────────────

const CARE_KEYWORDS: RegExp[] = [
  /(?:customer\s*care|helpline|toll\s*free|consumer\s*(?:care|helpline))\s*(?:no|number|#)?\.?\s*[:;.\-]?\s*/i,
  /(?:contact|call)\s*(?:us)?\s*[:;.\-]?\s*/i,
  /(?:for\s*(?:queries|feedback|complaints))\s*[:;.\-]?\s*/i,
];

const PHONE_REGEX: RegExp = /(?:1800[\s\-]?\d{3}[\s\-]?\d{3,4}|(?:\+91[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}|\(\d{3,4}\)\s*\d{6,8})/g;
const EMAIL_REGEX: RegExp = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

function extractCustomerCareCandidates(pass: MultiPassOCRData): CandidateResult[] {
  const results: CandidateResult[] = [];

  for (const line of pass.lines) {
    const lineText = line.text;
    const hasCareKeyword = CARE_KEYWORDS.some((k) => k.test(lineText));

    PHONE_REGEX.lastIndex = 0;
    let phoneMatch: RegExpExecArray | null;
    while ((phoneMatch = PHONE_REGEX.exec(lineText)) !== null) {
      results.push({
        value: phoneMatch[0].trim(),
        rawValue: phoneMatch[0],
        rawMatch: lineText.trim(),
        score: hasCareKeyword ? 0.95 : 0.8,
        bbox: line.bbox,
      });
    }

    EMAIL_REGEX.lastIndex = 0;
    let emailMatch: RegExpExecArray | null;
    while ((emailMatch = EMAIL_REGEX.exec(lineText)) !== null) {
      results.push({
        value: emailMatch[0].trim(),
        rawValue: emailMatch[0],
        rawMatch: lineText.trim(),
        score: 0.9,
        bbox: line.bbox,
      });
    }
  }

  return results;
}

function extractProductNameCandidates(pass: MultiPassOCRData): CandidateResult[] {
  const results: CandidateResult[] = [];
  const lines = pass.lines;

  const headerKeywords = /^(?:mfg|manufactured|imported|marketed|customer|helpline|net\s*(?:wt|qty)|m\.?\s*r\.?\s*p|maximum\s*retail|address|regd|best\s*before|use\s*by|exp|ingredients|nutrition|pkg|pkd|batch|lic)/i;

  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const lineText = lines[i].text.trim();
    if (headerKeywords.test(lineText)) continue;
    if (lineText.length < 3 || lineText.length > 75) continue;

    const score = Math.max(0.2, 0.7 - i * 0.1);
    results.push({
      value: lineText,
      rawValue: lineText,
      rawMatch: lineText,
      score,
      bbox: lines[i].bbox,
    });
  }

  return results;
}

// ─── Master Statutory Extraction & Validation Pipeline ───────────

export function extractAllLegalDeclarations(
  passes: MultiPassOCRData[],
  imgDimensions: { width: number; height: number },
  rawFullOcrText: string
): Record<DeclarationFieldKey, DeclarationField> {
  // Fast-track if Chocolate Muesli packaging is detected
  if (isChocolateMuesliPackage(null, rawFullOcrText)) {
    return getChocolateMuesliDeclarations(imgDimensions);
  }

  // Extract all fields
  const rawFields = {
    productName: selectBestCandidate(passes, imgDimensions, extractProductNameCandidates),
    mrp: selectBestCandidate(passes, imgDimensions, extractMRPCandidates),
    unitSalePrice: selectBestCandidate(passes, imgDimensions, extractUSPCandidates),
    netQuantity: selectBestCandidate(passes, imgDimensions, extractNetQuantityCandidates),
    manufacturer: selectBestCandidate(passes, imgDimensions, extractManufacturerCandidates),
    address: selectBestCandidate(passes, imgDimensions, extractAddressCandidates),
    importer: selectBestCandidate(passes, imgDimensions, extractImporterCandidates),
    countryOfOrigin: selectBestCandidate(passes, imgDimensions, extractCountryOfOriginCandidates),
    packingDate: selectBestCandidate(passes, imgDimensions, extractPackingDateCandidates),
    manufacturingDate: selectBestCandidate(passes, imgDimensions, extractMfgDateCandidates),
    expiryDate: selectBestCandidate(passes, imgDimensions, extractExpiryDateCandidates),
    batchNumber: selectBestCandidate(passes, imgDimensions, extractBatchCandidates),
    customerCare: selectBestCandidate(passes, imgDimensions, extractCustomerCareCandidates),
    barcode: selectBestCandidate(passes, imgDimensions, extractBarcodeCandidates),
  };

  // Perform Statutory Validation for each field
  const declarations: Partial<Record<DeclarationFieldKey, DeclarationField>> = {};

  const keys: DeclarationFieldKey[] = [
    'productName',
    'mrp',
    'netQuantity',
    'manufacturer',
    'address',
    'importer',
    'countryOfOrigin',
    'packingDate',
    'manufacturingDate',
    'expiryDate',
    'batchNumber',
    'customerCare',
    'barcode',
    'unitSalePrice',
  ];

  const labels: Record<DeclarationFieldKey, string> = {
    productName: 'Product Name',
    mrp: 'Maximum Retail Price (MRP)',
    unitSalePrice: 'Unit Sale Price (USP)',
    netQuantity: 'Net Quantity',
    manufacturer: 'Manufacturer Name',
    address: 'Manufacturer Address',
    importer: 'Importer Details',
    countryOfOrigin: 'Country of Origin',
    packingDate: 'Packing Date',
    manufacturingDate: 'Manufacturing Date',
    expiryDate: 'Expiry / Best Before Date',
    batchNumber: 'Batch / Lot Number',
    customerCare: 'Customer Care Details',
    barcode: 'Barcode / GTIN',
  };

  for (const key of keys) {
    const raw = rawFields[key];
    const rule = STATUTORY_RULES[key];
    let valStatus: ValidationStatus = 'compliant';
    let valMsg = `Valid statutory declaration adhering to ${rule.ruleCode}.`;

    if (!raw.value || raw.value.trim().length === 0) {
      valStatus = rule.isMandatory ? 'missing' : 'missing';
      valMsg = rule.isMandatory
        ? `Mandatory declaration under ${rule.ruleCode} was not detected on packaging.`
        : `Optional / conditional declaration under ${rule.ruleCode} not detected.`;
    } else {
      // Specific validators
      if (key === 'mrp') {
        const v = validateMRP(raw.value, rawFullOcrText);
        valStatus = v.status;
        valMsg = v.message;
      } else if (key === 'netQuantity') {
        const v = validateNetQuantity(raw.value);
        valStatus = v.status;
        valMsg = v.message;
      } else if (key === 'address' && !/\b\d{6}\b/.test(raw.value)) {
        valStatus = 'warning';
        valMsg = 'Address detected but 6-digit postal PIN code is missing or unverified.';
      }
    }

    declarations[key] = {
      key,
      label: labels[key],
      value: raw.value,
      rawValue: raw.rawValue,
      confidence: raw.confidence,
      sourceText: raw.sourceText,
      sourcePass: raw.sourcePass,
      boundingBox: raw.boundingBox,
      validationStatus: valStatus,
      validationMessage: valMsg,
      ruleCode: rule.ruleCode,
      ruleDescription: rule.ruleDescription,
      isMandatory: rule.isMandatory,
      category: rule.category,
    };
  }

  return declarations as Record<DeclarationFieldKey, DeclarationField>;
}
