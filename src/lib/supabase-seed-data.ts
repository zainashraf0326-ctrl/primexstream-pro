import { supabase } from '@/lib/supabase-config';

const seedPlans = [
  {
    name: '1 Month IPTV',
    price: 25,
    sale_price: 20,
    discount: 5,
    duration: 1,
    duration_days: 30,
    features: 'Full HD, 1000+ channels, all devices',
    is_active: true,
  },
  {
    name: '6 Months IPTV',
    price: 75,
    sale_price: 65,
    discount: 10,
    duration: 6,
    duration_days: 180,
    features: 'Full HD, 1000+ channels, priority support',
    is_active: true,
  },
  {
    name: '12 Months IPTV',
    price: 120,
    sale_price: 95,
    discount: 25,
    duration: 12,
    duration_days: 365,
    features: 'Full HD, 1000+ channels, best value',
    is_active: true,
  },
];

const seedPaymentMethods = [
  {
    id: 'binance',
    name: 'Binance',
    icon: 'BN',
    instructions: 'Send payment to the Binance account listed here and upload proof.',
    account_info: '',
    is_active: true,
  },
  {
    id: 'remitly',
    name: 'Remitly',
    icon: 'RM',
    instructions: 'Use Remitly and include your order number in the note.',
    account_info: '',
    is_active: true,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: 'PP',
    instructions: 'Send payment as friends and family where available.',
    account_info: '',
    is_active: true,
  },
  {
    id: 'cashapp',
    name: 'Cash App',
    icon: 'CA',
    instructions: 'Send payment to the Cash App account and upload proof.',
    account_info: '',
    is_active: true,
  },
];

const defaultSettings = {
  id: 'general',
  maintenanceMode: false,
  paymentInstructions: 'Send payment to the account details provided.',
  bankAccounts: [],
  accountCreationLimit: 5,
  siteName: 'PrimexStream Pro',
  siteDescription: 'Premium IPTV Streaming Service',
  siteUrl: 'https://primexstream.pro',
  homeTitle: 'Premium IPTV Streaming',
  homeSubtitle: 'Watch Your Favorite Shows Anytime, Anywhere',
  homeDescription: 'Experience unlimited streaming with our premium IPTV service.',
  paymentMethods: seedPaymentMethods.map((method) => ({
    id: method.id,
    name: method.name,
    icon: method.icon,
    instructions: method.instructions,
    accountInfo: method.account_info,
    isActive: method.is_active,
  })),
};

export async function seedSupabaseData() {
  const { count: plansCount } = await supabase.from('plans').select('*', { count: 'exact', head: true });
  if (!plansCount) {
    const { error } = await supabase.from('plans').insert(seedPlans);
    if (error) throw error;
  }

  const { error: paymentError } = await supabase.from('payment_methods').upsert(seedPaymentMethods);
  if (paymentError) throw paymentError;

  const { error: settingsError } = await supabase
    .from('admin_settings')
    .upsert([
      { id: 'general', value: defaultSettings },
      { id: 'main', value: { payment: {}, socialMedia: {} } },
    ]);
  if (settingsError) throw settingsError;

  const { error: configError } = await supabase.from('app_config').upsert({
    id: 'main',
    value: {
      site: {
        siteName: 'PrimexStream Pro',
        maintenanceMode: false,
        supportEmail: 'support@primexstream.com',
        supportPhone: '+1234567890',
        currency: 'USD',
      },
      orders: {
        minAmount: 5,
        maxAmount: 10000,
        orderTimeout: 24,
        deliveryTime: 1,
      },
      plans: {
        plan1Month: { name: '1 Month IPTV', duration: 1, price: 25, salePrice: 20, features: 'Full HD, 1000+ channels' },
        plan6Month: { name: '6 Months IPTV', duration: 6, price: 75, salePrice: 65, features: 'Full HD, 1000+ channels' },
        plan12Month: { name: '12 Months IPTV', duration: 12, price: 120, salePrice: 95, features: 'Full HD, 1000+ channels' },
        extraDiscount: 30,
      },
      referral: {
        isActive: true,
        commissionRate: 10,
        minReferrals: 1,
        bonusAmount: 2,
        payoutThreshold: 10,
      },
      paymentMethods: {
        binance: { isActive: true, extraDiscount: 30, instructions: 'Send payment to Binance', accountInfo: '' },
        remitly: { isActive: true, extraDiscount: 30, instructions: 'Use Remitly app', accountInfo: '' },
        paypal: { isActive: true, extraDiscount: 0, instructions: 'PayPal payment instructions', accountInfo: '' },
        cashapp: { isActive: true, extraDiscount: 0, instructions: 'Cash App payment instructions', accountInfo: '' },
      },
    },
  });
  if (configError) throw configError;

  const { error: contentError } = await supabase.from('admin_content').upsert({
    id: 'main',
    value: {
      paymentMethods: {},
      homeServices: {},
      discounts: {
        generalDiscount: 30,
        referralBonus: 5,
      },
    },
  });
  if (contentError) throw contentError;
}

export async function getAllSeedData() {
  return {
    plans: seedPlans,
    paymentMethods: seedPaymentMethods,
    settings: defaultSettings,
  };
}

export async function checkIfDataExists() {
  const { count } = await supabase.from('plans').select('*', { count: 'exact', head: true });
  return Boolean(count && count > 0);
}
