import React from 'react';
import { motion } from 'framer-motion';
import loopVideo from '../ui/loop.mp4';


export const HeroSection: React.FC = () => {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-white pt-10 pb-16 lg:pt-14 lg:pb-24 scroll-mt-24 border-b border-slate-200 dark:border-slate-800/80 transition-colors duration-300"
    >
      {/* Subtle background ambient mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 xl:gap-20 items-center">
          {/* ====== LEFT COLUMN: Looping Inspection Video ====== */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="lg:col-span-5 relative"
          >
            {/* Ambient glow behind video */}
            <div className="absolute -inset-4 bg-blue-500/15 dark:bg-blue-500/20 rounded-3xl blur-2xl pointer-events-none" />

            <div className="relative rounded-2xl overflow-hidden border border-slate-300/80 dark:border-slate-700/70 shadow-2xl shadow-blue-900/15 dark:shadow-blue-950/40 bg-slate-950 aspect-[16/10]">
              <video
                src={loopVideo}
                autoPlay
                muted
                loop
                playsInline
                className="w-[112%] h-[112%] max-w-none object-cover -mt-[1%] -ml-[1%]"
              />

              {/* Subtle dark overlay for contrast */}
              <div className="absolute inset-0 bg-slate-950/10 pointer-events-none" />

              {/* Seamless dark corner overlay completely concealing the corner watermark */}
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-slate-950 pointer-events-none z-20 rounded-br-2xl" />
            </div>
          </motion.div>

          {/* ====== RIGHT COLUMN: Clean Brand Title & Two-Line Vision Centered in Limelight ====== */}
          <div className="lg:col-span-7 space-y-6 text-center flex flex-col items-center justify-center relative">
            {/* --- Theatrical Conical Limelight Beam (Soft & Subtle Intensity) --- */}
            <div className="absolute -top-8 sm:-top-12 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center z-0 w-[420px] xs:w-[520px] sm:w-[680px] md:w-[800px] lg:w-[860px] h-[190px] sm:h-[230px]">
              {/* Spotlight Lamp Fixture & Soft Emitter Bulb */}
              <div className="relative flex flex-col items-center z-20">
                <div className="w-12 sm:w-16 h-1.5 rounded-t-sm bg-slate-700/60 dark:bg-slate-400/60" />
                <div className="w-10 sm:w-14 h-2 rounded-full bg-blue-100 dark:bg-white shadow-[0_0_12px_3px_rgba(59,130,246,0.35)] dark:shadow-[0_0_16px_5px_rgba(147,197,253,0.45)]" />
              </div>

              {/* Conical Light Beams */}
              <div className="relative w-full h-full -mt-1 flex items-center justify-center">
                {/* 1. Wide Ambient Stage Haze */}
                <div
                  className="absolute inset-0 opacity-20 dark:opacity-30 blur-2xl"
                  style={{
                    clipPath: 'polygon(41% 0%, 59% 0%, 100% 100%, 0% 100%)',
                    background:
                      'linear-gradient(180deg, rgba(147,197,253,0.6) 0%, rgba(59,130,246,0.3) 45%, rgba(37,99,235,0.08) 85%, transparent 100%)',
                  }}
                />

                {/* 2. Main Conical Limelight Beam (Soft Glow) */}
                <div
                  className="absolute inset-x-2 sm:inset-x-4 top-0 bottom-0 opacity-25 dark:opacity-35 blur-md"
                  style={{
                    clipPath: 'polygon(43% 0%, 57% 0%, 98% 100%, 2% 100%)',
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(147,197,253,0.45) 30%, rgba(59,130,246,0.2) 70%, transparent 100%)',
                  }}
                />

                {/* 3. Gentle Core Ray */}
                <div
                  className="absolute inset-x-6 sm:inset-x-12 top-0 bottom-3 opacity-25 dark:opacity-35 blur-sm"
                  style={{
                    clipPath: 'polygon(45% 0%, 55% 0%, 88% 100%, 12% 100%)',
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(224,242,254,0.5) 25%, rgba(96,165,250,0.15) 70%, transparent 100%)',
                  }}
                />

                {/* 4. Elliptical Pool of Light on SATYADRISHTI */}
                <div className="absolute top-[60px] sm:top-[70px] w-[92%] h-[75px] rounded-[50%] bg-blue-400/12 dark:bg-blue-400/20 blur-xl pointer-events-none" />
                <div className="absolute top-[68px] sm:top-[78px] w-[70%] h-[45px] rounded-[50%] bg-sky-200/15 dark:bg-white/20 blur-lg pointer-events-none" />
              </div>
            </div>

            {/* Main Brand Title & Two-Line Vision Centered */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative z-10 space-y-4 w-full flex flex-col items-center"
            >
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.6rem] xl:text-[3.25rem] 2xl:text-6xl font-black text-slate-900 dark:text-white tracking-[0.08em] sm:tracking-[0.12em] xl:tracking-[0.16em] uppercase drop-shadow-[0_0_12px_rgba(59,130,246,0.2)] dark:drop-shadow-[0_0_20px_rgba(147,197,253,0.35)] leading-tight whitespace-nowrap text-center">
                SATYADRISHTI
              </h1>

              <div className="space-y-2 max-w-xl mx-auto text-center">
                <p className="text-lg sm:text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 dark:from-blue-400 dark:via-sky-300 dark:to-indigo-300 leading-snug">
                  Compliance Checking System for Legal Metrology (Packaged Commodities) Rules, 2011.
                </p>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Automated detection, extraction, and validation of mandatory declarations via Computer Vision &amp; OCR  -  with font size and readability analysis for enforcement officials across India.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
