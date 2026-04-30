'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { listenToPlans, createPlan, updatePlan, deletePlan, Plan } from '@/lib/admin-supabase-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    discount: 0,
    durationDays: 30,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToPlans((data) => {
      setPlans(data);
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updatePlan(editingId, formData);
      } else {
        await createPlan(formData);
      }
      setFormData({ name: '', price: 0, discount: 0, durationDays: 30, isActive: true });
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: Plan) => {
    setFormData({
      name: plan.name,
      price: plan.price,
      discount: plan.discount || 0,
      durationDays: plan.durationDays,
      isActive: plan.isActive,
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      try {
        await deletePlan(id);
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', price: 0, discount: 0, durationDays: 30, isActive: true });
  };

  return (
    <AdminLayout title="Plans Management">
      <div className="space-y-6">
        {/* Add Button */}
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Plan
          </Button>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {editingId ? 'Edit Plan' : 'New Plan'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Plan Name
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Premium IPTV"
                  required
                  className="bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Original Price ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    required
                    className="bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Discount ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
                    className="bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Duration (Days)
                </label>
                <Input
                  type="number"
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) })}
                  required
                  className="bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Active Plan
                </span>
              </label>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  <Check className="w-4 h-4" /> {loading ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="bg-slate-600 hover:bg-slate-700 text-white gap-2"
                >
                  <X className="w-4 h-4" /> Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Plans List */}
        <div className="space-y-3">
          {plans.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No plans yet. Create one to get started.
            </div>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        plan.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Price</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        ${plan.price.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Discount</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        ${plan.discount?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Duration</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {plan.durationDays} days
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(plan)}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    size="sm"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(plan.id)}
                    className="bg-red-600 hover:bg-red-700 text-white gap-2"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
