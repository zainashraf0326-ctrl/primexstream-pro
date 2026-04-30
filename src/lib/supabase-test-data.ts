import { seedSupabaseData } from '@/lib/supabase-seed-data';
import { supabase } from '@/lib/supabase-config';

export async function seedTestData() {
  await seedSupabaseData();

  const { data: currentUser } = await supabase.auth.getUser();
  const user = currentUser.user;

  if (user) {
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Supabase test notification',
      message: 'Your Supabase notification flow is connected.',
      type: 'general',
      read: false,
      deleted: false,
      data: {},
    });
  }
}

export async function cleanTestData() {
  const { data: currentUser } = await supabase.auth.getUser();
  const user = currentUser.user;

  if (!user) return;

  await supabase
    .from('notifications')
    .delete()
    .eq('user_id', user.id)
    .eq('title', 'Supabase test notification');
}

export function getTestDataInfo() {
  return {
    users: [
      {
        id: 'current-supabase-user',
        name: 'Current Supabase user',
        email: 'Use the account you are logged in with',
      },
    ],
    adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'zainashraf0326@gmail.com',
  };
}
