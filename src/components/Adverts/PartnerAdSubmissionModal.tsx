import React, { useState, useRef } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Check,
  Upload,
  Plus,
  ImageIcon,
  Film,
  AlertCircle,
  Globe,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
import { submitPartnerAdvert, PartnerSubmissionPayload } from '../../services/adService';
import { AdvertStory } from '../../data/mockAdverts';
import { AdminCustomSelect } from '../UI/AdminCustomSelect';
import { processUploadedFile } from '../../utils/mediaStorage';
import { PaystackModal } from '../Booking/PaystackModal';

interface PartnerAdSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmissionSuccess?: (ad: AdvertStory) => void;
  onOpenFullPage?: () => void;
}

export const PartnerAdSubmissionModal: React.FC<PartnerAdSubmissionModalProps> = ({
  isOpen,
  onClose,
  onSubmissionSuccess,
  onOpenFullPage,
}) => {
  const [packageTier, setPackageTier] = useState<'starter' | 'growth' | 'corporate'>('growth');
  const [companyName, setCompanyName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<'Property' | 'Estate' | 'Promo' | 'Service'>('Promo');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('All Regions (Network-Wide)');
  const [price, setPrice] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [actionType, setActionType] = useState<'website' | 'contact' | 'property'>('website');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [ctaText, setCtaText] = useState('Visit Website');
  const [showPaystackModal, setShowPaystackModal] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    trackingRef: string;
    advert: AdvertStory;
    paymentRef?: string;
    paymentMethod?: string;
  } | null>(null);

  const [mediaSourceMode, setMediaSourceMode] = useState<'upload' | 'url'>('upload');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setFormError('The selected file exceeds the 50MB limit.');
      return;
    }

    setIsUploadingMedia(true);
    setFormError(null);
    try {
      const processed = await processUploadedFile(file, 0);
      setMediaUrl(processed.url);
      setMediaType(processed.type);
      setUploadedFileName(file.name);
    } catch (err) {
      console.error('Failed to process creative asset:', err);
      setFormError('Failed to upload file. Please verify format and try again.');
    } finally {
      setIsUploadingMedia(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleMediaPreset = (url: string, type: 'image' | 'video' = 'image') => {
    setMediaUrl(url);
    setMediaType(type);
    setUploadedFileName(null);
  };

  const handleClearMedia = () => {
    setMediaUrl('');
    setUploadedFileName(null);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const TIERS = [
    {
      id: 'starter' as const,
      name: 'Starter Spotlight',
      durationDays: 7,
      price: '₦15,000',
      budgetAmount: 15000,
      badge: '7-Day Plan',
      features: ['Feed Stories Tray Rotation', 'Click & WhatsApp Lead Routing', 'Basic Impression Analytics'],
    },
    {
      id: 'growth' as const,
      name: 'Growth Partner',
      durationDays: 30,
      price: '₦45,000',
      budgetAmount: 45000,
      badge: 'Most Popular',
      popular: true,
      features: [
        'Feed Stories + Desktop Pinned Banner',
        'Featured Partner Placement',
        'Priority Region Targeting',
        'Weekly Campaign Analytics Report',
      ],
    },
    {
      id: 'corporate' as const,
      name: 'Corporate Leader',
      durationDays: 90,
      price: '₦120,000',
      budgetAmount: 120000,
      badge: '90 Days VIP',
      features: [
        'Permanent Top Feed Placement',
        'Direct WhatsApp Lead Routing',
        'Network-Wide Feed Broadcast',
        'Custom CTA + Direct Listing Integration',
      ],
    },
  ];

  const currentTier = TIERS.find((t) => t.id === packageTier) || TIERS[1];

  const handleOpenPage = () => {
    onClose();
    if (onOpenFullPage) {
      onOpenFullPage();
    } else {
      window.location.hash = '#/partner';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!companyName || !headline || !partnerEmail || !mediaUrl) {
      setFormError('Please fill in your company name, headline, contact email, and media URL.');
      return;
    }

    // Lead directly to Paystack payment gateway
    setShowPaystackModal(true);
  };

  const handlePaystackSuccess = async (paymentReference: string, paymentMethod: 'Card' | 'Bank Transfer' | 'USSD') => {
    setShowPaystackModal(false);
    setIsSubmitting(true);
    setFormError(null);
    try {
      const payload: PartnerSubmissionPayload = {
        companyName,
        headline,
        description,
        category,
        mediaUrl,
        mediaType,
        ctaText,
        actionType,
        websiteUrl: actionType === 'website' ? websiteUrl : undefined,
        whatsappNumber: actionType === 'contact' ? whatsappNumber : whatsappNumber || undefined,
        phone,
        location,
        price: price ? price : undefined,
        partnerEmail,
        packageTier,
        durationDays: currentTier.durationDays,
        budgetAmount: currentTier.budgetAmount,
        paymentReference,
        paymentMethod,
      };

      const result = await submitPartnerAdvert(payload);
      setSubmittedResult({
        trackingRef: result.trackingRef,
        advert: result.advert,
        paymentRef: paymentReference,
        paymentMethod,
      });
      if (onSubmissionSuccess) {
        onSubmissionSuccess(result.advert);
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setFormError('Payment confirmed, but could not register campaign. Please contact support with payment ref: ' + paymentReference);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto font-body">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-card border border-[#342A21]/15 overflow-hidden my-auto animate-scale-up">
        {/* Modal Top Header: Warm Ivory & Serif Typography */}
        <div className="relative bg-[#FCF9F5] p-4 sm:p-8 border-b border-[#342A21]/10">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full bg-[#342A21]/5 text-[#342A21] border border-[#342A21]/15 text-xs font-semibold whitespace-nowrap">
              <span>Setlla Partner Desk</span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#F6F3EF] border border-[#E5E7EB] text-[#70798C] hover:text-[#342A21] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl text-[#342A21] font-normal tracking-tight mt-3">
            Put your brand in front of <em className="italic font-normal">active renters & property investors.</em>
          </h2>
          <p className="text-xs sm:text-sm text-[#70798C] mt-1.5 max-w-xl leading-relaxed">
            Broadcast your business, developments, solar solutions, or services directly on Setlla's high-traffic rental feed.
          </p>

          {/* Quick value stats */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-[#342A21]/10 text-center">
            <div>
              <span className="text-base sm:text-xl font-bold text-[#342A21]">50,000+</span>
              <span className="text-[11px] text-[#70798C] block">Monthly Viewers</span>
            </div>
            <div>
              <span className="text-base sm:text-xl font-bold text-[#342A21]">1-Click</span>
              <span className="text-[11px] text-[#70798C] block">WhatsApp Leads</span>
            </div>
            <div>
              <span className="text-base sm:text-xl font-bold text-[#342A21]">High Intent</span>
              <span className="text-[11px] text-[#70798C] block">Renters & Investors</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        {submittedResult ? (
          <div className="p-6 sm:p-10 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold inline-block mb-2 border border-emerald-200">
                Submission Received · Pending Priority Desk Review
              </span>
              <h3 className="font-display text-xl sm:text-2xl text-[#342A21] font-normal">Campaign Submitted Successfully!</h3>
              <p className="text-xs sm:text-sm text-[#70798C] mt-1.5 max-w-md mx-auto">
                Your campaign <strong className="text-[#342A21]">"{submittedResult.advert.headline}"</strong> has been logged with reference:
              </p>
              <div className="mt-3 p-3.5 bg-[#FCF9F5] rounded-2xl border border-[#E5E7EB] text-left text-xs space-y-2 max-w-sm mx-auto">
                <div className="flex justify-between items-center pb-2 border-b border-[#E5E7EB]">
                  <span className="text-[#70798C]">Setlla Reference:</span>
                  <code className="font-mono font-bold text-[#342A21]">{submittedResult.trackingRef}</code>
                </div>
                {submittedResult.paymentRef && (
                  <div className="flex justify-between items-center pb-2 border-b border-[#E5E7EB]">
                    <span className="text-[#70798C]">Paystack Reference:</span>
                    <code className="font-mono font-bold text-emerald-700">{submittedResult.paymentRef}</code>
                  </div>
                )}
                {submittedResult.paymentMethod && (
                  <div className="flex justify-between items-center pb-2 border-b border-[#E5E7EB]">
                    <span className="text-[#70798C]">Payment Method:</span>
                    <span className="font-semibold text-[#342A21]">{submittedResult.paymentMethod} (Verified)</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[#70798C]">Payment Status:</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                    ✓ Paid via Paystack
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#FCF9F5] border border-[#E5E7EB] rounded-2xl p-4 max-w-md mx-auto text-left text-xs text-[#342A21] space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-[#342A21]">
                <Clock className="w-4 h-4 text-[#B45309]" />
                <span>Next Step: Priority Creative Verification</span>
              </div>
              <p className="text-[#70798C] text-[11px] leading-relaxed">
                Our partnership desk reviews creatives within 1 hour. You can message our desk on WhatsApp with your reference number for instant campaign activation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={`https://wa.me/2348000000000?text=${encodeURIComponent(
                  `Hello Setlla Team, I submitted an ad campaign with Ref: ${submittedResult.trackingRef} for ${submittedResult.advert.advertiserName}. Please review and activate.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Chat Ad Support on WhatsApp</span>
              </a>

              <button
                onClick={onClose}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#FCF9F5] hover:bg-[#F6F3EF] border border-[#E5E7EB] text-[#342A21] text-xs font-semibold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-5 sm:space-y-6 max-h-[70vh] sm:max-h-[65vh] overflow-y-auto">
            {/* Step 1: Package Selection */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#70798C] block mb-3">
                1. Select Campaign Duration & Package
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TIERS.map((tier) => {
                  const isSelected = packageTier === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setPackageTier(tier.id)}
                      className={`relative rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#342A21] bg-white ring-2 ring-[#342A21]/15 shadow-subtle'
                          : 'border-[#E5E7EB] hover:border-[#342A21]/30 bg-[#FCF9F5]'
                      }`}
                    >
                      {tier.popular && (
                        <span className="absolute -top-2.5 right-3 bg-[#342A21] text-[#FCF9F5] text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full shadow-xs">
                          {tier.badge}
                        </span>
                      )}
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-display font-medium text-xs text-[#342A21]">{tier.name}</h4>
                          {isSelected && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                        </div>
                        <div className="mt-1">
                          <span className="text-lg font-bold text-[#342A21]">{tier.price}</span>
                          <span className="text-[10px] text-[#70798C]"> / {tier.durationDays} days</span>
                        </div>
                      </div>

                      <ul className="mt-3 space-y-1 text-[11px] text-[#70798C] border-t border-[#E5E7EB] pt-2.5">
                        {tier.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-emerald-700 font-bold">✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Advertiser Contact Info */}
            <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#70798C] block">
                2. Business & Contact Information
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1">Company / Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Asaba Royal Suites"
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1">Official Business Email *</label>
                  <input
                    type="email"
                    required
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    placeholder="partners@yourbrand.ng"
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1">WhatsApp Business Number *</label>
                  <input
                    type="text"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. 08012345678"
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1">Alternate Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 08123456789"
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Campaign Content & Creative */}
            <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#70798C] block">
                3. Campaign Copy & Creative Assets
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1">Campaign Headline *</label>
                  <input
                    type="text"
                    required
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. 20% Off Fully Furnished Shortlet"
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1">Category</label>
                  <AdminCustomSelect
                    value={category}
                    onChange={(val) => setCategory(val as any)}
                    options={[
                      { value: 'Property', label: 'Property Rental' },
                      { value: 'Estate', label: 'Estate & Real Estate' },
                      { value: 'Promo', label: 'Promo & Brand Campaign' },
                      { value: 'Service', label: 'Service (Solar, Interior, Moving)' },
                    ]}
                    variant="form"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#342A21] block mb-1">Offer Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your special offer, pricing discount, or why renters should choose your company..."
                  className="w-full px-3.5 py-2 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                />
              </div>

              {/* Media Upload & Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#342A21] block">
                    Creative Image / Video Media *
                  </label>
                  <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-[#FCF9F5] p-0.5">
                    <button
                      type="button"
                      onClick={() => setMediaSourceMode('upload')}
                      className={`px-2.5 py-0.5 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                        mediaSourceMode === 'upload'
                          ? 'bg-white text-[#342A21] shadow-2xs font-semibold'
                          : 'text-[#70798C] hover:text-[#342A21]'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaSourceMode('url')}
                      className={`px-2.5 py-0.5 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                        mediaSourceMode === 'url'
                          ? 'bg-white text-[#342A21] shadow-2xs font-semibold'
                          : 'text-[#70798C] hover:text-[#342A21]'
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      <span>URL</span>
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
                  <div className="space-y-2.5">
                    <div
                      onClick={() => !isUploadingMedia && fileInputRef.current?.click()}
                      className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${
                        isUploadingMedia
                          ? 'bg-amber-50/60 border-amber-300 cursor-wait'
                          : 'bg-[#FCF9F5] hover:bg-[#F6F3EF] border-[#E5E7EB] hover:border-[#342A21]/40'
                      }`}
                    >
                      {isUploadingMedia ? (
                        <div className="py-3 space-y-2">
                          <div className="w-6 h-6 border-2 border-[#342A21] border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-xs font-semibold text-[#342A21]">Uploading media asset...</p>
                        </div>
                      ) : (
                        <div className="py-1 space-y-1.5">
                          <Upload className="w-6 h-6 text-[#342A21] mx-auto" />
                          <p className="text-xs font-bold text-[#342A21]">Click to upload photo or video from device</p>
                          <p className="text-[10px] text-[#70798C]">JPG, PNG, WEBP or MP4 (up to 50MB · 9:16 or 16:9)</p>
                        </div>
                      )}
                    </div>

                    {mediaUrl && (
                      <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-black shrink-0 relative flex items-center justify-center">
                          {mediaType === 'video' ? (
                            <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />
                          ) : (
                            <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                          )}
                          <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-bold px-1 rounded">
                            {mediaType === 'video' ? 'VIDEO' : 'IMAGE'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-[#342A21] block truncate">
                            {uploadedFileName || 'Uploaded Creative Asset'}
                          </span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                            ✓ Ready
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-medium text-[#342A21] cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="url"
                      required
                      value={mediaUrl}
                      onChange={(e) => {
                        setMediaUrl(e.target.value);
                        setUploadedFileName(null);
                      }}
                      placeholder="https://... image or video URL (9:16 or 16:9)"
                      className="w-full px-3.5 py-2 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004] font-mono focus:outline-none focus:border-[#342A21]"
                    />

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-[#70798C]">Sample Presets:</span>
                      <button
                        type="button"
                        onClick={() => handleMediaPreset('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1080&q=80')}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-[#FCF9F5] border border-[#E5E7EB] hover:bg-[#F6F3EF] text-[#342A21] font-medium cursor-pointer"
                      >
                        Penthouse
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMediaPreset('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1080&q=80')}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-[#FCF9F5] border border-[#E5E7EB] hover:bg-[#F6F3EF] text-[#342A21] font-medium cursor-pointer"
                      >
                        Estate Villa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMediaPreset('https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1080&q=80')}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-[#FCF9F5] border border-[#E5E7EB] hover:bg-[#F6F3EF] text-[#342A21] font-medium cursor-pointer"
                      >
                        Solar Power
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Type & CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1">Target Action</label>
                  <AdminCustomSelect
                    value={actionType}
                    onChange={(val) => {
                      setActionType(val as any);
                      if (val === 'website') setCtaText('Visit Website');
                      else setCtaText('Contact on WhatsApp');
                    }}
                    options={[
                      { value: 'website', label: 'Send to Website' },
                      { value: 'contact', label: 'Direct WhatsApp Chat' },
                    ]}
                    variant="form"
                  />
                </div>

                {actionType === 'website' && (
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-[#342A21] block mb-1">Destination Website URL</label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://yourbrand.ng/promo"
                      className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Form Error Banner */}
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {formError}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-5 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-[#70798C] uppercase tracking-wider block">Total Campaign Fee:</span>
                <span className="text-lg font-bold text-[#342A21]">{currentTier.price}</span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#70798C] hover:text-[#342A21] cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>Proceed to Pay {currentTier.price} via Paystack</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Paystack Checkout Gateway Modal */}
      <PaystackModal
        isOpen={showPaystackModal}
        onClose={() => setShowPaystackModal(false)}
        amount={currentTier.budgetAmount}
        applicantEmail={partnerEmail}
        applicantName={companyName}
        applicantPhone={whatsappNumber || phone}
        merchantName="Setlla Media & Ads Network"
        purposeTitle={`Campaign Ad · ${currentTier.name} (${currentTier.durationDays} Days)`}
        buttonText={`Pay ${currentTier.price} & Submit Campaign`}
        onSuccess={handlePaystackSuccess}
      />
    </div>
  );
};
