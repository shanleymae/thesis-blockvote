import { useState } from 'react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/client';
import { notifyError, notifyInfo, notifySuccess } from '../../lib/toast';
import {
  hasWallet,
  requestWalletAddress,
  setPendingWallet,
} from '../../utils/wallet';

const MetaMaskIcon = () => (
  <svg width="18" height="18" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M36.2 3L21.9 13.4l2.7-6.3L36.2 3z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.8 3l14.2 10.5-2.6-6.4L3.8 3z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M30.9 28.4l-3.8 5.8 8.1 2.2 2.3-7.9-6.6-.1zM2.6 28.5l2.3 7.9 8.1-2.2-3.8-5.8-6.6.1z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12.5 17.8l-2.3 3.4 8.1.4-.3-8.7-5.5 4.9zM27.5 17.8l-5.6-5-2.3 8.7 8.1-.4-2.2-3.3z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 34.2l4.9-2.4-4.2-3.3-.7 5.7zM22.1 31.8l4.9 2.4-.7-5.7-4.2 3.3z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M27 34.2l-4.9-2.4.4 3.2-.1 2.3L27 34.2zM13 34.2l4.6 3.1-.1-2.3.4-3.2-4.9 2.4z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17.7 26.7l-4-1.2 2.9-1.3 1.1 2.5zM22.3 26.7l1.1-2.5 2.9 1.3-4 1.2z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 34.2l.8-5.8-5.4.1 4.6 5.7zM26.2 28.4l.8 5.8 4.6-5.7-5.4-.1zM31.9 21.2l-8.1.4.7 4.1 1.1-2.5 2.9 1.3 3.4-3.3zM17.7 26.7l2.9-1.3 1.1 2.5.8-4.1-8.1-.4 3.3 3.3z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M35.2 20.3l-7.7-2.2 2.3 3.3-3.4 6.6 4.5-.1h6.6l-2.3-7.6zM12.5 18.1l-7.7 2.2-2.3 7.6h6.6l4.5.1-3.4-6.6 2.3-3.3zM21.5 21.6l.5-8.6 2.2-6h-8.3l2.1 6 .5 8.6.3 2.6v6.3h3.1l.1-6.3.3-2.6-.8.4z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type ConnectWalletButtonProps = {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  showIcon?: boolean;
  label?: string;
};

export default function ConnectWalletButton({
  variant = 'outline',
  size = 'md',
  fullWidth = false,
  className = '',
  showIcon = true,
  label = 'Connect Wallet',
}: ConnectWalletButtonProps) {
  const { user, token, setUser } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!hasWallet()) {
      notifyError('Install MetaMask or another Web3 wallet.');
      return;
    }
    setIsConnecting(true);
    try {
      const address = await requestWalletAddress();
      if (token && user) {
        const linkedWallet = user.walletAddress;
        const updated = await authApi.updateWallet(address);
        setUser(updated);
        if (
          linkedWallet &&
          linkedWallet.toLowerCase() !== updated.walletAddress?.toLowerCase() &&
          user.status === 'APPROVED' &&
          updated.status === 'PENDING'
        ) {
          notifyInfo('Wallet updated. Admin approval is required again before you can vote.');
        } else {
          notifySuccess('Wallet linked successfully.');
        }
      } else {
        setPendingWallet(address);
        notifyInfo('Wallet connected. Log in to link it to your account.');
      }
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Could not connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const alreadyConnected = user?.walletAddress;
  const shortAddress = alreadyConnected
    ? `${alreadyConnected.slice(0, 6)}...${alreadyConnected.slice(-4)}`
    : '';

  if (alreadyConnected) {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-xs text-bv-ink-secondary" title={user.walletAddress ?? undefined}>
        {showIcon && <MetaMaskIcon />}
        {shortAddress}
      </span>
    );
  }

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <Button
        type="button"
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        className={className}
        onClick={handleConnect}
        disabled={isConnecting}
      >
        {showIcon && <MetaMaskIcon />}
        {isConnecting ? 'Connecting...' : label}
      </Button>
    </div>
  );
}
