import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  AlertTriangle,
  FileCheck2,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useComplianceStore } from '../../store/complianceStore';
import { useScanStore } from '../../store/scanStore';
import { Button } from '../ui/Button';
import { AnimatedThemeToggler } from '../ui/AnimatedThemeToggler';
import { Loader2, Scan } from 'lucide-react';

interface TopbarProps {
  onOpenCommandPalette: () => void;
  onToggleMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenCommandPalette, onToggleMobileMenu }) => {
  const { user, logout } = useAuthStore();
  const { violations } = useComplianceStore();
  const { isProcessing, currentProgress, currentScan } = useScanStore();
  const navigate = useNavigate();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isConsumer = user?.role === 'consumer';

  const officerNotifications = [
    {
      id: 1,
      title: 'Critical Disparity Detected',
      message: 'Cadbury Bournvita 500g: "Health Drink" sugar content advisory disparity. Section 36 SCN proposed.',
      time: '12m ago',
      type: 'critical',
    },
    {
      id: 2,
      title: 'Hearing Scheduled',
      message: 'Case #CCPA/ENF/2025/SZ-0418 hearing listed for 28 Feb 2025.',
      time: '45m ago',
      type: 'info',
    },
    {
      id: 3,
      title: 'New Consumer Grievance',
      message: 'Citizen filed Dual MRP complaint for Flipkart order #771-0029311.',
      time: '2h ago',
      type: 'warning',
    },
  ];

  const consumerNotifications = [
    {
      id: 1,
      title: 'Grievance Under Investigation',
      message: 'Your deceptive packaging complaint #GRV-2025-001 was assigned to Zonal Legal Metrology Inspector.',
      time: '15m ago',
      type: 'info',
    },
    {
      id: 2,
      title: 'Packaging Evidence Verified',
      message: 'AI OCR verified 18% overprinted MRP violation on invoice #INV-9921.',
      time: '1h ago',
      type: 'info',
    },
    {
      id: 3,
      title: 'Statutory Notice Dispatched',
      message: 'CCPA has served statutory inquiry notice to manufacturer with 14-day compliance window.',
      time: '3h ago',
      type: 'warning',
    },
  ];

  const notifications = isConsumer ? consumerNotifications : officerNotifications;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Drawer Trigger + Mobile App Title + Search Bar Trigger */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-lg min-w-0">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile Page / Brand Title */}
        <div className="flex items-center gap-1.5 md:hidden truncate">
          <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white truncate">
            Satya<span className="text-blue-600 dark:text-blue-400">Drishti</span>
          </span>
        </div>

        {/* Desktop Search Bar (Hidden on Mobile) */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex w-full items-center justify-between px-3 py-2 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-xs transition-colors group min-h-[40px]"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
            <span className="text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 truncate">
              {isConsumer
                ? 'Search Grievances or Brands...'
                : 'Quick Search (Ctrl + K)...'}
            </span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 font-mono text-[10px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-semibold shadow-xs">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Mobile Search Icon Button (Tap opens full command palette) */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label="Open search palette"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Background Scan Active Indicator */}
        {isProcessing && (
          <button
            onClick={() => navigate('/dashboard/scanner')}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 transition-all shadow-xs animate-pulse"
            title="Product scanning active in background • Click to open Scanner"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400" />
            <span className="hidden md:inline">
              {(currentScan?.angles?.length || 0) > 1 || currentScan?.isMultiAngle
                ? 'Multi-Angle Scan'
                : 'Scanning Product'}
            </span>
            <span className="font-mono text-[10px] sm:text-[11px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full">
              {currentProgress}%
            </span>
          </button>
        )}

        {/* Animated Theme Toggler */}
        <AnimatedThemeToggler />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileOpen(false);
            }}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {isNotificationsOpen && (
            <>
              {/* Mobile Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 sm:hidden"
                onClick={() => setIsNotificationsOpen(false)}
              />

              {/* Mobile Bottom Sheet (Visible strictly on <sm) */}
              <div className="fixed inset-x-2 bottom-4 z-50 sm:hidden max-h-[70vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-950/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {isConsumer ? 'Grievance Alerts' : 'Compliance Alerts'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 text-[10px] font-bold font-mono">
                      {notifications.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-w-[36px] min-h-[36px] flex items-center justify-center"
                    aria-label="Close notification panel"
                  >
                    <span className="text-sm font-bold">✕</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        if (n.type === 'warning') {
                          navigate('/dashboard/complaints');
                        } else {
                          navigate('/dashboard/violations');
                        }
                      }}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-slate-900 dark:text-white truncate pr-2">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {n.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
                  <button
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      navigate(isConsumer ? '/dashboard/complaints' : '/dashboard/violations');
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 font-semibold min-h-[36px] w-full flex items-center justify-center"
                  >
                    {isConsumer ? 'Track All My Grievances →' : 'View All Active Violations →'}
                  </button>
                </div>
              </div>

              {/* Desktop Notification Dropdown (Unchanged desktop layout) */}
              <div className="hidden sm:block absolute right-0 mt-2 w-96 bg-white dark:bg-slate-900 rounded-xl shadow-modal border border-slate-200 dark:border-slate-800 py-2 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {isConsumer ? 'Grievance Alerts' : 'Compliance Alerts'} ({notifications.length})
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {isConsumer ? 'Consumer Desk' : 'Real-Time Ingestion'}
                  </span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        if (n.type === 'warning') {
                          navigate('/dashboard/complaints');
                        } else {
                          navigate('/dashboard/violations');
                        }
                      }}
                      className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white">{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{n.message}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      navigate(isConsumer ? '/dashboard/complaints' : '/dashboard/violations');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {isConsumer ? 'Track All My Grievances →' : 'View All Active Violations →'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors min-h-[40px]"
            aria-label="Profile menu"
          >
            <div className={`h-8 w-8 rounded-lg text-white flex items-center justify-center text-xs font-bold font-mono ${
              isConsumer ? 'bg-emerald-700' : 'bg-[#0F172A]'
            }`}>
              {user?.name.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-left text-xs">
              <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">{user?.name}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium font-sans">
                {user?.role === 'admin' ? 'Supervisor' : user?.role === 'inspector' ? 'Inspector' : 'Consumer'}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-xs sm:w-64 bg-white dark:bg-slate-900 rounded-xl shadow-modal border border-slate-200 dark:border-slate-800 py-2 z-30 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white">{user?.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{user?.email}</div>
                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-wider font-mono">
                  {user?.role === 'admin' ? 'Supervisor' : user?.role === 'inspector' ? 'Inspector' : 'Consumer'}
                </div>
              </div>

              {isConsumer && (
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/dashboard/complaints');
                    }}
                    className="w-full px-4 py-2 text-left text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 font-medium min-h-[40px]"
                  >
                    <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>My Lodged Complaints</span>
                  </button>
                </div>
              )}

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-medium min-h-[40px]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout from Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
