'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '../../lib/supabase-browser';
import { Brand } from '../components/brand';

type Candidate = {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  location: string | null;
  linkedin_url: string;
  job: string | null;
  notes: string | null;
  created_at: string;
};

type CandidateDraft = {
  name: string;
  title: string;
  company: string;
  location: string;
  linkedinUrl: string;
  job: string;
  notes: string;
};

type BillingAccount = {
  subscription_status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
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

function pipelineKey(value: string | null) {
  return value?.trim().toLocaleLowerCase() || 'unassigned';
}

function csvCell(value: string | null) {
  let safe = value ?? '';
  if (/^[=+\-@\t\r]/.test(safe)) safe = `'${safe}`;
  return `"${safe.replace(/"/g, '""')}"`;
}

function candidateToDraft(candidate: Candidate): CandidateDraft {
  return {
    name: candidate.name,
    title: candidate.title ?? '',
    company: candidate.company ?? '',
    location: candidate.location ?? '',
    linkedinUrl: candidate.linkedin_url,
    job: candidate.job ?? '',
    notes: candidate.notes ?? '',
  };
}

function PipelineCombobox({ id, name, value, options, placeholder, onChange }: {
  id: string;
  name?: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const needle = value.trim().toLocaleLowerCase();
  const matchingOptions = needle
    ? options.filter((option) => option.toLocaleLowerCase().includes(needle))
    : options;

  return <div className="pipeline-combobox" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <div className="pipeline-input-wrap">
      <input
        id={id}
        name={name}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={`${id}-options`}
        aria-expanded={open}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(event) => { onChange(event.target.value); setOpen(true); }}
        onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }}
      />
      <button type="button" className="pipeline-toggle" aria-label="Show saved pipelines" aria-expanded={open} onClick={() => setOpen((current) => !current)}><span aria-hidden="true">⌄</span></button>
    </div>
    {open ? <div className="pipeline-menu" id={`${id}-options`} role="listbox">
      <div className="pipeline-menu-label">Saved pipelines</div>
      {matchingOptions.length ? matchingOptions.map((option) => <button type="button" role="option" aria-selected={option === value} key={option} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(option); setOpen(false); }}><span>{option}</span>{option === value ? <i aria-hidden="true">✓</i> : null}</button>) : <p>No matching pipeline. Keep typing to create “{value.trim()}”.</p>}
    </div> : null}
  </div>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [newPipeline, setNewPipeline] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CandidateDraft | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingAccount | null>(null);
  const [billingBusy, setBillingBusy] = useState(false);

  const loadCandidates = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('candidates')
      .select(candidateColumns)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) setMessage(error.hint || error.message);
    else setCandidates(data ?? []);
  }, []);

  const loadBilling = useCallback(async (userId: string) => {
    const { data } = await supabase.from('billing_accounts').select('subscription_status,current_period_end,cancel_at_period_end').eq('user_id', userId).maybeSingle();
    setBilling(data);
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
      await Promise.all([loadCandidates(data.user.id), loadBilling(data.user.id)]);
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [loadBilling, loadCandidates, router]);

  const isPro = billing?.subscription_status === 'active' || billing?.subscription_status === 'trialing';

  async function openBilling(destination: 'checkout' | 'portal') {
    setBillingBusy(true);
    setMessage('');
    const { data } = await supabase.auth.getSession();
    const response = await fetch(`/api/stripe/${destination}`, {
      method: 'POST',
      headers: data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {},
    });
    const result = await response.json();
    setBillingBusy(false);
    if (!response.ok || !result.url) {
      setMessage(result.error || 'Billing is temporarily unavailable.');
      return;
    }
    window.location.assign(result.url);
  }

  const pipelines = useMemo(() => {
    const groups = new Map<string, { label: string; count: number }>();
    for (const candidate of candidates) {
      const key = pipelineKey(candidate.job);
      const existing = groups.get(key);
      if (existing) existing.count += 1;
      else groups.set(key, { label: candidate.job?.trim() || 'Unassigned', count: 1 });
    }
    return Array.from(groups, ([key, value]) => ({ key, ...value }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [candidates]);
  const pipelineLabels = useMemo(() => pipelines.filter((pipeline) => pipeline.key !== 'unassigned').map((pipeline) => pipeline.label), [pipelines]);

  const visibleCandidates = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return candidates.filter((candidate) => {
      if (pipelineFilter !== 'all' && pipelineKey(candidate.job) !== pipelineFilter) return false;
      if (!needle) return true;
      return [candidate.name, candidate.title, candidate.company, candidate.location, candidate.job, candidate.notes]
        .some((value) => value?.toLocaleLowerCase().includes(needle));
    });
  }, [candidates, pipelineFilter, query]);

  async function addCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setMessage('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const linkedinUrl = normalizeLinkedInUrl(String(form.get('linkedinUrl')));
    const { error } = await supabase.from('candidates').insert({
      user_id: user.id,
      name: String(form.get('name')).trim(),
      title: String(form.get('title')).trim() || null,
      company: String(form.get('company')).trim() || null,
      linkedin_url: linkedinUrl,
      job: String(form.get('job')).trim() || null,
      notes: String(form.get('notes')).trim() || null,
    });
    if (error) {
      setMessage(error.code === '23505' ? 'Already saved — each LinkedIn profile can appear only once in your list.' : error.hint || error.message);
      return;
    }
    formElement.reset();
    setNewPipeline('');
    setMessage('Candidate saved.');
    await loadCandidates(user.id);
  }

  function startEditing(candidate: Candidate) {
    setEditingId(candidate.id);
    setDraft(candidateToDraft(candidate));
    setMessage('');
  }

  function cancelEditing() {
    setEditingId(null);
    setDraft(null);
  }

  function updateDraft(field: keyof CandidateDraft, value: string) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
  }

  async function saveCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !editingId || !draft) return;
    const name = draft.name.trim();
    const linkedinUrl = normalizeLinkedInUrl(draft.linkedinUrl);
    if (!name || !linkedinUrl) {
      setMessage('Name and LinkedIn URL are required.');
      return;
    }
    setSavingId(editingId);
    setMessage('');
    const { data, error } = await supabase
      .from('candidates')
      .update({
        name,
        title: draft.title.trim() || null,
        company: draft.company.trim() || null,
        location: draft.location.trim() || null,
        linkedin_url: linkedinUrl,
        job: draft.job.trim() || null,
        notes: draft.notes.trim() || null,
      })
      .eq('id', editingId)
      .eq('user_id', user.id)
      .select(candidateColumns)
      .single();

    setSavingId(null);
    if (error) {
      setMessage(error.code === '23505' ? 'That LinkedIn profile is already saved in your workspace.' : error.hint || error.message);
      return;
    }
    setCandidates((items) => items.map((item) => item.id === data.id ? data : item));
    cancelEditing();
    setMessage(`${data.name} updated.`);
  }

  async function removeCandidate(id: string) {
    if (!user || !window.confirm('Remove this candidate from your sourcing list?')) return;
    const { error } = await supabase.from('candidates').delete().eq('id', id).eq('user_id', user.id);
    if (error) setMessage(error.hint || error.message);
    else {
      setCandidates((items) => items.filter((item) => item.id !== id));
      if (editingId === id) cancelEditing();
    }
  }

  function exportCsv() {
    const header = ['Name', 'Title', 'Company', 'Location', 'LinkedIn URL', 'Job or pipeline', 'Notes', 'Date added'];
    const rows = visibleCandidates.map((candidate) => [
      candidate.name,
      candidate.title,
      candidate.company,
      candidate.location,
      candidate.linkedin_url,
      candidate.job,
      candidate.notes,
      new Date(candidate.created_at).toISOString(),
    ]);
    const csv = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
    const href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `recruitmerge-candidates-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 0);
    setMessage(`Exported ${visibleCandidates.length} ${visibleCandidates.length === 1 ? 'candidate' : 'candidates'}.`);
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
        <div className="dashboard-account"><span className={`plan-pill ${isPro ? 'pro' : ''}`}>{isPro ? 'Pro' : 'Free'}</span><span className="account-avatar">{user?.email?.slice(0, 1).toUpperCase()}</span><span className="muted user-email">{user?.email}</span><button className="link-button" onClick={signOut}>Sign out</button></div>
      </nav>
      <section className="dashboard-header"><div><p className="eyebrow"><span className="eyebrow-dot" />Candidate workspace</p><h1>Your sourcing list</h1><p className="muted">A focused view of everyone worth another conversation.</p></div><div className="dashboard-summary"><div className="count-card"><strong>{candidates.length}</strong><span>{candidates.length === 1 ? 'candidate' : 'candidates'} saved</span></div><button className={`button billing-button ${isPro ? 'secondary' : 'primary'}`} disabled={billingBusy} onClick={() => openBilling(isPro ? 'portal' : 'checkout')}>{billingBusy ? 'Opening…' : isPro ? 'Manage plan' : 'Upgrade to Pro'}</button></div></section>
      <div className="dashboard-grid">
        <form className="card candidate-form" onSubmit={addCandidate}>
          <div className="form-heading"><span className="form-icon">＋</span><div><h2>Add candidate</h2><p>Save someone manually</p></div></div>
          <label>Name<input name="name" required /></label>
          <label>LinkedIn URL<input name="linkedinUrl" type="url" placeholder="https://www.linkedin.com/in/…" required /></label>
          <div className="form-row"><label>Title<input name="title" /></label><label>Company<input name="company" /></label></div>
          <label htmlFor="new-candidate-pipeline">Job / Pipeline</label><PipelineCombobox id="new-candidate-pipeline" name="job" value={newPipeline} options={pipelineLabels} placeholder="Choose a pipeline or type a new one" onChange={setNewPipeline} /><small className="field-hint">Select a previous pipeline or enter a new name.</small>
          <label>Notes<textarea name="notes" rows={3} /></label>
          <button className="button primary full">Save candidate <span aria-hidden="true">→</span></button>
          {message ? <p className="form-message" role="status">{message}</p> : null}
        </form>
        <section className="candidate-workspace">
          <div className="candidate-tools">
            <label className="search-field"><span className="sr-only">Search candidates</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, company, job, or notes" /></label>
            <label className="filter-field"><span className="sr-only">Filter by job or pipeline</span><select value={pipelineFilter} onChange={(event) => setPipelineFilter(event.target.value)}><option value="all">All pipelines ({candidates.length})</option>{pipelines.map((pipeline) => <option key={pipeline.key} value={pipeline.key}>{pipeline.label} ({pipeline.count})</option>)}</select></label>
            <button className="button export-button" disabled={visibleCandidates.length === 0} onClick={exportCsv}><span aria-hidden="true">↓</span> Export {visibleCandidates.length || ''} CSV</button>
          </div>
          <div className="result-summary"><p className="result-count muted">Showing {visibleCandidates.length} of {candidates.length}</p>{pipelineFilter !== 'all' || query ? <button className="clear-filters" onClick={() => { setQuery(''); setPipelineFilter('all'); }}>Clear filters</button> : null}</div>
          <div className="candidate-list">
            {candidates.length === 0 ? <div className="card empty"><h2>No candidates yet</h2><p className="muted">Add your first candidate to confirm your workspace is ready.</p></div> : visibleCandidates.length === 0 ? <div className="card empty"><h2>No matches</h2><p className="muted">Try a different search or pipeline filter.</p></div> : visibleCandidates.map((candidate) => editingId === candidate.id && draft ? (
              <form className="card candidate-edit" key={candidate.id} onSubmit={saveCandidate}>
                <div className="edit-heading"><div><p className="eyebrow">Editing candidate</p><h3>{candidate.name}</h3></div><button type="button" className="close-edit" onClick={cancelEditing} aria-label="Cancel editing">×</button></div>
                <div className="edit-grid"><label>Name<input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} required /></label><label>LinkedIn URL<input type="url" value={draft.linkedinUrl} onChange={(event) => updateDraft('linkedinUrl', event.target.value)} required /></label><label>Title<input value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} /></label><label>Company<input value={draft.company} onChange={(event) => updateDraft('company', event.target.value)} /></label><label>Location<input value={draft.location} onChange={(event) => updateDraft('location', event.target.value)} /></label><div><label htmlFor={`edit-pipeline-${candidate.id}`}>Job / Pipeline</label><PipelineCombobox id={`edit-pipeline-${candidate.id}`} value={draft.job} options={pipelineLabels} placeholder="Choose or create a pipeline" onChange={(value) => updateDraft('job', value)} /></div><label className="edit-notes">Notes<textarea rows={3} value={draft.notes} onChange={(event) => updateDraft('notes', event.target.value)} /></label></div>
                <div className="edit-actions"><button type="button" className="button secondary" onClick={cancelEditing}>Cancel</button><button className="button primary" disabled={savingId === candidate.id}>{savingId === candidate.id ? 'Saving…' : 'Save changes'} <span aria-hidden="true">→</span></button></div>
              </form>
            ) : (
              <article className="card candidate-row" key={candidate.id}>
                <div className="candidate-avatar" aria-hidden="true">{candidate.name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div><div className="candidate-main"><div className="candidate-name-row"><h3>{candidate.name}</h3><span className="pipeline-chip">{candidate.job || 'Unassigned'}</span></div><p>{[candidate.title, candidate.company].filter(Boolean).join(' · ') || 'No title added'}</p><small>{candidate.location ? `${candidate.location} · ` : ''}Added {new Date(candidate.created_at).toLocaleDateString()}</small>{candidate.notes ? <p className="candidate-notes">{candidate.notes}</p> : null}</div>
                <div className="row-actions"><a href={candidate.linkedin_url} target="_blank" rel="noreferrer">Profile</a><button onClick={() => startEditing(candidate)}>Edit</button><button onClick={() => removeCandidate(candidate.id)}>Remove</button></div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
