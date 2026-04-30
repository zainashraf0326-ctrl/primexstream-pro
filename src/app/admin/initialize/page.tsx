'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { seedSupabaseData } from '@/lib/supabase-seed-data';

export default function InitializeAdmin() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const handleInitialize = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await seedSupabaseData();
      setSuccess(true);
      setInitialized(true);
      console.log('✅ Supabase initialized successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      console.error('❌ Initialization failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Supabase Initialization</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Populate Supabase with seed data for plans, payment methods, referral tiers, FAQs, and more.
          </p>
        </div>

        <Card className="p-8 mb-6">
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">⚠️ Warning</h2>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                This will initialize 8 collections in Supabase with seed data:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>Plans (IPTV packages)</li>
                <li>Payment Methods</li>
                <li>Referral Tiers</li>
                <li>FAQs</li>
                <li>Reviews</li>
                <li>Services</li>
                <li>Devices</li>
                <li>Site Settings</li>
              </ul>
            </div>

            {initialized && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h2 className="font-semibold text-green-900 dark:text-green-100 mb-2">✅ Success</h2>
                <p className="text-sm text-green-800 dark:text-green-200">
                  All collections have been initialized successfully! You can now start building admin pages
                  to manage this data.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h2 className="font-semibold text-red-900 dark:text-red-100 mb-2">❌ Error</h2>
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">📋 Data to be initialized:</h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <li>✓ 3 IPTV plans (1 month, 6 month, 12 month)</li>
                <li>✓ 4 Payment methods (Binance, Remitly, PayPal, Cash App)</li>
                <li>✓ 3 Referral tiers (Bronze, Silver, Gold)</li>
                <li>✓ 6 FAQ items with categories</li>
                <li>✓ 3 Review testimonials</li>
                <li>✓ 4 Services with icons</li>
                <li>✓ 8 Device types</li>
                <li>✓ General site settings</li>
              </ul>
            </div>

            <div className="border-t dark:border-gray-700 pt-6">
              <Button
                onClick={handleInitialize}
                disabled={loading || initialized}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? '⏳ Initializing...' : initialized ? '✅ Initialized' : '🚀 Initialize Supabase'}
              </Button>
              {initialized && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
                  Go to <a href="/admin/plans" className="text-blue-600 hover:underline">Plans Admin</a> to start
                  managing data.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-4">📚 Next Steps:</h3>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 min-w-fit">1.</span>
              <span>Click the button above to initialize Supabase collections</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 min-w-fit">2.</span>
              <span>Navigate to admin pages to manage plans, payment methods, etc.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 min-w-fit">3.</span>
              <span>Update website pages to read from Supabase instead of hardcoded data</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 min-w-fit">4.</span>
              <span>Deploy and start managing your platform from the admin panel</span>
            </li>
          </ol>
        </Card>
      </div>
    </AdminLayout>
  );
}
