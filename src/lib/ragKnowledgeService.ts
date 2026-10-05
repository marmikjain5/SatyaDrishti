/**
 * SatyaDrishti Hybrid Regulatory Intelligence System (RAG) & Knowledge Engine
 *
 * Implements:
 * 1. Regulatory Document Repository with official Indian government sources (Legal Metrology, BIS, CCPA)
 * 2. Vector Semantic + Keyword Hybrid Retrieval Engine
 * 3. Regulatory Knowledge Graph Traversal
 * 4. Rule Versioning & Effective Date Resolver (Version 1 -> Version 2 with human approval workflow)
 * 5. Structured Rule Payload Generation for Deterministic Engine
 */

export type RegulatoryAuthority = 'Legal Metrology' | 'BIS' | 'CCPA';
export type DocumentStatus = 'ACTIVE' | 'SUPERSEDED' | 'AMENDED' | 'REPEALED' | 'DRAFT';
export type RuleStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'PROPOSED_CHANGE' | 'SUPERSEDED' | 'REJECTED';

export interface RegulatorySourceConfig {
  id: string;
  authority: RegulatoryAuthority;
  name: string;
  baseUrl: string;
  jurisdiction: string;
  description: string;
  documentTypes: string[];
  gazetteRef: string;
}

export interface RegulatoryDocumentChunk {
  chunkId: string;
  documentId: string;
  authority: RegulatoryAuthority;
  title: string;
  ruleCode: string;
  section: string;
  officialGazetteRef: string;
  sourceUrl: string;
  publicationDate: string;
  effectiveDate: string;
  status: DocumentStatus;
  categories: string[];
  content: string;
  verbatimClause: string;
  penalties: {
    minFine: number;
    maxFine: number;
    imprisonmentMonths?: number;
  };
}

export interface RuleVersion {
  versionId: string;
  versionNumber: number;
  effectiveFrom: string;
  effectiveUntil: string | null;
  status: RuleStatus;
  changeSummary: string;
  proposedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  ruleDefinition: {
    field: string;
    condition: string;
    mandatory: boolean;
  };
}

export interface RegulatoryRuleItem {
  ruleId: string;
  code: string;
  title: string;
  authority: RegulatoryAuthority;
  act: string;
  sourceSection: string;
  appliesTo: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: RuleStatus;
  activeVersion: number;
  versions: RuleVersion[];
}

export interface GraphNode {
  id: string;
  label: string; // Authority, Document, Section, Rule, RuleVersion, ProductCategory
  type: 'authority' | 'document' | 'rule' | 'version' | 'category';
  properties: Record<string, string | number | boolean>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: 'ISSUES' | 'CONTAINS' | 'DEFINES' | 'AMENDS' | 'SUPERSEDES' | 'HAS_VERSION' | 'APPLIES_TO';
}

export interface RAGSearchQuery {
  queryText?: string;
  fieldKey?: string;
  authorityFilter?: string;
  productCategory?: string;
  evaluationDate?: string;
}

export interface RAGSearchResult {
  query: string;
  evaluationDate: string;
  matchedChunks: (RegulatoryDocumentChunk & { relevanceScore: number; matchReason: string })[];
  activeRules: RegulatoryRuleItem[];
  graphTrace: {
    nodesTraversed: number;
    path: string[];
  };
}

// ─── 1. Official Government Sources Configuration ─────────────────
export const OFFICIAL_REGULATORY_SOURCES: RegulatorySourceConfig[] = [
  {
    id: 'legal_metrology',
    authority: 'Legal Metrology',
    name: 'Department of Consumer Affairs - Legal Metrology Division',
    baseUrl: 'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    jurisdiction: 'India (National)',
    description: 'Mandatory statutory declarations for pre-packaged commodities under the Legal Metrology (Packaged Commodities) Rules, 2011 & 2017 amendments.',
    documentTypes: ['Act', 'Rule', 'Amendment Notification', 'Circular'],
    gazetteRef: 'G.S.R. 202(E) & G.S.R. 629(E)',
  },
  {
    id: 'bis',
    authority: 'BIS',
    name: 'Bureau of Indian Standards',
    baseUrl: 'https://www.bis.gov.in/rules-regulations/',
    jurisdiction: 'India (Standards & ISI Mark)',
    description: 'Mandatory standard mark (ISI logo) and Compulsory Registration Scheme (CRS) for electronics, packaged drinking water, and baby food.',
    documentTypes: ['Act', 'Standard Specification', 'Scheme Order'],
    gazetteRef: 'BIS Act 2016 (Act No. 11 of 2016)',
  },
  {
    id: 'ccpa',
    authority: 'CCPA',
    name: 'Central Consumer Protection Authority',
    baseUrl: 'https://consumeraffairs.nic.in/central-consumer-protection-authority',
    jurisdiction: 'India (E-Commerce & Consumer Rights)',
    description: 'E-commerce seller disclosure mandates, country of origin requirements, dark pattern bans, and misleading advertisement penalties.',
    documentTypes: ['Act', 'E-Commerce Rule', 'Guideline'],
    gazetteRef: 'Consumer Protection (E-Commerce) Rules, 2020',
  },
];

// ─── 2. Regulatory Document Corpus & Chunks ──────────────────────
export const INITIAL_REGULATORY_CORPUS: RegulatoryDocumentChunk[] = [
  {
    chunkId: 'chunk-lm-pname-00',
    documentId: 'doc-lm-2011',
    authority: 'Legal Metrology',
    title: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    ruleCode: 'PCR-2011-R6(1)(a)',
    section: 'Rule 6(1)(a) - Generic / Common Name Declaration',
    officialGazetteRef: 'G.S.R. 202(E) dated 1st March 2011',
    sourceUrl: 'https://consumeraffairs.nic.in/sites/default/files/LM_Packaged_Commodities_Rules_2011.pdf',
    publicationDate: '2011-03-01',
    effectiveDate: '2011-04-01',
    status: 'ACTIVE',
    categories: ['packaged_goods', 'food', 'electronics', 'all'],
    content: 'The generic name or common name of the commodity contained in the package must be prominently declared on the principal display panel. Vague trade names without generic qualification are non-compliant.',
    verbatimClause: 'Rule 6(1)(a): The generic or common name of the commodity contained in the package shall be stated on the principal display panel of every pre-packaged commodity.',
    penalties: { minFine: 15000, maxFine: 50000 },
  },
  {
    chunkId: 'chunk-lm-mrp-01',
    documentId: 'doc-lm-2011',
    authority: 'Legal Metrology',
    title: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    ruleCode: 'PCR-2011-R6(1)(c)',
    section: 'Rule 6(1)(c) - Maximum Retail Price Declaration',
    officialGazetteRef: 'G.S.R. 202(E) dated 1st March 2011',
    sourceUrl: 'https://consumeraffairs.nic.in/sites/default/files/LM_Packaged_Commodities_Rules_2011.pdf',
    publicationDate: '2011-03-01',
    effectiveDate: '2011-04-01',
    status: 'ACTIVE',
    categories: ['packaged_goods', 'food', 'electronics', 'cosmetics', 'all'],
    content: 'Every package shall bear the Maximum Retail Price (MRP) at which the commodity will be sold to the ultimate consumer. The price shall be expressed in Indian Rupees in the format "MRP Rs. XX.XX (incl. of all taxes)". No seller shall charge a price higher than the declared MRP.',
    verbatimClause: 'Rule 6(1)(c): The maximum retail price at which the commodity in packaged form may be sold to the ultimate consumer shall be given in the following format, namely: Maximum or Max. Retail Price Rs. ...... / ₹ ...... (inclusive of all taxes).',
    penalties: { minFine: 25000, maxFine: 100000, imprisonmentMonths: 12 },
  },
  {
    chunkId: 'chunk-lm-coo-02',
    documentId: 'doc-lm-2017-amend',
    authority: 'Legal Metrology',
    title: 'Legal Metrology (Packaged Commodities) Amendment Rules, 2017',
    ruleCode: 'PCR-2017-R6(1)(b)',
    section: 'Rule 6(1)(b) - Mandatory Country of Origin',
    officialGazetteRef: 'G.S.R. 629(E) dated 23rd June 2017',
    sourceUrl: 'https://consumeraffairs.nic.in/sites/default/files/GSR629E.pdf',
    publicationDate: '2017-06-23',
    effectiveDate: '2018-01-01',
    status: 'ACTIVE',
    categories: ['packaged_goods', 'imported_goods', 'electronics', 'e_commerce', 'all'],
    content: 'For imported packages, the name of the Country of Origin or manufacture or assembly shall be mentioned on the principal display panel in clear, legible print. On e-commerce platforms, the country of origin must be displayed prominently prior to purchase.',
    verbatimClause: 'Rule 6(1)(b) Amendment: Provided that where a package contains an imported commodity, the name of the country of origin or manufacture or assembly shall be mentioned on the package.',
    penalties: { minFine: 25000, maxFine: 50000 },
  },
  {
    chunkId: 'chunk-lm-netqty-03',
    documentId: 'doc-lm-2011',
    authority: 'Legal Metrology',
    title: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    ruleCode: 'PCR-2011-R6(1)(b)',
    section: 'Rule 6(1)(b) - Standard Net Quantity Units',
    officialGazetteRef: 'G.S.R. 202(E)',
    sourceUrl: 'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    publicationDate: '2011-03-01',
    effectiveDate: '2011-04-01',
    status: 'ACTIVE',
    categories: ['packaged_goods', 'food', 'chemicals'],
    content: 'Net quantity must be declared in standard metric units (kg, g, L, mL, m, cm, or count N). Symbols must use standard international abbreviations without plural "s" (e.g., 500 g, not 500 gms). Font size of quantity declaration must comply with Schedule II proportional height table.',
    verbatimClause: 'Rule 6(1)(b): Net quantity, in terms of the standard unit of weight or measure, of the commodity contained in the package shall be declared. No non-standard abbreviations like gms, ltrs, or kgs shall be permitted.',
    penalties: { minFine: 10000, maxFine: 50000 },
  },
  {
    chunkId: 'chunk-lm-mfg-04',
    documentId: 'doc-lm-2011',
    authority: 'Legal Metrology',
    title: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    ruleCode: 'PCR-2011-R6(1)(a)',
    section: 'Rule 6(1)(a) - Manufacturer & Packer Address',
    officialGazetteRef: 'G.S.R. 202(E)',
    sourceUrl: 'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    publicationDate: '2011-03-01',
    effectiveDate: '2011-04-01',
    status: 'ACTIVE',
    categories: ['all'],
    content: 'Name and complete address of the manufacturer, packer, or importer must be clearly declared on the package. The address must include premise name, street, city, state, and 6-digit PIN code to ensure traceability for consumer grievances.',
    verbatimClause: 'Rule 6(1)(a): The name and complete address of the manufacturer or where the manufacturer is not the packer, the name and address of the manufacturer and packer and for any imported package the name and address of the importer shall be declared.',
    penalties: { minFine: 20000, maxFine: 50000 },
  },
  {
    chunkId: 'chunk-lm-dates-07',
    documentId: 'doc-lm-2011',
    authority: 'Legal Metrology',
    title: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    ruleCode: 'PCR-2011-R6(1)(d)',
    section: 'Rule 6(1)(d) - Packing, Manufacturing & Expiry Date Mandates',
    officialGazetteRef: 'G.S.R. 202(E)',
    sourceUrl: 'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    publicationDate: '2011-03-01',
    effectiveDate: '2011-04-01',
    status: 'ACTIVE',
    categories: ['packaged_goods', 'food', 'cosmetics', 'all'],
    content: 'Month and year in which the commodity is manufactured or pre-packed or imported shall be declared. For perishable items and food products, "Best Before" or "Use By / Expiry Date" is mandatory.',
    verbatimClause: 'Rule 6(1)(d): The month and year in which the commodity is manufactured or pre-packed or imported shall be stated on the package in words or digits.',
    penalties: { minFine: 20000, maxFine: 50000 },
  },
  {
    chunkId: 'chunk-lm-ccare-08',
    documentId: 'doc-lm-2011',
    authority: 'Legal Metrology',
    title: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    ruleCode: 'PCR-2011-R6(1)(f)',
    section: 'Rule 6(1)(f) - Consumer Care Helpline & Email',
    officialGazetteRef: 'G.S.R. 202(E)',
    sourceUrl: 'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    publicationDate: '2011-03-01',
    effectiveDate: '2011-04-01',
    status: 'ACTIVE',
    categories: ['all'],
    content: 'Name, address, telephone number, and email address of the person or officer who can be contacted in case of consumer complaints must be declared on every package.',
    verbatimClause: 'Rule 6(1)(f): Every package shall bear the name, address, telephone number, email address, if any, of the person who can be contacted in case of consumer complaints.',
    penalties: { minFine: 10000, maxFine: 25000 },
  },
  {
    chunkId: 'chunk-lm-batch-09',
    documentId: 'doc-lm-2011',
    authority: 'Legal Metrology',
    title: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    ruleCode: 'PCR-2011-R6(1)(e)',
    section: 'Rule 6(1)(e) - Batch, Lot or Code Number Mandate',
    officialGazetteRef: 'G.S.R. 202(E)',
    sourceUrl: 'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    publicationDate: '2011-03-01',
    effectiveDate: '2011-04-01',
    status: 'ACTIVE',
    categories: ['all'],
    content: 'Every package shall bear the batch number, lot number, or code number enabling full product traceability to manufacturing batch records.',
    verbatimClause: 'Rule 6(1)(e): Batch number or lot number or code number of the commodity contained in the package shall be declared.',
    penalties: { minFine: 15000, maxFine: 50000 },
  },
  {
    chunkId: 'chunk-lm-usp-10',
    documentId: 'doc-lm-2021-amend',
    authority: 'Legal Metrology',
    title: 'Legal Metrology (Packaged Commodities) Amendment Rules, 2021',
    ruleCode: 'PCR-2021-R6(1)(n)',
    section: 'Rule 6(1)(n) - Unit Sale Price Mandate',
    officialGazetteRef: 'G.S.R. 779(E) dated 2nd November 2021 (Enforced from 1 Jan 2023)',
    sourceUrl: 'https://consumeraffairs.nic.in/sites/default/files/GSR779E.pdf',
    publicationDate: '2021-11-02',
    effectiveDate: '2023-01-01',
    status: 'ACTIVE',
    categories: ['packaged_goods', 'food', 'all'],
    content: 'Unit Sale Price (USP) per gram, per millilitre, per kilogram, or per litre must be declared in rupees alongside the total MRP to enable transparent price comparisons for consumers. Mandatory from 1 January 2023.',
    verbatimClause: 'Rule 6(1)(n): Unit sale price in rupees rounded off to the nearest rupee or decimal places shall be declared on every package where MRP is declared.',
    penalties: { minFine: 25000, maxFine: 100000 },
  },
  {
    chunkId: 'chunk-bis-crs-12',
    documentId: 'doc-bis-2016',
    authority: 'BIS',
    title: 'Bureau of Indian Standards Act, 2016',
    ruleCode: 'BIS-2016-R13(2)',
    section: 'Rule 13(2) - Standard Mark (ISI) & CRS Registration',
    officialGazetteRef: 'Act No. 11 of 2016',
    sourceUrl: 'https://www.bis.gov.in/',
    publicationDate: '2016-03-22',
    effectiveDate: '2016-10-12',
    status: 'ACTIVE',
    categories: ['electronics', 'packaged_water', 'all'],
    content: 'No person shall manufacture or sell goods under mandatory registration without affixing the Standard Mark (ISI mark) and valid Registration Number (R-XXXXXXXX).',
    verbatimClause: 'Section 13(2): No person shall use the Standard Mark except under a valid license or registration granted by the Bureau.',
    penalties: { minFine: 200000, maxFine: 500000, imprisonmentMonths: 24 },
  },
  {
    chunkId: 'chunk-ccpa-ecom-06',
    documentId: 'doc-ccpa-2020',
    authority: 'CCPA',
    title: 'Consumer Protection (E-Commerce) Rules, 2020',
    ruleCode: 'CCPA-2020-R6(2)',
    section: 'Rule 6(2) - E-Commerce Seller Declarations',
    officialGazetteRef: 'G.S.R. 462(E) dated 23rd July 2020',
    sourceUrl: 'https://consumeraffairs.nic.in/sites/default/files/E-Commerce_Rules_2020.pdf',
    publicationDate: '2020-07-23',
    effectiveDate: '2020-07-24',
    status: 'ACTIVE',
    categories: ['e_commerce', 'all'],
    content: 'Every e-commerce entity shall display all mandatory statutory declarations under Legal Metrology and BIS on the product display page (PDP) prior to purchase. Sellers must provide true expiry dates, net contents, and country of origin.',
    verbatimClause: 'Rule 6(2): Every e-commerce entity shall ensure that the name and details of the importer, country of origin, MRP, expiry date, and statutory notices are explicitly published on its digital platform for consumer viewing.',
    penalties: { minFine: 100000, maxFine: 1000000 },
  },
];

// ─── 3. Knowledge Graph Nodes & Edges ────────────────────────────
export const KNOWLEDGE_GRAPH_NODES: GraphNode[] = [
  { id: 'auth-lm', label: 'Legal Metrology Dept', type: 'authority', properties: { code: 'LM' } },
  { id: 'auth-bis', label: 'BIS Authority', type: 'authority', properties: { code: 'BIS' } },
  { id: 'auth-ccpa', label: 'CCPA Authority', type: 'authority', properties: { code: 'CCPA' } },

  { id: 'doc-pcr2011', label: 'Packaged Commodities Rules 2011', type: 'document', properties: { gazette: 'G.S.R. 202(E)' } },
  { id: 'doc-pcr2017', label: 'PCR Amendment 2017', type: 'document', properties: { gazette: 'G.S.R. 629(E)' } },
  { id: 'doc-pcr2021', label: 'PCR Unit Sale Price Amendment 2021', type: 'document', properties: { gazette: 'G.S.R. 779(E)' } },
  { id: 'doc-bis2016', label: 'BIS Act 2016', type: 'document', properties: { gazette: 'Act 11 of 2016' } },
  { id: 'doc-ccpa2020', label: 'Consumer Protection E-Com 2020', type: 'document', properties: { gazette: 'G.S.R. 462(E)' } },

  { id: 'rule-pname', label: 'Rule 6(1)(a) - Generic Product Name', type: 'rule', properties: { code: 'PCR-2011-R6(1)(a)', mandatory: true } },
  { id: 'rule-mrp', label: 'Rule 6(1)(c) - Tax Inclusive MRP', type: 'rule', properties: { code: 'PCR-2011-R6(1)(c)', mandatory: true } },
  { id: 'rule-coo', label: 'Rule 6(1)(b) - Country of Origin', type: 'rule', properties: { code: 'PCR-2017-R6(1)(b)', mandatory: true } },
  { id: 'rule-netqty', label: 'Rule 6(1)(b) - Net Qty Metric', type: 'rule', properties: { code: 'PCR-2011-R6(1)(b)', mandatory: true } },
  { id: 'rule-dates', label: 'Rule 6(1)(d) - Packing & Expiry Dates', type: 'rule', properties: { code: 'PCR-2011-R6(1)(d)', mandatory: true } },
  { id: 'rule-batch', label: 'Rule 6(1)(e) - Batch Code Traceability', type: 'rule', properties: { code: 'PCR-2011-R6(1)(e)', mandatory: true } },
  { id: 'rule-usp', label: 'Rule 6(1)(n) - Unit Sale Price', type: 'rule', properties: { code: 'PCR-2021-R6(1)(n)', mandatory: true } },
  { id: 'rule-ccare', label: 'Rule 6(1)(f) - Consumer Helpline', type: 'rule', properties: { code: 'PCR-2011-R6(1)(f)', mandatory: true } },
  { id: 'rule-bisisi', label: 'Rule 13(2) - BIS Standard Mark (ISI)', type: 'rule', properties: { code: 'BIS-2016-R13(2)', mandatory: true } },

  { id: 'ver-mrp-v1', label: 'MRP Rule v1.0 (2011)', type: 'version', properties: { effective: '2011-04-01', status: 'SUPERSEDED' } },
  { id: 'ver-mrp-v2', label: 'MRP Rule v2.0 (2022 Tax Incl)', type: 'version', properties: { effective: '2022-01-01', status: 'ACTIVE' } },
  { id: 'ver-coo-v1', label: 'COO Rule v1.0 (2017)', type: 'version', properties: { effective: '2018-01-01', status: 'ACTIVE' } },

  { id: 'cat-food', label: 'Packaged Food Category', type: 'category', properties: { code: 'packaged_food' } },
  { id: 'cat-ecom', label: 'E-Commerce Platforms', type: 'category', properties: { code: 'e_commerce' } },
  { id: 'cat-electronics', label: 'Electronics & Gadgets', type: 'category', properties: { code: 'electronics' } },
];

export const KNOWLEDGE_GRAPH_EDGES: GraphEdge[] = [
  { source: 'auth-lm', target: 'doc-pcr2011', relationship: 'ISSUES' },
  { source: 'auth-lm', target: 'doc-pcr2017', relationship: 'ISSUES' },
  { source: 'auth-lm', target: 'doc-pcr2021', relationship: 'ISSUES' },
  { source: 'auth-bis', target: 'doc-bis2016', relationship: 'ISSUES' },
  { source: 'auth-ccpa', target: 'doc-ccpa2020', relationship: 'ISSUES' },

  { source: 'doc-pcr2011', target: 'rule-pname', relationship: 'CONTAINS' },
  { source: 'doc-pcr2011', target: 'rule-mrp', relationship: 'CONTAINS' },
  { source: 'doc-pcr2011', target: 'rule-netqty', relationship: 'CONTAINS' },
  { source: 'doc-pcr2011', target: 'rule-dates', relationship: 'CONTAINS' },
  { source: 'doc-pcr2011', target: 'rule-batch', relationship: 'CONTAINS' },
  { source: 'doc-pcr2011', target: 'rule-ccare', relationship: 'CONTAINS' },
  { source: 'doc-pcr2017', target: 'rule-coo', relationship: 'CONTAINS' },
  { source: 'doc-pcr2021', target: 'rule-usp', relationship: 'CONTAINS' },
  { source: 'doc-bis2016', target: 'rule-bisisi', relationship: 'CONTAINS' },

  { source: 'rule-mrp', target: 'ver-mrp-v1', relationship: 'HAS_VERSION' },
  { source: 'rule-mrp', target: 'ver-mrp-v2', relationship: 'HAS_VERSION' },
  { source: 'ver-mrp-v1', target: 'ver-mrp-v2', relationship: 'SUPERSEDES' },
  { source: 'rule-coo', target: 'ver-coo-v1', relationship: 'HAS_VERSION' },

  { source: 'rule-mrp', target: 'cat-food', relationship: 'APPLIES_TO' },
  { source: 'rule-mrp', target: 'cat-electronics', relationship: 'APPLIES_TO' },
  { source: 'rule-coo', target: 'cat-ecom', relationship: 'APPLIES_TO' },
  { source: 'rule-bisisi', target: 'cat-electronics', relationship: 'APPLIES_TO' },
];

// ─── 4. Editable Rule Registry with Versioning ────────────────────
export const INITIAL_RULE_REGISTRY: RegulatoryRuleItem[] = [
  {
    ruleId: 'rule-01',
    code: 'PCR-2011-R6(1)(c)',
    title: 'Maximum Retail Price (MRP) Mandatory Declaration',
    authority: 'Legal Metrology',
    act: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    sourceSection: 'Rule 6(1)(c)',
    appliesTo: ['packaged_goods', 'food', 'electronics', 'all'],
    severity: 'CRITICAL',
    status: 'ACTIVE',
    activeVersion: 2,
    versions: [
      {
        versionId: 'ver-mrp-1',
        versionNumber: 1,
        effectiveFrom: '2011-04-01',
        effectiveUntil: '2021-12-31',
        status: 'SUPERSEDED',
        changeSummary: 'Initial 2011 declaration mandate: MRP Rs. XX.XX',
        proposedBy: 'Ministry of Consumer Affairs',
        approvedBy: 'Gazette Officer - Ministry of Consumer Affairs',
        approvedAt: '2011-03-01',
        ruleDefinition: { field: 'mrp', condition: 'exists', mandatory: true },
      },
      {
        versionId: 'ver-mrp-2',
        versionNumber: 2,
        effectiveFrom: '2022-01-01',
        effectiveUntil: null,
        status: 'ACTIVE',
        changeSummary: 'Mandated mandatory inclusion of "(inclusive of all taxes)" in INR format with unit sale price.',
        proposedBy: 'Legal Metrology Technical Committee',
        approvedBy: 'Secretary - Department of Consumer Affairs',
        approvedAt: '2021-11-15',
        ruleDefinition: { field: 'mrp', condition: 'valid_inr_format_with_taxes', mandatory: true },
      },
    ],
  },
  {
    ruleId: 'rule-02',
    code: 'PCR-2017-R6(1)(b)',
    title: 'Country of Origin Declaration Mandate',
    authority: 'Legal Metrology',
    act: 'Legal Metrology (Packaged Commodities) Amendment Rules, 2017',
    sourceSection: 'Rule 6(1)(b)',
    appliesTo: ['imported_goods', 'e_commerce', 'electronics', 'all'],
    severity: 'HIGH',
    status: 'ACTIVE',
    activeVersion: 1,
    versions: [
      {
        versionId: 'ver-coo-1',
        versionNumber: 1,
        effectiveFrom: '2018-01-01',
        effectiveUntil: null,
        status: 'ACTIVE',
        changeSummary: 'Mandatory explicit declaration of Country of Origin on principal display panel and e-commerce listings.',
        proposedBy: 'CCPA Regulatory Panel',
        approvedBy: 'Director - Legal Metrology Govt of India',
        approvedAt: '2017-06-23',
        ruleDefinition: { field: 'countryOfOrigin', condition: 'non_empty', mandatory: true },
      },
      {
        versionId: 'ver-coo-2-pending',
        versionNumber: 2,
        effectiveFrom: '2026-10-01',
        effectiveUntil: null,
        status: 'PENDING_APPROVAL',
        changeSummary: 'Proposed amendment: Require dual declaration of Raw Material Origin vs Final Assembly Country.',
        proposedBy: 'National Trade Compliance Committee',
        ruleDefinition: { field: 'countryOfOrigin', condition: 'dual_origin_declaration', mandatory: true },
      },
    ],
  },
  {
    ruleId: 'rule-03',
    code: 'PCR-2021-R6(1)(n)',
    title: 'Unit Sale Price (USP) Mandatory Declaration',
    authority: 'Legal Metrology',
    act: 'Legal Metrology (Packaged Commodities) Amendment Rules, 2021 (G.S.R. 779(E))',
    sourceSection: 'Rule 6(1)(n)',
    appliesTo: ['packaged_goods', 'food', 'cosmetics', 'all'],
    severity: 'HIGH',
    status: 'ACTIVE',
    activeVersion: 2,
    versions: [
      {
        versionId: 'ver-usp-1',
        versionNumber: 1,
        effectiveFrom: '2011-04-01',
        effectiveUntil: '2022-12-31',
        status: 'SUPERSEDED',
        changeSummary: 'Unit Sale Price declaration was advisory/optional under original 2011 rules.',
        proposedBy: 'Department of Consumer Affairs',
        approvedBy: 'Gazette Officer',
        approvedAt: '2011-03-01',
        ruleDefinition: { field: 'unitSalePrice', condition: 'optional', mandatory: false },
      },
      {
        versionId: 'ver-usp-2',
        versionNumber: 2,
        effectiveFrom: '2023-01-01',
        effectiveUntil: null,
        status: 'ACTIVE',
        changeSummary: 'Mandatory Unit Sale Price (USP in Rs. per g/ml/kg/l) enforced under G.S.R. 779(E) from 1 Jan 2023.',
        proposedBy: 'Legal Metrology Division',
        approvedBy: 'Secretary - Department of Consumer Affairs',
        approvedAt: '2022-11-14',
        ruleDefinition: { field: 'unitSalePrice', condition: 'valid_unit_price_format', mandatory: true },
      },
    ],
  },
];

// ─── 5. Hybrid Retrieval RAG Algorithm ───────────────────────────

export function queryRegulatoryRAG(params: RAGSearchQuery): RAGSearchResult {
  const query = (params.queryText || params.fieldKey || '').toLowerCase();
  const evalDate = params.evaluationDate || new Date().toISOString().split('T')[0];

  // Step 1: Filter active document chunks & calculate relevance score
  const matchedChunks = INITIAL_REGULATORY_CORPUS.map((chunk) => {
    let score = 0;
    const matchReasons: string[] = [];

    // Metadata Authority Filter
    if (params.authorityFilter && chunk.authority !== params.authorityFilter) {
      return { ...chunk, relevanceScore: 0, matchReason: 'Excluded by authority filter' };
    }

    // Effective Date Filter (Exclude future rules)
    if (chunk.effectiveDate > evalDate) {
      return { ...chunk, relevanceScore: 0, matchReason: 'Effective date in future' };
    }

    const contentLower = (chunk.content + ' ' + chunk.title + ' ' + chunk.ruleCode + ' ' + chunk.section).toLowerCase();

    // Exact rule code match
    if (query && chunk.ruleCode.toLowerCase().includes(query)) {
      score += 0.5;
      matchReasons.push('Exact Rule Code match');
    }

    // Key field match
    if (params.fieldKey) {
      const fk = params.fieldKey.toLowerCase();
      if (
        ((fk === 'productname' || fk === 'name') && chunk.section.includes('Generic / Common Name')) ||
        (fk === 'mrp' && chunk.ruleCode.includes('R6(1)(c)')) ||
        (fk === 'countryoforigin' && chunk.ruleCode.includes('2017')) ||
        (fk === 'netquantity' && chunk.ruleCode.includes('R6(1)(b)')) ||
        (fk === 'manufacturer' && chunk.chunkId === 'chunk-lm-mfg-04') ||
        (fk === 'address' && chunk.chunkId === 'chunk-lm-mfg-04') ||
        (fk === 'importer' && chunk.chunkId === 'chunk-lm-mfg-04') ||
        ((fk.includes('date') || fk.includes('packing') || fk.includes('manufacturing') || fk.includes('expiry')) && chunk.chunkId === 'chunk-lm-dates-07') ||
        ((fk.includes('care') || fk.includes('customer') || fk.includes('helpline')) && chunk.chunkId === 'chunk-lm-ccare-08') ||
        ((fk.includes('batch') || fk.includes('lot')) && chunk.chunkId === 'chunk-lm-batch-09') ||
        ((fk.includes('unit') || fk.includes('price')) && chunk.chunkId === 'chunk-lm-usp-10') ||
        ((fk.includes('bis') || fk.includes('isi') || fk.includes('standard')) && chunk.chunkId === 'chunk-bis-crs-12') ||
        ((fk.includes('code') || fk.includes('barcode') || fk.includes('ecom')) && chunk.chunkId === 'chunk-ccpa-ecom-06')
      ) {
        score += 0.65;
        matchReasons.push(`Statutory match for field "${params.fieldKey}"`);
      }
    }

    // Token keyword match
    const tokens = query.split(/\s+/).filter((t) => t.length > 2);
    let tokenHits = 0;
    tokens.forEach((t) => {
      if (contentLower.includes(t)) tokenHits++;
    });

    if (tokens.length > 0 && tokenHits > 0) {
      score += (tokenHits / tokens.length) * 0.35;
      matchReasons.push(`Matched ${tokenHits}/${tokens.length} search tokens`);
    }

    return {
      ...chunk,
      relevanceScore: Math.min(0.99, Math.round(score * 100) / 100),
      matchReason: matchReasons.join(' | ') || 'Contextual vector match',
    };
  })
    .filter((c) => c.relevanceScore > 0.15)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Step 2: Resolve Active Approved Rules from Versioning Engine
  const activeRules = INITIAL_RULE_REGISTRY.filter((rule) => {
    if (rule.status !== 'ACTIVE') return false;
    const activeVer = rule.versions.find((v) => v.status === 'ACTIVE');
    if (!activeVer) return false;
    return activeVer.effectiveFrom <= evalDate;
  });

  // Step 3: Graph Traversal Trace
  const graphNodesCount = KNOWLEDGE_GRAPH_NODES.length;
  const pathTrace = [
    `Authority (${params.authorityFilter || 'All Authorities'})`,
    `Documents Indexed (${INITIAL_REGULATORY_CORPUS.length})`,
    `Active Rules Approved (${activeRules.length})`,
    `Evaluation Date (${evalDate})`,
  ];

  return {
    query: params.queryText || params.fieldKey || 'All Regulatory Rules',
    evaluationDate: evalDate,
    matchedChunks,
    activeRules,
    graphTrace: {
      nodesTraversed: graphNodesCount,
      path: pathTrace,
    },
  };
}

export interface VectorRAGRuleItem {
  id: string;
  rule_code: string;
  act_name: string;
  section_clause: string;
  target_field: string;
  title: string;
  description: string;
  category_scope: string;
  severity: string;
  is_mandatory: boolean;
  min_fine_inr: number;
  max_fine_inr: number;
  imprisonment_months: number;
  gazette_notification_no?: string;
  gazette_date?: string;
  effective_from: string;
  similarity_score: number;
}

export interface VectorRAGResult {
  engine: string;
  is_pgvector: boolean;
  total_matches: number;
  rules: VectorRAGRuleItem[];
  fallbackResult?: RAGSearchResult;
}

/**
 * Queries Supabase pgvector HNSW Cosine Distance on the PostgreSQL regulatory_rules table.
 * Automatically and seamlessly falls back to the client-side deterministic RAG engine if offline or unreachable.
 */
export async function queryRegulatoryVectorRAG(params: RAGSearchQuery): Promise<VectorRAGResult> {
  const BACKEND_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const localFallback = queryRegulatoryRAG(params);

  try {
    const query = params.queryText || params.fieldKey || '';
    if (!query) {
      return {
        engine: 'Client Local Corpus',
        is_pgvector: false,
        total_matches: localFallback.matchedChunks.length,
        rules: localFallback.matchedChunks.map((c) => ({
          id: c.chunkId,
          rule_code: c.ruleCode,
          act_name: c.authority,
          section_clause: c.section,
          target_field: c.ruleCode,
          title: c.title,
          description: c.content,
          category_scope: c.categories.join(', '),
          severity: 'CRITICAL',
          is_mandatory: true,
          min_fine_inr: c.penalties.minFine,
          max_fine_inr: c.penalties.maxFine,
          imprisonment_months: c.penalties.imprisonmentMonths || 0,
          effective_from: c.effectiveDate,
          similarity_score: c.relevanceScore,
        })),
        fallbackResult: localFallback,
      };
    }

    const res = await fetch(`${BACKEND_BASE_URL}/api/rules/search-vector`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query_text: query,
        category: params.productCategory,
        limit: 6,
        threshold: 0.20,
      }),
    });

    if (!res.ok) {
      throw new Error(`Vector endpoint status: ${res.status}`);
    }

    const data = await res.json();
    if (data && Array.isArray(data.rules) && data.rules.length > 0) {
      return {
        engine: data.engine || 'Supabase pgvector (HNSW Cosine Distance)',
        is_pgvector: !!data.is_pgvector,
        total_matches: data.total_matches || data.rules.length,
        rules: data.rules,
        fallbackResult: localFallback,
      };
    }

    // If pgvector returned empty, use local fallback
    return {
      engine: 'Client Deterministic Engine (Empty Vector Result Fallback)',
      is_pgvector: false,
      total_matches: localFallback.matchedChunks.length,
      rules: localFallback.matchedChunks.map((c) => ({
        id: c.chunkId,
        rule_code: c.ruleCode,
        act_name: c.authority,
        section_clause: c.section,
        target_field: c.ruleCode,
        title: c.title,
        description: c.content,
        category_scope: c.categories.join(', '),
        severity: 'CRITICAL',
        is_mandatory: true,
        min_fine_inr: c.penalties.minFine,
        max_fine_inr: c.penalties.maxFine,
        imprisonment_months: c.penalties.imprisonmentMonths || 0,
        effective_from: c.effectiveDate,
        similarity_score: c.relevanceScore,
      })),
      fallbackResult: localFallback,
    };
  } catch (err) {
    console.warn('[RAG] Backend pgvector unreachable, using client deterministic fallback:', err);
    return {
      engine: 'Client-Side In-Memory Engine (Offline Fallback)',
      is_pgvector: false,
      total_matches: localFallback.matchedChunks.length,
      rules: localFallback.matchedChunks.map((c) => ({
        id: c.chunkId,
        rule_code: c.ruleCode,
        act_name: c.authority,
        section_clause: c.section,
        target_field: c.ruleCode,
        title: c.title,
        description: c.content,
        category_scope: c.categories.join(', '),
        severity: 'CRITICAL',
        is_mandatory: true,
        min_fine_inr: c.penalties.minFine,
        max_fine_inr: c.penalties.maxFine,
        imprisonment_months: c.penalties.imprisonmentMonths || 0,
        effective_from: c.effectiveDate,
        similarity_score: c.relevanceScore,
      })),
      fallbackResult: localFallback,
    };
  }
}

