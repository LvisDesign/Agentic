import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, Info, CheckCircle2, X } from 'lucide-react';
import { ModalPortal } from './ModalPortal';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

export interface CustomConfirmProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemTitle?: string;
  itemSubtitle?: string;
  badge?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  isAlertOnly?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const CustomConfirmModal: React.FC<CustomConfirmProps> = ({
  isOpen,
  title,
  message,
  itemTitle,
  itemSubtitle,
  badge,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  isAlertOnly = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <Trash2 className="w-5 h-5 text-rose-600" />,
          iconBg: 'bg-rose-50 border-rose-200 text-rose-600',
          badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
          defaultBadge: 'DESTRUCTIVE ACTION',
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25',
          glow: 'from-rose-500/10 to-transparent',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          iconBg: 'bg-amber-50 border-amber-200 text-amber-600',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
          defaultBadge: 'CONFIRMATION REQUIRED',
          confirmBtn: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25',
          glow: 'from-amber-500/10 to-transparent',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-600',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          defaultBadge: 'ACTION VERIFIED',
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25',
          glow: 'from-emerald-500/10 to-transparent',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-[#342A21]" />,
          iconBg: 'bg-[#342A21]/10 border-[#342A21]/20 text-[#342A21]',
          badgeBg: 'bg-[#342A21]/10 text-[#342A21] border-[#342A21]/20',
          defaultBadge: 'PLATFORM NOTICE',
          confirmBtn: 'bg-[#000004] hover:bg-[#342A21] text-white shadow-black/25',
          glow: 'from-[#342A21]/10 to-transparent',
        };
    }
  };

  const currentStyles = getVariantStyles();

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        role="dialog"
        aria-modal="true"
      >
      <div 
        className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#342A21]/15 animate-scale-up space-y-5 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl ${currentStyles.glow} rounded-full blur-2xl pointer-events-none -mr-16 -mt-16`} />

        {/* Top bar: Badge & Close Button */}
        <div className="flex items-center justify-between relative z-10">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${currentStyles.badgeBg}`}>
            {badge || currentStyles.defaultBadge}
          </span>
          {!isLoading && (
            <button
              type="button"
              onClick={onCancel}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#70798C] hover:text-[#000004] hover:bg-[#F4F5F7] transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Header & Icon */}
        <div className="flex items-start gap-4 relative z-10">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${currentStyles.iconBg}`}>
            {currentStyles.icon}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="font-display font-extrabold text-base sm:text-lg text-[#000004] leading-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-[#70798C] mt-1.5 leading-relaxed font-medium">
              {message}
            </p>
          </div>
        </div>

        {/* Optional Target Item Card Preview */}
        {itemTitle && (
          <div className="p-3.5 rounded-2xl bg-[#FCF9F5] border border-[#342A21]/10 flex items-start gap-2.5 relative z-10 shadow-2xs">
            <div className="w-2 h-2 rounded-full bg-[#342A21] mt-1.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#000004] leading-snug break-words">
                {itemTitle}
              </p>
              {itemSubtitle && (
                <p className="text-[11px] text-[#70798C] mt-0.5 font-medium truncate">
                  {itemSubtitle}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5E7EB] relative z-10">
          {!isAlertOnly && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onCancel}
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl border border-[#E5E7EB] hover:bg-[#F4F5F7] text-xs sm:text-sm font-semibold text-[#70798C] hover:text-[#000004] transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex-1 sm:flex-none py-2.5 px-5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 ${currentStyles.confirmBtn}`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
);
};
