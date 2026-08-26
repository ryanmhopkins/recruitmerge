'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '../../lib/supabase-browser';

type Candidate = {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  linkedin_url: string;
  job: string | null;
  notes: string | null;
  created_at: string;
};

const supabase = createSupabaseBrowserClient();

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadCandidates = useCallback(async () => {
    const { data, error } = await supabase.from('candidates').select('id,name,title,company,linkedin_url,job,notes,created_at').order('created_at', { ascending: false });
    if (error) setMessage(error.message);
    else setCandidates(data ?? []);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      if (!data.user) {
        router.replace('/login');
        return;
      }
      setUser(data.user);
      await loadCandidates();
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [loadCandidates, router]);

  async function addCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setMessage('');
    const form = new FormData(event.currentTarget);
    const linkedinUrl = String(form.get('linkedinUrl')).split('?')[0].replace(/\/$/, '');
    const { error } = await supabase.from('candidates').insert({
      user_id: user.id,
      name: form.get('name'),
      title: form.get('title') || null,
      company: form.get('company') || null,
      linkedin_url: linkedinUrl,
      job: form.get('job') || null,
      notes: form.get('notes') || null,
    });
    if (error) {
      setMessage(error.code === '23505' ? 'That LinkedIn profile is already in your list.' : error.message);
      return;
    }
    event.currentTarget.reset();
    setMessage('Candidate saved.');
    await loadCandidates();
  }

  async function removeCandidate(id: string) {
    const { error } = await supabase.from('candidates').delete().eq('id', id);
    if (error) setMessage(error.message);
    else setCandidates((items) => items.filter((item) => item.id !== id));
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  if (loading) return <main className="dashboard-page"><p className="muted">Loading your workspace…</p></main>;

  return (
    <main className="dashboard-page">
      <nav className="dashboard-nav">
        <Link className="brand" href="/">RecruitMerge</Link>
        <div><span className="muted user-email">{user?.email}</span><button className="link-button" onClick={signOut}>Sign out</button></div>
      </nav>
      <section className="dashboard-header"><div><p className="eyebrow">Candidate workspace</p><h1>Your sourcing list</h1><p className="muted">Add a candidate here or capture one with the extension.</p></div><div className="count-card"><strong>{candidates.length}</strong><span>candidates</span></div></section>
      <div className="dashboard-grid">
        <form className="card candidate-form" onSubmit={addCandidate}>
          <h2>Add candidate</h2>
          <label>Name<input name="name" required /></label>
          <label>LinkedIn URL<input name="linkedinUrl" type="url" placeholder="https://www.linkedin.com/in/…" required /></label>
          <div className="form-row"><label>Title<input name="title" /></label><label>Company<input name="company" /></label></div>
          <label>Job or pipeline<input name="job" /></label>
          <label>Notes<textarea name="notes" rows={3} /></label>
          <button className="button primary full">Save candidate</button>
          {message && <p className="form-message" role="status">{message}</p>}
        </form>
        <section className="candidate-list">
          {candidates.length === 0 ? <div className="card empty"><h2>No candidates yet</h2><p className="muted">Add your first candidate to confirm your workspace is ready.</p></div> : candidates.map((candidate) => (
            <article className="card candidate-row" key={candidate.id}>
              <div><h3>{candidate.name}</h3><p>{[candidate.title, candidate.company].filter(Boolean).join(' · ') || 'No title added'}</p><small>{candidate.job || 'Unassigned'} · {new Date(candidate.created_at).toLocaleDateString()}</small></div>
              <div className="row-actions"><a href={candidate.linkedin_url} target="_blank" rel="noreferrer">Profile</a><button onClick={() => removeCandidate(candidate.id)}>Remove</button></div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
