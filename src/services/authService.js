import {
  EmailAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { supabase } from '@/lib/supabase-config';
import { isFirebaseConfigured } from './firebaseClient';
import { assertFirebaseConfigured, auth } from './firebaseClient';

let persistencePromise = null;

async function getAuthInstance() {
  if (!isFirebaseConfigured) {
    return null;
  }

  assertFirebaseConfigured();

  if (!persistencePromise) {
    persistencePromise = setPersistence(auth, browserLocalPersistence).catch(
      (error) => {
        persistencePromise = null;
        throw error;
      }
    );
  }

  await persistencePromise;
  return auth;
}

export async function signUpWithEmailPassword({ name, email, password }) {
  if (!isFirebaseConfigured) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error || !data.user) {
      throw error || new Error('Signup failed');
    }

    return data.user;
  }

  const authInstance = await getAuthInstance();
  const credential = await createUserWithEmailAndPassword(
    authInstance,
    email,
    password
  );

  if (name) {
    await updateProfile(credential.user, { displayName: name });
  }

  return credential.user;
}

export async function signInWithEmailPassword({ email, password }) {
  if (!isFirebaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw error || new Error('Sign in failed');
    }

    return data.user;
  }

  const authInstance = await getAuthInstance();
  const credential = await signInWithEmailAndPassword(
    authInstance,
    email,
    password
  );
  return credential.user;
}

export async function signOutUser() {
  if (!isFirebaseConfigured) {
    await supabase.auth.signOut();
    return;
  }

  const authInstance = await getAuthInstance();
  await signOut(authInstance);
}

export async function changeCurrentUserPassword({
  email,
  currentPassword,
  newPassword,
}) {
  if (!isFirebaseConfigured) {
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (reauthError) {
      throw reauthError;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw updateError;
    }

    return;
  }

  const authInstance = await getAuthInstance();
  const currentUser = authInstance.currentUser;

  if (!currentUser || !email) {
    throw new Error('No authenticated user found');
  }

  const credential = EmailAuthProvider.credential(email, currentPassword);
  await reauthenticateWithCredential(currentUser, credential);
  await updatePassword(currentUser, newPassword);
}

export function subscribeToAuthChanges(callback) {
  if (!isFirebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

export function getCurrentAuthUser() {
  return auth?.currentUser || null;
}

export function getAuthErrorMessage(
  error,
  fallbackMessage = 'Authentication failed.'
) {
  if (!error?.code) return error?.message || fallbackMessage;

  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Email already registered. Try logging in.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return error.message || fallbackMessage;
  }
}
