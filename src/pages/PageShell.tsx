import { useEffect, type ReactNode } from 'react';
import { PUBLIC_LINKS } from '../config/publicLinks';

/** Shared frame for the sign-in, account and policy pages. Keeps the main site's look. */
export function PageShell({ title, children, narrow = false }: { title: string; children: ReactNode; narrow?: boolean }) {
  useEffect(() => { document.title = title + ' · NEXA'; window.scrollTo(0, 0); }, [title]);
  return <>
    <a className="skip" href="#page">Skip to content</a>
    <header className="nav">
      <a className="brand" href="/" aria-label="NEXA home"><span>✦</span> NEXA</a>
      <nav className="page-nav"><a href="/#demo">Try NEXA</a><a href="/signin">Sign in</a></nav>
    </header>
    <main id="page" className={'page' + (narrow ? ' page-narrow' : '')}>{children}</main>
    <PageFooter />
  </>;
}

export function PageFooter() {
  return <footer className="page-footer">
    <a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/security">Security</a>
    <a href={PUBLIC_LINKS.repository ?? PUBLIC_LINKS.githubProfile}>Source</a>
    <span>© {new Date().getFullYear()} NEXA · Yasmeen Azmat Ali</span>
  </footer>;
}
