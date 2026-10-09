import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';

export interface SmartInfoTooltipProps {
  term: string;
  meaning: string;
  example: string;
  className?: string;
}

interface Position {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
}

const GAP = 10;
const VIEWPORT_PADDING = 12;
const shownTermCounts = new Map<string, number>();

const normalizeTerm = (term: string) => term
  .toLowerCase()
  .replace(/\([^)]*\)/g, '')
  .replace(/\s+/g, ' ')
  .trim();

/** A compact, accessible explainer for technical terms used in SatyaDrishti. */
export const SmartInfoTooltip: React.FC<SmartInfoTooltipProps> = ({
  term,
  meaning,
  example,
  className = '',
}) => {
  const termClaimedRef = useRef(false);
  const normalizedTerm = normalizeTerm(term);
  const shownCount = shownTermCounts.get(normalizedTerm) ?? 0;
  const showIcon = termClaimedRef.current || shownCount < 2;
  if (!termClaimedRef.current && showIcon) {
    shownTermCounts.set(normalizedTerm, shownCount + 1);
    termClaimedRef.current = true;
  }

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0, placement: 'bottom' });

  const isVisible = open || hovering;

  const updatePosition = () => {
    const trigger = triggerRef.current;
    const popup = popupRef.current;
    if (!trigger || !popup) return;

    const triggerRect = trigger.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    const roomBelow = window.innerHeight - triggerRect.bottom;
    const placement = roomBelow < popupRect.height + GAP && triggerRect.top > popupRect.height + GAP ? 'top' : 'bottom';
    const rawTop = placement === 'top'
      ? triggerRect.top - popupRect.height - GAP
      : triggerRect.bottom + GAP;
    const rawLeft = triggerRect.left + triggerRect.width / 2 - popupRect.width / 2;

    setPosition({
      top: Math.max(VIEWPORT_PADDING, Math.min(rawTop, window.innerHeight - popupRect.height - VIEWPORT_PADDING)),
      left: Math.max(VIEWPORT_PADDING, Math.min(rawLeft, window.innerWidth - popupRect.width - VIEWPORT_PADDING)),
      placement,
    });
  };

  useLayoutEffect(() => {
    if (isVisible) updatePosition();
  }, [isVisible, meaning, example]);

  useEffect(() => {
    if (!isVisible) return;

    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !popupRef.current?.contains(target)) {
        setOpen(false);
        setHovering(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setHovering(false);
        triggerRef.current?.focus();
      }
    };
    const handleViewportChange = () => updatePosition();

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isVisible]);

  if (!showIcon) {
    return <span className={className}>{term}</span>;
  }

  return (
    <span className={`inline-flex items-center align-baseline gap-0.5 ${className}`}>
      <span>{term}</span>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Explain ${term}`}
        aria-expanded={isVisible}
        aria-controls={`smart-info-${term.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`}
        className="smart-info-trigger inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/60 dark:text-blue-300 dark:hover:bg-blue-400/15 dark:hover:text-blue-200"
        onClick={() => {
          setOpen((previous) => !previous);
          setHovering(false);
        }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2.3} />
      </button>

      {isVisible && createPortal(
        <div
          ref={popupRef}
          id={`smart-info-${term.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`}
          role="dialog"
          aria-label={`${term} explanation`}
          className="smart-info-popup fixed z-[100] w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-blue-200/90 bg-white/95 p-3 text-left text-[11px] leading-relaxed text-slate-700 shadow-[0_14px_35px_rgba(15,67,125,0.18)] backdrop-blur-md dark:border-blue-400/25 dark:bg-slate-900/95 dark:text-slate-200"
          style={{ top: position.top, left: position.left }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <div className="mb-2 flex items-start justify-between gap-3 border-b border-blue-100 pb-2 dark:border-slate-700">
            <div className="font-semibold text-blue-800 dark:text-blue-200">{term}</div>
            <button
              type="button"
              aria-label={`Close ${term} explanation`}
              className="-mr-1 -mt-1 rounded-md p-1 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/60 dark:hover:bg-slate-800 dark:hover:text-blue-200"
              onClick={() => {
                setOpen(false);
                setHovering(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p><span className="font-semibold text-slate-900 dark:text-white">Simple meaning:</span> {meaning}</p>
          <p className="mt-1"><span className="font-semibold text-slate-900 dark:text-white">Real example:</span> {example}</p>
          <span
            aria-hidden="true"
            className={`absolute h-2.5 w-2.5 rotate-45 border-blue-200/90 bg-white/95 dark:border-blue-400/25 dark:bg-slate-900/95 ${position.placement === 'top' ? '-bottom-1.5 border-b border-r' : '-top-1.5 border-l border-t'}`}
            style={{ left: Math.max(16, Math.min(44, triggerRef.current ? triggerRef.current.getBoundingClientRect().left + triggerRef.current.offsetWidth / 2 - position.left - 5 : 20)) }}
          />
        </div>,
        document.body,
      )}
    </span>
  );
};

export default SmartInfoTooltip;
