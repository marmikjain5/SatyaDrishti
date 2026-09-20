import React from 'react';
import {
  ShieldCheck,
  Scan,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface InspectorTelemetryPoint {
  period: string;
  fieldScans: number;
  violationsFound: number;
  complianceRate: number;
}

const DEFAULT_INSPECTOR_TRENDS: InspectorTelemetryPoint[] = [
  { period: 'Week 1', fieldScans: 18, violationsFound: 3, complianceRate: 83.3 },
  { period: 'Week 2', fieldScans: 24, violationsFound: 2, complianceRate: 91.6 },
  { period: 'Week 3', fieldScans: 28, violationsFound: 4, complianceRate: 85.7 },
  { period: 'Week 4', fieldScans: 22, violationsFound: 1, complianceRate: 95.4 },
  { period: 'Week 5', fieldScans: 35, violationsFound: 3, complianceRate: 91.4 },
  { period: 'Week 6', fieldScans: 15, violationsFound: 1, complianceRate: 93.3 },
];

export const InspectorFieldTrajectoryChart: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header Section: Title & Subtitle Left + 3 Mini KPI Summary Cards Right */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Zonal Field Telemetry &amp; Inspection Trajectory</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                  Bengaluru City Zone 1
                </span>
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-9">
            On-site retail packaging scans, optical OCR verifications &amp; confirmed label discrepancies assigned to Inspector Arjun Nair.
          </p>
        </div>

        {/* 3 Mini KPI Metric Cards for Inspector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          {/* Card 1: Total Field Scans */}
          <div className="bg-slate-50/80 dark:bg-slate-950/60 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-center min-w-[120px]">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
              <Scan className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span>Field Scans</span>
            </div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white font-mono leading-tight mt-0.5">
              142 Scans
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="h-3 w-3" />
              <span>+28%</span>
              <span className="text-slate-400 font-normal ml-0.5">vs last month</span>
            </div>
          </div>

          {/* Card 2: Violations Detected */}
          <div className="bg-red-50/40 dark:bg-red-950/30 rounded-xl p-3 border border-red-200/60 dark:border-red-900/40 flex flex-col justify-center min-w-[120px]">
            <div className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span>Violations Found</span>
            </div>
            <div className="text-lg font-extrabold text-red-600 dark:text-red-400 font-mono leading-tight mt-0.5">
              14 Items
            </div>
            <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold flex items-center gap-0.5 mt-0.5">
              <span>9.8% Discrepancy Rate</span>
            </div>
          </div>

          {/* Card 3: Zonal SLA */}
          <div className="bg-emerald-50/40 dark:bg-emerald-950/30 rounded-xl p-3 border border-emerald-200/60 dark:border-emerald-900/40 flex flex-col justify-center min-w-[120px]">
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Zonal Audit SLA</span>
            </div>
            <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 font-mono leading-tight mt-0.5">
              1.4 Days
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
              <span>Fast Inspection SLA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Trajectory Composed Chart Area */}
      <div className="relative pt-2">
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={DEFAULT_INSPECTOR_TRENDS}
              margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="inspectorScanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="inspectorViolationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" className="dark:stroke-slate-800" vertical={false} />
              
              <XAxis
                dataKey="period"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              
              <YAxis
                yAxisId="left"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}`}
              />

              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#EF4444"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 10]}
                tickFormatter={(val) => `${val}`}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as InspectorTelemetryPoint;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 font-mono">
                        <div className="font-bold text-blue-400 border-b border-slate-800 pb-1">{label} Telemetry</div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">On-Site Scans:</span>
                          <strong className="text-white">{data.fieldScans} SKUs</strong>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Violations Found:</span>
                          <strong className="text-rose-400">{data.violationsFound} Items</strong>
                        </div>
                        <div className="flex justify-between gap-4 pt-1 border-t border-slate-800 text-[10px]">
                          <span className="text-slate-400">Zonal Compliance Rate:</span>
                          <strong className="text-emerald-400">{data.complianceRate}%</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                yAxisId="right"
                type="monotone"
                dataKey="violationsFound"
                stroke="#DC2626"
                strokeWidth={2}
                fill="url(#inspectorViolationGradient)"
                name="Confirmed Violations"
              />

              <Bar
                yAxisId="left"
                dataKey="fieldScans"
                fill="url(#inspectorScanGradient)"
                radius={[6, 6, 0, 0]}
                barSize={32}
                name="Field Scans (On-Site)"
              />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="violationsFound"
                stroke="#DC2626"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#DC2626', stroke: '#FFFFFF', strokeWidth: 2 }}
                name="Violations Found"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Legend */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-blue-500 inline-block" />
              <span className="text-slate-600 dark:text-slate-400 font-medium text-xs">Field Packaging Scans</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-600 inline-block" />
              <span className="text-slate-600 dark:text-slate-400 font-medium text-xs">Violations Detected</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-mono text-xs bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>90.2% Average Zonal Retail Compliance</span>
          </div>
        </div>
      </div>
    </div>
  );
};
