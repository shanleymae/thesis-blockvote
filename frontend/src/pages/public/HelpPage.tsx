import { Link } from 'react-router-dom';
import { CheckCircle2, HelpCircle, Mail, Search, Shield, Users, Wallet } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

const quickSteps = [
  'Register with your email, organization, and wallet.',
  'Verify your email from the link sent to your inbox.',
  'Wait for admin approval before voting.',
  'Open an active election and confirm your vote in your wallet.',
  'Save or view your receipt and transaction hash after voting.',
];

const faqs = [
  {
    category: 'Account Registration',
    icon: Mail,
    items: [
      {
        question: 'Why do I need to verify my email?',
        answer: 'Email verification confirms that the registered account belongs to you before administrators review voter approval.',
      },
      {
        question: 'Why is my account pending?',
        answer: 'New voter accounts need administrator approval. Once approved, active elections assigned to your organization become available for voting.',
      },
    ],
  },
  {
    category: 'Wallet Access',
    icon: Wallet,
    items: [
      {
        question: 'Why do I need a wallet?',
        answer: 'Your wallet is used to sign voting transactions and connect your vote receipt to a verifiable blockchain transaction.',
      },
      {
        question: 'Can I change my wallet?',
        answer: 'You can update your wallet from your profile. If your account was already approved, changing wallets may require administrator approval again.',
      },
    ],
  },
  {
    category: 'Voting',
    icon: CheckCircle2,
    items: [
      {
        question: 'When can I vote?',
        answer: 'Voting is available only when the election is active, your account is approved, and your wallet is connected.',
      },
      {
        question: 'Can I change my vote?',
        answer: 'No. A submitted vote is final once the wallet transaction is confirmed and the receipt is recorded.',
      },
    ],
  },
  {
    category: 'Receipts And Verification',
    icon: Search,
    items: [
      {
        question: 'Where can I find my receipt?',
        answer: 'Voters can open the receipt page to view previous vote receipts, transaction hashes, and election details.',
      },
      {
        question: 'How does public verification work?',
        answer: 'Anyone with a transaction hash can use the verification page or Etherscan link to inspect the blockchain transaction record.',
      },
    ],
  },
  {
    category: 'Security',
    icon: Shield,
    items: [
      {
        question: 'What prevents duplicate votes?',
        answer: 'The system checks both the application records and the voting contract so each voter can vote only once per eligible position.',
      },
      {
        question: 'What should I do if MetaMask fails?',
        answer: 'Check that your wallet is unlocked, connected to the correct network, and has enough test ETH for transaction fees, then try again.',
      },
    ],
  },
  {
    category: 'Roles & access',
    icon: Users,
    items: [
      {
        question: 'What is the difference between Super Admin, Admin, and Voter?',
        answer:
          'Voters use the voter portal to participate in elections. Admins operate an organization-scoped admin area to run elections and approve voters in their organization. A Super Admin can assign those roles and manage cross-organization administration. Signed-in administrators can open Security in the admin panel for the full role breakdown.',
      },
      {
        question: 'Who can approve my voter account?',
        answer:
          'An administrator for your organization reviews pending registrations. Super Admin accounts exist for system-wide administration and are not involved in routine voter approval unless your deployment assigns that responsibility differently.',
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-bv-bg text-bv-ink">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 pb-16 pt-28">
        <section className="border-b border-white/10 pb-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-bv-accent">
              <HelpCircle size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bv-accent">
                Help Center
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white">
                Using Blockvote
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-bv-ink-secondary">
                Find quick answers for account setup, wallet connection, voting, receipts,
                and public vote verification.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold text-white">Quick Start</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {quickSteps.map((step, index) => (
              <div key={step} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-bv-accent text-sm font-semibold text-bv-bg">
                  {index + 1}
                </div>
                <p className="mt-3 text-sm leading-6 text-bv-ink-secondary">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {faqs.map(({ category, icon: Icon, items }) => (
            <article key={category} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-bv-accent">
                  <Icon size={18} />
                </div>
                <h2 className="text-base font-semibold text-white">{category}</h2>
              </div>
              <div className="mt-5 space-y-4">
                {items.map((item) => (
                  <div key={item.question}>
                    <h3 className="text-sm font-semibold text-bv-ink">{item.question}</h3>
                    <p className="mt-1 text-sm leading-7 text-bv-ink-secondary">{item.answer}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-bv-accent/20 bg-bv-accent-muted/20 p-6">
          <h2 className="text-base font-semibold text-white">Need to verify a receipt?</h2>
          <p className="mt-2 text-sm leading-7 text-bv-ink-secondary">
            Use the public verification page if you have a transaction hash, or open your
            voter receipt page after signing in.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/verify"
              className="rounded-xl bg-bv-accent px-5 py-3 text-sm font-semibold text-bv-bg transition-opacity hover:opacity-90"
            >
              Verify Transaction
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-bv-ink-secondary transition-colors hover:border-bv-accent hover:text-bv-accent"
            >
              Sign In
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
