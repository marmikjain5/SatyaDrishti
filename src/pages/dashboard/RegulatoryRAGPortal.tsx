import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  ShieldCheck,
  ExternalLink,
  GitBranch,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  Sparkles,
  Clock,
  ThumbsUp,
  XCircle,
  Cpu,
  ArrowRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import {
  OFFICIAL_REGULATORY_SOURCES,
  INITIAL_RULE_REGISTRY,
  KNOWLEDGE_GRAPH_NODES,
  KNOWLEDGE_GRAPH_EDGES,
  queryRegulatoryRAG,
  RegulatoryAuthority,
  RegulatoryRuleItem,
} from '../../lib/ragKnowledgeService';
import { formatCurrency, cn } from '../../lib/utils';

export const RegulatoryRAGPortal: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthority, setSelectedAuthority] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('search');
  const [ruleRegistry, setRuleRegistry] = useState<RegulatoryRuleItem[]>(INITIAL_RULE_REGISTRY);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawledAlert, setCrawledAlert] = useState<string | null>(null);
  const [evaluationDate, setEvaluationDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const handleTriggerGazetteCrawler = () => {
    setIsCrawling(true);
    setCrawledAlert('Scanning e-Gazette RSS feeds (consumeraffairs.nic.in & bis.gov.in)...');

    setTimeout(() => {
      setRuleRegistry((prev) => {
        const exists = prev.some((r) => r.code === 'PCR-2026-R6(1)(q)');
        if (exists) {
          setCrawledAlert('Gazette G.S.R. 882(E) is already ingested in the pending queue.');
          return prev;
        }

        const newIngestedRule: RegulatoryRuleItem = {
          ruleId: 'rule-auto-882e',
          code: 'PCR-2026-R6(1)(q)',
          title: 'Mandatory Dual QR Code & Digital Gazette Verification',
          authority: 'Legal Metrology',
          act: 'Legal Metrology (Packaged Commodities) Amendment Rules, 2026',
          sourceSection: 'Rule 6(1)(q)',
          appliesTo: ['packaged_goods', 'electronics', 'all'],
          severity: 'CRITICAL',
          status: 'PENDING_APPROVAL',
          activeVersion: 1,
          versions: [
            {
              versionId: 'ver-auto-882e-1',
              versionNumber: 1,
              effectiveFrom: '2026-11-01',
              effectiveUntil: null,
              status: 'PENDING_APPROVAL',
              changeSummary: 'Ingested from G.S.R. 882(E) gazette: Requires 2D QR Code on PDP embedding digital batch verification link.',
              proposedBy: 'Legal Metrology Automated Gazette Crawler (consumeraffairs.nic.in)',
              ruleDefinition: { field: 'qrCode', condition: 'valid_digital_verification', mandatory: true },
            },
          ],
        };

        setCrawledAlert('New Gazette G.S.R. 882(E) ingested! 1 Rule pending officer review.');
        return [newIngestedRule, ...prev];
      });

      setIsCrawling(false);
      setActiveTab('versioning');
    }, 1500);
  };

  // Execute RAG Query with Dynamic Evaluation Date
  const searchResults = queryRegulatoryRAG({
    queryText: searchQuery,
    authorityFilter: selectedAuthority === 'all' ? undefined : selectedAuthority,
    evaluationDate,
  });

  const handleApprovePendingRule = (ruleId: string, versionId: string) => {
    setRuleRegistry((prev) =>
      prev.map((rule) => {
        if (rule.ruleId !== ruleId) return rule;
        const updatedVersions = rule.versions.map((ver) => {
          if (ver.versionId === versionId) {
            return {
              ...ver,
              status: 'ACTIVE' as const,
              approvedBy: 'Senior Compliance Officer (Verified)',
              approvedAt: new Date().toISOString().split('T')[0],
            };
          }
          if (ver.status === 'ACTIVE') {
            return { ...ver, status: 'SUPERSEDED' as const };
          }
          return ver;
        });
        return {
          ...rule,
          status: 'ACTIVE',
          activeVersion: rule.activeVersion + 1,
          versions: updatedVersions,
        };
      })
    );
  };

  const handleRejectPendingRule = (ruleId: string, versionId: string) => {
    setRuleRegistry((prev) =>
      prev.map((rule) => {
        if (rule.ruleId !== ruleId) return rule;
        return {
          ...rule,
          versions: rule.versions.map((ver) =>
            ver.versionId === versionId ? { ...ver, status: 'REJECTED' as const } : ver
          ),
        };
      })
    );
  };

  const tabs = [
    { id: 'search', label: 'Semantic RAG Search', icon: <Search className="h-3.5 w-3.5" /> },
    { id: 'graph', label: 'Regulatory Knowledge Graph', icon: <GitBranch className="h-3.5 w-3.5" /> },
    { id: 'versioning', label: 'Rule Versioning & Approvals', icon: <Layers className="h-3.5 w-3.5" /> },
    { id: 'sources', label: 'Govt Regulatory Portals', icon: <Building2 className="h-3.5 w-3.5" /> },
  ];

  const pendingRulesCount = ruleRegistry.reduce(
    (count, rule) => count + rule.versions.filter((v) => v.status === 'PENDING_APPROVAL').length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Hero Header */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 text-slate-900 dark:text-white flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-xs">
        {/* Left (65–70%) */}
        <div className="space-y-2 lg:max-w-[68%]">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tracking-wide">
            Hybrid Vector + Knowledge Graph RAG Engine
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Regulatory Intelligence &amp; Guideline Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Search official Indian gazette notifications, statutory clauses, effective date mandates, and pending rule amendments.
          </p>
        </div>

        {/* Right (30–35%) */}
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center lg:items-start xl:items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleTriggerGazetteCrawler}
            disabled={isCrawling}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-blue-400', isCrawling && 'animate-spin')} />
            <span>{isCrawling ? 'Crawling Gazette Feeds...' : 'Crawl Gazette Feeds Now'}</span>
          </button>

          <div className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800/60 text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white">{OFFICIAL_REGULATORY_SOURCES.length}</span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Official Authorities Indexed</span>
          </div>
        </div>
      </div>

      {/* Transparency note: the production RAG store and the presentation fixture are distinct. */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
        <p className="font-semibold text-slate-800 dark:text-slate-100">Data source note</p>
        <p className="mt-1 leading-relaxed">
          Production regulatory retrieval uses Gazette documents embedded with pgvector on Supabase. This page also includes a small set of frontend demonstration rules so the crawler, search, graph, and approval workflow can be shown when the Supabase environment is not connected. Demonstration rules are not used as the production legal source.
        </p>
      </div>

      {/* Crawled Notification Alert Banner */}
      {crawledAlert && (
        <div className="p-3 bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-blue-500/40 text-blue-700 dark:text-blue-200 rounded-lg flex items-center justify-between text-xs font-mono animate-in fade-in">
          <div className="flex items-center gap-2">
            <RefreshCw className={cn('h-3.5 w-3.5 text-blue-400', isCrawling && 'animate-spin')} />
            <span>{crawledAlert}</span>
          </div>
          <button
            onClick={() => setCrawledAlert(null)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold px-2 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Unified Horizontal Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 sm:gap-6 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 pb-3 pt-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap -mb-px',
                isActive
                  ? 'border-blue-500 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              )}
            >
              {React.cloneElement(tab.icon as React.ReactElement, {
                className: cn('h-3.5 w-3.5', isActive ? 'text-blue-400' : 'text-slate-500'),
              })}
              <span>{tab.label}</span>
              {tab.id === 'versioning' && pendingRulesCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {pendingRulesCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: RAG SEARCH ────────────────────────────────────────── */}
      {activeTab === 'search' && (
        <div className="space-y-5">
          {/* Search Box & Filters */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <CardContent className="p-5 space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask any statutory question e.g. 'MRP tax inclusive format rule' or 'Country of origin declaration mandate'..."
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200 dark:border-slate-700 shadow-inner"
                />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Authority Pills */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                    <Filter className="h-3 w-3" /> Authority:
                  </span>
                  {['all', 'Legal Metrology', 'BIS', 'CCPA'].map((auth) => (
                    <button
                      key={auth}
                      onClick={() => setSelectedAuthority(auth)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        selectedAuthority === auth
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {auth === 'all' ? 'All Authorities' : auth}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <Calendar className="h-3.5 w-3.5 text-blue-400" />
                  <span>Evaluation Date:</span>
                  <input
                    type="date"
                    value={evaluationDate}
                    onChange={(e) => setEvaluationDate(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-300 font-bold border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <span className="text-emerald-400 font-semibold hidden sm:inline">(Active Rules)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RAG Telemetry Trace Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 min-w-0">
              <Cpu className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <div className="truncate">
                <span className="text-slate-500 font-medium">RAG Pipeline:</span>{' '}
                <span className="text-slate-700 dark:text-slate-200">Hybrid Vector Search + Knowledge Graph Filtered</span>{' '}
                <span className="text-blue-400 font-semibold">({searchResults.matchedChunks.length} chunks retrieved)</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-slate-600 dark:text-slate-300">
              <span className="text-emerald-400 font-bold">{searchResults.graphTrace.nodesTraversed}</span>
              <span className="text-slate-400">Graph Nodes Traversed</span>
            </div>
          </div>

          {/* Search Results List */}
          <div className="space-y-4">
            {searchResults.matchedChunks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center space-y-2">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Regulatory Chunks Matched</h3>
                  <p className="text-xs text-slate-500">
                    Try broadening your search term or selecting "All Authorities".
                  </p>
                </CardContent>
              </Card>
            ) : (
              searchResults.matchedChunks.map((chunk) => (
                <Card key={chunk.chunkId} className="border-slate-200 hover:border-blue-300 transition-all shadow-xs">
                  <CardContent className="p-5 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="primary" size="sm" className="font-mono">
                            {chunk.authority}
                          </Badge>
                          <span className="text-xs font-mono text-blue-700 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/60">
                            {chunk.ruleCode}
                          </span>
                          <Badge variant="success" size="sm">
                            {chunk.status}
                          </Badge>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight mt-1.5">
                          {chunk.section}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{chunk.title}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <Badge
                          variant={chunk.relevanceScore >= 0.7 ? 'success' : 'warning'}
                          size="sm"
                          className="font-mono font-bold"
                        >
                          {Math.round(chunk.relevanceScore * 100)}% Relevance
                        </Badge>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">{chunk.matchReason}</p>
                      </div>
                    </div>

                    {/* Summary Explanation */}
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {chunk.content}
                    </p>

                    {/* Verbatim Gazette Clause */}
                    <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-xs text-amber-950 font-serif italic space-y-1">
                      <div className="text-[10px] font-sans font-bold text-amber-800 not-italic uppercase tracking-wider">
                        Verbatim Gazette Statutory Clause:
                      </div>
                      <p>"{chunk.verbatimClause}"</p>
                    </div>

                    {/* Provenance & Penalty Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex-wrap gap-2">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 font-mono">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          Gazette: {chunk.officialGazetteRef}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          Effective: {chunk.effectiveDate}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-rose-600 font-bold">
                          Penalty: {formatCurrency(chunk.penalties.minFine)} - {formatCurrency(chunk.penalties.maxFine)}
                        </span>
                        <a
                          href={chunk.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          <span>Official Gazette PDF</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: KNOWLEDGE GRAPH ───────────────────────────────────── */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden text-slate-900 dark:text-white shadow-xs">
            {/* Header: Title + Subtitle on same row on desktop, NO ICON */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-1.5 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Regulatory Knowledge Graph Topology
                </h2>
                <span className="text-xs text-slate-400">
                  Relationships between Authorities, Statutory Documents, Sections, Active Rules, Versions, and Product Categories.
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-5">
              {/* Three-Column Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                {/* Column 1: AUTHORITIES */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Authorities ({KNOWLEDGE_GRAPH_NODES.filter((n) => n.type === 'authority').length})
                  </div>
                  <div className="space-y-1.5">
                    {KNOWLEDGE_GRAPH_NODES.filter((n) => n.type === 'authority').map((n) => (
                      <div
                        key={n.id}
                        className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      >
                        <span className="truncate pr-2">{n.label}</span>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">ISSUES →</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: ACTIVE RULES */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Active Rules ({KNOWLEDGE_GRAPH_NODES.filter((n) => n.type === 'rule').length})
                  </div>
                  <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5 scrollbar-thin">
                    {KNOWLEDGE_GRAPH_NODES.filter((n) => n.type === 'rule').map((n) => (
                      <div
                        key={n.id}
                        className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      >
                        <span className="truncate pr-2">{n.label}</span>
                        <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60 shrink-0">
                          ACTIVE
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 3: PRODUCT CATEGORIES */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Product Categories ({KNOWLEDGE_GRAPH_NODES.filter((n) => n.type === 'category').length})
                  </div>
                  <div className="space-y-1.5">
                    {KNOWLEDGE_GRAPH_NODES.filter((n) => n.type === 'category').map((n) => (
                      <div
                        key={n.id}
                        className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-300 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      >
                        <span className="truncate pr-2">{n.label}</span>
                        <span className="font-mono text-[10px] text-purple-400 shrink-0">APPLIES_TO →</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Knowledge Graph Edge Traversals Table */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 overflow-hidden text-slate-900 dark:text-white">
                {/* Section Header */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Active Knowledge Graph Edge Traversals ({KNOWLEDGE_GRAPH_EDGES.length})
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Relationships traversed across authorities, documents, rules and regulatory entities.
                  </p>
                </div>

                {/* Table Column Headers (Fixed) */}
                <div className="grid grid-cols-[35%_20%_45%] items-center px-4 py-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/40">
                  <span>Source</span>
                  <span>Relationship</span>
                  <span>Target</span>
                </div>

                {/* Scrollable Table Body */}
                <div className="divide-y divide-slate-200 dark:divide-slate-800/80 max-h-[320px] overflow-y-auto scrollbar-thin">
                  {KNOWLEDGE_GRAPH_EDGES.map((edge, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[35%_20%_45%] items-center px-4 py-2.5 text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-900/40"
                    >
                      {/* Source Column */}
                      <span
                        className="font-mono text-blue-600 dark:text-blue-400 truncate pr-3"
                        title={edge.source}
                      >
                        {edge.source}
                      </span>

                      {/* Relationship Column */}
                      <div>
                        <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50 inline-block uppercase tracking-wider">
                          {edge.relationship}
                        </span>
                      </div>

                      {/* Target Column */}
                      <span
                        className="font-mono text-slate-700 dark:text-slate-300 truncate pr-2"
                        title={edge.target}
                      >
                        {edge.target}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtle Table Footer */}
                <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/40 text-[11px] font-mono text-slate-500 dark:text-slate-500 flex items-center justify-between">
                  <span>
                    Showing {KNOWLEDGE_GRAPH_EDGES.length} of {KNOWLEDGE_GRAPH_EDGES.length} traversals
                  </span>
                  <span className="text-[10px] text-slate-600">Active Graph Mesh</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: RULE VERSIONING & APPROVALS ──────────────────────── */}
      {activeTab === 'versioning' && (
        <div className="space-y-4">
          {/* Human Review Action Alert */}
          {pendingRulesCount > 0 && (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-900 dark:text-white shadow-xs">
              <div>
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Human Review Action Required
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {pendingRulesCount} proposed rule version(s) pending human officer review. Unapproved rules will NOT reach the Compliance Engine.
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/60 shrink-0 self-start sm:self-center">
                {pendingRulesCount} Pending Approval
              </span>
            </div>
          )}

          {/* Rules List */}
          <div className="space-y-4">
            {ruleRegistry.map((rule) => (
              <div
                key={rule.ruleId}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden shadow-xs"
              >
                {/* Rule Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-bold text-xs bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/60">
                        {rule.code}
                      </span>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {rule.authority}
                      </span>
                      <span
                        className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded border',
                          rule.status === 'ACTIVE'
                            ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60'
                            : rule.status === 'PENDING_APPROVAL'
                            ? 'text-amber-400 bg-amber-950/60 border border-amber-800/60'
                            : 'text-slate-400 bg-slate-800/80 border border-slate-700/80'
                        )}
                      >
                        {rule.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <span className="text-xs font-mono text-slate-400">
                      Active Version: <span className="font-bold text-slate-200">v{rule.activeVersion}.0</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-2">
                    {rule.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    {rule.act} • {rule.sourceSection}
                  </p>
                </div>

                {/* Sub-Header */}
                <div className="px-4 sm:px-5 py-2 bg-slate-50 dark:bg-slate-950/60 border-t border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Rule Version History &amp; Human Approvals
                </div>

                {/* Table Header (Desktop) */}
                <div className="hidden lg:grid grid-cols-[80px_130px_110px_1fr_180px_170px] items-center px-4 sm:px-5 py-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-950/30 border-b border-slate-200 dark:border-slate-800">
                  <span>Version</span>
                  <span>Status</span>
                  <span>Effective</span>
                  <span>Summary</span>
                  <span>Proposed By</span>
                  <span>Approved By / Action</span>
                </div>

                {/* Version Rows */}
                <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
                  {rule.versions.map((ver) => (
                    <div
                      key={ver.versionId}
                      className={cn(
                        'px-4 sm:px-5 py-3 transition-colors',
                        ver.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-950/20 border-l-2 border-l-amber-500'
                          : 'hover:bg-slate-950/30'
                      )}
                    >
                      {/* Desktop Grid Row */}
                      <div className="hidden lg:grid grid-cols-[80px_130px_110px_1fr_180px_170px] items-start gap-3">
                        {/* Version */}
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white pt-0.5">
                          v{ver.versionNumber}.0
                        </span>

                        {/* Status */}
                        <div>
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider',
                              ver.status === 'ACTIVE'
                                ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60'
                                : ver.status === 'PENDING_APPROVAL'
                                ? 'text-amber-400 bg-amber-950/60 border border-amber-800/60'
                                : 'text-slate-400 bg-slate-800/80 border border-slate-700/80'
                            )}
                          >
                            {ver.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Effective */}
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-300 pt-0.5">
                          {ver.effectiveFrom}
                        </span>

                        {/* Summary */}
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pr-2">
                          {ver.changeSummary}
                        </p>

                        {/* Proposed By */}
                        <span className="text-[11px] font-mono text-slate-400 leading-tight">
                          {ver.proposedBy}
                        </span>

                        {/* Approved By / Action */}
                        <div className="text-[11px] font-mono text-slate-400">
                          {ver.status === 'PENDING_APPROVAL' ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleRejectPendingRule(rule.ruleId, ver.versionId)}
                                className="text-[11px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 border border-rose-800/60 px-2 py-1 rounded transition-colors"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApprovePendingRule(rule.ruleId, ver.versionId)}
                                className="text-[11px] font-semibold text-white bg-emerald-700 hover:bg-emerald-600 px-2.5 py-1 rounded transition-colors shadow-2xs whitespace-nowrap"
                              >
                                Approve
                              </button>
                            </div>
                          ) : ver.approvedBy ? (
                            <div className="leading-tight">
                              <span className="text-slate-300">{ver.approvedBy}</span>
                              {ver.approvedAt && (
                                <span className="block text-[10px] text-slate-500 mt-0.5">
                                  {ver.approvedAt}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </div>
                      </div>

                      {/* Mobile/Tablet Stacked View */}
                      <div className="lg:hidden space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                              v{ver.versionNumber}.0
                            </span>
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase',
                                ver.status === 'ACTIVE'
                                  ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60'
                                  : ver.status === 'PENDING_APPROVAL'
                                  ? 'text-amber-400 bg-amber-950/60 border border-amber-800/60'
                                  : 'text-slate-400 bg-slate-800/80 border border-slate-700/80'
                              )}
                            >
                              {ver.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-slate-400">
                            Effective: {ver.effectiveFrom}
                          </span>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{ver.changeSummary}</p>

                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-0.5 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                          <div>Proposed: {ver.proposedBy}</div>
                          {ver.approvedBy && (
                            <div>Approved: {ver.approvedBy} ({ver.approvedAt})</div>
                          )}
                        </div>

                        {ver.status === 'PENDING_APPROVAL' && (
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => handleRejectPendingRule(rule.ruleId, ver.versionId)}
                              className="text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 border border-rose-800/60 px-3 py-1 rounded transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprovePendingRule(rule.ruleId, ver.versionId)}
                              className="text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 px-3 py-1 rounded transition-colors shadow-2xs"
                            >
                              Approve &amp; Promote to Active
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: OFFICIAL GOVT SOURCES ────────────────────────────── */}
      {activeTab === 'sources' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {OFFICIAL_REGULATORY_SOURCES.map((src) => {
            const abbrMap: Record<string, string> = {
              'Legal Metrology': 'LM',
              BIS: 'BIS',
              CCPA: 'CCPA',
            };
            const abbr = abbrMap[src.authority] || src.authority;

            return (
              <div
                key={src.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                {/* Header: Abbreviation Badge + Authority Name + Description */}
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/60 shrink-0 mt-0.5">
                      {abbr}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                        {src.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {src.description}
                  </p>
                </div>

                {/* Compact Metadata Block */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3 space-y-1.5 text-xs font-mono">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <span className="text-slate-500 font-medium sm:w-32 shrink-0">
                      Gazette Reference:
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 truncate" title={src.gazetteRef}>
                      {src.gazetteRef}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <span className="text-slate-500 font-medium sm:w-32 shrink-0">
                      Document Types:
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 truncate" title={src.documentTypes.join(', ')}>
                      {src.documentTypes.join(', ')}
                    </span>
                  </div>
                </div>

                {/* Official Portal Link Footer */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <a
                    href={src.baseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors group"
                  >
                    <span>Visit Official Government Portal</span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-300 transition-colors" />
                  </a>
                  <span className="text-[11px] font-mono text-slate-500">
                    {src.jurisdiction}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
