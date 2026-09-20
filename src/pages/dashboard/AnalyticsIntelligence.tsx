import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Download, Sparkles, ShieldCheck, Scale, AlertOctagon, UserCheck, Search, Award, FileText, CheckCircle2, Building2 } from 'lucide-react';
import {
  COMPLIANCE_TRENDS,
  CATEGORY_RISK_METRICS,
  PLATFORM_COMPLIANCE_METRICS,
  NATIONAL_STATS,
  INSPECTOR_PERFORMANCE_METRICS,
} from '../../data/mockComplianceData';
import { formatNumber, formatCurrency } from '../../lib/utils';

export const AnalyticsIntelligence: React.FC = () => {
  const PIE_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const [inspectorFilter, setInspectorFilter] = useState<'All' | 'Top Performer' | 'Active' | 'Highly Vigilant'>('All');
  const [inspectorSearch, setInspectorSearch] = useState('');

  const filteredInspectors = INSPECTOR_PERFORMANCE_METRICS.filter((insp) => {
    const matchesFilter = inspectorFilter === 'All' || insp.status === inspectorFilter;
    const matchesSearch =
      insp.name.toLowerCase().includes(inspectorSearch.toLowerCase()) ||
      insp.assignedZone.toLowerCase().includes(inspectorSearch.toLowerCase()) ||
      insp.badgeId.toLowerCase().includes(inspectorSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const inspectorChartData = INSPECTOR_PERFORMANCE_METRICS.map((insp) => ({
    name: insp.name.replace('Inspector ', ''),
    'Inspections Completed': insp.inspectionsCompleted,
    'SCN Issued': insp.scnIssued,
    'Field Scans (x10)': Math.round(insp.fieldScansConducted / 10),
  }));

  const totalInspectorScans = INSPECTOR_PERFORMANCE_METRICS.reduce((sum, i) => sum + i.fieldScansConducted, 0);
  const totalInspectorInspections = INSPECTOR_PERFORMANCE_METRICS.reduce((sum, i) => sum + i.inspectionsCompleted, 0);
  const totalInspectorScn = INSPECTOR_PERFORMANCE_METRICS.reduce((sum, i) => sum + i.scnIssued, 0);
  const totalInspectorPenalties = INSPECTOR_PERFORMANCE_METRICS.reduce((sum, i) => sum + i.penaltiesRecommended, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Compliance & Enforcement Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregate telemetry, inspector performance tracking, marketplace compliance distribution, and zonal enforcement timelines.
          </p>
        </div>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-slate-500 uppercase text-[10px]">National OCR Precision</span>
          <div className="text-2xl font-bold text-blue-600 mt-1 font-sans">{NATIONAL_STATS.ocrAccuracyRate}%</div>
          <span className="text-slate-400 text-[11px]">Multi-Pass Optical Validation</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-slate-500 uppercase text-[10px]">Total Penalties Assessed</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-sans">
            {formatCurrency(NATIONAL_STATS.penaltyCollected)}
          </div>
          <span className="text-emerald-600 font-medium text-[11px]">Section 36 Recoveries</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-slate-500 uppercase text-[10px]">Active SCN Notices</span>
          <div className="text-2xl font-bold text-amber-600 mt-1 font-sans">
            {formatNumber(NATIONAL_STATS.activeNotices)}
          </div>
          <span className="text-slate-400 text-[11px]">Awaiting Company Reply</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
          <span className="text-slate-500 uppercase text-[10px]">Resolution Turnaround</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-sans">
            {NATIONAL_STATS.averageResolutionDays} Days
          </div>
          <span className="text-emerald-700 font-medium text-[11px]">Down from 28 Days</span>
        </div>
      </div>

      {/* ── ZONAL INSPECTOR ENFORCEMENT & FIELD AUDIT SECTION ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-900 text-white p-4 rounded-xl shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-300" />
              <h2 className="text-base font-bold tracking-tight">Inspector Zonal Performance & Field Operations Audit</h2>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              Supervisor oversight across all active Legal Metrology inspectors: SCN notices issued, field packaging scans, inspections completed, and SLA compliance.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono shrink-0">
            <div className="px-3 py-1.5 bg-blue-800/80 rounded-lg border border-blue-700">
              <span className="text-blue-300 block text-[10px]">ACTIVE INSPECTORS</span>
              <span className="font-bold text-white text-sm">{INSPECTOR_PERFORMANCE_METRICS.length} Officers</span>
            </div>
            <div className="px-3 py-1.5 bg-blue-800/80 rounded-lg border border-blue-700">
              <span className="text-blue-300 block text-[10px]">TOTAL SCN ISSUED</span>
              <span className="font-bold text-amber-300 text-sm">{totalInspectorScn} Notices</span>
            </div>
          </div>
        </div>

        {/* Inspector Activity Comparison Chart & Highlights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <Card className="h-full">
              <CardHeader>
                <div>
                  <CardTitle>
                    <UserCheck className="h-4 w-4 text-blue-600" />
                    <span>Officer Action Comparative Chart</span>
                  </CardTitle>
                  <CardDescription>Inspections completed, Show Cause Notices (SCN) issued, and field optical scans per officer</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inspectorChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#1E293B',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Inspections Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="SCN Issued" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Field Scans (x10)" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Inspector Summary Metrics */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <Card className="h-full flex flex-col justify-between">
              <CardHeader>
                <div>
                  <CardTitle>
                    <Award className="h-4 w-4 text-emerald-600" />
                    <span>Inspector Telemetry Totals</span>
                  </CardTitle>
                  <CardDescription>Aggregated field performance metrics for Bengaluru Circle</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-500 font-semibold uppercase">Total Field Scans (OCR)</div>
                    <div className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400 mt-0.5">
                      {formatNumber(totalInspectorScans)}
                    </div>
                  </div>
                  <Badge variant="primary" size="sm">100% Verified</Badge>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-500 font-semibold uppercase">Inspections Completed</div>
                    <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {totalInspectorInspections} Audits
                    </div>
                  </div>
                  <Badge variant="success" size="sm">Average 3.7 Days SLA</Badge>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-500 font-semibold uppercase">Total Show Cause Notices (SCN)</div>
                    <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5">
                      {totalInspectorScn} Issued
                    </div>
                  </div>
                  <Badge variant="warning" size="sm">Section 36 Compliance</Badge>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-500 font-semibold uppercase">Penalties Recommended</div>
                    <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                      {formatCurrency(totalInspectorPenalties)}
                    </div>
                  </div>
                  <Badge variant="secondary" size="sm">Zonal Recovery</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Inspector Roster & Action Table */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Inspector Performance & Enforcement Roster</span>
              </CardTitle>
              <CardDescription>
                Detailed breakdown of inspections, SCN notices issued, penalties recommended, and SLA turnaround by officer
              </CardDescription>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search inspector, badge, zone..."
                  value={inspectorSearch}
                  onChange={(e) => setInspectorSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 w-48 font-mono"
                />
              </div>

              <select
                value={inspectorFilter}
                onChange={(e) => setInspectorFilter(e.target.value as any)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 bg-white font-mono focus:outline-none focus:border-blue-600"
              >
                <option value="All">All Officers ({INSPECTOR_PERFORMANCE_METRICS.length})</option>
                <option value="Top Performer">Top Performers</option>
                <option value="Highly Vigilant">Highly Vigilant</option>
                <option value="Active">Active</option>
              </select>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Inspector &amp; Badge ID</th>
                  <th className="px-3 py-3">Assigned Zone / Circle</th>
                  <th className="px-3 py-3 text-center">Field Scans</th>
                  <th className="px-3 py-3 text-center">Inspections Completed</th>
                  <th className="px-3 py-3 text-center">SCN Issued</th>
                  <th className="px-3 py-3 text-right">Penalties Recommended</th>
                  <th className="px-3 py-3 text-center">Avg SLA</th>
                  <th className="px-4 py-3 text-right">Performance Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredInspectors.map((insp) => (
                  <tr key={insp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-sans">
                      <div className="font-bold text-slate-900">{insp.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{insp.badgeId}</div>
                    </td>
                    <td className="px-3 py-3 font-sans text-slate-700">
                      <div className="line-clamp-1 max-w-[200px]" title={insp.assignedZone}>
                        {insp.assignedZone}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-blue-700">
                      {formatNumber(insp.fieldScansConducted)}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-emerald-700">
                      {insp.inspectionsCompleted}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                        {insp.scnIssued} SCN
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-slate-800">
                      {formatCurrency(insp.penaltiesRecommended)}
                    </td>
                    <td className="px-3 py-3 text-center text-slate-600">
                      {insp.averageSlaDays} Days
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-extrabold text-slate-900">{insp.complianceRating}%</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-sans ${
                            insp.status === 'Top Performer'
                              ? 'bg-emerald-100 text-emerald-800'
                              : insp.status === 'Highly Vigilant'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {insp.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInspectors.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-sans">
                      No inspectors match the selected search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Row 1: Enforcement Volume Over Time (Recharts Line/Bar Combo) */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>
              <Scale className="h-4 w-4 text-blue-600" />
              <span>Enforcement Lifecycle: Violations vs SCN Notices vs Resolutions</span>
            </CardTitle>
            <CardDescription>Monthly volume of cases processed by the regulatory intelligence engine</CardDescription>
          </div>
          <Badge variant="primary" size="sm">
            National Pipeline
          </Badge>
        </CardHeader>

        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={COMPLIANCE_TRENDS} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#1E293B',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '11px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="violations" name="Violations Detected" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="notices" name="SCN Notices Issued" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Cases Resolved" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Row 2: Marketplace Platform Compliance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <Card className="h-full">
            <CardHeader>
              <div>
                <CardTitle>
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Marketplace Compliance Rates</span>
                </CardTitle>
                <CardDescription>Verified compliance scores across top digital commerce platforms</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={PLATFORM_COMPLIANCE_METRICS}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#94A3B8" fontSize={10} unit="%" />
                  <YAxis type="category" dataKey="platform" stroke="#475569" fontSize={10} width={90} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Compliance Rate']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="complianceRate" fill="#2563EB" radius={[0, 4, 4, 0]}>
                    {PLATFORM_COMPLIANCE_METRICS.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.complianceRate >= 90 ? '#10B981' : entry.complianceRate >= 75 ? '#2563EB' : '#EF4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-6">
          <Card className="h-full">
            <CardHeader>
              <div>
                <CardTitle>
                  <AlertOctagon className="h-4 w-4 text-red-600" />
                  <span>Commodity Risk Distribution</span>
                </CardTitle>
                <CardDescription>Proportion of non-compliance across consumer goods verticals</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CATEGORY_RISK_METRICS}
                    dataKey="violationRate"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {CATEGORY_RISK_METRICS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Violation Rate']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
