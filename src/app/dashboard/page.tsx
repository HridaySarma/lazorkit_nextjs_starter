'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@lazorkit/wallet';
import { WalletDashboard } from '@/components/WalletDashboard';
import { GaslessTransfer } from '@/components/GaslessTransfer';
import { TransactionHistory } from '@/components/TransactionHistory';
import { getUSDCBalance } from '@/lib/solana';

/**
 * Dashboard Page Component
 * 
 * Protected route that displays wallet information, transfer form,
 * and transaction history. Uses SDK's useWallet hook for connection state.
 * Redirects to landing if wallet is not connected.
 * 
 * Requirements: 6.1, 6.2, 6.5
 */
export default function DashboardPage() {
  const router = useRouter();
  const { smartWalletPubkey, isConnected } = useWallet();
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Check for SDK connection on mount and redirect if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    } else {
      setIsLoading(false);
    }
  }, [isConnected, router]);

  /**
   * Fetches the current USDC balance for the wallet.
   */
  const fetchUSDCBalance = useCallback(async () => {
    if (!smartWalletPubkey) return;
    
    try {
      const walletAddress = smartWalletPubkey.toBase58();
      const balance = await getUSDCBalance(walletAddress);
      setUsdcBalance(balance);
    } catch (err) {
      console.error('Failed to fetch USDC balance:', err);
    }
  }, [smartWalletPubkey]);

  // Fetch USDC balance when wallet is connected
  useEffect(() => {
    if (smartWalletPubkey) {
      fetchUSDCBalance();
    }
  }, [smartWalletPubkey, fetchUSDCBalance]);

  /**
   * Handles logout by redirecting to landing.
   * SDK disconnect is handled by WalletDashboard component.
   */
  const handleLogout = () => {
    router.push('/');
  };

  /**
   * Handles transfer completion by refreshing balances.
   */
  const handleTransferComplete = () => {
    fetchUSDCBalance();
  };

  // Show loading state while checking connection
  if (isLoading || !isConnected || !smartWalletPubkey) {
    return (
      <main className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const walletAddress = smartWalletPubkey.toBase58();

  return (
    <main className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-text-muted/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-white text-sm font-bold">◎</span>
              </div>
              <span className="text-text-primary font-semibold">Lazorkit Wallet</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-text-muted text-sm">
                Solana Devnet
              </span>
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" title="Connected" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Wallet Info & Transfer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Dashboard */}
            <WalletDashboard
              onLogout={handleLogout}
            />

            {/* Gasless Transfer */}
            <GaslessTransfer
              usdcBalance={usdcBalance}
              onTransferComplete={handleTransferComplete}
            />
          </div>

          {/* Right Column - Transaction History */}
          <div className="lg:col-span-1">
            <TransactionHistory
              walletAddress={walletAddress}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-text-muted/10 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-text-muted text-xs">
              Lazorkit Passkey Wallet Starter
            </span>
            <div className="flex items-center gap-4">
              <a
                href="https://explorer.solana.com/?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-text-secondary text-xs transition-colors"
              >
                Solana Explorer
              </a>
              <span className="text-text-muted/50">•</span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-text-secondary text-xs transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
