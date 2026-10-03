import React, { useState, useRef } from 'react';
import {
  ScanText,
  ShieldCheck,
  Sparkles,
  MessageSquareWarning,
  UserCheck,
  Scale,
  Building2,
  FileCheck2,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { SciFiCard } from '../ui/SciFiCard';

export const CoreCapabilitiesSection: React.FC = () => {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const capabilities = [
    {
      id: 1,
      title: 'Label & Packaging Scanning (OCR & Vision AI)',
      subtitle: 'Automated Detection & Extraction of Mandatory Declarations',
      description:
        'Scans packaged commodity labels, product images, and packaging to automatically detect and extract mandatory declarations (MRP, net quantity, manufacturer, packer, importer, dates, and consumer care) using multi-pass Tesseract OCR and Multimodal Vision LLMs.',
      icon: ScanText,
      badge: 'Hybrid Vision AI',
      metrics: [
        'Mandatory Declarations Extraction',
        'OpenCV Preprocessing & Deskew',
        'Bounding-Box Canvas Overlays',
      ],
      tag: 'Rule 6(1) Extraction',
    },
    {
      id: 2,
      title: 'Rule-Based Compliance Engine (PCR 2011)',
      subtitle: 'Font Size & Readability Analysis (Rule 7 & 9)',
      description:
        'Audits extracted declarations against the Legal Metrology (Packaged Commodities) Rules, 2011. Checks correctness, completeness, and placement, performing automated font size and readability analysis (numeral height relative to PDP area and contrast ratio).',
      icon: ShieldCheck,
      badge: 'Rule Engine 2011',
      metrics: [
        'Font Size & Readability Analysis',
        'Schedule I Permissible Error (MPE)',
        'Missing / Misleading Declaration Flagging',
      ],
      tag: 'PCR 2011 Audit',
    },
    {
      id: 3,
      title: 'Autonomous Gazette Crawler & RAG',
      subtitle: 'Gazette Monitoring & Hybrid Legal Search',
      description:
        'Continuously crawls official e-Gazette notifications, PIB press releases, and CCPA orders. Parses gazette PDFs and vectorizes verbatim statutory clauses into a live RAG knowledge base for instant legal retrieval.',
      icon: Sparkles,
      badge: 'Live Gazette RAG',
      metrics: [
        'Real-Time Gazette PDF Parsing',
        'Verbatim Clause & Penalty Retrieval',
        'Automatic Rule Version Updating',
      ],
      tag: 'Regulatory RAG',
    },
    {
      id: 4,
      title: 'Supporting Photographic Evidence Engine',
      subtitle: 'Citizen Complaints & Price Overcharge Audit',
      description:
        'Empowers consumers to attach photographs and supporting evidence in Hindi, Kannada, Tamil, or English with Indic transliteration. Correlates packaging photos with retail receipts to auto-detect price overcharging beyond MRP.',
      icon: MessageSquareWarning,
      badge: 'Evidence Capture',
      metrics: [
        'Multi-Language (HI, KN, TA, EN)',
        'Receipt vs Packaging MRP Audit',
        'Photographic Evidence Attachment',
      ],
      tag: 'CPA 2019 Desk',
    },
    {
      id: 5,
      title: 'Enforcement Official Dashboard',
      subtitle: 'Role-Based Access & Inspection Monitoring',
      description:
        'Provides dedicated dashboards for enforcement officials to monitor field inspections, detect repeat violations, review photographic evidence, verify barcode audit trails, and manage compliance queues.',
      icon: UserCheck,
      badge: 'Inspector Portal',
      metrics: [
        'Enforcement Official Dashboards',
        'Role-Based User Access Control',
        'Zonal Inspections & SLA Tracking',
      ],
      tag: 'Field Operations',
    },
    {
      id: 6,
      title: 'Central Supervisor Directorate',
      subtitle: 'Directorate Oversight & Section 36 SCN',
      description:
        'Provides Directorate Supervisors with high-priority enforcement queues, statutory Show Cause Notice (SCN) authorization under Section 36 of the Legal Metrology Act, 2009, 14-day hearing workflows, and inspector rosters.',
      icon: Scale,
      badge: 'Supervisor Portal',
      metrics: [
        'Statutory Section 36 SCN Issuance',
        '14-Day Hearing & Notice Workflow',
        'Enforcement Roster Analytics',
      ],
      tag: 'Directorate Desk',
    },
    {
      id: 7,
      title: 'E-Commerce Product Listing Scanner',
      subtitle: 'Digital Marketplace Compliance (Rule 6(10))',
      description:
        'Scans product listings and packaged commodity images across e-commerce platforms (Amazon, Flipkart, Blinkit, Zepto, Meesho) to detect missing declarations, dual MRP, omitted unit sale price, and deceptive packaging.',
      icon: Building2,
      badge: 'Marketplace Audit',
      metrics: [
        'E-Commerce Product Listing Scan',
        'Dual MRP & Unit Price Check',
        'Missing Declarations Detection',
      ],
      tag: 'Digital Marketplace',
    },
    {
      id: 8,
      title: 'Digital Compliance Reports & Repository',
      subtitle: 'PDF & Editable Reports with Inspection History',
      description:
        'Generates digital compliance reports and violation summaries in PDF and editable formats with embedded photographs. Maintains a searchable repository of scanned products and compliance history.',
      icon: FileCheck2,
      badge: 'PDF Reports & Repo',
      metrics: [
        'Compliance Reports (PDF & Editable)',
        'Repository of Scanned Products',
        'Inspection History & Evidence Chain',
      ],
      tag: 'Audit Ledger',
    },
  ];

  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardWidth = container.querySelector<HTMLElement>('[data-carousel-card]')?.offsetWidth || 340;
    const gap = 20;
    const targetScroll = index * (cardWidth + gap);
    container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    setActiveIndex(index);
  };

  const handlePrev = () => {
    const nextIdx = Math.max(0, activeIndex - 1);
    scrollToIndex(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = Math.min(capabilities.length - 1, activeIndex + 1);
    scrollToIndex(nextIdx);
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardWidth = container.querySelector<HTMLElement>('[data-carousel-card]')?.offsetWidth || 340;
    const gap = 20;
    const newIdx = Math.round(container.scrollLeft / (cardWidth + gap));
    if (newIdx !== activeIndex && newIdx >= 0 && newIdx < capabilities.length) {
      setActiveIndex(newIdx);
    }
  };

  return (
    <section id="capabilities" className="py-20 bg-[#F8FAFC] scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Precision Regulatory Automation
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Core Capabilities
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Multimodal Vision AI. Autonomous Gazette RAG. Zonal Inspector Telemetry. Section 36 Enforcement.
          </p>
        </div>

        {/* Carousel Container with Side Nav Buttons */}
        <div className="relative group px-1 sm:px-10">
          {/* Left Arrow Button */}
          <button
            onClick={handlePrev}
            disabled={activeIndex === 0}
            aria-label="Previous capabilities"
            className={`absolute -left-2 sm:left-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 transition-all ${
              activeIndex === 0
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 active:scale-95'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={handleNext}
            disabled={activeIndex >= capabilities.length - 1}
            aria-label="Next capabilities"
            className={`absolute -right-2 sm:right-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 transition-all ${
              activeIndex >= capabilities.length - 1
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 active:scale-95'
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Scrollable Track */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-5 overflow-x-auto scrollbar-none snap-x snap-mandatory py-4 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {capabilities.map((item) => {
              const Icon = item.icon;
              const isHovered = activeCard === item.id;
              return (
                <div
                  key={item.id}
                  data-carousel-card
                  className="snap-start shrink-0 w-[285px] sm:w-[325px] md:w-[355px]"
                  onMouseEnter={() => setActiveCard(item.id)}
                  onMouseLeave={() => setActiveCard(null)}
                >
                  <SciFiCard
                    className="p-6 h-[430px]"
                    outerClassName="h-[430px]"
                  >
                    {/* Upper Content */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-xs">
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge variant="secondary" size="sm" className="font-mono text-[10px] bg-slate-100/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700">
                          {item.badge}
                        </Badge>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-4 tracking-tight flex items-center justify-between group-hover/scifi:text-blue-600 dark:group-hover/scifi:text-blue-400 transition-colors">
                        <span>{item.title}</span>
                        <ArrowUpRight
                          className={`h-4 w-4 transition-transform text-slate-400 dark:text-slate-500 ${
                            isHovered ? 'translate-x-0.5 -translate-y-0.5 text-blue-600 dark:text-blue-400' : ''
                          }`}
                        />
                      </h3>
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">{item.subtitle}</p>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed min-h-[72px]">{item.description}</p>
                    </div>

                    {/* Lower Metrics & Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 space-y-2.5">
                      <div className="space-y-1.5">
                        {item.metrics.map((metric) => (
                          <div key={metric} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{metric}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-400">
                        <span>Module Scope:</span>
                        <span className="bg-slate-100/80 dark:bg-slate-800/90 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                          {item.tag}
                        </span>
                      </div>
                    </div>
                  </SciFiCard>
                </div>
              );
            })}
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {capabilities.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-200 ${
                  activeIndex === idx ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
