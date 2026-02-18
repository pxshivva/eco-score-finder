import { toast } from 'sonner';

/**
 * Toast notification types and utilities
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  description?: string;
}

/**
 * Show a success toast notification
 */
export const showSuccessToast = (message: string, options?: ToastOptions) => {
  toast.success(message, {
    duration: options?.duration ?? 3000,
    description: options?.description,
  });
};

/**
 * Show an error toast notification
 */
export const showErrorToast = (message: string, options?: ToastOptions) => {
  toast.error(message, {
    duration: options?.duration ?? 4000,
    description: options?.description,
  });
};

/**
 * Show an info toast notification
 */
export const showInfoToast = (message: string, options?: ToastOptions) => {
  toast.info(message, {
    duration: options?.duration ?? 3000,
    description: options?.description,
  });
};

/**
 * Show a warning toast notification
 */
export const showWarningToast = (message: string, options?: ToastOptions) => {
  toast.warning(message, {
    duration: options?.duration ?? 3500,
    description: options?.description,
  });
};

/**
 * Show a loading toast (returns toast ID for later update)
 */
export const showLoadingToast = (message: string) => {
  return toast.loading(message);
};

/**
 * Update an existing toast
 */
export const updateToast = (
  toastId: string | number,
  message: string,
  type: ToastType = 'success'
) => {
  toast[type](message, { id: toastId });
};

/**
 * Dismiss a specific toast
 */
export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * Common toast messages for consistent UX
 */
export const toastMessages = {
  // Product actions
  productAdded: 'Product added to favorites',
  productRemoved: 'Product removed from favorites',
  productSaved: 'Product saved successfully',
  productNotFound: 'Product not found. Would you like to contribute it?',
  
  // Scan history
  scanHistoryCleared: 'Scan history cleared',
  scanHistoryEmpty: 'No scan history yet',
  productAddedToHistory: 'Product added to scan history',
  
  // Barcode scanning
  barcodeScanned: 'Barcode scanned successfully',
  barcodeScanFailed: 'Failed to scan barcode. Please try again.',
  cameraAccessDenied: 'Camera access denied. Please enable camera permissions.',
  
  // Search
  searchStarted: 'Searching for products...',
  searchCompleted: 'Search completed',
  searchFailed: 'Search failed. Please try again.',
  noResults: 'No products found. Try a different search term.',
  
  // Comparison
  productAddedToComparison: 'Product added to comparison',
  productRemovedFromComparison: 'Product removed from comparison',
  
  // General
  loading: 'Loading...',
  success: 'Operation completed successfully',
  error: 'An error occurred. Please try again.',
  copied: 'Copied to clipboard',
};
