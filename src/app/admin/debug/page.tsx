'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/components/providers/admin-provider';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase-config';

interface DebugResult {
  name: string;
  status: 'success' | 'error';
  message: string;
}

export default function AdminDebugPage() {
  const { user, isLoading } = useAdmin();
  const router = useRouter();
  const [results, setResults] = useState<DebugResult[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/admin/login');
    }
  }, [isLoading, user, router]);

  const addResult = (result: DebugResult) => {
    setResults((prev) => [...prev, result]);
  };

  const runDiagnostics = async () => {
    if (!user) return;
    setRunning(true);
    setResults([]);

    const checks = [
      { name: 'Users', run: () => supabase.from('users').select('id', { count: 'exact', head: true }) },
      { name: 'Orders', run: () => supabase.from('orders').select('id', { count: 'exact', head: true }) },
      { name: 'Referrals', run: () => supabase.from('referrals').select('id', { count: 'exact', head: true }) },
      { name: 'Notifications', run: () => supabase.from('notifications').select('id', { count: 'exact', head: true }) },
      { name: 'Social Tasks', run: () => supabase.from('social_task_submissions').select('id', { count: 'exact', head: true }) },
      { name: 'Payment Methods', run: () => supabase.from('payment_methods').select('id', { count: 'exact', head: true }) },
    ];

    for (const check of checks) {
      const { count, error } = await check.run();
      addResult({
        name: check.name,
        status: error ? 'error' : 'success',
        message: error ? error.message : `${count || 0} rows visible`,
      });
    }

    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'general',
      title: 'Debug notification',
      message: 'Supabase write test completed.',
      read: false,
      deleted: false,
      data: {},
    });

    addResult({
      name: 'Notification Write',
      status: notificationError ? 'error' : 'success',
      message: notificationError ? notificationError.message : 'Inserted a notification for the current admin user',
    });

    setRunning(false);
  };

  if (isLoading || !user) {
    return (
      <AdminLayout>
        <div className="text-center py-12">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Supabase Debug</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Validate read/write access for the tables used by the app.
          </p>
        </div>

        <Button onClick={runDiagnostics} disabled={running}>
          {running ? 'Running...' : 'Run Diagnostics'}
        </Button>

        <div className="space-y-3">
          {results.map((result) => (
            <Card key={result.name} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-white">{result.name}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{result.message}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.status === 'success'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}
                >
                  {result.status}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
