/**
 * SatyaDrishti Complaint Service
 * Connects frontend grievance submission & officer adjudication with FastAPI backend & Supabase DB.
 */

import { Complaint, OfficerActionType } from '../types/compliance';

const BACKEND_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface BackendComplaintPayload {
  id?: string;
  ticket_id?: string;
  product_id?: string;
  consumer_name: string;
  consumer_email: string;
  consumer_phone?: string;
  product_name: string;
  brand: string;
  platform: string;
  order_number?: string;
  product_url?: string;
  description: string;
  category: string;
  ai_matched_rule?: string;
  status: string;
  sentiment_score: number;
  needs_review: boolean;
  extracted_evidence_summary?: Record<string, any>;
  evidence_urls?: string[];
  evidence_images?: any[];
  assigned_officer?: string;
  officer_decision_history?: any[];
  submitted_at?: string;
}

/**
 * Transforms a frontend Complaint object into the backend API schema.
 */
export function toBackendComplaintPayload(c: Partial<Complaint>): BackendComplaintPayload {
  return {
    id: c.id,
    ticket_id: c.ticketId,
    product_id: c.productName ? undefined : undefined,
    consumer_name: c.consumerName || 'Anonymous Consumer',
    consumer_email: c.consumerEmail || 'consumer@satyadrishti.gov.in',
    consumer_phone: c.consumerPhone,
    product_name: c.productName || 'Packaged Commodity',
    brand: c.brand || 'Unknown Brand',
    platform: c.platform || 'Direct',
    order_number: c.orderNumber,
    product_url: c.productUrl,
    description: c.description || '',
    category: c.category || 'Price Gouging / MRP Violation',
    ai_matched_rule: c.aiMatchedRule || c.regulatoryMappingResult?.matchedRules?.[0]?.actName || 'Legal Metrology Act, 2009',
    status: c.status || 'New',
    sentiment_score: c.sentimentScore ?? 0.85,
    needs_review: c.needsReview ?? false,
    extracted_evidence_summary: {
      ...(c.extractedEvidenceSummary || {}),
      language: c.language,
      categoryCode: c.categoryCode,
      classificationResult: c.classificationResult,
      regulatoryMappingResult: c.regulatoryMappingResult,
      caseCorrelationSummary: c.caseCorrelationSummary,
      shopLocation: c.shopLocation,
      scannerDetectedDiscrepancies: c.scannerDetectedDiscrepancies,
    },
    evidence_urls: c.evidenceUrls || [],
    evidence_images: c.evidenceImages || [],
    assigned_officer: c.assignedOfficer || 'National Grievance Cell',
    officer_decision_history: c.officerDecisionHistory || [],
    submitted_at: c.submittedAt || new Date().toISOString().replace('T', ' ').substring(0, 19),
  };
}

/**
 * Transforms a backend DB record into the frontend Complaint object.
 */
export function fromBackendComplaint(dbItem: any): Complaint {
  const meta = dbItem.extracted_evidence_summary || {};
  return {
    id: dbItem.id,
    ticketId: dbItem.ticket_id || dbItem.id,
    language: meta.language || 'en',
    consumerName: dbItem.consumer_name,
    consumerEmail: dbItem.consumer_email,
    consumerPhone: dbItem.consumer_phone || '+91 98000 00000',
    productName: dbItem.product_name,
    brand: dbItem.brand,
    platform: dbItem.platform || 'Direct',
    productUrl: dbItem.product_url,
    orderNumber: dbItem.order_number || 'OD-DIRECT-001',
    category: dbItem.category,
    categoryCode: meta.categoryCode,
    description: dbItem.description,
    evidenceUrls: dbItem.evidence_urls || [],
    evidenceImages: dbItem.evidence_images?.length ? dbItem.evidence_images : meta.evidenceImages,
    extractedEvidenceSummary: meta,
    classificationResult: meta.classificationResult,
    regulatoryMappingResult: meta.regulatoryMappingResult,
    caseCorrelationSummary: meta.caseCorrelationSummary,
    officerDecisionHistory: dbItem.officer_decision_history || [],
    assignedOfficer: dbItem.assigned_officer,
    status: dbItem.status || 'New',
    priority: 'Standard',
    submittedAt: dbItem.submitted_at || (dbItem.created_at ? new Date(dbItem.created_at).toLocaleDateString() : 'Recent'),
    sentimentScore: dbItem.sentiment_score ?? 0.85,
    aiMatchedRule: dbItem.ai_matched_rule || 'Legal Metrology Act, 2009',
    needsReview: dbItem.needs_review ?? false,
    scannerDetectedDiscrepancies: meta.scannerDetectedDiscrepancies,
    shopLocation: meta.shopLocation,
  };
}

export const complaintService = {
  /**
   * Fetches all registered complaints from the backend / Supabase DB.
   */
  async getComplaints(status?: string): Promise<Complaint[]> {
    try {
      const url = status && status !== 'All'
        ? `${BACKEND_BASE_URL}/api/complaints?status=${encodeURIComponent(status)}`
        : `${BACKEND_BASE_URL}/api/complaints`;

      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch complaints: ${res.statusText}`);
      }

      const raw = await res.json();
      if (Array.isArray(raw)) {
        return raw.map(fromBackendComplaint);
      }
      return [];
    } catch (err) {
      console.warn('[ComplaintService] Could not reach backend DB, falling back to local store:', err);
      throw err;
    }
  },

  /**
   * Persists a new grievance case to Supabase PostgreSQL via FastAPI.
   */
  async createComplaint(complaint: Complaint): Promise<Complaint> {
    const payload = toBackendComplaintPayload(complaint);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to create complaint in database: ${res.status} ${errorText}`);
      }

      const created = await res.json();
      console.log('✅ [ComplaintService] Complaint stored in Supabase DB successfully:', created.ticket_id);
      return fromBackendComplaint(created);
    } catch (err) {
      console.error('❌ [ComplaintService] Error persisting complaint to Supabase:', err);
      throw err;
    }
  },

  /**
   * Updates complaint status or officer adjudication decision in Supabase.
   */
  async updateComplaint(
    complaintId: string,
    updates: Partial<{
      status: string;
      assigned_officer: string;
      officer_decision_history: any[];
      needs_review: boolean;
      extracted_evidence_summary: Record<string, any>;
    }>
  ): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/complaints/${complaintId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error(`Failed to update complaint in database: ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.error(`❌ [ComplaintService] Error updating complaint ${complaintId}:`, err);
      throw err;
    }
  },

  /**
   * Performs semantic similarity search and duplicate grievance detection
   * using Supabase pgvector (or fallback in-memory engine).
   */
  async searchSimilarComplaints(params: {
    queryText: string;
    brand?: string;
    productName?: string;
    limit?: number;
    threshold?: number;
  }): Promise<{
    total_matches: number;
    engine: string;
    is_pgvector: boolean;
    matches: Array<{
      id: string;
      ticket_id: string;
      consumer_name: string;
      product_name: string;
      brand: string;
      platform: string;
      category: string;
      description: string;
      status: string;
      submitted_at?: string;
      similarity_score: number;
      is_likely_duplicate: boolean;
      pattern: string;
    }>;
  }> {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/complaints/search-similar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query_text: params.queryText,
          brand: params.brand,
          product_name: params.productName,
          limit: params.limit || 4,
          threshold: params.threshold || 0.35,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to search similar complaints: ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      console.warn('[ComplaintService] Similar search notice (graceful empty fallback):', err);
      return { total_matches: 0, engine: 'Client Local Engine', is_pgvector: false, matches: [] };
    }
  },
};

