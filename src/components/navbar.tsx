'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/components/providers/app-provider';
import { NotificationButton } from '@/components/notification-button';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user, logout } = useApp();
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hide navbar on AppLayout pages and admin routes
  const isAppLayoutPage = /^\/(dashboard|iptv|earn|orders|support|settings)/.test(pathname);
  const isAdminPage = pathname?.startsWith('/admin');
  
  useEffect(() => {
    setMounted(true);
    const darkMode = document.documentElement.classList.contains('dark');
    setIsDark(darkMode);
  }, []);

  // Return null after all hooks are called
  if (isAppLayoutPage || isAdminPage) {
    return null;
  }

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Home' },
    { href: '/iptv', label: 'IPTV' },
    { href: '/earn', label: 'Earn' },
    { href: '/orders', label: 'Orders' },
    { href: '/support', label: 'Support' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="sticky top-0 z-50 w-full">
      <nav className="glass border-b border-slate-200/80 dark:border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white hidden sm:inline">PrimexStream</span>
            </Link>

            {/* Desktop Navigation */}
            {isLoggedIn && (
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Notification Button */}
              {isLoggedIn && user?.id && mounted && (
                <NotificationButton userId={user.id} />
              )}

              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  {isDark ? '☀️' : '🌙'}
                </button>
              )}

              {/* Profile Dropdown / Auth Buttons */}
              <div className="relative">
                {isLoggedIn ? (
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold hover:shadow-lg transition-all"
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/login')}
                    >
                      Login
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => router.push('/login')}
                    >
                      Sign Up
                    </Button>
                  </div>
                )}

                {/* Profile Dropdown Menu */}
                {isProfileOpen && isLoggedIn && (
                  <div className="absolute right-0 mt-2 w-48 glass rounded-2xl py-2 shadow-xl">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{user?.email}</p>
                    </div>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 text-sm font-medium"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              {isLoggedIn && (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  ) : (
                    <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isLoggedIn && isMobileMenuOpen && (
            <div className="md:hidden pb-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
