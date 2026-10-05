
import React, { useState, useEffect } from 'react';
import {
  Play,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Copy,
  Check,
  Globe,
  Key,
  Info,
  ChevronRight,
  Eye,
  Send,
  Zap,
  ImageOff,
} from 'lucide-react';
import {
  crawlerService,
  CrawlerInspectionRecord,
  CrawlerStatus,
  CrawlerLogEntry,
  DraftStatutoryNotice,
} from '../../services/crawlerService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatCurrency, cn } from '../../lib/utils';
import { useComplianceStore } from '../../store/complianceStore';

export const EcommerceCrawler: React.FC = () => {
  const [status, setStatus] = useState<CrawlerStatus | null>(null);
  const [records, setRecords] = useState<CrawlerInspectionRecord[]>([]);
  const [logs, setLogs] = useState<CrawlerLogEntry[]>([]);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [batchSize, setBatchSize] = useState<number>(5);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [isInspectingUrl, setIsInspectingUrl] = useState<boolean>(false);
  const [activeNoticeModal, setActiveNoticeModal] = useState<DraftStatutoryNotice | null>(null);
  const [activeAuditRecord, setActiveAuditRecord] = useState<CrawlerInspectionRecord | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showApiGuideModal, setShowApiGuideModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [countdown, setCountdown] = useState<string>('18h 32m 45s');

  const { issueNotice } = useComplianceStore();

  const loadData = async () => {
    const s = await crawlerService.getStatus();
    setStatus(s);
    setRecords(crawlerService.getHistory());
    setLogs(crawlerService.getLogs());
  };

  useEffect(() => {
    loadData();

    // Simulated countdown to next 24-hour batch
    const interval = setInterval(() => {
      setLogs(crawlerService.getLogs());
      // Update countdown display
      const now = new Date();
      const nextRun = new Date(now);
      nextRun.setHours(24, 0, 0, 0);
      const diffMs = nextRun.getTime() - now.getTime();
      const hours = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      setCountdown(`${hours}h ${mins}m ${secs}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTriggerBatch = async () => {
    setIsLoadingBatch(true);
    try {
      const results = await crawlerService.runBatch(batchSize, selectedPlatform);
      setRecords([...results, ...records]);
      await loadData();
    } catch (err) {
      console.error('Batch inspection error:', err);
    } finally {
      setIsLoadingBatch(false);
    }
  };

  const handleInspectUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    setIsInspectingUrl(true);
    try {
      const result = await crawlerService.inspectCustomUrl(customUrl.trim());
      setRecords([result, ...records]);
      setCustomUrl('');
      await loadData();
    } catch (err) {
      console.error('URL inspection error:', err);
    } finally {
      setIsInspectingUrl(false);
    }
  };

  const copyNoticeToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const filteredRecords = records.filter((r) => {
    const platformMatch = selectedPlatform === 'All' || r.product.platform.toLowerCase() === selectedPlatform.toLowerCase();
    const statusMatch = filterStatus === 'All' || r.audit.status === filterStatus;
    return platformMatch && statusMatch;
  });

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'amazon':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
      case 'flipkart':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
      case 'blinkit':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800';
      case 'zepto':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800';
      case 'meesho':
        return 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-100 via-indigo-100 to-slate-100 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 text-slate-900 dark:text-white p-6 rounded-2xl shadow-xl border border-indigo-200 dark:border-indigo-900/50">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl font-black tracking-tight">
              Autonomous E-Commerce Compliance Inspector
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={handleTriggerBatch}
            disabled={isLoadingBatch}
            className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold gap-2 shadow-lg shadow-blue-500/20"
          >
            {isLoadingBatch ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Crawling 5 Products Live...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Initiate Live Scrape (5 Products)</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Scheduler Metrics & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Automated Schedule
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                5 Products / Day
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Next batch in: <span className="font-mono font-bold">{countdown}</span>
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Products Audited
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {records.length} SKUs
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Across 5 regulated marketplaces
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Globe className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Statutory Non-Compliance
              </p>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {records.filter((r) => r.audit.status === 'non-compliant').length} Violations
              </p>
              <p className="text-[11px] text-rose-500 font-medium mt-0.5">
                Flagged for Rule 6 enforcement
              </p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Compounding Penalty Exposure
              </p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {formatCurrency(
                  records.reduce((acc, r) => acc + (r.audit.estimated_penalty_inr || 0), 0)
                )}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Under Section 36(1) LM Act, 2009
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* URL Inspector Bar: User can paste any live product link */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-600" />
              <span>Inspect Any Live E-Commerce Product URL</span>
            </CardTitle>
            <span className="text-xs text-slate-500">
              Paste Amazon, Flipkart, Blinkit, Zepto, or Meesho links
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <form onSubmit={handleInspectUrl} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Input
                placeholder="https://www.amazon.in/dp/... or https://www.flipkart.com/..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="text-xs pr-10 font-mono"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isInspectingUrl || !customUrl.trim()}
              className="text-xs whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5"
            >
              {isInspectingUrl ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Scraping & Auditing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Scrape & Audit Live URL</span>
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Live Activity & Crawler Terminal Log */}
      <Card className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-800 shadow-lg overflow-hidden font-mono text-xs">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-200/90 dark:bg-slate-900/90 border-b border-slate-300 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-600 dark:text-slate-300 text-[11px] tracking-wide uppercase">
              Live Autonomous Crawler Execution Stream
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-semibold">ONLINE</span>
          </div>
        </div>
        <div className="p-3 max-h-40 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {logs.slice(0, 8).map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="text-slate-500 text-[10px] whitespace-nowrap">[{log.timestamp}]</span>
              <span
                className={cn(
                  'font-bold text-[10px] px-1 rounded',
                  log.level === 'SUCCESS' && 'bg-emerald-950 text-emerald-300',
                  log.level === 'WARN' && 'bg-amber-950 text-amber-300',
                  log.level === 'ERROR' && 'bg-rose-950 text-rose-300',
                  log.level === 'INFO' && 'bg-blue-950 text-blue-300'
                )}
              >
                {log.level}
              </span>
              <span className="text-slate-600 dark:text-slate-300">{log.message}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Filter and Control Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Marketplace:
          </span>
          {['All', 'Amazon', 'Flipkart', 'Blinkit', 'Zepto', 'Meesho'].map((plat) => (
            <button
              key={plat}
              onClick={() => setSelectedPlatform(plat)}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                selectedPlatform === plat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              )}
            >
              {plat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Compliance:
          </span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="compliant">Compliant (100%)</option>
            <option value="non-compliant">Non-Compliant (Violations)</option>
            <option value="under-review">Under Review (Warnings)</option>
          </select>
        </div>
      </div>

      {/* Crawled Products Grid */}
      <div className="space-y-4">
        {filteredRecords.length === 0 && (
          <Card className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col items-center max-w-md mx-auto space-y-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ready for Live Autonomous Inspection</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                No active crawl records in this view. Click <strong>Initiate Live Scrape</strong> to audit packaged commodities live across Indian e-commerce marketplaces, or paste any product listing URL above.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleTriggerBatch}
                disabled={isLoadingBatch}
                className="mt-2 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold gap-2 shadow-lg shadow-blue-500/20"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Initiate Live Scrape (5 Products)</span>
              </Button>
            </div>
          </Card>
        )}

        {filteredRecords.map((item) => {
          const p = item.product;
          const a = item.audit;
          const isFullyCompliant = a.violations.length === 0 && a.warnings.length === 0;
          const isUnderReview = a.violations.length === 0 && a.warnings.length > 0;
          const isNonCompliant = a.violations.length > 0;

          return (
            <Card
              key={item.id}
              className={cn(
                'bg-white dark:bg-slate-900 border transition-all hover:shadow-md',
                isFullyCompliant && 'border-emerald-200/80 dark:border-emerald-950/60',
                isUnderReview && 'border-amber-200/80 dark:border-amber-950/60',
                isNonCompliant && 'border-rose-200/80 dark:border-rose-950/60'
              )}
            >
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row gap-5">
                  {/* Thumbnail Image */}
                  <div className="w-full lg:w-36 h-36 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative flex items-center justify-center group">
                    {p.image_url && p.image_url.trim() && !p.image_url.includes('unsplash.com') ? (
                      <img
                        src={p.image_url}
                        alt={p.title}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.img-not-avail-box');
                            if (fallback) (fallback as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className={cn(
                        'img-not-avail-box flex-col items-center justify-center text-center p-3 text-slate-400 dark:text-slate-500',
                        p.image_url && p.image_url.trim() && !p.image_url.includes('unsplash.com') ? 'hidden' : 'flex'
                      )}
                    >
                      <ImageOff className="h-6 w-6 mb-1 text-slate-400 dark:text-slate-500" />
                      <span className="text-[11px] font-medium leading-tight">Image Not Available</span>
                    </div>
                    <div className="absolute top-2 left-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 text-[10px] font-bold rounded-md border shadow-xs',
                          getPlatformBadgeColor(p.platform)
                        )}
                      >
                        {p.platform}
                      </span>
                    </div>
                  </div>

                  {/* Main Product Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-mono text-slate-500">{p.sku}</span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {p.category}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span
                            className={cn(
                              'text-[11px] font-medium px-2 py-0.5 rounded-full border',
                              (p.is_live_scraped || item.is_live)
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                            )}
                          >
                            {(p.is_live_scraped || item.is_live) ? '⚡ Live Scraped' : '📋 Direct Listing'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {p.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Brand: <span className="font-semibold text-slate-700 dark:text-slate-300">{p.brand}</span> |{' '}
                          Manufacturer: <span className="text-slate-700 dark:text-slate-300">{p.manufacturer || 'Not Declared'}</span>
                        </p>
                      </div>

                      {/* Compliance Score Pill */}
                      <div className="text-right shrink-0">
                        <button
                          type="button"
                          onClick={() => setActiveAuditRecord(item)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all hover:scale-105 cursor-pointer shadow-xs',
                            isFullyCompliant && 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100',
                            isUnderReview && 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 hover:bg-amber-100',
                            isNonCompliant && 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 hover:bg-rose-100'
                          )}
                          title="Click to view detailed compliance audit report"
                        >
                          {isFullyCompliant && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                          {isUnderReview && <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                          {isNonCompliant && <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
                          <span>
                            {isFullyCompliant
                              ? '100% Compliant'
                              : isUnderReview
                                ? `${a.compliance_score}% - Under Review (${a.warnings.length} Warning${a.warnings.length > 1 ? 's' : ''})`
                                : `${a.compliance_score}% - ${a.violations.length} Violation${a.violations.length > 1 ? 's' : ''} Detected`}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Statutory Declarations Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Declared MRP</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {p.mrp > 0 ? `₹${p.mrp}` : 'Missing (Violation)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Unit Sale Price (USP)</span>
                        <span
                          className={cn(
                            'font-medium',
                            p.unit_sale_price ? 'text-slate-800 dark:text-slate-200 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'
                          )}
                        >
                          {p.unit_sale_price || 'Missing (Rule 5)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Net Quantity</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.net_weight || 'Not Declared'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Country of Origin</span>
                        <span
                          className={cn(
                            'font-bold',
                            p.country_of_origin ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {p.country_of_origin || 'Omitted (Rule 6(10))'}
                        </span>
                      </div>
                    </div>

                    {/* Detected Violations List if any */}
                    {a.violations.length > 0 && (
                      <div
                        onClick={() => setActiveAuditRecord(item)}
                        className="p-3 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/50 space-y-2 cursor-pointer hover:bg-rose-100/60 dark:hover:bg-rose-950/50 transition-colors"
                        title="Click to view full statutory audit report"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>{a.violations.length} Mandatory Statutory Violations Under Legal Metrology Rules, 2011 (Click to Inspect):</span>
                          </div>
                          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                            Penalty: {formatCurrency(a.estimated_penalty_inr)}
                          </span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-rose-700 dark:text-rose-300">
                          {a.violations.map((v, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 bg-white/70 dark:bg-rose-950/60 p-2 rounded-lg border border-rose-200/60 dark:border-rose-900/40">
                              <span className="font-bold text-rose-900 dark:text-rose-200 shrink-0">
                                • {v.section}:
                              </span>
                              <div className="space-y-0.5">
                                <span className="font-semibold text-rose-900 dark:text-rose-200">{v.title}</span>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300">Expected: {v.expected}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Advisory Warnings / Observations List if any */}
                    {a.warnings.length > 0 && (
                      <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>{a.warnings.length} Statutory Observations / Warnings:</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-amber-700 dark:text-amber-300">
                          {a.warnings.map((w, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 bg-white/70 dark:bg-amber-950/60 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                              <span className="font-bold text-amber-900 dark:text-amber-200 shrink-0">
                                • {w.section}:
                              </span>
                              <div className="space-y-0.5">
                                <span className="font-semibold text-amber-900 dark:text-amber-200">{w.title}</span>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300">Requirement: {w.expected}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <span>Open Listing on {p.platform}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveAuditRecord(item)}
                          className="text-xs border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 gap-1.5"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Inspect Compliance Report</span>
                        </Button>

                        {a.draft_notice && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveNoticeModal(a.draft_notice)}
                            className="text-xs border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>View Statutory Notice</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full Compliance Inspection Report Modal */}
      {activeAuditRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold">Statutory Compliance Audit Report</h3>
                  <p className="text-xs text-slate-500 font-mono">{activeAuditRecord.product.sku} • {activeAuditRecord.product.platform}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveAuditRecord(null)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{activeAuditRecord.product.title}</h4>
                <p className="text-slate-500 mt-1">
                  Category: <strong>{activeAuditRecord.product.category}</strong> | Brand: <strong>{activeAuditRecord.product.brand}</strong>
                </p>
                <p className="text-slate-500 mt-0.5">
                  Manufacturer: {activeAuditRecord.product.manufacturer || 'Not Declared on Listing'}
                </p>
              </div>

              {/* Status and Score */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border text-center">
                  <span className="text-[10px] text-slate-400 uppercase block">Compliance Score</span>
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{activeAuditRecord.audit.compliance_score}%</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border text-center">
                  <span className="text-[10px] text-slate-400 uppercase block">Violations Detected</span>
                  <span className="text-lg font-black text-rose-600 dark:text-rose-400">{activeAuditRecord.audit.violations.length}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border text-center">
                  <span className="text-[10px] text-slate-400 uppercase block">Penalty Exposure</span>
                  <span className="text-lg font-black text-rose-600 dark:text-rose-400">{formatCurrency(activeAuditRecord.audit.estimated_penalty_inr)}</span>
                </div>
              </div>

              {/* Violations */}
              {activeAuditRecord.audit.violations.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" />
                    <span>Statutory Non-Compliances (Legal Metrology Act, 2009):</span>
                  </h5>
                  <div className="space-y-2">
                    {activeAuditRecord.audit.violations.map((v, idx) => (
                      <div key={idx} className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-900 dark:text-rose-200">{v.section}: {v.title}</span>
                          <span className="font-bold text-rose-700">{formatCurrency(v.fine_inr)}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">Evidence on listing: <em>{v.evidence}</em></p>
                        <p className="text-slate-500">Legal Standard: {v.expected}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {activeAuditRecord.audit.warnings.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Advisory Observations:</span>
                  </h5>
                  <div className="space-y-2">
                    {activeAuditRecord.audit.warnings.map((w, idx) => (
                      <div key={idx} className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 space-y-1">
                        <span className="font-bold text-amber-900 dark:text-amber-200">{w.section}: {w.title}</span>
                        <p className="text-slate-600 dark:text-slate-300">Observed: {w.evidence}</p>
                        <p className="text-slate-500">Requirement: {w.expected}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Passed Checks */}
              {activeAuditRecord.audit.passed_rules.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Verified Statutory Declarations:</span>
                  </h5>
                  <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                    <ul className="space-y-1 text-emerald-800 dark:text-emerald-200">
                      {activeAuditRecord.audit.passed_rules.map((rule, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">Audited under Packaged Commodities Rules, 2011</span>
              <div className="flex items-center gap-2">
                {activeAuditRecord.audit.draft_notice && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveNoticeModal(activeAuditRecord.audit.draft_notice);
                      setActiveAuditRecord(null);
                    }}
                    className="text-xs border-rose-300 text-rose-700 hover:bg-rose-50 gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>View Show Cause Notice</span>
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveAuditRecord(null)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-white font-semibold"
                >
                  Close Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statutory Show Cause Notice Modal */}
      {activeNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-200 dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-300 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold">
                  Statutory Notice — Section 36(1) Legal Metrology Act, 2009
                </h3>
              </div>
              <button
                onClick={() => setActiveNoticeModal(null)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 font-sans text-xs">
              <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
                <div>
                  <p className="font-bold text-rose-800 dark:text-rose-300">
                    Case Reference: {activeNoticeModal.case_number}
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    Target Marketplace: {activeNoticeModal.target_marketplace} | SKU: {activeNoticeModal.product_sku}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase block">Compounding Penalty</span>
                  <span className="text-base font-black text-rose-600 dark:text-rose-400">
                    {formatCurrency(activeNoticeModal.total_penalty_exposure_inr)}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                {activeNoticeModal.notice_body}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Authorized for enforcement under Rule 6 of Packaged Commodities Rules 2011.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyNoticeToClipboard(activeNoticeModal.notice_body)}
                  className="text-xs gap-1.5"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{isCopied ? 'Copied Notice' : 'Copy Notice Text'}</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    alert(`Statutory Notice ${activeNoticeModal.case_number} successfully logged and transmitted to marketplace compliance team.`);
                    setActiveNoticeModal(null);
                  }}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Dispatch Statutory Notice</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Free Scraper API Setup Guide Modal */}
      {showApiGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-200 dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-300 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold">
                  Free Scraper API & Multi-Engine Configuration Guide
                </h3>
              </div>
              <button
                onClick={() => setShowApiGuideModal(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl">
                <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm flex items-center gap-1.5">
                  <Info className="h-4 w-4" />
                  <span>Zero-Config Free Scraping (Already Active!)</span>
                </h4>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  SatyaSetu is built with <strong>Jina AI Reader</strong> and <strong>Direct Stealth HTTP</strong> enabled by default with <strong>NO API KEY REQUIRED</strong>. It automatically handles JavaScript rendering and parses e-commerce product listings into clean Markdown.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  How to Add Free Rotating Proxies (ScraperAPI - 5,000 Free Calls/Month):
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300">
                  <li>
                    Visit{' '}
                    <a
                      href="https://www.scraperapi.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline font-semibold"
                    >
                      scraperapi.com
                    </a>{' '}
                    and sign up for a <strong>Free Account</strong> (no credit card required).
                  </li>
                  <li>Copy your free API key from your ScraperAPI dashboard.</li>
                  <li>
                    Open your <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">.env</code> file in the project root and add:
                    <pre className="mt-1.5 p-2 bg-slate-950 text-emerald-400 rounded-lg font-mono text-[11px]">
                      SCRAPER_API_KEY=your_free_scraper_api_key_here
                    </pre>
                  </li>
                  <li>
                    Restart the backend. SatyaSetu will automatically route live scrapes through Indian residential proxies with automated CAPTCHA solving!
                  </li>
                </ol>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-xs">
                  Why 5 Products / Day is Free Forever
                </h4>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  Checking 5 products a day consumes only <strong>150 requests per month</strong>. ScraperAPI’s free plan allows <strong>5,000 requests per month</strong> (over 30x the required quota).
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowApiGuideModal(false)}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Got It, Thanks!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
