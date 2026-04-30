'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/components/providers/admin-provider';
import AdminLayout from '@/components/admin-layout';
import { listenToSettings, updateSettings, Settings, defaultSettings } from '@/lib/admin-supabase-service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, Save, AlertCircle } from 'lucide-react';

export default function AdminContent() {
  const { isAdmin } = useAdmin();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [formData, setFormData] = useState<Partial<Settings>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'home' | 'contact' | 'payment' | 'social' | 'seo'>('general');

  useEffect(() => {
    if (!isAdmin) return;
    
    const unsubscribe = listenToSettings((data) => {
      setSettings(data);
      setFormData(data);
    });

    return unsubscribe;
  }, [isAdmin]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContactChange = (field: string, value: string) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        contactInfo: {
          ...(prev.contactInfo || {}),
          [field]: value,
        },
      };
      return updated as Partial<Settings>;
    });
  };

  const handleSocialChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        facebook: prev.socialLinks?.facebook || '',
        twitter: prev.socialLinks?.twitter || '',
        instagram: prev.socialLinks?.instagram || '',
        whatsapp: prev.socialLinks?.whatsapp || '',
        telegram: prev.socialLinks?.telegram || '',
        youtube: prev.socialLinks?.youtube || '',
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      await updateSettings(formData);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save settings: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="rounded-lg bg-red-500/10 border border-red-500 p-4">
            <p className="text-red-500">Access Denied</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'home', label: 'Home Page', icon: '🏠' },
    { id: 'contact', label: 'Contact Info', icon: '📞' },
    { id: 'payment', label: 'Payment', icon: '💳' },
    { id: 'social', label: 'Social Links', icon: '🔗' },
    { id: 'seo', label: 'SEO', icon: '🔍' },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Website Content Management</h1>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
          >
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-red-500">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500 rounded-lg p-4">
            <p className="text-emerald-500">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'text-emerald-500 border-b-2 border-emerald-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">General Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Site Name</label>
                    <Input
                      value={formData.siteName || ''}
                      onChange={(e) => handleChange('siteName', e.target.value)}
                      placeholder="e.g., PrimexStream Pro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Site Description</label>
                    <textarea
                      value={formData.siteDescription || ''}
                      onChange={(e) => handleChange('siteDescription', e.target.value)}
                      placeholder="Brief description of your service"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Site URL</label>
                    <Input
                      value={formData.siteUrl || ''}
                      onChange={(e) => handleChange('siteUrl', e.target.value)}
                      placeholder="https://primexstream.pro"
                    />
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.maintenanceMode || false}
                      onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <label className="text-white font-semibold">Maintenance Mode</label>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Account Creation Limit</label>
                    <Input
                      type="number"
                      value={formData.accountCreationLimit || 5}
                      onChange={(e) => handleChange('accountCreationLimit', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Home Page Settings */}
          {activeTab === 'home' && (
            <div className="space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Home Page Content</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Hero Title</label>
                    <Input
                      value={formData.homeTitle || ''}
                      onChange={(e) => handleChange('homeTitle', e.target.value)}
                      placeholder="Main headline"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Hero Subtitle</label>
                    <Input
                      value={formData.homeSubtitle || ''}
                      onChange={(e) => handleChange('homeSubtitle', e.target.value)}
                      placeholder="Subheadline"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Hero Description</label>
                    <textarea
                      value={formData.homeDescription || ''}
                      onChange={(e) => handleChange('homeDescription', e.target.value)}
                      placeholder="Detailed description"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">CTA Button Text</label>
                      <Input
                        value={formData.homeCta || ''}
                        onChange={(e) => handleChange('homeCta', e.target.value)}
                        placeholder="e.g., Get Started"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">CTA Button Link</label>
                      <Input
                        value={formData.homeCtaLink || ''}
                        onChange={(e) => handleChange('homeCtaLink', e.target.value)}
                        placeholder="#pricing"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Contact Information */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Contact Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Phone Number</label>
                    <Input
                      value={formData.contactInfo?.phone || ''}
                      onChange={(e) => handleContactChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
                    <Input
                      value={formData.contactInfo?.email || ''}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                      placeholder="support@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">WhatsApp Number</label>
                    <Input
                      value={formData.contactInfo?.whatsapp || ''}
                      onChange={(e) => handleContactChange('whatsapp', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Address</label>
                    <textarea
                      value={formData.contactInfo?.address || ''}
                      onChange={(e) => handleContactChange('address', e.target.value)}
                      placeholder="Physical address"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Business Hours</label>
                    <Input
                      value={formData.contactInfo?.hours || ''}
                      onChange={(e) => handleContactChange('hours', e.target.value)}
                      placeholder="Mon - Fri: 9AM - 6PM"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <div className="space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Payment Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Payment Instructions</label>
                    <textarea
                      value={formData.paymentInstructions || ''}
                      onChange={(e) => handleChange('paymentInstructions', e.target.value)}
                      placeholder="Detailed payment instructions"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                      rows={4}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-3">Bank Accounts</h3>
                    <p className="text-gray-400 text-sm mb-3">Manage bank accounts in the Orders/Settings section</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Social Links */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Social Media Links</h2>
                
                <div className="space-y-4">
                  {[
                    { key: 'facebook', label: 'Facebook', icon: 'f' },
                    { key: 'twitter', label: 'Twitter/X', icon: '𝕏' },
                    { key: 'instagram', label: 'Instagram', icon: '📷' },
                    { key: 'youtube', label: 'YouTube', icon: '▶️' },
                    { key: 'telegram', label: 'Telegram', icon: '✈️' },
                    { key: 'whatsapp', label: 'WhatsApp', icon: '💬' },
                  ].map((social) => (
                    <div key={social.key}>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        {social.icon} {social.label}
                      </label>
                      <Input
                        value={formData.socialLinks?.[social.key as keyof typeof formData.socialLinks] || ''}
                        onChange={(e) => handleSocialChange(social.key, e.target.value)}
                        placeholder={`https://${social.key}.com/...`}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* SEO Settings */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">SEO Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Meta Title</label>
                    <Input
                      value={formData.seoTitle || ''}
                      onChange={(e) => handleChange('seoTitle', e.target.value)}
                      placeholder="Page title for search engines"
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-400 mt-1">{(formData.seoTitle || '').length}/60</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Meta Description</label>
                    <textarea
                      value={formData.seoDescription || ''}
                      onChange={(e) => handleChange('seoDescription', e.target.value)}
                      placeholder="Brief description for search engines"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                      rows={3}
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-400 mt-1">{(formData.seoDescription || '').length}/160</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Keywords</label>
                    <Input
                      value={formData.seoKeywords || ''}
                      onChange={(e) => handleChange('seoKeywords', e.target.value)}
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            <Save size={16} />
            {loading ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
