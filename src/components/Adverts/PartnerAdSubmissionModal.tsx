import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Megaphone, 
  CheckCircle2, 
  ShieldCheck, 
  Globe, 
  MessageSquare, 
  Phone, 
  ArrowRight, 
  TrendingUp, 
  Zap, 
  Building2, 
  FileText,
  Clock,
  Layers,
  Check
} from 'lucide-react';
import { submitPartnerAdvert, PartnerSubmissionPayload } from '../../services/adService';
import { AdvertStory } from '../../data/mockAdverts';

interface PartnerAdSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmissionSuccess?: (ad: AdvertStory) => void;
}

export const PartnerAdSubmissionModal: React.FC<PartnerAdSubmissionModalProps> = ({
  isOpen,
  onClose,
  onSubmissionSuccess,
}) => {
  const [packageTier, setPackageTier] = useState<'starter' | 'growth' | 'corporate'>('growth');
  const [companyName, setCompanyName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<'Property' | 'Estate' | 'Promo' | 'Service'>('Promo');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('All Delta State (Asaba, Warri, Abraka)');
  const [price, setPrice] = useState('');
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1080&q=80');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [actionType, setActionType] = useState<'website' | 'contact' | 'property'>('website');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [ctaText, setCtaText] = useState('Visit Website');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{ trackingRef: string; advert: AdvertStory } | null>(null);

  if (!isOpen) return null;

  const TIERS = [
    {
      id: 'starter' as const,
      name: 'Starter Spotlight',
      durationDays: 7,
      price: '₦15,000',
      budgetAmount: 15000,
      badge: '7 Days',
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
        'Verified Partner Blue Badge',
        'Priority Delta Region Targeting',
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
        'Dedicated WhatsApp Concierge Routing',
        'All Delta Cities Broadcast',
        'Custom CTA + Direct Listing Integration',
      ],
    },
  ];

  const currentTier = TIERS.find((t) => t.id === packageTier) || TIERS[1];

  const handleMediaPreset = (url: string, type: 'image' | 'video' = 'image') => {
    setMediaUrl(url);
    setMediaType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !headline || !partnerEmail || !mediaUrl) {
      alert('Please fill in your company name, headline, contact email, and media URL.');
      return;
    }

    setIsSubmitting(true);
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
      };

      const result = await submitPartnerAdvert(payload);
      setSubmittedResult({ trackingRef: result.trackingRef, advert: result.advert });
      if (onSubmissionSuccess) {
        onSubmissionSuccess(result.advert);
      }
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Could not submit ad. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scale-up">
        {/* Modal Top Header */}
        <div className="relative bg-[#000004] text-white p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Setlla Partner & Advertiser Portal</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Put Your Brand in Front of 50,000+ Delta State Renters
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Broadcast your business, estate developments, interior decor, or service directly on Setlla's high-traffic rental feed across Asaba, Warri, and Abraka.
          </p>

          {/* Quick value stats */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/10 text-center">
            <div>
              <span className="text-base sm:text-xl font-black text-amber-400">50K+</span>
              <span className="text-[10px] sm:text-xs text-slate-300 block">Monthly Views</span>
            </div>
            <div>
              <span className="text-base sm:text-xl font-black text-emerald-400">1-Click</span>
              <span className="text-[10px] sm:text-xs text-slate-300 block">WhatsApp Leads</span>
            </div>
            <div>
              <span className="text-base sm:text-xl font-black text-white">Delta Wide</span>
              <span className="text-[10px] sm:text-xs text-slate-300 block">Asaba · Warri · Abraka</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        {submittedResult ? (
          <div className="p-6 sm:p-10 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold inline-block mb-2">
                Submission Received · Pending Super Admin Review
              </span>
              <h3 className="text-xl font-bold text-[#000004]">Campaign Submitted Successfully!</h3>
              <p className="text-xs sm:text-sm text-[#70798C] mt-2 max-w-md mx-auto">
                Your campaign <span className="font-bold text-[#000004]">"{submittedResult.advert.headline}"</span> has been logged with reference:
              </p>
              <div className="mt-3 inline-block bg-[#FCF9F5] border border-dashed border-[#E5E7EB] px-4 py-2 rounded-xl text-sm font-mono font-bold text-[#000004]">
                {submittedResult.trackingRef}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 max-w-md mx-auto text-left text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Next Step: Fast-Track Verification</span>
              </div>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Our admin desk typically reviews ad creatives within 1 hour. You can message our ad concierge on WhatsApp with your reference number for instant broadcast.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={`https://wa.me/2348000000000?text=${encodeURIComponent(
                  `Hello Setlla Team, I submitted an ad campaign with Ref: ${submittedResult.trackingRef} for ${submittedResult.advert.advertiserName}. Please review and activate.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Ad Concierge on WhatsApp</span>
              </a>

              <button
                onClick={onClose}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#000004] text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[65vh] overflow-y-auto">
            {/* Step 1: Package Selection */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#70798C] block mb-3">
                1. Select Campaign Flight Duration & Package
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
                          ? 'border-[#000004] bg-slate-50 ring-2 ring-[#000004]/10 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {tier.popular && (
                        <span className="absolute -top-2.5 right-3 bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                          {tier.badge}
                        </span>
                      )}
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-[#000004]">{tier.name}</h4>
                          {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                        <div className="mt-1">
                          <span className="text-lg font-black text-[#000004]">{tier.price}</span>
                          <span className="text-[10px] text-[#70798C]"> / {tier.durationDays} days</span>
                        </div>
                      </div>

                      <ul className="mt-3 space-y-1 text-[11px] text-[#70798C] border-t border-slate-100 pt-2.5">
                        {tier.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-emerald-500 font-bold">✓</span>
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
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#70798C] block">
                2. Business & Contact Information
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#000004] block mb-1">Company / Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Asaba Royal Suites"
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-slate-200 rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#000004]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#000004] block mb-1">Official Business Email *</label>
                  <input
                    type="email"
                    required
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    placeholder="partners@yourbrand.ng"
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-slate-200 rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#000004]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#000004] block mb-1">WhatsApp Business Number *</label>
                  <input
                    type="text"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. 08012345678"
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-slate-200 rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#000004]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#000004] block mb-1">Alternate Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 08123456789"
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-slate-200 rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#000004]"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Campaign Content & Creative */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#70798C] block">
                3. Campaign Copy & Creative Assets
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#000004] block mb-1">Campaign Headline *</label>
                  <input
                    type="text"
                    required
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. 20% Off Fully Furnished Shortlet"
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-slate-200 rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#000004]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#000004] block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-slate-200 rounded-xl text-xs font-semibold text-[#000004] focus:outline-none focus:border-[#000004]"
                  >
                    <option value="Property">Property Rental</option>
                    <option value="Estate">Estate & Real Estate</option>
                    <option value="Promo">Promo & Brand Campaign</option>
                    <option value="Service">Service (Solar, Interior, Moving)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#000004] block mb-1">Offer Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your special offer, pricing discount, or why Delta renters should choose your company..."
                  className="w-full px-3.5 py-2 bg-[#FCF9F5] border border-slate-200 rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#000004]"
                />
              </div>

              {/* Media URL & Presets */}
              <div>
                <label className="text-[11px] font-semibold text-[#000004] block mb-1">
                  Creative Image / Video Media URL *
                </label>
                <input
                  type="url"
                  required
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://... image or video URL (9:16 or 16:9)"
                  className="w-full px-3.5 py-2 bg-[#FCF9F5] border border-slate-200 rounded-xl text-xs text-[#000004] font-mono focus:outline-none focus:border-[#000004]"
                />

                {/* Quick Presets for instant testing */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-[#70798C]">Sample Creatives:</span>
                  <button
                    type="button"
                    onClick={() => handleMediaPreset('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1080&q=80')}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#000004] font-semibold cursor-pointer"
                  >
                    Modern Condo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMediaPreset('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1080&q=80')}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#000004] font-semibold cursor-pointer"
                  >
                    Luxury Villa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMediaPreset('https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1080&q=80')}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#000004] font-semibold cursor-pointer"
                  >
                    Solar Energy
                  </button>
                </div>
              </div>

              {/* Action Type & CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-[#000004] block mb-1">Target Action</label>
                  <select
                    value={actionType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setActionType(val);
                      if (val === 'website') setCtaText('Visit Website');
                      else setCtaText('Contact on WhatsApp');
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-slate-200 rounded-xl text-xs font-semibold text-[#000004] focus:outline-none"
                  >
                    <option value="website">Send to Website</option>
                    <option value="contact">Direct WhatsApp Chat</option>
                  </select>
                </div>

                {actionType === 'website' && (
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-[#000004] block mb-1">Destination Website URL</label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://yourbrand.ng/promo"
                      className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-slate-200 rounded-xl text-xs text-[#000004] focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-5 border-t border-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-[#70798C] block">Total Package:</span>
                <span className="text-base font-black text-[#000004]">{currentTier.price}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#70798C] hover:text-[#000004] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#000004] hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting Campaign...</span>
                  ) : (
                    <>
                      <span>Submit for Review</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
