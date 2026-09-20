import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Product, PlatformType, EvidenceTag, Complaint, SupportedLanguage } from '../../types/compliance';
import { useComplianceStore } from '../../store/complianceStore';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { transliterateText } from '../../lib/indicTransliteration';
import { buildEvidenceBackedComplaintCase } from '../../lib/complaintCaseCorrelator';
import { ProcessedEvidenceInput } from '../../lib/complaintOcrPipeline';
import {
  Send,
  Upload,
  Camera,
  CheckCircle2,
  Sparkles,
  Trash2,
  Link2,
  Languages,
  Wand2,
} from 'lucide-react';

interface PublicComplaintModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PublicComplaintModal: React.FC<PublicComplaintModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { user } = useAuthStore();
  const { addFullComplaint } = useComplianceStore();
  const { language, setLanguage, t } = useLanguageStore();

  const [formData, setFormData] = useState({
    consumerName: user?.name || 'Ananya Verma',
    consumerEmail: user?.email || 'consumer@demo.gov.in',
    consumerPhone: '+91 98200 12345',
    productName: '',
    brand: '',
    platform: 'Amazon' as PlatformType,
    productUrl: '',
    orderNumber: 'OD-2026-CITIZEN-001',
    description: '',
  });

  const [uploadedEvidence, setUploadedEvidence] = useState<{
    file: File;
    previewUrl: string;
    tag: EvidenceTag;
  }[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatusText, setProcessingStatusText] = useState('');

  const [isSuccess, setIsSuccess] = useState(false);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    if (product) {
      setFormData((prev) => ({
        ...prev,
        consumerName: user?.name || prev.consumerName,
        consumerEmail: user?.email || prev.consumerEmail,
        productName: product.title,
        brand: product.brand,
        platform: product.platform,
        productUrl: product.productUrl || '',
        description: `Discrepancy noticed on ${product.title} (MRP: ₹${product.mrp}, Net Qty: ${product.netWeight}, Manufacturer: ${product.manufacturer || 'N/A'}): Printed MRP vs store invoice discrepancy.`,
      }));
    }
  }, [product, user]);

  if (!product) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const newItems = files.map((file, idx) => {
      const defaultTag: EvidenceTag =
        idx === 0
          ? 'Product Packaging'
          : idx === 1
          ? 'Receipt / Invoice'
          : 'Product Label / PDP';

      return {
        file,
        previewUrl: URL.createObjectURL(file),
        tag: defaultTag,
      };
    });

    setUploadedEvidence((prev) => [...prev, ...newItems]);
  };

  const removeEvidence = (index: number) => {
    setUploadedEvidence((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEvidenceTag = (index: number, newTag: EvidenceTag) => {
    setUploadedEvidence((prev) =>
      prev.map((item, i) => (i === index ? { ...item, tag: newTag } : item))
    );
  };

  const handleTransliterate = () => {
    if (!formData.description) return;
    const converted = transliterateText(formData.description, language);
    setFormData((prev) => ({ ...prev, description: converted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setProcessingProgress(5);
    setProcessingStatusText(t('submittingBtn'));

    try {
      const evidenceInputs: ProcessedEvidenceInput[] = uploadedEvidence.map((item) => ({
        fileOrUrl: item.file,
        fileName: item.file.name,
        tag: item.tag,
      }));

      // Fallback if no file uploaded: use product image as packaging evidence
      if (evidenceInputs.length === 0 && product.imageUrl) {
        evidenceInputs.push({
          fileOrUrl: product.imageUrl,
          fileName: 'product_catalog_image.jpg',
          tag: 'Product Packaging',
        });
      }

      const complaintDossier = await buildEvidenceBackedComplaintCase(
        {
          language,
          consumerName: formData.consumerName,
          consumerEmail: formData.consumerEmail,
          consumerPhone: formData.consumerPhone,
          productName: product.title,
          brand: product.brand,
          platform: product.platform,
          productUrl: formData.productUrl || product.productUrl,
          orderNumber: formData.orderNumber,
          description: formData.description,
          evidenceInputs,
        },
        (progressPercent, statusMsg) => {
          setProcessingProgress(progressPercent);
          setProcessingStatusText(statusMsg);
        }
      );

      addFullComplaint(complaintDossier);
      setCreatedComplaint(complaintDossier);
      setIsSuccess(true);
    } catch (err) {
      console.error('Complaint processing failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setIsProcessing(false);
    setCreatedComplaint(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('newGrievanceTitle')}
      subtitle={t('newGrievanceSubtitle')}
      maxWidth="2xl"
    >
      {/* Language Selector Toolbar */}
      <div className="flex items-center justify-between p-2.5 mb-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-semibold text-slate-700">{t('selectLanguage')}:</span>
        </div>
        <div className="flex items-center gap-1">
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
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                language === lang.code
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {isProcessing ? (
        <div className="py-12 px-4 text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-blue-600">
              <Sparkles className="h-8 w-8 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900">
              {t('submittingBtn')}
            </h3>
            <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
              {processingStatusText}
            </p>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 max-w-md mx-auto overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${processingProgress}%` }}
            />
          </div>
        </div>
      ) : isSuccess && createdComplaint ? (
        <div className="py-6 px-2 text-center space-y-5">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">{t('consumerVerdictSubmitted')}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {t('consumerVerdictPotentialIssue')}
            </p>
          </div>

          {/* Docket Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-md mx-auto text-left space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Docket Number</span>
              <span className="font-mono font-bold text-blue-700">{createdComplaint.ticketId}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Submitted Language</span>
                <span className="font-bold text-slate-900 uppercase">{createdComplaint.language || language}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Classification Confidence</span>
                <span className="font-mono font-bold text-emerald-700">
                  {createdComplaint.classificationResult?.confidenceScore}%
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-400 block text-[10px]">Deterministic Category</span>
              <span className="font-medium text-slate-800">
                {createdComplaint.category}
              </span>
            </div>
          </div>

          <div className="pt-3 flex justify-center gap-3">
            <Button variant="primary" size="md" onClick={handleClose} className="px-6">
              Done & Return
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-700">
          {/* Target Product Box */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Product</span>
              <span className="font-bold text-slate-900 block text-xs">{product.title}</span>
              <span className="text-[11px] text-slate-500 font-mono">
                {product.brand} • Manufacturer: {product.manufacturer || 'Registered Business'}
              </span>
            </div>
            <Badge variant="primary" size="sm" className="font-mono text-[10px]">
              MRP ₹{product.mrp}
            </Badge>
          </div>

          {/* Complainant Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label={t('consumerNameLabel')}
              value={formData.consumerName}
              onChange={(e) => setFormData({ ...formData, consumerName: e.target.value })}
              required
            />
            <Input
              label={t('emailLabel')}
              type="email"
              value={formData.consumerEmail}
              onChange={(e) => setFormData({ ...formData, consumerEmail: e.target.value })}
              required
            />
            <Input
              label={t('phoneLabel')}
              value={formData.consumerPhone}
              onChange={(e) => setFormData({ ...formData, consumerPhone: e.target.value })}
              required
            />
          </div>

          {/* Product URL & Order Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={t('productUrlLabel')}
              placeholder="https://ecommerce.com/product/..."
              value={formData.productUrl}
              onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
              icon={<Link2 className="h-3.5 w-3.5 text-slate-400" />}
            />
            <Input
              label={t('orderNumberLabel')}
              placeholder="e.g. OD-9921-4412"
              value={formData.orderNumber}
              onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
            />
          </div>

          {/* Grievance Statement with Transliteration Action */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {t('descriptionLabel')}
              </label>
              {language !== 'en' && (
                <button
                  type="button"
                  onClick={handleTransliterate}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
                >
                  <Wand2 className="h-3 w-3" />
                  <span>{t('transliterateBtn')}</span>
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('descriptionPlaceholder')}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none leading-relaxed"
              required
            />
            <div className="mt-1 text-[10px] text-slate-500 font-mono">
              {t('transliterationHelp')}
            </div>
          </div>

          {/* Multi-Evidence Upload Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {t('evidenceHeader')}
              </label>
              <span className="text-[10px] text-slate-400">Multiple files supported</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-3 bg-blue-50/30 text-center hover:bg-blue-50/60 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  id="evidence-camera-input"
                  className="hidden"
                />
                <label htmlFor="evidence-camera-input" className="cursor-pointer space-y-1 block">
                  <Camera className="h-5 w-5 text-blue-600 mx-auto" />
                  <span className="text-xs font-semibold text-blue-700 block">
                    Take Photo (Back Camera)
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Snap product label directly
                  </span>
                </label>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 bg-slate-50 text-center hover:bg-slate-100/60 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  id="evidence-file-input"
                  className="hidden"
                />
                <label htmlFor="evidence-file-input" className="cursor-pointer space-y-1 block">
                  <Upload className="h-5 w-5 text-slate-600 mx-auto" />
                  <span className="text-xs font-semibold text-slate-700 block">
                    {t('selectFiles')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {t('evidenceUploadInstructions')}
                  </span>
                </label>
              </div>
            </div>

            {/* Uploaded Evidence Grid */}
            {uploadedEvidence.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {uploadedEvidence.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200"
                  >
                    <img
                      src={item.previewUrl}
                      alt="Evidence preview"
                      className="h-12 w-12 object-cover rounded-md border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold text-slate-800 truncate block">
                        {item.file.name}
                      </span>
                      <select
                        value={item.tag}
                        onChange={(e) => updateEvidenceTag(idx, e.target.value as EvidenceTag)}
                        className="mt-1 text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-medium text-slate-700 focus:outline-none"
                      >
                        <option value="Product Packaging">Product Packaging</option>
                        <option value="Product Label / PDP">Product Label / PDP</option>
                        <option value="Receipt / Invoice">Receipt / Invoice</option>
                        <option value="E-Commerce Screenshot">E-Commerce Screenshot</option>
                        <option value="General Evidence">General Evidence</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEvidence(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Submit Buttons */}
          <div className="sticky bottom-0 -mx-3 sm:-mx-6 -mb-3 sm:-mb-6 p-3 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Deterministic Classifier + Regulatory RAG Engine
            </span>

            <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              <Button variant="outline" size="sm" type="button" onClick={handleClose} className="w-full sm:w-auto justify-center min-h-[40px]">
                {t('cancelBtn')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                className="w-full sm:w-auto justify-center min-h-[40px] gap-1.5 bg-red-600 hover:bg-red-700 text-white border-red-700"
              >
                <Send className="h-3.5 w-3.5 shrink-0" />
                <span>{t('submitComplaintBtn')}</span>
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
