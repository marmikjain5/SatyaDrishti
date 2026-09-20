import React from 'react';
import {
  Scan,
  Cpu,
  BookOpenCheck,
  MessageSquareWarning,
  FileCheck2,
  Share2,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export const BentoFeaturesGrid: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-white border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Enterprise Architecture
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            Next-Gen Regulatory Intelligence Stack
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            An integrated intelligence stack for packaging analysis, compliance validation, regulatory review, and evidence-driven enforcement workflows.
          </p>
        </div>

        {/* Single Horizontal Scrollable Row / Carousel */}
        <div
          className="flex gap-5 overflow-x-auto pb-6 pt-2 px-1 scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' }}
        >
          {/* Card 1: Packaging OCR & Vision */}
          <div className="w-[300px] sm:w-[340px] md:w-[360px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-card transition-all shadow-subtle">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-blue-600 shadow-2xs">
                  <Scan className="h-5 w-5" />
                </div>
                <Badge variant="primary" size="sm">
                  Multi-Pass OCR
                </Badge>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Packaging OCR & Vision</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Processes packaging images through preprocessing and multi-pass OCR to extract statutory declarations and product information.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-[11px] text-slate-700 space-y-1.5">
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Image Preprocessing</span>
                </div>
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Optimized Image Variants</span>
                </div>
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Statutory Declaration Extraction</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 font-mono">
              Image → OCR → Declarations
            </div>
          </div>

          {/* Card 2: Legal Metrology Rule Engine */}
          <div className="w-[300px] sm:w-[340px] md:w-[360px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-card transition-all shadow-subtle">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-blue-600 shadow-2xs">
                  <Cpu className="h-5 w-5" />
                </div>
                <Badge variant="secondary" size="sm">
                  Rule Validation
                </Badge>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Legal Metrology Rule Engine</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Validates extracted package declarations against applicable Legal Metrology requirements and identifies potential compliance violations.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-[11px] text-slate-700 space-y-1.5">
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Declaration Validation</span>
                </div>
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Legal Metrology Checks</span>
                </div>
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Compliance Assessment</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 font-mono">
              Rules → Validation → Findings
            </div>
          </div>

          {/* Card 3: Regulatory RAG Intelligence */}
          <div className="w-[300px] sm:w-[340px] md:w-[360px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-card transition-all shadow-subtle">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-blue-600 shadow-2xs">
                  <BookOpenCheck className="h-5 w-5" />
                </div>
                <Badge variant="primary" size="sm">
                  RAG Intelligence
                </Badge>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Regulatory RAG Intelligence</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Retrieves relevant regulatory information to support legal and compliance queries using the platform's regulatory knowledge base.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-[11px] text-slate-700 space-y-1.5">
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Regulatory Document Retrieval</span>
                </div>
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Act & Rule References</span>
                </div>
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Context-Aware Legal Answers</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 font-mono">
              Query → Retrieval → Legal Context
            </div>
          </div>

          {/* Card 4: Violation Management */}
          <div className="w-[300px] sm:w-[340px] md:w-[360px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-card transition-all shadow-subtle">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-blue-600 shadow-2xs">
                  <MessageSquareWarning className="h-5 w-5" />
                </div>
                <Badge variant="warning" size="sm">
                  Evidence Workflow
                </Badge>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Violation Management</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Centralizes detected compliance violations with evidence, severity, review status, and case-level workflow.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-[11px] text-slate-700 space-y-1.5">
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Violation Detection</span>
                </div>
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Evidence Tracking</span>
                </div>
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Severity Categorization</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 font-mono">
              Finding → Evidence → Review
            </div>
          </div>

          {/* Card 5: AI Legal Review */}
          <div className="w-[300px] sm:w-[340px] md:w-[360px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-card transition-all shadow-subtle">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-blue-600 shadow-2xs">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <Badge variant="danger" size="sm">
                  Human-in-the-Loop
                </Badge>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">AI Legal Review</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Evaluates detected violations and evidence to produce a structured legal assessment before human verification.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-[11px] text-slate-700 space-y-1.5">
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Evidence Assessment</span>
                </div>
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Severity Assessment</span>
                </div>
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Legal Reasoning</span>
                </div>
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Human Verification</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 font-mono">
              AI Review → Human Verification
            </div>
          </div>

          {/* Card 6: Factory Hygiene Monitoring */}
          <div className="w-[300px] sm:w-[340px] md:w-[360px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-card transition-all shadow-subtle">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-blue-600 shadow-2xs">
                  <Share2 className="h-5 w-5" />
                </div>
                <Badge variant="secondary" size="sm">
                  Visual Inspection
                </Badge>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Factory Hygiene Monitoring</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Analyzes factory inspection inputs to assess hygiene and workplace conditions and track detected violations.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-[11px] text-slate-700 space-y-1.5">
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Live Factory Inspection</span>
                </div>
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Hygiene Assessment</span>
                </div>
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Zone Monitoring</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 font-mono">
              Inspection → Assessment → Violation
            </div>
          </div>

          {/* Card 7: Compliance Reporting */}
          <div className="w-[300px] sm:w-[340px] md:w-[360px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-card transition-all shadow-subtle">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-red-600 shadow-2xs">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <Badge variant="danger" size="sm">
                  Evidence Reports
                </Badge>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Compliance Reporting</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Generates structured compliance inspection reports with extraction results, validation findings, and evidence documentation.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-[11px] text-slate-700 space-y-1.5">
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Inspection Reports</span>
                </div>
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Compliance Evidence</span>
                </div>
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Session & Single-Scan Reports</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 font-mono">
              Scan → Validate → Report
            </div>
          </div>

          {/* Card 8: Human Verification Workflow */}
          <div className="w-[300px] sm:w-[340px] md:w-[360px] shrink-0 snap-start bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-card transition-all shadow-subtle">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-emerald-600 shadow-2xs">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <Badge variant="success" size="sm">
                  Human Review
                </Badge>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Human Verification Workflow</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Routes AI-generated assessments through inspector verification before a finding can proceed toward publication.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-[11px] text-slate-700 space-y-1.5">
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Inspector Review</span>
                </div>
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Verification / Rejection</span>
                </div>
                <div className="text-slate-800 truncate">
                  <span className="text-blue-600">Publication Approval</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 font-mono">
              AI Assessment → Verify → Publish
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

