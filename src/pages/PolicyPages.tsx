import type { ReactNode } from 'react';
import { PUBLIC_LINKS } from '../config/publicLinks';
import { PageShell } from './PageShell';

const UPDATED = '26 October 2026';
const mail = PUBLIC_LINKS.contactEmail;

function Policy({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return <PageShell title={title}><article className="policy">
    <p className="eyebrow">LAST UPDATED · {UPDATED.toUpperCase()}</p><h1>{title}</h1><p className="policy-intro">{intro}</p>
    {children}
    <h2>Contact</h2><p>Questions or requests: <a href={'mailto:' + mail}>{mail}</a>.</p>
  </article></PageShell>;
}

export function PrivacyPage() {
  return <Policy title="Privacy Policy" intro="NEXA has two parts: a public website anyone can try, and a private assistant that only its owner can sign in to. This page explains what each part collects and why.">
    <h2>1. The public website</h2>
    <ul>
      <li><strong>No account needed.</strong> The demo works without signing in. There are no advertising or analytics trackers.</li>
      <li><strong>Sample Demo</strong> answers come from fictional text inside your browser. Nothing is sent anywhere.</li>
      <li><strong>Live AI</strong> sends your question and up to three recent exchanges to OpenAI through a Netlify Function, with OpenAI response storage turned off. Do not enter personal or confidential information. Your IP address is used briefly by Netlify to limit requests to five per minute. To limit each visitor to 10 live messages a day, a one-way hash of your IP address and the date is kept with a message count; the IP address itself is not stored.</li>
      <li><strong>Voice</strong> uses your browser’s speech features. Some browsers send audio to their own speech service; NEXA does not receive or store audio.</li>
      <li><strong>Feedback</strong> opens a pre-filled GitHub issue that is public once you submit it.</li>
    </ul>
    <h2>2. Accounts</h2>
    <p>Sign-in is provided by Supabase. It stores your email address, a hashed (never readable) password, sign-in times and security logs. Accounts are limited to the owner. The browser keeps your session so you stay signed in until you sign out.</p>
    <h2>3. The private assistant (owner only)</h2>
    <p>After the owner connects services in the NEXA desktop app, NEXA can read and act on:</p>
    <ul>
      <li><strong>Google:</strong> Gmail messages, Google Calendar events, Google Sheets and Drive files.</li>
      <li><strong>GitHub:</strong> repositories, commits, issues and pull requests.</li>
      <li><strong>Microsoft:</strong> Outlook mail, Excel workbooks and OneDrive files.</li>
      <li><strong>LinkedIn:</strong> basic profile information and posts the owner chooses to share.</li>
    </ul>
    <p>This data is processed by the owner’s n8n Cloud workflows and, to write answers, by OpenAI. It is used only to answer the owner’s requests and to run the owner’s reminders. It is not sold, not used for advertising and not used to train AI models. Connection tokens stay in n8n’s encrypted credential store; the desktop app keeps its own settings encrypted in the macOS Keychain.</p>
    <p>Sending email or changing a calendar needs a preview and the owner’s explicit approval, and every completed action is logged. Workflow run data for actions and reminders is not kept by n8n.</p>
    <h2>4. Google user data</h2>
    <p>NEXA’s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including the Limited Use requirements. Google data is used only to provide the assistant features the owner requests, is not transferred to others except as needed to provide those features (n8n and OpenAI) or by law, and is never read by people except with the owner’s consent, for security, or by law.</p>
    <h2>5. Keeping and deleting data</h2>
    <ul>
      <li>Public chat is cleared when you reset, switch modes or refresh. NEXA keeps no public chat history.</li>
      <li>Daily message counts for Live AI are deleted automatically after the day ends.</li>
      <li>Account data stays until the account is deleted. Email the contact below to delete an account.</li>
      <li>Each connection can be removed at any time from the provider (for example Google Account → Security → Third-party access) or in n8n. Removing it stops all access straight away.</li>
    </ul>
    <h2>6. Changes</h2>
    <p>If this policy changes, the date at the top changes too.</p>
  </Policy>;
}

export function TermsPage() {
  return <Policy title="Terms of Use" intro="By using the NEXA website or creating an account, you agree to these terms.">
    <h2>1. What NEXA is</h2>
    <p>NEXA is an independent portfolio project by Yasmeen Azmat Ali. The public website is a demonstration. The private assistant is for its owner only.</p>
    <h2>2. Fair use</h2>
    <ul>
      <li>Do not try to bypass sign-in, rate limits or other protections.</li>
      <li>Do not use NEXA for anything illegal, harmful or abusive, or to create content that harasses others.</li>
      <li>Do not enter other people’s personal data or confidential information into the public demo.</li>
    </ul>
    <h2>3. AI answers</h2>
    <p>Answers are generated by AI and can be wrong or out of date. Check important information yourself. Interview Practice feedback is coaching, not a hiring assessment.</p>
    <h2>4. Accounts</h2>
    <p>Account creation is restricted to the owner. Keep your password private and use a unique one. We may suspend access that breaks these terms or puts the service at risk.</p>
    <h2>5. Connected services</h2>
    <p>Google, GitHub, Microsoft and LinkedIn have their own terms, which also apply when you connect them. NEXA only acts on those services after your approval.</p>
    <h2>6. No warranty</h2>
    <p>NEXA is provided “as is”, without guarantees that it will always be available or error-free. To the extent the law allows, the author is not liable for losses caused by using it.</p>
    <h2>7. Changes</h2>
    <p>These terms may be updated. Continuing to use NEXA after a change means you accept the new terms.</p>
  </Policy>;
}

export function SecurityPage() {
  return <Policy title="Security Policy" intro="How NEXA protects accounts and connected data, what is not protected yet, and how to report a problem.">
    <h2>1. Accounts</h2>
    <ul>
      <li>Passwords must be at least 12 characters and are stored only as hashes by Supabase.</li>
      <li>New accounts are blocked inside the database unless they belong to the owner, so the sign-up page cannot be used to get in.</li>
      <li>Password reset messages look the same whether or not an email has an account.</li>
      <li>“Sign out on all devices” ends every active session.</li>
    </ul>
    <h2>2. Website</h2>
    <ul>
      <li>HTTPS only, with strict security headers: a content security policy, no framing by other sites, and microphone access limited to this site.</li>
      <li>The OpenAI key stays on the server. Requests are validated, size-limited and limited to five per minute and 10 per day per visitor, with a daily cap for the whole site and an enforced monthly spend limit at OpenAI.</li>
      <li>The public website has no route to the private workflows or connected accounts.</li>
    </ul>
    <h2>3. Desktop app and workflows</h2>
    <ul>
      <li>The app talks only to the owner’s n8n Cloud over HTTPS with authentication, and refuses redirects.</li>
      <li>Settings and sessions are encrypted with the macOS Keychain. The app window is sandboxed and cannot read files or saved secrets.</li>
      <li>Connections use each provider’s official sign-in (OAuth), or for GitHub a fine-grained access token. Tokens are held encrypted by n8n, not in the app or this website.</li>
      <li><strong>Write actions need approval.</strong> Email and calendar changes show a preview first, expire after 15 minutes, run at most once and are logged.</li>
    </ul>
    <h2>4. Known limits</h2>
    <ul>
      <li>Two-factor sign-in is not enabled yet.</li>
      <li>The desktop app is not code-signed for distribution; it is built and run on the owner’s Mac.</li>
      <li>AI answers can be wrong. Approvals exist so nothing is sent or changed without a human check.</li>
    </ul>
    <h2>5. Reporting a vulnerability</h2>
    <p>Please email <a href={'mailto:' + mail}>{mail}</a> with steps to reproduce. Do not open a public issue for security problems, do not access data that is not yours, and give reasonable time for a fix before sharing details. Reports are acknowledged within 7 days.</p>
  </Policy>;
}
