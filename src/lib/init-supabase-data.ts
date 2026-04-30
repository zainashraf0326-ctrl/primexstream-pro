import { supabase } from '@/lib/supabase-config';

export const PLANS = {
  '1-month': {
    id: '1-month',
    name: 'IPTV 1-Month',
    duration: '1 Month',
    originalPrice: 25,
    salePrice: 20,
    discount: 5,
    description: 'Access for 1 month',
    extraDiscount: 6,
  },
  '6-month': {
    id: '6-month',
    name: 'IPTV 6-Month',
    duration: '6 Months',
    originalPrice: 75,
    salePrice: 65,
    discount: 10,
    description: 'Access for 6 months',
    extraDiscount: 19.5,
  },
  '12-month': {
    id: '12-month',
    name: 'IPTV 12-Month',
    duration: '12 Months',
    originalPrice: 120,
    salePrice: 95,
    discount: 25,
    description: 'Access for 12 months',
    extraDiscount: 28.5,
  },
};

export async function initializeSupabaseData() {
  try {
    const { count } = await supabase.from('plans').select('*', { count: 'exact', head: true });
    if (count && count > 0) return;

    const rows = Object.values(PLANS).map((plan) => ({
      name: plan.name,
      price: plan.originalPrice,
      sale_price: plan.salePrice,
      discount: plan.discount,
      duration: Number(plan.duration.split(' ')[0]),
      features: plan.description,
      is_active: true,
    }));

    const { error } = await supabase.from('plans').insert(rows);
    if (error) throw error;
  } catch (error) {
    console.error('Error initializing Supabase data:', error);
  }
}
