import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ScanText,
  ShieldCheck,
  Award,
  AlertOctagon,
  Network,
  Cpu,
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
      title: 'OCR Intelligence',
      subtitle: 'Multi-Pass OCR & Image Processing',
      description:
        'Processes packaging images through multiple preprocessing variants and OCR passes to extract statutory declarations such as MRP, net quantity, batch information, and manufacturing details.',
      icon: ScanText,
      badge: 'Multi-Pass OCR',
      metrics: ['6 Optimized Image Variants', 'Image Preprocessing Pipeline', 'Statutory Declaration Extraction'],
      tag: 'OCR Pipeline',
    },
    {
      id: 2,
      title: 'Product Compliance Validation',
      subtitle: 'Legal Metrology Rule Validation',
      description:
        'Validates extracted package declarations against applicable Legal Metrology requirements and produces structured compliance results.',
      icon: ShieldCheck,
      badge: 'Rule Validation',
      metrics: ['Declaration Rule Checks', 'Readability Analysis', 'Compliance Report Generation'],
      tag: 'Compliance Engine',
    },
    {
      id: 3,
      title: 'AI Legal Review',
      subtitle: 'Evidence-Based Violation Assessment',
      description:
        'Reviews detected violations, evaluates evidence sufficiency and risk, and produces a structured legal assessment before human verification.',
      icon: Award,
      badge: 'Legal Review',
      metrics: ['Violation Finding Analysis', 'Severity & Evidence Assessment', 'Human Verification Gate'],
      tag: 'Legal Review',
    },
    {
      id: 4,
      title: 'Regulatory RAG Intelligence',
      subtitle: 'Retrieval-Augmented Legal Intelligence',
      description:
        'Provides regulatory question answering and reference retrieval using the platform\'s legal knowledge and regulatory documents.',
      icon: AlertOctagon,
      badge: 'RAG Intelligence',
      metrics: ['Regulatory Query Retrieval', 'Act & Rule References', 'Context-Aware Legal Answers'],
      tag: 'Regulatory RAG',
    },
    {
      id: 5,
      title: 'Violation Management',
      subtitle: 'Evidence & Case Tracking',
      description:
        'Centralizes detected violations with severity, evidence, review status, and case-level tracking for regulatory workflows.',
      icon: Network,
      badge: 'Violation Ledger',
      metrics: ['Violation Case Tracking', 'Severity Categorization', 'Legal Notice Generation'],
      tag: 'Violation Workflow',
    },
    {
      id: 6,
      title: 'Human Verification Workflow',
      subtitle: 'Inspector Review & Publication Control',
      description:
        'Routes AI-generated legal assessments through human verification before a violation can proceed toward publication or regulatory action.',
      icon: Cpu,
      badge: 'Human-in-the-Loop',
      metrics: ['Inspector Review', 'Verification / Rejection', 'Publication Approval Gate'],
      tag: 'Human Verification',
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
            Intelligence. Automation. Enforcement.
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
                    className="p-6 h-[410px]"
                    outerClassName="h-[410px]"
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

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">{item.description}</p>
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
                        <span>Statutory Reference:</span>
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
