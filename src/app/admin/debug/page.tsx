'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/components/providers/admin-provider';
import AdminLayout from '@/components/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Code2,
  Settings,
  BarChart3,
  Bell,
  Share2,
  ShoppingCart,
  Users,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase-config';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

export default function AdminDebugPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAdmin();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [adminData, setAdminData] = useState<any>(null);
  const [loadingAdminData, setLoadingAdminData] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [authLoading, user, router]);

  /**
   * Test 1: Social Media Submission Test
   */
  const testSocialMediaSubmission = async (): Promise<TestResult> => {
    try {
      const submissionData = {
        userId: 'test-admin-' + Date.now(),
        userName: 'Admin Tester',
        userEmail: user?.email || 'admin@test.com',
        platforms: [
          {
            platform: 'youtube',
            username: 'TestChannelAdmin',
            proofFileName: 'test_youtube_proof.jpg',
          },
          {
            platform: 'instagram',
            username: 'test_admin_insta',
            proofFileName: 'test_instagram_proof.jpg',
          },
          {
            platform: 'tiktok',
            username: '@test_admin_tiktok',
            proofFileName: 'test_tiktok_proof.jpg',
          },
        ],
        status: 'pending',
        createdAt: new Date().toISOString(),
        approvalStatus: 'pending',
        adminNotes: 'Test submission from admin debug panel',
        reward: null,
      };

      const docRef = await addDoc(
        collection(db, 'socialTaskSubmissions'),
        submissionData
      );

      return {
        name: 'Social Media Submission',
        status: 'success',
        message: 'Test submission created successfully',
        data: { docId: docRef.id, ...submissionData },
      };
    } catch (error) {
      return {
        name: 'Social Media Submission',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      };
    }
  };

  /**
   * Test 2: Admin User Data Fetch
   */
  const fetchAdminData = async (): Promise<TestResult> => {
    try {
      setLoadingAdminData(true);
      if (!user) {
        throw new Error('No user found');
      }

      const adminDocRef = doc(db, 'users', user.uid);
      const adminDocSnap = await getDoc(adminDocRef);

      if (!adminDocSnap.exists()) {
        throw new Error('Admin profile not found in Firestore');
      }

      const adminProfile = adminDocSnap.data();

      // Fetch admin's notifications
      const notificationsRef = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid)
      );
      const notificationsSnap = await getDocs(notificationsRef);
      const notifications = notificationsSnap.docs.map((doc) => doc.data());

      // Fetch admin's referrals (if user made any)
      const referralsRef = query(
        collection(db, 'referrals'),
        where('referrerId', '==', user.uid)
      );
      const referralsSnap = await getDocs(referralsRef);
      const referrals = referralsSnap.docs.map((doc) => doc.data());

      // Fetch admin's orders
      const ordersRef = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid)
      );
      const ordersSnap = await getDocs(ordersRef);
      const orders = ordersSnap.docs.map((doc) => doc.data());

      const adminDataResult = {
        profile: adminProfile,
        notifications: notifications.length,
        referrals: referrals.length,
        orders: orders.length,
        notificationsList: notifications.slice(0, 3),
        referralsList: referrals.slice(0, 3),
        ordersList: orders.slice(0, 3),
      };

      setAdminData(adminDataResult);

      return {
        name: 'Admin User Data',
        status: 'success',
        message: 'Admin data fetched successfully',
        data: adminDataResult,
      };
    } catch (error) {
      return {
        name: 'Admin User Data',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      };
    } finally {
      setLoadingAdminData(false);
    }
  };

  /**
   * Test 3: System Statistics
   */
  const fetchSystemStats = async (): Promise<TestResult> => {
    try {
      // Total users
      const usersSnap = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnap.size;

      // Total orders
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const totalOrders = ordersSnap.size;
      const totalRevenue = ordersSnap.docs.reduce(
        (sum, doc) => sum + (doc.data().amount || 0),
        0
      );

      // Total referrals
      const referralsSnap = await getDocs(collection(db, 'referrals'));
      const totalReferrals = referralsSnap.size;
      const purchasedReferrals = referralsSnap.docs.filter(
        (doc) => doc.data().purchasedPlan === true
      ).length;

      // Total social submissions
      const submissionsSnap = await getDocs(
        collection(db, 'socialTaskSubmissions')
      );
      const totalSubmissions = submissionsSnap.size;
      const approvedSubmissions = submissionsSnap.docs.filter(
        (doc) => doc.data().approvalStatus === 'approved'
      ).length;

      return {
        name: 'System Statistics',
        status: 'success',
        message: 'System stats retrieved successfully',
        data: {
          totalUsers,
          totalOrders,
          totalRevenue,
          totalReferrals,
          purchasedReferrals,
          totalSubmissions,
          approvedSubmissions,
        },
      };
    } catch (error) {
      return {
        name: 'System Statistics',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      };
    }
  };

  /**
   * Run all tests
   */
  const runAllTests = async () => {
    setTesting(true);
    setResults([]);

    const testResults: TestResult[] = [];

    // Test 1: Social Media Submission
    const socialTest = await testSocialMediaSubmission();
    testResults.push(socialTest);

    // Test 2: Admin Data
    const adminTest = await fetchAdminData();
    testResults.push(adminTest);

    // Test 3: System Stats
    const statsTest = await fetchSystemStats();
    testResults.push(statsTest);

    setResults(testResults);
    setTesting(false);
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            🧪 Admin Debug & Test Panel
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Test system functionality and view admin data
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={runAllTests}
            disabled={testing}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2 py-6 text-base"
          >
            {testing ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                Running Tests...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Run All Tests
              </>
            )}
          </Button>

          <Button
            onClick={fetchAdminData}
            disabled={loadingAdminData}
            variant="outline"
            className="gap-2 py-6 text-base"
          >
            {loadingAdminData ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin"></div>
                Loading...
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                Load Admin Data
              </>
            )}
          </Button>

          <Button variant="outline" className="gap-2 py-6 text-base">
            <Code2 className="w-5 h-5" />
            View Docs
          </Button>
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Test Results
            </h2>

            {results.map((result, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    {result.status === 'success' && (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    )}
                    {result.status === 'error' && (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    )}
                    {result.status === 'pending' && (
                      <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                      {result.name}
                    </h3>
                    <p
                      className={`text-sm mb-3 ${
                        result.status === 'success'
                          ? 'text-green-600'
                          : result.status === 'error'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {result.message}
                    </p>

                    {result.data && (
                      <div className="bg-slate-900/5 dark:bg-slate-900/30 rounded-lg p-3 max-h-64 overflow-auto">
                        <pre className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {result.data && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          JSON.stringify(result.data, null, 2)
                        );
                      }}
                      className="flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Admin Data Display */}
        {adminData && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              📊 Admin Profile Data
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Profile Card */}
              <Card className="p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Profile Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      Name:
                    </span>{' '}
                    <span className="text-slate-900 dark:text-white">
                      {adminData.profile?.name || 'Not set'}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      Email:
                    </span>{' '}
                    <span className="text-slate-900 dark:text-white">
                      {adminData.profile?.email || 'Not set'}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      Role:
                    </span>{' '}
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 px-2 py-1 rounded text-xs font-semibold">
                      {adminData.profile?.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </p>
                </div>
              </Card>

              {/* Statistics Cards */}
              <Card className="p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Activity Stats
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-slate-100 dark:bg-slate-800 rounded">
                    <span className="text-slate-600 dark:text-slate-400">
                      Notifications:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {adminData.notifications}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-100 dark:bg-slate-800 rounded">
                    <span className="text-slate-600 dark:text-slate-400">
                      Referrals Made:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {adminData.referrals}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-100 dark:bg-slate-800 rounded">
                    <span className="text-slate-600 dark:text-slate-400">
                      Orders Placed:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {adminData.orders}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Notifications */}
            {adminData.notificationsList.length > 0 && (
              <Card className="p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Recent Notifications
                </h3>
                <div className="space-y-2">
                  {adminData.notificationsList.map((notif: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-100 dark:bg-slate-800 rounded text-sm"
                    >
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {notif.title}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 text-xs">
                        {notif.message}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recent Referrals */}
            {adminData.referralsList.length > 0 && (
              <Card className="p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Recent Referrals
                </h3>
                <div className="space-y-2">
                  {adminData.referralsList.map((ref: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-100 dark:bg-slate-800 rounded text-sm"
                    >
                      <p className="font-semibold text-slate-900 dark:text-white">
                        Referred User ID: {ref.referredUserId}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 text-xs">
                        Status:{' '}
                        <span
                          className={
                            ref.purchasedPlan
                              ? 'text-green-600'
                              : 'text-yellow-600'
                          }
                        >
                          {ref.purchasedPlan
                            ? 'Purchased ✓'
                            : 'Pending'}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recent Orders */}
            {adminData.ordersList.length > 0 && (
              <Card className="p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Recent Orders
                </h3>
                <div className="space-y-2">
                  {adminData.ordersList.map((order: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-100 dark:bg-slate-800 rounded text-sm"
                    >
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {order.plan}
                        </p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            order.status === 'approved'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-200'
                              : order.status === 'pending'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-200'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                        Amount: ${order.amount || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Instructions */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-3">
            ℹ️ Debug Panel Instructions
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li>
              ✓ <strong>Run All Tests:</strong> Tests social media submissions,
              fetches admin data, and system statistics
            </li>
            <li>
              ✓ <strong>Load Admin Data:</strong> Fetches your profile,
              notifications, referrals, and orders
            </li>
            <li>
              ✓ <strong>Copy Results:</strong> Click the copy button on any test
              result to copy JSON data
            </li>
            <li>
              ✓ <strong>Firestore Permissions:</strong> If tests fail, check
              Firebase Console security rules
            </li>
          </ul>
        </Card>
      </div>
    </AdminLayout>
  );
}
