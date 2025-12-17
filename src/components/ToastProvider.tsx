'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Toast notification types for different message categories.
 * - success: For successful operations (wallet creation, transfers)
 * - error: For failed operations with actionable guidance
 * - info: For informational messages
 */
type ToastType = 'success' | 'error' | 'info';

/**
 * Individual toast notification data.
 */
interface Toast {
  /** Unique identifier for the toast */
  id: string;
  /** Type determines styling and icon */
  type: ToastType;
  /** Main message to display */
  message: string;
  /** Optional action text (e.g., "Retry", "View") */
  action?: string;
  /** Optional callback when action is clicked */
  onAction?: () => void;
}

/**
 * Toast context value providing show/hide functions.
 */
interface ToastContextValue {
  /** Shows a toast notification */
  showToast: (type: ToastType, message: string, options?: { action?: string; onAction?: () => void }) => void;
  /** Hides a specific toast by ID */
  hideToast: (id: string) => void;
  /** Shows a success toast with standard styling */
  showSuccess: (message: string) => void;
  /** Shows an error toast with optional retry action */
  showError: (message: string, onRetry?: () => void) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook to access toast notification functions.
 * Must be used within a ToastProvider.
 * 
 * @example
 * const { showSuccess, showError } = useToast();
 * showSuccess('Wallet created successfully!');
 * showError('Transfer failed', () => retryTransfer());
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * ToastProvider Component
 * 
 * Provides toast notification functionality to the application.
 * Displays animated toast messages with auto-dismiss after 4 seconds.
 * Supports success, error, and info types with optional action buttons.
 * 
 * Requirements: 7.3, 7.4
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Generates a unique ID for each toast.
   */
  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  /**
   * Shows a new toast notification with optional action.
   */
  const showToast = useCallback((
    type: ToastType,
    message: string,
    options?: { action?: string; onAction?: () => void }
  ) => {
    const id = generateId();
    const newToast: Toast = {
      id,
      type,
      message,
      action: options?.action,
      onAction: options?.onAction,
    };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, [generateId]);

  /**
   * Convenience method for success toasts.
   */
  const showSuccess = useCallback((message: string) => {
    showToast('success', message);
  }, [showToast]);

  /**
   * Convenience method for error toasts with optional retry.
   */
  const showError = useCallback((message: string, onRetry?: () => void) => {
    showToast('error', message, onRetry ? { action: 'Retry', onAction: onRetry } : undefined);
  }, [showToast]);

  /**
   * Hides a specific toast notification.
   */
  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Gets the appropriate styles for a toast type.
   * Uses semi-transparent backgrounds with matching border colors.
   */
  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-success/20 border-success/40 shadow-success/10';
      case 'error':
        return 'bg-error/20 border-error/40 shadow-error/10';
      case 'info':
      default:
        return 'bg-primary/20 border-primary/40 shadow-primary/10';
    }
  };

  /**
   * Gets the icon color class for a toast type.
   */
  const getIconColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-error';
      case 'info':
      default:
        return 'text-primary';
    }
  };

  /**
   * Gets the appropriate icon for a toast type.
   * Uses animated icons for better visual feedback.
   */
  const getToastIcon = (type: ToastType) => {
    const iconColor = getIconColor(type);
    
    switch (type) {
      case 'success':
        return (
          <div className={`w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0`}>
            <svg className={`w-4 h-4 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className={`w-6 h-6 rounded-full bg-error/20 flex items-center justify-center flex-shrink-0`}>
            <svg className={`w-4 h-4 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'info':
      default:
        return (
          <div className={`w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0`}>
            <svg className={`w-4 h-4 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  /**
   * Handles action button click.
   */
  const handleAction = (toast: Toast) => {
    if (toast.onAction) {
      toast.onAction();
    }
    hideToast(toast.id);
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast, showSuccess, showError }}>
      {children}
      
      {/* Toast Container - positioned at bottom right */}
      <div 
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm pointer-events-none"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`
              pointer-events-auto
              flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md
              shadow-lg transform transition-all duration-300 ease-out
              animate-in slide-in-from-right-full fade-in
              ${getToastStyles(toast.type)}
            `}
          >
            {getToastIcon(toast.type)}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary leading-snug">
                {toast.message}
              </p>
              
              {/* Action button for error toasts with retry */}
              {toast.action && (
                <button
                  onClick={() => handleAction(toast)}
                  className={`
                    mt-1.5 text-xs font-medium transition-colors
                    ${toast.type === 'error' ? 'text-error hover:text-error/80' : 'text-primary hover:text-primary/80'}
                  `}
                >
                  {toast.action}
                </button>
              )}
            </div>
            
            {/* Close button */}
            <button
              onClick={() => hideToast(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Dismiss notification"
            >
              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
