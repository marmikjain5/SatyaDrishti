import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package,
  ShieldAlert,
  Building2,
  MessageSquareWarning,
  FileCheck2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Scan,
  Scale,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Gavel,
  MapPin,
  Factory,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { NationalComplianceTrajectoryChart } from '../../components/dashboard/NationalComplianceTrajectoryChart';
import { InspectorFieldTrajectoryChart } from '../../components/dashboard/InspectorFieldTrajectoryChart';
import { useAuthStore } from '../../store/authStore';
import { useComplianceStore } from '../../store/complianceStore';
import {
  COMPLIANCE_TRENDS,
  CATEGORY_RISK_METRICS,
  STATE_COMPLIANCE_METRICS,
  NATIONAL_STATS,
} from '../../data/mockComplianceData';
import { computeBengaluruZonalRisk } from '../../data/mockManufacturers';
import { formatCurrency, formatNumber } from '../../lib/utils';

export const OverviewDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { products, violations, manufacturers, complaints, setSelectedProduct, setSelectedViolation } =
    useComplianceStore();
  const navigate = useNavigate();

  const [timeRange, setTimeRange] = useState<'3M' | '6M' | 'All'>('6M');
  const [zoneFilter, setZoneFilter] = useState<string>('All');
  const [matrixView, setMatrixView] = useState<'bengaluru' | 'national'>('bengaluru');
  const [showAnalyticsMobile, setShowAnalyticsMobile] = useState(false);

  const filteredTrends =
    timeRange === '3M'
      ? COMPLIANCE_TRENDS.slice(-3)
      : timeRange === '6M'
      ? COMPLIANCE_TRENDS.slice(-6)
      : COMPLIANCE_TRENDS;

  // Compute live Bengaluru zonal metrics directly from the Manufacturer tab data
  const bengaluruZones = useMemo(() => computeBengaluruZonalRisk(manufacturers), [manufacturers]);

  const filteredBengaluruZones = bengaluruZones.filter((z) => {
    if (zoneFilter === 'High Risk') return z.riskScore >= 60;
    if (zoneFilter === 'Compliant') return z.compliancePercentage >= 85;
    if (zoneFilter !== 'All') return z.code === zoneFilter || z.zone === zoneFilter;
    return true;
  });

  const filteredStates = STATE_COMPLIANCE_METRICS.filter((s) => {
    if (zoneFilter === 'High Risk') return s.riskScore >= 60;
    if (zoneFilter === 'Compliant') return s.compliancePercentage >= 85;
    if (zoneFilter !== 'All') return s.code === zoneFilter || s.state === zoneFilter;
    return true;
  });

  const handleInspectProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      navigate('/dashboard/products');
    }
  };

  const handleInspectViolation = (violationId: string) => {
    const violation = violations.find((v) => v.id === violationId);
    if (violation) {
      setSelectedViolation(violation);
      navigate('/dashboard/violations');
    }
  };

  const criticalIssuesCount = violations.filter((v) => v.severity === 'critical').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Top Banner / Role Welcome ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {user?.role === 'admin' ? 'Enforcement Supervisor' : user?.role === 'inspector' ? 'Zonal Field Inspector' : 'Citizen Desk'}
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome, {user?.name || 'Officer'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
            {user?.role === 'admin'
              ? 'Central directorate supervisor oversight & statutory Show Cause Notice authorization.'
              : user?.role === 'inspector'
              ? 'Personal field telemetry, assigned grievance inspections & packaging audit metrics.'
              : 'Registered citizen representative for national product vigilance.'}
          </p>
        </div>

        {/* Primary Action Button — Mobile single primary CTA first */}
        <div className="flex items-center gap-2.5 flex-col sm:flex-row w-full md:w-auto">
          <Link to="/dashboard/scanner" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="sm"
              className="w-full sm:w-auto text-xs font-bold gap-2 min-h-[44px] justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Scan className="h-4 w-4" />
              <span>Start Packaging Scan</span>
            </Button>
          </Link>

          <Link to="/dashboard/violations" className="w-full sm:w-auto hidden sm:block">
            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs gap-1.5 min-h-[40px] justify-center">
              <Gavel className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Enforcement Ledger</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── MOBILE KPI STATS (Task-focused 3-stat summary on <md) ── */}
      <div className="grid grid-cols-3 gap-2 sm:hidden">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-red-200/80 dark:border-red-900/60 text-center shadow-xs">
          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-tight block">
            Critical
          </span>
          <span className="text-xl font-black font-mono text-red-700 dark:text-red-300 block my-0.5">
            {criticalIssuesCount || 3}
          </span>
          <span className="text-[9px] text-slate-400 block">Issues</span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 text-center shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight block">
            Compliance
          </span>
          <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300 block my-0.5">
            86%
          </span>
          <span className="text-[9px] text-slate-400 block">National Avg</span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-200/80 dark:border-blue-900/60 text-center shadow-xs">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight block">
            Audits
          </span>
          <span className="text-xl font-black font-mono text-blue-700 dark:text-blue-300 block my-0.5">
            {products.length || 124}
          </span>
          <span className="text-[9px] text-slate-400 block">Verified</span>
        </div>
      </div>

      {/* ── DESKTOP KPI STATS GRID ── */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
        {user?.role === 'inspector' ? (
          <>
            <StatCard
              title="Your Assigned Grievances"
              titleClassName="text-blue-700 dark:text-blue-400 font-bold"
              value={formatNumber(complaints.filter((c) => c.status === 'Assigned for Inspection' || c.status === 'Investigation').length || 8)}
              valueClassName="text-blue-700 dark:text-blue-400 font-bold font-mono"
              change="Active"
              trend="up"
              trendLabel="Personal Field Queue"
              variant="accent"
            />
            <StatCard
              title="Field Scans Conducted"
              titleClassName="text-blue-600 dark:text-blue-400 font-bold"
              value="1,240"
              valueClassName="text-blue-600 dark:text-blue-400 font-bold font-mono"
              change="+14.2%"
              trend="up"
              trendLabel="OCR Optical Verifications"
              variant="accent"
            />
            <StatCard
              title="Field Violations Flagged"
              titleClassName="text-red-600 dark:text-red-400 font-bold"
              value="18"
              valueClassName="text-red-600 dark:text-red-400 font-bold font-mono"
              change="3 SCN Pending"
              trend="up"
              trendLabel="Forwarded to Supervisor"
              variant="danger"
            />
            <StatCard
              title="Zonal Compliance Index"
              titleClassName="text-emerald-700 dark:text-emerald-400 font-bold"
              value="94.2%"
              valueClassName="text-emerald-700 dark:text-emerald-400 font-bold font-mono"
              change="+1.8%"
              trend="up"
              trendLabel="Bengaluru Circle SLA"
              variant="success"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Active Products Analyzed"
              value={formatNumber(NATIONAL_STATS.productsAnalyzed)}
              change="+14.2%"
              trend="up"
              trendLabel="vs last month"
              variant="accent"
            />
            <StatCard
              title="Violations Flagged"
              titleClassName="text-red-600 dark:text-red-400 font-bold"
              value={formatNumber(NATIONAL_STATS.violationsDetected)}
              valueClassName="text-red-600 dark:text-red-400 font-bold font-mono"
              change="+8.1%"
              trend="up"
              trendLabel="Critical: 1,420"
              variant="danger"
            />
            <StatCard
              title="High-Risk Manufacturers"
              titleClassName="text-amber-700 dark:text-amber-400 font-bold"
              value={formatNumber(manufacturers.filter((m) => m.riskScore >= 60).length)}
              change="Live Sync"
              trend="down"
              trendLabel="Bengaluru Industrial Hubs"
              variant="warning"
            />
            <StatCard
              title="Citizen Grievances & Complaints"
              titleClassName="text-red-600 dark:text-red-400 font-bold"
              value={formatNumber(NATIONAL_STATS.consumerComplaints)}
              valueClassName="text-red-600 dark:text-red-400 font-bold font-mono"
              change="6.4 Days"
              trend="neutral"
              trendLabel="Avg Resolution SLA"
              variant="danger"
            />
          </>
        )}
      </div>

      {/* ── MOBILE PROGRESSIVE DISCLOSURE: Toggle Detailed Analytics & Charts ── */}
      <div className="block lg:hidden">
        <button
          type="button"
          onClick={() => setShowAnalyticsMobile(!showAnalyticsMobile)}
          className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Detailed Compliance Analytics &amp; Charts</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
            <span>{showAnalyticsMobile ? 'Hide' : 'View'}</span>
            {showAnalyticsMobile ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>
      </div>

      {/* Main Charts & Live Ticker Section — Visible always on desktop (lg:grid), collapsible on mobile */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${showAnalyticsMobile ? 'block' : 'hidden lg:grid'}`}>
        {user?.role === 'inspector' ? (
          <div className="lg:col-span-12">
            <InspectorFieldTrajectoryChart />
          </div>
        ) : (
          <>
            {/* National Compliance Trajectory Dual-Axis Chart */}
            <div className="lg:col-span-12">
              <NationalComplianceTrajectoryChart data={filteredTrends} />
            </div>

            {/* Right: Category Risk Distribution Bar Chart */}
            <div className="lg:col-span-12">
              <Card className="h-full flex flex-col justify-between">
                <CardHeader>
                  <div>
                    <CardTitle>
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span>Category Risk Matrix</span>
                    </CardTitle>
                    <CardDescription>Violation rate by commodity group</CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={CATEGORY_RISK_METRICS}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                      <XAxis type="number" stroke="#94A3B8" fontSize={10} tickFormatter={(v) => `${v}%`} />
                      <YAxis
                        type="category"
                        dataKey="category"
                        stroke="#475569"
                        fontSize={10}
                        width={80}
                        tickFormatter={(v) => v.split(' ')[0]}
                      />
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
                      <Bar dataKey="violationRate" radius={[0, 4, 4, 0]}>
                        {CATEGORY_RISK_METRICS.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.riskLevel === 'Critical'
                                ? '#DC2626'
                                : entry.riskLevel === 'High'
                                ? '#EA580C'
                                : entry.riskLevel === 'Medium'
                                ? '#2563EB'
                                : '#16A34A'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Bottom Row: Priority Cases & Zonal Risk Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Priority Cases Ledger Preview */}
        <div className={user?.role === 'inspector' ? 'lg:col-span-12 flex flex-col' : 'lg:col-span-7 flex flex-col'}>
          <Card className="flex flex-col h-full justify-between">
            <div>
              <CardHeader>
                <div>
                  <CardTitle>
                    <ShieldAlert className="h-4 w-4 text-red-600" />
                    <span className="text-red-600 dark:text-red-400 font-bold">High-Priority Enforcement Queue</span>
                  </CardTitle>
                  <CardDescription>
                    Urgent statutory notices requiring officer authorization or hearing.
                  </CardDescription>
                </div>
                <Link to="/dashboard/violations">
                  <Button variant="ghost" size="sm" className="text-xs text-blue-600">
                    View All ({violations.length}) →
                  </Button>
                </Link>
              </CardHeader>

              <div className="divide-y divide-slate-100 text-xs">
                {violations.slice(0, 7).map((violation) => (
                  <div
                    key={violation.id}
                    onClick={() => handleInspectViolation(violation.id)}
                    className="p-2.5 sm:p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between cursor-pointer transition-colors gap-3"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {violation.productName}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                        {violation.caseNumber} • {violation.ruleCode}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                      <div className="w-24 text-right hidden sm:block shrink-0">
                        <div className="font-bold text-slate-800 dark:text-slate-200 font-mono text-xs whitespace-nowrap">
                          {formatCurrency(violation.penaltyEstimate)}
                        </div>
                        <div className="text-[10px] text-slate-400 whitespace-nowrap">Est. Penalty</div>
                      </div>
                      <div className="w-36 flex items-center justify-end shrink-0">
                        <StatusBadge status={violation.status} />
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 mt-auto">
              <span className="flex items-center gap-1 font-mono">
                <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                Active Legal Metrology Notices
              </span>
              <Link
                to="/dashboard/violations"
                className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View All Enforcement Cases ({violations.length})</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Bengaluru Zonal & Industrial Risk Matrix (Admin Only) */}
        {user?.role !== 'inspector' && (
          <div className="lg:col-span-5 flex flex-col">
            <Card className="flex flex-col h-full justify-between">
            <div>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span>
                    {matrixView === 'bengaluru'
                      ? 'Bengaluru Zonal Risk Matrix'
                      : 'National State Matrix'}
                  </span>
                </CardTitle>
                <CardDescription>
                  {matrixView === 'bengaluru'
                    ? 'Aggregated from registered industries in the Manufacturer directory'
                    : 'Zonal Legal Metrology inspection performance'}
                </CardDescription>
              </div>

              {/* View Switcher & Dynamic Zone Filter */}
              <div className="flex items-center gap-2">
                {user?.role === 'admin' && (
                  <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[10px] font-semibold">
                    <button
                      onClick={() => {
                        setMatrixView('bengaluru');
                        setZoneFilter('All');
                      }}
                      className={`px-2 py-0.5 rounded ${
                        matrixView === 'bengaluru'
                          ? 'bg-white shadow-xs text-blue-700 font-bold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Bengaluru
                    </button>
                    <button
                      onClick={() => {
                        setMatrixView('national');
                        setZoneFilter('All');
                      }}
                      className={`px-2 py-0.5 rounded ${
                        matrixView === 'national'
                          ? 'bg-white shadow-xs text-blue-700 font-bold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      National
                    </button>
                  </div>
                )}

                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-mono text-slate-800 focus:border-blue-600 focus:outline-none max-w-[140px]"
                >
                  <option value="All">
                    All {matrixView === 'bengaluru' ? 'Areas' : 'States'} (
                    {matrixView === 'bengaluru' ? bengaluruZones.length : STATE_COMPLIANCE_METRICS.length})
                  </option>
                  <option value="High Risk">High Risk (Risk ≥ 60)</option>
                  <option value="Compliant">High Compliance (≥ 85%)</option>
                  {matrixView === 'bengaluru'
                    ? bengaluruZones.map((z) => (
                        <option key={z.code} value={z.code}>
                          {z.code} – {z.zone.split(' ')[0]}
                        </option>
                      ))
                    : STATE_COMPLIANCE_METRICS.map((st) => (
                        <option key={st.code} value={st.code}>
                          {st.state} ({st.code})
                        </option>
                      ))}
                </select>
              </div>
            </CardHeader>

            <div className="p-0 overflow-x-auto">
              {matrixView === 'bengaluru' ? (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-3.5 py-2.5">Industrial Zone / Area</th>
                      <th className="px-2.5 py-2.5">Facilities</th>
                      <th className="px-2.5 py-2.5">Compliance</th>
                      <th className="px-3.5 py-2.5 text-right">Zonal Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBengaluruZones.map((zone) => (
                      <tr
                        key={zone.code}
                        onClick={() => navigate('/dashboard/manufacturers')}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        title="Click to view industries in this zone"
                      >
                        <td className="px-3.5 py-2.5 text-slate-900">
                          <div>
                            <div className="font-semibold text-slate-900 text-[11px] leading-tight">
                              {zone.zone}
                            </div>
                            <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                              {zone.keyFacilities.length > 0
                                ? zone.keyFacilities.join(', ')
                                : zone.keyIndustries}
                            </div>
                          </div>
                        </td>
                        <td className="px-2.5 py-2.5 font-mono text-slate-700 text-[11px]">
                          <span className="font-semibold text-slate-900">{zone.facilitiesCount}</span> Units
                          {zone.activeCases > 0 && (
                            <span className="ml-1.5 text-[10px] text-red-600 font-semibold">
                              ({zone.activeCases} {zone.activeCases === 1 ? 'alert' : 'alerts'})
                            </span>
                          )}
                        </td>
                        <td className="px-2.5 py-2.5 font-mono">
                          <span
                            className={
                              zone.compliancePercentage >= 85
                                ? 'text-emerald-700 font-semibold'
                                : zone.compliancePercentage >= 70
                                ? 'text-amber-700 font-semibold'
                                : 'text-red-700 font-semibold'
                            }
                          >
                            {zone.compliancePercentage}%
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              zone.riskScore >= 70
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : zone.riskScore >= 40
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {zone.riskScore}/100
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredBengaluruZones.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                          No Bengaluru industrial zones matching the selected filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5">State / Zone</th>
                      <th className="px-3 py-2.5">Active Cases</th>
                      <th className="px-3 py-2.5">Compliance</th>
                      <th className="px-4 py-2.5 text-right">Risk Index</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStates.map((state) => (
                      <tr key={state.code} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <span>{state.state}</span>
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-700">
                          {formatNumber(state.activeCases)}
                        </td>
                        <td className="px-3 py-3 font-mono">
                          <span
                            className={
                              state.compliancePercentage >= 85
                                ? 'text-emerald-700 font-semibold'
                                : 'text-amber-700 font-semibold'
                            }
                          >
                            {state.compliancePercentage}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              state.riskScore >= 70
                                ? 'bg-red-50 text-red-700'
                                : state.riskScore >= 40
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {state.riskScore}/100
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredStates.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                          No states matching the selected filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 mt-auto">
            <span className="flex items-center gap-1 font-mono">
              <MapPin className="h-3.5 w-3.5 text-blue-600" />
              Bengaluru City Circle (BBMP)
            </span>
            <Link
              to="/dashboard/manufacturers"
              className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View Manufacturer Tab ({manufacturers.length} Units)</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>
          </div>
        )}
      </div>
    </div>
  );
};
