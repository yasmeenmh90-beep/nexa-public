import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
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

/** Two-column frame: NEXA visual on the left, the form on the right (stacks on phones). */
function AuthLayout({ title, eyebrow, heading, lead, children }: { title: string; eyebrow: string; heading: ReactNode; lead: string; children: ReactNode }) {
  return <PageShell title={title}>
    <section className="auth-shell">
      <aside className="auth-visual" aria-hidden="true">
        <div className="auth-visual-glow" />
        <img src="/avatar/nexa-studio-dashboard.png" alt="" width="291" height="313" />
        <div className="auth-visual-copy">
          <p className="eyebrow">✦ NEXA · PRIVATE ASSISTANT</p>
          <h2>Your inbox, calendar and code — <em>one calm assistant.</em></h2>
          <ul className="auth-points">
            <li><span>01</span>Owner-only access, enforced by the database</li>
            <li><span>02</span>Email and calendar changes wait for your approval</li>
            <li><span>03</span>Keys stay encrypted in n8n and the macOS Keychain</li>
          </ul>
        </div>
      </aside>
      <div className="auth-panel">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{heading}</h1>
        <p className="auth-lead">{lead}</p>
        {children}
      </div>
    </section>
  </PageShell>;
}

function NotConfigured() {
  return <div className="auth-form"><p className="auth-notice">This deployment has no Supabase project configured, so accounts are switched off. The public demo still works.</p>
    <a className="button primary auth-submit" href="/#demo">Try the public demo ↗</a></div>;
}

function PrivateNotice() {
  return <p className="auth-notice" role="note"><span aria-hidden="true">🔒</span><span><strong>Owner only.</strong> Other sign-ups are rejected by the server. The <a href="/#demo">public demo</a> needs no account.</span></p>;
}

function PasswordField({ label, value, onChange, autoComplete, describedBy }: { label: string; value: string; onChange: (v: string) => void; autoComplete: string; describedBy?: string }) {
  const [show, setShow] = useState(false);
  return <label>{label}
    <span className="auth-input-wrap">
      <input type={show ? 'text' : 'password'} autoComplete={autoComplete} required value={value} onChange={e => onChange(e.target.value)} aria-describedby={describedBy} />
      <button type="button" className="auth-reveal" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>{show ? 'Hide' : 'Show'}</button>
    </span>
  </label>;
}

const RULES: [string, (p: string) => boolean][] = [
  [`${MIN_PASSWORD}+ characters`, p => p.length >= MIN_PASSWORD],
  ['Upper & lower case', p => /[a-z]/.test(p) && /[A-Z]/.test(p)],
  ['A number', p => /\d/.test(p)],
  ['A symbol', p => /[^A-Za-z0-9]/.test(p)],
];

function PasswordRules({ password }: { password: string }) {
  const met = RULES.filter(([, test]) => test(password)).length;
  return <div className="auth-strength" id="pw-help">
    <div className="auth-meter" aria-hidden="true">{RULES.map((_, i) => <i key={i} className={i < met ? 'on' : ''} />)}</div>
    <ul>{RULES.map(([text, test]) => <li key={text} className={test(password) ? 'ok' : ''}>{test(password) ? '✓' : '○'} {text}</li>)}</ul>
  </div>;
}

export function SignInPage() {
  const { session, ready } = useSession();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [info, setInfo] = useState('');
  useEffect(() => { if (ready && session) window.location.replace('/account'); }, [ready, session]);
  const shell = (children: ReactNode) => <AuthLayout title="Sign in" eyebrow="OWNER ACCESS" heading={<>Welcome back to <em>NEXA</em></>} lead="Sign in to open your private assistant and connected apps.">{children}</AuthLayout>;
  if (!supabase) return shell(<NotConfigured />);
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
  return shell(<form className="auth-form" onSubmit={submit} noValidate>
    <PrivateNotice />
    <label>Email<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
    <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
    <div className="auth-row"><button type="button" className="text-link" onClick={() => void forgot()} disabled={busy}>Forgot password?</button></div>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {info && <p className="auth-info" role="status">{info}</p>}
    <button className="button primary auth-submit" disabled={busy || !email || !password}>{busy ? 'Signing in…' : 'Sign in'}<span aria-hidden="true">→</span></button>
    <p className="auth-switch">First time here? <a href="/signup">Create the owner account</a></p>
  </form>);
}

export function SignUpPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [done, setDone] = useState(false);
  const shell = (children: ReactNode, heading: ReactNode = <>Create your <em>NEXA</em> account</>, lead = 'One account for the website and the NEXA desktop app.') =>
    <AuthLayout title={done ? 'Check your email' : 'Create account'} eyebrow={done ? 'ALMOST DONE' : 'OWNER ACCOUNT'} heading={heading} lead={lead}>{children}</AuthLayout>;
  if (!supabase) return shell(<NotConfigured />);
  const strong = RULES.every(([, test]) => test(password));
  const problem = confirm && confirm !== password ? 'Passwords do not match.' : '';
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (!strong || problem || !agree) return;
    setBusy(true);
    const { error: failure } = await supabase!.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin + '/account' } });
    setBusy(false);
    if (failure) setError(friendlyAuthError(failure.message)); else setDone(true);
  };
  if (done) return shell(<div className="auth-form"><div className="auth-success"><span aria-hidden="true">✉</span><p>We sent a confirmation link to <strong>{email}</strong>. Open it on this device to finish, then sign in.</p></div>
    <a className="button primary auth-submit" href="/signin">Go to sign in <span aria-hidden="true">→</span></a></div>, 'Confirm your email', 'One more step and NEXA is ready.');
  return shell(<form className="auth-form" onSubmit={submit} noValidate>
    <PrivateNotice />
    <label>Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
    <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="new-password" describedBy="pw-help" />
    {password && <PasswordRules password={password} />}
    <PasswordField label="Confirm password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
    <label className="auth-check"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} /> <span>I agree to the <a href="/terms">Terms</a> and have read the <a href="/privacy">Privacy Policy</a>.</span></label>
    {(problem || error) && <p className="auth-error" role="alert">{problem || error}</p>}
    <button className="button primary auth-submit" disabled={busy || !email || !strong || !confirm || !agree || !!problem}>{busy ? 'Please wait…' : 'Create account'}<span aria-hidden="true">→</span></button>
    <p className="auth-switch">Already have an account? <a href="/signin">Sign in</a></p>
  </form>);
}

const APPS: { name: string; group: string; mark: string; color: string; use: string; live: boolean }[] = [
  { name: 'Gmail', group: 'Google', mark: 'M', color: '#ea6a5a', use: 'Read, summarise and send with approval', live: true },
  { name: 'Google Calendar', group: 'Google', mark: '31', color: '#4f8df5', use: 'Your schedule; changes need approval', live: true },
  { name: 'Google Sheets', group: 'Google', mark: 'S', color: '#34a86b', use: 'The NEXA tracker and other sheets', live: true },
  { name: 'Google Drive', group: 'Google', mark: 'D', color: '#f2b53c', use: 'Find documents and your CV', live: false },
  { name: 'GitHub', group: 'GitHub', mark: 'GH', color: '#b4bccb', use: 'Repos, commits, issues and PRs', live: true },
  { name: 'Outlook', group: 'Microsoft', mark: 'O', color: '#3b8fe0', use: 'Read Outlook mail', live: false },
  { name: 'Excel', group: 'Microsoft', mark: 'X', color: '#2e9e63', use: 'Workbooks in OneDrive', live: false },
  { name: 'OneDrive', group: 'Microsoft', mark: '1D', color: '#4aa3e8', use: 'Find files in OneDrive', live: false },
  { name: 'LinkedIn', group: 'LinkedIn', mark: 'in', color: '#3d8fd1', use: 'Profile and posts you approve', live: false },
];

export function AccountPage() {
  const { session, ready, recovery, setRecovery } = useSession();
  const [opened, setOpened] = useState(false);
  const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (ready && !session && !recovery) window.location.replace('/signin'); }, [ready, session, recovery]);
  if (!supabase) return <PageShell title="Account" narrow><NotConfigured /></PageShell>;
  if (!ready || !session) return <PageShell title="Account" narrow><div className="auth-loading" role="status"><i />Checking your session…</div></PageShell>;
  const email = session.user.email || '';
  const signOut = async (everywhere: boolean) => { await supabase!.auth.signOut({ scope: everywhere ? 'global' : 'local' }); window.location.replace('/'); };
  const openDesktop = () => { setOpened(true); window.location.href = PUBLIC_LINKS.desktopLink; };
  const updatePassword = async (event: FormEvent) => {
    event.preventDefault(); setMessage('');
    if (!RULES.every(([, test]) => test(password))) { setMessage('Use at least 12 characters with upper and lower case, a number and a symbol.'); return; }
    setBusy(true); const { error } = await supabase!.auth.updateUser({ password }); setBusy(false);
    if (error) setMessage(friendlyAuthError(error.message)); else { setMessage('Password updated.'); setPassword(''); setRecovery(false); }
  };
  return <PageShell title="Account">
    <section className="account-hero">
      <div className="account-id">
        <div className="account-avatar"><img src="/avatar/nexa-studio-dashboard.png" alt="" width="291" height="313" /><span className="account-online" aria-hidden="true" /></div>
        <div>
          <p className="eyebrow">SIGNED IN</p>
          <h1>Welcome back</h1>
          <p className="account-email">{email}</p>
          <div className="account-badges"><span>Owner</span><span>Session encrypted</span><span>Approvals on</span></div>
        </div>
      </div>
      <div className="account-actions">
        <button className="button primary auth-submit" onClick={openDesktop}>Open NEXA desktop <span aria-hidden="true">↗</span></button>
        {opened && <p className="auth-info" role="status">If NEXA did not open, install the desktop app first: run <code>npm run desktop:pack</code>, move NEXA to Applications and open it once.</p>}
        <div className="account-signout"><button className="text-link" onClick={() => void signOut(false)}>Sign out</button><span aria-hidden="true">·</span><button className="text-link" onClick={() => void signOut(true)}>Sign out on all devices</button></div>
      </div>
    </section>

    {recovery && <form className="auth-card account-reset" onSubmit={updatePassword}>
      <p className="eyebrow">PASSWORD RESET</p><h2>Choose a new password</h2>
      <PasswordField label="New password" value={password} onChange={setPassword} autoComplete="new-password" describedBy="pw-help" />
      {password && <PasswordRules password={password} />}
      {message && <p className={message === 'Password updated.' ? 'auth-info' : 'auth-error'} role="status">{message}</p>}
      <button className="button primary auth-submit" disabled={busy || !password}>Update password</button>
    </form>}

    <section className="account-apps">
      <div className="account-apps-head">
        <div><p className="eyebrow">NEXT STEP · IN THE DESKTOP APP</p><h2>Connect your work apps</h2></div>
        <p>Each app signs in on its own official page. NEXA never sees your passwords, and you can disconnect any app at any time.</p>
      </div>
      <ol className="account-steps">
        <li><span>1</span>Open NEXA desktop</li>
        <li><span>2</span>Sign in with this account</li>
        <li><span>3</span>Press <strong>Connect</strong> on each app</li>
      </ol>
      <div className="app-grid">{APPS.map(app => <article key={app.name} className="app-tile">
        <span className="app-mark" style={{ background: app.color + '26', color: app.color, borderColor: app.color + '55' }} aria-hidden="true">{app.mark}</span>
        <div className="app-text"><h3>{app.name}</h3><p>{app.use}</p></div>
        <span className={'app-tag' + (app.live ? ' live' : '')}>{app.live ? 'Agent live' : 'Coming next'}</span>
      </article>)}</div>
      <p className="auth-small">Email and calendar changes always need your approval in NEXA first. Read the <a href="/security">security policy</a>.</p>
    </section>
  </PageShell>;
}
