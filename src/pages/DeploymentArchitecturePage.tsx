import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Cloud,
  Server,
  Database,
  HardDrive,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Terminal,
  Activity,
  GitBranch,
  Lock,
  Globe,
  RefreshCw,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { LandingNavbar } from '../components/layout/LandingNavbar';
import { LandingFooter } from '../components/layout/LandingFooter';
import { LiveDeploymentArchitecture } from '../components/architecture/LiveDeploymentArchitecture';
import { Badge } from '../components/ui/Badge';

export const DeploymentArchitecturePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 selection:bg-blue-600 selection:text-white">
      <LandingNavbar />

      {/* Hero Header */}
      <header className="relative pt-10 pb-12 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#030816] overflow-hidden">
        {/* Glow ambient effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Link to="/" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              <span>Home</span>
            </Link>
            <span className="text-slate-400 text-xs">/</span>
            <Link to="/system-architecture" className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:underline">
              <span>System Architecture</span>
            </Link>
            <span className="text-slate-400 text-xs">/</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Deployment Architecture</span>
          </div>

          <div className="max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Cloud className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Production Topology • Cloud Infrastructure &amp; DevOps</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Production <span className="text-emerald-600 dark:text-emerald-400">Deployment Architecture</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              Specification of the 3-Tier production deployment topology orchestrating <strong>SatyaDrishti</strong>: 
              Global edge client hosting on <strong>Vercel</strong>, containerized asynchronous ASGI microservice backend on <strong>Render</strong>, and managed transactional PostgreSQL with dual S3-compatible evidence storage on <strong>Supabase</strong>.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All 3 Tiers Active</span>
              </div>
              <span>&bull;</span>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zero-Cost $0/Month Architecture</span>
              </div>
              <span>&bull;</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>SSL/TLS 1.3 End-to-End</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16 flex-1 w-full">
        
        {/* ========================================================================= */}
        {/* INTERACTIVE LIVE DEPLOYMENT BLUEPRINT (Replicating exact user diagram) */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Live Interactive Deployment Topology</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono">
                Click any node to inspect runtime configurations, live telemetry, and environment keys
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/system-architecture"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>View System Architecture (HLA/LLA)</span>
              </Link>
            </div>
          </div>

          {/* The centerpiece with live flowing dots and interactive stream toggles */}
          <LiveDeploymentArchitecture />
        </section>

        {/* ========================================================================= */}
        {/* DEEP-DIVE TIER BREAKDOWNS */}
        {/* ========================================================================= */}
        <section className="space-y-8">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Architectural Breakdown by Deployment Tier
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">
              Resource allocation, network routing, and resilience measures across all 3 cloud providers
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* TIER 1: Vercel Edge */}
            <div className="rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20">
                  <Cloud className="w-6 h-6" />
                </div>
                <Badge variant="primary" size="sm" className="font-mono text-[10px]">
                  TIER 1 &bull; EDGE
                </Badge>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Vercel Edge Network
                </h3>
                <p className="text-xs text-sky-600 dark:text-sky-400 font-mono">
                  Frontend Single Page Application (SPA)
                </p>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Vercel serves pre-built, tree-shaken static assets through an Anycast Content Delivery Network across 300+ global edge nodes. Ensures immediate Time-to-First-Byte (TTFB &lt; 18ms) even over Indian 4G/5G mobile field connections.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Build Command:</span>
                  <span className="text-slate-900 dark:text-slate-200 font-bold">npm run build</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Output Directory:</span>
                  <span className="text-slate-900 dark:text-slate-200 font-bold">dist/</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Gzip Bundle Size:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">&lt; 240 kB</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Edge Routing:</span>
                  <span className="text-slate-900 dark:text-slate-200 font-bold">Rewrites to /index.html</span>
                </div>
              </div>
            </div>

            {/* TIER 2: Render FastAPI */}
            <div className="rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
                  <Server className="w-6 h-6" />
                </div>
                <Badge variant="primary" size="sm" className="font-mono text-[10px] bg-purple-500">
                  TIER 2 &bull; COMPUTE
                </Badge>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Render FastAPI Backend
                </h3>
                <p className="text-purple-600 dark:text-purple-400 text-xs font-mono">
                  Python 3.11 ASGI Microservices
                </p>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Render hosts the asynchronous FastAPI web service running Uvicorn workers. Executes statutory PCR Rule 2011 validations, hybrid BM25 + cosine e-Gazette RAG searches, and dispatches automated Section 36 notices via Gmail REST.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Server Runtime:</span>
                  <span className="text-slate-900 dark:text-slate-200 font-bold">Uvicorn ASGI</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Memory Ceiling:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">512 MB RAM (0.1 CPU)</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Health Check:</span>
                  <span className="text-slate-900 dark:text-slate-200 font-bold">GET /api/health (200 OK)</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Keep-Alive Pulse:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Every 14 min</span>
                </div>
              </div>
            </div>

            {/* TIER 3: Supabase Cloud */}
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <Database className="w-6 h-6" />
                </div>
                <Badge variant="primary" size="sm" className="font-mono text-[10px] bg-emerald-600">
                  TIER 3 &bull; DATA &amp; BLOB
                </Badge>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Supabase Managed Cloud
                </h3>
                <p className="text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                  PostgreSQL 16 &amp; S3 Object Storage
                </p>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Supabase provides relational persistence with ACID transactions, Row Level Security (RLS) policies for legal audit trails, and 2 dedicated object buckets for high-resolution packaging scans and consumer complaint evidence.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Database Engine:</span>
                  <span className="text-slate-900 dark:text-slate-200 font-bold">PostgreSQL 16.2</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Evidence Buckets:</span>
                  <span className="text-slate-900 dark:text-slate-200 font-bold">2 Buckets (5MB limit)</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Storage Speed:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">213 ms (92.97% hit)</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Connection Mode:</span>
                  <span className="text-slate-900 dark:text-slate-200 font-bold">PgBouncer Pooled</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* CI/CD & DEVOPS LIFECYCLE */}
        {/* ========================================================================= */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                CI/CD Automated Deployment Lifecycle
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Push-to-deploy workflow with zero manual infrastructure intervention
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">STAGE 01</div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Git Push</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Code commit pushed to the <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">main</code> repository branch triggers parallel webhooks.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">STAGE 02</div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Vercel Build (32s)</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Vite compiles TypeScript, minifies bundles, creates gzip/brotli artifacts, and distributes globally.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">STAGE 03</div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Render Deploy (50s)</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Python dependencies installed via pip wheel cache, Uvicorn service booted, zero-downtime healthcheck verified.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">STAGE 04</div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Supabase Migration</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Alembic / SQL schema migrations validated, RLS policies refreshed, and storage access verified.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CROSS-LINKING BANNER TO SYSTEM ARCHITECTURE */}
        {/* ========================================================================= */}
        <section className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span>COMPREHENSIVE ARCHITECTURE SUITE</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Explore the High-Level &amp; Low-Level Software Architecture
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Deep dive into the 7-tier architectural blueprint, 6-variant browser computer vision pipeline, deterministic PCR rule engine ASTs, and PostgreSQL schema definitions.
            </p>
          </div>

          <Link
            to="/system-architecture"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            <span>Explore System Architecture</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

      </main>

      <LandingFooter />
    </div>
  );
};

export default DeploymentArchitecturePage;
