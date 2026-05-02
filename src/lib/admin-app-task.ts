import { supabase } from '@/lib/supabase-config';

import { createNotification } from '@/lib/supabase-notifications';

export const ADMIN_APP_TASK_TYPE = 'admin_app_install';
export const ADMIN_APP_TASK_TITLE = 'Install Admin App & Send Account Details';
export const ADMIN_APP_MAX_TRIES = 5;

export interface AdminAppTaskCredentials {
  username: string;
  password: string;
}

export interface AdminAppTaskDetails {
  accountEmail: string;
  accountUid: string;
}

export interface AdminAppTaskSubmission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  adminNotes: string;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  details: AdminAppTaskDetails;
  credentials: AdminAppTaskCredentials | null;
  reward: Record<string, any> | null;
}

export interface AdminAppTaskState {
  taskStatus: 'available' | 'pending' | 'approved' | 'rejected' | 'maxed';
  totalAttempts: number;
  remainingTries: number;
  latestSubmission: AdminAppTaskSubmission | null;
  pendingSubmission: AdminAppTaskSubmission | null;
  approvedSubmission: AdminAppTaskSubmission | null;
  latestRejectedSubmission: AdminAppTaskSubmission | null;
  credentials: AdminAppTaskCredentials | null;
  rejectionReason: string;
  canSubmit: boolean;
}

function toObject(value: any): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (typeof value === 'object') {
    return value;
  }
  return {};
}

function toArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function isAdminAppTaskRow(row: any): boolean {
  const reward = toObject(row?.reward);
  if (reward.taskType === ADMIN_APP_TASK_TYPE) {
    return true;
  }

  return toArray(row?.platforms).some(
    (entry) => entry?.platform === ADMIN_APP_TASK_TYPE
  );
}

export function mapAdminAppTaskSubmission(row: any): AdminAppTaskSubmission {
  const reward = toObject(row?.reward);
  const taskRow =
    toArray(row?.platforms).find(
      (entry) => entry?.platform === ADMIN_APP_TASK_TYPE
    ) || {};
  const credentialsSource = toObject(reward.credentials);

  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || 'Unknown User',
    userEmail: row.user_email || '',
    status: row.status || 'pending',
    approvalStatus: row.approval_status || 'pending',
    adminNotes: row.admin_notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    details: {
      accountEmail: taskRow.accountEmail || '',
      accountUid: taskRow.accountUid || '',
    },
    credentials:
      credentialsSource.username && credentialsSource.password
        ? {
            username: credentialsSource.username,
            password: credentialsSource.password,
          }
        : null,
    reward: reward,
  };
}

export function buildAdminAppTaskState(
  submissions: AdminAppTaskSubmission[]
): AdminAppTaskState {
  const sorted = [...submissions].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const latestSubmission = sorted[0] || null;
  const approvedSubmission =
    sorted.find((submission) => submission.approvalStatus === 'approved') || null;
  const pendingSubmission =
    sorted.find((submission) => submission.approvalStatus === 'pending') || null;
  const latestRejectedSubmission =
    sorted.find((submission) => submission.approvalStatus === 'rejected') || null;
  const totalAttempts = sorted.length;
  const remainingTries = Math.max(0, ADMIN_APP_MAX_TRIES - totalAttempts);

  let taskStatus: AdminAppTaskState['taskStatus'] = 'available';

  if (approvedSubmission) {
    taskStatus = 'approved';
  } else if (pendingSubmission) {
    taskStatus = 'pending';
  } else if (latestRejectedSubmission && remainingTries > 0) {
    taskStatus = 'rejected';
  } else if (remainingTries === 0) {
    taskStatus = 'maxed';
  }

  return {
    taskStatus,
    totalAttempts,
    remainingTries,
    latestSubmission,
    pendingSubmission,
    approvedSubmission,
    latestRejectedSubmission,
    credentials: approvedSubmission?.credentials || null,
    rejectionReason: latestRejectedSubmission?.adminNotes || '',
    canSubmit: taskStatus === 'available' || taskStatus === 'rejected',
  };
}

export async function getUserAdminAppTaskSubmissions(userId: string) {
  const { data, error } = await supabase
    .from('social_task_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || [])
    .filter(isAdminAppTaskRow)
    .map(mapAdminAppTaskSubmission);
}

export function listenToUserAdminAppTaskSubmissions(
  userId: string,
  callback: (submissions: AdminAppTaskSubmission[]) => void
) {
  const load = async () => {
    const submissions = await getUserAdminAppTaskSubmissions(userId);
    callback(submissions);
  };

  void load();

  const channel = supabase
    .channel(`admin-app-task-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'social_task_submissions',
        filter: `user_id=eq.${userId}`,
      },
      load
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function submitAdminAppTask(params: {
  userId: string;
  userName: string;
  userEmail: string;
  accountEmail: string;
  accountUid: string;
}) {
  const existing = await getUserAdminAppTaskSubmissions(params.userId);
  const state = buildAdminAppTaskState(existing);

  if (state.approvedSubmission) {
    throw new Error('This task is already completed for your account.');
  }

  if (state.pendingSubmission) {
    throw new Error('Your task is already pending review.');
  }

  if (state.remainingTries <= 0) {
    throw new Error('You have no tries left for this task.');
  }

  const tryNumber = state.totalAttempts + 1;
  const reward = {
    taskType: ADMIN_APP_TASK_TYPE,
    taskTitle: ADMIN_APP_TASK_TITLE,
    tryNumber,
    maxTries: ADMIN_APP_MAX_TRIES,
  };

  const { error } = await supabase.from('social_task_submissions').insert({
    user_id: params.userId,
    user_name: params.userName,
    user_email: params.userEmail,
    platforms: [
      {
        platform: ADMIN_APP_TASK_TYPE,
        accountEmail: params.accountEmail,
        accountUid: params.accountUid,
      },
    ],
    status: 'pending',
    approval_status: 'pending',
    admin_notes: '',
    reward,
  });

  if (error) {
    throw error;
  }
}

export async function getAllAdminAppTaskSubmissions() {
  const { data, error } = await supabase
    .from('social_task_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || [])
    .filter(isAdminAppTaskRow)
    .map(mapAdminAppTaskSubmission);
}

export async function approveAdminAppTask(
  submission: AdminAppTaskSubmission,
  params: { username: string; password: string; adminNotes?: string }
) {
  const reward = {
    ...(submission.reward || {}),
    taskType: ADMIN_APP_TASK_TYPE,
    taskTitle: ADMIN_APP_TASK_TITLE,
    credentials: {
      username: params.username,
      password: params.password,
    },
  };

  const { error } = await supabase
    .from('social_task_submissions')
    .update({
      status: 'completed',
      approval_status: 'approved',
      admin_notes: params.adminNotes || '',
      reward,
      approved_at: new Date().toISOString(),
      rejected_at: null,
    })
    .eq('id', submission.id);

  if (error) {
    throw error;
  }

  await createNotification(
    submission.userId,
    'success',
    'Task Approved',
    `Your admin app task has been approved.${params.adminNotes ? `\n\nAdmin note: ${params.adminNotes}` : '\n\nOpen your task history to view the access details.'}`,
    {},
    '/orders'
  );
}

export async function rejectAdminAppTask(
  submission: AdminAppTaskSubmission,
  params: { reason: string }
) {
  const reward = {
    ...(submission.reward || {}),
    taskType: ADMIN_APP_TASK_TYPE,
    taskTitle: ADMIN_APP_TASK_TITLE,
  };

  const { error } = await supabase
    .from('social_task_submissions')
    .update({
      status: 'rejected',
      approval_status: 'rejected',
      admin_notes: params.reason,
      reward,
      rejected_at: new Date().toISOString(),
    })
    .eq('id', submission.id);

  if (error) {
    throw error;
  }

  await createNotification(
    submission.userId,
    'reject',
    'Task Rejected',
    `Your admin app task was rejected.\n\nReason: ${params.reason}`,
    {},
    '/orders'
  );
}
