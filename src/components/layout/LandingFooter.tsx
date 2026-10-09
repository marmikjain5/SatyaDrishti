import React from 'react';
import { FileText, Globe } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-slate-50 text-slate-600 border-t border-slate-200 dark:bg-[#0F172A] dark:text-slate-400 dark:border-slate-800 text-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          {/* Col 1: Platform identity */}
          <div className="space-y-4 max-w-md">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Satya<span className="text-blue-600 dark:text-blue-500">Drishti</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              AI-Powered National Consumer Protection, Legal Metrology Enforcement, &amp; E-Commerce Compliance Intelligence Platform. Built to uphold market integrity, detect deceptive packaging, and protect consumer rights at scale.
            </p>
          </div>

          {/* Col 2: Regulatory Acts */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Regulatory Coverage
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">Legal Metrology Act, 2009</li>
              <li className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">Packaged Commodities Rules 2011</li>
              <li className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">Legal Metrology Amendment Rules 2022 (USP)</li>
              <li className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">E-Commerce PCR Rules, 2017</li>
              <li className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">Bureau of Indian Standards (BIS) Act 2016</li>
              <li className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">Consumer Protection (E-Commerce) Rules 2020</li>
            </ul>
          </div>

          {/* Col 3: Prototype demo */}
          <div className="space-y-3 w-full md:max-w-md">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Prototype Demo
            </h4>
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 shadow-sm">
              <iframe
                className="block w-full aspect-video"
                src="https://www.youtube.com/embed/pOuCrWE9I7k?si=-KkWDBLOkclEKYvE"
                title="SatyaDrishti prototype demo video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>

        {/* Bottom disclaimer */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-end gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <Globe className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" /> India Data Residency
            </span>
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <FileText className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" /> ISO 27001 / CERT-In Aligned
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
