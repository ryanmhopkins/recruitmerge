import Link from 'next/link';
import { Brand } from './components/brand';

const features = [
  { number: '01', title: 'Capture without context switching', copy: 'Open the extension on any LinkedIn profile and save a clean candidate record in seconds.' },
  { number: '02', title: 'Keep every list calm and clean', copy: 'RecruitMerge normalizes URLs, catches duplicates, and keeps notes attached to the right person.' },
  { number: '03', title: 'Move your data when you need it', copy: 'Search and filter your workspace, then export a spreadsheet-ready CSV in one click.' },
];

export default function Home() {
  return <main className="marketing-page">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <div className="shell">
      <nav className="nav"><Brand /><div className="nav-actions"><a href="#workflow">How it works</a><Link className="button button-small secondary" href="/login">Sign in</Link></div></nav>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" />A calmer recruiting workflow</div>
          <h1>Turn LinkedIn profiles into an organized candidate pipeline.</h1>
          <p>RecruitMerge quietly captures the details, removes duplicates, and keeps your sourcing work ready for the next step.</p>
          <div className="actions"><Link className="button primary" href="/login">Start your workspace <span aria-hidden="true">→</span></Link><a className="text-link" href="#workflow">Explore the workflow</a></div>
          <div className="trust-row"><span><i>✓</i> Passwordless sign-in</span><span><i>✓</i> Private by default</span><span><i>✓</i> CSV-ready</span></div>
        </div>
        <div className="product-preview" aria-label="RecruitMerge candidate capture preview">
          <div className="preview-glow" />
          <div className="preview-window">
            <div className="preview-bar"><div className="preview-brand"><span className="brand-mark mini" aria-hidden="true"><i /><i /></span>RecruitMerge</div><span className="status-chip"><i /> Cloud connected</span></div>
            <div className="detected-label"><span>Profile detected</span><span>linkedin.com/in/jane-smith</span></div>
            <div className="profile-summary"><div className="avatar">JS</div><div><h3>Jane Smith</h3><p>Senior Product Designer</p><small>Acme Studio · Orlando, FL</small></div></div>
            <div className="preview-field"><span>Pipeline</span><div>Senior Designer Search</div></div>
            <div className="preview-field"><span>Sourcing note</span><div>Strong B2B systems experience and a thoughtful portfolio.</div></div>
            <div className="preview-save"><span>Save to workspace</span><span aria-hidden="true">↗</span></div>
          </div>
          <div className="floating-note"><span className="floating-icon">✓</span><div><strong>Candidate saved</strong><small>No duplicate found</small></div></div>
        </div>
      </section>
      <section id="workflow" className="workflow-section">
        <div className="section-heading"><div><p className="eyebrow">Designed for focus</p><h2>Less admin. More thoughtful sourcing.</h2></div><p>One lightweight workflow from discovery to an organized shortlist.</p></div>
        <div className="feature-grid">{features.map((feature) => <article className="feature-card" key={feature.number}><span>{feature.number}</span><h3>{feature.title}</h3><p>{feature.copy}</p></article>)}</div>
      </section>
      <section className="beta-banner"><div><p className="eyebrow light">Private beta</p><h2>Build your first calm candidate list.</h2><p>Start free while RecruitMerge is in private beta.</p></div><Link className="button light-button" href="/login">Open RecruitMerge <span aria-hidden="true">→</span></Link></section>
      <footer><Brand /><span>Purpose-built for focused recruiting.</span></footer>
    </div>
  </main>;
}
