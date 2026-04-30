'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/components/providers/admin-provider';
import AdminLayout from '@/components/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  KeyRound,
  RefreshCcw,
  ShieldAlert,
  Smartphone,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase-config';
import {
  ADMIN_APP_MAX_TRIES,
  ADMIN_APP_TASK_TITLE,
  approveAdminAppTask,
  getAllAdminAppTaskSubmissions,
  rejectAdminAppTask,
  type AdminAppTaskSubmission,
} from '@/lib/admin-app-task';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function SocialTasksAdminPage() {
  const { user, isLoading } = useAdmin();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<AdminAppTaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [reviewForm, setReviewForm] = useState({
    adminNotes: '',
    username: '',
    password: '',
    rejectionReason: '',
  });

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/admin/login');
    }
  }, [isLoading, router, user]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    const load = async () => {
      try {
        const rows = await getAllAdminAppTaskSubmissions();
        if (active) {
          setSubmissions(rows);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading admin app tasks:', error);
        if (active) {
          setLoading(false);
          setMessage({
            type: 'error',
            text: 'Could not load task submissions right now.',
          });
        }
      }
    };

    void load();

    const channel = supabase
      .channel('admin-admin-app-task-watch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'social_task_submissions' },
        load
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const stats = useMemo(
    () => ({
      total: submissions.length,
      pending: submissions.filter((item) => item.approvalStatus === 'pending').length,
      approved: submissions.filter((item) => item.approvalStatus === 'approved').length,
      rejected: submissions.filter((item) => item.approvalStatus === 'rejected').length,
    }),
    [submissions]
  );

  const filteredSubmissions = useMemo(() => {
    if (filterStatus === 'all') return submissions;
    return submissions.filter((item) => item.approvalStatus === filterStatus);
  }, [filterStatus, submissions]);

  const attemptMeta = useMemo(() => {
    const perUser = new Map<string, number>();
    const perSubmission = new Map<string, number>();

    [...submissions]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .forEach((submission) => {
        const nextCount = (perUser.get(submission.userId) || 0) + 1;
        perUser.set(submission.userId, nextCount);
        perSubmission.set(submission.id, nextCount);
      });

    return perSubmission;
  }, [submissions]);

  const selectedSubmission =
    submissions.find((submission) => submission.id === selectedId) || null;

  const handleSelect = (submission: AdminAppTaskSubmission) => {
    if (selectedId === submission.id) {
      setSelectedId(null);
      return;
    }

    setSelectedId(submission.id);
    setReviewForm({
      adminNotes: submission.adminNotes || '',
      username: submission.credentials?.username || '',
      password: submission.credentials?.password || '',
      rejectionReason:
        submission.approvalStatus === 'rejected' ? submission.adminNotes || '' : '',
    });
  };

  const handleApprove = async (submission: AdminAppTaskSubmission) => {
    if (!reviewForm.username.trim() || !reviewForm.password.trim()) {
      setMessage({
        type: 'error',
        text: 'Username and password are required before approval.',
      });
      return;
    }

    setProcessingId(submission.id);
    setMessage(null);

    try {
      await approveAdminAppTask(submission, {
        username: reviewForm.username.trim(),
        password: reviewForm.password.trim(),
        adminNotes: reviewForm.adminNotes.trim(),
      });

      setMessage({
        type: 'success',
        text: 'Task approved and credentials saved for the user.',
      });
      setSelectedId(null);
    } catch (error) {
      console.error('Error approving admin app task:', error);
      setMessage({
        type: 'error',
        text: 'Could not approve this task right now.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (submission: AdminAppTaskSubmission) => {
    if (!reviewForm.rejectionReason.trim()) {
      setMessage({
        type: 'error',
        text: 'Please write a rejection reason so the user knows what to fix.',
      });
      return;
    }

    setProcessingId(submission.id);
    setMessage(null);

    try {
      await rejectAdminAppTask(submission, {
        reason: reviewForm.rejectionReason.trim(),
      });

      setMessage({
        type: 'success',
        text: 'Task rejected and the reason was saved for the user.',
      });
      setSelectedId(null);
    } catch (error) {
      console.error('Error rejecting admin app task:', error);
      setMessage({
        type: 'error',
        text: 'Could not reject this task right now.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 rounded-full border-4 border-slate-300 border-t-cyan-600 animate-spin" />
            <p className="text-slate-600 dark:text-slate-400">
              Loading admin app tasks...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Admin App Task Review
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Review account email and UID, then approve with credentials or reject with a reason.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 dark:border-cyan-800 dark:bg-cyan-900/20">
            <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
              <Smartphone className="h-4 w-4" />
              <span className="text-sm font-semibold">{ADMIN_APP_TASK_TITLE}</span>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4 text-center glass glass-light dark:glass">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Total</p>
          </Card>
          <Card className="p-4 text-center glass glass-light dark:glass border-amber-200 dark:border-amber-800">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Pending</p>
          </Card>
          <Card className="p-4 text-center glass glass-light dark:glass border-emerald-200 dark:border-emerald-800">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.approved}</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Approved</p>
          </Card>
          <Card className="p-4 text-center glass glass-light dark:glass border-red-200 dark:border-red-800">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Rejected</p>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map((status) => (
            <Button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              variant={filterStatus === status ? 'primary' : 'outline'}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>

        {filteredSubmissions.length === 0 ? (
          <Card className="p-12 text-center glass glass-light dark:glass">
            <p className="text-slate-600 dark:text-slate-400">
              No {filterStatus === 'all' ? '' : filterStatus} admin app tasks found.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredSubmissions.map((submission) => {
              const attemptNumber =
                Number(submission.reward?.tryNumber) ||
                attemptMeta.get(submission.id) ||
                1;
              const isSelected = selectedId === submission.id;

              return (
                <Card
                  key={submission.id}
                  className={`p-5 glass glass-light dark:glass border transition-all ${
                    submission.approvalStatus === 'pending'
                      ? 'border-amber-200 dark:border-amber-800'
                      : submission.approvalStatus === 'approved'
                      ? 'border-emerald-200 dark:border-emerald-800'
                      : 'border-red-200 dark:border-red-800'
                  } ${isSelected ? 'ring-2 ring-cyan-500' : ''}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {submission.userName}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            submission.approvalStatus === 'pending'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : submission.approvalStatus === 'approved'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          }`}
                        >
                          {submission.approvalStatus}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Try {attemptNumber}/{ADMIN_APP_MAX_TRIES}
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Account email
                          </p>
                          <p className="mt-1 text-sm text-slate-900 dark:text-white">
                            {submission.details.accountEmail || 'Not provided'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Account UID
                          </p>
                          <p className="mt-1 text-sm text-slate-900 dark:text-white">
                            {submission.details.accountUid || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>Email: {submission.userEmail || 'No email'}</span>
                        <span>Submitted: {new Date(submission.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {submission.approvalStatus === 'pending' && (
                        <Clock className="h-5 w-5 text-amber-500" />
                      )}
                      {submission.approvalStatus === 'approved' && (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      )}
                      {submission.approvalStatus === 'rejected' && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSelect(submission)}
                      >
                        {isSelected ? 'Close review' : 'Open review'}
                      </Button>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-5 space-y-4 border-t border-slate-200 pt-5 dark:border-slate-700">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Username to give user
                          </label>
                          <Input
                            value={reviewForm.username}
                            onChange={(event) =>
                              setReviewForm((prev) => ({
                                ...prev,
                                username: event.target.value,
                              }))
                            }
                            placeholder="Enter username"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Password to give user
                          </label>
                          <Input
                            value={reviewForm.password}
                            onChange={(event) =>
                              setReviewForm((prev) => ({
                                ...prev,
                                password: event.target.value,
                              }))
                            }
                            placeholder="Enter password"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Admin notes
                        </label>
                        <textarea
                          value={reviewForm.adminNotes}
                          onChange={(event) =>
                            setReviewForm((prev) => ({
                              ...prev,
                              adminNotes: event.target.value,
                            }))
                          }
                          rows={3}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          placeholder="Optional note for your records"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Rejection reason
                        </label>
                        <textarea
                          value={reviewForm.rejectionReason}
                          onChange={(event) =>
                            setReviewForm((prev) => ({
                              ...prev,
                              rejectionReason: event.target.value,
                            }))
                          }
                          rows={3}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          placeholder="Explain what was fake or missing"
                        />
                      </div>

                      {submission.approvalStatus === 'approved' && submission.credentials && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                            <KeyRound className="h-4 w-4" />
                            <p className="text-sm font-semibold">
                              Current credentials already saved
                            </p>
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Username
                              </p>
                              <p className="mt-1 text-sm text-slate-900 dark:text-white">
                                {submission.credentials.username}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Password
                              </p>
                              <p className="mt-1 text-sm text-slate-900 dark:text-white">
                                {submission.credentials.password}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {submission.approvalStatus === 'rejected' && submission.adminNotes && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                            <ShieldAlert className="h-4 w-4" />
                            <p className="text-sm font-semibold">
                              Last rejection reason
                            </p>
                          </div>
                          <p className="mt-3 text-sm text-red-700 dark:text-red-300">
                            {submission.adminNotes}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="button"
                          disabled={processingId === submission.id}
                          onClick={() => handleApprove(submission)}
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {processingId === submission.id ? (
                            <>
                              <RefreshCcw className="h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Approve task
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          disabled={processingId === submission.id}
                          variant="outline"
                          className="gap-2 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
                          onClick={() => handleReject(submission)}
                        >
                          {processingId === submission.id ? (
                            <>
                              <RefreshCcw className="h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4" />
                              Reject task
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
