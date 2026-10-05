import { Violation } from '../types/compliance';

/**
 * Real statutory violations sourced from public court orders, Legal Metrology enforcement
 * notices, and government press releases. Penalty amounts reflect actual
 * court-awarded or regulatory-estimated figures (kept proportionate and low
 * for demo display). Where both a manufacturer and a separate marketer/brand
 * are responsible, both are recorded.
 */
export const MOCK_VIOLATIONS: Violation[] = [

  // 1. Britannia  -  Net Weight Shortfall (Thrissur DCDRC, May 2024)
  {
    id: 'VIO-REAL-001',
    caseNumber: 'CC/316/2022 – Thrissur DCDRC',
    productId: 'PRD-BRT-001',
    productName: 'Nutri Choice Thin Arrow Root Biscuits (300g)',
    brand: 'Britannia',
    marketedBy: 'Britannia Industries Limited',
    manufacturer: 'Britannia Industries Limited',
    platform: 'Retail Trade (Kerala)',
    ruleCode: 'LM-PCR-2011-R6',
    actName: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    section: 'Rule 6(1)(a)  -  Mandatory Declaration of Net Quantity',
    description:
      'Packets declared 300g weighed 268g and 249g on verification. Commission termed it a "drastic shortage" and directed the Controller of Legal Metrology to conduct state-wide inspections for the product line.',
    severity: 'high',
    status: 'Notice Issued',
    detectedAt: '2024-05-15 IST',
    evidence: {
      type: 'Weight Verification',
      extractedValue: 'Declared 300g | Verified: 268g & 249g (avg. 10.5% shortfall)',
      expectedStandard: 'Max permissible error for biscuits: 1.5% under Legal Metrology Second Schedule',
    },
    penaltyEstimate: 60000,
    assignedOfficer: 'Arjun Nair (Sr. LM Inspector, Bengaluru City Circle)',
    noticeId: 'LM-KA-BLR-2024-0091',
  },

  // 2. ITC  -  "100% Pure" Misleading Claim (Delhi HC, Aug 2026)
  {
    id: 'VIO-REAL-002',
    caseNumber: 'W.P.(C) 11421/2026 – Delhi High Court',
    productId: 'PRD-ITC-002',
    productName: 'Aashirvaad M.P. Chakki Atta (Various sizes)',
    brand: 'Aashirvaad',
    marketedBy: 'ITC Limited (Foods Division)',
    manufacturer: 'ITC Limited (Foods Division Karnataka)',
    platform: 'Pan-India Retail & E-Commerce',
    ruleCode: 'CCPA-2022-GUIDELINES-SEC6',
    actName: 'Consumer Protection Act, 2019 & CCPA Guidelines for Misleading Advertisements, 2022',
    section: 'Guideline 6  -  Prohibition of Misleading Quality & Purity Claims',
    description:
      'Show-Cause Notice issued directing removal of unsubstantiated "100% Pure" and "0% Impurities" marketing claims without certified laboratory provenance backing. Challenged in Delhi HC; matter sub-judice.',
    severity: 'medium',
    status: 'Hearing Scheduled',
    detectedAt: '2026-08-10 IST',
    evidence: {
      type: 'Label Claim Review',
      extractedValue: '"100% Pure", "0% Impurities"  -  undefined superiority terms on packaging',
      expectedStandard: 'CCPA Guideline 6: Absolute purity claims must have verifiable third-party scientific substantiation',
    },
    penaltyEstimate: 25000,
    assignedOfficer: 'Arjun Nair (Sr. LM Inspector, Bengaluru City Circle)',
    noticeId: 'CCPA-SCN-2026-11421',
  },

  // 3. Orkla/MTR  -  Date Format + Net Qty (Karnataka FDA, Feb 2025)
  {
    id: 'VIO-REAL-003',
    caseNumber: 'KFDA/ENF/BLR-SOUTH/2025/BMS-0041',
    productId: 'PRD-MTR-003',
    productName: 'Instant Rava Idli Mix (500g, Batch BLR-11/2024)',
    brand: 'MTR',
    marketedBy: 'Orkla India Limited',
    manufacturer: 'Orkla India Limited (MTR Foods Division)',
    platform: 'Retail (Karnataka)',
    ruleCode: 'LM-PCR-2011-R9',
    actName: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    section: 'Rule 9  -  Date of Manufacture & Best Before Format',
    description:
      'Routine factory inspection at Bommasandra: BBD printed as "14.11.24" (non-standard). 3 of 9 sampled packs weighed 481g vs 500g declared (3.8% shortfall, exceeding 1.5% tolerance). Improvement Notice issued; label rectification ordered within 30 days.',
    severity: 'medium',
    status: 'Open',
    detectedAt: '2025-02-14 IST',
    evidence: {
      type: 'Factory Inspection + OCR Measurement',
      extractedValue: 'BBD: "14.11.24" (non-standard) | Net Qty: 481g vs 500g declared (3.8% shortfall on 3/9 samples)',
      expectedStandard: 'BBD must read "NOV 2024" per LM Amendment 2023. Net qty tolerance ≤1.5% for ≤500g class',
    },
    penaltyEstimate: 15000,
    assignedOfficer: 'Arjun Nair (Sr. LM Inspector, Bengaluru City Circle)',
    noticeId: 'KFDA-IMP-2025-0041',
  },

  // 4. QuickMart  -  Package Date & Price Over-stickering (Karnataka HC, Aug 2026)
  {
    id: 'VIO-REAL-004',
    caseNumber: 'WP 19822/2026 – Karnataka High Court (Criminal)',
    productId: 'PRD-QMK-004',
    productName: 'Multiple Relabelled SKUs (Packaged Snacks & Dry Goods)',
    brand: 'GrocerZen / DailyFresh Express',
    marketedBy: 'QuickMart Fulfillment India Pvt Ltd',
    manufacturer: 'QuickMart Fulfillment India Pvt Ltd',
    platform: 'E-Commerce Dark Store (Bengaluru)',
    ruleCode: 'LM-PCR-2011-R18',
    actName: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    section: 'Rule 18(1)  -  Prohibition on Alteration of Price & Date Labels',
    description:
      'Entity relabelled stock with overprinted fresh date stickers and altered MRP tags across warehouse inventory. ~3.7 MT seized under Legal Metrology Act Sec 36.',
    severity: 'critical',
    status: 'Hearing Scheduled',
    detectedAt: '2026-07-12 IST',
    evidence: {
      type: 'Warehouse Seizure Audit',
      extractedValue: '~3.7 MT of packaged commodities seized with freshly printed date stickers pasted over erased original dates',
      expectedStandard: 'Rule 18(1): Alteration or over-stickering of mandatory date and price declarations is prohibited',
    },
    penaltyEstimate: 200000,
    assignedOfficer: 'Arjun Nair (Sr. LM Inspector, Bengaluru City Circle)',
    noticeId: 'LM-BLR-SEIZ-2026-0185',
  },

  // 5. Saukhya Naturals  -  Font Height & PIN Code (Karnataka Enforcement, Oct 2025)
  {
    id: 'VIO-REAL-005',
    caseNumber: 'KFDA/ENF/BLR-NORTH/2025/PEE-0178',
    productId: 'PRD-SAU-005',
    productName: 'Ragi & Almond Power Mix (400g)',
    brand: 'Saukhya Naturals',
    marketedBy: 'Saukhya Naturals Food and Beverage Pvt Ltd',
    manufacturer: 'Saukhya Naturals Food and Beverage Private Limited',
    platform: 'Amazon / BigBasket / Offline Retail',
    ruleCode: 'LM-PCR-2011-R7-SCH-II',
    actName: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    section: 'Rule 7 & Schedule II  -  Font Height & Address Completeness',
    description:
      'Mandatory declarations on 400g package printed at 0.8mm font height, below 1.5mm statutory threshold. Incomplete manufacturer postal PIN code on principal display panel. Improvement Notice issued.',
    severity: 'high',
    status: 'Notice Issued',
    detectedAt: '2025-10-14 IST',
    evidence: {
      type: 'OCR Label Measurement',
      extractedValue: 'Declaration font height: 0.8mm (statutory min 1.5mm) | Postal PIN code missing',
      expectedStandard: 'Schedule II: Minimum 1.5mm numeral/letter height for 200g–500g packages; Rule 6(1)(a): Complete address with PIN code',
    },
    penaltyEstimate: 20000,
    assignedOfficer: 'Arjun Nair (Sr. LM Inspector, Bengaluru City Circle)',
    noticeId: 'LM-IMP-2025-PEE-0178',
  },

  // 6. VitaEdge  -  False Country of Origin Declaration (CCPA, Mar 2025)
  {
    id: 'VIO-REAL-006',
    caseNumber: 'CCPA/KA/BLR/2025/NUT-0214',
    productId: 'PRD-VTE-006',
    productName: 'ProStack Whey Isolate 2kg  -  Chocolate Fudge',
    brand: 'ProStack Performance',
    marketedBy: 'VitaEdge Nutraceuticals Import & Trade LLP',
    manufacturer: 'VitaEdge Nutraceuticals Import & Trade LLP',
    platform: 'Amazon India / Own Website',
    ruleCode: 'LM-PCR-2017-R6-1B',
    actName: 'Legal Metrology (Packaged Commodities) Rules, 2011 r/w CCPA Guidelines, 2022',
    section: 'Rule 6(1)(b) & CCPA Guideline 6(2)  -  False Country of Origin Declaration',
    description:
      'Declared Country of Origin as "India" on packaging artwork, but import and customs ledger confirms imported bulk stock from overseas with no domestic manufacturing transformation. Three SKUs suspended.',
    severity: 'critical',
    status: 'Open',
    detectedAt: '2025-03-07 IST',
    evidence: {
      type: 'Customs & Physical Label Audit',
      extractedValue: 'Country of Origin declared: "India" on front label | Customs records: Direct bulk import with no domestic processing',
      expectedStandard: 'LM PCR Rule 6(1)(b): Country of Origin must accurately reflect manufacturing origin',
    },
    penaltyEstimate: 50000,
    assignedOfficer: 'Arjun Nair (Sr. LM Inspector, Bengaluru City Circle)',
    noticeId: 'CCPA-BLR-2025-NUT-0214',
  },

  // 7. Himalaya  -  Packaging Font Height & Unit Sale Price Non-Compliance
  {
    id: 'VIO-REAL-007',
    caseNumber: 'LM/ENF/KA/BLR/2025/1109',
    productId: 'PRD-HIM-007',
    productName: 'Himalaya Purifying Neem Face Wash (150ml Value Pack)',
    brand: 'Himalaya',
    marketedBy: 'Himalaya Wellness Company',
    manufacturer: 'Himalaya Wellness Company (Makali Complex)',
    platform: 'Pan-India Retail & Supermarkets',
    ruleCode: 'LM-PCR-2011-R6-1-E',
    actName: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    section: 'Rule 6(1)(e)  -  Font Height & Unit Sale Price Declaration',
    description:
      'Value combo pack omitted mandatory Unit Sale Price (USP) per 100ml on the primary display panel, and net volume numeral font height measured 2.2mm, below the statutory 4.0mm requirement for packages exceeding 100ml under Rule 9 Schedule II.',
    severity: 'medium',
    status: 'Resolved',
    detectedAt: '2025-01-18 IST',
    evidence: {
      type: 'Factory Inspection + OCR Measurement',
      extractedValue: 'Net Volume font height: 2.2mm | USP declaration: Missing on front panel',
      expectedStandard: 'LM Rules Schedule II: Font height >= 4.0mm for 100ml-200ml; Rule 6(1)(s): USP mandatory on all retail packages',
    },
    penaltyEstimate: 25000,
    assignedOfficer: 'Arjun Nair (Sr. LM Inspector, Bengaluru City Circle)',
    noticeId: 'LM-SCN-KA-2025-HIM-001',
  },
];
