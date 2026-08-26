'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '../../lib/supabase-browser';
import { Brand } from '../components/brand';

type Candidate = {
  id: string; name: string; title: string | null; company: string | null;
  location: string | null; linkedin_url: string; job: string | null;
  notes: string | null; created_at: string;
};

const supabase = createSupabaseBrowserClient();
const candidateColumns = 'id,name,title,company,location,linkedin_url,job,notes,created_at';

function normalizeLinkedInUrl(value: string) {
  try {
    const url = new URL(value.trim());
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return value.trim().split(/[?#]/)[0].replace(/\/$/, '');
  }
}

function csvCell(value: string | null) {
  let safe = value ?? '';
  if (/^[=+\-@\t\r]/.test(safe)) safe = `'${safe}`;
  return `"${safe.replace(/"/g, '""')}"`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [jobFilter, setJobFilter] = useState('all');

  const loadCandidates = useCallback(async () => {
    const { data, error } = await supabase.from('candidates').select(candidateColumns).order('created_at', { ascending: false });
    if (error) setMessage(error.hint || error.message);
    else setCandidates(data ?? []);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      if (!data.user) { router.replace('/login'); return; }
      setUser(data.user);
      await loadCandidates();
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [loadCandidates, router]);

  const jobs = useMemo(() => Array.from(new Set(candidates.map((candidate) => candidate.job).filter((job): job is string => Boolean(job)))).sort(), [candidates]);
  const visibleCandidates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return candidates.filter((candidate) => {
      const matchesJob = jobFilter === 'all' || (jobFilter === 'unassigned' ? !candidate.job : candidate.job === jobFilter);
      if (!matchesJob) return false;
      if (!needle) return true;
      return [candidate.name, candidate.title, candidate.company, candidate.location, candidate.job, candidate.notes]
        .some((value) => value?.toLowerCase().includes(needle));
    });
  }, [candidates, jobFilter, query]);

  async function addCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setMessage('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const linkedinUrl = normalizeLinkedInUrl(String(form.get('linkedinUrl')));
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
      setMessage(error.code === '23505' ? 'Already saved — each LinkedIn profile can appear only once in your list.' : error.hint || error.message);
      return;
    }
    formElement.reset();
    setMessage('Candidate saved.');
    await loadCandidates();
  }

  async function removeCandidate(id: string) {
    if (!window.confirm('Remove this candidate from your sourcing list?')) return;
    const { error } = await supabase.from('candidates').delete().eq('id', id);
    if (error) setMessage(error.hint || error.message);
    else setCandidates((items) => items.filter((item) => item.id !== id));
  }

  function exportCsv() {
    const header = ['Name', 'Title', 'Company', 'Location', 'LinkedIn URL', 'Job or pipeline', 'Notes', 'Date added'];
    const rows = visibleCandidates.map((candidate) => [
      candidate.name, candidate.title, candidate.company, candidate.location, candidate.linkedin_url,
      candidate.job, candidate.notes, new Date(candidate.created_at).toISOString(),
    ]);
    const csv = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
    const href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `recruitmerge-candidates-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(href);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  if (loading) return <main className="dashboard-page"><p className="muted">Loading your workspace…</p></main>;

  return (
    <main className="dashboard-page">
      <nav className="dashboard-nav">
        <Brand />
        <div className="dashboard-account"><span className="account-avatar">{user?.email?.slice(0, 1).toUpperCase()}</span><span className="muted user-email">{user?.email}</span><button className="link-button" onClick={signOut}>Sign out</button></div>
      </nav>
      <section className="dashboard-header"><div><p className="eyebrow"><span className="eyebrow-dot" />Candidate workspace</p><h1>Your sourcing list</h1><p className="muted">A focused view of everyone worth another conversation.</p></div><div className="count-card"><strong>{candidates.length}</strong><span>{candidates.length === 1 ? 'candidate' : 'candidates'} saved</span></div></section>
      <div className="dashboard-grid">
        <form className="card candidate-form" onSubmit={addCandidate}>
          <div className="form-heading"><span className="form-icon">＋</span><div><h2>Add candidate</h2><p>Save someone manually</p></div></div>
          <label>Name<input name="name" required /></label>
          <label>LinkedIn URL<input name="linkedinUrl" type="url" placeholder="https://www.linkedin.com/in/…" required /></label>
          <div className="form-row"><label>Title<input name="title" /></label><label>Company<input name="company" /></label></div>
          <label>Job or pipeline<input name="job" /></label>
          <label>Notes<textarea name="notes" rows={3} /></label>
          <button className="button primary full">Save candidate <span aria-hidden="true">→</span></button>
          {message && <p className="form-message" role="status">{message}</p>}
        </form>
        <section className="candidate-workspace">
          <div className="candidate-tools">
            <label className="search-field"><span className="sr-only">Search candidates</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, company, job, or notes" /></label>
            <label className="filter-field"><span className="sr-only">Filter by job or pipeline</span><select value={jobFilter} onChange={(event) => setJobFilter(event.target.value)}><option value="all">All pipelines</option><option value="unassigned">Unassigned</option>{jobs.map((job) => <option key={job} value={job}>{job}</option>)}</select></label>
            <button className="button export-button" disabled={visibleCandidates.length === 0} onClick={exportCsv}><span aria-hidden="true">↓</span> Export CSV</button>
          </div>
          <p className="result-count muted">Showing {visibleCandidates.length} of {candidates.length}</p>
          <div className="candidate-list">
            {candidates.length === 0 ? <div className="card empty"><h2>No candidates yet</h2><p className="muted">Add your first candidate to confirm your workspace is ready.</p></div> : visibleCandidates.length === 0 ? <div className="card empty"><h2>No matches</h2><p className="muted">Try a different search or pipeline filter.</p></div> : visibleCandidates.map((candidate) => (
              <article className="card candidate-row" key={candidate.id}>
                <div className="candidate-avatar" aria-hidden="true">{candidate.name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div><div className="candidate-main"><div className="candidate-name-row"><h3>{candidate.name}</h3><span className="pipeline-chip">{candidate.job || 'Unassigned'}</span></div><p>{[candidate.title, candidate.company].filter(Boolean).join(' · ') || 'No title added'}</p><small>Added {new Date(candidate.created_at).toLocaleDateString()}</small>{candidate.notes && <p className="candidate-notes">{candidate.notes}</p>}</div>
                <div className="row-actions"><a href={candidate.linkedin_url} target="_blank" rel="noreferrer">Profile</a><button onClick={() => removeCandidate(candidate.id)}>Remove</button></div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
