'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { seedTestData, cleanTestData, getTestDataInfo } from '@/lib/supabase-test-data';

export default function TestDataPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const testInfo = getTestDataInfo();

  const handleSeedData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await seedTestData();
      setMessage({
        type: 'success',
        text: '✅ Test data seeded successfully! You can now log in with test users and see all the data flowing through your system.',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `❌ Error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCleanData = async () => {
    if (!confirm('⚠️ This will delete all test data. Continue?')) return;

    setLoading(true);
    setMessage(null);
    try {
      await cleanTestData();
      setMessage({
        type: 'success',
        text: '✅ Test data cleaned successfully!',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `❌ Error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Supabase Test Data</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Populate your Supabase database with sample data for testing
        </p>

        {/* Alert Message */}
        {message && (
          <Card className={`mb-6 ${message.type === 'success' ? 'border-emerald-200 dark:border-emerald-700' : 'border-red-200 dark:border-red-700'}`}>
            <CardContent className={`p-4 flex gap-3 ${message.type === 'success' ? 'text-emerald-700 dark:text-emerald-200' : 'text-red-700 dark:text-red-200'}`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p>{message.text}</p>
            </CardContent>
          </Card>
        )}

        {/* Main Card */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Test Users</h2>
            <div className="space-y-3 mb-8">
              {testInfo.users.map((user) => (
                <div key={user.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">ID: {user.id}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Email: {user.email}</p>
                </div>
              ))}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="font-medium text-blue-900 dark:text-blue-200">Admin Access</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Email: {testInfo.adminEmail}</p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Test Data Includes</h2>
            <ul className="space-y-2 mb-8 text-slate-700 dark:text-slate-300">
              <li className="flex gap-2">
                <span>✓</span>
                <span>2 test users with full profiles</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>5 sample orders (pending, approved, rejected)</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>5 sample notifications (order confirmations, referrals)</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>User credentials for approved orders</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>Referral relationships</span>
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">What You Can Test</h2>
            <ul className="space-y-2 mb-8 text-slate-700 dark:text-slate-300">
              <li className="flex gap-2">
                <span>1.</span>
                <span>Login with test user IDs to see your orders</span>
              </li>
              <li className="flex gap-2">
                <span>2.</span>
                <span>Admin dashboard will show total counts and orders</span>
              </li>
              <li className="flex gap-2">
                <span>3.</span>
                <span>User dashboard will show order history</span>
              </li>
              <li className="flex gap-2">
                <span>4.</span>
                <span>Notifications will display properly</span>
              </li>
              <li className="flex gap-2">
                <span>5.</span>
                <span>Referral earnings will show</span>
              </li>
            </ul>

            {/* Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleSeedData}
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? 'Seeding...' : 'Seed Test Data'}
              </Button>
              <Button
                onClick={handleCleanData}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? 'Cleaning...' : 'Clean Test Data'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">How to Use</h3>
            <div className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="font-medium mb-2">Step 1: Seed Test Data</p>
                <p className="text-sm">Click "Seed Test Data" to populate Supabase seed data and create a test notification for your current account</p>
              </div>
              <div>
                <p className="font-medium mb-2">Step 2: Check Supabase Console</p>
                <p className="text-sm">Go to your Supabase project tables to verify the seeded rows</p>
              </div>
              <div>
                <p className="font-medium mb-2">Step 3: Test the App</p>
                <p className="text-sm">
                  Use test user IDs to log in and see:
                  <br />- Your orders in the dashboard
                  <br />- Order history in /orders page
                  <br />- Notifications in the notification panel
                  <br />- Admin stats in /admin panel
                </p>
              </div>
              <div>
                <p className="font-medium mb-2">Step 4: Clean Up (Optional)</p>
                <p className="text-sm">When done testing, click "Clean Test Data" to remove sample data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-slate-600 dark:text-slate-400 mt-8 text-sm">
          ⚠️ This is for development/testing only. Delete this page before going to production.
        </p>
      </div>
    </div>
  );
}
