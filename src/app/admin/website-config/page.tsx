'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/app-provider';
import { useAdmin } from '@/components/providers/admin-provider';
import AdminLayout from '@/components/admin-layout';
import { getWebConfig, updateWebConfig, WebConfigData } from '@/lib/webconfig-service';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Save } from 'lucide-react';

export default function WebsiteConfigPage() {
  const { isLoggedIn, isLoading } = useApp();
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const [config, setConfig] = useState<WebConfigData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn || !isAdmin) {
      router.push('/admin/login');
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getWebConfig();
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
      setMessage({ type: 'error', text: 'Failed to load configuration' });
    } finally {
      setPageLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setLoading(true);
    try {
      const success = await updateWebConfig(config);
      if (success) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' });
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save configuration' });
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Error saving configuration' });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || pageLoading) {
    return (
      <AdminLayout title="Website Configuration">
        <div className="text-center py-12">
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!config) {
    return (
      <AdminLayout title="Website Configuration">
        <div className="text-center py-12">
          <p className="text-slate-600 dark:text-slate-400">Failed to load configuration</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Website Configuration">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <p
              className={
                message.type === 'success'
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Site Settings */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Site Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Site Title
              </label>
              <Input
                value={config.siteTitle || ''}
                onChange={(e) =>
                  setConfig({ ...config, siteTitle: e.target.value })
                }
                placeholder="PrimexStream Pro"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Site Description
              </label>
              <Input
                value={config.siteDescription || ''}
                onChange={(e) =>
                  setConfig({ ...config, siteDescription: e.target.value })
                }
                placeholder="Premium IPTV Service"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Email
              </label>
              <Input
                value={config.contact?.email || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    contact: { ...config.contact, email: e.target.value } as any,
                  })
                }
                placeholder="support@primexstream.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Phone
              </label>
              <Input
                value={config.contact?.phone || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    contact: { ...config.contact, phone: e.target.value } as any,
                  })
                }
                placeholder="+1234567890"
              />
            </div>
          </div>
        </Card>

        {/* Plan Prices */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Plan Prices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(config.planPrices || {}).map(([planId, price]) => (
              <div key={planId}>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  {planId.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-slate-400">$</span>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        planPrices: {
                          ...(config.planPrices || {}),
                          [planId]: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Features */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Features
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-slate-900 dark:text-white font-medium">
                Referral Program
              </label>
              <input
                type="checkbox"
                checked={config.features?.referralEnabled ?? true}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    features: {
                      referralEnabled: e.target.checked,
                      socialTasksEnabled: config.features?.socialTasksEnabled ?? true,
                      walletEnabled: config.features?.walletEnabled ?? true,
                    },
                  })
                }
                className="w-5 h-5"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-slate-900 dark:text-white font-medium">
                Social Tasks
              </label>
              <input
                type="checkbox"
                checked={config.features?.socialTasksEnabled ?? true}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    features: {
                      referralEnabled: config.features?.referralEnabled ?? true,
                      socialTasksEnabled: e.target.checked,
                      walletEnabled: config.features?.walletEnabled ?? true,
                    },
                  })
                }
                className="w-5 h-5"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-slate-900 dark:text-white font-medium">
                Wallet System
              </label>
              <input
                type="checkbox"
                checked={config.features?.walletEnabled ?? true}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    features: {
                      referralEnabled: config.features?.referralEnabled ?? true,
                      socialTasksEnabled: config.features?.socialTasksEnabled ?? true,
                      walletEnabled: e.target.checked,
                    },
                  })
                }
                className="w-5 h-5"
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
