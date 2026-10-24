import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Megaphone, 
  BookOpen, 
  KeyRound, 
  LogOut, 
  ExternalLink, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Copy, 
  Check, 
  ChevronRight, 
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  ArrowLeft,
  Sparkles,
  MapPin,
  Play,
  Pause,
  ShieldCheck,
  Shield
} from 'lucide-react';
import { AdvertiserUser, logoutAdvertiser } from '../../services/advertiserAuthService';
import { AdvertStory } from '../../data/mockAdverts';
import { 
  loadAllAdverts, 
  submitPartnerAdvert, 
  PartnerSubmissionPayload,
  togglePartnerApiKey 
} from '../../services/adService';
import { AdsSetupGuide } from '../Adverts/AdsSetupGuide';
import { AdminCustomSelect } from '../UI/AdminCustomSelect';

interface AdvertiserDashboardProps {
  advertiser: AdvertiserUser;
  onLogout: () => void;
  onBackToExplore?: () => void;
  onCampaignCreated?: (ad: AdvertStory) => void;
}

export const AdvertiserDashboard: React.FC<AdvertiserDashboardProps> = ({
  advertiser,
  onLogout,
  onBackToExplore,
  onCampaignCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'new-campaign' | 'api-keys' | 'guide'>('campaigns');
  const [adverts, setAdverts] = useState<AdvertStory[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('all');
  const [copiedKey, setCopiedKey] = useState(false);

  // New Campaign Form State (Prefilled from Advertiser profile)
  const [packageTier, setPackageTier] = useState<'starter' | 'growth' | 'corporate'>('growth');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Property' | 'Estate' | 'Promo' | 'Service'>('Promo');
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1080&q=80');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [actionType, setActionType] = useState<'website' | 'contact' | 'property'>('website');
  const [websiteUrl, setWebsiteUrl] = useState(advertiser.websiteUrl || '');
  const [ctaText, setCtaText] = useState('Visit Website');
  const [location, setLocation] = useState('Network Wide');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, [advertiser.email, advertiser.companyName]);

  const loadCampaigns = async () => {
    const all = await loadAllAdverts();
    const myAds = all.filter((a) => {
      const emailMatch = a.partnerEmail && a.partnerEmail.toLowerCase() === advertiser.email.toLowerCase();
      const nameMatch = a.advertiserName && a.advertiserName.toLowerCase() === advertiser.companyName.toLowerCase();
      return emailMatch || nameMatch;
    });
    setAdverts(myAds);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(advertiser.apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const TIERS = [
    {
      id: 'starter' as const,
      name: 'Starter Spotlight',
      durationDays: 7,
      price: '₦15,000',
      budgetAmount: 15000,
    },
    {
      id: 'growth' as const,
      name: 'Growth Partner',
      durationDays: 30,
      price: '₦45,000',
      budgetAmount: 45000,
    },
    {
      id: 'corporate' as const,
      name: 'Corporate Leader',
      durationDays: 90,
      price: '₦120,000',
      budgetAmount: 120000,
    },
  ];

  const currentTier = TIERS.find((t) => t.id === packageTier) || TIERS[1];

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline || !mediaUrl) return;

    setIsSubmitting(true);
    try {
      const payload: PartnerSubmissionPayload = {
        companyName: advertiser.companyName,
        headline,
        description,
        category,
        mediaUrl,
        mediaType,
        ctaText,
        actionType,
        websiteUrl: actionType === 'website' ? websiteUrl : undefined,
        whatsappNumber: advertiser.whatsapp || advertiser.phone,
        phone: advertiser.phone,
        location,
        price: price || undefined,
        partnerEmail: advertiser.email,
        packageTier,
        durationDays: currentTier.durationDays,
        budgetAmount: currentTier.budgetAmount,
      };

      const result = await submitPartnerAdvert(payload);
      setSubmissionSuccess(result.trackingRef);
      await loadCampaigns();
      if (onCampaignCreated) {
        onCampaignCreated(result.advert);
      }
      // Reset form
      setHeadline('');
      setDescription('');
    } catch (e) {
      console.error('Failed to submit ad:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics calculation
  const activeCount = adverts.filter((a) => (a.status || 'active') === 'active').length;
  const pendingCount = adverts.filter((a) => a.status === 'pending_review').length;
  const totalImpressions = adverts.reduce((acc, a) => acc + (a.impressionsCount || 0), 0);
  const totalClicks = adverts.reduce((acc, a) => acc + (a.clicksCount || 0), 0);

  const filteredAdverts = adverts.filter((a) => {
    if (statusFilter === 'active') return (a.status || 'active') === 'active';
    if (statusFilter === 'pending') return a.status === 'pending_review';
    if (statusFilter === 'expired') return a.status === 'expired';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FCF9F5] text-[#000004] font-body selection:bg-[#342A21]/10 selection:text-[#342A21]">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#342A21]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBackToExplore && (
              <button
                onClick={onBackToExplore}
                className="p-2 -ml-2 rounded-xl text-[#70798C] hover:text-[#342A21] hover:bg-[#F6F3EF] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Return to property feed"
              >
                <ArrowLeft className="w-4 h-4 text-[#342A21]" />
                <span className="hidden sm:inline">Explore Feed</span>
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <img src="/images/setlla-logo.png" alt="Setlla" className="h-5 w-auto object-contain" />
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-[#342A21] text-[#FCF9F5]">
                Customer Ads Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="font-semibold text-xs text-[#342A21] truncate max-w-[200px]">
                {advertiser.companyName}
              </span>
              <span className="text-[10px] text-[#70798C]">{advertiser.contactName}</span>
            </div>

            <button
              onClick={onLogout}
              className="py-1.5 px-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F6F3EF] text-xs font-semibold text-[#70798C] hover:text-rose-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sign out of advertiser account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Sub-Nav Tabs Bar */}
        <div className="border-t border-[#342A21]/5 bg-[#FCF9F5] px-4 sm:px-6 py-2.5">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'campaigns'
                    ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                    : 'text-[#70798C] hover:text-[#342A21] bg-white border border-[#E5E7EB]'
                }`}
              >
                My Campaigns ({adverts.length})
              </button>

              <button
                onClick={() => setActiveTab('new-campaign')}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'new-campaign'
                    ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                    : 'text-[#70798C] hover:text-[#342A21] bg-white border border-[#E5E7EB]'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                <span>+ Create Campaign</span>
              </button>

              <button
                onClick={() => setActiveTab('api-keys')}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'api-keys'
                    ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                    : 'text-[#70798C] hover:text-[#342A21] bg-white border border-[#E5E7EB]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>API Credentials</span>
              </button>

              <button
                onClick={() => setActiveTab('guide')}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'guide'
                    ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                    : 'text-[#70798C] hover:text-[#342A21] bg-white border border-[#E5E7EB]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Ads Setup Guide</span>
              </button>
            </div>

            <a
              href={`https://wa.me/2348000000000?text=${encodeURIComponent(
                `Hello Setlla Team, I am logged in as advertiser "${advertiser.companyName}". I need assistance with my ad campaign.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-xs text-[#342A21] font-semibold hover:underline shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Ad Desk</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. Main Content Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Top Banner Overview */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#342A21]/15 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-display text-2xl text-[#342A21] font-normal">
                {advertiser.companyName}
              </span>
              <span 
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 text-xs font-medium"
                title="Verified Partner Account"
              >
                <CheckCircle2 className="w-3.5 h-3.5 fill-[#2081E2] text-white shrink-0" />
                <span className="text-[11px] font-semibold text-slate-700">Verified Partner</span>
              </span>
            </div>
            <p className="text-xs text-[#70798C] mt-1">
              {advertiser.industry} · Operating in {advertiser.operatingCity} · Registered email: <strong>{advertiser.email}</strong>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center shrink-0">
            <div className="bg-[#FCF9F5] p-3 rounded-2xl border border-[#E5E7EB] min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-[#70798C] block">Active</span>
              <span className="text-lg font-bold text-[#342A21]">{activeCount}</span>
            </div>
            <div className="bg-[#FCF9F5] p-3 rounded-2xl border border-[#E5E7EB] min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-[#70798C] block">Pending</span>
              <span className="text-lg font-bold text-amber-700">{pendingCount}</span>
            </div>
            <div className="bg-[#FCF9F5] p-3 rounded-2xl border border-[#E5E7EB] min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-[#70798C] block">Impressions</span>
              <span className="text-lg font-bold text-[#342A21]">{totalImpressions.toLocaleString()}</span>
            </div>
            <div className="bg-[#FCF9F5] p-3 rounded-2xl border border-[#E5E7EB] min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-[#70798C] block">Leads</span>
              <span className="text-lg font-bold text-emerald-700">{totalClicks.toLocaleString()}</span>
            </div>
          </div>
        </div>


        {/* ===================================================================== */}
        {/* TAB 1: CAMPAIGNS LIST                                                 */}
        {/* ===================================================================== */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-xl text-[#342A21] font-normal">
                  Your Sponsored Campaigns
                </h3>
                <p className="text-xs text-[#70798C] mt-0.5">
                  Track real-time impressions, lead routing, and campaign status across Setlla's network.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E5E7EB]">
                {(['all', 'active', 'pending', 'expired'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`py-1 px-3 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      statusFilter === filter
                        ? 'bg-[#342A21] text-white shadow-xs'
                        : 'text-[#70798C] hover:text-[#342A21]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {filteredAdverts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#342A21]/15 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FCF9F5] text-[#342A21] border border-[#E5E7EB] flex items-center justify-center mx-auto">
                  <Megaphone className="w-6 h-6 text-[#342A21]" />
                </div>
                <div>
                  <h4 className="font-display text-base text-[#342A21]">No campaigns in this view</h4>
                  <p className="text-xs text-[#70798C] mt-1 max-w-sm mx-auto">
                    Launch a new sponsored campaign to put your brand in front of 50,000+ active property seekers.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('new-campaign')}
                  className="py-2.5 px-5 rounded-xl bg-[#342A21] text-[#FCF9F5] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4 text-amber-300" />
                  <span>Create New Campaign</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAdverts.map((ad) => {
                  const daysRemaining = ad.endDate
                    ? Math.ceil((new Date(ad.endDate).getTime() - Date.now()) / 86400000)
                    : null;

                  return (
                    <div
                      key={ad.id}
                      className="bg-white rounded-2xl border border-[#342A21]/15 p-5 shadow-subtle flex flex-col justify-between gap-4 hover:border-[#342A21]/40 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={ad.thumbnailUrl || ad.mediaUrl}
                          alt={ad.headline}
                          className="w-20 h-20 rounded-xl object-cover border border-[#E5E7EB] shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80';
                          }}
                        />

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.2 rounded bg-[#FCF9F5] border text-[#342A21]">
                              {ad.category}
                            </span>

                            {ad.status === 'pending_review' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[10px] font-semibold border border-amber-200/80">
                                <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                                <span>In Review</span>
                              </span>
                            ) : ad.status === 'expired' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-semibold border border-stone-200">
                                Ended
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 text-[10px] font-semibold border border-emerald-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                                <span>Active</span>
                              </span>
                            )}
                          </div>

                          <h4 className="font-display font-medium text-sm text-[#342A21] line-clamp-1">
                            {ad.headline}
                          </h4>

                          <p className="text-[11px] text-[#70798C] line-clamp-2">
                            {ad.description || 'Sponsored campaign broadcast across property rental feed.'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#70798C]">
                        <div className="flex items-center gap-3">
                          <span>
                            Views: <strong className="text-[#342A21]">{ad.impressionsCount || 0}</strong>
                          </span>
                          <span>
                            Leads: <strong className="text-emerald-700">{ad.clicksCount || 0}</strong>
                          </span>
                        </div>

                        {daysRemaining !== null && daysRemaining > 0 && (
                          <span className="text-[11px] font-semibold text-[#342A21]">
                            {daysRemaining} days left
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: CREATE NEW CAMPAIGN                                            */}
        {/* ===================================================================== */}
        {activeTab === 'new-campaign' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#342A21]/15 shadow-card space-y-6 animate-fade-in">
            <div className="max-w-xl">
              <h3 className="font-display text-2xl text-[#342A21] font-normal">
                Create a New Campaign
              </h3>
              <p className="text-xs text-[#70798C] mt-1">
                Your company details are automatically connected to your advertiser account (<strong>{advertiser.companyName}</strong>).
              </p>
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span><strong>Admin Review Step:</strong> Once submitted, your campaign is reviewed and approved by Setlla Admin before appearing on the Explore Feed.</span>
              </div>
            </div>

            {submissionSuccess ? (
              <div className="p-8 text-center space-y-4 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-display text-xl text-[#342A21]">Campaign Submitted for Review!</h4>
                <p className="text-xs text-[#70798C]">
                  Reference ID: <code className="font-mono font-bold text-[#342A21]">{submissionSuccess}</code>. Our review desk verifies creatives within 1 hour.
                </p>
                <button
                  onClick={() => { setSubmissionSuccess(null); setActiveTab('campaigns'); }}
                  className="py-2.5 px-5 rounded-xl bg-[#342A21] text-white text-xs font-semibold cursor-pointer"
                >
                  View in My Campaigns
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateCampaign} className="space-y-6">
                {/* Duration & Package Selection */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#70798C] block mb-2">
                    1. Select Campaign Duration
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {TIERS.map((tier) => (
                      <div
                        key={tier.id}
                        onClick={() => setPackageTier(tier.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          packageTier === tier.id
                            ? 'border-[#342A21] bg-[#FCF9F5] ring-2 ring-[#342A21]/15'
                            : 'border-[#E5E7EB] hover:border-[#342A21]/30 bg-white'
                        }`}
                      >
                        <span className="text-xs font-semibold text-[#342A21] block">{tier.name}</span>
                        <span className="text-lg font-bold text-[#342A21] mt-0.5 block">{tier.price}</span>
                        <span className="text-[11px] text-[#70798C]">{tier.durationDays} Days Duration</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Campaign Copy */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-medium text-[#342A21] block mb-1">
                      Campaign Headline * (Max 60 chars)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={65}
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. 24/7 Solar Backup Power for Modern Homes"
                      className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#342A21] block mb-1">Category</label>
                    <AdminCustomSelect
                      value={category}
                      onChange={(val) => setCategory(val as any)}
                      options={[
                        { value: 'Promo', label: 'Promo & Brand Campaign' },
                        { value: 'Property', label: 'Property Rental' },
                        { value: 'Estate', label: 'Estate Development' },
                        { value: 'Service', label: 'Service (Solar, Interior, Moving)' },
                      ]}
                      variant="form"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-[#342A21] block mb-1">Offer Description</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detail your special offer or pricing advantages..."
                      className="w-full px-3.5 py-2 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-[#342A21] block mb-1">
                      Creative Image / Video Media URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://... direct image or MP4 URL"
                      className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-mono text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                  <span className="text-xs text-[#70798C]">
                    Campaign Fee: <strong className="text-[#342A21]">{currentTier.price}</strong> ({currentTier.durationDays} Days)
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2.5 px-6 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'Submitting Campaign...' : 'Submit Campaign for Review'}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: API CREDENTIALS                                                */}
        {/* ===================================================================== */}
        {activeTab === 'api-keys' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#342A21]/15 shadow-card space-y-6 animate-fade-in">
            <div>
              <h3 className="font-display text-2xl text-[#342A21] font-normal">
                Corporate REST API & Automated Push Key
              </h3>
              <p className="text-xs text-[#70798C] mt-1">
                Your private API key for programmatically creating and updating sponsored campaigns from your server or CMS.
              </p>
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span><strong>API Verification Queue:</strong> All campaigns injected via this REST API enter the review queue and will be displayed on the Explore Feed once approved by Setlla Admin.</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#70798C] block">
                Private Ingestion API Key
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <code className="text-xs font-mono font-bold text-[#342A21] bg-white px-3 py-2 rounded-xl border border-[#E5E7EB] truncate">
                  {advertiser.apiKey}
                </code>

                <button
                  onClick={handleCopyKey}
                  className="py-2 px-4 rounded-xl bg-[#342A21] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Key Copied!' : 'Copy API Key'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#342A21]">
                Quick Push cURL Command
              </label>
              <pre className="p-4 bg-[#FCF9F5] rounded-2xl border border-[#E5E7EB] text-xs font-mono text-[#342A21] overflow-x-auto leading-relaxed">
{`curl -X POST "https://iadzihievmbhssqycpol.supabase.co/rest/v1/adverts" \\
  -H "Content-Type: application/json" \\
  -H "X-Setlla-Partner-Key: ${advertiser.apiKey}" \\
  -d '{
    "companyName": "${advertiser.companyName}",
    "headline": "24/7 Solar Backup Power for Modern Homes",
    "category": "Service",
    "mediaUrl": "https://images.unsplash.com/photo-1509391365360-2e959784a276",
    "whatsappNumber": "${advertiser.whatsapp || advertiser.phone}",
    "durationDays": 30
  }'`}
              </pre>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 4: ADS SETUP & MANAGEMENT GUIDE                                   */}
        {/* ===================================================================== */}
        {activeTab === 'guide' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#342A21]/15 shadow-card animate-fade-in">
            <AdsSetupGuide mode="customer" />
          </div>
        )}
      </main>
    </div>
  );
};
