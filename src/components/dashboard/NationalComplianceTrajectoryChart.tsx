import React from 'react';
import {
  TrendingUp,
  Package,
  ShieldAlert,
  Target,
  ArrowUpRight,
  ArrowDownRight,
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
  LabelList,
} from 'recharts';
import { ComplianceTrendPoint } from '../../types/analytics';

interface NationalComplianceTrajectoryChartProps {
  data: ComplianceTrendPoint[];
}

// Custom rendered dot for the Red Violations Line
const CustomRedDot = (props: any) => {
  const { cx, cy } = props;
  if (!cx || !cy) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#FFFFFF" stroke="#DC2626" strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={2} fill="#DC2626" />
    </g>
  );
};

export const NationalComplianceTrajectoryChart: React.FC<NationalComplianceTrajectoryChartProps> = ({
  data,
}) => {
  const maxViolations = Math.max(0, ...data.map((point) => Number(point.violations) || 0));
  const violationsAxisMax = Math.max(2000, Math.ceil(maxViolations / 500) * 500);
  const violationsTicks = Array.from(
    { length: Math.floor(violationsAxisMax / 500) + 1 },
    (_, index) => index * 500,
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-subtle space-y-6">
      {/* Header Section: Title & Subtitle Left + 3 Mini KPI Summary Cards Right */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              National Product Compliance &amp; Violation Trajectory
            </h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Monthly telemetry of automated SKU scans vs confirmed Legal Metrology &amp; CCPA violations.
          </p>
        </div>

        {/* 3 Mini KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          {/* Card 1: Total Scans */}
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 flex flex-col justify-center min-w-[110px]">
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              Total Scans
            </div>
            <div className="text-base font-extrabold text-slate-900 font-mono leading-tight">
              3.8M
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="h-3 w-3" />
              <span>+42%</span>
              <span className="text-slate-400 font-normal ml-0.5">vs prev 5M</span>
            </div>
          </div>

          {/* Card 2: Confirmed Violations */}
          <div className="bg-red-50/40 rounded-xl p-3 border border-red-200/60 flex flex-col justify-center min-w-[110px]">
            <div className="text-[10px] text-red-600 font-bold uppercase tracking-wider">
              Confirmed Violations
            </div>
            <div className="text-base font-extrabold text-red-600 font-mono leading-tight">
              12.4K
            </div>
            <div className="text-[10px] text-red-600 font-semibold flex items-center gap-0.5 mt-0.5">
              <ArrowDownRight className="h-3 w-3" />
              <span>-18%</span>
              <span className="text-red-400 font-normal ml-0.5">vs prev 5M</span>
            </div>
          </div>

          {/* Card 3: Compliance Rate */}
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 flex flex-col justify-center min-w-[110px]">
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              Compliance Rate
            </div>
            <div className="text-base font-extrabold text-slate-900 font-mono leading-tight">
              99.7%
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="h-3 w-3" />
              <span>+0.3%</span>
              <span className="text-slate-400 font-normal ml-0.5">vs prev 5M</span>
            </div>
          </div>
        </div>
      </div>

      {/* Axis Titles Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
        <span>Scans</span>
        <span>Confirmed violations (raw cases)</span>
      </div>

      {/* Dual-scale Composed Chart Section */}
      <div className="relative h-72 w-full">
        {/* Callout Badge overlay on the latest Sep 2026 scan bar */}
        <div className="absolute right-3 top-3 z-10 hidden sm:block">
          <div className="bg-blue-600 text-white text-[10px] font-bold font-mono px-2 py-0.5 rounded shadow-sm">
            780K scans
          </div>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 25, right: 20, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorViolationsArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />

            <XAxis
              dataKey="month"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />

            {/* Left Y-Axis: Scans (0 to 1.0M) */}
            <YAxis
              yAxisId="scans"
              orientation="left"
              domain={[0, 1000000]}
              ticks={[0, 200000, 400000, 600000, 800000, 1000000]}
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => {
                if (v === 0) return '0';
                if (v === 1000000) return '1.0M';
                return `${v / 1000}K`;
              }}
            />

            {/* Right Y-Axis: Confirmed violations. The separate scale keeps
                low raw case counts readable beside much larger scan volumes. */}
            <YAxis
              yAxisId="violations"
              orientation="right"
              domain={[0, violationsAxisMax]}
              ticks={violationsTicks}
              stroke="#DC2626"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value >= 1000 ? `${value / 1000}K` : `${value}`}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#1E293B',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '11px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
              }}
              formatter={(value: any, name: any) => {
                if (name === 'scanned') return [`${Number(value).toLocaleString()} SKUs`, 'SKU Scans'];
                if (name === 'violations') return [`${Number(value).toLocaleString()} Cases`, 'Confirmed Violations'];
                return [value, name];
              }}
            />

            {/* Bars for SKU Scans (Left Y-Axis) */}
            <Bar
              yAxisId="scans"
              dataKey="scanned"
              name="scanned"
              fill="#93C5FD"
              radius={[6, 6, 0, 0]}
              barSize={48}
            >
              <LabelList
                dataKey="scannedLabel"
                position="top"
                fill="#2563EB"
                fontSize={11}
                fontWeight={700}
                offset={6}
              />
            </Bar>

            {/* Violations use the right axis so their month-to-month trend is
                visible while the bars retain the scan-volume scale. */}
            <Area
              yAxisId="violations"
              type="linear"
              dataKey="violations"
              stroke="none"
              fill="url(#colorViolationsArea)"
              tooltipType="none"
            />

            {/* Line for Confirmed Violations (raw case count) */}
            <Line
              yAxisId="violations"
              type="linear"
              dataKey="violations"
              name="violations"
              stroke="#DC2626"
              strokeWidth={2.5}
              dot={<CustomRedDot />}
              activeDot={{ r: 6, fill: '#DC2626', stroke: '#FFFFFF', strokeWidth: 2 }}
            >
              <LabelList
                dataKey="violationsLabel"
                position="top"
                fill="#DC2626"
                fontSize={11}
                fontWeight={700}
                offset={10}
              />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-600 font-medium pt-1">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-500 inline-block" />
          <span>SKU Scans (Automated)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-4 bg-red-600 inline-block" />
            <span className="h-2 w-2 rounded-full bg-red-600 border border-white inline-block -ml-3" />
          </span>
          <span>Confirmed Violations</span>
        </div>
      </div>

      {/* Bottom Summary Banner */}
      <div className="bg-emerald-50/80 rounded-xl p-3 border border-emerald-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-emerald-950 font-medium">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
            <Target className="h-4 w-4" />
          </div>
          <span>
            <strong className="font-bold text-emerald-900">55.8%</strong> reduction in confirmed violations while scan volume increased by <strong className="font-bold text-emerald-900">151.6%</strong> since May 2026.
          </span>
        </div>

        <div className="bg-emerald-100/80 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
          <ArrowUpRight className="h-3.5 w-3.5" />
          <span>Positive trend</span>
        </div>
      </div>
    </div>
  );
};
