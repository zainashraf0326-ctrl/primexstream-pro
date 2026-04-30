'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

const blockedMobileRoutes = ['/admin', '/diagnostics', '/test-data', '/uploads', '/home-repair'];

export function MobileRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    const isBlocked = blockedMobileRoutes.some((route) =>
      pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isBlocked) {
      router.replace('/dashboard');
    }
  }, [pathname, router]);

  return null;
}
