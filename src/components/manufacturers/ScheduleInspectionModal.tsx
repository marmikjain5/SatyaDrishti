import React, { useState } from 'react';
import {
  UserCheck,
  Send,
  CheckCircle2,
  MapPin,
  Building2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Manufacturer } from '../../types/compliance';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { sendSurpriseInspectionNoticeEmail, SendEmailResult } from '../../services/gmailService';

interface ScheduleInspectionModalProps {
  manufacturer: Manufacturer | null;
  isOpen: boolean;
  onClose: () => void;
}

interface InspectorContact {
  id: string;
  name: string;
  role: string;
  zone: string;
  email: string;
  badge: string;
  isConnected: boolean;
}

const INSPECTORS: InspectorContact[] = [
  {
    id: 'arjun',
    name: 'Inspector Arjun Nair & Team',
    role: 'Senior Legal Metrology Inspector (Bengaluru City Zone 1)',
    zone: 'Bengaluru Metropolitan Region (BBMP) Enforcement Cell',
    email: 'arjun.nair.inspect@satyadrishti.gov.in',
    badge: 'LM-BLR-4001',
    isConnected: true,
  },
  {
    id: 'marmik',
    name: 'Inspector Marmik Jain & Team',
    role: 'Senior Regional Compliance Inspector',
    zone: 'North Zone Industrial Cell',
    email: 'marmik.jain.inspect@satyadrishti.gov.in',
    badge: 'OFF-IND-902',
    isConnected: false,
  },
  {
    id: 'krish',
    name: 'Inspector Krish Jain & Team',
    role: 'Senior Regional Compliance Inspector',
    zone: 'South Zone Industrial Cell',
    email: 'krish.jain.inspect@satyadrishti.gov.in',
    badge: 'OFF-IND-903',
    isConnected: false,
  },
];

export const ScheduleInspectionModal: React.FC<ScheduleInspectionModalProps> = ({
  manufacturer,
  isOpen,
  onClose,
}) => {
  const [selectedInspectorId, setSelectedInspectorId] = useState<string>('arjun');
  const [priority, setPriority] = useState<string>('Immediate / Surprise Audit');
  const [notes, setNotes] = useState<string>(
    'Execute unannounced surprise physical inspection. Audit packaging declarations, Legal Metrology compliance, net quantity verification, and MRP accuracy.'
  );
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<SendEmailResult | null>(null);

  if (!manufacturer) return null;

  const selectedInspector = INSPECTORS.find((i) => i.id === selectedInspectorId) || INSPECTORS[0];

  const handleDispatch = async () => {
    setIsDispatching(true);
    setDispatchResult(null);

    const result = await sendSurpriseInspectionNoticeEmail({
      factoryId: manufacturer.id,
      factoryName: manufacturer.name,
      registrationNumber: manufacturer.cin || manufacturer.gstin || 'REG-MFG-2026',
      location: manufacturer.registeredAddress,
      city: manufacturer.zone.split(' ')[0] || 'Bengaluru',
      state: 'Karnataka',
      category: manufacturer.primaryCategory || 'Packaged Commodities',
      overallScore: Math.max(0, 100 - manufacturer.riskScore),
      complianceStatus: manufacturer.riskTier === 'Critical' ? 'critical' : manufacturer.riskTier === 'High' ? 'warning' : 'compliant',
      activeAlerts: manufacturer.activeViolations,
      openViolationsCount: manufacturer.activeViolations,
      assignedOfficer: selectedInspector.name,
      officerEmail: selectedInspector.email,
      priority: priority,
      directiveNotes: notes,
    });

    setIsDispatching(false);
    setDispatchResult(result);
  };

  const handleResetAndClose = () => {
    setDispatchResult(null);
    onClose();
  };

  const riskBadgeVariant =
    manufacturer.riskTier === 'Critical'
      ? 'danger'
      : manufacturer.riskTier === 'High'
      ? 'warning'
      : manufacturer.riskTier === 'Moderate'
      ? 'secondary'
      : 'success';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title="Schedule Surprise Facility Inspection"
      subtitle="Dispatch statutory surprise audit directive via Gmail API"
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* ── Manufacturer Summary Banner ── */}
        <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
              <span className="font-bold text-slate-900 text-base">{manufacturer.name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                {manufacturer.zone}
              </span>
              <span>CIN: {manufacturer.cin}</span>
              <span>GSTIN: {manufacturer.gstin}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Risk Score</div>
              <span
                className={`text-lg font-bold ${
                  manufacturer.riskScore > 80
                    ? 'text-red-600'
                    : manufacturer.riskScore > 50
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {manufacturer.riskScore}/100
              </span>
            </div>
            <Badge variant={riskBadgeVariant} size="md">
              {manufacturer.riskTier.toUpperCase()}
            </Badge>
          </div>
        </div>

        {dispatchResult ? (
          /* ── Dispatch Success State ── */
          <div className="p-6 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-emerald-950">
                  Surprise Inspection Directive Dispatched Successfully!
                </h3>
                <p className="text-xs text-emerald-800 mt-1">
                  Statutory surprise inspection notice has been routed to{' '}
                  <span className="font-semibold">{selectedInspector.name}</span> ({dispatchResult.recipient}).
                </p>
              </div>
            </div>

            <div className="p-3 bg-white/90 rounded-lg border border-emerald-100 font-mono text-xs space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Dispatch Mode:</span>
                <span className="font-bold text-emerald-700">{dispatchResult.mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Directive Ref:</span>
                <span className="font-bold">{dispatchResult.messageId || 'PND-9921'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Lead:</span>
                <span>{selectedInspector.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Facility Location:</span>
                <span>{manufacturer.registeredAddress}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="primary" onClick={handleResetAndClose}>
                Done & Return to Risk Ranking
              </Button>
            </div>
          </div>
        ) : (
          /* ── Dispatch Form ── */
          <div className="space-y-5">
            {/* Inspector Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assign Regulatory Enforcement Officer / Cell
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {INSPECTORS.map((insp) => {
                  const isSelected = insp.id === selectedInspectorId;
                  return (
                    <div
                      key={insp.id}
                      onClick={() => setSelectedInspectorId(insp.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all relative ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-900 leading-tight block">
                            {insp.name}
                          </span>
                          <span className="text-[10px] text-slate-500 block">{insp.role}</span>
                        </div>
                        {insp.isConnected && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded-full shrink-0">
                            LIVE
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <span>Badge: {insp.badge}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Priority and Mandate Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Audit Priority & Order Type
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Immediate / Surprise Audit">Immediate Unannounced Surprise Audit (High Priority)</option>
                  <option value="Notice Follow-up Inspection">Show Cause Notice (SCN) Verification Follow-up</option>
                  <option value="Routine Metrology Verification">Routine Metrology & Declaration Verification</option>
                  <option value="Repeat Offender Zonal Raid">Zonal Enforcement Raid (Repeat Offender)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Dispatch Delivery Target
                </label>
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
                  <UserCheck className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="truncate">{selectedInspector.email}</span>
                </div>
              </div>
            </div>

            {/* Notes / Directives */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Special Directives & Inspection Scope (Included in Official Order)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Specific instructions for the inspection team..."
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>Orders are dispatched via Google Cloud OAuth Gmail API</span>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={onClose} disabled={isDispatching}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDispatch}
                  isLoading={isDispatching}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Dispatch Directive Email
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
