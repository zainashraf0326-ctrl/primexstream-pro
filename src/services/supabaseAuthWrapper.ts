'use client';

import { supabase } from '@/lib/supabase-config';

function generateReferralCode() {
  return `REF${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

export async function signUpWithSupabase({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  try {
    // Step 1: Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user?.id) throw new Error('Failed to create auth user');

    // Step 2: Create user profile in Supabase users table
    const userId = authData.user.id;
    const referralCode = generateReferralCode();

    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        referral_code: referralCode,
        total_referrals: 0,
        credits: 0,
        usable_balance: 0,
        wallet_balance: 0,
      });

    if (profileError) throw profileError;

    return {
      success: true,
      user: authData.user,
      profile: {
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        referralCode,
      },
    };
  } catch (error: any) {
    console.error('Supabase signup error:', error);
    return {
      success: false,
      error: error.message || 'Signup failed',
    };
  }
}

export async function signInWithSupabase({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw error;
    if (!data.user?.id) throw new Error('Login failed');

    // Ensure user profile exists
    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!userProfile) {
      // Create profile if it doesn't exist
      const referralCode = generateReferralCode();
      await supabase
        .from('users')
        .insert({
          id: data.user.id,
          name: data.user.user_metadata?.name || 'User',
          email: data.user.email || '',
          referral_code: referralCode,
          total_referrals: 0,
          credits: 0,
          usable_balance: 0,
          wallet_balance: 0,
        });
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (error: any) {
    console.error('Supabase signin error:', error);
    return {
      success: false,
      error: error.message || 'Login failed',
    };
  }
}

export async function signOutWithSupabase() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Supabase signout error:', error);
    return { success: false, error: error.message };
  }
}

export function getSupabaseAuthErrorMessage(
  error: any,
  fallback: string = 'An error occurred'
): string {
  const message = error?.message || error?.msg || '';
  
  if (message.includes('email-already-in-use') || message.includes('User already registered')) {
    return 'Email already registered. Try logging in.';
  }
  if (message.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (message.includes('weak-password')) {
    return 'Password is too weak. Use at least 8 characters with uppercase, lowercase, number, and symbol.';
  }
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please confirm your email address first.';
  }
  
  return message || fallback;
}
