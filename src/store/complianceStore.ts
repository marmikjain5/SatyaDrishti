import { create } from 'zustand';
import {
  Product,
  Violation,
  Manufacturer,
  Complaint,
  RegulatoryRule,
  OfficerActionType,
  OfficerDecisionRecord,
  ComplianceStatus,
  PlatformType,
  ViolationSeverity,
} from '../types/compliance';
import { MOCK_PRODUCTS } from '../data/mockProducts';
import { MOCK_VIOLATIONS } from '../data/mockViolations';
import { MOCK_MANUFACTURERS } from '../data/mockManufacturers';
import { MOCK_COMPLAINTS } from '../data/mockComplaints';
import { MOCK_RULES } from '../data/mockComplianceData';
import { complaintService } from '../services/complaintService';

interface ComplianceState {
  products: Product[];
  violations: Violation[];
  manufacturers: Manufacturer[];
  complaints: Complaint[];
  rules: RegulatoryRule[];
  selectedProduct: Product | null;
  selectedViolation: Violation | null;
  searchQuery: string;
  isLoadingComplaints: boolean;
  backendOnline: boolean | null; // null = unknown (not yet fetched)

  // Actions
  addProduct: (product: Product) => void;
  addScannedProduct: (
    scanData: any,
    imageUrl?: string,
    confidence?: number,
    validationResult?: any
  ) => Product;
  setSelectedProduct: (product: Product | null) => void;
  setSelectedViolation: (violation: Violation | null) => void;
  setSearchQuery: (query: string) => void;
  issueNotice: (violationId: string, customNoticeText?: string) => string;
  resolveViolation: (violationId: string) => void;
  fetchComplaints: () => Promise<void>;
  addComplaint: (complaint: Omit<Complaint, 'id' | 'ticketId' | 'submittedAt' | 'status'> | Complaint) => Promise<void>;
  addFullComplaint: (complaint: Complaint) => Promise<void>;
  updateOfficerDecision: (
    complaintId: string,
    action: OfficerActionType,
    notes: string,
    officerName?: string,
    assignedInspector?: string
  ) => Promise<void>;
  updateComplaint: (complaint: Complaint) => Promise<void>;
  toggleRule: (ruleId: string) => void;
}

export const useComplianceStore = create<ComplianceState>((set, get) => ({
  products: MOCK_PRODUCTS,
  violations: MOCK_VIOLATIONS,
  manufacturers: MOCK_MANUFACTURERS,
  complaints: MOCK_COMPLAINTS,
  rules: MOCK_RULES,
  selectedProduct: null,
  selectedViolation: null,
  searchQuery: '',
  isLoadingComplaints: false,
  backendOnline: null,

  addProduct: (product) => {
    set((state) => ({
      products: [product, ...state.products],
    }));
  },

  fetchComplaints: async () => {
    set({ isLoadingComplaints: true });
    try {
      const dbComplaints = await complaintService.getComplaints();
      if (dbComplaints && dbComplaints.length > 0) {
        // DB is the source of truth  -  show DB complaints first, append any local mock
        // complaints whose ticketId doesn't exist in DB (demo scaffolding only)
        const dbIds = new Set(dbComplaints.map((c) => c.ticketId));
        const localOnlyMocks = MOCK_COMPLAINTS.filter((c) => !dbIds.has(c.ticketId));
        set({
          complaints: [...dbComplaints, ...localOnlyMocks],
          isLoadingComplaints: false,
          backendOnline: true,
        });
      } else {
        // Backend reachable but empty DB  -  keep mocks
        set({ isLoadingComplaints: false, backendOnline: true });
      }
    } catch (err) {
      console.warn('[Store] Backend unreachable  -  using local mock complaints:', err);
      set({ isLoadingComplaints: false, backendOnline: false });
    }
  },

  addScannedProduct: (scanData, imageUrl, confidence, validationResult) => {
    const productId = `PROD-${Date.now()}`;
    const violationsList: Violation[] = [];

    const violationsCount = validationResult?.violations?.length || 0;
    const warningsCount = validationResult?.warnings?.length || 0;
    let status: ComplianceStatus = 'compliant';
    if (violationsCount > 0) {
      status = 'non-compliant';
    } else if (warningsCount > 0) {
      status = 'under-review';
    }

    const mrpValue = typeof scanData?.mrp === 'number' 
      ? scanData.mrp 
      : (parseFloat(String(scanData?.mrp || '').replace(/[^0-9.]/g, '')) || 499);

    const listedPriceValue = typeof scanData?.unitSalePrice === 'number'
      ? scanData.unitSalePrice
      : (parseFloat(String(scanData?.unitSalePrice || '').replace(/[^0-9.]/g, '')) || Math.round(mrpValue * 0.9));

    const newProduct: Product = {
      id: productId,
      sku: `SKU-SCAN-${Math.floor(100 + Math.random() * 900)}`,
      title: scanData?.productName || 'Scanned Packaged Commodity',
      brand: scanData?.brandName || 'Brand (Extracted from OCR)',
      manufacturer: scanData?.manufacturerName || scanData?.packerName || 'Manufacturer Extracted via OCR',
      category: scanData?.category || 'Nutritional Supplements & Health Foods',
      platform: (scanData?.platform as PlatformType) || 'Direct',
      productUrl: '#',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
      mrp: mrpValue,
      listedPrice: listedPriceValue,
      netWeight: scanData?.netQuantity || scanData?.netWeight || 'Declared on package',
      mfgDate: scanData?.manufacturingDate || new Date().toISOString().split('T')[0],
      expiryDate: scanData?.expiryDate || scanData?.bestBeforeDate,
      countryOfOrigin: scanData?.countryOfOrigin || 'India',
      customerCareContact: scanData?.consumerCareEmail || scanData?.consumerCarePhone || scanData?.consumerCareDetails || 'Declared on package',
      customerCarePhone: scanData?.consumerCarePhone,
      customerCareEmail: scanData?.consumerCareEmail,
      manufacturerAddress: scanData?.manufacturerAddress,
      packerAddress: scanData?.packerAddress,
      unitSalePrice: typeof scanData?.unitSalePrice === 'string' ? scanData.unitSalePrice : undefined,
      dietaryType: 'Vegetarian',
      complianceScore: validationResult ? validationResult.score : Math.round(confidence || 92),
      status,
      violationsCount,
      ocrConfidence: Math.round(confidence || 96),
      lastScanned: 'Just now',
      missingMandatoryFields: validationResult?.missingDeclarations || [],
      regulatoryActs: ['Legal Metrology Act, 2009', 'Legal Metrology (Packaged Commodities) Rules, 2011'],
    };

    if (validationResult?.violations && validationResult.violations.length > 0) {
      validationResult.violations.forEach((v: any, idx: number) => {
        const violationId = `VIO-${Date.now()}-${idx}`;
        const newViolation: Violation = {
          id: violationId,
          caseNumber: `CASE-2025-${Math.floor(1000 + Math.random() * 9000)}`,
          productId: newProduct.id,
          productName: newProduct.title,
          brand: newProduct.brand,
          manufacturer: newProduct.manufacturer,
          platform: newProduct.platform,
          ruleCode: v.ruleCode || 'LM-R6-01',
          actName: v.actReference || 'Legal Metrology Act, 2009',
          section: 'Section 36 / Rule 6(1)',
          description: v.description || 'Statutory packaging non-compliance detected via automated scan.',
          severity: (v.severity as ViolationSeverity) || 'high',
          status: 'Open',
          detectedAt: 'Just now',
          evidence: {
            type: 'OCR Label',
            extractedValue: v.extractedValue || 'Non-compliant declaration',
            expectedStandard: v.expectedValue || 'As per Packaged Commodities Rules, 2011',
          },
          penaltyEstimate: v.penaltyAmount || 25000,
          assignedOfficer: 'Central Metrology Review Cell',
        };
        violationsList.push(newViolation);
      });
    }

    set((state) => ({
      products: [newProduct, ...state.products],
      violations: [...violationsList, ...state.violations],
    }));

    return newProduct;
  },

  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setSelectedViolation: (violation) => set({ selectedViolation: violation }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  issueNotice: (violationId) => {
    const noticeId = `SCN-2025-${Math.floor(1000 + Math.random() * 9000)}`;
    set((state) => ({
      violations: state.violations.map((v) =>
        v.id === violationId ? { ...v, status: 'Notice Issued', noticeId } : v
      ),
      products: state.products.map((p) =>
        state.violations.find((v) => v.id === violationId && v.productId === p.id)
          ? { ...p, status: 'notice-issued' }
          : p
      ),
    }));
    return noticeId;
  },

  resolveViolation: (violationId) => {
    set((state) => ({
      violations: state.violations.map((v) =>
        v.id === violationId ? { ...v, status: 'Resolved' } : v
      ),
    }));
  },

  addComplaint: async (complaintData) => {
    let newComplaint: Complaint;
    if ('ticketId' in complaintData && 'id' in complaintData) {
      newComplaint = complaintData as Complaint;
    } else {
      const ticketId = `NCH-GRV-2025-${Math.floor(10000 + Math.random() * 90000)}`;
      newComplaint = {
        ...(complaintData as any),
        id: `CMP-${Date.now()}`,
        ticketId,
        submittedAt: 'Just now',
        status: 'New',
      };
    }

    // 1. Optimistic UI update
    set((state) => ({
      complaints: [newComplaint, ...state.complaints],
    }));

    // 2. Persist directly to Supabase DB via FastAPI
    try {
      await complaintService.createComplaint(newComplaint);
    } catch (err) {
      console.warn('[Store] Complaint saved locally; backend DB sync encountered:', err);
    }
  },

  addFullComplaint: async (complaint) => {
    // 1. Optimistic UI update
    set((state) => ({
      complaints: [complaint, ...state.complaints],
    }));

    // 2. Persist directly to Supabase DB via FastAPI
    try {
      await complaintService.createComplaint(complaint);
    } catch (err) {
      console.warn('[Store] Full complaint saved locally; backend DB sync encountered:', err);
    }
  },

  updateOfficerDecision: async (complaintId, action, notes, officerName = 'Inspector Officer', assignedInspector) => {
    const actionStatusMap: Record<OfficerActionType, Complaint['status']> = {
      ACCEPT_INVESTIGATION: 'Investigation',
      REJECT: 'Rejected',
      REQUEST_INFO: 'More Info Requested',
      INSUFFICIENT_EVIDENCE: 'Insufficient Evidence',
      ASSIGN_INSPECTION: 'Assigned for Inspection',
      RESOLVE: 'Resolved',
    };

    const actionLabelMap: Record<OfficerActionType, string> = {
      ACCEPT_INVESTIGATION: 'Accepted for Formal Legal Investigation',
      REJECT: 'Complaint Rejected / Dismissed',
      REQUEST_INFO: 'Additional Information Requested from Complainant',
      INSUFFICIENT_EVIDENCE: 'Marked as Insufficient Evidence',
      ASSIGN_INSPECTION: 'Assigned Zonal Metrology Officer for On-Site Inspection',
      RESOLVE: 'Complaint Resolved & Penalty Recovered',
    };

    const newStatus = actionStatusMap[action] || 'Investigation';
    const actionLabel = actionLabelMap[action] || action;

    const newRecord: OfficerDecisionRecord = {
      id: `odr-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      officerName,
      action,
      actionLabel,
      notes,
      assignedInspector,
    };

    let updatedComplaintTarget: Complaint | undefined;

    set((state) => ({
      complaints: state.complaints.map((c) => {
        if (c.id !== complaintId) return c;

        const existingHistory = c.officerDecisionHistory || [];
        const finalAssignedOfficer = assignedInspector || c.assignedOfficer || officerName;
        const updated = {
          ...c,
          status: newStatus,
          assignedOfficer: finalAssignedOfficer,
          officerDecisionHistory: [newRecord, ...existingHistory],
          caseCorrelationSummary: c.caseCorrelationSummary
            ? {
                ...c.caseCorrelationSummary,
                verificationStatus: (actionLabel as any),
              }
            : undefined,
        };
        updatedComplaintTarget = updated;
        return updated;
      }),
    }));

    // Sync officer decision to Supabase
    if (updatedComplaintTarget) {
      try {
        await complaintService.updateComplaint(complaintId, {
          status: newStatus,
          assigned_officer: updatedComplaintTarget.assignedOfficer,
          officer_decision_history: updatedComplaintTarget.officerDecisionHistory,
        });
      } catch (err) {
        console.warn('[Store] Officer decision saved locally; backend DB sync encountered:', err);
      }
    }
  },

  updateComplaint: async (updatedComplaint) => {
    set((state) => ({
      complaints: state.complaints.map((c) =>
        c.id === updatedComplaint.id ? updatedComplaint : c
      ),
    }));

    try {
      await complaintService.updateComplaint(updatedComplaint.id, {
        status: updatedComplaint.status,
        assigned_officer: updatedComplaint.assignedOfficer,
        officer_decision_history: updatedComplaint.officerDecisionHistory,
        needs_review: updatedComplaint.needsReview,
      });
    } catch (err) {
      console.warn('[Store] Update saved locally; backend DB sync encountered:', err);
    }
  },

  toggleRule: (ruleId) => {
    set((state) => ({
      rules: state.rules.map((r) =>
        r.id === ruleId ? { ...r, isActive: !r.isActive } : r
      ),
    }));
  },
}));
