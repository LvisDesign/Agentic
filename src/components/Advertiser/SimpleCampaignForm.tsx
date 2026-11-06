import React from 'react';
import {
  CheckCircle2,
  Wallet,
  Plus,
  Upload,
  Globe,
  X,
  ImageIcon,
  Film,
  AlertCircle,
  MapPin,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
import { AdminCustomSelect } from '../UI/AdminCustomSelect';
import { calculateCampaignCost } from './AdvertiserDashboard';

const QUICK_DURATIONS = [
  { days: 1, label: '1 Day' },
  { days: 3, label: '3 Days' },
  { days: 7, label: '7 Days', popular: true },
  { days: 14, label: '14 Days' },
  { days: 30, label: '30 Days' },
  { days: 90, label: '90 Days' },
];

interface SimpleCampaignFormProps {
  companyName: string;
  walletBalance: number;
  adDurationDays: number;
  manualDaysInput: string;
  onSelectDuration: (days: number) => void;
  onManualDaysChange: (val: string) => void;
  onManualDaysBlur: () => void;
  headline: string;
  setHeadline: (val: string) => void;
  category: 'Property' | 'Estate' | 'Promo' | 'Service';
  setCategory: (val: 'Property' | 'Estate' | 'Promo' | 'Service') => void;
  location: string;
  setLocation: (val: string) => void;
  price: string;
  setPrice: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  mediaSourceMode: 'upload' | 'url';
  setMediaSourceMode: (val: 'upload' | 'url') => void;
  mediaUrl: string;
  setMediaUrl: (val: string) => void;
  mediaType: 'image' | 'video';
  setMediaType: (val: 'image' | 'video') => void;
  isUploadingMedia: boolean;
  uploadedFileName: string | null;
  setUploadedFileName: (val: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClearMedia: () => void;
  actionType: 'website' | 'contact' | 'property';
  setActionType: (val: 'website' | 'contact' | 'property') => void;
  ctaText: string;
  setCtaText: (val: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (val: string) => void;
  whatsappNumber: string;
  setWhatsappNumber: (val: string) => void;
  formError: string | null;
  isSubmitting: boolean;
  submissionSuccess: string | null;
  submittedCampaignDetails: { cost: number; days: number; ref: string } | null;
  onResetSuccess: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onOpenTopUp: (shortfall: number) => void;
}

export const SimpleCampaignForm: React.FC<SimpleCampaignFormProps> = ({
  companyName,
  walletBalance,
  adDurationDays,
  manualDaysInput,
  onSelectDuration,
  onManualDaysChange,
  onManualDaysBlur,
  headline,
  setHeadline,
  category,
  setCategory,
  location,
  setLocation,
  price,
  setPrice,
  description,
  setDescription,
  mediaSourceMode,
  setMediaSourceMode,
  mediaUrl,
  setMediaUrl,
  mediaType,
  setMediaType,
  isUploadingMedia,
  uploadedFileName,
  setUploadedFileName,
  fileInputRef,
  handleFileUpload,
  handleClearMedia,
  actionType,
  setActionType,
  ctaText,
  setCtaText,
  websiteUrl,
  setWebsiteUrl,
  whatsappNumber,
  setWhatsappNumber,
  formError,
  isSubmitting,
  submissionSuccess,
  submittedCampaignDetails,
  onResetSuccess,
  onSubmit,
  onOpenTopUp,
}) => {
  const pricing = calculateCampaignCost(adDurationDays);
  const campaignCost = pricing.totalCost;
  const isBalanceInsufficient = walletBalance < campaignCost;
  const balanceShortfall = Math.max(0, campaignCost - walletBalance);

  if (submissionSuccess) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-card text-center space-y-4 max-w-md mx-auto animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-display text-lg font-bold text-[#000004]">Campaign Submitted!</h4>
          <p className="text-xs text-[#70798C] mt-1">
            Your campaign is queued for quick admin approval before going live on the feed.
          </p>
        </div>

        <div className="p-3.5 bg-[#FCF9F5] rounded-2xl border border-[#E5E7EB] text-left text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[#70798C]">Reference</span>
            <code className="font-mono font-bold text-[#342A21]">{submissionSuccess}</code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#70798C]">Amount Paid</span>
            <span className="font-bold text-[#000004] font-mono">
              ₦{(submittedCampaignDetails?.cost || campaignCost).toLocaleString()} ({submittedCampaignDetails?.days || adDurationDays}d)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#70798C]">Wallet Balance</span>
            <span className="font-bold text-emerald-800 font-mono">
              ₦{walletBalance.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetSuccess}
          className="w-full py-2.5 px-5 rounded-xl bg-[#342A21] hover:bg-[#000004] text-[#FCF9F5] text-xs font-bold cursor-pointer transition-colors"
        >
          View My Campaigns
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-7 border border-[#E5E7EB] shadow-card max-w-2xl mx-auto animate-fade-in">
      {/* Compact Header */}
      <div className="pb-4 border-b border-[#E5E7EB]">
        <h3 className="font-display text-lg sm:text-xl font-bold text-[#000004]">
          New Ad Campaign
        </h3>
        <p className="text-[11px] text-[#70798C]">
          Posting as <strong className="text-[#342A21]">{companyName}</strong>
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 pt-4 text-xs">
        {/* 1. Simple Duration Picker */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#000004]">
              1. Choose Duration
            </label>
            <div className="flex items-center gap-1.5 text-[11px] text-[#70798C]">
              <span>Custom:</span>
              <input
                type="number"
                min="1"
                max="365"
                value={manualDaysInput}
                onChange={(e) => onManualDaysChange(e.target.value)}
                onBlur={onManualDaysBlur}
                className="w-14 px-2 py-1 rounded-lg border border-[#E5E7EB] bg-[#FCF9F5] text-center font-bold text-[#000004] focus:outline-none focus:border-[#342A21]"
              />
              <span>days</span>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {QUICK_DURATIONS.map((preset) => {
              const isSelected = adDurationDays === preset.days;
              const cost = calculateCampaignCost(preset.days).totalCost;
              return (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => onSelectDuration(preset.days)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#342A21] border-[#342A21] text-[#FCF9F5] shadow-xs'
                      : 'bg-[#FCF9F5] border-[#E5E7EB] text-[#000004] hover:border-[#342A21]/40'
                  }`}
                >
                  <span className="text-[11px] font-bold block">{preset.label}</span>
                  <span
                    className={`text-[11px] font-mono font-bold mt-1 block ${
                      isSelected ? 'text-[#FCF9F5]/90' : 'text-[#70798C]'
                    }`}
                  >
                    ₦{cost.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Ad Details */}
        <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
          <label className="text-xs font-bold text-[#000004] block">
            2. Ad Details
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="text-[11px] font-semibold text-[#70798C] block mb-1">
                Headline *
              </label>
              <input
                type="text"
                required
                maxLength={65}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. 24/7 Solar Power for Modern Homes"
                className="w-full px-3 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
              />
            </div>

            <div className="min-w-0">
              <label className="text-[11px] font-semibold text-[#70798C] block mb-1">
                Category
              </label>
              <AdminCustomSelect
                value={category}
                onChange={(val) => setCategory(val as any)}
                options={[
                  { value: 'Promo', label: 'Brand / Promo' },
                  { value: 'Property', label: 'Property Rental' },
                  { value: 'Estate', label: 'Estate Development' },
                  { value: 'Service', label: 'Home Service' },
                ]}
                variant="form"
              />
            </div>

            <div className="min-w-0">
              <label className="text-[11px] font-semibold text-[#70798C] block mb-1">
                Target City
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Asaba, Warri, Network Wide"
                  className="w-full pl-8 pr-3 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                {['Network Wide', 'Asaba', 'Warri', 'Effurun', 'Lagos'].map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(loc)}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                      location === loc
                        ? 'bg-[#342A21] text-[#FCF9F5] border-[#342A21]'
                        : 'bg-[#FCF9F5] border-[#E5E7EB] text-[#70798C] hover:text-[#000004]'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              <label className="text-[11px] font-semibold text-[#70798C] block mb-1">
                Price or Offer Badge <span className="font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. From ₦45,000 or 20% Off"
                  className="w-full pl-8 pr-3 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-[#70798C] block mb-1">
                Short Description <span className="font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe your offer..."
                className="w-full px-3 py-2 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
              />
            </div>
          </div>
        </div>

        {/* 3. Creative Media */}
        <div className="space-y-2.5 pt-3 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#000004]">
              3. Photo or Video *
            </label>
            <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-[#FCF9F5] p-0.5">
              <button
                type="button"
                onClick={() => setMediaSourceMode('upload')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  mediaSourceMode === 'upload'
                    ? 'bg-white text-[#342A21] shadow-2xs'
                    : 'text-[#70798C]'
                }`}
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => setMediaSourceMode('url')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  mediaSourceMode === 'url'
                    ? 'bg-white text-[#342A21] shadow-2xs'
                    : 'text-[#70798C]'
                }`}
              >
                Link
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {mediaSourceMode === 'upload' ? (
            !mediaUrl ? (
              <div
                onClick={() => !isUploadingMedia && fileInputRef.current?.click()}
                className="p-5 rounded-2xl border-2 border-dashed border-[#E5E7EB] hover:border-[#342A21]/40 bg-[#FCF9F5] hover:bg-[#F6F3EF] transition-all cursor-pointer text-center"
              >
                {isUploadingMedia ? (
                  <div className="py-2 space-y-1.5">
                    <div className="w-6 h-6 border-2 border-[#342A21] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-[#342A21]">Optimizing media...</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#342A21]">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-[#000004]">
                      Tap to upload flyer, photo, or video
                    </p>
                    <p className="text-[11px] text-[#70798C]">JPG, PNG, or MP4 (up to 50MB)</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-[#FCF9F5] border border-[#E5E7EB] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-black shrink-0">
                    {mediaType === 'video' ? (
                      <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#000004] truncate block">
                      {uploadedFileName || 'Creative Ready'}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      ✓ Attached ({mediaType.toUpperCase()})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[11px] font-semibold text-[#342A21] cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleClearMedia}
                    className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#70798C] hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  required
                  value={mediaUrl}
                  onChange={(e) => {
                    setMediaUrl(e.target.value);
                    setUploadedFileName(null);
                  }}
                  placeholder="https://... image or MP4 link"
                  className="flex-1 min-w-0 px-3 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-mono text-[#000004] focus:outline-none focus:border-[#342A21]"
                />
                <button
                  type="button"
                  onClick={() => setMediaType(mediaType === 'image' ? 'video' : 'image')}
                  className="px-3 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-[11px] font-bold text-[#342A21] flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {mediaType === 'image' ? <ImageIcon className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />}
                  <span>{mediaType === 'image' ? 'Image' : 'Video'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Lead Destination */}
        <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#000004]">
              4. Where should leads go?
            </label>
            <div className="inline-flex rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] p-0.5">
              <button
                type="button"
                onClick={() => {
                  setActionType('contact');
                  setCtaText('Chat on WhatsApp');
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  actionType === 'contact'
                    ? 'bg-[#342A21] text-[#FCF9F5]'
                    : 'text-[#70798C]'
                }`}
              >
                <WhatsAppIcon className="w-3 h-3" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionType('website');
                  setCtaText('Visit Website');
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  actionType === 'website'
                    ? 'bg-[#342A21] text-[#FCF9F5]'
                    : 'text-[#70798C]'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Website</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {actionType === 'website' ? (
              <div className="min-w-0">
                <label className="text-[11px] font-semibold text-[#70798C] block mb-1">
                  Website Link *
                </label>
                <input
                  type="url"
                  required
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourbusiness.com"
                  className="w-full px-3 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                />
              </div>
            ) : (
              <div className="min-w-0">
                <label className="text-[11px] font-semibold text-[#70798C] block mb-1">
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="w-full px-3 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                />
              </div>
            )}

            <div className="min-w-0">
              <label className="text-[11px] font-semibold text-[#70798C] block mb-1">
                Button Text
              </label>
              <input
                type="text"
                required
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder={actionType === 'website' ? 'Visit Website' : 'Chat on WhatsApp'}
                className="w-full px-3 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
              />
            </div>
          </div>
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Clean Pinned Summary & Action Footer */}
        <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-bold text-[#000004] font-mono">
              ₦{campaignCost.toLocaleString()}
            </span>
            <span className="text-xs text-[#70798C]">
              for {adDurationDays} {adDurationDays === 1 ? 'day' : 'days'} (~₦{pricing.dailyRate.toLocaleString()}/day)
            </span>
          </div>

          {!isBalanceInsufficient ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#342A21] hover:bg-[#000004] text-[#FCF9F5] text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 transition-all active:scale-95 whitespace-nowrap"
            >
              <span>{isSubmitting ? 'Publishing...' : 'Launch Campaign'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenTopUp(balanceShortfall > 5000 ? balanceShortfall : 5000)}
              className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#342A21] hover:bg-[#000004] text-[#FCF9F5] text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Top Up ₦{balanceShortfall.toLocaleString()} & Launch</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

