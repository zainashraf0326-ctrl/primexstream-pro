'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';
import {
  getAuthErrorMessage,
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from '@/services/authService';
import { ensureUserProfile } from '@/services/dbService';
import {
  createUser,
  getUserByReferralCode,
  recordReferral,
} from '@/lib/supabase-user-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardDescription } from '@/components/ui/card';

function LoginContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!name) {
        setError('Please enter your name');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const authUser = await signUpWithEmailPassword({ name, email, password });
      await ensureUserProfile(authUser.uid, { name, email });

      let referrerId = null;
      if (referralCode) {
        const referrer = await getUserByReferralCode(referralCode);
        if (referrer) {
          referrerId = referrer.id;
        }
      }

      await createUser(authUser.uid, {
        name,
        email,
        referredBy: referrerId || undefined,
      });

      if (referrerId) {
        await recordReferral(referrerId, authUser.uid);
      }

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
      await signInWithEmailPassword({ email, password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(getAuthErrorMessage(err, 'Could not sign you in.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    router.push('/iptv');
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (isLogin) {
      void handleSignIn(e);
    } else {
      void handleSignUp(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="absolute -top-40 right-0 w-96 h-96 bg-gradient-to-br from-emerald-300/20 to-transparent rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-200/10 to-transparent rounded-full blur-3xl animate-pulse" />

      <Card className="w-full max-w-md glass border border-white/30 dark:border-slate-700/50 relative z-10">
        <div className="mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl">
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
          <CardDescription className="text-base">
            {isLogin
              ? 'ðŸ‘‹ Welcome back! Sign in to your account'
              : 'ðŸŽ‰ Join our premium community today'}
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
              helperText="How should we call you?"
            />
          )}

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            icon={<Mail className="w-5 h-5" />}
          />

          <Input
            label="Password"
            type="password"
            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            icon={<Lock className="w-5 h-5" />}
            helperText={!isLogin ? 'At least 6 characters' : undefined}
          />

          {!isLogin && (
            <Input
              label="Confirm Password"
              type="password"
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              icon={<Lock className="w-5 h-5" />}
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
              helperText="Get 10% bonus credit if you have one"
            />
          )}

          {isLogin && (
            <div className="text-right">
              <a
                href="#"
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                Forgot password?
              </a>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-4 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm font-medium">
                {error}
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
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-2 text-center">
            Want to browse first? No account needed.
          </p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            onClick={handleGuestSignIn}
            className="flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span>ðŸ‘¤</span>
            Continue as Guest
          </Button>
        </div>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setReferralCode('');
              setName('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            {isLogin ? 'Create one' : 'Sign in here'}
          </button>
        </p>

        <div className="mt-8 pt-8 border-t border-white/10 dark:border-slate-700/20">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <span>ðŸ”’</span>
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <span>âœ“</span>
              <span>Verified</span>
            </div>
            <div className="flex items-center gap-1">
              <span>âš¡</span>
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
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
