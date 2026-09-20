import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { GridPattern } from '../ui/GridPattern';
import { cn } from '../../lib/utils';

export const CtaBannerSection: React.FC = () => {
  return (
    <section className="py-16 bg-[#F8FAFC] dark:bg-[#0B0F19]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-b from-blue-50/80 via-indigo-50/40 to-blue-50/60 dark:from-slate-900/90 dark:via-slate-800/60 dark:to-slate-900/90 border border-blue-200/80 dark:border-slate-700/80 p-8 sm:p-12 md:p-14 text-center shadow-xs overflow-hidden">
          {/* Subtle GridPattern texture */}
          <GridPattern
            width={32}
            height={32}
            squares={[
              [2, 2],
              [4, 5],
              [8, 3],
              [14, 2],
              [18, 4],
              [24, 2],
              [28, 5],
            ]}
            className={cn(
              '[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]',
              'inset-x-0 inset-y-[-20%] h-[160%] skew-y-6 fill-blue-600/[0.08] stroke-blue-900/[0.06] dark:fill-blue-400/[0.06] dark:stroke-blue-300/[0.04]'
            )}
          />

          {/* Subtle ambient background glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-400/10 dark:bg-blue-500/[0.07] rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            {/* Top Shield Icon */}
            <div className="inline-flex p-3 rounded-2xl bg-blue-600 text-white shadow-sm mb-1">
              <Shield className="h-6 w-6" />
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Ready to Strengthen Consumer Protection?
            </h2>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
              Join regulators and enforcement agencies in building a transparent and compliant digital marketplace.
            </p>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">


              <Link to="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="font-semibold gap-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs"
                >
                  <span>Explore Platform</span>
                  <ExternalLink className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
