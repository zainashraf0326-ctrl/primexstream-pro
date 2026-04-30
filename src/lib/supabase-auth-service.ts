'use server';

import { supabase } from './supabase-config';
import { createUser } from './supabase-data-service';

// ============ AUTHENTICATION SERVICE ============

/**
 * Sign up user with email and password
 */
export async function signupWithEmail(email: string, password: string, name: string, phone?: string) {
  try {
    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create auth user');

    // 2. Create user profile in database
    const { success, data: userData } = await createUser(email, name, phone);
    if (!success) throw new Error('Failed to create user profile');

    return {
      success: true,
      user: authData.user,
      profile: userData,
      message: 'Signup successful! Check your email to verify your account.',
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      error: (error as any).message || 'Signup failed',
    };
  }
}

/**
 * Sign in user with email and password
 */
export async function loginWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Login failed');

    // Update last login time
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('email', email);

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: (error as any).message || 'Login failed',
    };
  }
}

/**
 * Sign in with Google OAuth
 */
export async function loginWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) throw error;

    return {
      success: true,
      url: data?.url,
    };
  } catch (error) {
    console.error('Google login error:', error);
    return {
      success: false,
      error: (error as any).message || 'Google login failed',
    };
  }
}

/**
 * Sign out user
 */
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: (error as any).message || 'Logout failed',
    };
  }
}

/**
 * Get current user session
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    return {
      success: true,
      session: data.session,
      user: data.session?.user || null,
    };
  } catch (error) {
    console.error('Get session error:', error);
    return {
      success: false,
      session: null,
      user: null,
    };
  }
}

/**
 * Reset password (send reset email)
 */
export async function sendPasswordResetEmail(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
    });

    if (error) throw error;

    return {
      success: true,
      message: 'Password reset email sent. Check your inbox.',
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      error: (error as any).message || 'Failed to send reset email',
    };
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    return {
      success: true,
      message: 'Password updated successfully',
    };
  } catch (error) {
    console.error('Update password error:', error);
    return {
      success: false,
      error: (error as any).message || 'Failed to update password',
    };
  }
}

/**
 * Verify email token
 */
export async function verifyEmailToken(token: string, type: 'email_change' | 'recovery') {
  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type,
    });

    if (error) throw error;

    return {
      success: true,
      message: 'Email verified successfully',
    };
  } catch (error) {
    console.error('Email verification error:', error);
    return {
      success: false,
      error: (error as any).message || 'Email verification failed',
    };
  }
}

/**
 * Get user with their profile data
 */
export async function getUserWithProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        orders:orders(count),
        notifications:notifications(count),
        referrals:referrals(count),
        wallet_transactions:wallet_transactions(count)
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;

    return {
      success: true,
      user: data,
    };
  } catch (error) {
    console.error('Get user profile error:', error);
    return {
      success: false,
      error: (error as any).message || 'Failed to get user profile',
    };
  }
}
