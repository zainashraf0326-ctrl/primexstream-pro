import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { auth, assertFirebaseConfigured } from './firebaseClient';
import { ensureUserProfile } from './dbService';

export async function signUpWithEmailPassword({
  name,
  email,
  password,
}) {
  assertFirebaseConfigured();

  const { user } = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  if (name?.trim()) {
    await updateProfile(user, {
      displayName: name.trim(),
    });
  }

  // Create user profile in Firebase Realtime Database
  if (user?.uid) {
    await ensureUserProfile(user.uid, {
      name: name?.trim() || 'User',
      email: email.trim().toLowerCase(),
    });
  }

  return auth.currentUser || user;
}

export async function signInWithEmailPassword({ email, password }) {
  assertFirebaseConfigured();
  const { user } = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  // Ensure user profile exists in Firebase
  if (user?.uid) {
    await ensureUserProfile(user.uid, {
      name: user.displayName || 'User',
      email: email.trim().toLowerCase(),
    });
  }

  return user;
}

export async function signOutUser() {
  if (!auth) {
    return;
  }

  await signOut(auth);
}

export async function changeCurrentUserPassword({
  email,
  currentPassword,
  newPassword,
}) {
  assertFirebaseConfigured();

  if (!auth.currentUser) {
    throw new Error('No authenticated user found.');
  }

  const credential = EmailAuthProvider.credential(
    email.trim(),
    currentPassword
  );

  await reauthenticateWithCredential(auth.currentUser, credential);
  await updatePassword(auth.currentUser, newPassword);
}

export function subscribeToAuthChanges(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    callback(user || null);
  });
}

export function getCurrentAuthUser() {
  return auth?.currentUser || null;
}

export function getAuthErrorMessage(
  error,
  fallbackMessage = 'Authentication failed.'
) {
  const message = error?.message || '';
  const code = error?.code || error?.name || '';

  if (code === 'auth/email-already-in-use') {
    return 'Email already registered. Try logging in.';
  }

  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Email/password sign-in is not enabled in Firebase yet.';
  }

  if (code === 'auth/weak-password') {
    return 'Password must include 8+ characters, uppercase, lowercase, number, and symbol.';
  }

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/invalid-login-credentials' ||
    code === 'auth/wrong-password' ||
    message.toLowerCase().includes('invalid credential')
  ) {
    return 'Invalid credentials';
  }

  if (code === 'auth/user-not-found') {
    return 'User not found';
  }

  if (code === 'auth/user-disabled') {
    return 'This account has been disabled.';
  }

  if (
    code === 'auth/too-many-requests' ||
    message.toLowerCase().includes('too many requests')
  ) {
    return 'Too many attempts. Please try again later.';
  }

  return message || fallbackMessage;
}
