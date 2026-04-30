'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { supabase } from '@/lib/supabase-config';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  instructions: string;
  accountInfo: string;
  isActive: boolean;
}

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<Partial<PaymentMethod>>({
    name: '',
    icon: '',
    instructions: '',
    accountInfo: '',
    isActive: true,
  });

  // Listen to payment methods in real-time
  useEffect(() => {
    let active = true;
    const loadMethods = async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading payment methods:', error);
        setLoading(false);
        return;
      }

      if (!active) return;
      setMethods((data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        icon: row.icon,
        instructions: row.instructions,
        accountInfo: row.account_info,
        isActive: row.is_active,
      })));
      setLoading(false);
    };

    void loadMethods();
    const channel = supabase
      .channel('payment-methods-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_methods' }, loadMethods)
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.icon) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const methodId = editingMethod?.id || formData.name?.toLowerCase().replace(/\s+/g, '-');
      const { error } = await supabase.from('payment_methods').upsert({
        id: methodId,
        name: formData.name,
        icon: formData.icon,
        instructions: formData.instructions,
        account_info: formData.accountInfo,
        is_active: formData.isActive ?? true,
      });
      if (error) throw error;
      alert(`Payment method ${editingMethod ? 'updated' : 'created'} successfully!`);
      setShowForm(false);
      setEditingMethod(null);
      setFormData({
        name: '',
        icon: '',
        instructions: '',
        accountInfo: '',
        isActive: true,
      });
    } catch (error) {
      console.error('Error saving payment method:', error);
      alert('Error saving payment method');
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      try {
        const { error } = await supabase.from('payment_methods').delete().eq('id', methodId);
        if (error) throw error;
        alert('Payment method deleted successfully!');
      } catch (error) {
        console.error('Error deleting method:', error);
        alert('Error deleting payment method');
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            💳 Payment Methods
          </h1>
          <button
            onClick={() => {
              setEditingMethod(null);
              setFormData({
                name: '',
                icon: '',
                instructions: '',
                accountInfo: '',
                isActive: true,
              });
              setShowForm(!showForm);
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            {showForm ? '❌ Close' : '✨ Add New Method'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass dark:glass-light p-6 rounded-xl border border-white/20">
            <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">Total Methods</div>
            <div className="text-3xl font-bold text-emerald-600">{methods.length}</div>
          </div>
          <div className="glass dark:glass-light p-6 rounded-xl border border-white/20">
            <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">Active Methods</div>
            <div className="text-3xl font-bold text-blue-600">
              {methods.filter((m) => m.isActive).length}
            </div>
          </div>
        </div>

        {/* Payment Methods List */}
        <div className="space-y-4">
          {loading ? (
            <div className="glass dark:glass-light p-12 rounded-xl text-center">
              <p className="text-slate-600 dark:text-slate-300">Loading payment methods...</p>
            </div>
          ) : methods.length === 0 ? (
            <div className="glass dark:glass-light p-12 rounded-xl text-center">
              <p className="text-slate-600 dark:text-slate-300">
                No payment methods found. Create your first one!
              </p>
            </div>
          ) : (
            methods.map((method) => (
              <div key={method.id} className="glass dark:glass-light border border-white/20 p-6 rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{method.icon}</span>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {method.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          method.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {method.isActive ? '✅ Active' : '❌ Inactive'}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          Instructions:
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                          {method.instructions}
                        </p>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          Account Info:
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-wrap">
                          {method.accountInfo}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setEditingMethod(method);
                        setFormData(method);
                        setShowForm(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMethod(method.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="glass dark:glass-light border border-white/20 p-8 rounded-xl">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              {editingMethod ? '✏️ Edit Payment Method' : '✨ Add New Payment Method'}
            </h2>
            <form onSubmit={handleSaveMethod} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Method Name
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Remitly"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Icon Emoji
                  </label>
                  <input
                    type="text"
                    value={formData.icon || ''}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 🔵"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Instructions
                </label>
                <textarea
                  value={formData.instructions || ''}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Instructions for payment submission"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Account Info
                </label>
                <textarea
                  value={formData.accountInfo || ''}
                  onChange={(e) => setFormData({ ...formData, accountInfo: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Account details (e.g., Email, Wallet Address)"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive || false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-slate-900 dark:text-white">Active</span>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                >
                  {editingMethod ? '💾 Update' : '✨ Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMethod(null);
                  }}
                  className="px-6 py-2 bg-slate-400 text-white rounded-lg hover:bg-slate-500 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
