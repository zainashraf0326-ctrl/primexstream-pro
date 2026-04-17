'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase-config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { createUser, getUserByReferralCode, recordReferral } from '@/lib/firestore-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Lock, Loader } from 'lucide-react';

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
    // Get referral code from URL if present
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, [searchParams]);

  const generateReferralCode = () => {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  };

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

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name in Auth
      await updateProfile(user, { displayName: name });

      // Check if user was referred
      let referrerId = null;
      if (referralCode) {
        const referrer = await getUserByReferralCode(referralCode);
        if (referrer) {
          referrerId = referrer.id;
        }
      }

      // Create user in Firestore
      await createUser(user.uid, {
        name: name,
        email: email,
        referredBy: referrerId || undefined,
      });

      // Record referral if user was referred
      if (referrerId) {
        await recordReferral(referrerId, user.uid);
      }

      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already registered. Try logging in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('Email not registered. Please sign up first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user was referred via URL
      let referrerId = null;
      if (referralCode) {
        const referrer = await getUserByReferralCode(referralCode);
        if (referrer) {
          referrerId = referrer.id;
        }
      }

      // Create user in Firestore if new
      await createUser(user.uid, {
        name: (user as any).displayName || 'User',
        email: user.email || '',
        referredBy: referrerId || undefined,
      });

      // Record referral if user was referred
      if (referrerId) {
        await recordReferral(referrerId, user.uid);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (isLogin) {
      handleSignIn(e);
    } else {
      handleSignUp(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      {/* Animated background blobs */}
      <div className="absolute -top-40 right-0 w-96 h-96 bg-gradient-to-br from-emerald-300/20 to-transparent rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-200/10 to-transparent rounded-full blur-3xl animate-pulse" />

      <Card className="w-full max-w-md glass border border-white/30 dark:border-slate-700/50 relative z-10">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl">
              P
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                PrimexStream Pro
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">Premium IPTV Service</p>
            </div>
          </div>
          <CardDescription className="text-base">
            {isLogin ? '👋 Welcome back! Sign in to your account' : '🎉 Join our premium community today'}
          </CardDescription>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Input (Signup only) */}
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

          {/* Email Input */}
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            icon={<Mail className="w-5 h-5" />}
          />

          {/* Password Input */}
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            icon={<Lock className="w-5 h-5" />}
            helperText={!isLogin ? 'At least 6 characters' : undefined}
          />

          {/* Confirm Password (Signup only) */}
          {!isLogin && (
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              icon={<Lock className="w-5 h-5" />}
              error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''}
            />
          )}

          {/* Referral Code (Signup only) */}
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

          {/* Forgot Password Link (Login only) */}
          {isLogin && (
            <div className="text-right">
              <a href="#" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                Forgot password?
              </a>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-4 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
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

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20 dark:border-slate-700/30" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-medium">
              or
            </span>
          </div>
        </div>

        {/* Google SignIn */}
        <Button
          type="button"
          variant="secondary"
          size="lg"
          fullWidth
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="flex items-center justify-center gap-3"
        >
          <span className="text-xl">🔵</span>
          Continue with Google
        </Button>

        {/* Toggle Link */}
        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-8">
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

        {/* Trust Badges */}
        <div className="mt-8 pt-8 border-t border-white/10 dark:border-slate-700/20">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <span>🔒</span>
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <span>✓</span>
              <span>Verified</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⚡</span>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
