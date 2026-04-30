'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/app-provider';
import { useAdmin } from '@/components/providers/admin-provider';
import AdminLayout from '@/components/admin-layout';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getConfig,
  updateConfig,
  getAdminContent,
  updateAdminContent,
  ConfigData,
  AdminContent,
} from '@/lib/supabase-service';
import { Settings, Save, AlertCircle, CheckCircle, DollarSign, Phone, BookOpen } from 'lucide-react';

export default function AdminEditorPage() {
  const { isLoggedIn, isLoading } = useApp();
  const { isAdmin } = useAdmin();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'plans' | 'payments' | 'services' | 'discounts'>('plans');
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [adminContent, setAdminContent] = useState<AdminContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [planEdits, setPlanEdits] = useState<any>({
    plan1Month: {},
    plan6Month: {},
    plan12Month: {},
  });

  const [paymentEdits, setPaymentEdits] = useState<any>({
    remitly: { isActive: true, instructions: '', accountInfo: '', discount: 0 },
    binance: { isActive: true, instructions: '', accountInfo: '', discount: 0 },
    paypal: { isActive: false, instructions: '', accountInfo: '', discount: 0 },
    cashapp: { isActive: false, instructions: '', accountInfo: '', discount: 0 },
  });

  const [serviceEdits, setServiceEdits] = useState<any>({
    locksmith: { name: 'Locksmith', phone: '' },
    treeTrimming: { name: 'Tree Trimming', phone: '' },
    roofing: { name: 'Roofing', phone: '' },
    plumbing: { name: 'Plumbing', phone: '' },
    electrician: { name: 'Electrician', phone: '' },
    custom: { name: 'Custom Services', phone: '' },
  });

  const [discountEdits, setDiscountEdits] = useState<any>({
    generalDiscount: 0,
    referralBonus: 0,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn || !isAdmin) {
      router.push('/login');
      return;
    }

    loadData();
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configData, contentData] = await Promise.all([
        getConfig(),
        getAdminContent(),
      ]);

      if (configData) {
        setConfig(configData);
        setPlanEdits({
          plan1Month: { ...configData.plans.plan1Month },
          plan6Month: { ...configData.plans.plan6Month },
          plan12Month: { ...configData.plans.plan12Month },
        });

        setPaymentEdits({
          remitly: { instructions: '', accountInfo: '', discount: 0, ...configData.paymentMethods.remitly, isActive: configData.paymentMethods.remitly?.isActive ?? true },
          binance: { instructions: '', accountInfo: '', discount: 0, ...configData.paymentMethods.binance, isActive: configData.paymentMethods.binance?.isActive ?? true },
          paypal: { isActive: false, instructions: '', accountInfo: '', discount: 0 },
          cashapp: { isActive: false, instructions: '', accountInfo: '', discount: 0 },
        });

        setDiscountEdits({
          generalDiscount: configData.plans.extraDiscount || 0,
          referralBonus: configData.referral.bonusAmount || 0,
        });
      }

      if (contentData) {
        setAdminContent(contentData);
        if (contentData.homeServices) {
          setServiceEdits(contentData.homeServices);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const savePlans = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const updatedConfig = {
        ...config,
        plans: {
          plan1Month: planEdits.plan1Month,
          plan6Month: planEdits.plan6Month,
          plan12Month: planEdits.plan12Month,
          extraDiscount: discountEdits.generalDiscount,
        },
      };

      const success = await updateConfig(updatedConfig);
      if (success) {
        setConfig(updatedConfig);
        setMessage({ type: 'success', text: 'Plans updated successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save plans' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving plans' });
    } finally {
      setSaving(false);
    }
  };

  const savePayments = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const updatedConfig = {
        ...config,
        paymentMethods: {
          binance: {
            isActive: paymentEdits.binance.isActive,
            extraDiscount: paymentEdits.binance.discount,
            instructions: paymentEdits.binance.instructions,
            accountInfo: paymentEdits.binance.accountInfo,
          },
          remitly: {
            isActive: paymentEdits.remitly.isActive,
            extraDiscount: paymentEdits.remitly.discount,
            instructions: paymentEdits.remitly.instructions,
            accountInfo: paymentEdits.remitly.accountInfo,
          },
          paypal: {
            isActive: paymentEdits.paypal.isActive,
            extraDiscount: paymentEdits.paypal.discount,
            instructions: paymentEdits.paypal.instructions,
            accountInfo: paymentEdits.paypal.accountInfo,
          },
          cashapp: {
            isActive: paymentEdits.cashapp.isActive,
            extraDiscount: paymentEdits.cashapp.discount,
            instructions: paymentEdits.cashapp.instructions,
            accountInfo: paymentEdits.cashapp.accountInfo,
          },
        },
      };

      const success = await updateConfig(updatedConfig);
      if (success) {
        setConfig(updatedConfig);
        setMessage({ type: 'success', text: 'Payment methods updated!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving payment methods' });
    } finally {
      setSaving(false);
    }
  };

  const saveServices = async () => {
    setSaving(true);
    try {
      const updated = await updateAdminContent({
        homeServices: serviceEdits,
      });

      if (updated) {
        setMessage({ type: 'success', text: 'Home services updated!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving services' });
    } finally {
      setSaving(false);
    }
  };

  const saveDiscounts = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const updatedConfig = {
        ...config,
        plans: {
          ...config.plans,
          extraDiscount: discountEdits.generalDiscount,
        },
        referral: {
          ...config.referral,
          bonusAmount: discountEdits.referralBonus,
        },
      };

      const success = await updateConfig(updatedConfig);
      if (success) {
        setConfig(updatedConfig);
        setMessage({ type: 'success', text: 'Discounts updated!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving discounts' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <AdminLayout title="Content Editor">
        <div className="max-w-screen-2xl mx-auto px-6 py-12">
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Content Editor">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              Content & Settings Management
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Edit plans, payment methods, services, and discounts
            </p>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <p className={
                message.type === 'success'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-700 dark:text-red-400'
              }>
                {message.text}
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
            {['plans', 'payments', 'services', 'discounts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-3 border-b-2 font-semibold transition-colors ${
                  activeTab === tab
                    ? 'border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              {['plan1Month', 'plan6Month', 'plan12Month'].map((planKey) => (
                <Card key={planKey} className="glass">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {planKey === 'plan1Month' ? '1 Month Plan' : planKey === 'plan6Month' ? '6 Months Plan' : '12 Months Plan'}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                            Plan Name
                          </label>
                          <Input
                            value={planEdits[planKey]?.name || ''}
                            onChange={(e) =>
                              setPlanEdits({
                                ...planEdits,
                                [planKey]: { ...planEdits[planKey], name: e.target.value },
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                            Regular Price ($)
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={planEdits[planKey]?.price || 0}
                            onChange={(e) =>
                              setPlanEdits({
                                ...planEdits,
                                [planKey]: { ...planEdits[planKey], price: parseFloat(e.target.value) },
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                            Sale Price ($)
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={planEdits[planKey]?.salePrice || 0}
                            onChange={(e) =>
                              setPlanEdits({
                                ...planEdits,
                                [planKey]: { ...planEdits[planKey], salePrice: parseFloat(e.target.value) },
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                            Features
                          </label>
                          <Input
                            value={planEdits[planKey]?.features || ''}
                            onChange={(e) =>
                              setPlanEdits({
                                ...planEdits,
                                [planKey]: { ...planEdits[planKey], features: e.target.value },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                onClick={savePlans}
                disabled={saving}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving Plans...' : 'Save All Plans'}
              </Button>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              {Object.entries(paymentEdits).map(([method, settings]: [string, any]) => (
                <Card key={method} className="glass">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                          {method}
                        </h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.isActive}
                            onChange={(e) =>
                              setPaymentEdits({
                                ...paymentEdits,
                                [method]: { ...settings, isActive: e.target.checked },
                              })
                            }
                            className="w-5 h-5"
                          />
                          <span className="text-sm font-semibold">Active</span>
                        </label>
                      </div>

                      {settings.isActive && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                              Instructions
                            </label>
                            <textarea
                              value={settings.instructions}
                              onChange={(e) =>
                                setPaymentEdits({
                                  ...paymentEdits,
                                  [method]: { ...settings, instructions: e.target.value },
                                })
                              }
                              rows={3}
                              className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                              placeholder="Enter payment instructions..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                              Account Information
                            </label>
                            <textarea
                              value={settings.accountInfo}
                              onChange={(e) =>
                                setPaymentEdits({
                                  ...paymentEdits,
                                  [method]: { ...settings, accountInfo: e.target.value },
                                })
                              }
                              rows={3}
                              className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                              placeholder="Enter account details..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                              Extra Discount (%)
                            </label>
                            <Input
                              type="number"
                              step="1"
                              value={settings.discount}
                              onChange={(e) =>
                                setPaymentEdits({
                                  ...paymentEdits,
                                  [method]: { ...settings, discount: parseInt(e.target.value) },
                                })
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                onClick={savePayments}
                disabled={saving}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Payment Methods'}
              </Button>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              {Object.entries(serviceEdits).map(([serviceKey, service]: [string, any]) => (
                <Card key={serviceKey} className="glass">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {service.name}
                      </h3>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          <Phone className="w-4 h-4 inline mr-2" />
                          Service Phone Number
                        </label>
                        <Input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={service.phone || ''}
                          onChange={(e) =>
                            setServiceEdits({
                              ...serviceEdits,
                              [serviceKey]: { ...service, phone: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                onClick={saveServices}
                disabled={saving}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Home Services'}
              </Button>
            </div>
          )}

          {activeTab === 'discounts' && (
            <div className="space-y-6">
              <Card className="glass">
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-orange-600" />
                    General Discount
                  </h3>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Discount Percentage (%)
                    </label>
                    <Input
                      type="number"
                      step="1"
                      value={discountEdits.generalDiscount}
                      onChange={(e) =>
                        setDiscountEdits({
                          ...discountEdits,
                          generalDiscount: parseInt(e.target.value),
                        })
                      }
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      Applied as extra discount to all plans
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    Referral Bonus
                  </h3>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Bonus Amount ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={discountEdits.referralBonus}
                      onChange={(e) =>
                        setDiscountEdits({
                          ...discountEdits,
                          referralBonus: parseFloat(e.target.value),
                        })
                      }
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      Bonus credit per successful referral
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={saveDiscounts}
                disabled={saving}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Discounts & Bonuses'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
