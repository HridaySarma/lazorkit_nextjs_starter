'use client';

import { useState, useEffect } from 'react';

/**
 * PaymasterStatusBanner Component
 * 
 * Displays a warning banner when the paymaster service is unavailable.
 * Helps users understand why wallet creation might be failing.
 */
export function PaymasterStatusBanner() {
  const [isDown, setIsDown] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPaymasterStatus = async () => {
      const paymasterUrl = process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL || 
                          'https://kora.devnet.lazorkit.com';
      
      try {
        // Use POST with empty body - paymaster endpoints typically accept POST
        // This avoids the 405 error from HEAD requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch(paymasterUrl, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Any response (even 4xx) means the service is reachable
        setIsDown(false);
      } catch (error) {
        // Network error or timeout - service might be down
        setIsDown(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkPaymasterStatus();
  }, []);

  if (isChecking || !isDown) {
    return null;
  }

  return (
    <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 mb-4">
      <div className="flex items-start gap-3">
        <svg
          className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
            Paymaster Service May Be Unavailable
          </h3>
          <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-300">
            The Lazorkit paymaster service appears to be down. Wallet creation and transactions may not work until the service recovers.
          </p>
          <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-300">
            Please try again in a few minutes. See <code className="bg-yellow-500/20 px-1 py-0.5 rounded">PAYMASTER-SERVICE-DOWN.md</code> for more information.
          </p>
        </div>
      </div>
    </div>
  );
}
