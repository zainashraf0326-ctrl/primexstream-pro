'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Gift, ShoppingCart } from 'lucide-react';

interface EarnBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralEarnings: number;
  taskEarnings: number;
  orderEarnings: number;
}

export function EarnBreakdownModal({
  isOpen,
  onClose,
  referralEarnings,
  taskEarnings,
  orderEarnings,
}: EarnBreakdownModalProps) {
  if (!isOpen) return null;

  const totalEarnings = referralEarnings + taskEarnings + orderEarnings;

  const getPercentage = (amount: number) => {
    return totalEarnings === 0 ? 0 : Math.round((amount / totalEarnings) * 100);
  };

  const EarningItem = ({
    icon: Icon,
    label,
    amount,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    amount: number;
    color: 'emerald' | 'purple' | 'orange';
  }) => {
    const colorClasses = {
      emerald: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20',
      purple: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20',
      orange: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20',
    };

    const textColor = {
      emerald: 'text-emerald-700 dark:text-emerald-300',
      purple: 'text-purple-700 dark:text-purple-300',
      orange: 'text-orange-700 dark:text-orange-300',
    };

    const percentage = getPercentage(amount);

    return (
      <div className={`p-6 rounded-lg border ${colorClasses[color]} space-y-3`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg bg-white dark:bg-slate-900/50`}>
              {Icon}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
              <p className={`text-sm ${textColor[color]}`}>
                {percentage}% of total earnings
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${textColor[color]}`}>₹{amount}</p>
          </div>
        </div>

        {totalEarnings > 0 && (
          <div className="h-2 bg-white/50 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                color === 'emerald'
                  ? 'bg-emerald-600'
                  : color === 'purple'
                    ? 'bg-purple-600'
                    : 'bg-orange-600'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl glass glass-light dark:glass">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Earnings Breakdown
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              See where your ₹{totalEarnings} is coming from
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Total Card */}
          <div className="p-6 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">
              Total Earnings
            </p>
            <p className="text-4xl font-bold text-slate-900 dark:text-white">
              ₹{totalEarnings}
            </p>
          </div>

          {/* Earnings Items */}
          <EarningItem
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            label="Referral Earnings"
            amount={referralEarnings}
            color="emerald"
          />

          <EarningItem
            icon={<Gift className="w-5 h-5 text-purple-600" />}
            label="Social Task Earnings"
            amount={taskEarnings}
            color="purple"
          />

          <EarningItem
            icon={<ShoppingCart className="w-5 h-5 text-orange-600" />}
            label="Order/Purchase Earnings"
            amount={orderEarnings}
            color="orange"
          />

          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Tip:</strong> Check "My Referrals" section for details on each individual earning.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-2">
          <Button
            onClick={onClose}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
