'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@lazorkit/wallet';
import { PasskeyAuth } from '@/components/PasskeyAuth';
import { PaymasterStatusBanner } from '@/components/PaymasterStatusBanner';
import { useToast } from '@/components/ToastProvider';
import type { WalletSession, AuthError } from '@/types';

/**
 * Landing Page Component
 * 
 * Hero section with value proposition, Create Wallet and Sign In buttons,
 * feature highlights, and responsive layout. Checks for existing session
 * and redirects to dashboard if found.
 * 
 * Requirements: 7.11, 7.5, 3.2, 7.3, 7.4, 6.6
 */
export default function Home() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { isConnected, isLoading } = useWallet();
  const [authMode, setAuthMode] = useState<'create' | 'signin' | null>(null);

  // Check for existing session on mount and redirect to dashboard
  // Use SDK connection state instead of custom storage
  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard');
    }
  }, [isConnected, router]);

  /**
   * Handles successful authentication by showing toast and redirecting to dashboard.
   */
  const handleAuthSuccess = (_wallet: WalletSession) => {
    const message = authMode === 'create' 
      ? 'Wallet created successfully!' 
      : 'Signed in successfully!';
    showSuccess(message);
    router.push('/dashboard');
  };

  /**
   * Handles authentication errors with toast notification.
   */
  const handleAuthError = (error: AuthError) => {
    // Show error toast with actionable guidance
    showError(error.message);
    console.error('Auth error:', error);
  };

  // Show loading state while SDK is initializing and checking connection
  if (isLoading) {
    return (
      <main className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating orbs with animations - increased opacity for visibility */}
          <div 
            className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full blur-[100px] animate-float-slow"
            style={{ background: 'rgba(99, 102, 241, 0.4)' }}
          />
          <div 
            className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full blur-[100px] animate-float-medium"
            style={{ background: 'rgba(168, 85, 247, 0.35)' }}
          />
          <div 
            className="absolute top-1/3 left-1/3 w-[350px] h-[350px] rounded-full blur-[80px] animate-float-fast"
            style={{ background: 'rgba(129, 140, 248, 0.3)' }}
          />
          <div 
            className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full blur-[90px] animate-float-reverse"
            style={{ background: 'rgba(139, 92, 246, 0.25)' }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            {/* Logo/Brand */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-bg-card rounded-full mb-8">
              <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-white text-xs font-bold">◎</span>
              </div>
              <span className="text-text-secondary text-sm font-medium">Lazorkit Wallet</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
              Your Solana Wallet,{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Simplified
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10">
              Create a secure wallet with just your fingerprint or Face ID. 
              No seed phrases, no gas fees, no complexity.
            </p>

            {/* Paymaster Status Warning */}
            <PaymasterStatusBanner />

            {/* Auth Buttons or Auth Component */}
            <div className="max-w-sm mx-auto">
              {authMode === null ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setAuthMode('create')}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-primary text-white font-medium rounded-xl transition-all duration-200 ease-out-expo hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-primary focus-visible:ring-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Wallet
                  </button>
                  <button
                    onClick={() => setAuthMode('signin')}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-bg-card text-text-primary font-medium rounded-xl border border-text-muted/20 transition-all duration-200 ease-out-expo hover:bg-bg-secondary hover:border-primary/30 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-primary focus-visible:ring-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Sign In with Passkey
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <PasskeyAuth
                    mode={authMode}
                    onSuccess={handleAuthSuccess}
                    onError={handleAuthError}
                  />
                  <button
                    onClick={() => setAuthMode(null)}
                    className="text-text-muted hover:text-text-secondary text-sm transition-all duration-200 focus:outline-none focus:underline"
                  >
                    ← Back to options
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Feature Highlights Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-4">
            Why Choose Lazorkit?
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            Experience the future of crypto wallets with cutting-edge security and zero friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1: Passkey Security */}
          <div className="bg-bg-card rounded-2xl p-6 border border-text-muted/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 ease-out-expo">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Passkey Security
            </h3>
            <p className="text-text-secondary text-sm">
              Use your fingerprint or Face ID to secure your wallet. No seed phrases to lose or steal.
            </p>
          </div>

          {/* Feature 2: Gasless Transactions */}
          <div className="bg-bg-card rounded-2xl p-6 border border-text-muted/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 ease-out-expo">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Gasless Transfers
            </h3>
            <p className="text-text-secondary text-sm">
              Send USDC without paying network fees. Transactions are sponsored so you can focus on what matters.
            </p>
          </div>

          {/* Feature 3: Instant Setup */}
          <div className="bg-bg-card rounded-2xl p-6 border border-text-muted/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 ease-out-expo">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Instant Setup
            </h3>
            <p className="text-text-secondary text-sm">
              Create your wallet in seconds. No downloads, no extensions, no complicated setup process.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-text-muted/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">◎</span>
              </div>
              <span className="text-text-muted text-sm">Lazorkit Passkey Wallet Starter</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-text-muted text-xs">
                Built on Solana Devnet
              </span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-text-secondary transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
