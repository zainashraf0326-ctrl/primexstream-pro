'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  KeyRound,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  User,
} from 'lucide-react';
import {
  ADMIN_APP_MAX_TRIES,
  ADMIN_APP_TASK_TITLE,
  buildAdminAppTaskState,
  listenToUserAdminAppTaskSubmissions,
  submitAdminAppTask,
  type AdminAppTaskState,
} from '@/lib/admin-app-task';

interface AdminAppTaskCardProps {
  userId?: string;
  userName?: string;
  userEmail?: string;
}

const initialState: AdminAppTaskState = {
  taskStatus: 'available',
  totalAttempts: 0,
  remainingTries: ADMIN_APP_MAX_TRIES,
  latestSubmission: null,
  pendingSubmission: null,
  approvedSubmission: null,
  latestRejectedSubmission: null,
  credentials: null,
  rejectionReason: '',
  canSubmit: true,
};

export function AdminAppTaskCard({
  userId,
  userName,
  userEmail,
}: AdminAppTaskCardProps) {
  const [accountEmail, setAccountEmail] = useState('');
  const [accountUid, setAccountUid] = useState('');
  const [taskState, setTaskState] = useState<AdminAppTaskState>(initialState);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsubscribe = listenToUserAdminAppTaskSubmissions(userId, (rows) => {
      setTaskState(buildAdminAppTaskState(rows));
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const latestDetails = taskState.latestSubmission?.details;
  const credentials = taskState.credentials;

  useEffect(() => {
    if (taskState.pendingSubmission?.details) {
      setAccountEmail(taskState.pendingSubmission.details.accountEmail);
      setAccountUid(taskState.pendingSubmission.details.accountUid);
      return;
    }

    if (taskState.latestRejectedSubmission?.details) {
      setAccountEmail(taskState.latestRejectedSubmission.details.accountEmail);
      setAccountUid(taskState.latestRejectedSubmission.details.accountUid);
    }
  }, [taskState.pendingSubmission, taskState.latestRejectedSubmission]);

  const helperText = useMemo(() => {
    if (taskState.taskStatus === 'approved') {
      return 'Admin approved your task. Your username and password are ready below.';
    }

    if (taskState.taskStatus === 'pending') {
      return 'Admin received your account details and is checking whether the signup is real.';
    }

    if (taskState.taskStatus === 'rejected') {
      return 'Your last submission was rejected. Fix the issue and submit the task again.';
    }

    if (taskState.taskStatus === 'maxed') {
      return 'This task is no longer available for your account because all tries were used.';
    }

    return 'Install the admin app, create an account, then send your account email and account UID for review.';
  }, [taskState.taskStatus]);

  const handleCopy = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleSubmit = async () => {
    if (!userId) {
      setMessage({ type: 'error', text: 'Please log in first.' });
      return;
    }

    if (!accountEmail.trim() || !accountUid.trim()) {
      setMessage({
        type: 'error',
        text: 'Account email and account UID are both required.',
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await submitAdminAppTask({
        userId,
        userName: userName || 'User',
        userEmail: userEmail || '',
        accountEmail: accountEmail.trim(),
        accountUid: accountUid.trim(),
      });

      setMessage({
        type: 'success',
        text: 'Task sent successfully. Admin will review it and update your result here.',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.message || 'Could not submit the task right now.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6 glass glass-light dark:glass bg-gradient-to-br from-cyan-50 via-white to-blue-50 dark:from-cyan-900/20 dark:via-slate-900 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-600/20">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {ADMIN_APP_TASK_TITLE}
                </h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    taskState.taskStatus === 'approved'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : taskState.taskStatus === 'pending'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      : taskState.taskStatus === 'rejected' || taskState.taskStatus === 'maxed'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
                  }`}
                >
                  {taskState.taskStatus === 'approved' && '100% complete'}
                  {taskState.taskStatus === 'pending' && 'Pending review'}
                  {taskState.taskStatus === 'rejected' && 'Rejected'}
                  {taskState.taskStatus === 'maxed' && 'Task unavailable'}
                  {taskState.taskStatus === 'available' && 'Open task'}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {helperText}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-right dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Remaining tries
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {taskState.remainingTries}/{ADMIN_APP_MAX_TRIES}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <div className="mb-2 flex items-center gap-2 text-slate-900 dark:text-white">
              <Download className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-semibold">Step 1</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Install the admin app when the download link is added.
            </p>
            <Button
              type="button"
              variant="outline"
              disabled
              className="mt-3 w-full"
            >
              App link coming soon
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <div className="mb-2 flex items-center gap-2 text-slate-900 dark:text-white">
              <User className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-semibold">Step 2</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Create your admin app account and keep your account email and UID ready.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <div className="mb-2 flex items-center gap-2 text-slate-900 dark:text-white">
              <ShieldCheck className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-semibold">Step 3</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Admin checks your submission. If it is real, you get a username and password here and in order history.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
            Loading task status...
          </div>
        ) : (
          <>
            {taskState.taskStatus === 'pending' && latestDetails && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <ClipboardList className="h-4 w-4" />
                  <p className="text-sm font-semibold">Admin review in progress</p>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Account email
                    </p>
                    <p className="mt-1 text-sm text-slate-900 dark:text-white">
                      {latestDetails.accountEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Account UID
                    </p>
                    <p className="mt-1 text-sm text-slate-900 dark:text-white">
                      {latestDetails.accountUid}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {taskState.taskStatus === 'approved' && credentials && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm font-semibold">
                    Task approved. Your login credentials are now active.
                  </p>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Username
                    </label>
                    <div className="flex gap-2">
                      <Input value={credentials.username} readOnly />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleCopy(credentials.username, 'username')}
                      >
                        {copiedField === 'username' ? 'Copied' : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Password
                    </label>
                    <div className="flex gap-2">
                      <Input value={credentials.password} readOnly />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleCopy(credentials.password, 'password')}
                      >
                        {copiedField === 'password' ? 'Copied' : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {taskState.taskStatus === 'rejected' && (
              <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm font-semibold">
                      Your task was rejected. Fix anything fake or missing and try again.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                    onClick={() => setShowRejectReason((value) => !value)}
                  >
                    {showRejectReason ? 'Hide reason' : 'View rejection'}
                  </Button>
                </div>
                {showRejectReason && (
                  <p className="mt-3 rounded-xl border border-red-200 bg-white/80 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-slate-900/60 dark:text-red-300">
                    {taskState.rejectionReason || 'Admin marked this submission as fake or missing information.'}
                  </p>
                )}
              </div>
            )}

            {taskState.taskStatus === 'maxed' && (
              <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm font-semibold">
                    All 5 tries were used for this task. This task is now removed from your account until a new one is added.
                  </p>
                </div>
              </div>
            )}

            {taskState.canSubmit && (
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-slate-700 dark:bg-slate-900/70">
                <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                  <KeyRound className="h-4 w-4 text-cyan-600" />
                  <p className="text-sm font-semibold">
                    {taskState.taskStatus === 'rejected' ? 'Retask submission' : 'Send account information'}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Account email
                    </label>
                    <Input
                      value={accountEmail}
                      onChange={(event) => setAccountEmail(event.target.value)}
                      placeholder="Enter account email"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Account UID
                    </label>
                    <Input
                      value={accountUid}
                      onChange={(event) => setAccountUid(event.target.value)}
                      placeholder="Enter account UID"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Attempt {Math.min(taskState.totalAttempts + 1, ADMIN_APP_MAX_TRIES)} of {ADMIN_APP_MAX_TRIES}
                  </p>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    {submitting ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Sending...
                      </>
                    ) : taskState.taskStatus === 'rejected' ? (
                      <>
                        <RefreshCcw className="h-4 w-4" />
                        Retask
                      </>
                    ) : (
                      <>
                        <ClipboardList className="h-4 w-4" />
                        Submit task
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {message && (
          <div
            className={`rounded-2xl border p-4 text-sm ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </Card>
  );
}
