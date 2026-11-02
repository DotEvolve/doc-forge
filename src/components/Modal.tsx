import React, { useEffect, useId } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'danger';
  destructiveWarning?: string;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  bodyClassName?: string;
  hideHeader?: boolean;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'w-[98vw] max-w-[98vw]',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  variant = 'default',
  destructiveWarning,
  onConfirm,
  confirmLabel,
  cancelLabel,
  bodyClassName,
  hideHeader = false,
}) => {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full flex flex-col overflow-hidden ${sizeClasses[size]} ${
          size === 'full' ? 'h-[96vh] max-h-[96vh]' : 'max-h-[calc(100vh-8rem)]'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {!hideHeader && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 shrink-0">
            <h2
              id={titleId}
              className="text-lg font-semibold text-gray-900 flex items-center gap-2"
            >
              {variant === 'danger' && (
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" aria-hidden="true" />
              )}
              {title}
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-1"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className={bodyClassName || 'p-6 overflow-y-auto flex-1 min-h-0'}>
          {children}
          {variant === 'danger' && destructiveWarning && (
            <p className="mt-3 text-sm font-semibold text-red-600">{destructiveWarning}</p>
          )}
        </div>

        {onConfirm && confirmLabel ? (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 shrink-0 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {cancelLabel ?? 'Cancel'}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        ) : footer ? (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 shrink-0 flex items-center justify-end gap-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};
