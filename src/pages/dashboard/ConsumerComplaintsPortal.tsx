import React, { useState, useEffect } from 'react';
import {
  MessageSquareWarning,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  Send,
  ShieldCheck,
  Scale,
  FileSearch,
  UserCheck,
  Trash2,
  Loader2,
  Image as ImageIcon,
  FileCheck2,
  Languages,
  Wand2,
  MapPin,
  FileText,
  X as XIcon,
  Info,
  Store,
  Database,
  WifiOff,
  CheckCircle2,
  RefreshCw,
  Mail,
  Camera,
  Upload,
  Sparkles,
} from 'lucide-react';
import { useComplianceStore } from '../../store/complianceStore';
import {
  Complaint,
  OfficerActionType,
  EvidenceTag,
  SupportedLanguage,
  ShopLocation,
} from '../../types/compliance';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { buildEvidenceBackedComplaintCase } from '../../lib/complaintCaseCorrelator';
import { ProcessedEvidenceInput } from '../../lib/complaintOcrPipeline';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { transliterateText } from '../../lib/indicTransliteration';
import { cn } from '../../lib/utils';
import { ShopSearchInput } from '../../components/citizen/ShopSearchInput';
import { sendSurpriseInspectionNoticeEmail, SendEmailResult } from '../../services/gmailService';

export const ConsumerComplaintsPortal: React.FC = () => {
  const { user } = useAuthStore();
  const isConsumer = user?.role === 'consumer';
  const { language, setLanguage, t } = useLanguageStore();
  const { complaints, addFullComplaint, updateOfficerDecision, fetchComplaints, backendOnline, isLoadingComplaints } = useComplianceStore();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const isInspector = user?.role === 'inspector';
  const isAdmin = user?.role === 'admin';

  // Active Tab inside Case Dossier Modal
  const [dossierTab, setDossierTab] = useState<'correlation' | 'evidence' | 'rag' | 'audit'>('correlation');
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState<number>(0);
  const [showAnnotatedCopy, setShowAnnotatedCopy] = useState<boolean>(true);

  // Officer Action Form State
  const [officerActionType, setOfficerActionType] = useState<OfficerActionType>('ACCEPT_INVESTIGATION');
  const [officerNotes, setOfficerNotes] = useState('');
  const [assignedInspector, setAssignedInspector] = useState('Inspector Arjun Nair (Bengaluru City Zone 1)');
  const [inspectorEmail, setInspectorEmail] = useState('arjun.nair.inspect@satyadrishti.gov.in');
  const [sendEmailToInspector, setSendEmailToInspector] = useState(true);
  const [isDispatchingOfficerEmail, setIsDispatchingOfficerEmail] = useState(false);
  const [officerEmailResult, setOfficerEmailResult] = useState<SendEmailResult | null>(null);

  // New Grievance Form State
  const [newComplaintData, setNewComplaintData] = useState({
    consumerName: user?.name || 'Ananya Verma',
    consumerEmail: user?.email || 'consumer@demo.gov.in',
    productName: '',
    brand: '',
    platform: 'Direct' as string,
    productUrl: '',
    description: 'The pack received had a paper sticker placed over the printed MRP. The underlying printed MRP was ₹240 whereas the sticker altered it to ₹299, and the mandatory Unit Sale Price was missing.',
  });

  // Shop location selected via Google Maps Places Autocomplete
  const [shopLocation, setShopLocation] = useState<ShopLocation | null>(null);

  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; tag: EvidenceTag; previewUrl: string; isImage: boolean }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [submissionStatusText, setSubmissionStatusText] = useState('');

  const currentConsumerName = user?.name || 'Ananya Verma';
  const currentConsumerEmail = user?.email || 'consumer@demo.gov.in';

  useEffect(() => {
    if (user?.name || user?.email) {
      setNewComplaintData((prev) => ({
        ...prev,
        consumerName: user.name || prev.consumerName,
        consumerEmail: user.email || prev.consumerEmail,
      }));
    }
  }, [user]);

  // Role-based Grievance filtering:
  // - Consumer: shows personal grievances
  // - Inspector: shows ONLY cases assigned to this zonal inspector
  // - Admin / Supervisor: shows ALL assigned complaints across the country
  const displayedComplaints = complaints
    .map((c) =>
      isConsumer
        ? {
            ...c,
            consumerName: currentConsumerName,
            consumerEmail: currentConsumerEmail,
          }
        : c
    )
    .filter((c) => {
      if (isConsumer) return true;
      if (isAdmin) return true; // Supervisor / Admin sees ALL complaints
      if (isInspector) {
        // Inspector only sees cases assigned to him/her
        if (!c.assignedOfficer) return true;
        const inspectorName = (user?.name || 'Arjun Nair').toLowerCase();
        const assignedLower = c.assignedOfficer.toLowerCase();
        const firstName = inspectorName.split(' ')[0];
        return (
          assignedLower.includes(inspectorName) ||
          assignedLower.includes(firstName) ||
          assignedLower.includes('arjun')
        );
      }
      return true;
    });

  const statuses = [
    'All',
    'New',
    'Needs Review',
    'Triaged',
    'Investigation',
    'Notice Dispatched',
    'Assigned for Inspection',
    'More Info Requested',
    'Insufficient Evidence',
    'Rejected',
    'Resolved',
  ];

  const filteredComplaints = displayedComplaints.filter((c) => {
    const matchesSearch =
      c.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.consumerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.aiMatchedRule && c.aiMatchedRule.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedStatus === 'Needs Review') {
      return matchesSearch && c.needsReview;
    }

    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const existingCount = uploadedFiles.length;
    const newItems = files.map((file, idx) => {
      const pos = existingCount + idx;
      const isImage = file.type.startsWith('image/');
      return {
        file,
        tag: (pos === 0 ? 'Product Packaging' : pos === 1 ? 'Receipt / Invoice' : 'General Evidence') as EvidenceTag,
        previewUrl: isImage ? URL.createObjectURL(file) : '',
        isImage,
      };
    });
    setUploadedFiles((prev) => [...prev, ...newItems]);
    // Reset file input so same file can be re-added if removed
    e.target.value = '';
  };

  const handleRemoveFile = (idx: number) => {
    setUploadedFiles((prev) => {
      const copy = [...prev];
      if (copy[idx].previewUrl) URL.revokeObjectURL(copy[idx].previewUrl);
      copy.splice(idx, 1);
      // Re-tag remaining files
      return copy.map((f, i) => ({
        ...f,
        tag: (i === 0 ? 'Product Packaging' : i === 1 ? 'Receipt / Invoice' : 'General Evidence') as EvidenceTag,
      }));
    });
  };

  const handleTransliterate = () => {
    if (!newComplaintData.description) return;
    const converted = transliterateText(newComplaintData.description, language);
    setNewComplaintData((prev) => ({ ...prev, description: converted }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComplaintData.description.trim().length < 30) {
      alert('Please describe your issue in at least 30 characters.');
      return;
    }
    setIsSubmitting(true);
    setSubmissionProgress(10);
    setSubmissionStatusText(t('submittingBtn'));

    try {
      const evidenceInputs: ProcessedEvidenceInput[] = uploadedFiles.map((f) => ({
        fileOrUrl: f.file,
        fileName: f.file.name,
        tag: f.tag,
      }));

      const fullCase = await buildEvidenceBackedComplaintCase(
        {
          language,
          consumerName: newComplaintData.consumerName,
          consumerEmail: newComplaintData.consumerEmail,
          description: newComplaintData.description,
          evidenceInputs,
          shopLocation: shopLocation ?? undefined,
          productName: newComplaintData.productName || shopLocation?.name || 'Physical Retail Purchase',
          brand: newComplaintData.brand || undefined,
          platform: (newComplaintData.platform || 'Direct') as any,
          productUrl: newComplaintData.productUrl || undefined,
        },
        (pct, msg) => {
          setSubmissionProgress(pct);
          setSubmissionStatusText(msg);
        }
      );

      addFullComplaint(fullCase);
      setIsSubmitModalOpen(false);
      setUploadedFiles([]);
      setShopLocation(null);
      setNewComplaintData(prev => ({
        ...prev,
        productName: '',
        brand: '',
        platform: 'Direct',
        productUrl: '',
        description: '',
      }));
    } catch (err) {
      console.error('Failed to submit complaint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOfficerDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsDispatchingOfficerEmail(true);
    setOfficerEmailResult(null);

    const targetAssignedInspector = selectedComplaint.assignedOfficer || 'Inspector Arjun Nair (Bengaluru City Zone 1)';

    updateOfficerDecision(
      selectedComplaint.id,
      officerActionType,
      officerNotes || 'Action recorded by Government Reviewing Officer.',
      user?.name || 'Inspector Officer',
      targetAssignedInspector
    );

    if (sendEmailToInspector && (officerActionType === 'ACCEPT_INVESTIGATION' || officerActionType === 'RESOLVE')) {
      try {
        const res = await sendSurpriseInspectionNoticeEmail({
          factoryId: selectedComplaint.id,
          factoryName: selectedComplaint.brand || selectedComplaint.productName,
          registrationNumber: selectedComplaint.ticketId,
          location: selectedComplaint.shopLocation?.address || 'Retail Point of Sale',
          city: (selectedComplaint.shopLocation?.address || 'Bengaluru').split(',')[0] || 'Bengaluru',
          state: 'Karnataka',
          category: selectedComplaint.category || 'Consumer Packaging',
          overallScore: 25,
          complianceStatus: 'critical',
          activeAlerts: 1,
          openViolationsCount: 1,
          assignedOfficer: targetAssignedInspector,
          officerEmail: inspectorEmail,
          priority: 'Formal Metrology Investigation',
          directiveNotes: officerNotes || 'Verify retail declaration compliance and packaging against Legal Metrology Act 2009',
        });
        setOfficerEmailResult(res);
      } catch (emailErr) {
        console.error('Failed to send inspector directive email:', emailErr);
      }
    }

    setIsDispatchingOfficerEmail(false);

    // Refresh selected complaint in modal
    const updated = complaints.find((c) => c.id === selectedComplaint.id);
    if (updated) {
      setSelectedComplaint({
        ...updated,
        status: (selectedComplaint.status as any),
      });
    }
  };

  const needsReviewCount = complaints.filter((c) => c.needsReview).length;
  const inInvestigationCount = complaints.filter((c) => c.status === 'Investigation' || c.status === 'Notice Dispatched').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Multilingual Language Selector Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Languages className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>{t('selectLanguage')}:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { code: 'en', label: 'English' },
            { code: 'hi', label: 'हिन्दी' },
            { code: 'kn', label: 'ಕನ್ನಡ' },
            { code: 'ta', label: 'தமிழ்' },
          ].map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code as SupportedLanguage)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                language === lang.code
                  ? 'bg-blue-600 text-white shadow-sm font-bold ring-2 ring-blue-500/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className={`rounded-xl border p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-xs ${
        isConsumer
          ? 'bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 border-emerald-200 text-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 dark:border-emerald-800/60 dark:text-white'
          : isInspector
          ? 'bg-gradient-to-r from-amber-50 via-white to-amber-50/30 border-amber-200 text-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 dark:border-amber-800/60 dark:text-white'
          : 'bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white'
      }`}>
        <div className="space-y-2 lg:max-w-[70%]">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {isConsumer
              ? t('portalTitle')
              : isInspector
              ? 'Your Assigned Grievances & Field Docket'
              : 'National Grievance Adjudication & Dossier Stream'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {isConsumer
              ? t('portalSubtitle')
              : isInspector
              ? 'Review consumer packaging & pricing grievances routed to your jurisdiction for physical retail verification and evidence collection.'
              : 'Central CCPA Directorate console for triaging consumer complaints, validating evidence-backed OCR correlations, and dispatching statutory Section 36 Show Cause Notices.'}
          </p>
        </div>

        {!isInspector && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              className={`text-xs gap-1.5 font-semibold px-4 py-2.5 rounded-lg shadow-2xs ${
                isConsumer
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
              onClick={() => setIsSubmitModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>
                {isConsumer
                  ? t('lodgeGrievanceBtn')
                  : 'Ingest / Simulate Grievance Case'}
              </span>
            </Button>
          </div>
        )}
      </div>

      {/* Backend Connection & Fallback Indicator Strip */}
      {backendOnline === false && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 p-3.5 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0">
              <WifiOff className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold">Offline Fallback Mode Active:</span>
              <span className="ml-1 opacity-90">
                Backend database is currently unreachable. Displaying cached complaints. Any newly lodged grievances are queued locally.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchComplaints()}
            disabled={isLoadingComplaints}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-900 dark:text-white rounded-lg font-semibold text-xs shrink-0 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingComplaints ? 'animate-spin' : ''}`} />
            <span>{isLoadingComplaints ? 'Reconnecting...' : 'Retry Connection'}</span>
          </button>
        </div>
      )}

      {backendOnline === true && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/70 dark:bg-emerald-950/20 px-3.5 py-2 flex items-center justify-between gap-2 text-emerald-800 dark:text-emerald-300 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Database className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">Live Database Connected</span>
            <span className="text-[11px] opacity-75 hidden sm:inline"> -  Supabase PostgreSQL &amp; Persistent Evidence Storage Synced</span>
          </div>
          <button
            type="button"
            onClick={() => fetchComplaints()}
            disabled={isLoadingComplaints}
            title="Refresh database records"
            className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${isLoadingComplaints ? 'animate-spin' : ''}`} />
            <span>{isLoadingComplaints ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            {t('metricsTotalRegistered')}
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono my-1.5">
            {complaints.length}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t('metricsTotalSub')}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            {t('metricsUnderReview')}
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono my-1.5">
            {needsReviewCount}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t('metricsReviewSub')}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            {t('metricsActiveNotice')}
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono my-1.5">
            {inInvestigationCount}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t('metricsNoticeSub')}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            {t('metricsResolved')}
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono my-1.5">
            {resolvedCount}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t('metricsResolvedSub')}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8">
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4 text-slate-400" />}
              className="text-xs bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 dark:bg-slate-950/60 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
          <div className="md:col-span-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none font-medium dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200"
            >
              {statuses.map((st) => (
                <option key={st} value={st} className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {t('filterByStatus')}: {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100 dark:border-slate-800/80">
          {(isConsumer ? [
            { id: 'All', label: 'All My Complaints' },
            { id: 'Assigned for Inspection', label: 'Assigned for Inspection', icon: ShieldCheck, highlight: true },
            { id: 'Investigation', label: 'Under Investigation' },
            { id: 'Notice Dispatched', label: 'Notice Dispatched' },
            { id: 'Resolved', label: 'Resolved' },
          ] : [
            { id: 'All', label: 'All Grievances' },
            { id: 'Assigned for Inspection', label: 'Assigned for Inspection', icon: UserCheck, highlight: true },
            { id: 'Needs Review', label: 'Needs Review' },
            { id: 'Investigation', label: 'Investigation' },
            { id: 'Notice Dispatched', label: 'Notice Dispatched' },
            { id: 'Resolved', label: 'Resolved' },
          ]).map((tab) => {
            const count = tab.id === 'All'
              ? displayedComplaints.length
              : tab.id === 'Needs Review'
              ? displayedComplaints.filter((c) => c.needsReview).length
              : displayedComplaints.filter((c) => c.status === tab.id).length;

            const isActive = selectedStatus === tab.id;
            const IconComponent = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border',
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs dark:bg-blue-600 dark:border-blue-500 font-semibold'
                    : tab.highlight && count > 0
                    ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/80 hover:bg-blue-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800/60'
                )}
              >
                {IconComponent && <IconComponent className={cn("h-3.5 w-3.5", isActive ? "text-white" : "text-blue-500")} />}
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                    isActive
                      ? 'bg-white/20 text-white'
                      : tab.highlight && count > 0
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/80 dark:text-blue-100'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Complaints Ingestion Table */}
      <div className="rounded-xl border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {isConsumer
              ? `My Grievance Submissions (${filteredComplaints.length})`
              : isInspector
              ? `Your Assigned Grievances (${filteredComplaints.length})`
              : `Grievance Dossier Stream (${filteredComplaints.length})`}
          </h2>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {isConsumer
              ? 'Citizen Grievance Status & Resolution Ledger'
              : isInspector
              ? 'Your Assigned Field Inspection & Evidence Queue'
              : 'Government Officer Adjudication Queue'}
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
              {isConsumer ? (
                <tr>
                  <th className="px-4 py-3">Ticket ID &amp; Date</th>
                  <th className="px-3 py-3">Product / Store</th>
                  <th className="px-3 py-3">Grievance Category</th>
                  <th className="px-3 py-3">Complaint Status</th>
                  <th className="px-4 py-3 text-right">Track Progress</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-4 py-3">Ticket &amp; Complainant</th>
                  <th className="px-3 py-3">Product &amp; Store / Platform</th>
                  <th className="px-3 py-3">Classification &amp; Rule</th>
                  <th className="px-3 py-3">Discrepancy / Overcharge</th>
                  <th className="px-3 py-3">Assigned Officer / Inspector</th>
                  <th className="px-3 py-3">Officer Status</th>
                  <th className="px-4 py-3 text-right">Inspect Dossier</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredComplaints.map((cmp) => {
                const confScore = cmp.classificationResult?.confidenceScore || Math.round(cmp.sentimentScore * 100);
                const hasPriceAlteration = cmp.extractedEvidenceSummary?.priceOverchargeAmount;

                return (
                  <tr
                    key={cmp.id}
                    onClick={() => {
                      setSelectedComplaint(cmp);
                      setDossierTab('correlation');
                    }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    {isConsumer ? (
                      <>
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-blue-600 dark:text-blue-400 font-bold">{cmp.ticketId}</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{cmp.submittedAt}</div>
                        </td>

                        <td className="px-3 py-3.5 max-w-xs">
                          {cmp.shopLocation ? (
                            <>
                              <div className="font-medium text-slate-900 dark:text-slate-200 line-clamp-1 flex items-center gap-1">
                                <Store className="h-3 w-3 text-blue-500 shrink-0" />
                                {cmp.shopLocation.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono line-clamp-1">
                                {cmp.shopLocation.address.split(',').slice(0, 2).join(',')}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium text-slate-900 dark:text-slate-200 line-clamp-1">{cmp.productName}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                {cmp.brand} • {cmp.platform}
                              </div>
                            </>
                          )}
                        </td>

                        <td className="px-3 py-3.5 max-w-xs">
                          <div className="font-semibold text-slate-900 dark:text-slate-200 line-clamp-1">{cmp.category}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                            Rule: {cmp.aiMatchedRule}
                          </div>
                        </td>

                        <td className="px-3 py-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border',
                              cmp.status === 'Assigned for Inspection'
                                ? 'text-blue-700 bg-blue-50 border-blue-300 dark:text-blue-300 dark:bg-blue-950/60 dark:border-blue-800'
                                : cmp.status === 'Notice Dispatched' || cmp.status === 'Investigation'
                                ? 'text-purple-700 bg-purple-50 border-purple-300 dark:text-purple-300 dark:bg-purple-950/60 dark:border-purple-800'
                                : cmp.status === 'Resolved'
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800'
                                : cmp.status === 'Rejected'
                                ? 'text-rose-700 bg-rose-50 border-rose-300 dark:text-rose-300 dark:bg-rose-950/60 dark:border-rose-800'
                                : 'text-amber-700 bg-amber-50 border-amber-300 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-800'
                            )}
                          >
                            {cmp.status === 'New' ? 'Grievance Submitted' : cmp.status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-500 dark:hover:text-blue-300">
                            <span>Track Status</span>
                            <span className="text-sm leading-none">›</span>
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-blue-600 dark:text-blue-400 font-bold">{cmp.ticketId}</div>
                          <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{cmp.consumerName}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{cmp.submittedAt}</div>
                        </td>

                        <td className="px-3 py-3.5 max-w-xs">
                          {cmp.shopLocation ? (
                            <>
                              <div className="font-medium text-slate-700 dark:text-slate-200 line-clamp-1 flex items-center gap-1">
                                <Store className="h-3 w-3 text-blue-400 shrink-0" />
                                {cmp.shopLocation.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono line-clamp-1">
                                {cmp.shopLocation.address.split(',').slice(0, 2).join(',')}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium text-slate-700 dark:text-slate-200 line-clamp-1">{cmp.productName}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                {cmp.brand} • {cmp.platform}
                              </div>
                            </>
                          )}
                        </td>

                        <td className="px-3 py-3.5 max-w-xs">
                          <div className="font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">{cmp.category}</div>
                          <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px]">
                            <span className="text-slate-400 dark:text-slate-500">Confidence:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{confScore}%</span>
                            {cmp.needsReview && (
                              <span className="text-amber-400 font-medium ml-1">
                                Needs Review
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3.5">
                          {hasPriceAlteration ? (
                            <div className="font-mono">
                              <div className="text-rose-500 dark:text-rose-400 font-semibold text-xs">
                                +₹{hasPriceAlteration} Alteration Variance
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                                Base: {cmp.extractedEvidenceSummary?.declaredMrp} | Altered: {cmp.extractedEvidenceSummary?.receiptPrice}
                              </div>
                            </div>
                          ) : (
                            <div className="font-mono text-slate-500 dark:text-slate-400">
                              <div className="text-slate-500 text-xs mb-0.5">–</div>
                              <div className="text-[11px]">
                                {cmp.evidenceImages?.length || 1} Evidence Image(s)
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Assigned Inspector Column */}
                        <td className="px-3 py-3.5 max-w-xs">
                          {cmp.assignedOfficer ? (
                            <div>
                              <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300 font-semibold text-xs">
                                <UserCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <span className="line-clamp-1" title={cmp.assignedOfficer}>
                                  {cmp.assignedOfficer}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5">
                                {cmp.status === 'Assigned for Inspection' ? '🔍 Zonal Inspection Active' : 'Adjudication Officer'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic font-mono">Pending Assignment</span>
                          )}
                        </td>

                        <td className="px-3 py-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider',
                              cmp.status === 'Assigned for Inspection'
                                ? 'text-blue-700 bg-blue-50 border border-blue-300 dark:text-blue-300 dark:bg-blue-950/60 dark:border-blue-800'
                                : cmp.status === 'New' || cmp.needsReview
                                ? 'text-amber-600 bg-amber-50 border border-amber-300 dark:text-amber-400 dark:bg-amber-950/60 dark:border-amber-800/60'
                                : cmp.status === 'Resolved'
                                ? 'text-emerald-700 bg-emerald-50 border border-emerald-300 dark:text-emerald-400 dark:bg-emerald-950/60 dark:border-emerald-800/60'
                                : 'text-slate-600 bg-slate-50 border border-slate-300 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700/80'
                            )}
                          >
                            {cmp.status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-500 dark:hover:text-blue-300">
                            <span>Inspect Case</span>
                            <span className="text-sm leading-none">›</span>
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Grievance Cards View */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredComplaints.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No grievances found matching the criteria.
            </div>
          ) : (
            filteredComplaints.map((cmp) => {
              const confScore = cmp.classificationResult?.confidenceScore || Math.round(cmp.sentimentScore * 100);
              const hasPriceAlteration = cmp.extractedEvidenceSummary?.priceOverchargeAmount;

              return (
                <div
                  key={cmp.id}
                  onClick={() => {
                    setSelectedComplaint(cmp);
                    setDossierTab('correlation');
                  }}
                  className="p-4 space-y-3 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  {/* Card Header: Ticket ID & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {cmp.ticketId}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider',
                        cmp.status === 'New' || cmp.needsReview
                          ? 'text-amber-600 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800/60'
                          : 'text-slate-600 bg-slate-100 border border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700'
                      )}
                    >
                      {cmp.status}
                    </span>
                  </div>

                  {/* Complainant & Product/Store */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {cmp.consumerName}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {cmp.submittedAt}
                      </span>
                    </div>

                    {cmp.shopLocation ? (
                      <div className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1">
                        <Store className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{cmp.shopLocation.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{cmp.shopLocation.address}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-medium text-slate-900 dark:text-white">{cmp.productName}</span>
                        <span className="text-slate-400 text-[11px] ml-1">({cmp.brand} • {cmp.platform})</span>
                      </div>
                    )}
                  </div>

                  {/* Discrepancy & Confidence */}
                  <div className="bg-slate-50 dark:bg-slate-950/60 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800/60 space-y-1 text-xs">
                    {hasPriceAlteration ? (
                      <div className="font-mono text-rose-500 font-semibold text-xs">
                        +₹{hasPriceAlteration} Price Alteration Discrepancy
                      </div>
                    ) : (
                      <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                        {cmp.evidenceImages?.length || 1} Physical Evidence File(s)
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-0.5">
                      <span className="truncate max-w-[180px]">{cmp.category}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Conf: {confScore}%</span>
                    </div>
                  </div>

                  {/* Assigned Inspector row (Admin / Inspector Only) */}
                  {!isConsumer && (
                    <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase">Assigned Officer:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 text-[11px] truncate">
                        <UserCheck className="h-3 w-3 shrink-0" />
                        {cmp.assignedOfficer || 'Pending Assignment'}
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    className="w-full min-h-[44px] text-xs font-semibold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 justify-center gap-1.5"
                  >
                    <span>{isConsumer ? 'Track Complaint Progress' : 'Inspect Officer Dossier'}</span>
                    <span className="text-sm leading-none">›</span>
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Comprehensive Government Officer Case Dossier Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={isConsumer ? `Track Grievance Status: ${selectedComplaint.ticketId}` : `Government Officer Review Dossier: ${selectedComplaint.ticketId}`}
          subtitle={isConsumer ? `Grievance lodged on ${selectedComplaint.submittedAt}` : `Case Dossier lodged by ${selectedComplaint.consumerName} (${selectedComplaint.consumerEmail})`}
          maxWidth="4xl"
        >
          <div className="space-y-4 text-xs">
            {/* Top Overview Strip */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 p-3.5 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="sm:pr-3 sm:border-r border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-mono uppercase tracking-wider block">
                  {selectedComplaint.shopLocation ? 'Shop / Store' : 'Product Title'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white line-clamp-1 mt-0.5 text-xs flex items-center gap-1">
                  {selectedComplaint.shopLocation ? (
                    <><Store className="h-3 w-3 text-blue-600 dark:text-blue-400 shrink-0" />{selectedComplaint.shopLocation.name}</>
                  ) : selectedComplaint.productName}
                </span>
                {selectedComplaint.shopLocation && (
                  <a
                    href={selectedComplaint.shopLocation.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline mt-0.5 block font-mono"
                  >
                    📍 View on Maps
                  </a>
                )}
              </div>
              <div className="sm:px-3 sm:border-r border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-mono uppercase tracking-wider block">
                  {selectedComplaint.shopLocation ? 'Shop Address' : 'Brand & Platform'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white mt-0.5 text-xs block leading-tight line-clamp-2">
                  {selectedComplaint.shopLocation
                    ? selectedComplaint.shopLocation.address
                    : `${selectedComplaint.brand} (${selectedComplaint.platform})`
                  }
                </span>
              </div>
              <div className="sm:px-3 sm:border-r border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-mono uppercase tracking-wider block">
                  Current Status
                </span>
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider mt-1 bg-transparent',
                    selectedComplaint.status === 'New' || selectedComplaint.needsReview
                      ? 'text-amber-700 border border-amber-300 bg-amber-50 dark:bg-transparent dark:text-amber-400 dark:border-amber-800/60'
                      : selectedComplaint.status === 'Resolved'
                      ? 'text-emerald-700 border border-emerald-300 bg-emerald-50 dark:bg-transparent dark:text-emerald-400 dark:border-emerald-800/60'
                      : 'text-slate-700 border border-slate-300 bg-slate-100 dark:bg-transparent dark:text-slate-300 dark:border-slate-700/80'
                  )}
                >
                  {selectedComplaint.status}
                </span>
              </div>
              <div className="sm:pl-3">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-mono uppercase tracking-wider block">
                  {isConsumer ? 'Enforcement Cell' : 'Assigned Officer'}
                </span>
                <span
                  className="font-bold text-blue-600 dark:text-blue-400 mt-0.5 text-xs block truncate"
                  title={isConsumer ? 'Legal Metrology Directorate' : (selectedComplaint.assignedOfficer || 'Pending Assignment')}
                >
                  {isConsumer ? 'Legal Metrology Directorate' : (selectedComplaint.assignedOfficer || 'Pending Assignment')}
                </span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 sm:gap-6 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setDossierTab('correlation')}
                className={cn(
                  'pb-2.5 pt-1 text-xs inline-flex items-center gap-1.5 whitespace-nowrap -mb-px border-b-2 font-medium transition-colors',
                  dossierTab === 'correlation'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-white font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                <Scale className={cn('h-3.5 w-3.5', dossierTab === 'correlation' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500')} />
                <span>4-Way Case Correlation</span>
              </button>

              <button
                onClick={() => setDossierTab('evidence')}
                className={cn(
                  'pb-2.5 pt-1 text-xs inline-flex items-center gap-1.5 whitespace-nowrap -mb-px border-b-2 font-medium transition-colors',
                  dossierTab === 'evidence'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-white font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                <ImageIcon className={cn('h-3.5 w-3.5', dossierTab === 'evidence' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500')} />
                <span>Evidence &amp; OCR Image Inspector ({selectedComplaint.evidenceImages?.length || 1})</span>
              </button>

              <button
                onClick={() => setDossierTab('rag')}
                className={cn(
                  'pb-2.5 pt-1 text-xs inline-flex items-center gap-1.5 whitespace-nowrap -mb-px border-b-2 font-medium transition-colors',
                  dossierTab === 'rag'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-white font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                <FileSearch className={cn('h-3.5 w-3.5', dossierTab === 'rag' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500')} />
                <span>Regulatory RAG Provenance</span>
              </button>



              <button
                onClick={() => setDossierTab('audit')}
                className={cn(
                  'pb-2.5 pt-1 text-xs inline-flex items-center gap-1.5 whitespace-nowrap -mb-px border-b-2 font-medium transition-colors',
                  dossierTab === 'audit'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-white font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                <Clock className={cn('h-3.5 w-3.5', dossierTab === 'audit' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500')} />
                <span>{isConsumer ? 'Official Case Timeline' : 'Audit Timeline'} ({selectedComplaint.officerDecisionHistory?.length || 0})</span>
              </button>
            </div>

            {/* TAB 1: 4-WAY CASE CORRELATION */}
            {dossierTab === 'correlation' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Section 1: Complainant Statement */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 p-4 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold uppercase text-[11px] font-mono tracking-wider">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <span>1. Complainant Free-Text Allegation</span>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800 uppercase">
                        Language: {selectedComplaint.language ? selectedComplaint.language.toUpperCase() : 'EN'}
                      </Badge>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 text-xs leading-relaxed italic shadow-xs">
                      "{selectedComplaint.description}"
                    </div>
                  </div>

                  {/* Section 2: Deterministic OCR Extraction */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 p-4 space-y-2.5 shadow-xs">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold uppercase text-[11px] font-mono tracking-wider">
                      <FileCheck2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>2. OCR &amp; Evidence Extraction Finding</span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-1.5 font-mono text-xs text-slate-700 dark:text-slate-300 shadow-xs">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400 font-sans">Packaging MRP:</span>
                        <strong className="text-slate-900 dark:text-white">
                          {selectedComplaint.extractedEvidenceSummary?.declaredMrp || 'Extracted from OCR'}
                        </strong>
                      </div>
                      {selectedComplaint.extractedEvidenceSummary?.receiptPrice && (
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Receipt Store Price:</span>
                          <strong className="text-slate-900 dark:text-white">
                            {selectedComplaint.extractedEvidenceSummary.receiptPrice}
                          </strong>
                        </div>
                      )}
                      {selectedComplaint.extractedEvidenceSummary?.priceOverchargeAmount && (
                        <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800">
                          <div className="text-rose-600 dark:text-rose-400 font-bold text-xs">
                            +₹{selectedComplaint.extractedEvidenceSummary.priceOverchargeAmount} Overcharge
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Pkg ₹{selectedComplaint.extractedEvidenceSummary?.declaredMrp} vs Bill ₹{selectedComplaint.extractedEvidenceSummary?.receiptPrice}
                          </div>
                        </div>
                      )}
                      <div className="pt-1 border-t border-slate-200 dark:border-slate-800/80 flex items-baseline justify-between gap-2 text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 font-sans">Manufacturer:</span>
                        <strong
                          className="text-slate-800 dark:text-slate-200 truncate"
                          title={selectedComplaint.extractedEvidenceSummary?.manufacturer || 'Detected on label'}
                        >
                          {selectedComplaint.extractedEvidenceSummary?.manufacturer || 'Detected on label'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Regulatory RAG Context */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 p-4 space-y-2.5 shadow-xs">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold uppercase text-[11px] font-mono tracking-wider">
                      <Scale className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>3. Regulatory RAG Mapped Context</span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-2 text-xs shadow-xs">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {selectedComplaint.aiMatchedRule}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 italic leading-relaxed">
                        "{selectedComplaint.regulatoryMappingResult?.matchedRules?.[0]?.verbatimClause ||
                          'Rule mandates accurate statutory declaration and prohibits selling above MRP.'}"
                      </div>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono block pt-1 border-t border-slate-200 dark:border-slate-800">
                        Active Rule Version: #{selectedComplaint.regulatoryMappingResult?.matchedRules?.[0]?.activeVersion || 1}
                      </span>
                    </div>
                  </div>

                  {/* Section 4: Verification Status */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 p-4 space-y-2.5 shadow-xs">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[11px] font-mono tracking-wider">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>4. Human Officer Verification Status</span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-1.5 text-xs shadow-xs">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>
                          {selectedComplaint.caseCorrelationSummary?.verificationStatus || selectedComplaint.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Automated systems provide OCR evidence &amp; regulatory context. Final legal determination requires officer decision.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Packaging Label Discrepancies Discovered by Scanner */}
                {selectedComplaint.scannerDetectedDiscrepancies && selectedComplaint.scannerDetectedDiscrepancies.length > 0 && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                        Additional Label Discrepancies Discovered by Scanner ({selectedComplaint.scannerDetectedDiscrepancies.length} Unseen Issues)
                      </h4>
                      <span className="text-[10px] font-mono text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                        RAG Mapped
                      </span>
                    </div>

                    <div className="space-y-2">
                      {selectedComplaint.scannerDetectedDiscrepancies.map((disc, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-xs space-y-1 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white">{disc.ruleName}</span>
                            <span className="font-mono text-blue-600 dark:text-blue-400 text-[10px]">{disc.ruleCode}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-[11px]">{disc.ruleDescription}</p>
                          <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 border-t border-slate-200 dark:border-slate-800 font-mono">
                            <span>OCR Evidence: <strong className="text-slate-800 dark:text-slate-300">{disc.evidence}</strong></span>
                            <span>RAG Section: <strong className="text-slate-800 dark:text-slate-300">{disc.ragMapping?.section || 'Legal Metrology Rules'}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: EVIDENCE & OCR IMAGE INSPECTOR */}
            {dossierTab === 'evidence' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  {/* Image Selectors */}
                  <div className="flex gap-2">
                    {(selectedComplaint.evidenceImages || []).map((img, idx) => (
                      <button
                        key={img.id || idx}
                        onClick={() => setSelectedEvidenceIndex(idx)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                          selectedEvidenceIndex === idx
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-850 dark:hover:text-white'
                        )}
                      >
                        Evidence #{idx + 1}: {img.tag}
                      </button>
                    ))}
                    {(!selectedComplaint.evidenceImages || selectedComplaint.evidenceImages.length === 0) && (
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Packaging Evidence Image</span>
                    )}
                  </div>

                  {/* Toggle Bounding Box Overlay */}
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">View Mode:</span>
                    <button
                      onClick={() => setShowAnnotatedCopy(!showAnnotatedCopy)}
                      className={cn(
                        'px-2.5 py-1 rounded border font-semibold text-[10px] transition-colors',
                        showAnnotatedCopy
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60'
                          : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:text-slate-200'
                      )}
                    >
                      {showAnnotatedCopy ? '✓ Annotated Copy (Bounding Boxes)' : 'Original Clean Image'}
                    </button>
                  </div>
                </div>

                {/* Evidence Image Viewer */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-7 bg-slate-100 dark:bg-slate-950 rounded-xl p-3 flex items-center justify-center min-h-[300px] border border-slate-200 dark:border-slate-800">
                    {selectedComplaint.evidenceImages?.[selectedEvidenceIndex] ? (
                      <img
                        src={
                          showAnnotatedCopy
                            ? selectedComplaint.evidenceImages[selectedEvidenceIndex].annotatedUrl ||
                              selectedComplaint.evidenceImages[selectedEvidenceIndex].originalUrl
                            : selectedComplaint.evidenceImages[selectedEvidenceIndex].originalUrl
                        }
                        alt="Evidence"
                        className="max-h-[380px] w-auto object-contain rounded border border-slate-200 dark:border-slate-800 shadow-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500 py-10">
                        <svg className="h-12 w-12 text-slate-300 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-600">No evidence images uploaded</p>
                      </div>
                    )}
                  </div>

                  {/* OCR Extractions List */}
                  <div className="md:col-span-5 space-y-3 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-slate-800 dark:text-slate-300 text-xs uppercase tracking-wider font-mono">
                      Extracted Statutory Parameters
                    </h4>

                    <div className="space-y-2 text-[11px] font-mono">
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Declared Packaging MRP</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {selectedComplaint.extractedEvidenceSummary?.declaredMrp || '₹3,499.00'}
                        </span>
                      </div>

                      {selectedComplaint.extractedEvidenceSummary?.receiptPrice && (
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Altered / Secondary Sticker Price</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {selectedComplaint.extractedEvidenceSummary.receiptPrice}
                          </span>
                        </div>
                      )}

                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Net Quantity</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {selectedComplaint.extractedEvidenceSummary?.netQuantity || '2 kg'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Manufacturer Address</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 text-[10px] leading-tight block mt-0.5">
                          {selectedComplaint.extractedEvidenceSummary?.manufacturer || 'NutriPro Labs Pvt Ltd'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: REGULATORY RAG PROVENANCE */}
            {dossierTab === 'rag' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] block font-mono">
                    Regulatory RAG Engine &amp; Rule Versioning Provenance
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Active statutory rules retrieved via SatyaDrishti Regulatory RAG. All rule versions are resolved against active gazette notifications.
                  </p>
                </div>

                <div className="space-y-3">
                  {(selectedComplaint.regulatoryMappingResult?.matchedRules || []).map((rule, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">{rule.ruleCode}</span>
                        <span className="font-mono text-[10px] text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/60">
                          Active Rule Version #{rule.activeVersion}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">{rule.title}</h4>
                      <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{rule.section}</div>

                      <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 italic shadow-xs">
                        "{rule.verbatimClause}"
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <div>Gazette: <strong className="text-slate-800 dark:text-slate-200">{rule.officialGazetteRef}</strong></div>
                        <div>Effective Date: <strong className="text-slate-800 dark:text-slate-200">{rule.effectiveDate}</strong></div>
                        <div>Max Penalty: <strong className="text-slate-800 dark:text-slate-200">₹{rule.penalties.maxFine.toLocaleString()}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}



            {/* TAB 5: AUDIT TIMELINE */}
            {dossierTab === 'audit' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider font-mono">
                  Timestamped Officer Decision Audit History
                </h4>

                <div className="space-y-2">
                  {(selectedComplaint.officerDecisionHistory || []).map((rec) => (
                    <div key={rec.id} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1 font-mono">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-bold text-blue-600 dark:text-blue-400">{rec.actionLabel}</span>
                        <span className="text-slate-500">{rec.timestamp}</span>
                      </div>
                      <div className="text-slate-900 dark:text-slate-200 font-semibold">{rec.officerName}</div>
                      <p className="text-slate-600 dark:text-slate-400 font-sans text-xs italic">"{rec.notes}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* New Grievance Submission Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={t('newGrievanceTitle')}
        subtitle={t('newGrievanceSubtitle')}
        maxWidth="2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-5 text-xs">

          {/* ── Step 1: Consumer Identity ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Identity</span>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <Input
                label={t('consumerNameLabel')}
                value={newComplaintData.consumerName}
                onChange={(e) => setNewComplaintData({ ...newComplaintData, consumerName: e.target.value })}
                required
              />
              <Input
                label={t('emailLabel')}
                type="email"
                value={newComplaintData.consumerEmail}
                onChange={(e) => setNewComplaintData({ ...newComplaintData, consumerEmail: e.target.value })}
                required
              />
            </div>
          </div>

          {/* ── Step 2: Shop / Store Location (Google Maps) ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Shop / Store Where You Purchased</span>
            </div>
            <ShopSearchInput
              value={shopLocation}
              onChange={setShopLocation}
            />
            {!shopLocation && (
              <div className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <Info className="h-3 w-3 mt-0.5 shrink-0 text-blue-400" />
                <span>Search for the physical shop/store where you purchased the product. This helps the inspector locate the shop for on-site verification.</span>
              </div>
            )}
          </div>

          {/* ── Step 3: Product Details ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">3</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product Details</span>
            </div>
            <div className="grid grid-cols-2 gap-3.5 mb-3.5">
              <Input
                label="Product Title"
                placeholder="e.g. NutriPro Whey Protein 1kg"
                value={newComplaintData.productName}
                onChange={(e) => setNewComplaintData({ ...newComplaintData, productName: e.target.value })}
              />
              <Input
                label="Brand / Manufacturer"
                placeholder="e.g. NutriPro Labs"
                value={newComplaintData.brand}
                onChange={(e) => setNewComplaintData({ ...newComplaintData, brand: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  E-Commerce Platform
                </label>
                <select
                  value={newComplaintData.platform}
                  onChange={(e) => setNewComplaintData({ ...newComplaintData, platform: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none font-medium"
                >
                  <option value="Direct">Direct / In-Store</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Flipkart">Flipkart</option>
                  <option value="Blinkit">Blinkit</option>
                  <option value="Zepto">Zepto</option>
                  <option value="Meesho">Meesho</option>
                  <option value="Nykaa">Nykaa</option>
                  <option value="BigBasket">BigBasket</option>
                </select>
              </div>
              <Input
                label="Product Listing URL"
                placeholder="https://amazon.in/dp/... (optional)"
                value={newComplaintData.productUrl}
                onChange={(e) => setNewComplaintData({ ...newComplaintData, productUrl: e.target.value })}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">4</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Describe Your Grievance</span>
              <span className="text-rose-500 text-xs font-bold ml-0.5">*</span>
              {language !== 'en' && (
                <button
                  type="button"
                  onClick={handleTransliterate}
                  className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 dark:text-blue-400 px-2 py-0.5 rounded transition-colors"
                >
                  <Wand2 className="h-3 w-3" />
                  <span>{t('transliterateBtn')}</span>
                </button>
              )}
            </div>
            <textarea
              rows={7}
              value={newComplaintData.description}
              onChange={(e) => setNewComplaintData({ ...newComplaintData, description: e.target.value })}
              placeholder={`Describe your packaging or statutory issue in detail. For example:
• A dual price sticker was pasted over the original printed MRP on the package.
• The mandatory Unit Sale Price (₹ per g or ₹ per ml) is missing from the label.
• The manufacturing or packaging date is missing, smudged, or in non-standard format.
• The net quantity declared on the packaging does not match the actual contents.
• The manufacturer/packer name or complete postal address with PIN code is missing.
• The product packaging appeared tampered, re-sealed, or re-labelled.`}
              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all resize-none"
              required
              minLength={30}
            />
            <div className="mt-1.5 flex items-center justify-between">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {t('transliterationHelp')}
              </div>
              <div className={`text-[10px] font-mono font-semibold ${
                newComplaintData.description.length < 30
                  ? 'text-rose-400'
                  : newComplaintData.description.length < 100
                  ? 'text-amber-500'
                  : 'text-emerald-500'
              }`}>
                {newComplaintData.description.length} chars
                {newComplaintData.description.length < 30 && ` (min 30)`}
              </div>
            </div>
          </div>

          {/* ── Step 5: Evidence Upload ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">5</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('evidenceHeader')}</span>
            </div>

            {/* Evidence acquisition options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center justify-center gap-2.5 p-3.5 border-2 border-dashed border-blue-300 dark:border-blue-700/60 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50/30 dark:bg-blue-950/10">
                <Camera className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="text-left">
                  <div>Take Photo (Back Camera)</div>
                  <div className="text-[10px] font-normal text-slate-400">Snap product or receipt directly</div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <label className="flex items-center justify-center gap-2.5 p-3.5 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/40 dark:bg-slate-900/40">
                <Upload className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                <div className="text-left">
                  <div>Browse Files</div>
                  <div className="text-[10px] font-normal text-slate-400">JPG, PNG, PDF supported</div>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* File list with thumbnails */}
            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    {/* Thumbnail or icon */}
                    {f.isImage && f.previewUrl ? (
                      <img
                        src={f.previewUrl}
                        alt={f.file.name}
                        className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-amber-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-700 dark:text-slate-200 text-xs truncate">{f.file.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/60">
                          {f.tag}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {(f.file.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(i)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                      aria-label="Remove file"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Processing Notice */}
          <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/20 flex items-start gap-2.5">
            <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px]">✨</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">AI-Assisted Complaint Processing</p>
              <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-0.5 leading-relaxed">
                On submission, your grievance will be automatically classified, severity assessed, OCR-extracted from evidence images, matched to regulatory rules (CCPA / Legal Metrology Act), and an inspector-ready dossier will be generated.
              </p>
            </div>
          </div>

          {isSubmitting && (
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-800 text-xs font-mono text-blue-800 dark:text-blue-300">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="font-semibold">{submissionStatusText}</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900/60 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${submissionProgress}%` }}
                />
              </div>
              <div className="text-right text-[10px] mt-1 text-blue-500">{submissionProgress}%</div>
            </div>
          )}

          <div className="sticky bottom-0 -mx-3 sm:-mx-6 -mb-3 sm:-mb-6 p-3 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="w-full sm:w-auto justify-center min-h-[40px]"
            >
              {t('cancelBtn')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSubmitting || newComplaintData.description.trim().length < 30}
              className={`w-full sm:w-auto justify-center min-h-[40px] gap-1.5 text-white font-semibold ${
                isSubmitting || newComplaintData.description.trim().length < 30
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              <Send className="h-3.5 w-3.5 shrink-0" />
              <span>{isSubmitting ? 'Processing...' : t('submitComplaintBtn')}</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
