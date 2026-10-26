import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Small path router: the landing page stays at "/", the new pages live on their own paths and
// load on demand, so the landing page does not download the sign-in code.
// Netlify serves index.html for every path (public/_redirects).
const auth = () => import('./pages/AuthPages');
const policy = () => import('./pages/PolicyPages');
const routes: Record<string, React.LazyExoticComponent<() => JSX.Element>> = {
  '/signin': lazy(() => auth().then(m => ({ default: m.SignInPage }))),
  '/signup': lazy(() => auth().then(m => ({ default: m.SignUpPage }))),
  '/account': lazy(() => auth().then(m => ({ default: m.AccountPage }))),
  '/privacy': lazy(() => policy().then(m => ({ default: m.PrivacyPage }))),
  '/terms': lazy(() => policy().then(m => ({ default: m.TermsPage }))),
  '/security': lazy(() => policy().then(m => ({ default: m.SecurityPage }))),
};
const Page = routes[window.location.pathname.replace(/\/+$/, '') || '/'];
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{Page ? <Suspense fallback={null}><Page /></Suspense> : <App />}</React.StrictMode>,
);
