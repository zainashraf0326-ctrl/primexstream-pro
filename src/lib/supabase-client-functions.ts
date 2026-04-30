// ============================================================
// SUPABASE CLIENT FUNCTIONS - Production Ready
// Use in your Next.js project
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================
// 1. AUTHENTICATION
// ============================================================

export const signUp = async (email: string, password: string, name: string) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    const userId = authData.user?.id;
    if (!userId) throw new Error("User creation failed");

    // Generate referral code
    const referralCode = `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Insert into users_profile
    const { error: profileError } = await supabase.from("users_profile").insert({
      id: userId,
      name,
      email,
      referral_code: referralCode,
    });

    if (profileError) throw profileError;

    return { success: true, userId, email };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============================================================
// 2. STORAGE - Image Upload
// ============================================================

export const uploadProofImage = async (
  userId: string,
  file: File,
  folder: string = "proof"
) => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("proof")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage.from("proof").getPublicUrl(filePath);

    return { success: true, url: data.publicUrl, filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getPublicImageUrl = (filePath: string) => {
  const { data } = supabase.storage.from("proof").getPublicUrl(filePath);
  return data.publicUrl;
};

// ============================================================
// 3. USER PROFILE
// ============================================================

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("users_profile")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (
  userId: string,
  updates: Record<string, any>
) => {
  try {
    const { data, error } = await supabase
      .from("users_profile")
      .update(updates)
      .eq("id", userId)
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============================================================
// 4. PLANS & SUBSCRIPTIONS
// ============================================================

export const getPlans = async () => {
  try {
    const { data, error } = await supabase.from("plans").select("*");

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const subscribeToPlan = async (
  userId: string,
  planId: string,
  status: string = "active"
) => {
  try {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        plan_id: planId,
        status,
      })
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserSubscriptions = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*, plans(name, price)")
      .eq("user_id", userId);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============================================================
// 5. REFERRALS
// ============================================================

export const createReferral = async (
  referrerId: string,
  referredUserId: string,
  rewardAmount: number = 5.0
) => {
  try {
    const { data, error } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrerId,
        referred_user_id: referredUserId,
        reward_amount: rewardAmount,
      })
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getReferrals = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("referrals")
      .select("*, users_profile(name, email)")
      .eq("referrer_id", userId);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateReferralStatus = async (
  referralId: string,
  status: string
) => {
  try {
    const { data, error } = await supabase
      .from("referrals")
      .update({ status })
      .eq("id", referralId)
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============================================================
// 6. NOTIFICATIONS
// ============================================================

export const createNotification = async (
  userId: string,
  type: string,
  message: string,
  referrerId?: string
) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        referrer_id: referrerId || null,
        type,
        message,
      })
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserNotifications = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============================================================
// 7. SOCIAL TASK SUBMISSIONS
// ============================================================

export const submitSocialTask = async (
  userId: string,
  userName: string,
  userEmail: string,
  platforms: Array<{ platform: string; username: string; proofFileName: string }>
) => {
  try {
    const { data, error } = await supabase
      .from("social_task_submissions")
      .insert({
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        platforms: JSON.stringify(platforms),
        status: "pending",
        approval_status: "pending",
      })
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============================================================
// 8. ADMIN QUERIES
// ============================================================

export const getAllUsersWithPlans = async () => {
  try {
    const { data, error } = await supabase
      .from("users_profile")
      .select(
        `
        id,
        name,
        email,
        phone,
        referral_code,
        created_at,
        user_subscriptions(
          status,
          plans(name, price)
        ),
        referrals(
          id,
          referred_user_id
        )
      `
      );

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserWithReferralTree = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("referrals")
      .select(
        `
        id,
        referrer_id,
        referred_user_id,
        status,
        users_profile!referred_user_id(
          id,
          name,
          email
        )
      `
      )
      .eq("referrer_id", userId);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getTotalStats = async () => {
  try {
    const { data: users, error: usersError } = await supabase
      .from("users_profile")
      .select("id");

    const { data: subscriptions, error: subsError } = await supabase
      .from("user_subscriptions")
      .select("id");

    const { data: referrals, error: refError } = await supabase
      .from("referrals")
      .select("id");

    if (usersError || subsError || refError) throw new Error("Stats fetch failed");

    return {
      success: true,
      stats: {
        totalUsers: users?.length || 0,
        totalSubscriptions: subscriptions?.length || 0,
        totalReferrals: referrals?.length || 0,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============================================================
// 9. REALTIME SUBSCRIPTIONS
// ============================================================

export const subscribeToUserUpdates = (userId: string, callback: Function) => {
  return supabase
    .channel(`user_${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "users_profile",
        filter: `id=eq.${userId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();
};

export const subscribeToNotifications = (userId: string, callback: Function) => {
  return supabase
    .channel(`notifications_${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();
};

export default supabase;
