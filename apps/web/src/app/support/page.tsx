import Link from 'next/link';
import { Brand } from '../components/brand';

export const metadata = {
  title: 'Support — RecruitMerge',
  description: 'Get help with RecruitMerge candidate capture, sign-in, and account data.',
};

const help = [
  ['A profile is not detected', 'Open a standard LinkedIn member profile, wait for the page to finish loading, then select Try again in the extension. Refresh the LinkedIn tab if detection is still unavailable.'],
  ['The extension is not connected', 'Sign in to RecruitMerge, open the extension, and select Connect. Return to LinkedIn after the confirmation page appears.'],
  ['A candidate is already saved', 'RecruitMerge prevents duplicate LinkedIn profile URLs in the same workspace. Open the dashboard to review the existing record.'],
  ['I need to delete data', 'Delete individual candidates from the dashboard. For account deletion, use the private contact method shown in the Chrome Web Store support section and include only your RecruitMerge account email.'],
];

export default function SupportPage() {
  return <main className="legal-page">
    <div className="legal-shell">
      <nav className="legal-nav"><Brand /><Link href="/contact">Contact</Link></nav>
      <section className="support-hero"><p className="eyebrow">RecruitMerge support</p><h1>How can we help?</h1><p>Quick answers for the candidate capture workflow and your private workspace.</p></section>
      <section className="support-grid">{help.map(([title, copy]) => <article className="support-card" key={title}><h2>{title}</h2><p>{copy}</p></article>)}</section>
      <section className="support-contact"><div><h2>Still need help?</h2><p>Send a private message to the RecruitMerge support inbox. Never include candidate details, access tokens, or passwords.</p></div><Link className="button primary" href="/contact">Contact support <span aria-hidden="true">→</span></Link></section>
      <footer className="legal-footer"><Brand /><div><Link href="/privacy">Privacy</Link><Link href="/support">Support</Link><Link href="/contact">Contact</Link></div></footer>
    </div>
  </main>;
}
