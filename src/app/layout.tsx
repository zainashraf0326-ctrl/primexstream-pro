import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AppProvider } from '@/components/providers/app-provider';
import { GuestCheckoutProvider } from '@/components/providers/guest-checkout-context';
import { AdminProvider } from '@/components/providers/admin-provider';
import { BottomNavigation } from '@/components/bottom-navigation';
import { GlowBackground } from '@/components/glow-background';
import { LoadingBar } from '@/components/loading-bar';
import { NativeShell } from '@/components/mobile/native-shell';
import { MobileRouteGuard } from '@/components/mobile/mobile-route-guard';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <title>PrimexStream Pro - Premium IPTV & Services</title>
        <meta name="description" content="Premium IPTV services, home repair, and earn programs" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-white dark:bg-black min-h-screen">
        <ThemeProvider>
          <AppProvider>
            <GuestCheckoutProvider>
              <AdminProvider>
                <NativeShell />
                <MobileRouteGuard />
                <GlowBackground />
                <LoadingBar />
                {children}
                <BottomNavigation />
              </AdminProvider>
            </GuestCheckoutProvider>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

