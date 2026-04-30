'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/components/providers/app-provider';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PLANS } from '@/lib/init-supabase-data';
import { createOrder } from '@/services/dbService';
import { uploadProofImage } from '@/services/storageService';

type PaymentMethod = 'remitly' | 'binance' | 'paypal' | 'cashapp';

const PLAN_ID_MAP: Record<string, keyof typeof PLANS> = {
  '1month': '1-month',
  '6month': '6-month',
  '12month': '12-month',
  '1-month': '1-month',
  '6-month': '6-month',
  '12-month': '12-month',
};

function PaymentContent() {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [txId, setTxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isLoading, user } = useApp();

  const rawPlanId = searchParams.get('plan') || '1-month';
  const normalizedPlanId = PLAN_ID_MAP[rawPlanId] || '1-month';
  const plan = PLANS[normalizedPlanId];

  const originalPriceFromQuery = Number(searchParams.get('originalPrice') || '');
  const salePriceFromQuery = Number(searchParams.get('salePrice') || '');
  const hasValidQueryPrices =
    Number.isFinite(originalPriceFromQuery) &&
    Number.isFinite(salePriceFromQuery) &&
    originalPriceFromQuery > 0 &&
    salePriceFromQuery > 0;

  // Calculate prices
  const originalPrice = plan?.originalPrice || (hasValidQueryPrices ? originalPriceFromQuery : 20);
  const salePrice = plan?.salePrice || (hasValidQueryPrices ? salePriceFromQuery : 20);
  const saleDiscount = originalPrice - salePrice;

  const isSpecialPayment = method === 'remitly' || method === 'binance';
  const extraDiscount = isSpecialPayment
    ? Math.round((plan?.extraDiscount ?? salePrice * 0.3) * 100) / 100
    : 0;
  const finalPrice = Math.max(0, salePrice - extraDiscount);
  const totalSavings = saleDiscount + extraDiscount;
  const totalSavingsPercent = originalPrice > 0 ? Math.round((totalSavings / originalPrice) * 100) : 0;

  const paymentMethods = [
    { id: 'remitly', name: 'Remitly', icon: '🔵' },
    { id: 'binance', name: 'Binance', icon: '🟡' },
    { id: 'paypal', name: 'PayPal', icon: '💙' },
    { id: 'cashapp', name: 'Cash App', icon: '💚' },
  ];

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (!user) {
        setError('User not found');
        return;
      }

      if (!method) {
        setError('Please select a payment method');
        return;
      }

      if (!screenshot) {
        setError('Please upload a payment proof');
        return;
      }

      if (!txId) {
        setError('Please enter transaction ID');
        return;
      }

      const { path: proofPath, url: proofUrl } = await uploadProofImage(
        user.id,
        screenshot
      );

      await createOrder(user.id, {
        planId: normalizedPlanId,
        plan: plan?.name || 'IPTV Plan',
        originalPrice: originalPrice,
        salePrice: salePrice,
        finalPrice: finalPrice,
        paymentMethod: method,
        paymentProofPath: proofPath,
        paymentProofUrl: proofUrl,
        transactionId: txId,
        status: 'pending',
        date: new Date().toLocaleDateString(),
        user: user.name,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/orders');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <AppLayout title="Payment">
      <div className="px-4 pb-8 space-y-6">
        {success && (
          <Card className="glass border-emerald-200 dark:border-emerald-700/30 bg-emerald-50/20 dark:bg-emerald-900/10">
            <CardContent className="pt-6 text-center">
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">✅ Payment Submitted Successfully!</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Your order is pending verification. Redirecting...</p>
            </CardContent>
          </Card>
        )}

        {/* Plan Summary */}
        <Card className="glass border-emerald-200 dark:border-emerald-700/30">
          <CardTitle className="mb-4">Plan Summary</CardTitle>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{plan?.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{plan?.duration}</p>
              </div>
              <div className="text-right">
                <p className="line-through text-slate-400">${originalPrice.toFixed(2)}</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">${salePrice.toFixed(2)}</p>
              </div>
            </div>

            {isSpecialPayment && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">🎁 30% Bonus Discount Applied!</p>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 dark:text-slate-400">Sale Price:</span>
                    <span className="font-semibold">${salePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-red-600 dark:text-red-400">Extra Discount (30%):</span>
                    <span className="font-bold text-red-600 dark:text-red-400">-${extraDiscount.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-slate-300 dark:bg-slate-600 my-2"></div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">Final Price:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-lg">${finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="glass">
          <CardTitle className="mb-4">Select Payment Method</CardTitle>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setMethod(pm.id as PaymentMethod)}
                  className={`p-4 rounded-2xl transition-all duration-200 ${
                    method === pm.id
                      ? 'ring-2 ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-900/20'
                      : 'bg-slate-100 dark:bg-slate-800 hover:scale-105'
                  }`}
                >
                  <p className="text-3xl mb-2">{pm.icon}</p>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{pm.name}</p>
                  {(pm.id === 'remitly' || pm.id === 'binance') && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">+30% OFF</p>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Proof */}
        <Card className="glass">
          <CardTitle className="mb-4">📸 Payment Proof</CardTitle>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="payment-file" className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">Upload Screenshot</label>
              <input
                id="payment-file"
                type="file"
                accept="image/*"
                title="Upload payment proof"
                onChange={handleFileChange}
                disabled={loading}
                className="w-full px-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
              />
              {screenshot && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">✓ {screenshot.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">Transaction ID</label>
              <input
                type="text"
                placeholder="Enter transaction ID/reference"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">{error}</p>}

            <Button
              onClick={handleSubmit}
              disabled={!method || !screenshot || !txId || loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              size="lg"
            >
              {loading ? 'Processing...' : `✓ Confirm Payment ($${finalPrice.toFixed(2)})`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
