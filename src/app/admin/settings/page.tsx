'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { getSettings, listenToSettings, updateSettings, Settings } from '@/lib/admin-supabase-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Save, X } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [newBank, setNewBank] = useState({ bankName: '', accountHolder: '', accountNumber: '', swiftCode: '' });
  const [showBankForm, setShowBankForm] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToSettings((data) => {
      setSettings(data);
    });
    return unsubscribe;
  }, []);

  const handleUpdatePaymentInstructions = async (instructions: string) => {
    if (!settings) return;
    setLoading(true);
    try {
      await updateSettings({ paymentInstructions: instructions });
    } catch (error) {
      console.error('Error updating instructions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBank = async () => {
    if (!settings || !newBank.bankName || !newBank.accountHolder || !newBank.accountNumber) {
      alert('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const updatedBanks = [
        ...settings.bankAccounts,
        {
          id: Date.now().toString(),
          ...newBank,
        },
      ];
      await updateSettings({ bankAccounts: updatedBanks });
      setNewBank({ bankName: '', accountHolder: '', accountNumber: '', swiftCode: '' });
      setShowBankForm(false);
    } catch (error) {
      console.error('Error adding bank:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBank = async (bankId: string) => {
    if (!settings) return;
    const updatedBanks = settings.bankAccounts.filter((b) => b.id !== bankId);
    setLoading(true);
    try {
      await updateSettings({ bankAccounts: updatedBanks });
    } catch (error) {
      console.error('Error deleting bank:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMaintenanceMode = async (value: boolean) => {
    if (!settings) return;
    setLoading(true);
    try {
      await updateSettings({ maintenanceMode: value });
    } catch (error) {
      console.error('Error updating maintenance mode:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!settings) {
    return (
      <AdminLayout title="Settings">
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          Loading settings...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <div className="space-y-6 max-w-3xl">
        {/* Maintenance Mode */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Maintenance Mode
          </h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => handleUpdateMaintenanceMode(e.target.checked)}
              disabled={loading}
              className="w-5 h-5 rounded"
            />
            <span className="text-slate-700 dark:text-slate-300">
              {settings.maintenanceMode ? '🔴 Maintenance Mode ON' : '🟢 Site is Live'}
            </span>
          </label>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            When enabled, users will see a maintenance message instead of the site.
          </p>
        </div>

        {/* Payment Instructions */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Payment Instructions
          </h3>
          <div className="space-y-3">
            <textarea
              defaultValue={settings.paymentInstructions}
              rows={5}
              placeholder="Enter payment instructions for users..."
              onBlur={(e) => handleUpdatePaymentInstructions(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Auto-saves as you type. Students will see this when making payments.
            </p>
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Bank Accounts
            </h3>
            {!showBankForm && (
              <Button
                onClick={() => setShowBankForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                size="sm"
              >
                <Plus className="w-4 h-4" /> Add Bank
              </Button>
            )}
          </div>

          {/* Bank Form */}
          {showBankForm && (
            <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg space-y-3 border border-slate-200 dark:border-slate-600">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bank Name *
                </label>
                <Input
                  value={newBank.bankName}
                  onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                  placeholder="e.g., Bank of America"
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Account Holder *
                </label>
                <Input
                  value={newBank.accountHolder}
                  onChange={(e) => setNewBank({ ...newBank, accountHolder: e.target.value })}
                  placeholder="e.g., John Doe"
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Account Number *
                </label>
                <Input
                  value={newBank.accountNumber}
                  onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                  placeholder="e.g., 1234567890"
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  SWIFT Code
                </label>
                <Input
                  value={newBank.swiftCode}
                  onChange={(e) => setNewBank({ ...newBank, swiftCode: e.target.value })}
                  placeholder="Optional"
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleAddBank}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Add'}
                </Button>
                <Button
                  onClick={() => setShowBankForm(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white gap-2"
                >
                  <X className="w-4 h-4" /> Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Banks List */}
          <div className="space-y-3">
            {settings.bankAccounts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                No bank accounts added yet
              </p>
            ) : (
              settings.bankAccounts.map((bank) => (
                <div
                  key={bank.id}
                  className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{bank.bankName}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {bank.accountHolder}
                    </p>
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {bank.accountNumber}
                    </p>
                    {bank.swiftCode && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        SWIFT: {bank.swiftCode}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleDeleteBank(bank.id)}
                    className="bg-red-600 hover:bg-red-700 text-white gap-2"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Account Limits */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Account Limits
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Max Accounts Per User
              </label>
              <Input
                type="number"
                defaultValue={settings.accountCreationLimit}
                onBlur={(e) => updateSettings({ accountCreationLimit: parseInt(e.target.value) })}
                className="bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                How many accounts can one user create?
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
