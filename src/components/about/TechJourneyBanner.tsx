import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Code2, BookOpen } from 'lucide-react';

export const TechJourneyBanner: React.FC = () => {
  return (
    <section className="relative z-20 bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-white border-y border-slate-200/80 dark:border-slate-800/80 py-8 overflow-hidden transition-colors duration-300">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/10 to-purple-500/5 dark:from-blue-600/10 dark:via-indigo-600/15 dark:to-purple-600/10 pointer-events-none" />
      <div className="absolute -left-12 -top-12 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 dark:from-slate-950/80 dark:via-slate-900/90 dark:to-slate-950/80 border border-blue-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-lg dark:shadow-2xl transition-colors duration-300">
          {/* Left Content */}
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="hidden sm:flex items-center justify-center p-4 rounded-2xl bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
              <Code2 className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 shadow-xs">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  Engineering Deep-Dive
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  11-Min Read • SatyaDrishti Architecture
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                Want to know more about our journey on the tech side of things?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Discover how we evolved from an OCR prototype into a deterministic compliance engine, solved relative font scaling, and engineered an autonomous legal metrology RAG pipeline.
              </p>
            </div>
          </div>

          {/* Right Action CTA */}
          <div className="flex items-center shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0">
            <Link to="/technical-blog" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 sm:px-8 sm:py-4 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 border border-blue-400/30 cursor-pointer"
              >
                <BookOpen className="h-5 w-5 text-blue-200 shrink-0" />
                <span className="tracking-wide">Read Technical Story</span>
                <ArrowRight className="h-5 w-5 text-blue-200 shrink-0" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
