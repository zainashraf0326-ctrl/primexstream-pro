'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getConfig, onConfigChange, ConfigData } from './supabase-service';

interface ConfigContextType {
  config: ConfigData | null;
  loading: boolean;
  error: string | null;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initConfig = async () => {
      try {
        setLoading(true);
        const initialConfig = await getConfig();
        setConfig(initialConfig);
        
        // Listen for real-time changes
        unsubscribe = onConfigChange((updatedConfig) => {
          setConfig(updatedConfig);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading config');
        console.error('Error initializing config:', err);
      } finally {
        setLoading(false);
      }
    };

    initConfig();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading, error }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
