import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Cpu,
  Database,
  Code2,
  ChevronRight,
  BookOpen,
  ArrowRight,
  FileCode2,
  Sparkles,
  Zap,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ShoppingBag,
  Eye,
  Mail,
  Workflow,
  Table,
  Binary,
  ShieldCheck,
  Search,
  HardDrive
} from 'lucide-react';
import { LandingNavbar } from '../components/layout/LandingNavbar';
import { LandingFooter } from '../components/layout/LandingFooter';
import { LiveSystemArchitecture } from '../components/architecture/LiveSystemArchitecture';
import { SmartInfoTooltip } from '../components/ui/SmartInfoTooltip';

export const SystemArchitecturePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('hla');

  const sections = [
    {
      id: 'hla',
      num: '01',
      title: 'High-Level Architecture (HLA)',
      subtitle: '7-Tier Live Blueprint & Dataflow Animation',
      icon: Layers,
    },
    {
      id: 'lla',
      num: '02',
      title: 'Low-Level Architecture (LLA)',
      subtitle: 'Internal Functions, Modules & Call Graphs',
      icon: Code2,
    },
    {
      id: 'schemas',
      num: '03',
      title: 'Database Schemas & Data Layer',
      subtitle: 'SQLAlchemy ORM Models & Relational Entities',
      icon: Database,
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 260;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 selection:bg-blue-600 selection:text-white">
      <LandingNavbar />

      {/* Hero Header */}
      <header className="relative pt-10 pb-12 border-b border-slate-200 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#020617] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Link to="/" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              <span>Home</span>
            </Link>
            <span className="text-slate-400 text-xs">/</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">System Architecture</span>
          </div>

          <div className="max-w-4xl space-y-4">
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              SatyaDrishti <span className="text-blue-600 dark:text-blue-400">Software Architecture Specification</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main Two-Column Layout with 3-Item Sticky Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Sticky Left Table of Contents (3 Main Sections) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-6">
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-sm dark:shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Table of Contents</span>
              </h3>
              
              <nav className="space-y-2">
                {sections.map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full text-left p-3.5 rounded-xl transition-all flex items-start gap-3 border ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-600/15 border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 shadow-sm'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {sec.num}
                          </span>
                          {isActive && (
                            <ChevronRight className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700 dark:text-blue-200' : 'text-slate-800 dark:text-slate-200'}`}>
                          {sec.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {sec.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Tech Architecture Card */}
            <div className="bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Cpu className="h-4 w-4" />
                <span>Codebase Stack</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-700 dark:text-slate-300">
                <div className="p-2 bg-white/70 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[10px] text-slate-400">FRONTEND</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">React + TS</div>
                </div>
                <div className="p-2 bg-white/70 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[10px] text-slate-400">BACKEND</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">FastAPI ASGI</div>
                </div>
                <div className="p-2 bg-white/70 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[10px] text-slate-400">DATABASE</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">PostgreSQL 16</div>
                </div>
                <div className="p-2 bg-white/70 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[10px] text-slate-400">HYBRID OCR</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">WASM + Vision</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Main Architecture Content: 3 Sections */}
          <main className="lg:col-span-8 space-y-16 text-slate-700 dark:text-slate-300 text-base leading-relaxed">

            {/* ========================================================================= */}
            {/* SECTION 1: HIGH-LEVEL ARCHITECTURE (HLA) */}
            {/* ========================================================================= */}
            <section id="hla" className="space-y-6 scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 font-bold font-mono text-base">
                    01
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      <SmartInfoTooltip term="High-Level Architecture (HLA)" meaning="The big-picture view of how the main parts work together." example="It shows the journey from a product image to an enforcement record." />
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono">
                      7-Tier Live Platform Blueprint • Animated Dataflow Conduits
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                    Live Data Flow
                  </span>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                SatyaDrishti adopts a <strong><SmartInfoTooltip term="Hybrid, Edge-First Architecture" meaning="Uses nearby browser checks first, then sends heavier work to the server." example="A photo can be cleaned and checked before the full report is prepared." /></strong>. <SmartInfoTooltip term="Image Preprocessing" meaning="Cleans an image before its text is read." example="It reduces glare so small label text is easier to recognise." /> and <SmartInfoTooltip term="Rule Validation" meaning="Tests each product detail against a specific rule." example="It checks whether the printed font size meets the required minimum." /> occur immediately on the client browser, while heavier vector <SmartInfoTooltip term="RAG" meaning="Finds the most relevant current rules before giving an answer." example="A new Legal Metrology amendment can be used during a compliance check." /> embeddings, background marketplace <SmartInfoTooltip term="E-Commerce Crawler" meaning="Checks product listings on online marketplaces automatically." example="It compares an online MRP and product claim with the package image." />, and <SmartInfoTooltip term="Show Cause Notice (SCN)" meaning="An official notice asking a business to explain a suspected violation." example="An inspector can review and send a notice after a confirmed mismatch." /> dispatch run asynchronously in containerized FastAPI microservices.
              </p>

              {/* The Live System Architecture Visual with Flowing Dots */}
              <div className="my-4">
                <LiveSystemArchitecture />
              </div>
            </section>

            {/* ========================================================================= */}
            {/* SECTION 2: LOW-LEVEL ARCHITECTURE (LLA) */}
            {/* ========================================================================= */}
            <section id="lla" className="space-y-8 scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 font-bold font-mono text-base">
                    02
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      <SmartInfoTooltip term="Low-Level Architecture (LLA)" meaning="A closer view of the functions and modules inside the system." example="It shows which service extracts MRP before rules are checked." />
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono">
                      Internal Functions, Algorithms, Code Modules &amp; Call Graphs
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30">
                    Codebase Internals
                  </span>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                The Low-Level Architecture (LLA) details the internal code mechanics of SatyaDrishti. It includes <SmartInfoTooltip term="OCR" meaning="Reads printed words and numbers from an image." example="It extracts MRP, expiry, and manufacturer details from a package label." />, image processing, rule checks, concrete source modules, key exported functions, mathematical formulations, and the runtime function call graph across the repository.
              </p>

              {/* Modern Grid of Clean LLA Module Cards (No large black boxes) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. imagePreprocessor.ts */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <Sliders className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">imagePreprocessor.ts</div>
                        <div className="text-[11px] text-slate-500 font-mono">src/lib/imagePreprocessor.ts</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Main Function: </span>
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-blue-600 dark:text-blue-400">generatePreprocessingVariants(file)</code>
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      Generates 6 parallel canvas matrix variants (Grayscale, Contrast, Bilinear, Adaptive Binarized, Laplacian Sharpened, Denoised) for <SmartInfoTooltip term="Image Preprocessing" meaning="Cleans an image before its text is read." example="It reduces glare so small label text is easier to recognise." />.
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60 font-mono text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <div>• Luminance: <span className="text-slate-700 dark:text-slate-300">0.2126R + 0.7152G + 0.0722B</span></div>
                      <div>• Binarization: <span className="text-slate-700 dark:text-slate-300">O(1) Integral Table, W=31px, C=10</span></div>
                    </div>
                  </div>
                </div>

                {/* 2. ocrService.ts */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                        <FileCode2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">ocrService.ts</div>
                        <div className="text-[11px] text-slate-500 font-mono">src/lib/ocrService.ts</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Main Function: </span>
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">processImageMultiPass(blob, variants)</code>
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      Manages a Tesseract <SmartInfoTooltip term="WebAssembly" meaning="Lets image-reading code run quickly inside the browser." example="The browser can read a label without waiting for a server round trip." /> worker pool with <code className="font-mono text-slate-700 dark:text-slate-300">eng.traineddata</code>, running parallel multi-pass recognition.
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60 font-mono text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <div>• Output: <span className="text-slate-700 dark:text-slate-300">MultiPassOCRData[] with line bboxes</span></div>
                      <div>• Normalization: <span className="text-slate-700 dark:text-slate-300">Rescales boxes to original camera coords</span></div>
                    </div>
                  </div>
                </div>

                {/* 3. multiAngleConsolidator.ts */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">multiAngleConsolidator.ts</div>
                        <div className="text-[11px] text-slate-500 font-mono">src/lib/multiAngleConsolidator.ts</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Main Function: </span>
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-sky-600 dark:text-sky-400">consolidateMultiAngleDeclarations()</code>
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      Cross-references Front, Back, Side, and Bottom angles. Resolves duplicate candidate values using OCR confidence scores and bounding clarity.
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60 font-mono text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <div>• Entity Resolution: <span className="text-slate-700 dark:text-slate-300">Candidate scoring matrix</span></div>
                      <div>• Output: <span className="text-slate-700 dark:text-slate-300">Master Declarations + Coverage Score</span></div>
                    </div>
                  </div>
                </div>

                {/* 4. fieldExtractors.ts */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        <Search className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">fieldExtractors.ts</div>
                        <div className="text-[11px] text-slate-500 font-mono">src/lib/fieldExtractors.ts</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Main Function: </span>
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">extractAllLegalDeclarations()</code>
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      Statutory <SmartInfoTooltip term="Regex" meaning="A matching pattern used to find familiar text formats." example="It can find text that looks like an MRP or batch number." /> parser reading 11 mandatory declarations (MRP, Net Qty, Origin, Mfd Date, Address, USP).
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60 font-mono text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <div>• Anchors: <span className="text-slate-700 dark:text-slate-300">"Net Wt", "Mfd by", "₹", "Customer Care"</span></div>
                      <div>• Output: <span className="text-slate-700 dark:text-slate-300">Normalized field values + audit bounding box</span></div>
                    </div>
                  </div>
                </div>

                {/* 5. readabilityService.ts */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                        <Eye className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">readabilityService.ts</div>
                        <div className="text-[11px] text-slate-500 font-mono">src/lib/readabilityService.ts</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Main Function: </span>
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-amber-600 dark:text-amber-400">analyzeReadability(productData)</code>
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      Computes physical millimeter font height against statutory Principal Display Panel (PDP) thresholds and checks WCAG contrast.
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60 font-mono text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <div>• Font Height: <span className="text-slate-700 dark:text-slate-300">Font_mm = (BoxHeight_px / DPI) × 25.4</span></div>
                      <div>• Contrast: <span className="text-slate-700 dark:text-slate-300">(L1 + 0.05) / (L2 + 0.05) ≥ 4.5:1</span></div>
                    </div>
                  </div>
                </div>

                {/* 6. ruleEngineService.ts */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                        <Scale className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">ruleEngineService.ts</div>
                        <div className="text-[11px] text-slate-500 font-mono">src/lib/ruleEngineService.ts</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Main Function: </span>
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-rose-600 dark:text-rose-400">validateProduct(productData)</code>
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      Deterministic <SmartInfoTooltip term="Compliance Engine" meaning="Checks product details against official requirements." example="It flags a missing declaration for officer review." /> checking Schedule I MPE tolerances, Section 36 penalties, and mandatory field requirements.
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60 font-mono text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <div>• Output: <span className="text-slate-700 dark:text-slate-300">Compliance score (0-100) + auditEntries[]</span></div>
                      <div>• Penalties: <span className="text-slate-700 dark:text-slate-300">Estimates Section 36 statutory INR fines</span></div>
                    </div>
                  </div>
                </div>

                {/* 7. vision_service.py */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">vision_service.py</div>
                        <div className="text-[11px] text-slate-500 font-mono">backend/services/vision_service.py</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Main Function: </span>
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-purple-600 dark:text-purple-400">extract_statutory_declarations_hybrid()</code>
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      Circuit breaker cascade: Ollama Local Qwen2.5-VL ➔ Pollinations AI ➔ Google Gemini Flash Vision fallback.
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60 font-mono text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <div>• Resilience: <span className="text-slate-700 dark:text-slate-300">8s timeout with automatic cloud rollover</span></div>
                      <div>• Output: <span className="text-slate-700 dark:text-slate-300">(declarations_json, provider, latency)</span></div>
                    </div>
                  </div>
                </div>

                {/* 8. llm_validation_service.py */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">llm_validation_service.py</div>
                        <div className="text-[11px] text-slate-500 font-mono">backend/services/llm_validation_service.py</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Main Function: </span>
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-purple-600 dark:text-purple-400">augment_validation_with_llm()</code>
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      Confirmation pass: Batches only non-passing audit entries (&lt;450 tokens) to confirm violations and discard false alarms.
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60 font-mono text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <div>• Cost Control: <span className="text-slate-700 dark:text-slate-300">Passing rules are never sent to LLM</span></div>
                      <div>• Output: <span className="text-slate-700 dark:text-slate-300">Augmented audit entries with rationale</span></div>
                    </div>
                  </div>
                </div>

                {/* 9. ecommerce_crawler_service.py */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">ecommerce_crawler_service.py</div>
                        <div className="text-[11px] text-slate-500 font-mono">backend/services/ecommerce_crawler.py</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Main Class: </span>
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-orange-600 dark:text-orange-400">EcommerceCrawlerService</code>
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      Stealth marketplace DOM scraper parsing product specifications on Amazon, Flipkart, and Blinkit for deceptive origin flags.
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60 font-mono text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <div>• Origin Audit: <span className="text-slate-700 dark:text-slate-300">Detects local distributors masked as origins</span></div>
                      <div>• Methods: <span className="text-slate-700 dark:text-slate-300">crawl_product_url(), audit_marketplace_listing()</span></div>
                    </div>
                  </div>
                </div>

                {/* 10. hybrid_retriever.py */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                        <Binary className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">hybrid_retriever.py</div>
                        <div className="text-[11px] text-slate-500 font-mono">backend/services/retrieval/hybrid.py</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Main Class: </span>
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">HybridRetriever</code>
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      In-memory hybrid regulatory retriever fusing lexical BM25 term weighting with 64-dimensional character trigram cosine similarity.
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/60 font-mono text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <div>• Formula: <span className="text-slate-700 dark:text-slate-300">0.45 × BM25 + 0.55 × CosineSimilarity</span></div>
                      <div>• Latency: <span className="text-slate-700 dark:text-slate-300">&lt;20ms verbatim Section 36 citation retrieval</span></div>
                    </div>
                  </div>
                </div>

                {/* 11. email_service.py */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 hover:border-red-300 dark:hover:border-red-700 transition-colors md:col-span-2">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">email_service.py</div>
                        <div className="text-[11px] text-slate-500 font-mono">backend/services/email_service.py</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Main Function: </span>
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-red-600 dark:text-red-400">dispatch_compliance_notice()</code>
                      <p className="text-[11px] mt-1 leading-relaxed">
                        Exchanges Google OAuth2 refresh tokens for API bearer tokens, compiles RFC 2822 MIME multipart messages with attached PDF evidentiary notices.
                      </p>
                    </div>
                    <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 space-y-1 sm:border-l sm:border-slate-100 sm:dark:border-slate-800 sm:pl-3">
                      <div>• Endpoint: <span className="text-slate-700 dark:text-slate-300">gmail.googleapis.com/v1/users/me/messages/send</span></div>
                      <div>• SLA Tracking: <span className="text-slate-700 dark:text-slate-300">Binds 14-day statutory Show-Cause Notice deadline</span></div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Sleek Visual Call Graph (Clean Stepper UI instead of ASCII terminal box) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Workflow className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Runtime Function Call Graph &amp; Execution Pipeline
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Sequential control flow: Client User Action ➔ Microservice Persistence
                    </p>
                  </div>
                </div>

                {/* Step-by-Step Interactive Pipeline Flow */}
                <div className="space-y-3 pt-2">
                  
                  {/* Step 1 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-lg bg-slate-700 dark:bg-slate-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">Image Preprocessing Pipeline</span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">imagePreprocessor.ts</span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        <code className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">generatePreprocessingVariants()</code> generates 6 canvas matrix buffers via Rec. 709 luminance and Laplacian kernel.
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-lg bg-slate-700 dark:bg-slate-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">Parallel Optical Character Recognition</span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">ocrService.ts</span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        <code className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">processImageMultiPass()</code> invokes Tesseract WebAssembly worker pool, mapping words and baseline bounding boxes.
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-lg bg-slate-700 dark:bg-slate-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">Statutory Declaration Extraction</span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">fieldExtractors.ts</span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        <code className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">extractAllLegalDeclarations()</code> parses MRP, Net Quantity, Expiry, and Manufacturer candidates using statutory regex patterns.
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-lg bg-slate-700 dark:bg-slate-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      4
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">Compliance &amp; Readability Audit</span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">ruleEngineService.ts + readabilityService.ts</span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        <code className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">validateProduct()</code> checks Schedule I tolerances; <code className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">analyzeReadability()</code> verifies font mm thresholds and WCAG contrast.
                      </div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-lg bg-slate-700 dark:bg-slate-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      5
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">Hybrid Retrieval &amp; Secondary LLM Verification</span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">hybrid_retriever.py + llm_validation_service.py</span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        <code className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">HybridRetriever.retrieve()</code> retrieves verbatim Section 36 clauses; LLM confirmation pass verifies flagged violations.
                      </div>
                    </div>
                  </div>

                  {/* Step 6 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-lg bg-slate-700 dark:bg-slate-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      6
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">Notice Dispatch &amp; Relational Persistence</span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">email_service.py + db_models.py</span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        <code className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">dispatch_compliance_notice()</code> emails legal notice with PDF evidence; commits records to PostgreSQL database models.
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* SECTION 3: DATABASE SCHEMAS & DATA LAYER */}
            {/* ========================================================================= */}
            <section id="schemas" className="space-y-6 scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-bold font-mono text-base">
                    03
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      <SmartInfoTooltip term="Database Schemas & Data Models" meaning="The organised structure used to store and connect records." example="A product record can be linked to its scan and violation history." />
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono">
                    <SmartInfoTooltip term="SQLAlchemy ORM" meaning="A way to work with database records using familiar code objects." example="The product screen can save a product record without writing raw database commands." /> • File: backend/models/db_models.py
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30">
                    <SmartInfoTooltip term="PostgreSQL" meaning="A database that stores structured records reliably." example="It stores products, scans, violations, and notices." /> / <SmartInfoTooltip term="SQLite" meaning="A small local database used for lightweight storage." example="It can keep inspection data available during an offline demo." />
                  </span>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                The <SmartInfoTooltip term="Database Layer" meaning="The part that stores and retrieves system records." example="It saves products, scans, complaints, and notices." /> is powered by SQLAlchemy 2.0 ORM models in <code className="font-mono text-emerald-600 dark:text-emerald-400">backend/models/db_models.py</code>, tracking manufacturers, products, OCR scans, violations, and notices with <SmartInfoTooltip term="Foreign Keys" meaning="Links one record to a related record." example="A scan can point back to the product it checked." /> and query indexes.
              </p>

              {/* Clean Table-based Database Entity Cards (No black boxes) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. products table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">products</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">ProductModel</span>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">id</span>
                      <span className="text-slate-400">VARCHAR(64) <span className="text-blue-600 font-bold">[PK]</span></span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">sku</span>
                      <span className="text-slate-400">VARCHAR(64) <span className="text-emerald-600 font-bold">[UNIQUE]</span></span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-900 dark:text-slate-200">manufacturer_id</span>
                      <span className="text-slate-400">VARCHAR(64) <span className="text-amber-600 font-bold">[FK]</span></span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-900 dark:text-slate-200">mrp / listed_price</span>
                      <span className="text-slate-400">FLOAT</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-900 dark:text-slate-200">compliance_score</span>
                      <span className="text-slate-400">INTEGER (0-100)</span>
                    </div>
                  </div>
                </div>

                {/* 2. violations table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">violations</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">ViolationModel</span>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">id</span>
                      <span className="text-slate-400">VARCHAR(64) <span className="text-blue-600 font-bold">[PK]</span></span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">case_number</span>
                      <span className="text-slate-400">VARCHAR(64) <span className="text-emerald-600 font-bold">[UNIQUE]</span></span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-900 dark:text-slate-200">product_id</span>
                      <span className="text-slate-400">VARCHAR(64) <span className="text-amber-600 font-bold">[FK]</span></span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-900 dark:text-slate-200">rule_code</span>
                      <span className="text-slate-400">VARCHAR(64) [INDEX]</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-900 dark:text-slate-200">penalty_estimate</span>
                      <span className="text-slate-400">FLOAT (INR)</span>
                    </div>
                  </div>
                </div>

                {/* 3. manufacturers table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">manufacturers</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">ManufacturerModel</span>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">id</span>
                      <span className="text-slate-400">VARCHAR(64) <span className="text-blue-600 font-bold">[PK]</span></span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">cin / gstin</span>
                      <span className="text-slate-400">VARCHAR(32) <span className="text-emerald-600 font-bold">[UNIQUE]</span></span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-900 dark:text-slate-200">risk_tier</span>
                      <span className="text-slate-400">VARCHAR(32) (Tier 1-4)</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-900 dark:text-slate-200">repeat_offender</span>
                      <span className="text-slate-400">BOOLEAN</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-900 dark:text-slate-200">active_violations</span>
                      <span className="text-slate-400">INTEGER</span>
                    </div>
                  </div>
                </div>

                {/* 4. ocr_scans table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">ocr_scans</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">OCRScanModel</span>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">id</span>
                      <span className="text-slate-400">VARCHAR(64) <span className="text-blue-600 font-bold">[PK]</span></span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-900 dark:text-slate-200">product_id</span>
                      <span className="text-slate-400">VARCHAR(64) <span className="text-amber-600 font-bold">[FK]</span></span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-900 dark:text-slate-200">ocr_engine</span>
                      <span className="text-slate-400">VARCHAR(64) (WASM/Vision)</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-900 dark:text-slate-200">confidence_score</span>
                      <span className="text-slate-400">FLOAT (0-100)</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-900 dark:text-slate-200">extracted_params</span>
                      <span className="text-slate-400">JSON</span>
                    </div>
                  </div>
                </div>

              </div>
            </section>

          </main>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
};

export default SystemArchitecturePage;
