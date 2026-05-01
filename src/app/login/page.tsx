'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BadgeCheck,
  Compass,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  getAuthErrorMessage,
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from '@/services/authService';
import { getPasswordStrength } from '@/lib/password-strength';
import { PasswordStrengthChecklist } from '@/components/auth/password-strength-checklist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardDescription } from '@/components/ui/card';

function savePendingSignupProfile(profile: {
  email: string;
  name?: string;
  appliedReferralCode?: string;
}) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    'primex_pending_signup_profile',
    JSON.stringify({
      email: profile.email.trim().toLowerCase(),
      name: profile.name?.trim() || '',
      appliedReferralCode: profile.appliedReferralCode?.trim().toUpperCase() || '',
    })
  );
}

function LoginContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  useEffect(() => {
    const ref = searchParams.get('ref') || searchParams.get('refCode') || '';

    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
  }, [searchParams]);

  const resetForm = (nextIsLogin: boolean) => {
    setIsLogin(nextIsLogin);
    setError('');
    setInfo('');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setReferralCode(searchParams.get('ref') || searchParams.get('refCode') || '');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!passwordStrength.isValid) {
      setError(
        'Password must include 8+ characters, uppercase, lowercase, number, and symbol.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      savePendingSignupProfile({
        email,
        name,
        appliedReferralCode: referralCode,
      });

      await signUpWithEmailPassword({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(getAuthErrorMessage(err, 'Could not create your account.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailPassword({
        email: email.trim(),
        password,
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(getAuthErrorMessage(err, 'Could not sign you in.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = () => {
    router.push('/iptv');
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (isLogin) {
      void handleSignIn(e);
      return;
    }

    void handleSignUp(e);
  };

  return (
    <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-300/20 to-transparent blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-gradient-to-tr from-emerald-200/10 to-transparent blur-3xl animate-pulse" />

      <Card className="relative z-10 w-full max-w-md glass border border-white/30 dark:border-slate-700/50">
        <div className="mb-10">
          <div className="mb-6 inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-xl font-bold text-white">
              P
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                PrimexStream Pro
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Premium IPTV Service
              </p>
            </div>
          </div>
          <CardDescription className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span>
              {isLogin
                ? 'Welcome back! Sign in to your account.'
                : 'Create your account and join our premium community.'}
            </span>
          </CardDescription>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              helperText="How should we address you?"
            />
          )}

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            icon={<Mail className="h-5 w-5" />}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            icon={<Lock className="h-5 w-5" />}
            helperText={isLogin ? undefined : 'Use a strong password for your account.'}
          />

          {!isLogin && <PasswordStrengthChecklist password={password} />}

          {!isLogin && (
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              icon={<Lock className="h-5 w-5" />}
              error={
                confirmPassword && password !== confirmPassword
                  ? 'Passwords do not match'
                  : ''
              }
            />
          )}

          {!isLogin && (
            <Input
              label="Referral Code (Optional)"
              type="text"
              placeholder="Use a friend's referral code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              disabled={loading}
              helperText="Apply your referral code during signup to receive bonus credit."
            />
          )}

          {error && (
            <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-950/30">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {error}
              </p>
            </div>
          )}

          {info && (
            <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 p-4 dark:bg-emerald-950/30">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {info}
              </p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={loading}
            isLoading={loading}
            className="mt-8"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-4">
          <p className="mb-2 text-center text-xs text-slate-500 dark:text-slate-500">
            Want to browse first? No account needed.
          </p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            onClick={handleGuestSignIn}
            className="flex items-center justify-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Compass className="h-4 w-4" />
            Continue as Guest
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => resetForm(!isLogin)}
            className="font-bold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            {isLogin ? 'Create one' : 'Sign in here'}
          </button>
        </p>

        <div className="mt-8 border-t border-white/10 pt-8 dark:border-slate-700/20">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <BadgeCheck className="h-4 w-4 text-emerald-500" />
              <span>Verified</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-emerald-500" />
              <span>Instant Access</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
