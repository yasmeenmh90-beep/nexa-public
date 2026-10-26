import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { friendlyAuthError, supabase } from '../lib/supabase';
import { PUBLIC_LINKS } from '../config/publicLinks';
import { PageShell } from './PageShell';

const MIN_PASSWORD = 12;

function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, ready, recovery, setRecovery };
}

function NotConfigured() {
  return <div className="auth-card"><h1>Sign-in is not set up yet</h1>
    <p>This deployment has no Supabase project configured, so accounts are switched off. The public demo still works.</p>
    <a className="button primary" href="/#demo">Try the public demo ↗</a></div>;
}

function PrivateNotice() {
  return <p className="auth-notice" role="note"><strong>Private assistant.</strong> NEXA connects to personal email, calendars and code, so accounts are limited to the owner. Other sign-ups are rejected by the server. The <a href="/#demo">public demo</a> needs no account.</p>;
}

export function SignInPage() {
  const { session, ready } = useSession();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [info, setInfo] = useState('');
  useEffect(() => { if (ready && session) window.location.replace('/account'); }, [ready, session]);
  if (!supabase) return <PageShell title="Sign in" narrow><NotConfigured /></PageShell>;
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setInfo(''); setBusy(true);
    const { error: failure } = await supabase!.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (failure) setError(friendlyAuthError(failure.message)); else window.location.replace('/account');
  };
  const forgot = async () => {
    setError(''); setInfo('');
    if (!email.trim()) { setError('Enter your email first, then choose “Forgot password”.'); return; }
    setBusy(true);
    await supabase!.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + '/account' });
    setBusy(false);
    // Same message whether or not the address exists, so the form does not reveal accounts.
    setInfo('If that email has an account, a reset link is on its way.');
  };
  return <PageShell title="Sign in" narrow>
    <form className="auth-card" onSubmit={submit} noValidate>
      <p className="eyebrow">OWNER ACCESS</p><h1>Sign in to NEXA</h1>
      <PrivateNotice />
      <label>Email<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {info && <p className="auth-info" role="status">{info}</p>}
      <button className="button primary" disabled={busy || !email || !password}>{busy ? 'Please wait…' : 'Sign in'}</button>
      <div className="auth-links"><button type="button" className="text-link" onClick={() => void forgot()} disabled={busy}>Forgot password?</button><a className="text-link" href="/signup">Create the owner account</a></div>
    </form>
  </PageShell>;
}

export function SignUpPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [done, setDone] = useState(false);
  if (!supabase) return <PageShell title="Create account" narrow><NotConfigured /></PageShell>;
  const problem = password && password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters.` : confirm && confirm !== password ? 'Passwords do not match.' : '';
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (problem || !agree) return;
    setBusy(true);
    const { error: failure } = await supabase!.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin + '/account' } });
    setBusy(false);
    if (failure) setError(friendlyAuthError(failure.message)); else setDone(true);
  };
  if (done) return <PageShell title="Check your email" narrow><div className="auth-card"><p className="eyebrow">ALMOST DONE</p><h1>Confirm your email</h1><p>We sent a confirmation link to <strong>{email}</strong>. Open it on this device to finish, then sign in.</p><a className="button primary" href="/signin">Go to sign in</a></div></PageShell>;
  return <PageShell title="Create account" narrow>
    <form className="auth-card" onSubmit={submit} noValidate>
      <p className="eyebrow">OWNER ACCOUNT</p><h1>Create your NEXA account</h1>
      <PrivateNotice />
      <label>Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Password<input type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required value={password} onChange={e => setPassword(e.target.value)} aria-describedby="pw-help" /></label>
      <small id="pw-help">At least {MIN_PASSWORD} characters. A password manager is recommended.</small>
      <label>Confirm password<input type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
      <label className="auth-check"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} /> <span>I agree to the <a href="/terms">Terms</a> and have read the <a href="/privacy">Privacy Policy</a>.</span></label>
      {(problem || error) && <p className="auth-error" role="alert">{problem || error}</p>}
      <button className="button primary" disabled={busy || !email || !password || !confirm || !agree || !!problem}>{busy ? 'Please wait…' : 'Create account'}</button>
      <div className="auth-links"><a className="text-link" href="/signin">I already have an account</a></div>
    </form>
  </PageShell>;
}

const CONNECTIONS: [string, string][] = [
  ['Google', 'Gmail, Google Calendar, Google Sheets and Drive'],
  ['GitHub', 'Repositories, commits, issues and pull requests'],
  ['Microsoft', 'Outlook mail, Excel workbooks and OneDrive'],
  ['LinkedIn', 'Your basic profile and sharing posts you approve'],
];

export function AccountPage() {
  const { session, ready, recovery, setRecovery } = useSession();
  const [opened, setOpened] = useState(false);
  const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (ready && !session && !recovery) window.location.replace('/signin'); }, [ready, session, recovery]);
  if (!supabase) return <PageShell title="Account" narrow><NotConfigured /></PageShell>;
  if (!ready || !session) return <PageShell title="Account" narrow><div className="auth-card"><p role="status">Checking your session…</p></div></PageShell>;
  const signOut = async (everywhere: boolean) => { await supabase!.auth.signOut({ scope: everywhere ? 'global' : 'local' }); window.location.replace('/'); };
  const openDesktop = () => { setOpened(true); window.location.href = PUBLIC_LINKS.desktopLink; };
  const updatePassword = async (event: FormEvent) => {
    event.preventDefault(); setMessage('');
    if (password.length < MIN_PASSWORD) { setMessage(`Use at least ${MIN_PASSWORD} characters.`); return; }
    setBusy(true); const { error } = await supabase!.auth.updateUser({ password }); setBusy(false);
    if (error) setMessage(friendlyAuthError(error.message)); else { setMessage('Password updated.'); setPassword(''); setRecovery(false); }
  };
  return <PageShell title="Account">
    <section className="account-grid">
      <div className="auth-card">
        <p className="eyebrow">SIGNED IN</p><h1>Welcome back</h1>
        <p>Signed in as <strong>{session.user.email}</strong>.</p>
        <button className="button primary" onClick={openDesktop}>Open NEXA desktop ↗</button>
        {opened && <p className="auth-info" role="status">If NEXA did not open, the desktop app is not installed on this computer yet. Build it with <code>npm run desktop:pack</code>, open it once, then try again.</p>}
        <div className="auth-links"><button className="text-link" onClick={() => void signOut(false)}>Sign out</button><button className="text-link" onClick={() => void signOut(true)}>Sign out on all devices</button></div>
      </div>
      <div className="auth-card">
        <p className="eyebrow">NEXT STEP · IN THE DESKTOP APP</p><h2>Connect your work apps</h2>
        <p>NEXA asks for these connections inside the desktop app. Each one opens the provider’s own sign-in page; NEXA never sees your passwords. You can disconnect any of them at any time.</p>
        <ul className="connection-list">{CONNECTIONS.map(([name, scope]) => <li key={name}><strong>{name}</strong><span>{scope}</span></li>)}</ul>
        <p className="auth-small">Email and calendar changes always need your approval in NEXA first. See the <a href="/security">security policy</a>.</p>
      </div>
      {recovery && <form className="auth-card" onSubmit={updatePassword}>
        <p className="eyebrow">PASSWORD RESET</p><h2>Choose a new password</h2>
        <label>New password<input type="password" autoComplete="new-password" minLength={MIN_PASSWORD} value={password} onChange={e => setPassword(e.target.value)} /></label>
        {message && <p className={message === 'Password updated.' ? 'auth-info' : 'auth-error'} role="status">{message}</p>}
        <button className="button primary" disabled={busy || !password}>Update password</button>
      </form>}
    </section>
  </PageShell>;
}
