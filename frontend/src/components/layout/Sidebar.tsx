'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Play,
  ListTodo,
  FlaskConical,
  Plug,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  GitCompare,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
}

const navItems: NavItem[] = [
  { href: '/overview', label: 'Overview', icon: <LayoutDashboard size={20} />, shortcut: 'o' },
  { href: '/generate', label: 'Generate', icon: <Play size={20} />, shortcut: 'g' },
  { href: '/jobs', label: 'Jobs', icon: <ListTodo size={20} />, shortcut: 'j' },
  { href: '/feedback', label: 'Feedback', icon: <MessageSquare size={20} />, shortcut: 'f' },
  { href: '/experiments', label: 'Experiments', icon: <FlaskConical size={20} />, shortcut: 'e' },
  { href: '/adapters', label: 'Adapters', icon: <Plug size={20} />, shortcut: 'a' },
  { href: '/ab-tests', label: 'A/B Tests', icon: <GitCompare size={20} />, shortcut: 't' },
  { href: '/datasets', label: 'Datasets', icon: <Database size={20} />, shortcut: 'd' },
  { href: '/settings', label: 'Settings', icon: <Settings size={20} />, shortcut: 's' },
];

// Hook to detect screen size
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Auto-collapse on tablet
  useEffect(() => {
    if (isTablet && !isMobile) {
      setCollapsed(true);
    }
  }, [isTablet, isMobile]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Mobile menu toggle button (rendered outside sidebar for mobile)
  const MobileMenuButton = () => (
    <button
      onClick={() => setMobileOpen(!mobileOpen)}
      className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-md bg-card border border-border shadow-sm"
      aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
    >
      {mobileOpen ? <X size={20} /> : <Menu size={20} />}
    </button>
  );

  // Overlay for mobile
  const MobileOverlay = () => (
    <div
      className={cn(
        'fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-opacity',
        mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={() => setMobileOpen(false)}
    />
  );

  return (
    <>
      {isMobile && <MobileMenuButton />}
      {isMobile && <MobileOverlay />}
      
      <aside
        className={cn(
          'flex flex-col bg-card border-r border-border transition-all duration-300',
          // Desktop styles
          'hidden md:flex',
          collapsed ? 'w-16' : 'w-56',
          // Mobile styles
          isMobile && 'fixed inset-y-0 left-0 z-50 w-64',
          isMobile && (mobileOpen ? 'flex translate-x-0' : 'hidden -translate-x-full')
        )}
      >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-border">
        <Image
          src="/logo.png"
          alt="Text2Song Studio Logo"
          width={32}
          height={32}
          className="flex-shrink-0"
        />
        {!collapsed && (
          <span className="ml-2 font-semibold text-foreground truncate">
            Text2Song Studio
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const showLabel = isMobile || !collapsed;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  title={!showLabel ? item.label : undefined}
                  onClick={() => isMobile && setMobileOpen(false)}
                >
                  {item.icon}
                  {showLabel && <span>{item.label}</span>}
                  {showLabel && item.shortcut && !isMobile && (
                    <kbd className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      g {item.shortcut}
                    </kbd>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle - hidden on mobile */}
      {!isMobile && (
        <div className="p-2 border-t border-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )}
    </aside>
    </>
  );
}
