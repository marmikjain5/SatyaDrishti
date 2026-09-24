import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Database,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  MapPin,
  Flame,
  Scale,
  Share2,
  Bookmark,
  ChevronRight,
  Code2,
  Eye,
  Zap,
  Globe,
  Users,
  Terminal,
  Clock
} from 'lucide-react';
import { LandingNavbar } from '../components/layout/LandingNavbar';
import { LandingFooter } from '../components/layout/LandingFooter';
import { Button } from '../components/ui/Button';

export const TechnicalBlogPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('inspiration');

  const sections = [
    { id: 'inspiration', title: '1. Inspiration: The Hidden Challenge' },
    { id: 'problem-scope', title: '2. The Problem Became Bigger Than Expected' },
    { id: 'first-mistake', title: '3. Our First Mistake: Vision LLMs' },
    { id: 'architecture-pivot', title: '4. The Decision That Changed Everything' },
    { id: 'legal-knowledge', title: '5. The Statutory Knowledge Layer (RAG)' },
    { id: 'relative-font', title: '6. The Question That Ruined Our Weekend' },
    { id: 'ecommerce-crawler', title: '7. When E-Commerce Entered' },
    { id: 'crowdsourced', title: '8. Inspectors Can\'t Be Everywhere' },
    { id: 'gis-risk', title: '9. GIS Risk Intelligence & Heatmaps' },
    { id: 'lessons-future', title: '10. What We Learned & What\'s Next' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
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

      {/* Hero Banner Header */}
      <header className="relative pt-10 pb-14 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-white via-slate-50 to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-[#020617] overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-500/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <Link to="/about" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 transition-colors">
              <span>About Platform</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <span className="text-slate-400 dark:text-slate-600 text-xs">/</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Engineering Blog</span>
          </div>

          <div className="max-w-4xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>SatyaDrishti Technical Case Study &amp; Architecture Journey</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              SatyaDrishti — <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 dark:from-blue-400 dark:via-sky-300 dark:to-indigo-400">The Beginning</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              An inside look into how our team built an autonomous legal metrology compliance platform — solving low-contrast OCR, eliminating vision model hallucinations with deterministic rule engines, engineering a versioned statutory RAG pipeline, and scaling GIS risk intelligence.
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                  SS
                </div>
                <div>
                  <div className="text-slate-900 dark:text-white font-sans font-semibold">SatyaSetu Core Team</div>
                  <div className="text-[10px] text-slate-500">SIH National Finalists</div>
                </div>
              </div>
              <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-800 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                <span>11 Min Read</span>
              </div>
              <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-800 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Legal Metrology (Packaged Commodities) Rules 2011</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout with Sticky Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Sticky Left Table of Contents */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24 space-y-6">
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-sm dark:shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Table of Contents</span>
              </h3>
              <nav className="space-y-1">
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                      activeSection === sec.id
                        ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="truncate">{sec.title}</span>
                    {activeSection === sec.id && (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Quick Tech Stack Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-slate-900 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Cpu className="h-4 w-4" />
                <span>Tech Stack Highlights</span>
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 font-mono">
                <li>• Multi-Pass Tesseract OCR</li>
                <li>• Pollinations AI Text LLM</li>
                <li>• Hybrid Vector RAG (BM25 + Cosine)</li>
                <li>• Deterministic Rule Engine</li>
                <li>• GIS Risk Surveillance</li>
                <li>• FastAPI + React + Tailwind</li>
              </ul>
            </div>
          </aside>

          {/* Center Blog Article Content */}
          <main className="lg:col-span-9 space-y-14 text-slate-700 dark:text-slate-300 text-base leading-relaxed">

            {/* SECTION 1 */}
            <section id="inspiration" className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 font-bold font-mono text-sm">
                  01
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Inspiration — The Hidden Compliance Challenge
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  A missing MRP. An unreadable manufacturer address. A net quantity declaration that doesn't match the rules.
                </p>
                <p>
                  Individually, these seem like small mistakes. But when multiplied across millions of packaged products sold every day — on supermarket shelves, local Kirana stores, Amazon, Flipkart, Blinkit, and Zepto — they become a massive compliance challenge.
                </p>

                <div className="my-6 p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 space-y-2">
                  <p className="font-semibold text-blue-900 dark:text-blue-200 text-base">
                    "The surprising part wasn't that violations existed. The surprising part was how they were being found."
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    In most cases, a compliance inspection still begins with an enforcement inspector holding a physical product in one hand and a thick printed rulebook in the other.
                  </p>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs text-slate-800 dark:text-slate-300 my-4">
                  <li className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-xs">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Every declaration checked manually</span>
                  </li>
                  <li className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-xs">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Every violation interpreted manually</span>
                  </li>
                  <li className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-xs">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Every inspection report written manually</span>
                  </li>
                  <li className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-xs">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Every verdict dependent on officer availability</span>
                  </li>
                </ul>

                <p>
                  As we studied the <strong className="text-slate-900 dark:text-white">Legal Metrology (Packaged Commodities) Rules, 2011</strong>, we realized something important:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
                    <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">System 1: The Product Label</div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">Product labels have structure. They describe what is actually printed on packaging surfaces.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">System 2: Statutory Regulations</div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">The law also has structure. It prescribes exactly what should be printed under legal clauses.</p>
                  </div>
                </div>

                <p className="text-lg font-medium text-slate-900 dark:text-white italic">
                  Comparing two structured systems is exactly the kind of problem software can solve. That realization became the starting point of SatyaDrishti.
                </p>
              </div>

              {/* Graphic Mockup Card 1 */}
              <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-sm">SATYADRISHTI CORE VISION</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/20">
                    AUTOMATED VERIFICATION
                  </span>
                </div>
                <div className="text-center py-6 space-y-3">
                  <div className="inline-block p-4 rounded-full bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400">
                    <Eye className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Autonomous Intelligence for Statutory Packaging Verification</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                    Bridging cutting-edge optical recognition with statutory consumer laws to ensure transparency, consumer safety, and mandatory compliance enforcement.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-slate-200 dark:border-slate-800/80" />

            {/* SECTION 2 */}
            <section id="problem-scope" className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 font-bold font-mono text-sm">
                  02
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  The Problem Became Bigger Than We Expected
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  Initially, we thought the challenge was straightforward:
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-300 py-2">
                  <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">1. Take a Picture</span>
                  <span>→</span>
                  <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">2. Run OCR</span>
                  <span>→</span>
                  <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">3. Extract Text</span>
                  <span>→</span>
                  <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">4. Compare Rules</span>
                  <span>→</span>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold">5. Verdict</span>
                </div>

                <p>
                  Simple, right? Until we started analyzing real-world retail products in supermarket sweeps:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400">Curved Surface Distortion</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Labels wrapped tightly around cylindrical bottles warped OCR character dimensions.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400">Dot-Matrix Stamps</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Low-contrast dot-matrix batch codes &amp; MFD stamps were barely legible even to human eyes.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400">Multi-Surface Division</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Mandatory information was split across front PDP, side panels, and top carton flaps.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400">E-Commerce Discrepancies</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">A product physically compliant in a store had missing declarations on its Amazon listing.</p>
                  </div>
                </div>

                <p>
                  Suddenly, the challenge wasn't just reading labels — it was understanding compliance across both physical retail and digital marketplaces. That changed the scope of the project completely.
                </p>
              </div>
            </section>

            <hr className="border-slate-200 dark:border-slate-800/80" />

            {/* SECTION 3 */}
            <section id="first-mistake" className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-bold font-mono text-sm">
                  03
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Our First Mistake — Relying Solely on End-to-End Vision Models
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  When we started building SatyaDrishti, we believed the fastest solution would be to let a multimodal vision LLM handle everything — extract declarations, interpret the label context, and directly output whether the product was compliant.
                </p>
                <p>
                  For the first few days, this approach seemed promising. We would upload a product image, receive formatted information, and even get explanations for potential violations. The results looked convincing during initial demos.
                </p>

                <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 space-y-3">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
                    <AlertTriangle className="h-5 w-5" />
                    <span>The Reliability Flaw: Probabilistic Compliance vs Legal Rigor</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    The problem appeared when we started testing the exact same product multiple times and comparing the output with actual Legal Metrology rules. Sometimes the model highlighted the correct issue but referenced a different clause. In a few cases, it interpreted the same declaration differently depending on how the image was cropped or illuminated.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-slate-200 dark:border-slate-800/80" />

            {/* SECTION 4 */}
            <section id="architecture-pivot" className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-bold font-mono text-sm">
                  04
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  The Decision That Changed Everything — Deterministic Rules vs AI
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  Even if a vision model was correct 95% of the time, a statutory compliance verdict could not depend on probability. An enforcement officer reviewing the same product twice must arrive at the exact same conclusion. Our platform needed to guarantee that same consistency.
                </p>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60 border border-blue-200 dark:border-blue-800/60 space-y-3 shadow-xs">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Scale className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span>The Architectural Pivot</span>
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    Instead of allowing AI to decide legal compliance, we restricted its responsibility strictly to <strong>extracting and organizing text from packaging labels</strong>. The final compliance verdict would always come from a <strong>deterministic rule engine</strong> built directly on version-controlled Legal Metrology regulations.
                  </p>
                </div>

                {/* Mockup 2: Rule Versioning & Verification Table */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">RULE VERSION HISTORY &amp; DETERMINISTIC ADJUDICATION</span>
                    </div>
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-mono font-semibold">Active Version: v2.0</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60">
                          <th className="p-2.5">Clause Ref</th>
                          <th className="p-2.5">Rule Summary</th>
                          <th className="p-2.5">Statutory Standard</th>
                          <th className="p-2.5">Engine Verdict</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                        <tr>
                          <td className="p-2.5 font-bold text-blue-600 dark:text-blue-400">PCR-2026-R6(1)(q)</td>
                          <td className="p-2.5">Mandatory Dual QR Code &amp; Gazette Verification</td>
                          <td className="p-2.5 text-slate-500 dark:text-slate-400">Rule 6(1)(q) G.S.R 882(E)</td>
                          <td className="p-2.5"><span className="text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded font-bold">COMPLIANT</span></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-blue-600 dark:text-blue-400">PCR-2011-R6(1)(c)</td>
                          <td className="p-2.5">Maximum Retail Price (MRP) Mandatory Declaration</td>
                          <td className="p-2.5 text-slate-500 dark:text-slate-400">Rule 6(1)(c) Incl. of all taxes</td>
                          <td className="p-2.5"><span className="text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded font-bold">COMPLIANT</span></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-blue-600 dark:text-blue-400">PCR-2011-R6(1)(a)-IMP</td>
                          <td className="p-2.5">Importer / Packer Name &amp; Full Address with PIN</td>
                          <td className="p-2.5 text-slate-500 dark:text-slate-400">Rule 6(1)(a) Mandatory Address</td>
                          <td className="p-2.5"><span className="text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-500/10 px-2 py-0.5 rounded font-bold">MISSING PIN</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-200 dark:border-slate-800/80" />

            {/* SECTION 5 */}
            <section id="legal-knowledge" className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 font-bold font-mono text-sm">
                  05
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  The Question That Forced Us To Think Differently
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  As we moved deeper into the project, something interesting started happening. The toughest challenges didn't come from the code — they came from the questions people asked us during evaluations.
                </p>

                <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 space-y-2">
                  <div className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider font-mono">College SIH Evaluation Moment</div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white italic">
                    "What is your database? Where does your legal knowledge come from?"
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    When asked, we initially started explaining PostgreSQL, Supabase, and violation records. The judge clarified: <em>"Where does your legal knowledge come from when laws change?"</em> The room went silent.
                  </p>
                </div>

                <p>
                  That single question completely changed how we looked at the platform. Laws change. Gazette notifications are issued. Amendments become active. Rules get superseded. A static database was never going to be enough.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                    <div className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                      <Database className="h-4 w-4" />
                      <span>1. Ingestion Layer</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Ingests gazette notifications, Legal Metrology amendments, and FSSAI rules into a structured repository.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Search className="h-4 w-4" />
                      <span>2. Hybrid RAG Retrieval</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Combines BM25 keyword matching with 64D dense vector similarity to surface applicable clauses.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                    <div className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>3. Version Resolver</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Ensures only regulations active on the product's manufacturing date are evaluated.</p>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-200 dark:border-slate-800/80" />

            {/* SECTION 6 */}
            <section id="relative-font" className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 font-bold font-mono text-sm">
                  06
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  The Question That Ruined Our Weekend — Relative Font Geometry
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  Another challenge arrived from a discussion that initially sounded almost trivial. A teammate asked:
                </p>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 font-mono text-xs shadow-xs">
                  "Your system checks font readability, right? What happens if I zoom into the image before uploading it?"
                </div>

                <p>
                  Suddenly the problem became exponentially harder. Imagine two users uploading the same product. One uploads the full photo, while the other uploads a heavily zoomed-in crop. The font hasn't changed on the package, but the pixel height has quadrupled!
                </p>

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono">The Mindset Shift</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40">
                      <div className="text-xs font-bold text-red-600 dark:text-red-400 line-through">Old Question</div>
                      <div className="text-sm font-mono text-slate-900 dark:text-white mt-1">"How big is the text in the image pixels?"</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">New Correct Question</div>
                      <div className="text-sm font-mono text-slate-900 dark:text-white mt-1">"How big is the text relative to the overall package size?"</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-2">
                    Rather than relying on raw pixel measurements, we began normalizing extracted text box dimensions against overall package surface bounding polygons. The law evaluates the physical package, not the camera zoom level.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-slate-200 dark:border-slate-800/80" />

            {/* SECTION 7 */}
            <section id="ecommerce-crawler" className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 font-bold font-mono text-sm">
                  07
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  When E-Commerce Entered The Conversation
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  As we expanded our focus to online marketplaces (Amazon, Flipkart, Blinkit, Zepto, Meesho), we assumed digital products would be easier. After all, information is stored as structured web text.
                </p>
                <p>
                  The reality was very different. Information was scattered across specification tables, embedded in promotional images, or buried in seller bullet points. What made it harder was that <em>missing information did not always mean a violation</em> — sometimes a page loaded incompletely.
                </p>

                {/* E-Commerce Crawler Mockup Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">AUTONOMOUS E-COMMERCE COMPLIANCE CRAWLER</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-semibold">LIVE CRAWL STREAM</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-2">
                    <div className="text-slate-600 dark:text-slate-400">Target URL: <span className="text-sky-600 dark:text-sky-300 font-semibold">https://www.amazon.in/dp/B08L7V... (Fortune Sunflower Oil 1L)</span></div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><span className="text-slate-500">Declared MRP:</span> <span className="text-slate-900 dark:text-white font-bold">₹139.00</span></div>
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><span className="text-slate-500">Net Vol:</span> <span className="text-slate-900 dark:text-white font-bold">1 L (810g)</span></div>
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><span className="text-slate-500">Origin:</span> <span className="text-emerald-600 dark:text-emerald-400 font-bold">India</span></div>
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><span className="text-slate-500">Compliance:</span> <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Compliant</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-200 dark:border-slate-800/80" />

            {/* SECTION 8 */}
            <section id="crowdsourced" className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 font-bold font-mono text-sm">
                  08
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  The Moment We Realized Inspectors Can't Be Everywhere
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  India has millions of packaged products moving through stores, warehouses, and e-commerce fulfillment centers every day. Even the most efficient inspection team cannot physically inspect everything.
                </p>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 border border-indigo-200 dark:border-indigo-800/50 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                    <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Crowd-Sourced Consumer Complaint Network</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    We built a dedicated Consumer Complaint Portal allowing citizens to scan a product or upload photographic evidence. Submissions enter the exact same statutory compliance pipeline used by enforcement officers. If a violation is detected, it is automatically tagged with GPS location and routed to the Zonal Inspector Dashboard for on-site verification.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-slate-200 dark:border-slate-800/80" />

            {/* SECTION 9 */}
            <section id="gis-risk" className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-bold font-mono text-sm">
                  09
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  From Individual Violations To GIS Compliance Intelligence
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  Finding a single violation is useful. Finding patterns across an entire state is powerful.
                </p>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">MANUFACTURER &amp; SELLER GIS RISK INTELLIGENCE</span>
                    </div>
                    <span className="text-[10px] bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 px-2 py-0.5 rounded font-mono font-semibold">BENGALURU INDUSTRIAL CORRIDOR</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-slate-500 text-[10px]">CRITICAL TIER (80+)</div>
                      <div className="text-red-600 dark:text-red-400 font-bold text-lg">1 Offender</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Flagged for Zonal Raid</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-slate-500 text-[10px]">REPEAT OFFENCE RATE</div>
                      <div className="text-amber-600 dark:text-amber-400 font-bold text-lg">30% Rate</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Cross-Platform Recurrence</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-slate-500 text-[10px]">TOTAL SCN NOTICES</div>
                      <div className="text-slate-900 dark:text-white font-bold text-lg">10 Notices</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Under Sec 36 LM Act 2009</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-200 dark:border-slate-800/80" />

            {/* SECTION 10 */}
            <section id="lessons-future" className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 font-bold font-mono text-sm">
                  10
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  What We Learned &amp; What's Next for SatyaDrishti
                </h2>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 shadow-md dark:shadow-2xl">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span>The Ultimate Lesson: Defining System Boundaries</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-blue-700 dark:text-blue-400">AI Responsibilities</div>
                      <ul className="text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                        <li>• Reading label text</li>
                        <li>• Extracting key declarations</li>
                        <li>• Auto-correcting OCR typos</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-emerald-700 dark:text-emerald-400">Deterministic Engine</div>
                      <ul className="text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                        <li>• Interpreting legal clauses</li>
                        <li>• Applying metric thresholds</li>
                        <li>• Generating compliance verdicts</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-purple-700 dark:text-purple-400">Human Officers</div>
                      <ul className="text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                        <li>• Reviewing enforcement raids</li>
                        <li>• Handling appeals/disputes</li>
                        <li>• Issuing final legal SCN notices</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Future Roadmap Grid */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">Engineering Roadmap</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                      <div className="font-bold text-slate-900 dark:text-white">Multi-Model Database Architecture</div>
                      <p className="text-slate-600 dark:text-slate-400">Unified storage layer across PostgreSQL, geospatial indexing, and graph relationship structures.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                      <div className="font-bold text-slate-900 dark:text-white">Real-Time Event Processing (Kafka/Redis)</div>
                      <p className="text-slate-600 dark:text-slate-400">Message brokers for large-scale async inspection streams and automated SCN notification dispatch.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                      <div className="font-bold text-slate-900 dark:text-white">Prometheus &amp; Grafana Observability</div>
                      <p className="text-slate-400">Centralized metrics monitoring for compliance throughput and API response latencies.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                      <div className="font-bold text-slate-900 dark:text-white">3D Packaging Surface Reconstruction</div>
                      <p className="text-slate-600 dark:text-slate-400">Future support for cylindrical and curved packaging normalization to eliminate angular OCR skew.</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Call to Action */}
                <div className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/40 dark:via-indigo-900/50 dark:to-purple-900/40 border border-blue-200 dark:border-blue-500/30 text-center space-y-4 shadow-lg dark:shadow-2xl">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Experience SatyaDrishti Live in Action</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
                    Test the real OCR + Pollinations AI LLM statutory packaging verification engine or explore the public product directory.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                    <Link to="/directory">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-3 px-7 py-3.5 sm:px-8 sm:py-4 rounded-xl font-bold text-sm sm:text-base text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all border border-blue-400/30 cursor-pointer"
                      >
                        <ShieldCheck className="h-5 w-5 text-blue-100 shrink-0" />
                        <span>Product Verification Directory</span>
                      </button>
                    </Link>
                    <Link to="/about">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-3 px-7 py-3.5 sm:px-8 sm:py-4 rounded-xl font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-md hover:shadow-lg border border-slate-300 dark:border-slate-700 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                      >
                        <span>Back to About Platform</span>
                      </button>
                    </Link>
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

export default TechnicalBlogPage;
