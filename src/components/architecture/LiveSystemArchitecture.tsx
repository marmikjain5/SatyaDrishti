import React, { useState } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  Monitor,
  Scan,
  Scale,
  Building2,
  Gavel,
  BookOpen,
  BarChart2,
  Box,
  CheckCircle2,
  Server,
  Layers,
  Zap,
  Code,
  Database,
  Camera,
  Sliders,
  SunMedium,
  Maximize2,
  Binary,
  Wand2,
  Filter,
  FileText,
  Sparkles,
  AlertTriangle,
  Mail,
  MapPin,
  Play,
  Pause,
  ExternalLink,
  CheckCircle,
  X,
  ArrowRight
} from 'lucide-react';

interface NodeInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  tech: string[];
  metrics: { label: string; value: string }[];
  statutoryRef?: string;
}

const NODE_DETAILS: Record<string, NodeInfo> = {
  'users': {
    id: 'users',
    name: 'Role-Based Access Layer',
    category: 'Users & Access',
    description: 'Enforcement Officers, CCPA Central Supervisors, and Citizens access dedicated portals to file packaging grievances, perform field label audits, and monitor legal metrology compliance.',
    tech: ['JWT Session Tokens', 'RBAC Middleware', 'Zustand Store'],
    metrics: [
      { label: 'Role Types', value: '3 Portals' },
      { label: 'Auth Latency', value: '< 20ms' },
      { label: 'Multi-lingual', value: 'Hindi, Tamil, Kannada, English' }
    ]
  },
  'frontend': {
    id: 'frontend',
    name: 'SatyaDrishti Presentation Layer',
    category: 'Frontend Client',
    description: 'Responsive React 18 + Vite + TypeScript application orchestrating 8 specialized compliance modules including optical scanning, regulatory intelligence, and GIS risk surveillance.',
    tech: ['React 18', 'TypeScript', 'Tailwind CSS', 'Zustand', 'Leaflet', 'Recharts'],
    metrics: [
      { label: 'Bundle Size', value: '< 240kB gzip' },
      { label: 'Rendering', value: '60 FPS Canvas' },
      { label: 'Modules', value: '8 Integrated Desks' }
    ]
  },
  'backend': {
    id: 'backend',
    name: 'FastAPI Microservice Core',
    category: 'Backend / Application Layer',
    description: 'Containerized Python 3.11 asynchronous API handling compliance audits, optical preprocessing requests, e-Gazette updates, and database transactions.',
    tech: ['Python 3.11', 'FastAPI', 'Uvicorn ASGI', 'SQLAlchemy ORM', 'Docker'],
    metrics: [
      { label: 'API Latency', value: 'P95 < 45ms' },
      { label: 'Concurrency', value: 'Asynchronous Workers' },
      { label: 'Container', value: 'Alpine Docker' }
    ]
  },
  'ocr-pipeline': {
    id: 'ocr-pipeline',
    name: '6-Variant Image Preprocessing & OCR',
    category: 'AI Pipeline',
    description: 'Sequential WebAssembly/Canvas image processing pipeline (Grayscale, 2x Super-Resolution, Histogram Stretching, Adaptive Local Mean Binarization, 3x3 Convolution Sharpening, and 3x3 Median Denoising) to decode low-contrast declarations.',
    tech: ['Canvas Filter Matrix', 'Tesseract.js v7', 'Ollama Qwen2.5-VL', 'RegEx AST'],
    metrics: [
      { label: 'Preprocessing Time', value: '~48ms' },
      { label: 'Filter Passes', value: '6 Variants' },
      { label: 'Accuracy', value: '94.8% OCR Precision' }
    ],
    statutoryRef: 'Rule 6(1) Packaging Declarations'
  },
  'rule-engine': {
    id: 'rule-engine',
    name: 'Deterministic Legal Metrology Rule Engine & RAG',
    category: 'Statutory Core',
    description: 'Zero-hallucination deterministic verification evaluating extracted declarations against PCR Rules 2011 (Rules 6 & 7) coupled with BM25 + Cosine vector hybrid search across e-Gazette PDFs.',
    tech: ['Deterministic Rule Tables', 'Schedule I MPE AST', 'BM25 Keyword Index', 'Vector Embeddings'],
    metrics: [
      { label: 'Rule Execution', value: '< 12ms' },
      { label: 'Hallucination Rate', value: '0.00%' },
      { label: 'Gazette Corpus', value: '620+ Statutory Clauses' }
    ],
    statutoryRef: 'Legal Metrology (Packaged Commodities) Rules, 2011'
  },
  'enforcement-flow': {
    id: 'enforcement-flow',
    name: 'Statutory Section 36 SCN & Approval Gate',
    category: 'Enforcement & Governance',
    description: 'Mandatory Human-in-the-Loop review requiring inspector verification before issuing statutory 14-day Show Cause Notices (SCN) via automated Gmail REST integration.',
    tech: ['Automated PDF Generator', 'Gmail REST API', 'Audit Logs'],
    metrics: [
      { label: 'Human Gate', value: 'Mandatory' },
      { label: 'Notice Period', value: '14 Statutory Days' },
      { label: 'Dispatch Speed', value: '< 2.5s' }
    ],
    statutoryRef: 'Legal Metrology Act, 2009 — Section 36 & 48'
  },
  'leaflet-gis': {
    id: 'leaflet-gis',
    name: 'Zonal GIS Risk Intelligence',
    category: 'External Integrations',
    description: 'Surveillance map rendering recurring packaging non-compliance clusters, manufacturer facilities, and inspection priority routes.',
    tech: ['Leaflet GIS', 'GeoJSON', 'Kernel Density Heatmap'],
    metrics: [
      { label: 'Clustering', value: 'Real-time Zonal' },
      { label: 'FPS', value: '60 FPS Smooth' }
    ]
  }
};

export const LiveSystemArchitecture: React.FC<{ className?: string }> = ({ className }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NodeInfo | null>(null);

  return (
    <div
      id="system-architecture"
      className={`relative w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md transition-all duration-300 font-sans overflow-hidden text-slate-800 dark:text-slate-200 ${className || ''}`}
    >
      {/* Top Header matching exact diagram & website theme */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
              SatyaDrishti
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
              <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              LIVE ARCHITECTURE FLOW
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            AI-Powered Packaged Commodity Compliance Intelligence Platform • End-to-End Execution Trace
          </p>
        </div>

        {/* Status & Playback */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-500" />
                <span>Pause Flow</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-500" />
                <span>Resume Flow</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SVG Definitions for Arrowheads & Glowing Dot filters */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#2563eb" />
          </marker>
          <marker id="arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#059669" />
          </marker>
          <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#d97706" />
          </marker>
          <marker id="arrow-rose" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#e11d48" />
          </marker>
          <filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Main Architecture Canvas (Full Width Responsive, Stretched Spacing for Clear Arrows) */}
      <div className="p-4 sm:p-6 space-y-4 text-xs">
        
        {/* ========================================================================= */}
        {/* 1. USERS & ACCESS */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>USERS &amp; ACCESS</span>
            </div>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">Authentication &amp; Role Gateways</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { title: 'Inspector', icon: Users, sub: 'Field Audits' },
              { title: 'CCPA Admin', icon: Shield, sub: 'Central Directorate' },
              { title: 'Consumer', icon: UserCheck, sub: 'Grievance Filing' },
            ].map((usr) => (
              <div
                key={usr.title}
                onClick={() => setSelectedNode(NODE_DETAILS['users'])}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer group"
              >
                <usr.icon className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{usr.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* STRETCHED CONNECTION 1: Users -> Frontend (3 Vertical Arrows with Flowing Dots) */}
        <div className="h-10 relative flex items-center justify-around px-12 pointer-events-none">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="relative w-8 h-full flex flex-col items-center justify-between">
              {/* Vertical Guide Line */}
              <div className="w-[2px] h-full bg-blue-300 dark:bg-blue-600/70 relative">
                {/* Flowing animated dot */}
                {isPlaying && (
                  <div
                    className="absolute w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 -left-[3px] shadow-[0_0_8px_#2563eb]"
                    style={{ animation: `conduitDown 1.8s linear infinite ${idx * 0.45}s` }}
                  />
                )}
              </div>
              {/* Arrow Head */}
              <div className="absolute -bottom-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-blue-600 dark:border-t-blue-400" />
            </div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* 2. FRONTEND / PRESENTATION */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-blue-200/90 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-[11px] font-mono font-bold text-blue-700 dark:text-blue-300">
              <Monitor className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>FRONTEND / PRESENTATION</span>
            </div>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">Single Page Client</span>
          </div>

          {/* Technologies Ribbon */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3 pb-2.5 border-b border-blue-100 dark:border-blue-900/40">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-600 dark:text-slate-400 mr-1">
              TECHNOLOGIES:
            </span>
            {[
              'React',
              'TypeScript',
              'Vite',
              'Tailwind CSS',
              'React Router',
              'Zustand',
              'Recharts',
              'Leaflet',
            ].map((tech) => (
              <span
                key={tech}
                className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300 shadow-xs"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Application Modules Grid (8 Modules) */}
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <span className="px-3 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300">
                APPLICATION MODULES
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {[
                { title: 'Product Scanner', icon: Scan },
                { title: 'Regulatory Intelligence', icon: Scale },
                { title: 'Manufacturer Intelligence', icon: Building2 },
                { title: 'AI Legal Review', icon: Gavel },
                { title: 'Violation Ledger', icon: BookOpen },
                { title: 'Analytics', icon: BarChart2 },
                { title: 'Product Intelligence', icon: Box },
                { title: 'Consumer Portal', icon: CheckCircle },
              ].map((mod) => (
                <div
                  key={mod.title}
                  onClick={() => setSelectedNode(NODE_DETAILS['frontend'])}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <mod.icon className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-medium text-slate-800 dark:text-slate-200 leading-tight">
                    {mod.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STRETCHED CONNECTION 2: Frontend -> Backend (REST / HTTPS with Flowing Dot & Arrow) */}
        <div className="h-12 relative flex items-center justify-center pointer-events-none">
          {/* Vertical Conduit Line */}
          <div className="w-[2px] h-full bg-blue-400 dark:bg-blue-500 relative">
            {isPlaying && (
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-300 -left-[4px] shadow-[0_0_10px_#2563eb]"
                style={{ animation: 'conduitDown 1.5s linear infinite' }}
              />
            )}
          </div>
          {/* Arrowhead */}
          <div className="absolute -bottom-1 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-blue-600 dark:border-t-blue-400" />
          {/* Badge */}
          <div className="absolute px-3 py-0.5 rounded-full bg-white dark:bg-slate-800 border-2 border-blue-400 dark:border-blue-600 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300 shadow-sm flex items-center gap-1">
            <span>REST / HTTPS</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. BACKEND / APPLICATION LAYER */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-emerald-200/90 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300">
              <Server className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>BACKEND / APPLICATION LAYER</span>
            </div>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">Containerized FastAPI Runtime</span>
          </div>

          {/* Docker Containerized Runtime */}
          <div className="rounded-lg border-2 border-dashed border-emerald-400 dark:border-emerald-600 bg-white/80 dark:bg-slate-900/80 p-3">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>DOCKER - CONTAINERIZED RUNTIME</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              {[
                { name: 'Python 3.11', icon: Code },
                { name: 'FastAPI', icon: Zap },
                { name: 'Application Services', icon: Layers },
                { name: 'SQLAlchemy ORM', icon: Database },
              ].map((service, idx) => (
                <div
                  key={service.name}
                  onClick={() => setSelectedNode(NODE_DETAILS['backend'])}
                  className="relative flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-200 font-semibold text-xs shadow-xs hover:border-emerald-400 transition-all cursor-pointer group"
                >
                  <service.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate">{service.name}</span>
                  {idx < 3 && (
                    <ArrowRight className="hidden sm:block absolute -right-2 w-3.5 h-3.5 text-emerald-500 z-10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STRETCHED CONNECTION 3: Backend -> AI Pipeline (Compliance / Processing Requests) */}
        <div className="h-12 relative flex items-center justify-center pointer-events-none">
          <div className="w-[2px] h-full bg-emerald-400 dark:bg-emerald-500 relative">
            {isPlaying && (
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-300 -left-[4px] shadow-[0_0_10px_#059669]"
                style={{ animation: 'conduitDown 1.5s linear infinite' }}
              />
            )}
          </div>
          {/* Arrowhead */}
          <div className="absolute -bottom-1 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-emerald-600 dark:border-t-emerald-400" />
          <div className="absolute px-3 py-0.5 rounded-full bg-white dark:bg-slate-800 border-2 border-emerald-400 dark:border-emerald-600 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 shadow-sm flex items-center gap-1">
            <span>Compliance / Processing Requests</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. AI + COMPLIANCE PROCESSING PIPELINE */}
        {/* ========================================================================= */}
        <div className="rounded-xl border-2 border-sky-300 dark:border-sky-800 bg-sky-50/20 dark:bg-sky-950/20 p-3 sm:p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-700 text-[11px] font-mono font-bold text-sky-800 dark:text-sky-300">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>AI + COMPLIANCE PROCESSING PIPELINE</span>
            </div>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">Sequential OCR &amp; Deterministic Rules</span>
          </div>

          {/* Row A: Product Camera -> Arrow -> Image Preprocessing -> Arrow -> Tesseract.js OCR */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Camera */}
            <div
              onClick={() => setSelectedNode(NODE_DETAILS['ocr-pipeline'])}
              className="md:col-span-3 flex items-center justify-center gap-2.5 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-all cursor-pointer shadow-xs group"
            >
              <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-xs">Product Camera / Image</div>
                <div className="text-[9px] text-slate-600 dark:text-slate-400 font-mono">Multi-Angle Capture</div>
              </div>
            </div>

            {/* Horizontal Arrow between Camera and Preprocessing */}
            <div className="hidden md:flex md:col-span-1 items-center justify-center relative h-6 pointer-events-none">
              <div className="w-full h-[2px] bg-blue-300 dark:bg-blue-600 relative">
                {isPlaying && (
                  <div
                    className="absolute w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 -top-[3px] shadow-[0_0_6px_#2563eb]"
                    style={{ animation: 'conduitRight 1.4s linear infinite' }}
                  />
                )}
              </div>
              <div className="absolute right-0 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-blue-600 dark:border-l-blue-400" />
            </div>

            {/* Image Preprocessing with 6 variants */}
            <div
              onClick={() => setSelectedNode(NODE_DETAILS['ocr-pipeline'])}
              className="md:col-span-4 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 shadow-xs cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2 border-b border-slate-100 dark:border-slate-700 pb-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 font-mono">
                  <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Image Preprocessing</span>
                </div>
                <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded font-semibold">
                  6-Pass Filters
                </span>
              </div>

              {/* 6 Sub-variants */}
              <div className="grid grid-cols-2 gap-1 text-[9px] font-mono">
                <div className="p-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Grayscale</span>
                  <div className="text-[8px] text-slate-500">Luminance Transformation</div>
                </div>
                <div className="p-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Upscaling</span>
                  <div className="text-[8px] text-slate-500">2× Super-Resolution</div>
                </div>
                <div className="p-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Contrast</span>
                  <div className="text-[8px] text-slate-500">Histogram Stretching</div>
                </div>
                <div className="p-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Binarization</span>
                  <div className="text-[8px] text-slate-500">Adaptive Local Mean</div>
                </div>
                <div className="p-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Sharpening</span>
                  <div className="text-[8px] text-slate-500">3×3 Convolution</div>
                </div>
                <div className="p-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Denoised</span>
                  <div className="text-[8px] text-slate-500">3×3 Median Filter</div>
                </div>
              </div>
            </div>

            {/* Horizontal Arrow between Preprocessing and OCR */}
            <div className="hidden md:flex md:col-span-1 items-center justify-center relative h-6 pointer-events-none">
              <div className="w-full h-[2px] bg-blue-300 dark:bg-blue-600 relative">
                {isPlaying && (
                  <div
                    className="absolute w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 -top-[3px] shadow-[0_0_6px_#2563eb]"
                    style={{ animation: 'conduitRight 1.4s linear infinite' }}
                  />
                )}
              </div>
              <div className="absolute right-0 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-blue-600 dark:border-l-blue-400" />
            </div>

            {/* OCR */}
            <div
              onClick={() => setSelectedNode(NODE_DETAILS['ocr-pipeline'])}
              className="md:col-span-3 flex items-center justify-center gap-2.5 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-all cursor-pointer shadow-xs group"
            >
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-xs">Tesseract.js OCR</div>
                <div className="text-[9px] text-slate-600 dark:text-slate-400 font-mono">Token Extraction</div>
              </div>
            </div>
          </div>

          {/* STRETCHED CONNECTION: OCR output Arrow pointing down into Structured Field Extraction */}
          <div className="h-10 relative flex items-center justify-center pointer-events-none">
            <div className="w-[2px] h-full bg-sky-400 dark:bg-sky-500 relative">
              {isPlaying && (
                <div
                  className="absolute w-2.5 h-2.5 rounded-full bg-sky-600 dark:bg-sky-300 -left-[4px] shadow-[0_0_8px_#0284c7]"
                  style={{ animation: 'conduitDown 1.4s linear infinite' }}
                />
              )}
            </div>
            {/* Arrowhead */}
            <div className="absolute -bottom-1 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-sky-600 dark:border-t-sky-400" />
            <div className="absolute px-3 py-0.5 rounded-full bg-white dark:bg-slate-800 border-2 border-sky-400 dark:border-sky-600 text-[10px] font-mono font-bold text-sky-700 dark:text-sky-300 shadow-sm">
              OCR output ↓
            </div>
          </div>

          {/* Row B: Structured Field Extraction -> Arrow -> Legal Metrology Rule Engine & RAG -> Arrow -> Decision -> Violation */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
            
            {/* Structured Field Extraction */}
            <div
              onClick={() => setSelectedNode(NODE_DETAILS['ocr-pipeline'])}
              className="md:col-span-4 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 dark:text-blue-300 font-mono mb-1.5">
                <Binary className="w-3.5 h-3.5 text-blue-600" />
                <span>Structured Field Extraction</span>
              </div>
              <div className="text-[9px] text-slate-600 dark:text-slate-400 mb-2">
                Product • MRP • Quantity • Manufacturer
              </div>
              <div className="flex flex-wrap gap-1 text-[9px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200">Product Name</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200">MRP Currency</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200">Net Quantity</span>
              </div>

              {/* Tag indicating flow into rules */}
              <div className="mt-2 text-[9px] font-mono text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
                <span>Extracted Compliance Fields →</span>
              </div>
            </div>

            {/* Legal Metrology Rule Engine & RAG Box (Amber) */}
            <div
              onClick={() => setSelectedNode(NODE_DETAILS['rule-engine'])}
              className="md:col-span-4 p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-700 hover:border-amber-500 transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 font-mono mb-1">
                <Scale className="w-4 h-4 text-amber-600" />
                <span>Legal Metrology Rule Engine</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 font-mono mb-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>Regulatory Rule Retrieval / RAG</span>
              </div>

              {/* Retrieval Trace Pill */}
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 text-[9px] font-mono text-amber-800 dark:text-amber-300 space-y-0.5">
                <div className="font-bold text-amber-700 dark:text-amber-400">retrieval trace:</div>
                <div className="text-slate-600 dark:text-slate-400 truncate">
                  Regulatory Corpus • Rule Retrieval • Applicable Rule Resolution
                </div>
              </div>

              <div className="mt-2 text-[9px] font-mono text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span>applicable rules →</span>
              </div>
            </div>

            {/* Decision & Evidence Cluster */}
            <div className="md:col-span-4 flex flex-col gap-2">
              {/* Compliance Decision */}
              <div
                onClick={() => setSelectedNode(NODE_DETAILS['rule-engine'])}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-700 hover:border-emerald-500 transition-all cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 font-mono">Compliance Decision</div>
                  <div className="text-[9px] text-emerald-700 dark:text-emerald-400 font-mono">Pass / Warning / Defect</div>
                </div>
              </div>

              {/* Evidence & Violation Record */}
              <div
                onClick={() => setSelectedNode(NODE_DETAILS['enforcement-flow'])}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-700 hover:border-rose-500 transition-all cursor-pointer shadow-xs"
              >
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300 font-mono">Evidence &amp; Violation Record</div>
                  <div className="text-[9px] text-rose-700 dark:text-rose-400 font-mono">Violation Context / Evidence</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* STRETCHED CONNECTION 4: Pipeline -> Data Layer (Result Persistence with Flowing Dot & Arrow) */}
        <div className="h-12 relative flex items-center justify-center pointer-events-none">
          <div className="w-[2px] h-full bg-slate-300 dark:bg-slate-700 relative">
            {isPlaying && (
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 -left-[4px] shadow-[0_0_10px_#2563eb]"
                style={{ animation: 'conduitDown 1.6s linear infinite' }}
              />
            )}
          </div>
          {/* Arrowhead */}
          <div className="absolute -bottom-1 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-slate-500 dark:border-t-slate-400" />
          <div className="absolute px-3 py-0.5 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 shadow-sm">
            Result Persistence ↓
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. DATA / PERSISTENCE */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>DATA / PERSISTENCE</span>
            </div>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">PostgreSQL Container Engine</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Docker PostgreSQL Container */}
            <div className="md:col-span-4 rounded-lg border-2 border-dashed border-emerald-400 bg-white dark:bg-slate-800 p-2.5 shadow-xs">
              <div className="text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                DOCKER - POSTGRESQL CONTAINER
              </div>
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">PostgreSQL 16</div>
                  <div className="text-[9px] text-slate-600 dark:text-slate-400 font-mono">Relational &amp; Vector Index</div>
                </div>
              </div>
            </div>

            {/* Logical Data Domains */}
            <div className="md:col-span-8 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 font-mono mb-1">
                LOGICAL DATA DOMAINS
              </div>
              <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400 leading-relaxed">
                Users &amp; Roles • Products • Manufacturers • Compliance Results • Violations • Complaints • Inspection Records • Enforcement Records • Audit Data
              </p>
            </div>
          </div>
        </div>

        {/* STRETCHED CONNECTION 5: Data -> Outputs & Enforcement (Flowing Dot & Arrow) */}
        <div className="h-10 relative flex items-center justify-center pointer-events-none">
          <div className="w-[2px] h-full bg-rose-300 dark:bg-rose-700 relative">
            {isPlaying && (
              <div
                className="absolute w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-400 -left-[3px] shadow-[0_0_8px_#e11d48]"
                style={{ animation: 'conduitDown 1.5s linear infinite' }}
              />
            )}
          </div>
          <div className="absolute -bottom-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-rose-600 dark:border-t-rose-400" />
        </div>

        {/* ========================================================================= */}
        {/* 6. OUTPUTS & ENFORCEMENT */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-rose-200/90 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 text-[11px] font-mono font-bold text-rose-800 dark:text-rose-300">
              <Shield className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>OUTPUTS &amp; ENFORCEMENT</span>
            </div>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">Statutory Show Cause Notice Pipeline</span>
          </div>

          {/* Top row tags */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2.5 mb-3 border-b border-rose-100 dark:border-rose-900/40 text-[10px] font-mono">
            <span className="px-2.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold">Compliance Reports</span>
            <span className="px-2.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold">Compliance Results</span>
            <span className="px-2.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold">Violation Records</span>
            <span className="px-2.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold">Manufacturer Risk Intelligence</span>
            <span className="px-2.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold">Analytics</span>
          </div>

          {/* Workflow Row: AI Review -> Arrow -> Human Verification -> Arrow -> Enforcement / SCN -> Arrow -> Channels */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            
            {/* AI Legal Review */}
            <div
              onClick={() => setSelectedNode(NODE_DETAILS['enforcement-flow'])}
              className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 shadow-xs cursor-pointer relative"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 font-mono mb-1">
                <Gavel className="w-3.5 h-3.5 text-amber-600" />
                <span>AI Legal Review</span>
              </div>
              <div className="text-[9px] text-slate-600 dark:text-slate-400 font-mono">
                Evidence assessment • legal reasoning / recommendation
              </div>
              <div className="mt-2 text-[9px] font-mono text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
                recommendation only →
              </div>
            </div>

            {/* Human Verification (Mandatory Gate) */}
            <div
              onClick={() => setSelectedNode(NODE_DETAILS['enforcement-flow'])}
              className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-400 dark:border-blue-500 shadow-xs cursor-pointer relative"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-800 dark:text-blue-200 font-mono mb-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Human Verification</span>
              </div>
              <div className="text-[9px] text-blue-700 dark:text-blue-300 font-mono">
                Required approval gate
              </div>
              <div className="mt-2 text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                ✓ approved →
              </div>
            </div>

            {/* Enforcement / SCN */}
            <div
              onClick={() => setSelectedNode(NODE_DETAILS['enforcement-flow'])}
              className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 shadow-xs cursor-pointer relative"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-800 dark:text-rose-300 font-mono mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Enforcement / SCN</span>
              </div>
              <div className="text-[9px] text-slate-600 dark:text-slate-400 font-mono">
                Statutory 14-day notice
              </div>
              <div className="mt-2 text-[9px] font-mono text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                Email API →
              </div>
            </div>

            {/* Delivery Channels */}
            <div className="space-y-1.5">
              <div className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-[9.5px] font-mono">
                <Mail className="w-3.5 h-3.5 text-rose-600" />
                <span>Email Notifications</span>
              </div>
              <div className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-[9.5px] font-mono">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Consumer Verification</span>
              </div>
              <div className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-[9.5px] font-mono">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Complaint Management</span>
              </div>
            </div>

          </div>
        </div>

        {/* STRETCHED CONNECTION 6: Downward flow to External Integrations */}
        <div className="h-10 relative flex items-center justify-around px-20 pointer-events-none">
          {/* Left Arrow to Leaflet GIS (Geospatial Data) */}
          <div className="relative flex flex-col items-center">
            <div className="w-[2px] h-10 bg-amber-400 dark:bg-amber-600 relative">
              {isPlaying && (
                <div
                  className="absolute w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-300 -left-[3px] shadow-[0_0_8px_#d97706]"
                  style={{ animation: 'conduitDown 1.6s linear infinite' }}
                />
              )}
            </div>
            <div className="absolute -bottom-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-amber-600 dark:border-t-amber-400" />
            <span className="absolute -top-1 px-2 py-0.2 rounded bg-white dark:bg-slate-800 border border-amber-300 text-[8.5px] font-mono text-amber-700 font-bold">
              Geospatial Data ↓
            </span>
          </div>

          {/* Right Arrow to Gmail API */}
          <div className="relative flex flex-col items-center">
            <div className="w-[2px] h-10 bg-rose-400 dark:bg-rose-600 relative">
              {isPlaying && (
                <div
                  className="absolute w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-300 -left-[3px] shadow-[0_0_8px_#e11d48]"
                  style={{ animation: 'conduitDown 1.6s linear infinite 0.5s' }}
                />
              )}
            </div>
            <div className="absolute -bottom-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-rose-600 dark:border-t-rose-400" />
            <span className="absolute -top-1 px-2 py-0.2 rounded bg-white dark:bg-slate-800 border border-rose-300 text-[8.5px] font-mono text-rose-700 font-bold">
              SCN Dispatch ↓
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 7. EXTERNAL INTEGRATIONS */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-[11px] font-mono font-bold text-amber-800 dark:text-amber-300">
              <ExternalLink className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>EXTERNAL INTEGRATIONS</span>
            </div>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">GIS Heatmaps &amp; Gmail Service</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Leaflet GIS */}
            <div
              onClick={() => setSelectedNode(NODE_DETAILS['leaflet-gis'])}
              className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/80 hover:border-amber-400 transition-all cursor-pointer shadow-xs flex items-center gap-3"
            >
              <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-900/40 text-amber-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                  <span>Leaflet GIS</span>
                  <span className="text-[9px] font-mono text-amber-700 dark:text-amber-400">(Geospatial Data)</span>
                </div>
                <div className="text-[9.5px] text-slate-600 dark:text-slate-400 font-mono">
                  Map rendering • manufacturer locations • facility markers • risk visualization
                </div>
              </div>
            </div>

            {/* Gmail API */}
            <div
              onClick={() => setSelectedNode(NODE_DETAILS['enforcement-flow'])}
              className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/80 hover:border-amber-400 transition-all cursor-pointer shadow-xs flex items-center gap-3"
            >
              <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-900/40 text-amber-600">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                  <span>Gmail API</span>
                  <span className="text-[9px] font-mono text-amber-700 dark:text-amber-400">(SCN notifications)</span>
                </div>
                <div className="text-[9.5px] text-slate-600 dark:text-slate-400 font-mono">
                  SCN dispatch • enforcement email • inspection communication
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer bar */}
      <div className="px-4 sm:px-6 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Data Flow: End-to-End Autonomous Pipeline</span>
        </div>
        <div>
          Click any component to inspect technical telemetry
        </div>
      </div>

      {/* Modal for node details */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-2xl text-slate-800 dark:text-slate-100 font-sans space-y-3">
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-mono uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
                  {selectedNode.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedNode.name}</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedNode.description}
            </p>

            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {selectedNode.metrics.map((m) => (
                <div key={m.label} className="text-center font-mono">
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400">{m.value}</div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400">{m.label}</div>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                Technologies
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.tech.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {selectedNode.statutoryRef && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-amber-700 dark:text-amber-400">
                <span>Statutory Reference:</span>
                <span className="font-semibold">{selectedNode.statutoryRef}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Embedded CSS for dot flow animations */}
      <style>{`
        @keyframes conduitDown {
          0% {
            top: 0%;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
        @keyframes conduitRight {
          0% {
            left: 0%;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default LiveSystemArchitecture;
