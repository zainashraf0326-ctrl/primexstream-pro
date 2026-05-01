import { supabase as sharedSupabase } from '@/lib/supabase-config';

export const proofsBucket = 'payment-proofs';
export const taskProofsBucket = 'task-proofs';
export const imagesBucket = 'images';
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

export const supabaseStorageClient = sharedSupabase;
