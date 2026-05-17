import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

type LegalPageProps = {
  type: 'terms' | 'privacy';
};

const termsSections = [
  {
    title: 'Account Eligibility',
    body: 'Users must provide accurate registration details, verify their email address, link their own wallet, and wait for administrator approval before voting.',
  },
  {
    title: 'Wallet Use',
    body: 'A linked wallet is used to confirm voting identity and sign blockchain transactions. Users are responsible for protecting wallet access and private keys.',
  },
  {
    title: 'Voting Rules',
    body: 'Each approved voter may submit only one vote per eligible election position. Submitted votes are final once confirmed and recorded.',
  },
  {
    title: 'System Availability',
    body: 'Election access may depend on network, wallet, blockchain, and server availability. Administrators may review issues using receipts and transaction records.',
  },
];

const privacySections = [
  {
    title: 'Information Collected',
    body: 'Blockvote collects account details such as name, email, phone number when provided, organization, wallet address, approval status, and vote receipt metadata.',
  },
  {
    title: 'How Information Is Used',
    body: 'Information is used for account verification, voter approval, election access control, vote receipt display, audit logs, and public transparency features.',
  },
  {
    title: 'Blockchain Records',
    body: 'Vote transactions submitted to the blockchain may be publicly visible through transaction hashes and explorers. Personal account details are not intentionally published on-chain by the application.',
  },
  {
    title: 'Data Control',
    body: 'Users may update profile details or request account deletion from their profile page, subject to preserving required election and audit records.',
  },
];

export default function LegalPage({ type }: LegalPageProps) {
  const isTerms = type === 'terms';
  const title = isTerms ? 'Terms and Conditions' : 'Privacy Policy';
  const intro = isTerms
    ? 'These terms describe the responsibilities of voters, administrators, and guests when using Blockvote.'
    : 'This policy explains what information Blockvote uses and how voting transparency is handled.';
  const sections = isTerms ? termsSections : privacySections;

  return (
    <div className="min-h-screen bg-bv-bg text-bv-ink">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 pb-16 pt-28">
        <div className="border-b border-white/10 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bv-accent">
            Blockvote Legal
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-bv-ink-secondary">
            {intro}
          </p>
        </div>

        <section className="mt-8 space-y-5">
          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h2 className="text-base font-semibold text-white">{section.title}</h2>
              <p className="mt-2 text-sm leading-7 text-bv-ink-secondary">{section.body}</p>
            </article>
          ))}
        </section>

        <div className="mt-8 rounded-2xl border border-bv-accent/20 bg-bv-accent-muted/20 p-5 text-sm leading-7 text-bv-ink-secondary">
          By continuing to use Blockvote, you acknowledge these conditions and the public
          verification nature of blockchain-backed voting records.
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to={isTerms ? '/privacy' : '/terms'}
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-bv-ink-secondary transition-colors hover:border-bv-accent hover:text-bv-accent"
          >
            View {isTerms ? 'Privacy Policy' : 'Terms and Conditions'}
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-bv-accent px-5 py-3 text-sm font-semibold text-bv-bg transition-opacity hover:opacity-90"
          >
            Back to Registration
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
