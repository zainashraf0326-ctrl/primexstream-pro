'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { NotificationButton } from '@/components/notification-button';
import { useApp } from '@/components/providers/app-provider';
import { ArrowLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useApp();
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname?.startsWith('/admin');
  const showAppHeader = !isPublicPage && Boolean(title);
  const fallbackHref =
    pathname === '/payment'
      ? '/iptv'
      : pathname === '/support'
      ? '/dashboard'
      : '/dashboard';

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark">
      <main
        className={`w-full ${isPublicPage ? '' : 'pb-[calc(var(--bottom-nav-height)+1.5rem)]'}`}
      >
        {showAppHeader && (
          <section className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85 md:px-6">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                    {title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {user?.id && <NotificationButton userId={user.id} />}
                {user && (
                  <Link
                    href="/settings"
                    aria-label="Open profile settings"
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold shadow-sm transition-colors ${
                      pathname === '/settings'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}
        <div className="w-full">{children}</div>
      </main>

      <WhatsAppButton />
      <div className="fixed -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-orange-200/5 to-transparent rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
