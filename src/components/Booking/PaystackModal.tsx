import React, { useState } from 'react';
import {
  Lock,
  X,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ReceiptText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatNaira } from '../../utils/formatters';
import { ModalPortal } from '../UI/ModalPortal';
import { launchPaystackCheckout } from '../../utils/paystack';

interface PaystackModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  applicantEmail: string;
  applicantPhone?: string;
  applicantName?: string;
  propertyTitle?: string;
  agentName?: string;
  merchantName?: string;
  purposeTitle?: string;
  buttonText?: string;
  onSuccess: (paymentReference: string, paymentMethod: 'Card' | 'Bank Transfer' | 'USSD') => void;
}

export const PaystackModal: React.FC<PaystackModalProps> = ({
  isOpen,
  onClose,
  amount,
  applicantEmail,
  applicantPhone,
  applicantName,
  propertyTitle,
  agentName,
  merchantName,
  purposeTitle,
  buttonText,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const summaryTitle =
    purposeTitle ||
    (propertyTitle ? `Inspection Pass • ${propertyTitle}` : 'Setlla Ad Credits Top-Up');

  const summaryRecipient =
    merchantName || (agentName ? `Setlla • ${agentName}` : 'Setlla Platform');

  const handleProceedToPaystack = async () => {
    setIsProcessing(true);
    setErrorMsg('');

    const launched = await launchPaystackCheckout({
      email: applicantEmail || 'customer@setlla.com',
      amountNaira: amount,
      applicantName,
      applicantPhone,
      purposeTitle: summaryTitle,
      merchantName: summaryRecipient,
      onSuccess: (paymentReference, resolvedMethod) => {
        setIsProcessing(false);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#342A21', '#10B981', '#FCF9F5', '#000004'],
          });
        } catch (err) {}
        onSuccess(paymentReference, resolvedMethod || 'Card');
      },
      onClose: () => {
        setIsProcessing(false);
      },
      onError: (err) => {
        setIsProcessing(false);
        setErrorMsg(
          typeof err === 'string' ? err : err.message || 'Could not open Paystack checkout. Please check your connection.'
        );
      },
    });

    if (!launched) {
      setIsProcessing(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[#E5E7EB] animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Clean Header */}
          <div className="px-5 py-4 bg-[#FCF9F5] border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#342A21] text-[#FCF9F5] flex items-center justify-center shadow-2xs shrink-0">
                <ReceiptText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#000004]">
                  Payment Summary
                </h3>
                <p className="text-[11px] text-[#70798C]">
                  Review details before proceeding to Paystack
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              aria-label="Close payment summary"
              className="w-8 h-8 rounded-full bg-white hover:bg-[#F4F5F7] border border-[#E5E7EB] text-[#70798C] hover:text-[#000004] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Summary Body */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Total Amount Highlight */}
            <div className="p-4 rounded-2xl bg-[#FCF9F5] border border-[#E5E7EB] text-center space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#70798C] block">
                Total Amount to Pay
              </span>
              <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#000004] tracking-tight">
                {formatNaira(amount)}
              </div>
            </div>

            {/* Line Items */}
            <div className="rounded-2xl border border-[#E5E7EB] divide-y divide-[#E5E7EB] text-xs">
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-[#70798C]">Payment For</span>
                <span className="font-bold text-[#000004] text-right truncate max-w-[220px]">
                  {summaryTitle}
                </span>
              </div>

              {propertyTitle && purposeTitle && propertyTitle !== purposeTitle && (
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-[#70798C]">Item</span>
                  <span className="font-semibold text-[#000004] text-right truncate max-w-[220px]">
                    {propertyTitle}
                  </span>
                </div>
              )}

              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-[#70798C]">Account Email</span>
                <span className="font-medium text-[#000004] truncate max-w-[220px]">
                  {applicantEmail || 'customer@setlla.com'}
                </span>
              </div>

              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-[#70798C]">Gateway</span>
                <span className="font-semibold text-[#342A21] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Paystack Checkout (Card, Transfer, USSD)</span>
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Next / Proceed to Paystack Button */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleProceedToPaystack}
                disabled={isProcessing}
                className="w-full py-3.5 px-5 rounded-xl bg-[#342A21] hover:bg-[#000004] disabled:opacity-60 text-[#FCF9F5] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Opening Paystack Checkout...</span>
                  </>
                ) : (
                  <>
                    <span>{buttonText || `Proceed to Paystack • ${formatNaira(amount)}`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#70798C]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>256-bit SSL encrypted checkout powered by Paystack</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
