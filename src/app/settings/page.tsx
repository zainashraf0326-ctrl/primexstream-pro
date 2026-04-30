'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/app-provider';
import { useAdmin } from '@/components/providers/admin-provider';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, LogOut, Lock, Shield, Mail, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import {
  changeCurrentUserPassword,
  getAuthErrorMessage,
} from '@/services/authService';

export default function SettingsPage() {
  const { isLoggedIn, user, logout, isLoading } = useApp();
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handlePasswordChange = async () => {
    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    setPasswordLoading(true);
    try {
      if (!user?.email) {
        throw new Error('No authenticated user found');
      }

      await changeCurrentUserPassword({
        email: user.email,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });

      // Logout after password change for security
      setTimeout(() => {
        logout();
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error?.code === 'auth/invalid-credential'
          ? 'Current password is incorrect'
          : getAuthErrorMessage(error, 'Failed to change password');
      setPasswordMessage({ type: 'error', text: errorMessage });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <AppLayout title="Settings">
      <div className="w-full">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 md:px-6 md:py-6">
          <div className="space-y-8">
        {/* Profile Section */}
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            Profile
          </h3>

          <Card className="glass">
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Name
                </label>
                <Input
                  value={user?.name || ''}
                  disabled
                  className="bg-slate-100 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-slate-100 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  Credits
                </label>
                <Input
                  value={`${user?.credits || 0} Credits`}
                  disabled
                  className="bg-slate-100 dark:bg-slate-800"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Access */}
        {isAdmin && (
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Admin Panel
            </h3>

            <Card className="glass bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 border-l-4 border-l-purple-600">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  You have admin access. Click below to manage the platform.
                </p>
                <Button
                  onClick={() => router.push('/admin')}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Go to Admin Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security Section */}
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Security
          </h3>

          {showPasswordChange ? (
            <Card className="glass">
              <CardContent className="pt-6 space-y-4">
                <h4 className="font-semibold text-slate-900 dark:text-white">Change Password</h4>

                {/* Message Alert */}
                {passwordMessage && (
                  <div className={`p-3 rounded-lg flex items-start gap-3 ${
                    passwordMessage.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}>
                    {passwordMessage.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <p className={
                      passwordMessage.type === 'success'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-700 dark:text-red-400'
                    }>
                      {passwordMessage.text}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    disabled={passwordLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    disabled={passwordLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    disabled={passwordLoading}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handlePasswordChange}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordMessage(null);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={passwordLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass">
              <CardContent className="pt-6 space-y-3">
                <Button 
                  onClick={() => setShowPasswordChange(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Logout Section */}
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Account</h3>

          {showLogoutConfirm ? (
            <Card className="glass bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <CardContent className="pt-6">
                <p className="text-sm text-slate-900 dark:text-white mb-4">
                  Are you sure you want to logout?
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleLogout}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Yes, Logout
                  </Button>
                  <Button
                    onClick={() => setShowLogoutConfirm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full bg-red-600 hover:bg-red-700"
              size="lg"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </div>
    </div>
    </AppLayout>
  );
}
