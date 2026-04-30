'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export function NativeShell() {
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    let removeBackButtonListener: (() => void) | undefined;

    const setupNativeChrome = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setOverlaysWebView({ overlay: false });
        await SplashScreen.hide();
      } catch {
        // Ignore plugin errors on unsupported environments.
      }
    };

    const setupBackButton = async () => {
      const listener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
          return;
        }
        CapacitorApp.exitApp();
      });
      removeBackButtonListener = () => {
        void listener.remove();
      };
    };

    const reportError = (type: 'error' | 'unhandledrejection', value: unknown) => {
      const payload = {
        type,
        message: value instanceof Error ? value.message : String(value),
        stack: value instanceof Error ? value.stack : undefined,
        path: window.location.pathname,
        ts: new Date().toISOString(),
      };

      try {
        const existing = JSON.parse(localStorage.getItem('mobile_error_logs') || '[]') as unknown[];
        const next = [payload, ...existing].slice(0, 50);
        localStorage.setItem('mobile_error_logs', JSON.stringify(next));
      } catch {
        // Ignore telemetry storage failures.
      }
    };

    const onError = (event: ErrorEvent) => {
      reportError('error', event.error ?? event.message);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportError('unhandledrejection', event.reason);
    };

    void setupNativeChrome();
    void setupBackButton();
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      removeBackButtonListener?.();
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
