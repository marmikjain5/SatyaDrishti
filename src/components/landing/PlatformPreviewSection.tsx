import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Scale,
  UserCheck,
  MessageSquareWarning,
  LineChart,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Download,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';

export const PlatformPreviewSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inspector' | 'consumer' | 'complaints' | 'risk'>('inspector');

  return (
    <section id="preview" className="py-20 bg-[#F8FAFC] scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Interactive Product Showcase
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            Multi-Stakeholder Intelligence Architecture
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Tailored interfaces for senior regulators, field inspection teams, grievance officers, and the general public.
          </p>
        </div>

        {/* Showcase Tab Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs gap-1 max-w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab('inspector')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'inspector'
                  ? 'bg-[#0F172A] dark:bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Scale className="h-4 w-4" />
              <span>Inspector Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('consumer')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'consumer'
                  ? 'bg-[#0F172A] dark:bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              <span>Consumer Portal</span>
            </button>

            <button
              onClick={() => setActiveTab('complaints')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'complaints'
                  ? 'bg-[#0F172A] dark:bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquareWarning className="h-4 w-4" />
              <span>Complaint Management</span>
            </button>

            <button
              onClick={() => setActiveTab('risk')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'risk'
                  ? 'bg-[#0F172A] dark:bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LineChart className="h-4 w-4" />
              <span>Risk & Entity Analytics</span>
            </button>
          </div>
        </div>

        {/* High-Fidelity Interactive Preview Canvas */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card-hover overflow-hidden">
          {/* Mock Browser Header */}
          <div className="px-5 py-3.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
              </div>
              <div className="bg-white px-3 py-1 rounded-md text-xs font-mono text-slate-600 border border-slate-200 flex items-center gap-2 ml-3">
                <span className="text-emerald-600 font-bold">https://</span>
                <span>satyadrishti.gov.in/{activeTab}-portal</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="outline" size="sm" className="h-7 text-xs bg-white">
                  <span>Open Full View</span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Dynamic Tab Content */}
          <div className="p-6 md:p-8 bg-slate-50/50 min-h-[460px]">
            <AnimatePresence mode="wait">
              {activeTab === 'inspector' && (
                <motion.div
                  key="inspector"
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-mono text-slate-500 uppercase">Assigned Inspections</span>
                      <div className="text-2xl font-bold text-slate-900 mt-1">24 Active</div>
                      <span className="text-[11px] text-amber-600 font-medium">8 High Priority</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-mono text-slate-500 uppercase">Notices Dispatched</span>
                      <div className="text-2xl font-bold text-slate-900 mt-1">112 Cases</div>
                      <span className="text-[11px] text-emerald-600 font-medium">₹18.4L Penalties</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-mono text-slate-500 uppercase">OCR Optical Confidence</span>
                      <div className="text-2xl font-bold text-blue-600 mt-1">99.4%</div>
                      <span className="text-[11px] text-slate-500">18 Attributes/Label</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-mono text-slate-500 uppercase">Next Hearing Date</span>
                      <div className="text-2xl font-bold text-slate-900 mt-1">28 Feb</div>
                      <span className="text-[11px] text-slate-500">CCPA Zonal Bench #2</span>
                    </div>
                  </div>

                  {/* Mock Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Pending Enforcement Cases (Live Zonal Queue)
                      </span>
                      <span className="text-xs font-mono text-slate-500">Legal Metrology Act 2009</span>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      <div className="p-4 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center font-bold text-xs">
                            SCN
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              Cadbury Bournvita 500g  -  High Sugar "Health Drink" Claim Advisory
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              Mondelez India Foods Pvt Ltd • Amazon India • Case #CCPA/ENF/2025/NZ-0891
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="danger" size="sm">Critical</Badge>
                          <span className="font-mono text-slate-700 font-semibold">₹25,000 SCN</span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                      <div className="p-4 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                            ECOM
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              Fortune Sunlite Oil 1L  -  Missing Unit Sale Price & Font Shortfall
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              Adani Wilmar Ltd • Pan-India Retail • Case #LM/ENF/2025/HQ-0112
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="warning" size="sm">High Risk</Badge>
                          <span className="font-mono text-slate-700 font-semibold">₹20,000 SCN</span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'consumer' && (
                <motion.div
                  key="consumer"
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">Citizen Product Trust Verifier</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Enter SKU / product name or upload product label picture to verify statutory compliance.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            defaultValue="SKU-AMZ-WHEY-2KG"
                            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono focus:border-blue-600 focus:outline-none"
                          />
                        </div>
                        <Button size="sm" variant="primary" className="text-xs">
                          Verify
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                        <div className="text-4xl font-extrabold text-emerald-600 font-mono">94/100</div>
                        <div className="text-xs font-semibold text-slate-800 mt-1">High Trust Rating</div>
                        <p className="text-[11px] text-slate-500 mt-1">FarmPure Mustard Oil (1L)</p>
                      </div>
                      <div className="md:col-span-2 space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="flex items-center gap-2 font-medium">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            MRP & Unit Sale Price Verified (₹245 / ₹24.5 per 100ml)
                          </span>
                          <span className="font-mono text-[11px]">Pass</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="flex items-center gap-2 font-medium">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Manufacturer Details & Origin Verified (Rajasthan Agro Pvt Ltd)
                          </span>
                          <span className="font-mono text-[11px]">Pass</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'complaints' && (
                <motion.div
                  key="complaints"
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-mono text-slate-500 uppercase">Grievance Intake (24h)</span>
                      <div className="text-2xl font-bold text-slate-900 mt-1">1,420 Filed</div>
                      <span className="text-[11px] text-emerald-600 font-medium">98.2% Auto-Triaged</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-mono text-slate-500 uppercase">Avg SLA Turnaround</span>
                      <div className="text-2xl font-bold text-blue-600 mt-1">4.2 Days</div>
                      <span className="text-[11px] text-slate-500">Down from 28 days</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-mono text-slate-500 uppercase">Consumer Refund Orders</span>
                      <div className="text-2xl font-bold text-emerald-600 mt-1">₹34.8 Lakhs</div>
                      <span className="text-[11px] text-slate-500">This Month</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="font-bold text-slate-900">Live AI Grievance Classification Stream</span>
                      <Badge variant="primary" size="sm">NLP Triage Engine v2</Badge>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">
                          Dual MRP Sticker over Original Price Tag
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          "Printed MRP Rs 3,499 was covered with sticker claiming Rs 4,999 on Amazon. Weight was also 160g less."
                        </p>
                      </div>
                      <Badge variant="danger" size="sm">Rule 18(2) Violation</Badge>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'risk' && (
                <motion.div
                  key="risk"
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          High-Risk Manufacturer Index
                        </h4>
                        <Badge variant="danger" size="sm">Repeat Offenders</Badge>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-red-50/70 rounded-lg border border-red-200 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">Direct DropShip Ventures LLP</div>
                            <div className="text-[11px] text-slate-500">64 Active Violations • 4 Shell Brands</div>
                          </div>
                          <span className="font-mono text-red-700 font-bold text-base">92/100 Risk</span>
                        </div>

                        <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">Apex BioNutra Formulations Ltd</div>
                            <div className="text-[11px] text-slate-500">19 Active Violations • Baddi, HP</div>
                          </div>
                          <span className="font-mono text-amber-700 font-bold text-base">88/100 Risk</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Category Non-Compliance Share
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div>
                          <div className="flex justify-between font-medium text-slate-700 mb-1">
                            <span>Health Supplements & Protein</span>
                            <span className="font-mono text-red-600 font-bold">28.4% Non-Compliant</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-red-600 h-2 rounded-full w-[28.4%]" />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between font-medium text-slate-700 mb-1">
                            <span>Consumer Electronics & Peripherals</span>
                            <span className="font-mono text-amber-600 font-bold">21.6% Non-Compliant</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-amber-600 h-2 rounded-full w-[21.6%]" />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between font-medium text-slate-700 mb-1">
                            <span>Personal Care & Cosmetics</span>
                            <span className="font-mono text-amber-600 font-bold">18.2% Non-Compliant</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-amber-500 h-2 rounded-full w-[18.2%]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
