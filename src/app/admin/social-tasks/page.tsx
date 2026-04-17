'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/components/providers/admin-provider';
import AdminLayout from '@/components/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  MessageSquare,
  Youtube,
  Instagram,
  Facebook,
  Mail,
  Send,
  Music2,
  Archive,
  AlertCircle,
} from 'lucide-react';
import { db } from '@/lib/firebase-config';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
import {
  notifySocialTaskApproved,
  notifySocialTaskRejected,
  addWalletCredit,
} from '@/lib/firestore-notifications';

interface SocialTaskPlatform {
  platform: string;
  username: string;
  proofFileName: string;
}

interface SocialTaskSubmission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  platforms: SocialTaskPlatform[];
  status: string;
  createdAt: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  adminNotes: string;
  reward: {
    freeAccess: string;
    walletCredit: number;
  } | null;
}

const platformIcons = {
  youtube: { icon: Youtube, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  instagram: { icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  tiktok: { icon: Music2, color: 'text-slate-900 dark:text-white', bg: 'bg-slate-50 dark:bg-slate-800' },
  facebook: { icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  x: { icon: Mail, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20' },
  telegram: { icon: Send, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
};

export default function SocialTasksAdminPage() {
  const { user, isLoading } = useAdmin();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SocialTaskSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<SocialTaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [adminNotesText, setAdminNotesText] = useState('');

  // Check admin access
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/admin/login');
    }
  }, [isLoading, user, router]);

  // Fetch social task submissions
  useEffect(() => {
    if (!user) return;

    const submissionsRef = collection(db, 'socialTaskSubmissions');
    const q = query(submissionsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: SocialTaskSubmission[] = [];
        snapshot.forEach((doc) => {
          data.push({
            id: doc.id,
            ...(doc.data() as Omit<SocialTaskSubmission, 'id'>),
          });
        });
        // Sort by newest first
        data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSubmissions(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching submissions:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Filter submissions
  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredSubmissions(submissions);
    } else {
      setFilteredSubmissions(
        submissions.filter((sub) => sub.approvalStatus === filterStatus)
      );
    }
  }, [submissions, filterStatus]);

  // Approve submission
  const handleApprove = async (submissionId: string) => {
    setProcessingId(submissionId);
    try {
      // Find submission to get userId and platforms
      const submission = submissions.find((s) => s.id === submissionId);
      if (!submission) {
        alert('Submission not found');
        setProcessingId(null);
        return;
      }

      const submissionRef = doc(db, 'socialTaskSubmissions', submissionId);
      const walletCredit = 20;

      // Update submission status
      await updateDoc(submissionRef, {
        approvalStatus: 'approved',
        adminNotes: adminNotesText,
        reward: {
          freeAccess: '1 month',
          walletCredit: walletCredit,
        },
        approvedAt: new Date().toISOString(),
      });

      // Add wallet credit to user
      const walletAdded = await addWalletCredit(
        submission.userId,
        walletCredit,
        `Social task approved (${submission.platforms.map((p) => p.platform).join(', ')})`,
        submissionId
      );

      // Send notification to user
      if (walletAdded) {
        const platformNames = submission.platforms.map((p) => p.platform).join(', ');
        await notifySocialTaskApproved(submission.userId, {
          platforms: submission.platforms.map((p) => p.platform),
          walletCredit: walletCredit,
          freeAccess: '1 month',
        });
      }

      alert('✅ Submission approved! User notified with wallet credit');
      setSelectedSubmissionId(null);
      setAdminNotesText('');
    } catch (error) {
      console.error('Error approving submission:', error);
      alert('Error approving submission');
    } finally {
      setProcessingId(null);
    }
  };

  // Reject submission
  const handleReject = async (submissionId: string) => {
    if (!window.confirm('Are you sure you want to reject this submission?')) return;

    setProcessingId(submissionId);
    try {
      // Find submission to get userId and platforms
      const submission = submissions.find((s) => s.id === submissionId);
      if (!submission) {
        alert('Submission not found');
        setProcessingId(null);
        return;
      }

      const submissionRef = doc(db, 'socialTaskSubmissions', submissionId);
      await updateDoc(submissionRef, {
        approvalStatus: 'rejected',
        adminNotes: adminNotesText || 'Rejected by admin',
        rejectedAt: new Date().toISOString(),
      });

      // Send notification to user with reason
      await notifySocialTaskRejected(submission.userId, {
        platforms: submission.platforms.map((p) => p.platform),
        reason: adminNotesText || 'No specific reason provided. Please contact support.',
      });

      alert('❌ Submission rejected. User notified.');
      setSelectedSubmissionId(null);
      setAdminNotesText('');
    } catch (error) {
      console.error('Error rejecting submission:', error);
      alert('Error rejecting submission');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-4 border-slate-300 border-t-emerald-600 animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading submissions...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.approvalStatus === 'pending').length,
    approved: submissions.filter((s) => s.approvalStatus === 'approved').length,
    rejected: submissions.filter((s) => s.approvalStatus === 'rejected').length,
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Social Tasks Verification
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Review and approve/reject user social media task submissions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center glass glass-light dark:glass">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.total}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Total Submissions
            </p>
          </Card>

          <Card className="p-4 text-center glass glass-light dark:glass border-orange-200 dark:border-orange-800">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.pending}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Pending Review
            </p>
          </Card>

          <Card className="p-4 text-center glass glass-light dark:glass border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.approved}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Approved
            </p>
          </Card>

          <Card className="p-4 text-center glass glass-light dark:glass border-red-200 dark:border-red-800">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.rejected}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Rejected
            </p>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <Button
              key={status}
              onClick={() => setFilterStatus(status)}
              variant={filterStatus === status ? 'primary' : 'outline'}
              className="gap-2 capitalize"
            >
              {status === 'all' && 'All'}
              {status === 'pending' && (
                <>
                  <Clock className="w-4 h-4" />
                  Pending
                </>
              )}
              {status === 'approved' && (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Approved
                </>
              )}
              {status === 'rejected' && (
                <>
                  <XCircle className="w-4 h-4" />
                  Rejected
                </>
              )}
            </Button>
          ))}
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <Card className="p-12 text-center glass glass-light dark:glass">
            <Archive className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
            <p className="text-slate-600 dark:text-slate-400">
              No {filterStatus !== 'all' ? filterStatus : ''} submissions found
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className={`p-6 glass glass-light dark:glass cursor-pointer transition-all hover:shadow-lg rounded-lg border ${
                  submission.approvalStatus === 'pending'
                    ? 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10'
                    : submission.approvalStatus === 'approved'
                      ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                      : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                } ${selectedSubmissionId === submission.id ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() =>
                  setSelectedSubmissionId(
                    selectedSubmissionId === submission.id ? null : submission.id
                  )
                }
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {submission.userName}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          submission.approvalStatus === 'pending'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                            : submission.approvalStatus === 'approved'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {submission.approvalStatus.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Email: {submission.userEmail}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      Submitted {new Date(submission.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {submission.approvalStatus === 'pending' && (
                      <Clock className="w-5 h-5 text-orange-600" />
                    )}
                    {submission.approvalStatus === 'approved' && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    {submission.approvalStatus === 'rejected' && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>

                {/* Platforms */}
                <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Platforms ({submission.platforms.length}):
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {submission.platforms.map((platform, idx) => {
                      const platformConfig = platformIcons[platform.platform as keyof typeof platformIcons];
                      const Icon = platformConfig?.icon || Mail;

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg flex items-center gap-2 ${platformConfig?.bg || 'bg-slate-50 dark:bg-slate-800'}`}
                        >
                          <Icon className={`w-5 h-5 ${platformConfig?.color || 'text-slate-600'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {platform.platform}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                              @{platform.username}
                            </p>
                          </div>
                          {platform.proofFileName && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Download/view proof file
                                alert(`View proof: ${platform.proofFileName}`);
                              }}
                            >
                              <Download className="w-3 h-3" />
                              Proof
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Expandable Details */}
                {selectedSubmissionId === submission.id && (
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-fade-in-up">
                    {/* Admin Notes */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Admin Notes
                      </label>
                      <textarea
                        value={
                          selectedSubmissionId === submission.id
                            ? adminNotesText
                            : submission.adminNotes
                        }
                        onChange={(e) => setAdminNotesText(e.target.value)}
                        placeholder="Add notes about this submission..."
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Action Buttons */}
                    {submission.approvalStatus === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(submission.id)}
                          disabled={processingId === submission.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                        >
                          {processingId === submission.id ? (
                            <>
                              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Approve & Give Reward
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleReject(submission.id)}
                          disabled={processingId === submission.id}
                          variant="outline"
                          className="flex-1 gap-2 text-red-600 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {processingId === submission.id ? (
                            <>
                              <div className="w-4 h-4 rounded-full border-2 border-red-600 border-t-transparent animate-spin"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {submission.approvalStatus === 'approved' && submission.reward && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                          ✓ Reward Given:
                        </p>
                        <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
                          <li>• Free access: {submission.reward.freeAccess}</li>
                          <li>• Wallet credit: ₹{submission.reward.walletCredit}</li>
                        </ul>
                      </div>
                    )}

                    {submission.adminNotes && (
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Admin Notes:
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {submission.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
