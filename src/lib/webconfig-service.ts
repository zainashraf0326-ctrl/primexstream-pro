/**
 * Web Configuration Service
 * Manages website settings stored in Supabase.
 */

import { supabase } from '@/lib/supabase-config';

export interface WebConfigData {
  id: string;
  planPrices?: {
    [key: string]: number;
  };
  siteTitle?: string;
  siteDescription?: string;
  maintenanceMode?: boolean;
  features?: {
    referralEnabled: boolean;
    socialTasksEnabled: boolean;
    walletEnabled: boolean;
  };
  contact?: {
    email: string;
    phone: string;
    whatsapp: string;
  };
  updatedAt: string;
}

const CONFIG_DOC = 'web_config';

const defaultWebConfig: WebConfigData = {
  id: CONFIG_DOC,
  planPrices: {
    '1month': 100,
    '3month': 250,
    '6month': 450,
    '12month': 800,
  },
  siteTitle: 'PrimexStream Pro',
  siteDescription: 'Premium IPTV Service',
  maintenanceMode: false,
  features: {
    referralEnabled: true,
    socialTasksEnabled: true,
    walletEnabled: true,
  },
  contact: {
    email: 'support@primexstream.com',
    phone: '',
    whatsapp: '',
  },
  updatedAt: new Date().toISOString(),
};

export const getWebConfig = async (): Promise<WebConfigData | null> => {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('value, updated_at')
      .eq('id', CONFIG_DOC)
      .maybeSingle();

    if (error) throw error;

    if (!data?.value) {
      return defaultWebConfig;
    }

    return {
      ...defaultWebConfig,
      ...(data.value as Partial<WebConfigData>),
      id: CONFIG_DOC,
      updatedAt: data.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting web config:', error);
    return null;
  }
};

export const updateWebConfig = async (config: WebConfigData): Promise<boolean> => {
  try {
    const { id, updatedAt, ...configData } = config;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('app_config')
      .upsert({
        id: CONFIG_DOC,
        value: {
          ...configData,
          updatedAt: now,
        },
        updated_at: now,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating web config:', error);
    throw error;
  }
};

export const getPlanPrice = async (planId: string): Promise<number | null> => {
  try {
    const config = await getWebConfig();
    return config?.planPrices?.[planId] ?? null;
  } catch (error) {
    console.error('Error getting plan price:', error);
    return null;
  }
};

export const updatePlanPrice = async (planId: string, price: number): Promise<boolean> => {
  try {
    const config = await getWebConfig();
    if (!config) return false;

    return updateWebConfig({
      ...config,
      planPrices: {
        ...(config.planPrices || {}),
        [planId]: price,
      },
    });
  } catch (error) {
    console.error('Error updating plan price:', error);
    return false;
  }
};

export const initializeWebConfig = async (): Promise<void> => {
  const config = await getWebConfig();
  if (!config) {
    await updateWebConfig(defaultWebConfig);
  }
};
