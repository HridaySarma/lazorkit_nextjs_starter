'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Transaction } from '@/types';
import { getTransactionHistory, getExplorerUrl, formatBalance, truncateAddress } from '@/lib/solana';
import { useToast } from './ToastProvider';

/**
 * Props for the TransactionHistory component.
 */
interface TransactionHistoryProps {
  /** The wallet address to fetch transactions for */
  walletAddress: string;
}

/**
 * TransactionHistory Component
 * 
 * Fetches and displays the 10 most recent transactions for a wallet.
 * Shows transaction type, amount, counterparty, timestamp, and status.
 * Uses toast notifications for error feedback.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.4
 */
export function TransactionHistory({ walletAddress }: TransactionHistoryProps) {
  const { showError } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches transaction history from the blockchain.
   * Shows error toast on failure with retry option.
   */
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const txs = await getTransactionHistory(walletAddress);
      setTransactions(txs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(message);
      showError(message, fetchTransactions);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, showError]);

  // Fetch transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  /**
   * Formats a timestamp for display.
   */
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  /**
   * Gets the icon for a transaction type.
   */
  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'send':
        return (
          <div className="w-8 h-8 rounded-full bg-error/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
        );
      case 'receive':
        return (
          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-text-muted/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        );
    }
  };

  /**
   * Gets the status badge for a transaction.
   */
  const getStatusBadge = (status: Transaction['status']) => {
    const styles = {
      confirmed: 'bg-success/20 text-success',
      pending: 'bg-warning/20 text-warning',
      failed: 'bg-error/20 text-error',
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  /**
   * Renders a loading skeleton.
   */
  const renderSkeleton = () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-bg-secondary rounded-lg animate-pulse">
          <div className="w-8 h-8 rounded-full bg-bg-card" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-bg-card rounded" />
            <div className="h-3 w-32 bg-bg-card rounded" />
          </div>
          <div className="text-right space-y-2">
            <div className="h-4 w-16 bg-bg-card rounded" />
            <div className="h-3 w-12 bg-bg-card rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  /**
   * Renders the empty state.
   */
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary flex items-center justify-center">
        <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 className="text-text-secondary font-medium mb-1">No transactions yet</h3>
      <p className="text-text-muted text-sm">
        Your transaction history will appear here
      </p>
    </div>
  );

  /**
   * Renders the error state.
   */
  const renderError = () => (
    <div className="bg-error/10 border border-error/20 rounded-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-error">{error}</span>
        </div>
        <button
          onClick={fetchTransactions}
          className="text-sm text-primary hover:text-primary-light transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  /**
   * Renders a transaction row.
   */
  const renderTransaction = (tx: Transaction) => {
    const isOutgoing = tx.type === 'send';
    const amountPrefix = isOutgoing ? '-' : '+';
    const amountColor = isOutgoing ? 'text-error' : 'text-success';

    return (
      <a
        key={tx.signature}
        href={getExplorerUrl(tx.signature)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 p-4 bg-bg-secondary rounded-lg hover:bg-bg-card transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-card"
      >
        {getTransactionIcon(tx.type)}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-text-primary font-medium capitalize">
              {tx.type === 'unknown' ? 'Transaction' : tx.type}
            </span>
            {getStatusBadge(tx.status)}
          </div>
          <p className="text-text-muted text-sm truncate">
            {tx.counterparty ? truncateAddress(tx.counterparty) : 'Unknown'}
          </p>
        </div>

        <div className="text-right">
          <p className={`font-medium ${amountColor}`}>
            {amountPrefix}{formatBalance(tx.amount, tx.token)} {tx.token}
          </p>
          <p className="text-text-muted text-xs">
            {formatTimestamp(tx.timestamp)}
          </p>
        </div>

        <svg
          className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    );
  };

  return (
    <div className="bg-bg-card rounded-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">
          Recent Transactions
        </h3>
        <button
          onClick={fetchTransactions}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-bg-secondary transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-card active:scale-95"
          title="Refresh"
        >
          <svg
            className={`w-4 h-4 text-text-secondary ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {isLoading && renderSkeleton()}
      {!isLoading && error && renderError()}
      {!isLoading && !error && transactions.length === 0 && renderEmptyState()}
      {!isLoading && !error && transactions.length > 0 && (
        <div className="space-y-2">
          {transactions.map(renderTransaction)}
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;
