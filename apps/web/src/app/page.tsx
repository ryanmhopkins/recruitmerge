import Link from 'next/link';
import { Brand } from './components/brand';

const features = [
  { number: '01', title: 'Save from LinkedIn', copy: 'Capture key profile details in one click.' },
  { number: '02', title: 'Stay organized', copy: 'Prevent duplicates and keep notes with the right candidate.' },
  { number: '03', title: 'Keep control', copy: 'Filter pipelines and export your list to CSV.' },
];

export default function Home() {
  return <main className="marketing-page">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <div className="shell">
      <nav className="nav"><Brand /><div className="nav-actions"><a href="#workflow">How it works</a><a href="#pricing">Pricing</a><Link className="button button-small secondary" href="/login">Sign in</Link></div></nav>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" />Calmer candidate sourcing</div>
          <h1>Save LinkedIn candidates without the spreadsheet busywork.</h1>
          <p>Capture profiles, prevent duplicates, and keep every search organized.</p>
          <div className="actions"><Link className="button primary" href="/login">Start free <span aria-hidden="true">→</span></Link><a className="text-link" href="#workflow">See how it works</a></div>
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
        <div className="section-heading"><div><p className="eyebrow">How it works</p><h2>From profile to pipeline in seconds.</h2></div><p>Capture, organize, and export—without breaking your flow.</p></div>
        <div className="feature-grid">{features.map((feature) => <article className="feature-card" key={feature.number}><span>{feature.number}</span><h3>{feature.title}</h3><p>{feature.copy}</p></article>)}</div>
      </section>
      <section id="pricing" className="pricing-section">
        <div className="section-heading"><div><p className="eyebrow">Simple pricing</p><h2>Start free. Go unlimited with Pro.</h2></div><p>No setup fee. Cancel anytime.</p></div>
        <div className="pricing-grid">
          <article className="price-card"><p className="eyebrow">Free</p><div className="price"><strong>$0</strong><span>forever</span></div><h3>For occasional sourcing.</h3><ul><li><strong>5 candidate saves per month</strong></li><li>Duplicate protection</li><li>Pipelines, search, and CSV export</li></ul><Link className="button secondary full" href="/login">Start free</Link></article>
          <article className="price-card price-card-pro"><span className="recommended">Best value</span><p className="eyebrow light">RecruitMerge Pro</p><div className="price"><strong>$15</strong><span>/ month</span></div><h3>For active sourcing.</h3><ul><li>Everything in Free</li><li className="pricing-highlight"><strong>Unlimited candidates</strong></li><li>Access to new Pro tools</li></ul><Link className="button light-button full" href="/login">Go unlimited <span aria-hidden="true">→</span></Link></article>
        </div>
      </section>
      <section className="beta-banner"><div><p className="eyebrow light">Ready to source?</p><h2>Build a cleaner candidate list.</h2><p>Start with 5 saves a month. Upgrade when you need unlimited.</p></div><Link className="button light-button" href="/login">Start free <span aria-hidden="true">→</span></Link></section>
      <footer><Brand /><span>Purpose-built for focused recruiting.</span><div className="footer-links"><Link href="/privacy">Privacy</Link><Link href="/support">Support</Link></div></footer>
    </div>
  </main>;
}
