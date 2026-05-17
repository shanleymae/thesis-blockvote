import { BrowserProvider } from 'ethers'

declare global {
  interface Window {
    ethereum?: {
      request(args: { method: string; params?: unknown[] }): Promise<unknown>;
    };
  }
}

const PENDING_WALLET_KEY = 'blockvote_pending_wallet'

export function hasWallet(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum
}

export function getPendingWallet(): string | null {
  try {
    return sessionStorage.getItem(PENDING_WALLET_KEY)
  } catch {
    return null
  }
}

export function setPendingWallet(address: string): void {
  sessionStorage.setItem(PENDING_WALLET_KEY, address)
}

export function clearPendingWallet(): void {
  sessionStorage.removeItem(PENDING_WALLET_KEY)
}

/** Request MetaMask (or injected) wallet connection. Returns first account or throws. */
export async function requestWalletAddress(): Promise<string> {
  if (!hasWallet()) {
    throw new Error('No wallet found. Install MetaMask or another Web3 wallet.')
  }
  const accounts = (await window.ethereum!.request({
    method: 'eth_requestAccounts',
    params: [],
  })) as string[]
  if (!accounts?.length) {
    throw new Error('No accounts returned. Unlock your wallet and try again.')
  }
  const address = accounts[0]
  if (!address || !address.startsWith('0x')) {
    throw new Error('Invalid wallet address')
  }
  return address
}

export async function signWalletMessage(message: string): Promise<{ address: string; signature: string }> {
  if (!hasWallet()) {
    throw new Error('No wallet found. Install MetaMask or another Web3 wallet.')
  }

  const provider = new BrowserProvider(window.ethereum as NonNullable<typeof window.ethereum>)
  const signer = await provider.getSigner()
  const address = await signer.getAddress()
  const signature = await signer.signMessage(message)

  return { address, signature }
}
