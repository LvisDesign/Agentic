import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Plus, 
  Megaphone, 
  BookOpen, 
  KeyRound, 
  LogOut, 
  ExternalLink, 
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
  Shield,
  Phone,
  Globe,
  Tag,
  ImageIcon,
  Film,
  AlertCircle,
  Upload,
  X,
  FileText
} from 'lucide-react';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
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
import { processUploadedFile } from '../../utils/mediaStorage';

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
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [actionType, setActionType] = useState<'website' | 'contact' | 'property'>('website');
  const [websiteUrl, setWebsiteUrl] = useState(advertiser.websiteUrl || '');
  const [ctaText, setCtaText] = useState('Visit Website');
  const [location, setLocation] = useState(advertiser.operatingCity || 'Nationwide');
  const [price, setPrice] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState(advertiser.whatsapp || advertiser.phone || '');
  const [phone, setPhone] = useState(advertiser.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Creative Media Upload & Preset State
  const [mediaSourceMode, setMediaSourceMode] = useState<'upload' | 'url'>('upload');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setFormError('The selected file exceeds the 50MB limit. Please choose a smaller file.');
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
      setFormError('Failed to upload file. Please verify format (JPG, PNG, WebP, MP4) and try again.');
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
    setFormError(null);

    if (!headline.trim()) {
      setFormError('Please enter a campaign headline.');
      return;
    }
    if (!mediaUrl.trim()) {
      setFormError('Please provide a creative media URL.');
      return;
    }
    if (actionType === 'website' && !websiteUrl.trim()) {
      setFormError('Please provide a destination website URL for your campaign.');
      return;
    }
    if (actionType === 'contact' && !whatsappNumber.trim()) {
      setFormError('Please provide a WhatsApp business number to receive leads.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: PartnerSubmissionPayload = {
        companyName: advertiser.companyName,
        headline: headline.trim(),
        description: description.trim(),
        category,
        mediaUrl: mediaUrl.trim(),
        mediaType,
        ctaText: ctaText.trim() || (actionType === 'website' ? 'Visit Website' : 'Chat on WhatsApp'),
        actionType,
        websiteUrl: actionType === 'website' ? websiteUrl.trim() : undefined,
        whatsappNumber: whatsappNumber.trim() || advertiser.whatsapp || advertiser.phone || undefined,
        phone: phone.trim() || advertiser.phone || undefined,
        location: location.trim() || advertiser.operatingCity || 'Nationwide',
        price: price.trim() || undefined,
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
      setPrice('');
      setMediaUrl('');
      setUploadedFileName(null);
    } catch (e) {
      console.error('Failed to submit ad:', e);
      setFormError('Could not submit campaign. Please check your network connection and try again.');
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
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onBackToExplore && (
              <button
                onClick={onBackToExplore}
                className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 rounded-xl text-[#70798C] hover:text-[#342A21] hover:bg-[#F6F3EF] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0"
                title="Return to property feed"
              >
                <ArrowLeft className="w-4 h-4 text-[#342A21]" />
                <span className="hidden sm:inline">Explore Feed</span>
              </button>
            )}

            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <img src="/images/setlla-logo.png" alt="Setlla" className="h-5 sm:h-5.5 w-auto object-contain shrink-0" />
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-[#342A21] text-[#FCF9F5] whitespace-nowrap">
                <span className="hidden sm:inline">Customer Ads </span>Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden md:flex flex-col text-right">
              <span className="font-semibold text-xs text-[#342A21] truncate max-w-[200px]">
                {advertiser.companyName}
              </span>
              <span className="text-[10px] text-[#70798C]">{advertiser.contactName}</span>
            </div>

            <button
              onClick={onLogout}
              className="py-1.5 px-2.5 sm:px-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F6F3EF] text-xs font-semibold text-[#70798C] hover:text-rose-700 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              title="Sign out of advertiser account"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Sub-Nav Tabs Bar */}
        <div className="border-t border-[#342A21]/5 bg-[#FCF9F5] px-3 sm:px-6 py-2">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`py-1.5 px-3 sm:px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'campaigns'
                    ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                    : 'text-[#70798C] hover:text-[#342A21] bg-white border border-[#E5E7EB]'
                }`}
              >
                My Campaigns ({adverts.length})
              </button>

              <button
                onClick={() => setActiveTab('new-campaign')}
                className={`py-1.5 px-3 sm:px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'new-campaign'
                    ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                    : 'text-[#70798C] hover:text-[#342A21] bg-white border border-[#E5E7EB]'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>+ Create Campaign</span>
              </button>

              <button
                onClick={() => setActiveTab('api-keys')}
                className={`py-1.5 px-3 sm:px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'api-keys'
                    ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                    : 'text-[#70798C] hover:text-[#342A21] bg-white border border-[#E5E7EB]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span>API Credentials</span>
              </button>

              <button
                onClick={() => setActiveTab('guide')}
                className={`py-1.5 px-3 sm:px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'guide'
                    ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                    : 'text-[#70798C] hover:text-[#342A21] bg-white border border-[#E5E7EB]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
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
              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Ad Desk</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. Main Content Body */}
      <main className="max-w-6xl mx-auto px-3.5 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Top Banner Overview */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-[#342A21]/15 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center shrink-0">
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
                      <div className="flex items-start gap-3 sm:gap-4">
                        <img
                          src={ad.thumbnailUrl || ad.mediaUrl}
                          alt={ad.headline}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-[#E5E7EB] shrink-0"
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
                {/* 1. Duration & Package Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#70798C]">
                      1. Select Campaign Duration & Package
                    </label>
                    <span className="text-[11px] text-[#70798C]">Setlla Verified Placement</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {TIERS.map((tier) => (
                      <div
                        key={tier.id}
                        onClick={() => setPackageTier(tier.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          packageTier === tier.id
                            ? 'border-[#342A21] bg-[#FCF9F5] ring-2 ring-[#342A21]/15 shadow-subtle'
                            : 'border-[#E5E7EB] hover:border-[#342A21]/30 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#342A21] block">{tier.name}</span>
                          {packageTier === tier.id && <Check className="w-4 h-4 text-emerald-700" />}
                        </div>
                        <span className="text-lg font-bold text-[#342A21] mt-0.5 block">{tier.price}</span>
                        <span className="text-[11px] text-[#70798C]">{tier.durationDays} Days Duration</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Campaign Details & Targeting */}
                <div className="pt-4 border-t border-[#E5E7EB] space-y-4">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#70798C] block">
                    2. Campaign Details & Targeting
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <label className="text-xs font-medium text-[#342A21] block mb-1">Business / Campaign Category</label>
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

                    <div>
                      <label className="text-xs font-medium text-[#342A21] block mb-1">
                        Target Location / City
                      </label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 text-[#70798C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Network Wide, Asaba, Warri, Lagos"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-[#70798C]">Quick Fill:</span>
                        {['Network Wide', 'Asaba', 'Warri', 'Lagos', 'Abuja', 'Port Harcourt'].map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => setLocation(loc)}
                            className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                              location === loc
                                ? 'bg-[#342A21] text-white border-[#342A21]'
                                : 'bg-[#FCF9F5] border-[#E5E7EB] hover:bg-[#F6F3EF] text-[#342A21]'
                            }`}
                          >
                            {loc}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#342A21] block mb-1">
                        Offer Price or Discount Tag <span className="text-[#70798C] font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <Tag className="w-3.5 h-3.5 text-[#70798C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="e.g. From ₦45,000 or 20% Off"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                        />
                      </div>
                      <span className="text-[10px] text-[#70798C] block mt-1">
                        Displayed as a spotlight badge or pricing highlight on the explore feed.
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-[#342A21] block mb-1">Offer Description & Value Proposition</label>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detail your special offer, pricing advantages, or why renters should choose your company..."
                        className="w-full px-3.5 py-2 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21] leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Creative Media Asset */}
                <div className="pt-4 border-t border-[#E5E7EB] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#70798C] block">
                        3. Creative Media Asset *
                      </label>
                      <span className="text-[11px] text-[#70798C]">
                        Upload photos/videos directly or provide a web URL
                      </span>
                    </div>

                    {/* Mode Toggle: Direct Upload vs Web URL / Presets */}
                    <div className="inline-flex rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] p-1">
                      <button
                        type="button"
                        onClick={() => setMediaSourceMode('upload')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          mediaSourceMode === 'upload'
                            ? 'bg-white text-[#342A21] shadow-xs'
                            : 'text-[#70798C] hover:text-[#342A21]'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMediaSourceMode('url')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          mediaSourceMode === 'url'
                            ? 'bg-white text-[#342A21] shadow-xs'
                            : 'text-[#70798C] hover:text-[#342A21]'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Enter URL / Presets</span>
                      </button>
                    </div>
                  </div>

                  {/* Hidden native file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {mediaSourceMode === 'upload' ? (
                    <div className="space-y-3">
                      {/* Upload Area / Dropzone */}
                      <div
                        onClick={() => !isUploadingMedia && fileInputRef.current?.click()}
                        className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center relative ${
                          isUploadingMedia
                            ? 'bg-amber-50/60 border-amber-300 cursor-wait'
                            : 'bg-[#FCF9F5] hover:bg-[#F6F3EF] border-[#E5E7EB] hover:border-[#342A21]/40'
                        }`}
                      >
                        {isUploadingMedia ? (
                          <div className="py-4 space-y-2.5">
                            <div className="w-8 h-8 border-2 border-[#342A21] border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs font-semibold text-[#342A21]">Uploading & optimizing media asset...</p>
                            <p className="text-[11px] text-[#70798C]">Compressing for instant mobile & desktop streaming</p>
                          </div>
                        ) : (
                          <div className="py-2 space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#342A21] shadow-xs">
                              <Upload className="w-5 h-5 text-[#342A21]" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#342A21]">
                                Click to select and upload creative from your device
                              </p>
                              <p className="text-[11px] text-[#70798C] mt-1 max-w-md mx-auto">
                                Supports high-resolution JPG, PNG, WEBP photos or MP4, MOV, WebM videos (up to 50MB). Vertical (9:16) or landscape (16:9) recommended.
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-[11px] font-semibold text-[#342A21] shadow-2xs">
                              <Plus className="w-3 h-3 text-emerald-600" />
                              <span>Browse Photos & Videos</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Active Media Preview if mediaUrl exists */}
                      {mediaUrl && (
                        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row items-center gap-3.5">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-black shrink-0 relative flex items-center justify-center">
                            {mediaType === 'video' ? (
                              <video
                                src={mediaUrl}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                              />
                            ) : (
                              <img
                                src={mediaUrl}
                                alt="Campaign creative preview"
                                className="w-full h-full object-cover"
                              />
                            )}
                            <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                              {mediaType === 'video' ? 'VIDEO' : 'IMAGE'}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0 text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="text-xs font-bold text-[#342A21] truncate">
                                {uploadedFileName || 'Active Creative Asset'}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#70798C] mt-0.5 truncate font-mono">
                              {mediaUrl.slice(0, 60)}...
                            </p>
                            <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold mt-1">
                              ✓ Ready for Campaign Review
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] hover:bg-[#F6F3EF] text-xs font-semibold text-[#342A21] cursor-pointer"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={handleClearMedia}
                              className="p-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-rose-50 text-[#70798C] hover:text-rose-600 transition-colors cursor-pointer"
                              title="Remove media"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#342A21]">Direct URL / Presets</span>
                        <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-[#FCF9F5] p-0.5">
                          <button
                            type="button"
                            onClick={() => setMediaType('image')}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                              mediaType === 'image'
                                ? 'bg-white text-[#342A21] shadow-xs'
                                : 'text-[#70798C] hover:text-[#342A21]'
                            }`}
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>Image</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMediaType('video')}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                              mediaType === 'video'
                                ? 'bg-white text-[#342A21] shadow-xs'
                                : 'text-[#70798C] hover:text-[#342A21]'
                            }`}
                          >
                            <Film className="w-3 h-3" />
                            <span>Video (MP4)</span>
                          </button>
                        </div>
                      </div>

                      <input
                        type="url"
                        required
                        value={mediaUrl}
                        onChange={(e) => {
                          setMediaUrl(e.target.value);
                          setUploadedFileName(null);
                        }}
                        placeholder="https://... direct image or MP4 URL"
                        className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-mono text-[#000004] focus:outline-none focus:border-[#342A21]"
                      />

                      {/* Sample Presets */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-[#70798C]">Sample Presets:</span>
                        <button
                          type="button"
                          onClick={() => handleMediaPreset('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1080&q=80', 'image')}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-[#FCF9F5] border border-[#E5E7EB] hover:bg-[#F6F3EF] text-[#342A21] font-medium cursor-pointer"
                        >
                          Modern Penthouse
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMediaPreset('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1080&q=80', 'image')}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-[#FCF9F5] border border-[#E5E7EB] hover:bg-[#F6F3EF] text-[#342A21] font-medium cursor-pointer"
                        >
                          Luxury Estate
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMediaPreset('https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1080&q=80', 'image')}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-[#FCF9F5] border border-[#E5E7EB] hover:bg-[#F6F3EF] text-[#342A21] font-medium cursor-pointer"
                        >
                          Solar Power
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMediaPreset('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1080&q=80', 'image')}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-[#FCF9F5] border border-[#E5E7EB] hover:bg-[#F6F3EF] text-[#342A21] font-medium cursor-pointer"
                        >
                          Interior Design
                        </button>
                      </div>

                      {/* URL Preview */}
                      {mediaUrl && (
                        <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] flex items-center gap-3">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-black shrink-0 relative flex items-center justify-center">
                            {mediaType === 'video' ? (
                              <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />
                            ) : (
                              <img src={mediaUrl} alt="URL Preview" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-xs">
                            <span className="font-semibold text-[#342A21] block">Live Media Preview</span>
                            <span className="text-[11px] text-[#70798C] font-mono truncate block">{mediaUrl}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Lead Destination & Contact Routing */}
                <div className="pt-4 border-t border-[#E5E7EB] space-y-4">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#70798C] block">
                    4. Lead Destination & Contact Routing
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#342A21] block mb-1">
                        Lead Action / Destination *
                      </label>
                      <AdminCustomSelect
                        value={actionType}
                        onChange={(val) => {
                          const v = val as any;
                          setActionType(v);
                          if (v === 'website') {
                            setCtaText('Visit Website');
                          } else {
                            setCtaText('Chat on WhatsApp');
                          }
                        }}
                        options={[
                          { value: 'website', label: 'Send to Website / Landing Page' },
                          { value: 'contact', label: 'Direct WhatsApp Chat' },
                        ]}
                        variant="form"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#342A21] block mb-1">
                        Call to Action Button Label *
                      </label>
                      <input
                        type="text"
                        required
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        placeholder={actionType === 'website' ? 'Visit Website' : 'Chat on WhatsApp'}
                        className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                      />
                    </div>

                    {actionType === 'website' && (
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-[#342A21] block mb-1">
                          Destination Website URL *
                        </label>
                        <div className="relative">
                          <Globe className="w-3.5 h-3.5 text-[#70798C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="url"
                            required={actionType === 'website'}
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            placeholder="https://yourbrand.ng/promo"
                            className="w-full pl-9 pr-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-mono text-[#000004] focus:outline-none focus:border-[#342A21]"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-medium text-[#342A21] block mb-1 flex items-center gap-1.5">
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                        <span>WhatsApp Business Number (for Leads) {actionType === 'contact' ? '*' : '(Optional)'}</span>
                      </label>
                      <input
                        type="tel"
                        required={actionType === 'contact'}
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="e.g. 08012345678"
                        className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                      />
                      <span className="text-[10px] text-[#70798C] block mt-1">
                        Renters can tap to instantly start a WhatsApp conversation with your sales desk.
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#342A21] block mb-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#70798C]" />
                        <span>Alternate Phone Call Line <span className="text-[#70798C] font-normal">(Optional)</span></span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 08123456789"
                        className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                      />
                      <span className="text-[10px] text-[#70798C] block mt-1">
                        Allows interested renters to directly call your line from the mobile ad card.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Error Banner */}
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="pt-5 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] text-[#70798C] uppercase tracking-wider block">Total Campaign Fee</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-bold text-[#342A21]">{currentTier.price}</span>
                      <span className="text-xs text-[#70798C]">({currentTier.durationDays} Days Duration)</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-3 px-6 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-semibold flex items-center justify-center gap-2 shadow-card cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <span>{isSubmitting ? 'Submitting Campaign...' : 'Submit Campaign for Review'}</span>
                    <ChevronRight className="w-4 h-4 text-amber-300" />
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
