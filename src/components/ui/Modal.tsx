import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  className?: string;
  theme?: 'light' | 'dark';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '2xl',
  className,
  // theme prop is kept for API compatibility but no longer drives styling  - 
  // the Modal now follows the system dark class on <html> via Tailwind `dark:` variants.
  theme: _theme,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden sm:overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'relative w-full rounded-t-2xl sm:rounded-xl overflow-hidden z-10 shadow-2xl transition-colors max-h-[90vh] sm:max-h-[92vh] flex flex-col',
              'bg-white border-t sm:border border-slate-200 text-slate-900 shadow-modal',
              'dark:bg-slate-900 dark:border-slate-800 dark:text-white',
              maxWidthClasses[maxWidth],
              className
            )}
          >
            {/* Header */}
            <div
              className={cn(
                'px-4 sm:px-6 py-3.5 sm:py-4 border-b flex items-center justify-between shrink-0',
                'border-slate-200/80 bg-slate-50/50',
                'dark:border-slate-800 dark:bg-slate-950/80'
              )}
            >
              <div>
                <h3
                  className={cn(
                    'text-base font-semibold tracking-tight',
                    'text-slate-900',
                    'dark:text-white dark:font-bold'
                  )}
                >
                  {title}
                </h3>
                {subtitle && (
                  <p
                    className={cn(
                      'text-xs mt-0.5',
                      'text-slate-500',
                      'dark:text-slate-400'
                    )}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className={cn(
                  'rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors',
                  'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60',
                  'dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                )}
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div
              className={cn(
                'flex-1 overflow-y-auto p-3 sm:p-6 scrollbar-thin',
                'bg-white',
                'dark:bg-slate-900 dark:text-white'
              )}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
