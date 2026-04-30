'use client';

import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getAuthErrorMessage,
  signUpWithEmailPassword,
} from '@/services/authService';
import { ensureUserProfile, transferUserData } from '@/services/dbService';
import { createUser } from '@/lib/supabase-user-service';

interface PostPaymentSignupModalProps {
  isOpen: boolean;
  email: string;
  name: string;
  onClose: () => void;
}

export default function PostPaymentSignupModal({
  isOpen,
  email,
  name,
  onClose,
}: PostPaymentSignupModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please enter a password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const authUser = await signUpWithEmailPassword({ name, email, password });
      const guestUid =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('primex_guest_checkout_uid')
          : null;

      if (guestUid) {
        await transferUserData(guestUid, authUser.uid, { name, email });
        window.localStorage.removeItem('primex_guest_checkout_uid');
      } else {
        await ensureUserProfile(authUser.uid, { name, email });
      }

      await createUser(authUser.uid, {
        name,
        email,
        totalReferrals: 0,
      });

      setLoading(false);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(getAuthErrorMessage(err, 'Could not create your account.'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="glass w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <CardTitle>
            {showForm ? 'Create Your Account' : 'Complete Your Account'}
          </CardTitle>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <CardContent className="space-y-4 pt-6">
          {!showForm ? (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your payment has been received! Create an account to save your order and access exclusive features.
              </p>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Email:</span>
                  <span className="text-slate-600 dark:text-slate-400 ml-2">{email}</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Name:</span>
                  <span className="text-slate-600 dark:text-slate-400 ml-2">{name}</span>
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={() => setShowForm(true)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Create Account
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Set a secure password for your account.
              </p>

              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 p-3 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />

              <input
                type="text"
                value={name}
                disabled
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 p-3 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                minLength={6}
              />

              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                minLength={6}
              />

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
