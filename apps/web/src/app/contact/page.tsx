'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Brand } from '../components/brand';

export default function ContactPage() {
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setStatus('');
    const form = event.currentTarget;
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const result = await response.json();
    setSending(false);
    setStatus(response.ok ? 'Message sent. We’ll get back to you soon.' : result.error || 'Unable to send your message right now.');
    if (response.ok) form.reset();
  }

  return <main className="contact-page">
    <div className="contact-shell">
      <nav className="nav"><Brand /><div className="nav-actions"><Link href="/">Home</Link><Link href="/support">Support</Link><Link className="button button-small secondary" href="/login">Sign in</Link></div></nav>
      <section className="contact-layout">
        <div className="contact-copy">
          <p className="eyebrow light">Contact RecruitMerge</p>
          <h1>How can we help?</h1>
          <p>Questions about your account, billing, or candidate workflow? Send us a note.</p>
          <a className="contact-email" href="mailto:support@recruitmerge.com">support@recruitmerge.com <span aria-hidden="true">↗</span></a>
        </div>
        <form className="contact-form" onSubmit={submit}>
          <div className="form-row"><label>Name<input name="name" autoComplete="name" maxLength={100} required /></label><label>Email<input name="email" type="email" autoComplete="email" maxLength={200} required /></label></div>
          <label>Subject<input name="subject" maxLength={160} required /></label>
          <label>Message<textarea name="message" rows={7} maxLength={4000} required /></label>
          <label className="contact-honeypot" aria-hidden="true">Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
          <button className="button primary full" disabled={sending}>{sending ? 'Sending…' : 'Send message'} <span aria-hidden="true">→</span></button>
          <p className="form-message" role="status">{status}</p>
        </form>
      </section>
    </div>
  </main>;
}
