import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
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
  ChevronLeft,
  Folder,
  Maximize2,
  Minimize2,
  Code2,
  Eye,
  Zap,
  Globe,
  Users,
  Terminal,
  Clock
} from 'lucide-react';
import { LandingFooter } from '../components/layout/LandingFooter';
import { LandingNavbar } from '../components/layout/LandingNavbar';
import { Button } from '../components/ui/Button';
import { LiveSystemArchitecture } from '../components/architecture/LiveSystemArchitecture';
import './technical-blog.css';

export const TechnicalBlogPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('inspiration');
  const [readingProgress, setReadingProgress] = useState(0);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen?.();
      return;
    }
    if (shellRef.current?.requestFullscreen) {
      await shellRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    const updateReadingProgress = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
      setReadingProgress(Math.min(100, Math.max(0, nextProgress)));
    };

    const revealObserver = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' },
    );

    document.querySelectorAll('.blog-page section, .blog-page .blog-feature').forEach((element) => {
      revealObserver.observe(element);
    });

    const articleImages = Array.from(document.querySelectorAll<HTMLImageElement>('.blog-article img'));
    const markImageLoaded = (image: HTMLImageElement) => image.classList.add('is-loaded');
    const updateImageParallax = () => {
      articleImages.forEach((image) => {
        const distanceFromCenter = image.getBoundingClientRect().top + image.offsetHeight / 2 - window.innerHeight / 2;
        image.style.setProperty('--image-shift', `${Math.max(-12, Math.min(12, distanceFromCenter * -0.025))}px`);
      });
    };

    articleImages.forEach((image) => {
      if (image.complete) markImageLoaded(image);
      else image.addEventListener('load', () => markImageLoaded(image), { once: true });
    });
    updateReadingProgress();
    updateImageParallax();
    window.addEventListener('scroll', updateReadingProgress, { passive: true });
    window.addEventListener('scroll', updateImageParallax, { passive: true });
    window.addEventListener('resize', updateReadingProgress);
    window.addEventListener('resize', updateImageParallax);

    return () => {
      revealObserver.disconnect();
      window.removeEventListener('scroll', updateReadingProgress);
      window.removeEventListener('scroll', updateImageParallax);
      window.removeEventListener('resize', updateReadingProgress);
      window.removeEventListener('resize', updateImageParallax);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`gdoc-shell blog-page min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 selection:bg-blue-600 selection:text-white ${isFullscreen ? 'gdoc-fullscreen' : ''}`} ref={shellRef}>
      <LandingNavbar />
      <div className="blog-progress" style={{ '--progress': `${readingProgress}%` } as React.CSSProperties} aria-hidden="true" />

      <div className="gdoc-topbar">
        <div className="gdoc-file-icon"><FileText size={25} strokeWidth={1.7} /></div>
        <div className="gdoc-title-wrap">
          <input aria-label="Document title" defaultValue="SatyaDrishti  -  Blog" />
          <div className="gdoc-file-meta"><span>Technical documentation</span><span>Updated October 2026</span></div>
        </div>
        <div className="gdoc-top-actions">
          <button
            type="button"
            className="gdoc-icon-button"
            title={isFullscreen ? 'Exit full screen' : 'View document full screen'}
            aria-label={isFullscreen ? 'Exit full screen' : 'View document full screen'}
            aria-pressed={isFullscreen}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      <div className="gdoc-workspace">
        {outlineOpen ? (
          <aside className="gdoc-outline" aria-label="Document outline">
            <div className="gdoc-outline-title">
              <span>Document outline</span>
              <button type="button" title="Collapse outline" aria-label="Collapse document outline" onClick={() => setOutlineOpen(false)}>
                <ChevronLeft size={16} />
              </button>
            </div>
            <div className="gdoc-outline-list">
              {sections.map((section) => (
                <button key={section.id} type="button" className={`gdoc-outline-item ${activeSection === section.id ? 'active' : ''}`} onClick={() => scrollToSection(section.id)}>
                  {section.title}
                </button>
              ))}
            </div>
            <div className="gdoc-outline-footer"><Folder size={15} /> Technical documentation</div>
          </aside>
        ) : (
          <button type="button" className="gdoc-outline-reopen" title="Show document outline" aria-label="Show document outline" onClick={() => setOutlineOpen(true)}>
            <ChevronRight size={17} />
          </button>
        )}

        <div className="gdoc-editor-wrap">
          <main className="gdoc-editor">

      {/* Hero Banner Header */}
      <header className="blog-hero relative pt-10 pb-14 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-white via-slate-50 to-[#F8FAFC] dark:from-slate-950 dark:via-slate-900 dark:to-[#020617] overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-500/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="blog-hero-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="blog-hero-copy max-w-4xl space-y-5">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              SatyaDrishti  -  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 dark:from-blue-400 dark:via-sky-300 dark:to-indigo-400">The Beginning</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              An inside look into how our team engineered an autonomous compliance checking system for packaged commodities under the <strong>Legal Metrology Act, 2009</strong> and the <strong>Legal Metrology (Packaged Commodities) Rules, 2011</strong>  -  combining Computer Vision (CV), multi-pass OCR, Multimodal Vision-Language Models (VLMs), Named Entity Recognition (NER), font size &amp; readability analysis (Rule 7 &amp; 9), zero-hallucination deterministic rule engines, digital PDF inspection reports, and scalable GIS enforcement intelligence.
            </p>

          </div>

          <div className="blog-hero-index" aria-label="Article sections">
            <div className="blog-hero-index-label">Inside the case study</div>
            <nav>
              {sections.map((section) => (
                <button key={section.id} type="button" onClick={() => scrollToSection(section.id)}>
                  <span>{section.title.replace(/^\d+\.\s*/, '')}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Article Content */}
      <div className="blog-shell max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="blog-layout grid grid-cols-1 items-start">
          
          {/* Sticky Left Table of Contents */}
          <aside className="hidden">
            {/* Quick Tech Stack Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-slate-900 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Cpu className="h-4 w-4" />
                <span>Tech Stack &amp; Regulatory Highlights</span>
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 font-mono">
                <li>• Multi-Pass Tesseract OCR &amp; OpenCV</li>
                <li>• Multimodal Vision LLMs (Pollinations / Ollama)</li>
                <li>• Statutory Named Entity Recognition (NER)</li>
                <li>• Font Size &amp; Readability Analysis (Rule 7/9)</li>
                <li>• Deterministic Rule Engine (PCR 2011)</li>
                <li>• Hybrid Statutory RAG (BM25 + Cosine)</li>
                <li>• Digital Compliance Reports (PDF Export)</li>
                <li>• Enforcement Official Dashboards &amp; GIS</li>
                <li>• Offline Inspection Queue (PWA Background Sync)</li>
              </ul>
            </div>
          </aside>

          {/* Blog Article Content */}
          <main className="blog-article mx-auto w-full space-y-14 text-slate-700 dark:text-slate-300 text-base leading-relaxed">

            {/* SECTION 1 */}
            <section id="inspiration" className="space-y-6 scroll-mt-24">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 font-bold font-mono text-sm">
                  01
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Inspiration  -  The Hidden Compliance Challenge
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  Packaged commodities are widely sold through retail stores, supermarkets, and e-commerce platforms across India. Under the <strong className="text-slate-900 dark:text-white">Legal Metrology Act, 2009</strong> and the <strong className="text-slate-900 dark:text-white">Legal Metrology (Packaged Commodities) Rules, 2011 (LMPC Rules)</strong>, every packaged commodity is statutorily required to bear mandatory declarations in a specified format and manner:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 my-3 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">1. Rule 6(1)(a):</span> Name and complete address of manufacturer, packer, or importer
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">2. Rule 6(1)(b):</span> Net quantity with standard metric units &amp; Schedule I MPE compliance
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">3. Rule 6(1)(c):</span> Maximum Retail Price (MRP) incl. of all taxes &amp; unit sale price
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">4. Rule 6(1)(d):</span> Month and year of manufacture, packing, or import
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">5. Rule 6(1)(e):</span> Consumer care contact details (telephone, email, postal address)
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">6. Rule 6(1)(f):</span> Country of origin &amp; prescribed font size/readability (Rule 7 &amp; 9)
                  </div>
                </div>

                <p>
                  These declarations are critical for ensuring market transparency, fair trade practices, and consumer protection. However, due to the astronomical volume and variety of packaged products available in supermarkets, local Kirana stores, and digital marketplaces (Amazon, Flipkart, Blinkit, Zepto, Meesho), manual inspection and compliance checking by enforcement agencies becomes time-consuming and resource-intensive.
                </p>

                <blockquote className="blog-pullquote my-6 p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 space-y-2">
                  <p className="font-semibold text-blue-900 dark:text-blue-200 text-base">
                    "Non-compliances such as missing declarations, incorrect font sizes, improper MRP declarations, and dual pricing frequently escape detection under manual enforcement."
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    In traditional enforcement, a field inspection requires officers to manually cross-reference complex statutory schedules, compute numeral height millimeter standards with calipers, and hand-write violation notices.
                  </p>
                </blockquote>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs text-slate-800 dark:text-slate-300 my-4">
                  <li className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-xs">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Every mandatory declaration checked manually</span>
                  </li>
                  <li className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-xs">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Font size and readability interpreted subjectively</span>
                  </li>
                  <li className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-xs">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Digital compliance reports drafted manually</span>
                  </li>
                  <li className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-xs">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Inspection history trapped in disconnected paper logs</span>
                  </li>
                </ul>

                <p>
                  As we studied the <strong className="text-slate-900 dark:text-white">Legal Metrology (Packaged Commodities) Rules, 2011</strong>, we realized that both domains are fundamentally structured:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
                    <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">System 1: The Packaged Commodity Label</div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">Package surfaces and product listings contain structured spatial text: MRP, net quantity, manufacturer address, and manufacturing dates.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">System 2: Statutory Legal Metrology Rules</div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">The statutory law prescribes exact standards: mandatory fields, minimum font size relative to PDP area, and Schedule I permissible error limits.</p>
                  </div>
                </div>

                <p className="text-lg font-medium text-slate-900 dark:text-white italic">
                  Developing an automated software system capable of scanning packaged commodity labels, product images, and product listings to detect, extract, and validate mandatory declarations - and instantly flag violations - became our defining problem statement.
                </p>
              </div>

              {/* Graphic Mockup Card 1 */}
              <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-sm">SATYADRISHTI CORE VISION &amp; COMPLIANCE SCOPE</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/20">
                    AUTOMATED REGULATORY VERIFICATION
                  </span>
                </div>
                <div className="text-center py-6 space-y-3">
                  <div className="inline-block p-4 rounded-full bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400">
                    <Eye className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Automated Compliance Checking for Legal Metrology Rules, 2011</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                    Scanning packaged commodity labels, product images, and e-commerce listings to automatically detect mandatory declarations, verify font size &amp; readability, and generate digital compliance reports.
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
                  Initially, our architecture outlined a direct linear pipeline:
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-300 py-2">
                  <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">1. Image Upload &amp; Scanning</span>
                  <span>→</span>
                  <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">2. Computer Vision &amp; OCR</span>
                  <span>→</span>
                  <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">3. Mandatory Declaration Extraction</span>
                  <span>→</span>
                  <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">4. Rule 2011 Validation</span>
                  <span>→</span>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold">5. Digital Compliance Report PDF</span>
                </div>

                <p>
                  However, when we deployed test scans across supermarket shelves and physical retail stores, the operational realities of packaged commodities exposed key edge cases:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400">Curved Surface Distortion &amp; Placement</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Labels wrapped tightly around cylindrical cans and pouches warped text aspect ratios, distorting font size and readability analysis.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400">Low-Contrast Dot-Matrix Stamps</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Dot-matrix batch codes, manufacturing dates, and MRP stamps required OpenCV adaptive thresholding to accurately verify completeness.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400">Multi-Surface Principal Display Panel (PDP)</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Mandatory information was distributed across front PDP, side panels, and top flaps, necessitating multi-image photograph attachments.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400">E-Commerce Product Listing Discrepancies</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Digital listings on Amazon, Flipkart, and Blinkit showed missing declarations, omitted unit sale prices, and deceptive claims.</p>
                  </div>
                </div>

                <p>
                  Suddenly, the software system needed to support full end-to-end statutory enforcement: automated detection, extraction, and validation of mandatory declarations; font size and readability analysis; missing or misleading declaration detection; generation of compliance reports and violation summaries in PDF and editable formats; maintaining a repository of scanned products and compliance history; and providing role-based dashboards for enforcement officials.
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
                  Our First Mistake  -  Relying Solely on End-to-End Vision Models
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  When we began building the automated declaration extraction and validation pipeline, we hypothesized that modern Multimodal Vision-Language Models (VLMs) and Vision Transformers (ViT) could autonomously handle both visual packaging perception and statutory compliance checking in a single inference pass.
                </p>
                <p>
                  We tested end-to-end multimodal deep learning models (such as Pollinations AI and Ollama Qwen2.5-VL) on raw packaged commodity photos. The models performed remarkably well at Computer Vision (CV) tasks: detecting packaging boundaries, recognizing brand typography, extracting text from irregular packaging shapes, and locating mandatory declaration fields like MRP, net quantity, and manufacturer address.
                </p>

                <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 space-y-3">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
                    <AlertTriangle className="h-5 w-5" />
                    <span>The Reliability Flaw: Probabilistic AI vs Statutory Legal Metrology Rigor</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    The fundamental issue emerged when we tested the exact same packaged commodity under varying lighting conditions, camera angles, and crops. While the deep learning model identified mandatory declarations, its compliance verdicts were probabilistic. Sometimes it cited Rule 6(1)(a) correctly; other times it hallucinated sub-clauses, miscalculated font size height ratios, or applied subjective tolerances to Schedule I Maximum Permissible Error (MPE) thresholds. In statutory law enforcement, probabilistic verdicts are legally unenforceable.
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
                  The Decision That Changed Everything  -  Deterministic Rules vs AI
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  Even if an AI vision model achieved 95% classification accuracy, an enforcement officer issuing a statutory Show Cause Notice (SCN) under Section 36 of the Legal Metrology Act, 2009 cannot rely on statistical probability. Scanning the same product twice must produce an identical, mathematically provable verdict.
                </p>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60 border border-blue-200 dark:border-blue-800/60 space-y-3 shadow-xs">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Scale className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span>The Neuro-Symbolic Architectural Pivot</span>
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    We transitioned to a <strong>neuro-symbolic compliance architecture</strong>: Deep learning AI (Computer Vision, multi-pass Tesseract OCR, OpenCV contour binarization, Spatial Layout Analysis, and Multimodal LLMs) is strictly confined to <strong>perceptual text detection, packaging segmentation, and Named Entity Recognition (NER)</strong>. All legal adjudication is handled by a <strong>deterministic, zero-hallucination rule engine</strong> codifying the exact statutory clauses of the Legal Metrology (Packaged Commodities) Rules, 2011.
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
                  The Question That Forced Us To Think Differently  -  The Statutory RAG Knowledge Layer
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  As we advanced our architecture, the most critical engineering hurdles were raised by regulatory domain experts during technical reviews:
                </p>

                <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 space-y-2">
                  <div className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider font-mono">Regulatory Review Challenge</div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white italic">
                    "What is your statutory reference architecture? Where does your legal knowledge come from when gazette amendments are notified?"
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    When asked, we initially described standard PostgreSQL database models. The regulatory assessor countered: <em>"A product manufactured in 2022 cannot be penalized under a 2024 gazette amendment. How does your compliance checking system guarantee temporal legal fidelity?"</em>
                  </p>
                </div>

                <p>
                  Statutory rules evolve: the Legal Metrology Act, 2009 receives official e-Gazette notifications, G.S.R. amendments, and CCPA advisory orders. Static databases become obsolete. We designed an automated <strong>Regulatory Retrieval-Augmented Generation (RAG)</strong> knowledge pipeline:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                    <div className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                      <Database className="h-4 w-4" />
                      <span>1. Gazette Ingestion Pipeline</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Continuously ingests official e-Gazette notifications, Legal Metrology amendments, and Schedule tables into vectorized statutory embeddings.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Search className="h-4 w-4" />
                      <span>2. Hybrid RAG Retrieval</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Combines BM25 lexical keyword matching with dense vector embeddings (cosine similarity) to pinpoint exact legal sub-clauses and penalties.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                    <div className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>3. Temporal Version Resolver</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Resolves the exact statutory legal regime effective on the product's detected month and year of manufacture, packing, or import.</p>
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
                  Font Size &amp; Readability Analysis  -  Rule 7 &amp; Rule 9 Geometric Normalization
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  Under <strong className="text-slate-900 dark:text-white">Rule 7 and Rule 9 of the Legal Metrology (Packaged Commodities) Rules, 2011</strong>, mandatory declarations (specifically net quantity and numeral declarations) must satisfy strict minimum height requirements based on the total area of the <strong>Principal Display Panel (PDP)</strong>, alongside contrast ratio readability requirements.
                </p>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 font-mono text-xs shadow-xs">
                  "How do you reliably verify font size in millimeters from a smartphone photo when camera distance, optical zoom, and digital cropping alter raw pixel dimensions?"
                </div>

                <p>
                  Raw pixel height is meaningless without physical scale reference. Two different photos of the same package - one captured close-up and one from two meters away - yield wildly different pixel dimensions.
                </p>

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono">Computer Vision Geometric Normalization</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40">
                      <div className="text-xs font-bold text-red-600 dark:text-red-400 line-through">Flawed Pixel Metric</div>
                      <div className="text-sm font-mono text-slate-900 dark:text-white mt-1">"How many pixels high is the font on screen?"</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Normalized PDP Geometry</div>
                      <div className="text-sm font-mono text-slate-900 dark:text-white mt-1">"What is numeral height relative to the Principal Display Panel (PDP) bounding polygon?"</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-2">
                    We engineered an OpenCV contour segmentation algorithm that isolates package boundaries, computes Principal Display Panel (PDP) surface area, and calculates normalized numeral and letter height. The system simultaneously measures the WCAG contrast ratio between declaration text and the background packaging surface to check readability and non-compliance objectively.
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
                  E-Commerce Marketplace Product Listing Scanning &amp; Digital Compliance
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  Packaged commodities are increasingly sold through online platforms (Amazon, Flipkart, Blinkit, Zepto, Meesho). Under <strong className="text-slate-900 dark:text-white">Rule 6(10) and Rule 6(11) of the Legal Metrology (Packaged Commodities) Rules, 2011</strong>, e-commerce entities are mandated to display all statutory declarations on digital product listings: manufacturer details, net quantity, Maximum Retail Price (MRP), unit sale price, month/year of import or packing, and country of origin.
                </p>
                <p>
                  We expanded our compliance checking system with an autonomous crawler capable of parsing structured product listings and scanning product gallery images. It cross-checks digital claims against physical packaging OCR to detect missing declarations, improper MRP declarations, dual pricing, and origin obfuscation across e-commerce channels.
                </p>

                {/* E-Commerce Crawler Mockup Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">AUTONOMOUS E-COMMERCE PRODUCT LISTING SCANNER</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-semibold">LIVE CRAWL STREAM</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-2">
                    <div className="text-slate-600 dark:text-slate-400">Target Product Listing: <span className="text-sky-600 dark:text-sky-300 font-semibold">https://www.amazon.in/dp/B08L7V... (Fortune Sunflower Oil 1L)</span></div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><span className="text-slate-500">Declared MRP:</span> <span className="text-slate-900 dark:text-white font-bold">₹139.00</span></div>
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><span className="text-slate-500">Net Quantity:</span> <span className="text-slate-900 dark:text-white font-bold">1 L (810g)</span></div>
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><span className="text-slate-500">Country of Origin:</span> <span className="text-emerald-600 dark:text-emerald-400 font-bold">India</span></div>
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><span className="text-slate-500">PCR 2011 Verdict:</span> <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Compliant</span></div>
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
                  Attachment of Photographs &amp; Supporting Evidence  -  Citizen to Officer Synergy
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  With millions of packaged goods sold daily across supermarkets and neighborhood stores, manual inspection alone cannot guarantee total coverage. We integrated a citizen grievance engine that feeds directly into the regulatory enforcement pipeline.
                </p>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 border border-indigo-200 dark:border-indigo-800/50 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                    <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Evidence Attachment &amp; Chain of Custody</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    Consumers and enforcement officers can capture or upload photographs and supporting evidence (packaging labels, retail price tags, and cash memos). The system automatically geotags submissions, performs OCR receipt reconciliation to detect overcharging beyond the declared Maximum Retail Price (MRP), and routes tamper-evident violation evidence directly to the assigned Zonal Enforcement Inspector.
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
                  Enforcement Official Dashboards &amp; Repository of Scanned Products
                </h2>
              </div>

              <div className="space-y-4">
                <p>
                  To convert individual violations into systematic regulatory governance, SatyaDrishti maintains a centralized <strong>repository of scanned products and compliance history</strong> paired with interactive <strong>dashboards for enforcement officials</strong>.
                </p>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">ENFORCEMENT OFFICIAL GIS RISK DASHBOARD</span>
                    </div>
                    <span className="text-[10px] bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 px-2 py-0.5 rounded font-mono font-semibold">BENGALURU INDUSTRIAL CORRIDOR</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-slate-500 text-[10px]">CRITICAL RISK TIER (80+)</div>
                      <div className="text-red-600 dark:text-red-400 font-bold text-lg">1 Offender</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Flagged for Surprise Inspection Raid</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-slate-500 text-[10px]">REPEAT OFFENCE RATE</div>
                      <div className="text-amber-600 dark:text-amber-400 font-bold text-lg">30% Rate</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Cross-Platform SKU Recurrence</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="text-slate-500 text-[10px]">TOTAL SCN NOTICES</div>
                      <div className="text-slate-900 dark:text-white font-bold text-lg">10 Notices</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Under Sec 36 Legal Metrology Act 2009</div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  With <strong>role-based user access</strong> (Zonal Enforcement Inspectors, Directorate Supervisors, and Consumer Users) and secure authentication, officers can instantly access a comprehensive <strong>search and retrieval facility</strong> to track previously scanned products, review inspection timelines, inspect barcode audit trails, and assess brand compliance histories.
                </p>
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
                  Digital Compliance Reports (PDF/Editable) &amp; Software Deployment Framework
                </h2>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 shadow-md dark:shadow-2xl">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span>System Architecture: Clear Responsibility Boundaries</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-blue-700 dark:text-blue-400">AI &amp; Computer Vision</div>
                      <ul className="text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                        <li>• Multi-pass OCR &amp; label extraction</li>
                        <li>• Font size &amp; readability geometry</li>
                        <li>• Statutory Named Entity Recognition</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-emerald-700 dark:text-emerald-400">Deterministic Rule Engine</div>
                      <ul className="text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                        <li>• Legal Metrology Rules, 2011 clauses</li>
                        <li>• Schedule I MPE error verification</li>
                        <li>• Automated PDF compliance reports</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-purple-700 dark:text-purple-400">Enforcement Officials</div>
                      <ul className="text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                        <li>• Role-based dashboard oversight</li>
                        <li>• Section 36 SCN notice authorization</li>
                        <li>• Field raid &amp; surprise audit action</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Technical Deployment Framework Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/60 dark:from-blue-950/40 dark:to-slate-900 border border-blue-200 dark:border-blue-800/60 space-y-3 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Digital Compliance Report Generation in PDF &amp; Editable Formats</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    SatyaDrishti automatically compiles comprehensive <strong>digital compliance reports and violation summaries in PDF and editable JSON formats</strong>. Every report contains high-resolution annotated photographs with bounding-box canvas overlays, detected declaration field tables, font size readability measurements, statutory clause violation summaries, and auto-generated Show Cause Notice (SCN) drafts under Section 36 of the Legal Metrology Act, 2009.
                  </p>
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
                  <Link to="/system-architecture" className="inline-flex">
                    <Button variant="primary" size="sm" className="gap-2 text-xs font-semibold">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Explore System Architecture</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>

              </div>
            </section>

          </main>
        </div>
      </div>

          </main>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
};

export default TechnicalBlogPage;
