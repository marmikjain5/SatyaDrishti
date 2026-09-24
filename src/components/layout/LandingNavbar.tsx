import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Terminal, Menu, X, BookOpen, Layers, GitBranch, Home } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AnimatedThemeToggler } from '../ui/AnimatedThemeToggler';
import { useAuthStore } from '../../store/authStore';

export const LandingNavbar: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDirectoryActive = location.pathname === '/' || location.pathname === '/directory' || location.pathname === '/verify';
  const isAboutActive = location.pathname === '/about' && (!location.hash || location.hash === '#about');
  const isCapabilitiesActive = location.pathname === '/about' && location.hash === '#capabilities';
  const isWorkflowActive = location.pathname === '/about' && location.hash === '#workflow';

  const handleNavClick = (targetId: string) => {
    setIsMobileMenuOpen(false);
    if (location.pathname === '/about') {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 group">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                Satya<span className="text-blue-600 dark:text-blue-400">Drishti</span>
              </span>
              <Badge variant="primary" size="sm" className="hidden sm:inline-flex text-[10px]">
                GOV-INTEL
              </Badge>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider uppercase font-semibold -mt-0.5">
              Consumer Protection &amp; Compliance
            </p>
          </div>
        </Link>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center space-x-2 lg:space-x-4 text-sm font-medium">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isDirectoryActive
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Product Directory</span>
          </Link>

          <Link
            to="/about#about"
            onClick={() => handleNavClick('about')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isAboutActive
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            About Platform
          </Link>

          <Link
            to="/about#capabilities"
            onClick={() => handleNavClick('capabilities')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isCapabilitiesActive
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Core Capabilities
          </Link>

          <Link
            to="/about#workflow"
            onClick={() => handleNavClick('workflow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isWorkflowActive
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Enforcement Flow
          </Link>

          <Link
            to="/technical-blog"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              location.pathname === '/technical-blog'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Technical Blog
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <AnimatedThemeToggler />

          {/* Desktop Auth Button */}
          <div className="hidden sm:block">
            {isAuthenticated && user ? (
              <Link to={user.role === 'consumer' ? '/dashboard/complaints' : '/dashboard'}>
                <Button
                  variant="primary"
                  size="sm"
                  className={`gap-2 text-xs font-semibold ${
                    user.role === 'consumer'
                      ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white'
                      : ''
                  }`}
                >
                  <span>{user.role === 'consumer' ? 'Consumer Grievances' : `Dashboard (${user.role})`}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm" className="gap-2 text-xs font-semibold">
                  <Terminal className="h-3.5 w-3.5 text-blue-300" />
                  <span>Portal Login</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 backdrop-blur-lg px-4 py-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150 shadow-xl">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] transition-colors ${
              isDirectoryActive
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Product Directory &amp; Verification</span>
          </Link>

          <Link
            to="/about#about"
            onClick={() => handleNavClick('about')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] transition-colors ${
              isAboutActive
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>About Platform</span>
          </Link>

          <Link
            to="/about#capabilities"
            onClick={() => handleNavClick('capabilities')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] transition-colors ${
              isCapabilitiesActive
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="h-4 w-4 shrink-0" />
            <span>Core Capabilities</span>
          </Link>

          <Link
            to="/about#workflow"
            onClick={() => handleNavClick('workflow')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] transition-colors ${
              isWorkflowActive
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GitBranch className="h-4 w-4 shrink-0" />
            <span>Enforcement Flow</span>
          </Link>

          <Link
            to="/technical-blog"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold min-h-[44px] transition-colors ${
              location.pathname === '/technical-blog'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span>Technical Blog &amp; Story</span>
          </Link>

          {/* Auth Button in Mobile Menu */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {isAuthenticated && user ? (
              <Link
                to={user.role === 'consumer' ? '/dashboard/complaints' : '/dashboard'}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full block"
              >
                <Button
                  variant="primary"
                  className={`w-full justify-center min-h-[44px] gap-2 text-xs font-semibold ${
                    user.role === 'consumer'
                      ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white'
                      : ''
                  }`}
                >
                  <span>{user.role === 'consumer' ? 'Consumer Grievances' : `Dashboard (${user.role})`}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full block">
                <Button variant="primary" className="w-full justify-center min-h-[44px] gap-2 text-xs font-semibold">
                  <Terminal className="h-4 w-4 text-blue-300" />
                  <span>Portal Login (Officer / Citizen)</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

