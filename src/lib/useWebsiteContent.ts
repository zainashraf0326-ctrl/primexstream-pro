'use client';

import { useState, useEffect } from 'react';
import { listenToSettings, Settings, defaultSettings } from '@/lib/admin-supabase-service';

/**
 * Hook to fetch website settings from Supabase
 * Usage: const settings = useWebsiteSettings();
 */
export function useWebsiteSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToSettings((data) => {
      setSettings(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { settings, loading };
}

/**
 * Hook to fetch only home page content
 * Usage: const homeContent = useHomeContent();
 */
export function useHomeContent() {
  const { settings, loading } = useWebsiteSettings();

  return {
    title: settings.homeTitle,
    subtitle: settings.homeSubtitle,
    description: settings.homeDescription,
    cta: settings.homeCta,
    ctaLink: settings.homeCtaLink,
    loading,
  };
}

/**
 * Hook to fetch only contact information
 * Usage: const contact = useContactInfo();
 */
export function useContactInfo() {
  const { settings, loading } = useWebsiteSettings();

  return {
    phone: settings.contactInfo?.phone || '+1 (555) 123-4567',
    email: settings.contactInfo?.email || 'support@primexstream.pro',
    whatsapp: settings.contactInfo?.whatsapp || '+1 (555) 123-4567',
    address: settings.contactInfo?.address || '123 Main Street',
    hours: settings.contactInfo?.hours || 'Mon - Fri: 9AM - 6PM',
    loading,
  };
}

/**
 * Hook to fetch social links
 * Usage: const socials = useSocialLinks();
 */
export function useSocialLinks() {
  const { settings, loading } = useWebsiteSettings();

  return {
    facebook: settings.socialLinks?.facebook || '',
    twitter: settings.socialLinks?.twitter || '',
    instagram: settings.socialLinks?.instagram || '',
    youtube: settings.socialLinks?.youtube || '',
    telegram: settings.socialLinks?.telegram || '',
    whatsapp: settings.socialLinks?.whatsapp || '',
    loading,
  };
}

/**
 * Hook to fetch site name and meta info
 * Usage: const siteInfo = useSiteInfo();
 */
export function useSiteInfo() {
  const { settings, loading } = useWebsiteSettings();

  return {
    name: settings.siteName,
    description: settings.siteDescription,
    url: settings.siteUrl,
    seoTitle: settings.seoTitle,
    seoDescription: settings.seoDescription,
    seoKeywords: settings.seoKeywords,
    loading,
  };
}

/**
 * Hook to fetch payment settings
 * Usage: const payment = usePaymentSettings();
 */
export function usePaymentSettings() {
  const { settings, loading } = useWebsiteSettings();

  return {
    instructions: settings.paymentInstructions,
    methods: settings.paymentMethods || [],
    bankAccounts: settings.bankAccounts || [],
    loading,
  };
}

/**
 * Hook to fetch features
 * Usage: const features = useFeatures();
 */
export function useFeatures() {
  const { settings, loading } = useWebsiteSettings();

  return {
    features: (settings.features || []).sort((a, b) => (a.order || 0) - (b.order || 0)),
    loading,
  };
}

/**
 * Hook to fetch services
 * Usage: const services = useServices();
 */
export function useServices() {
  const { settings, loading } = useWebsiteSettings();

  return {
    services: settings.services || [],
    loading,
  };
}

/**
 * Hook to check maintenance mode
 * Usage: const isMaintenance = useMaintenanceMode();
 */
export function useMaintenanceMode() {
  const { settings, loading } = useWebsiteSettings();

  return {
    isEnabled: settings.maintenanceMode,
    loading,
  };
}
