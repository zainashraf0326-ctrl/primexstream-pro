'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaPaypal, FaRegCreditCard, FaUniversity } from 'react-icons/fa';
import { SiBinance } from 'react-icons/si';
import { GiMoneyStack } from 'react-icons/gi';
import { CheckCircle2, Loader } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { useGuestCheckout } from '@/components/providers/guest-checkout-context';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createOrder } from '@/services/dbService';
import { uploadProofImage } from '@/services/storageService';
import { getConfig, ConfigData } from '@/lib/supabase-service';
import DiscountModal from '@/components/modals/DiscountModal';
import AccountDetails from '@/components/Payment/AccountDetails';
import PostPaymentSignupModal from '@/components/modals/PostPaymentSignupModal';

type PaymentMethod = 'remitly' | 'binance' | 'paypal' | 'cashapp' | 'zelle';

const trustBadges = [
  { title: 'Secure Verification' },
  { title: 'Fast Confirmation' },
  { title: 'Instant Delivery' },
  { title: 'Trusted by Thousands' },
];

function PaymentContent() {
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [txId, setTxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [receipt, setReceipt] = useState<{ orderId: string; transactionId: string } | null>(null);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showPostPaymentModal, setShowPostPaymentModal] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isLoading, user } = useApp();
  const { guestCheckout, setGuestCheckout } = useGuestCheckout();

  const planId = searchParams.get('plan') || '1month';
  const hasValidConfigPlans =
    Boolean(config?.plans?.plan1Month) &&
    Boolean(config?.plans?.plan6Month) &&
    Boolean(config?.plans?.plan12Month);
  const configPlans = hasValidConfigPlans ? config!.plans : null;

  const plan =
    !configPlans
      ? null
      : planId === '6month'
      ? configPlans.plan6Month
      : planId === '12month'
      ? configPlans.plan12Month
      : configPlans.plan1Month;

  const originalPriceFromQuery = Number(searchParams.get('originalPrice') || '');
  const salePriceFromQuery = Number(searchParams.get('salePrice') || '');
  const hasValidQueryPrices =
    Number.isFinite(originalPriceFromQuery) &&
    Number.isFinite(salePriceFromQuery) &&
    originalPriceFromQuery > 0 &&
    salePriceFromQuery > 0;

  const originalPrice = plan?.price || (hasValidQueryPrices ? originalPriceFromQuery : 20);
  const salePrice = plan?.salePrice || (hasValidQueryPrices ? salePriceFromQuery : 20);
  const isSpecialPayment = method === 'remitly' || method === 'binance';
  const extraDiscount = isSpecialPayment ? Math.round(salePrice * 0.3 * 100) / 100 : 0;
  const finalPrice = Math.max(0, salePrice - extraDiscount);

  const paymentMethods = [
    { id: 'binance', name: 'Binance', subtitle: 'Crypto Payment', icon: SiBinance, isDiscounted: true },
    { id: 'remitly', name: 'Remitly', subtitle: 'Money Transfer', icon: GiMoneyStack, isDiscounted: true },
    { id: 'paypal', name: 'PayPal', subtitle: 'Trusted Payment', icon: FaPaypal, isDiscounted: false },
    { id: 'cashapp', name: 'Cash App', subtitle: 'Card Transfer', icon: FaRegCreditCard, isDiscounted: false },
    { id: 'zelle', name: 'Zelle', subtitle: 'Bank Transfer', icon: FaUniversity, isDiscounted: false },
  ] as const;

  const getPaymentMethodDetails = (methodId: PaymentMethod) => {
    if (!config?.paymentMethods) {
      return {
        instructions: 'Contact support for payment instructions',
        accountInfo: [] as { name: string; value: string }[],
      };
    }

    const methodMap: Record<PaymentMethod, { instructions?: string; accountInfo?: string }> = {
      remitly: config.paymentMethods.remitly,
      binance: config.paymentMethods.binance,
      paypal: config.paymentMethods.paypal || { instructions: 'Contact support', accountInfo: '' },
      cashapp: config.paymentMethods.cashapp || { instructions: 'Contact support', accountInfo: '' },
      zelle: { instructions: 'Contact support for Zelle payment instructions.', accountInfo: '' },
    };
    const selected = methodMap[methodId];
    return {
      instructions: selected?.instructions || 'Contact support for payment instructions',
      accountInfo: selected?.accountInfo ? [{ name: 'Account Info', value: selected.accountInfo }] : [],
    };
  };

  // Initialize guest data from context if available
  useEffect(() => {
    if (guestCheckout) {
      setGuestEmail(guestCheckout.email);
      setGuestName(guestCheckout.name);
      setCurrentStep(1);
    }
  }, [guestCheckout]);

  useEffect(() => {
    if (isLoading) return;
    // If user is logged in, proceed to payment method selection
    if (isLoggedIn) {
      setCurrentStep(1);
    }
  }, [isLoggedIn, isLoading]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Prevent blocking the payment UI if config request hangs.
        const configData = await Promise.race<ConfigData | null>([
          getConfig(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
        ]);
        setConfig(configData);
      } catch (err) {
        console.error('Error loading config:', err);
      } finally {
        setConfigLoading(false);
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    if (isLoading || configLoading) return;
    const timer = setTimeout(() => setShowDiscountModal(true), 40);
    return () => clearTimeout(timer);
  }, [isLoading, configLoading]);

  const handleGuestContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail || !guestName) {
      setError('Please enter both email and name');
      return;
    }
    setError('');
    setGuestCheckout({ email: guestEmail, name: guestName });
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!method || !screenshot || !txId) {
        setError('Please complete all required fields.');
        setLoading(false);
        return;
      }

      // Determine if guest or logged-in user
      const isGuest = !isLoggedIn;
      const userId =
        user?.id ||
        (() => {
          if (typeof window === 'undefined') {
            return `guest_${Date.now()}`;
          }

          const existingGuestUid = window.localStorage.getItem(
            'primex_guest_checkout_uid'
          );
          if (existingGuestUid) return existingGuestUid;

          const nextGuestUid = `guest_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`;
          window.localStorage.setItem('primex_guest_checkout_uid', nextGuestUid);
          return nextGuestUid;
        })();
      const userName = user?.name || guestName;
      const userEmail = user?.email || guestEmail;

      const { path: proofPath, url: proofUrl } = await uploadProofImage(
        userId,
        screenshot
      );
      const orderData: any = {
        planId,
        plan: plan?.name || 'IPTV Plan',
        originalPrice,
        salePrice,
        finalPrice,
        paymentMethod: method,
        paymentProofPath: proofPath,
        paymentProof: proofUrl,
        transactionId: txId,
        status: 'pending',
        date: new Date().toLocaleDateString(),
        user: userName,
      };

      // Add guest checkout markers
      if (isGuest) {
        orderData.isGuest = true;
        orderData.guestEmail = userEmail;
        orderData.guestName = userName;
      }

      const order = await createOrder(userId, orderData);
      setReceipt({ orderId: order.id || `ORD${Date.now()}`, transactionId: txId });
      setSuccess(true);

      // Show post-payment signup modal if guest
      if (isGuest) {
        setShowPostPaymentModal(true);
      }
    } catch (err: any) {
      setError(err.message || 'Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Payment">
        <div className="text-center py-12 text-slate-600 dark:text-slate-400">Loading payment options...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Payment">
      <PostPaymentSignupModal 
        isOpen={showPostPaymentModal} 
        email={guestEmail}
        name={guestName}
        onClose={() => {
          setShowPostPaymentModal(false);
          router.push('/dashboard');
        }}
      />
      <DiscountModal isOpen={showDiscountModal} onContinue={() => setShowDiscountModal(false)} />
      <div className="w-full">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12 lg:py-16 space-y-6">
          {!success && (
            <div className="flex items-center justify-between rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-3">
              {[1, 2].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${step <= currentStep ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    {step}
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {step === 1 ? 'Payment Method' : 'Verification'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {success && receipt ? (
            <Card className="glass border-emerald-200 dark:border-emerald-700/30">
              <CardContent className="space-y-4 pt-8">
                <h3 className="text-2xl font-bold text-emerald-600">Payment Submitted</h3>
                <p className="text-slate-700 dark:text-slate-300">Order ID: {receipt.orderId}</p>
                <p className="text-slate-700 dark:text-slate-300">Transaction ID: {receipt.transactionId}</p>
                {!isLoggedIn && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    A confirmation has been sent to {guestEmail}
                  </p>
                )}
                <Button onClick={() => router.push('/dashboard')} className="bg-emerald-600 hover:bg-emerald-700">
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {currentStep === 0 && (
                <div className="space-y-6">
                  <Card className="glass">
                    <CardTitle className="mb-3">Continue as Guest</CardTitle>
                    <CardContent>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                        Enter your email and name to continue with your purchase. You can create an account after payment.
                      </p>
                      <form onSubmit={handleGuestContinue} className="space-y-4">
                        <input
                          type="email"
                          placeholder="Email address"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-600 p-3 bg-white dark:bg-slate-800"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Full name"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-600 p-3 bg-white dark:bg-slate-800"
                          required
                        />
                        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                          Continue to Payment
                        </Button>
                      </form>
                      {isLoggedIn && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
                          Already logged in as {user?.name}? Continue below.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  {configLoading && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                      Loading live payment instructions... You can continue with payment method selection.
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {paymentMethods.map((pm) => {
                      const Icon = pm.icon;
                      const selected = method === pm.id;
                      return (
                        <button
                          key={pm.id}
                          onClick={() => setMethod(pm.id)}
                          className={`relative rounded-2xl p-5 text-left transition-all border ${
                            selected
                              ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-xl'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:shadow-md'
                          } ${
                            pm.isDiscounted
                              ? 'shadow-[0_0_0_1px_rgba(239,68,68,0.25),0_8px_24px_rgba(249,115,22,0.25)]'
                              : ''
                          }`}
                        >
                          {pm.isDiscounted && (
                            <span className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white text-[10px] font-bold px-2 py-1">
                              SAVE 30%
                            </span>
                          )}
                          <Icon className="h-8 w-8 text-slate-800 dark:text-slate-100" />
                          <p className="mt-3 font-bold text-slate-900 dark:text-white">{pm.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{pm.subtitle}</p>
                          {pm.isDiscounted && (
                            <p className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400">Recommended Lowest Cost</p>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {trustBadges.map((badge) => (
                      <div key={badge.title} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-center">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{badge.title}</p>
                      </div>
                    ))}
                  </div>

                  {method && (
                    <AccountDetails
                      method={method}
                      instructions={getPaymentMethodDetails(method).instructions}
                      accountInfo={getPaymentMethodDetails(method).accountInfo}
                    />
                  )}

                  {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

                  <div className="flex gap-3">
                    {!isLoggedIn && (
                      <Button type="button" variant="outline" onClick={() => setCurrentStep(0)} className="flex-1">
                        Back to Guest Info
                      </Button>
                    )}
                    <Button
                      onClick={() => (method ? setCurrentStep(2) : setError('Please select a payment method.'))}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      disabled={!method}
                    >
                      Continue to Verification
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                    Back to Payment Method
                  </Button>
                  <Card className="glass">
                    <CardTitle className="mb-3">Upload Payment Proof</CardTitle>
                    <CardContent className="space-y-4">
                      <input
                        type="file"
                        accept="image/*"
                        aria-label="Upload payment proof"
                        onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-600 p-3"
                      />
                      <input
                        type="text"
                        placeholder="Transaction ID"
                        value={txId}
                        onChange={(e) => setTxId(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-600 p-3 bg-white dark:bg-slate-800"
                      />
                    </CardContent>
                  </Card>

                  <Card className="glass border-emerald-200 dark:border-emerald-700/30">
                    <CardTitle className="mb-3">Plan Summary</CardTitle>
                    <CardContent className="space-y-2">
                      <p className="text-slate-700 dark:text-slate-300">{plan?.name || 'IPTV Plan'}</p>
                      <p className="text-slate-700 dark:text-slate-300">Original: ${originalPrice.toFixed(2)}</p>
                      <p className="text-slate-700 dark:text-slate-300">Sale: ${salePrice.toFixed(2)}</p>
                      {isSpecialPayment && <p className="text-red-600 dark:text-red-400">Discount: -${extraDiscount.toFixed(2)}</p>}
                      <p className="font-bold text-emerald-600">Total: ${finalPrice.toFixed(2)}</p>
                    </CardContent>
                  </Card>

                  {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

                  <Button type="submit" disabled={!screenshot || !txId || loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirm Payment (${finalPrice.toFixed(2)})
                      </>
                    )}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
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
