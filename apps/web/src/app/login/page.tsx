'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '../../lib/supabase-browser';

export default function LoginPage() {
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
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });

    setLoading(false);
    setMessage(error ? error.message : 'Check your email for your secure sign-in link.');
  }

  return (
    <main className="auth-page">
      <div className="auth-card card">
        <Link className="brand" href="/">RecruitMerge</Link>
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in to your candidate list</h1>
        <p className="muted">No password needed. We’ll email you a secure sign-in link.</p>
        <form onSubmit={signIn}>
          <label htmlFor="email">Work email</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
          <button className="button primary full" disabled={loading}>{loading ? 'Sending…' : 'Email me a sign-in link'}</button>
        </form>
        {message && <p className="form-message" role="status">{message}</p>}
      </div>
    </main>
  );
}
