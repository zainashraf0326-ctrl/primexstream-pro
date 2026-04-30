'use client';

import { ReactNode } from 'react';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const pathname = usePathname();
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname?.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark">
      <main
        className={`w-full ${isPublicPage ? '' : 'pb-[calc(var(--bottom-nav-height)+1.5rem)]'}`}
      >
        {!isPublicPage && title && (
          <section className="px-4 pt-5 pb-2 md:px-6">
            <div className="mx-auto w-full max-w-5xl">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
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
