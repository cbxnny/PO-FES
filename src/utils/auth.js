/**

 *
 * Authentication utilities for PO-FES, backed by Supabase Auth.
 */

import { supabase } from './supabaseClient';

let cachedUser = null;

const loadProfile = async (authUser) => {
  if (!authUser) {
    cachedUser = null;
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single();

  if (error) {
    console.error('Failed to load user profile:', error.message);
    cachedUser = null;
    return null;
  }

  cachedUser = data;
  return data;
};

supabase.auth.onAuthStateChange((_event, session) => {
  loadProfile(session?.user ?? null);
});

/**
 * Call once before the app renders (see main.jsx) so getCurrentUser() has
 * data on first paint.
 */
export const initAuth = async () => {
  const { data } = await supabase.auth.getSession();
  await loadProfile(data.session?.user ?? null);
};


// Validation helpers 


export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const checkPasswordStrength = (password) => {
  let score = 0;
  const feedback = [];

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One uppercase letter');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One number');
  }

  if (/[@$!%*?&]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One special character (@$!%*?&)');
  }

  let label = 'Weak';
  let color = '#ef4444'; // red
  if (score === 2) { label = 'Fair'; color = '#f59e0b'; } // amber
  if (score === 3) { label = 'Good'; color = '#3b82f6'; } // blue
  if (score === 4) { label = 'Strong'; color = '#10b981'; } // green

  return { score, label, color, feedback, isValid: score === 4 };
};

// ---------------------------------------------------------------------------
// Auth actions
// ---------------------------------------------------------------------------

/**
 * Signs up via Supabase Auth. firstname/lastname/role are passed as user
 * metadata and picked up by the handle_new_user() trigger, which creates
 * the matching public.users row.
 */
export const registerUser = async (firstName, lastName, email, password, role) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { firstname: firstName, lastname: lastName, phone_no: null, role }
    }
  });
  if (error) throw new Error(error.message);

  await loadProfile(data.user);
  if (!cachedUser) throw new Error('Account created, but the profile row was not found yet. Try signing in.');
  return cachedUser;
};

export const loginUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  const profile = await loadProfile(data.user);
  if (!profile) throw new Error('Signed in, but no matching profile was found.');
  return profile;
};

export const logoutUser = async () => {
  await supabase.auth.signOut();
  cachedUser = null;
};

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

/** Returns the cached profile row (public.users), or null if signed out. */
export const getCurrentUser = () => cachedUser;

/** Async — use when you need a fresh token for a manual fetch/header. */
export const getAuthToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
};