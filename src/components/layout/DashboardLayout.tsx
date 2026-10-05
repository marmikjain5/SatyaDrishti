import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileBottomNav } from './MobileBottomNav';
import { CommandPalette } from './CommandPalette';
import { GlobalScanNotification } from './GlobalScanNotification';
import { useAuthStore } from '../../store/authStore';
import { GridPattern } from '../ui/GridPattern';
import { cn } from '../../lib/utils';

export const DashboardLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Protected route check
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Consumer Portal Restriction: Consumers are strictly scoped to the Complaints portal
  if (user?.role === 'consumer' && location.pathname !== '/dashboard/complaints') {
    return <Navigate to="/dashboard/complaints" replace />;
  }

  // Inspector Portal Restriction: Restrict crawler and manufacturer features
  if (user?.role === 'inspector' && (location.pathname === '/dashboard/crawler' || location.pathname === '/dashboard/manufacturers')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-x-hidden">
      {/* Global Background Grid Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <GridPattern
          width={48}
          height={48}
          squares={[
            [4, 3],
            [12, 6],
            [18, 2],
            [6, 14],
            [22, 10],
            [15, 18],
            [28, 14],
            [8, 24],
            [24, 22],
            [30, 8],
            [3, 30],
          ]}
          className={cn(
            '[mask-image:radial-gradient(1200px_circle_at_50%_200px,white,transparent_85%)]',
            'opacity-70 fill-blue-600/[0.04] stroke-slate-900/[0.04] dark:fill-blue-400/[0.08] dark:stroke-white/[0.05]'
          )}
        />
      </div>

      {/* Sidebar (Desktop persistent + Mobile off-canvas drawer) */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area  -  Responsive Left Inset (0 on mobile, 64/18 on lg+) */}
      <div
        className={`transition-all duration-300 flex flex-col min-h-screen relative z-10 pl-0 ${
          isSidebarCollapsed ? 'lg:pl-18' : 'lg:pl-64'
        }`}
      >
        {/* Topbar */}
        <Topbar
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        {/* Page View Viewport with Bottom Navigation Spacing */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Role-Aware Mobile Bottom Navigation Bar (Mobile / Tablet only) */}
      <MobileBottomNav
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Global Background Scan Progress & Completion Notification */}
      <GlobalScanNotification />
    </div>
  );
};

