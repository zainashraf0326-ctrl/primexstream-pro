'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Tv, TrendingUp, PackageOpen, Settings } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/iptv', label: 'IPTV', icon: Tv },
  { href: '/earn', label: 'Earn', icon: TrendingUp },
  { href: '/orders', label: 'Orders', icon: PackageOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNavigation() {
  const pathname = usePathname();

  // Hide bottom nav only on public/auth/admin routes so app pages never feel stranded.
  if (pathname === '/' || pathname === '/login' || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2 shadow-[0_-12px_28px_rgba(15,23,42,0.14)] backdrop-blur-lg dark:border-slate-700/70 dark:bg-slate-950/95">
      <nav aria-label="Primary navigation" className="mx-auto w-full max-w-md">
        <div className="grid h-[var(--bottom-nav-height)] grid-cols-5 gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== '/dashboard' && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-all duration-200 active:scale-[0.98] ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-semibold leading-none">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
