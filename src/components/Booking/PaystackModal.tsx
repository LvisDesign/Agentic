import React, { useState } from 'react';
import { 
  CreditCard, 
  Building2, 
  Smartphone, 
  Lock, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Copy, 
  Check, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatNaira } from '../../utils/formatters';
import { CustomDropdown, DropdownOption } from '../UI/CustomDropdown';

const BANK_OPTIONS: DropdownOption[] = [
  { value: 'GTBank', label: 'Guaranty Trust Bank (*737*)', subtitle: 'GTCO Instant USSD' },
  { value: 'Zenith', label: 'Zenith Bank (*966*)', subtitle: 'Zenith Direct Banking' },
  { value: 'Access', label: 'Access Bank (*901*)', subtitle: 'Access / Diamond Mobile' },
  { value: 'UBA', label: 'United Bank for Africa (*919*)', subtitle: 'UBA Magic Banking' },
  { value: 'FirstBank', label: 'First Bank of Nigeria (*894*)', subtitle: 'FirstBank FirstMonie' },
];

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
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'bank' | 'ussd'>('card');
  const [cardNumber, setCardNumber] = useState('4084 0821 9920 4812');
  const [cardExpiry, setCardExpiry] = useState('11/28');
  const [cardCvv, setCardCvv] = useState('419');
  const [selectedBank, setSelectedBank] = useState('GTBank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('0293810291');
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };


  const handleSimulatePayment = (method: 'Card' | 'Bank Transfer' | 'USSD') => {
    setIsProcessing(true);
    setErrorMsg('');

    // Simulate Paystack NIBSS bank gateway authorization
    setTimeout(() => {
      setIsProcessing(false);
      
      // Fire confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#342A21', '#10B981', '#FCF9F5', '#000004']
        });
      } catch (err) {
        // Fallback if confetti context not available
      }

      const generatedRef = `PSK_${Date.now().toString().slice(-8)}`;
      onSuccess(generatedRef, method);
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[#E5E7EB] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Paystack Official Header */}
        <div className="bg-[#0D233A] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#00C3F7] flex items-center justify-center text-xs font-bold text-[#0D233A]">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <span>Secured by</span>
                <span className="font-semibold text-white">paystack</span>
                <Lock className="w-3 h-3 text-[#00C3F7]" />
              </div>
              <div className="text-[11px] text-white/50 truncate max-w-[200px]">
                {merchantName || (agentName ? `Setlla • ${agentName}` : 'Setlla Ad Sponsorship')}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-white/70">Amount Due</div>
            <div className="text-base font-bold text-white tracking-wide">
              {formatNaira(amount)}
            </div>
          </div>
        </div>

        {/* User Context Strip */}
        <div className="bg-[#FCF9F5] px-4 py-2 border-b border-[#E5E7EB] flex items-center justify-between text-xs text-[#70798C]">
          <span className="truncate max-w-[200px]">{applicantEmail || 'partner@setlla.com'}</span>
          <span className="font-medium text-[#342A21]">{purposeTitle || 'Advert Placement Sponsorship'}</span>
        </div>

        {/* Payment Methods Nav */}
        <div className="flex border-b border-[#E5E7EB] bg-white">
          <button
            onClick={() => setActiveTab('card')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'card'
                ? 'border-[#342A21] text-[#342A21] bg-[#342A21]/5'
                : 'border-transparent text-[#70798C] hover:text-[#000004]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Card
          </button>
          <button
            onClick={() => setActiveTab('bank')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'bank'
                ? 'border-[#342A21] text-[#342A21] bg-[#342A21]/5'
                : 'border-transparent text-[#70798C] hover:text-[#000004]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Transfer
          </button>
          <button
            onClick={() => setActiveTab('ussd')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'ussd'
                ? 'border-[#342A21] text-[#342A21] bg-[#342A21]/5'
                : 'border-transparent text-[#70798C] hover:text-[#000004]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            USSD
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 flex-1 min-h-[260px] flex flex-col justify-between">
          {/* TAB 1: CARD */}
          {activeTab === 'card' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#70798C]">
                  Card Details (Verve, Mastercard, Visa)
                </label>
                <span className="text-[11px] text-[#70798C] font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  256-bit Encrypted
                </span>
              </div>

              <div>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="0000 0000 0000 0000"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#000004] font-mono focus:outline-none focus:border-[#342A21] focus:ring-1 focus:ring-[#342A21]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#70798C] block mb-1">Expiry</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM / YY"
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm text-[#000004] font-mono focus:outline-none focus:border-[#342A21]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#70798C] block mb-1">CVV</label>
                  <input
                    type="password"
                    maxLength={3}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="123"
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm text-[#000004] font-mono focus:outline-none focus:border-[#342A21]"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#FCF9F5] border border-[#E5E7EB] text-[11px] text-[#70798C] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#342A21] shrink-0" />
                <span>Zero Risk: Held in Delta Escrow until physical inspection takes place.</span>
              </div>
            </div>
          )}

          {/* TAB 2: BANK TRANSFER */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#342A21]/5 border border-[#342A21]/20 text-center">
                <div className="text-xs text-[#70798C]">Transfer exactly</div>
                <div className="text-xl font-bold text-[#000004] font-display">
                  {formatNaira(amount)}
                </div>
                <div className="text-xs text-[#70798C] mt-0.5">
                  to the dedicated Wema / Titan Bank checkout account below:
                </div>
              </div>

              <div className="p-3 rounded-lg border border-[#E5E7EB] bg-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#70798C]">Bank:</span>
                  <span className="font-semibold text-[#000004]">Wema Bank / Titan Trust</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#70798C]">Account Number:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm text-[#000004]">
                      0293810291
                    </span>
                    <button
                      onClick={handleCopyAccount}
                      className="text-[#342A21] hover:text-[#251E17] p-1"
                      title="Copy account number"
                    >
                      {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#70798C]">Beneficiary:</span>
                  <span className="font-semibold text-[#000004]">Setlla Escrow Ltd</span>
                </div>
              </div>

              <div className="text-[11px] text-center text-[#70798C]">
                Expires in <span className="font-mono font-bold text-[#000004]">29:45</span> minutes. Automatic confirmation.
              </div>
            </div>
          )}

          {/* TAB 3: USSD */}
          {activeTab === 'ussd' && (
            <div className="space-y-4">
              <label className="text-xs font-medium text-[#70798C] block">
                Select your Nigerian Bank
              </label>
              <CustomDropdown
                options={BANK_OPTIONS}
                value={selectedBank}
                onChange={(val) => setSelectedBank(val)}
                headerTitle="Select Nigerian Bank"
                variant="form"
              />

              <div className="p-4 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] text-center">
                <div className="text-xs text-[#70798C]">Dial this code on your mobile phone:</div>
                <div className="font-mono text-base font-bold text-[#342A21] my-1.5 select-all">
                  *737*000*2500#
                </div>
                <div className="text-[11px] text-[#70798C]">
                  Authenticate with your 4-digit USSD security PIN
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-5 pt-3 border-t border-[#E5E7EB] space-y-2">
            <button
              onClick={() => {
                const method = activeTab === 'card' ? 'Card' : activeTab === 'bank' ? 'Bank Transfer' : 'USSD';
                handleSimulatePayment(method);
              }}
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-lg bg-[#00C3F7] hover:bg-[#00a8d4] text-[#0D233A] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0D233A]" />
                  <span>Settling with Paystack NIBSS...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Pay {formatNaira(amount)} & Unlock Contact</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="w-full py-2 text-xs text-[#70798C] hover:text-[#000004] transition-colors"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
