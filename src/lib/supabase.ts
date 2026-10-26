import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Owner sign-in for NEXA. Only the public "anon" key is used in the browser; who may sign up
 * is enforced inside Supabase (see supabase/owner-only.sql), not by this code.
 * When the two variables are missing, the sign-in pages say so and the rest of the site works as before.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && anonKey
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } })
  : null;

/** Turns Supabase errors into short, non-technical messages without echoing server details. */
export function friendlyAuthError(message: string | undefined): string {
  const text = (message || '').toLowerCase();
  if (text.includes('invalid login')) return 'Email or password is incorrect.';
  if (text.includes('email not confirmed')) return 'Confirm your email first. Check your inbox for the link from NEXA.';
  if (text.includes('private') || text.includes('database error saving new user') || text.includes('signups not allowed')) return 'NEXA is private. New accounts are limited to the owner.';
  if (text.includes('should contain') || text.includes('weak') || (text.includes('password') && text.includes('character'))) return 'Password too weak: use at least 12 characters with a lowercase letter, an uppercase letter, a number and a symbol.';
  if (text.includes('invalid api key') || text.includes('no api key')) return 'Sign-in is misconfigured (Supabase key). Check VITE_SUPABASE_ANON_KEY.';
  if (text.includes('error sending') || text.includes('smtp')) return 'The confirmation email could not be sent. Try again in a few minutes.';
  if (text.includes('rate limit') || text.includes('too many')) return 'Too many attempts. Wait a few minutes and try again.';
  return 'Something went wrong. Please try again.';
}
