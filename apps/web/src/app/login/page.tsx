'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../lib/supabase-browser';
import { Brand } from '../components/brand';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${searchParams.get('next') || '/dashboard'}` },
    });

    setLoading(false);
    setMessage(error ? error.message : 'Check your email for your secure sign-in link.');
  }

  return (
    <main className="auth-page">
      <div className="auth-ambient auth-ambient-one" /><div className="auth-ambient auth-ambient-two" />
      <div className="auth-card">
        <Brand />
        <div className="auth-icon" aria-hidden="true">↗</div>
        <p className="eyebrow">Welcome back</p>
        <h1>Return to your candidate workspace.</h1>
        <p className="muted">Enter your email and we’ll send a secure sign-in link. No password to remember.</p>
        <form onSubmit={signIn}>
          <label htmlFor="email">Work email</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
          <button className="button primary full" disabled={loading}>{loading ? 'Sending your link…' : <>Continue with email <span aria-hidden="true">→</span></>}</button>
        </form>
        {message && <p className="form-message" role="status">{message}</p>}
        <p className="auth-footnote">Secure, passwordless access powered by Supabase.</p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="auth-page"><p className="muted">Loading sign in…</p></main>}><LoginForm /></Suspense>;
}
