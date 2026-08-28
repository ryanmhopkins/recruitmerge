import Link from 'next/link';
import { Brand } from '../components/brand';

export const metadata = {
  title: 'Privacy Policy — RecruitMerge',
  description: 'How RecruitMerge collects, uses, protects, and deletes data.',
};

export default function PrivacyPage() {
  return <main className="legal-page">
    <div className="legal-shell">
      <nav className="legal-nav"><Brand /><Link href="/support">Support</Link></nav>
      <article className="legal-card">
        <p className="eyebrow">Privacy at RecruitMerge</p>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Effective August 28, 2026</p>
        <p>RecruitMerge is a recruiting productivity tool that lets a signed-in user save selected LinkedIn profile details, a job or pipeline label, and sourcing notes to a private candidate workspace. This policy explains the information RecruitMerge handles and why.</p>

        <h2>Information we collect</h2>
        <ul>
          <li><strong>Account information:</strong> your email address and authentication information required to sign you in securely.</li>
          <li><strong>Candidate information you choose to save:</strong> name, title, company, location, LinkedIn profile URL, job or pipeline label, and notes.</li>
          <li><strong>Website content:</strong> the extension reads the active LinkedIn profile page only to detect the candidate details shown in the popup. Details are sent to RecruitMerge only when you choose to save them.</li>
          <li><strong>Basic service information:</strong> hosting and database providers may process limited technical logs needed to operate, secure, and troubleshoot the service.</li>
        </ul>

        <h2>How we use information</h2>
        <p>We use this information only to authenticate you, create and maintain your private candidate workspace, detect duplicates, provide search and export features, and keep RecruitMerge secure and reliable. RecruitMerge does not sell personal data or use candidate information for advertising, credit decisions, or unrelated profiling.</p>

        <h2>Service providers and sharing</h2>
        <p>RecruitMerge uses Supabase for authentication and database hosting, Vercel for website hosting, and Resend for sign-in email delivery. These providers process information only as needed to deliver their services. We may also disclose information when required by law or necessary to protect the security of RecruitMerge and its users.</p>

        <h2>Storage, security, and retention</h2>
        <p>Information is transmitted over encrypted HTTPS connections. Candidate records are protected by account-based access controls and database row-level security. Records remain until you delete them or request account deletion, except where limited retention is required for security, legal compliance, or backup recovery.</p>

        <h2>Your choices</h2>
        <p>You can review and delete individual candidate records from your dashboard. For help with account deletion, access, or correction, visit the <Link href="/support">RecruitMerge support page</Link>. Do not include candidate data, authentication information, or other sensitive information in a public support request.</p>

        <h2>Chrome Web Store Limited Use</h2>
        <p>RecruitMerge&apos;s use and transfer of information received from Google APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is used only to provide or improve RecruitMerge&apos;s user-facing candidate capture and workspace features. It is not transferred for personalized advertising or sold to data brokers.</p>

        <h2>Changes to this policy</h2>
        <p>We may update this policy as RecruitMerge evolves. Material changes will be reflected on this page with an updated effective date and, when required, an in-product notice.</p>
      </article>
      <footer className="legal-footer"><Brand /><div><Link href="/privacy">Privacy</Link><Link href="/support">Support</Link></div></footer>
    </div>
  </main>;
}
