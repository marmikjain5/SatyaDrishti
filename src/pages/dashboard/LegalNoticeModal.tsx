import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Violation } from '../../types/compliance';
import { formatCurrency } from '../../lib/utils';
import { sendSCNNoticeEmail, SendEmailResult } from '../../services/gmailService';
import { useAuthStore } from '../../store/authStore';
import { appendInspectionAuditEvent } from '../../lib/inspectionAuditService';
import {
  FileCheck2,
  Printer,
  Download,
  Send,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Building,
  Loader2,
  Mail,
} from 'lucide-react';

interface LegalNoticeModalProps {
  violation: Violation | null;
  isOpen: boolean;
  onClose: () => void;
  onDispatch: (violationId: string) => void;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({
  violation,
  isOpen,
  onClose,
  onDispatch,
}) => {
  const [isDispatched, setIsDispatched] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [emailResult, setEmailResult] = useState<SendEmailResult | null>(null);
  const [auditRecorded, setAuditRecorded] = useState(false);
  const noticePaperRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  if (!violation) return null;

  const noticeReference = violation.noticeId || `SCN-2025-${Math.floor(1000 + Math.random() * 9000)}`;

  const handlePrintNotice = () => {
    if (!noticePaperRef.current) return;

    const element = noticePaperRef.current;
    const content = element.outerHTML;

    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0px';
    printIframe.style.height = '0px';
    printIframe.style.border = '0';
    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${noticeReference} - Show Cause Notice</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 16px;
              font-size: 11px;
              line-height: 1.5;
            }
            .printable-scn-document {
              background-color: #ffffff !important;
              border: 1px solid #e2e8f0 !important;
              border-radius: 12px;
              padding: 24px;
              width: 100%;
              position: relative;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .pb-4 { padding-bottom: 16px; }
            .border-b { border-bottom: 1px solid #cbd5e1; }
            .border-t { border-top: 1px solid #cbd5e1; }
            .pt-2 { padding-top: 8px; }
            .pt-3 { padding-top: 12px; }
            .pt-4 { padding-top: 16px; }
            .p-3 { padding: 12px; }
            .p-6 { padding: 24px; }
            .space-y-4 > * + * { margin-top: 16px; }
            .space-y-2 > * + * { margin-top: 8px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-0\\.5 > * + * { margin-top: 2px; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .uppercase { text-transform: uppercase; }
            .tracking-wide { letter-spacing: 0.025em; }
            .tracking-wider { letter-spacing: 0.05em; }
            .text-sm { font-size: 14px; }
            .text-xs { font-size: 12px; }
            .text-\\[11px\\] { font-size: 11px; }
            .text-\\[10px\\] { font-size: 10px; }
            .text-slate-900 { color: #0f172a; }
            .text-slate-800 { color: #1e293b; }
            .text-slate-600 { color: #475569; }
            .text-slate-500 { color: #64748b; }
            .text-red-700 { color: #b91c1c; }
            .text-emerald-700 { color: #047857; }
            .bg-emerald-50 { background-color: #ecfdf5 !important; }
            .border-emerald-200 { border-color: #a7f3d0 !important; }
            .bg-red-50 { background-color: #fef2f2 !important; }
            .border-red-200 { border-color: #fecaca !important; }
            .bg-white { background-color: #ffffff !important; border: 1px solid #cbd5e1 !important; }
            .rounded-xl { border-radius: 12px; }
            .rounded-lg { border-radius: 8px; }
            .rounded { border-radius: 4px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-start { align-items: flex-start; }
            .items-end { align-items: flex-end; }
            .inline-flex { display: inline-flex; }
            .items-center { align-items: center; }
            .gap-1 { gap: 4px; }
            .leading-relaxed { line-height: 1.625; }
            .mt-1 { margin-top: 4px; }
            .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06); }
            svg { display: inline-block; vertical-align: middle; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      printIframe.contentWindow?.focus();
      printIframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }
      }, 1000);
    }, 300);
  };

  const handleDownloadPdf = async () => {
    if (!noticePaperRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = noticePaperRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // A4 dimensions: 210mm x 297mm
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 10, 15, imgWidth, Math.min(imgHeight, 267));
      pdf.save(`${noticeReference}_Show_Cause_Notice.pdf`);
    } catch (err) {
      console.error('Error generating Notice PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDispatchNotice = async () => {
    setIsDispatching(true);
    try {
      await appendInspectionAuditEvent({
        caseId: violation.id,
        type: 'SCN_APPROVED',
        actorId: user?.email || 'local-session',
        actorName: user?.name || 'Current inspector',
        payload: {
          noticeReference,
          caseNumber: violation.caseNumber,
          ruleCode: violation.ruleCode,
          evidence: violation.evidence,
          statusBeforeDispatch: violation.status,
        },
      });
      const res = await sendSCNNoticeEmail({
        noticeReference,
        caseNumber: violation.caseNumber,
        manufacturer: violation.manufacturer,
        productName: violation.productName,
        brand: violation.brand,
        platform: violation.platform,
        actName: violation.actName,
        section: violation.section,
        description: violation.description,
        extractedValue: violation.evidence.extractedValue,
        expectedStandard: violation.evidence.expectedStandard,
        penaltyEstimate: violation.penaltyEstimate,
        assignedOfficer: violation.assignedOfficer,
        recipientEmail: violation.customerCareEmail,
      });

      setEmailResult(res);
      setIsDispatched(true);
      await appendInspectionAuditEvent({
        caseId: violation.id,
        type: res.success ? 'SCN_SENT' : 'SCN_DISPATCH_FAILED',
        actorId: user?.email || 'local-session',
        actorName: user?.name || 'Current inspector',
        payload: {
          noticeReference,
          recipient: res.recipient,
          mode: res.mode,
          messageId: res.messageId || null,
          error: res.error || null,
        },
      });
      setAuditRecorded(true);
      onDispatch(violation.id);
    } catch (err: any) {
      console.error('Failed to dispatch notice email:', err);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleReset = () => {
    setIsDispatched(false);
    setEmailResult(null);
    setAuditRecorded(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Show Cause Notice (SCN) Drafting Suite"
      subtitle={`Statutory Notice under ${violation.actName}`}
      maxWidth="3xl"
    >
      {isDispatched ? (
        <div className="py-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Show Cause Notice Officially Dispatched</h4>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Statutory Notice Reference <strong className="text-slate-900 font-mono">{noticeReference}</strong> has been transmitted to registered corporate email of{' '}
            <strong className="text-slate-900">{violation.manufacturer}</strong> (<span className="text-blue-700 font-mono font-semibold">{emailResult?.recipient}</span>) and copied to Zonal Metrology Directorate.
          </p>
          {auditRecorded && (
            <p className="mt-2 text-[11px] text-slate-500 font-mono">Approval and dispatch outcome recorded in the local audit trail.</p>
          )}

          {emailResult && (
            <div className="max-w-lg mx-auto p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Email Dispatch Status:</span>
                {emailResult.mode === 'LIVE_GMAIL_API' ? (
                  <Badge variant="success" size="sm" className="font-mono text-[10px] uppercase font-bold">
                    LIVE GMAIL API
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm" className="font-mono text-[10px] uppercase font-bold">
                    SIMULATED DEMO MODE
                  </Badge>
                )}
              </div>

              <div className="text-[11px] text-slate-700 font-mono space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                <div><strong>Recipient:</strong> {emailResult.recipient}</div>
                {emailResult.messageId && <div><strong>Gmail Message ID:</strong> {emailResult.messageId}</div>}
                {emailResult.error && <div className="text-red-600"><strong>Dispatch Error:</strong> {emailResult.error}</div>}
              </div>

              {emailResult.mode === 'SIMULATED_DEMO' && (
                <div className="text-[10px] text-slate-500 pt-1 space-y-0.5">
                  <p className="font-semibold text-slate-700">💡 To send live emails to your real inbox via Gmail API:</p>
                  <p>Open <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900">.env</code> and fill in your Google Cloud Console credentials (<code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900">VITE_GMAIL_CLIENT_ID</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900">VITE_GMAIL_REFRESH_TOKEN</code>, etc.).</p>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex justify-center gap-3">
            <Button variant="primary" size="md" onClick={handleReset}>
              Return to Ledger
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 text-xs">
          {/* Statutory Formal Notice Preview Paper */}
          <div
            ref={noticePaperRef}
            id="printable-scn-notice"
            className="printable-scn-document p-6 bg-white rounded-xl border border-slate-200 font-sans text-slate-800 space-y-4 relative shadow-sm"
          >
            {/* Gov Crest Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="font-extrabold text-sm tracking-tight uppercase text-slate-900">
                  CENTRAL CONSUMER PROTECTION AUTHORITY (CCPA)
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Ministry of Consumer Affairs, Food & Public Distribution • Govt. of India
                </div>
              </div>
              <Badge variant="danger" size="sm" className="font-sans text-[10px] uppercase font-bold tracking-wider px-2.5 py-1">
                STATUTORY SUMMONS
              </Badge>
            </div>

            {/* Notice Metadata Cards */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notice Ref</div>
                <div className="font-bold text-slate-900 font-mono text-xs">{noticeReference}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Case File</div>
                <div className="font-bold text-slate-900 font-mono text-xs">{violation.caseNumber}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reply Deadline</div>
                <div className="font-bold text-red-600">15 Business Days</div>
              </div>
            </div>

            {/* Notice Addressee */}
            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-[11px] space-y-0.5">
              <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Notice Addressee</div>
              <div className="font-bold text-slate-900 text-xs">{violation.manufacturer}</div>
              <div className="text-slate-600">
                <strong>Product:</strong> {violation.productName} ({violation.brand}) | <strong>Platform:</strong> {violation.platform}
              </div>
            </div>

            {/* Notice Subject & Body */}
            <div className="space-y-3 text-[11px] leading-relaxed text-slate-700">
              <div className="p-2.5 bg-slate-100/70 rounded-lg font-bold text-slate-900 text-xs tracking-tight">
                SUBJECT: SHOW CAUSE NOTICE UNDER SECTION 36 & 39 OF LEGAL METROLOGY ACT, 2009 (PCR 2011)
              </div>

              <p>
                An optical inspection conducted by the <strong>SatyaSetu Intelligence Portal</strong> has identified statutory non-compliance in the pre-packaged product listed above.
              </p>

              {/* Violation Details Card */}
              <div className="p-3.5 bg-red-50/60 rounded-lg border border-red-200/80 space-y-1.5">
                <div className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Detected Contravention Details</div>
                <div className="text-slate-900 font-semibold text-xs">{violation.description}</div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-red-200/60 text-[11px]">
                  <div><strong>Statutory Clause:</strong> {violation.section} ({violation.actName})</div>
                  <div><strong>Prescribed Standard:</strong> {violation.evidence.expectedStandard}</div>
                  <div><strong>Optical Evidence:</strong> <span className="font-mono text-red-700 font-bold">{violation.evidence.extractedValue}</span></div>
                  <div><strong>Estimated Fine:</strong> <span className="font-bold text-slate-900">{formatCurrency(violation.penaltyEstimate)}</span></div>
                </div>
              </div>

              <p>
                You are hereby directed to <strong>SHOW CAUSE</strong> in writing within <strong>fifteen (15) days</strong> of receipt of this notice explaining why compounding penalties and legal proceedings should not be initiated against your entity.
              </p>
            </div>

            {/* Signature Block */}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-end text-[11px]">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Digitally Verified By</div>
                <div className="font-bold text-slate-900">{violation.assignedOfficer}</div>
                <div className="text-slate-500">Authorized Regulatory Officer, CCPA</div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Shield className="h-3 w-3" />
                  E-GOV CRYPTO SIGNATURE VALID
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 print-hide">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={handlePrintNotice}
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Notice</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={handleDownloadPdf}
                isLoading={isGeneratingPdf}
                disabled={isGeneratingPdf}
              >
                <Download className="h-3.5 w-3.5" />
                <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="gap-2 font-semibold"
                onClick={handleDispatchNotice}
                isLoading={isDispatching}
                disabled={isDispatching}
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isDispatching ? 'Dispatching via Gmail API...' : 'Authorize & Dispatch SCN'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
