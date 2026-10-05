/**
 * ScanOptionsCard — Pre-scan configuration panel
 *
 * Lets the officer set the calibration method used for Rule 7 physical measurement.
 *
 * Matches the UI shown in the ClauseCam (26034) demo screenshots.
 */

import React from 'react';
import {
  Ruler,
  Info,
  CircleDot,
  CreditCard,
  Barcode,
  XCircle,
  Cpu,
  ScanLine,
} from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import type { ReferenceObjectType } from '../../lib/rule7Measurement';
import { getLidarCompatibility } from '../../services/lidarCompatibilityService';

// ─── Calibration Method ───────────────────────────────────────────

export type CalibrationMethod = 'none' | 'reference_object' | 'artwork_dpi' | 'lidar_depth';

interface CalibrationOption {
  value: CalibrationMethod;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}

const CALIBRATION_OPTIONS: CalibrationOption[] = [
  {
    value: 'none',
    label: 'None (no reference object in frame)',
    description: 'Rule 7 letter height will be estimated — verdict will be REVIEW_REQUIRED.',
    icon: XCircle,
  },
  {
    value: 'reference_object',
    label: 'Reference object in frame (coin, card or barcode)',
    description: 'Place a ₹10 coin, ID card, or barcode alongside the product for exact mm measurement.',
    icon: CircleDot,
  },
  {
    value: 'artwork_dpi',
    label: 'Rasterised artwork at a known DPI',
    description: 'If scanning a pre-print digital artwork file, enter the DPI to convert pixels to mm.',
    icon: Cpu,
  },
  {
    value: 'lidar_depth',
    label: 'LiDAR depth (ARKit native bridge)',
    description: 'Uses an iPhone/iPad ARKit wrapper when connected. If unavailable, the result stays unable to verify.',
    icon: ScanLine,
  },
];

const REFERENCE_OBJECT_OPTIONS: { value: ReferenceObjectType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { value: 'coin_10',     label: '₹10 Coin (27.0 mm ⌀, RBI-confirmed)',     icon: CircleDot },
  { value: 'id_card',     label: 'ID Card / Credit Card (85.6 × 54.0 mm)',   icon: CreditCard },
  { value: 'ean_barcode', label: 'EAN-13 Barcode (standard reference size)',  icon: Barcode },
];

// ─── Props ────────────────────────────────────────────────────────

export interface ScanOptionsValue {
  calibrationMethod: CalibrationMethod;
  referenceObjectType: ReferenceObjectType;
  artworkDpi: number;
}

interface ScanOptionsCardProps {
  value: ScanOptionsValue;
  onChange: (updated: ScanOptionsValue) => void;
  disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────

export const ScanOptionsCard: React.FC<ScanOptionsCardProps> = ({ value, onChange, disabled }) => {
  const lidar = getLidarCompatibility();
  const set = <K extends keyof ScanOptionsValue>(key: K, val: ScanOptionsValue[K]) =>
    onChange({ ...value, [key]: val });

  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      <CardContent className="p-4 sm:p-5 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center shrink-0">
            <Ruler className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Scan Options</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Configure Rule 7 calibration before scanning</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Calibration method
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mb-2">
            Defines the real-world scale reference for Rule 7 letter height evaluation.
          </p>
          <select
            id="scan-options-calibration-method"
            disabled={disabled}
            value={value.calibrationMethod}
            onChange={(e) => set('calibrationMethod', e.target.value as CalibrationMethod)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 px-3 py-2.5 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {CALIBRATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Description hint */}
          {value.calibrationMethod !== 'none' && (
            <div className="flex items-start gap-1.5 mt-1.5 px-2.5 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
              <Info className="h-3.5 w-3.5 text-indigo-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-snug">
                {CALIBRATION_OPTIONS.find((o) => o.value === value.calibrationMethod)?.description}
              </p>
            </div>
          )}

          {/* Reference object sub-selector */}
          {value.calibrationMethod === 'reference_object' && (
            <div className="mt-2 space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Reference object type
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {REFERENCE_OBJECT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = value.referenceObjectType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => set('referenceObjectType', opt.value)}
                      className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg border text-left text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 text-indigo-800 dark:text-indigo-200'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* DPI input */}
          {value.calibrationMethod === 'artwork_dpi' && (
            <div className="mt-2 space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Artwork DPI
              </label>
              <input
                type="number"
                id="scan-options-artwork-dpi"
                min={72}
                max={1200}
                step={1}
                disabled={disabled}
                value={value.artworkDpi}
                onChange={(e) => set('artworkDpi', parseInt(e.target.value) || 300)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 px-3 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
              <p className="text-[10px] text-slate-400">Common values: 72 (screen), 150, 300 (print), 600</p>
            </div>
          )}

          {value.calibrationMethod === 'lidar_depth' && (
            <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
              {lidar.connected ? 'ARKit bridge connected. LiDAR calibration can be requested.' : 'ARKit bridge not connected in this browser. LiDAR remains unavailable until the native iOS wrapper is connected.'}
            </p>
          )}
        </div>

      </CardContent>
    </Card>
  );
};

// ─── Default values ───────────────────────────────────────────────

export const DEFAULT_SCAN_OPTIONS: ScanOptionsValue = {
  calibrationMethod: 'none',
  referenceObjectType: 'coin_10',
  artworkDpi: 300,
};
