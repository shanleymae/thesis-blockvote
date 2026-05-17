import { Box } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-white/[0.08] bg-transparent px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-bv-accent">
            <Box size={13} className="text-bv-bg" />
          </div>
          <span className="text-sm font-semibold tracking-[0.22em] text-bv-ink">BLOCKVOTE</span>
        </Link>

        <p className="text-xs text-bv-ink-muted">
          &copy; 2026 Blockvote. Secure blockchain-based voting.
        </p>

        <div className="flex items-center gap-5 text-xs text-bv-ink-secondary">
          <Link to="/privacy" className="transition-colors hover:text-bv-ink">Privacy</Link>
          <Link to="/terms" className="transition-colors hover:text-bv-ink">Terms</Link>
          <Link to="/help" className="transition-colors hover:text-bv-ink">Help</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
