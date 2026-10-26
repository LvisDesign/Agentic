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
  FileText,
  Lock,
  Wallet,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Edit3,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
import { 
  AdvertiserUser, 
  logoutAdvertiser, 
  topUpAdvertiserWallet, 
  deductAdvertiserWallet, 
  getActiveAdvertiser 
} from '../../services/advertiserAuthService';
import { AdvertStory } from '../../data/mockAdverts';
import { 
  loadAllAdverts, 
  submitPartnerAdvert, 
  PartnerSubmissionPayload,
  togglePartnerApiKey,
  editAdvert,
  toggleAdvertStatus
} from '../../services/adService';
import { AdsSetupGuide } from '../Adverts/AdsSetupGuide';
import { AdminCustomSelect } from '../UI/AdminCustomSelect';
import { processUploadedFile } from '../../utils/mediaStorage';
import { PaystackModal } from '../Booking/PaystackModal';

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
  const [currentAdvertiser, setCurrentAdvertiser] = useState<AdvertiserUser>(() => getActiveAdvertiser() || advertiser);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'new-campaign' | 'wallet' | 'api-keys' | 'guide'>('campaigns');
  const [adverts, setAdverts] = useState<AdvertStory[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('all');
  const [copiedKey, setCopiedKey] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Wallet Top-Up State
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpPack, setTopUpPack] = useState<number | 'custom'>(45000);
  const [topUpAmount, setTopUpAmount] = useState<number>(45000);
  const [customTopUpAmount, setCustomTopUpAmount] = useState<string>('');
  const [pendingPostTopUp, setPendingPostTopUp] = useState<boolean>(false);

  // Edit Campaign Modal State (Safe vs. Sensitive Fields)
  const [editingAdvert, setEditingAdvert] = useState<AdvertStory | null>(null);
  const [editHeadline, setEditHeadline] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<'Property' | 'Estate' | 'Promo' | 'Service'>('Promo');
  const [editLocation, setEditLocation] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editMediaUrl, setEditMediaUrl] = useState('');
  const [editMediaType, setEditMediaType] = useState<'image' | 'video'>('image');
  const [editWebsiteUrl, setEditWebsiteUrl] = useState('');
  const [editWhatsappNumber, setEditWhatsappNumber] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCtaText, setEditCtaText] = useState('Visit Website');
  const [editActionType, setEditActionType] = useState<'website' | 'contact' | 'property'>('website');
  const [editMediaSourceMode, setEditMediaSourceMode] = useState<'upload' | 'url'>('upload');
  const [isUploadingEditMedia, setIsUploadingEditMedia] = useState(false);
  const [editUploadedFileName, setEditUploadedFileName] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editStatusMessage, setEditStatusMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [previewDraftAdId, setPreviewDraftAdId] = useState<string | null>(null);

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
  const [showPaystackModal, setShowPaystackModal] = useState(false);
  const [latestPaymentRef, setLatestPaymentRef] = useState<string | null>(null);
  const [latestPaymentMethod, setLatestPaymentMethod] = useState<string | null>(null);

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

  const handleFundCampaignFromWallet = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    if (!headline.trim()) {
      setFormError('Please enter a campaign headline.');
      return;
    }
    if (!mediaUrl.trim()) {
      setFormError('Please provide a creative media URL or upload a file.');
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

    const cost = currentTier.budgetAmount;
    const currentBalance = currentAdvertiser.walletBalance || 0;

    if (currentBalance < cost) {
      const shortfall = cost - currentBalance;
      setTopUpAmount(shortfall > 5000 ? shortfall : 5000);
      setTopUpPack('custom');
      setPendingPostTopUp(true);
      setShowTopUpModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Deduct wallet credits
      const updatedUser = await deductAdvertiserWallet(
        currentAdvertiser.id,
        cost,
        headline.trim()
      );
      setCurrentAdvertiser(updatedUser);

      // 2. Submit campaign
      const trackingRef = `STLA-AD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const payload: PartnerSubmissionPayload = {
        companyName: currentAdvertiser.companyName,
        headline: headline.trim(),
        description: description.trim(),
        category,
        mediaUrl: mediaUrl.trim(),
        mediaType,
        ctaText: ctaText.trim() || (actionType === 'website' ? 'Visit Website' : 'Chat on WhatsApp'),
        actionType,
        websiteUrl: actionType === 'website' ? websiteUrl.trim() : undefined,
        whatsappNumber: whatsappNumber.trim() || currentAdvertiser.whatsapp || currentAdvertiser.phone || undefined,
        phone: phone.trim() || currentAdvertiser.phone || undefined,
        location: location.trim() || currentAdvertiser.operatingCity || 'Nationwide',
        price: price.trim() || undefined,
        partnerEmail: currentAdvertiser.email,
        packageTier,
        durationDays: currentTier.durationDays,
        budgetAmount: cost,
        paymentReference: `WALLET_TX_${Date.now()}`,
        paymentMethod: 'Ad Wallet Credits',
      };

      const result = await submitPartnerAdvert(payload);
      setSubmissionSuccess(result.trackingRef);
      setLatestPaymentRef(`WALLET_TX_${Date.now().toString().slice(-6)}`);
      setLatestPaymentMethod('Ad Credits Wallet');
      setToastMessage(`Campaign funded! ₦${cost.toLocaleString()} deducted from wallet.`);
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
    } catch (e: any) {
      console.error('Failed to submit ad:', e);
      setFormError(e?.message || 'Could not fund campaign from wallet credits.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWalletTopUpSuccess = async (paymentReference: string, paymentMethod: 'Card' | 'Bank Transfer' | 'USSD') => {
    setShowPaystackModal(false);
    setShowTopUpModal(false);
    try {
      const updatedUser = await topUpAdvertiserWallet(
        currentAdvertiser.id,
        topUpAmount,
        paymentReference,
        paymentMethod
      );
      setCurrentAdvertiser(updatedUser);
      setToastMessage(`₦${topUpAmount.toLocaleString()} added to your Ad Credits wallet!`);

      // If user was creating a campaign and topped up to meet the shortfall, automatically launch now!
      if (pendingPostTopUp) {
        setPendingPostTopUp(false);
        setTimeout(() => {
          handleFundCampaignFromWallet();
        }, 150);
      }
    } catch (e: any) {
      console.error('Top-up error:', e);
      setFormError(e?.message || 'Failed to credit wallet balance.');
    }
  };

  const handleOpenEditModal = (ad: AdvertStory) => {
    setEditingAdvert(ad);
    setEditHeadline(ad.pendingChanges?.headline || ad.headline);
    setEditDescription(ad.pendingChanges?.description !== undefined ? ad.pendingChanges.description : (ad.description || ''));
    setEditCategory(ad.pendingChanges?.category || ad.category || 'Promo');
    setEditLocation(ad.pendingChanges?.location || ad.location || 'Nationwide');
    setEditPrice(ad.pendingChanges?.price !== undefined ? ad.pendingChanges.price : (ad.price || ''));
    setEditMediaUrl(ad.pendingChanges?.mediaUrl || ad.mediaUrl);
    setEditMediaType(ad.pendingChanges?.mediaType || ad.mediaType || 'image');
    setEditWebsiteUrl(ad.websiteUrl || '');
    setEditWhatsappNumber(ad.whatsappNumber || '');
    setEditPhone(ad.phone || '');
    setEditCtaText(ad.ctaText || 'Learn More');
    setEditActionType(ad.actionType || 'website');
    setEditUploadedFileName(null);
    setEditStatusMessage(null);
  };

  const handleSaveEditAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdvert) return;
    setIsSavingEdit(true);
    setEditStatusMessage(null);
    try {
      const updates: Partial<AdvertStory> = {
        // Safe fields (Instant)
        websiteUrl: editActionType === 'website' ? editWebsiteUrl.trim() : undefined,
        whatsappNumber: editWhatsappNumber.trim() || undefined,
        phone: editPhone.trim() || undefined,
        ctaText: editCtaText.trim() || (editActionType === 'website' ? 'Visit Website' : 'Chat on WhatsApp'),
        actionType: editActionType,
        // Sensitive fields (Shadow Review)
        headline: editHeadline.trim(),
        description: editDescription.trim(),
        category: editCategory,
        location: editLocation.trim(),
        price: editPrice.trim() || undefined,
        mediaUrl: editMediaUrl.trim(),
        mediaType: editMediaType,
        thumbnailUrl: editMediaUrl.trim(),
      };

      const { advert: updated, hasSensitiveChanges } = await editAdvert(editingAdvert.id, updates);
      await loadCampaigns();

      if (hasSensitiveChanges && updated.status !== 'pending_review') {
        setToastMessage('Creative updates sent for Admin approval! Your live ad will continue running.');
        setEditStatusMessage({
          type: 'warning',
          text: 'Sensitive updates (creative, headline, location) saved to shadow record and sent for Admin review. Your live ad remains active in the feed.',
        });
        setTimeout(() => {
          setEditingAdvert(null);
        }, 2200);
      } else {
        setToastMessage('Campaign links & CTA updated live!');
        setEditingAdvert(null);
      }
    } catch (err: any) {
      console.error('Failed to edit ad:', err);
      setEditStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to update advert.',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleStatus = async (ad: AdvertStory) => {
    try {
      const updated = await toggleAdvertStatus(ad.id);
      if (updated) {
        await loadCampaigns();
        setToastMessage(`Campaign "${ad.headline}" is now ${updated.status === 'active' ? 'Active' : 'Paused'}.`);
      }
    } catch (e) {
      console.error('Failed to toggle status:', e);
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
                {currentAdvertiser.companyName}
              </span>
              <span className="text-[10px] text-[#70798C]">{currentAdvertiser.contactName}</span>
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
                onClick={() => setActiveTab('wallet')}
                className={`py-1.5 px-3 sm:px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'wallet'
                    ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                    : 'text-[#70798C] hover:text-[#342A21] bg-white border border-[#E5E7EB]'
                }`}
              >
                <Wallet className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Credits Wallet (₦{(currentAdvertiser.walletBalance || 0).toLocaleString()})</span>
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
                `Hello Setlla Team, I am logged in as advertiser "${currentAdvertiser.companyName}". I need assistance with my ad campaign.`
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
                {currentAdvertiser.companyName}
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
              {currentAdvertiser.industry} · Operating in {currentAdvertiser.operatingCity} · Registered email: <strong>{currentAdvertiser.email}</strong>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 text-center shrink-0">
            <div 
              onClick={() => setActiveTab('wallet')}
              className="bg-gradient-to-br from-amber-50/90 to-orange-50/70 p-3 rounded-2xl border border-amber-200/90 min-w-[105px] cursor-pointer hover:border-amber-400 transition-all text-left"
              title="Click to view Ad Credits & Wallet ledger"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] uppercase font-bold text-amber-900">Credits</span>
                <Wallet className="w-3 h-3 text-amber-600" />
              </div>
              <span className="text-sm sm:text-base font-black text-[#342A21] font-mono block">
                ₦{(currentAdvertiser.walletBalance || 0).toLocaleString()}
              </span>
              <span className="text-[9px] font-semibold text-amber-700 block mt-0.5">
                + Top Up →
              </span>
            </div>
            <div className="bg-[#FCF9F5] p-3 rounded-2xl border border-[#E5E7EB] min-w-[75px]">
              <span className="text-[10px] uppercase font-bold text-[#70798C] block">Active</span>
              <span className="text-lg font-bold text-[#342A21]">{activeCount}</span>
            </div>
            <div className="bg-[#FCF9F5] p-3 rounded-2xl border border-[#E5E7EB] min-w-[75px]">
              <span className="text-[10px] uppercase font-bold text-[#70798C] block">Pending</span>
              <span className="text-lg font-bold text-amber-700">{pendingCount}</span>
            </div>
            <div className="bg-[#FCF9F5] p-3 rounded-2xl border border-[#E5E7EB] min-w-[75px]">
              <span className="text-[10px] uppercase font-bold text-[#70798C] block">Views</span>
              <span className="text-lg font-bold text-[#342A21]">{totalImpressions.toLocaleString()}</span>
            </div>
            <div className="bg-[#FCF9F5] p-3 rounded-2xl border border-[#E5E7EB] min-w-[75px]">
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
                  const isPaused = ad.status === 'paused';
                  const isPendingCreativeReview = Boolean(ad.hasPendingChanges && ad.changesReviewStatus === 'pending');
                  const isCreativeRejected = ad.changesReviewStatus === 'rejected';
                  const isDraftPreviewOpen = previewDraftAdId === ad.id;

                  return (
                    <div
                      key={ad.id}
                      className="bg-white rounded-2xl border border-[#342A21]/15 p-5 shadow-subtle flex flex-col justify-between gap-4 hover:border-[#342A21]/40 transition-colors"
                    >
                      {/* Alert banner for shadow / draft changes */}
                      {isPendingCreativeReview && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 font-bold text-[11px] text-amber-900">
                              <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>Updated Creative In Review</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setPreviewDraftAdId(isDraftPreviewOpen ? null : ad.id)}
                              className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                            >
                              {isDraftPreviewOpen ? 'Hide Comparison' : 'Compare Live vs Draft'}
                            </button>
                          </div>
                          <p className="text-[11px] text-amber-800 leading-tight">
                            Your live ad remains actively displayed in the public feed so runtime is never disrupted. Once approved by Admin, the live card will seamlessly swap over.
                          </p>

                          {/* Side-by-side Live vs Draft comparison */}
                          {isDraftPreviewOpen && ad.pendingChanges && (
                            <div className="mt-2 pt-2 border-t border-amber-200/80 grid grid-cols-2 gap-2 text-[11px]">
                              <div className="p-2 bg-white/80 rounded-lg border border-amber-200">
                                <span className="font-bold text-slate-700 block text-[10px] uppercase mb-1">Live in Feed</span>
                                <div className="w-full h-14 rounded overflow-hidden mb-1 bg-black">
                                  <img src={ad.thumbnailUrl || ad.mediaUrl} alt="Live" className="w-full h-full object-cover" />
                                </div>
                                <span className="font-semibold text-slate-900 block truncate">{ad.headline}</span>
                                <span className="text-[10px] text-slate-500 block truncate">{ad.location}</span>
                              </div>
                              <div className="p-2 bg-amber-100/60 rounded-lg border border-amber-300">
                                <span className="font-bold text-amber-900 block text-[10px] uppercase mb-1">Proposed Draft (In Review)</span>
                                <div className="w-full h-14 rounded overflow-hidden mb-1 bg-black">
                                  <img src={ad.pendingChanges.thumbnailUrl || ad.pendingChanges.mediaUrl || ad.mediaUrl} alt="Draft" className="w-full h-full object-cover" />
                                </div>
                                <span className="font-semibold text-amber-950 block truncate">{ad.pendingChanges.headline || ad.headline}</span>
                                <span className="text-[10px] text-amber-800 block truncate">{ad.pendingChanges.location || ad.location}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {isCreativeRejected && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex flex-col gap-1">
                          <span className="font-bold text-[11px] flex items-center gap-1.5 text-rose-800">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                            <span>Proposed Creative Update Declined</span>
                          </span>
                          <p className="text-[11px] text-rose-800">
                            {ad.changesRejectionReason || 'The proposed creative did not pass platform review. Your original live ad remains running.'}
                          </p>
                        </div>
                      )}

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
                            ) : isPaused ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                                <Pause className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>Paused</span>
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

                      {/* Action Bar: Pause/Resume Toggle Switch & Edit Ad Button */}
                      <div className="pt-2 border-t border-[#E5E7EB]/70 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {/* Safe Pause / Resume Switch */}
                          {(ad.status === 'active' || ad.status === 'paused') && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(ad)}
                              className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                                isPaused
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                  : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                              }`}
                              title={isPaused ? 'Resume campaign runtime' : 'Pause campaign temporarily (Safe instant update)'}
                            >
                              {isPaused ? <Play className="w-3 h-3 text-emerald-600 fill-emerald-600" /> : <Pause className="w-3 h-3 text-stone-500" />}
                              <span>{isPaused ? 'Resume' : 'Pause'}</span>
                            </button>
                          )}

                          {ad.actionType === 'website' && ad.websiteUrl && (
                            <a
                              href={ad.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1.5 px-2 rounded-xl text-xs text-[#70798C] hover:text-[#342A21] flex items-center gap-1 hover:bg-[#F6F3EF]"
                              title={ad.websiteUrl}
                            >
                              <Globe className="w-3 h-3" />
                              <span className="hidden sm:inline truncate max-w-[90px]">{ad.ctaText || 'Link'}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {ad.whatsappNumber && (
                            <span className="text-[10px] text-[#70798C] flex items-center gap-1 hidden sm:flex">
                              <WhatsAppIcon className="w-3 h-3 text-emerald-600" />
                              <span>{ad.whatsappNumber}</span>
                            </span>
                          )}
                        </div>

                        {/* Edit Ad Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(ad)}
                          className="py-1.5 px-3 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                          <span>Edit Ad</span>
                        </button>
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
                <h4 className="font-display text-xl text-[#342A21]">Campaign Funded & Submitted!</h4>
                
                <div className="p-3.5 bg-[#FCF9F5] rounded-2xl border border-[#E5E7EB] text-left text-xs space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-[#E5E7EB]">
                    <span className="text-[#70798C]">Setlla Campaign Ref:</span>
                    <code className="font-mono font-bold text-[#342A21]">{submissionSuccess}</code>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#E5E7EB]">
                    <span className="text-[#70798C]">Payment Source:</span>
                    <span className="font-semibold text-emerald-800 flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ad Credits Wallet</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#E5E7EB]">
                    <span className="text-[#70798C]">Amount Debited:</span>
                    <span className="font-bold text-[#342A21] font-mono">{currentTier.price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#70798C]">Remaining Wallet Balance:</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-xs font-mono">
                      ₦{(currentAdvertiser.walletBalance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#70798C] leading-relaxed">
                  Your ad has been funded from your credit wallet and queued for verification. Our review desk verifies creatives within 1 hour.
                </p>
                <button
                  onClick={() => { setSubmissionSuccess(null); setActiveTab('campaigns'); }}
                  className="py-2.5 px-5 rounded-xl bg-[#342A21] text-white text-xs font-semibold cursor-pointer"
                >
                  View in My Campaigns
                </button>
              </div>
            ) : (
              <form onSubmit={handleFundCampaignFromWallet} className="space-y-6">
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

                {/* Bottom Action Bar: Wallet Credit Funding */}
                <div className="pt-5 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] text-[#70798C] uppercase tracking-wider block">Total Campaign Fee</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-bold text-[#342A21]">{currentTier.price}</span>
                      <span className="text-xs text-[#70798C]">({currentTier.durationDays} Days Duration)</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs">
                      <span className="text-[#70798C]">Your Wallet:</span>
                      <strong className="font-mono text-[#342A21]">₦{(currentAdvertiser.walletBalance || 0).toLocaleString()}</strong>
                      {(currentAdvertiser.walletBalance || 0) >= currentTier.budgetAmount ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                          ✓ Sufficient Credits
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-bold">
                          Shortfall: ₦{(currentTier.budgetAmount - (currentAdvertiser.walletBalance || 0)).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-stretch sm:items-end gap-1.5 w-full sm:w-auto">
                    {(currentAdvertiser.walletBalance || 0) >= currentTier.budgetAmount ? (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="py-3 px-6 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-semibold flex items-center justify-center gap-2 shadow-card cursor-pointer disabled:opacity-50 transition-all active:scale-[0.99] whitespace-nowrap"
                      >
                        <Wallet className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span>Launch Campaign (Deduct {currentTier.price} Credits)</span>
                        <ChevronRight className="w-4 h-4 text-amber-300 shrink-0" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const shortfall = currentTier.budgetAmount - (currentAdvertiser.walletBalance || 0);
                          setTopUpAmount(shortfall > 5000 ? shortfall : 5000);
                          setTopUpPack('custom');
                          setPendingPostTopUp(true);
                          setShowTopUpModal(true);
                        }}
                        className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-card cursor-pointer transition-all active:scale-[0.99] whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                        <span>Top Up Wallet & Launch Campaign</span>
                        <ChevronRight className="w-4 h-4 text-white shrink-0" />
                      </button>
                    )}
                    <span className="text-[10px] text-[#70798C] flex items-center gap-1.5 self-center sm:self-end">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Zero per-ad checkout friction · Debited directly from Ad Credits Wallet</span>
                    </span>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: AD CREDITS & WALLET LEDGER                                     */}
        {/* ===================================================================== */}
        {activeTab === 'wallet' && (
          <div className="space-y-6 animate-fade-in">
            {/* Wallet Balance Hero Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#342A21]/15 shadow-card space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    Setlla Ads Wallet
                  </span>
                  <h3 className="font-display text-3xl sm:text-4xl text-[#342A21] font-bold mt-2">
                    ₦{(currentAdvertiser.walletBalance || 0).toLocaleString()}
                  </h3>
                  <p className="text-xs text-[#70798C] mt-1">
                    Available Ad Credits for running and extending sponsored campaigns across the network.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setTopUpAmount(45000);
                      setTopUpPack(45000);
                      setShowTopUpModal(true);
                    }}
                    className="py-3 px-6 rounded-2xl bg-[#342A21] hover:bg-[#231C16] text-white text-xs font-bold flex items-center gap-2 shadow-card cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <Plus className="w-4 h-4 text-amber-300" />
                    <span>Buy Ad Credits / Top Up</span>
                  </button>
                </div>
              </div>

              {/* Quick Top Up Tier Cards */}
              <div className="pt-6 border-t border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#70798C]">
                    Instant Credit Top-Up Packages
                  </label>
                  <span className="text-[11px] text-[#70798C]">Secured by Paystack</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div
                    onClick={() => {
                      setTopUpAmount(15000);
                      setTopUpPack(15000);
                      setShowTopUpModal(true);
                    }}
                    className="p-4 rounded-2xl border border-[#E5E7EB] hover:border-[#342A21] bg-[#FCF9F5] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#342A21]">Starter Pack</span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">7 Days</span>
                    </div>
                    <span className="text-xl font-bold text-[#342A21] mt-1 block">₦15,000</span>
                    <p className="text-[11px] text-[#70798C] mt-0.5">Top up ₦15,000 credits for single property highlight.</p>
                    <span className="inline-block text-[11px] font-semibold text-amber-700 mt-2 group-hover:underline">
                      Top Up ₦15,000 →
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setTopUpAmount(45000);
                      setTopUpPack(45000);
                      setShowTopUpModal(true);
                    }}
                    className="p-4 rounded-2xl border-2 border-amber-400 bg-amber-50/50 shadow-subtle transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <span className="absolute top-2 right-2 text-[9px] uppercase font-black bg-amber-500 text-white px-2 py-0.5 rounded">
                      Popular
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#342A21]">Growth Partner Pack</span>
                    </div>
                    <span className="text-xl font-black text-[#342A21] mt-1 block">₦45,000</span>
                    <p className="text-[11px] text-[#70798C] mt-0.5">Top up ₦45,000 credits for 30-day verified campaigns.</p>
                    <span className="inline-block text-[11px] font-bold text-amber-800 mt-2 group-hover:underline">
                      Top Up ₦45,000 →
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setTopUpAmount(120000);
                      setTopUpPack(120000);
                      setShowTopUpModal(true);
                    }}
                    className="p-4 rounded-2xl border border-[#E5E7EB] hover:border-[#342A21] bg-[#FCF9F5] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#342A21]">Corporate Booster</span>
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">90 Days</span>
                    </div>
                    <span className="text-xl font-bold text-[#342A21] mt-1 block">₦120,000</span>
                    <p className="text-[11px] text-[#70798C] mt-0.5">Top up ₦120,000 credits for multi-campaign corporate runtime.</p>
                    <span className="inline-block text-[11px] font-semibold text-amber-700 mt-2 group-hover:underline">
                      Top Up ₦120,000 →
                    </span>
                  </div>
                </div>
              </div>

              {/* Transactions Ledger */}
              <div className="pt-6 border-t border-[#E5E7EB] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-medium text-base text-[#342A21]">
                    Wallet Transactions Ledger
                  </h4>
                  <span className="text-xs text-[#70798C]">
                    {(currentAdvertiser.transactions || []).length} recorded transactions
                  </span>
                </div>

                {(!currentAdvertiser.transactions || currentAdvertiser.transactions.length === 0) ? (
                  <div className="p-8 text-center bg-[#FCF9F5] rounded-2xl border border-[#E5E7EB] text-xs text-[#70798C]">
                    No wallet transactions recorded yet. Buy ad credits to fund your first campaign.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {currentAdvertiser.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3.5 bg-[#FCF9F5] rounded-2xl border border-[#E5E7EB] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            tx.type === 'credit_purchase'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-stone-200 text-stone-700'
                          }`}>
                            {tx.type === 'credit_purchase' ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-[#342A21] block">{tx.description}</span>
                            <span className="text-[11px] text-[#70798C]">
                              {new Date(tx.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {tx.reference && ` · Ref: ${tx.reference}`}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`font-mono font-bold text-sm block ${
                            tx.type === 'credit_purchase' ? 'text-emerald-700' : 'text-[#342A21]'
                          }`}>
                            {tx.type === 'credit_purchase' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-[#70798C] uppercase font-semibold">
                            {tx.type === 'credit_purchase' ? 'Credit Added' : 'Campaign Runtime'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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

      {/* Top Up Wallet Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#342A21]/20 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-lg text-[#342A21]">Top Up Ad Credits</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowTopUpModal(false);
                  setPendingPostTopUp(false);
                }}
                className="p-1 rounded-xl text-[#70798C] hover:text-[#342A21] hover:bg-[#F6F3EF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#70798C]">
              Select an Ad Credit package or enter custom amount to fund your Setlla advertising wallet via Paystack.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { amount: 15000, label: '₦15,000' },
                { amount: 45000, label: '₦45,000' },
                { amount: 120000, label: '₦120,000' },
              ].map((p) => (
                <button
                  key={p.amount}
                  type="button"
                  onClick={() => {
                    setTopUpPack(p.amount);
                    setTopUpAmount(p.amount);
                    setCustomTopUpAmount('');
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    topUpPack === p.amount
                      ? 'border-[#342A21] bg-[#342A21] text-white shadow-xs'
                      : 'border-[#E5E7EB] bg-[#FCF9F5] text-[#342A21] hover:bg-[#F6F3EF]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-medium text-[#342A21] block mb-1">Custom Top Up Amount (₦)</label>
              <input
                type="number"
                min={5000}
                step={1000}
                placeholder="e.g. 30000"
                value={customTopUpAmount}
                onChange={(e) => {
                  setCustomTopUpAmount(e.target.value);
                  const val = Number(e.target.value);
                  if (val > 0) {
                    setTopUpAmount(val);
                    setTopUpPack('custom');
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-mono font-bold text-[#000004] focus:outline-none focus:border-[#342A21]"
              />
              <span className="text-[10px] text-[#70798C] block mt-1">Minimum top-up amount: ₦5,000</span>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex justify-between items-center">
              <span>Amount to Charge:</span>
              <span className="font-bold text-base text-[#342A21] font-mono">₦{topUpAmount.toLocaleString()}</span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowTopUpModal(false);
                  setPendingPostTopUp(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#70798C] hover:bg-[#F6F3EF] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTopUpModal(false);
                  setShowPaystackModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>Pay ₦{topUpAmount.toLocaleString()} via Paystack</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ad Modal: Safe vs Sensitive Fields (Draft / Shadow Edit Pattern) */}
      {editingAdvert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-8 border border-[#342A21]/20 shadow-2xl space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Advertiser Campaign Editor
                </span>
                <h3 className="font-display font-bold text-lg text-[#342A21] mt-1 line-clamp-1">
                  Edit Ad: {editingAdvert.headline}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAdvert(null)}
                className="p-1.5 rounded-xl text-[#70798C] hover:text-[#342A21] hover:bg-[#F6F3EF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Platform Integrity & Shadow Runtime Guarantee Notice */}
            <div className="p-3.5 rounded-2xl bg-[#FCF9F5] border border-[#E5E7EB] text-xs text-[#342A21] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-[#342A21]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Setlla Platform Integrity & Runtime Guarantee</span>
              </div>
              <p className="text-[11px] text-[#70798C] leading-relaxed">
                <strong>Safe fields</strong> (destination URL, WhatsApp number, CTA) take effect <strong>instantly</strong> in the public feed without interruption.
                <br />
                <strong>Sensitive updates</strong> (banner flyers, headlines, target zones) create a <strong>shadow record</strong> submitted for Admin review. Your current live ad remains actively running until approved.
              </p>
            </div>

            {editStatusMessage && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                editStatusMessage.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : editStatusMessage.type === 'warning'
                  ? 'bg-amber-50 border border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editStatusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditAd} className="space-y-6">
              {/* SECTION A: SAFE FIELDS */}
              <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                      1. Safe Fields (Instant Live Updates — No Review Needed)
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    ✓ Instant Live
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-medium text-[#342A21] block mb-1">Action Type</label>
                    <AdminCustomSelect
                      value={editActionType}
                      onChange={(val) => setEditActionType(val as any)}
                      options={[
                        { value: 'website', label: 'Send to Website URL' },
                        { value: 'contact', label: 'Chat on WhatsApp' },
                      ]}
                      variant="form"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#342A21] block mb-1">CTA Button Label</label>
                    <input
                      type="text"
                      required
                      value={editCtaText}
                      onChange={(e) => setEditCtaText(e.target.value)}
                      placeholder="Visit Website or Chat on WhatsApp"
                      className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                  </div>

                  {editActionType === 'website' && (
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-[#342A21] block mb-1">Destination Website URL</label>
                      <input
                        type="url"
                        value={editWebsiteUrl}
                        onChange={(e) => setEditWebsiteUrl(e.target.value)}
                        placeholder="https://yourbrand.ng/promo"
                        className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-mono text-[#000004] focus:outline-none focus:border-[#342A21]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-[#342A21] block mb-1">WhatsApp Business Number</label>
                    <input
                      type="tel"
                      value={editWhatsappNumber}
                      onChange={(e) => setEditWhatsappNumber(e.target.value)}
                      placeholder="e.g. 08012345678"
                      className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#342A21] block mb-1">Phone Call Line (Optional)</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. 08123456789"
                      className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: SENSITIVE FIELDS */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/90 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                      2. Sensitive Fields (Triggers Admin Re-approval via Shadow Record)
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    🛡 Shadow Review
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-[#342A21] block mb-1">Headline (Max 60 chars)</label>
                    <input
                      type="text"
                      required
                      maxLength={65}
                      value={editHeadline}
                      onChange={(e) => setEditHeadline(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#342A21] block mb-1">Target Location / City</label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#342A21] block mb-1">Offer Price / Tag</label>
                    <input
                      type="text"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="e.g. From ₦45,000"
                      className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-[#342A21] block mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                  </div>

                  {/* Creative Banner Upload or Direct URL */}
                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[#342A21]">Ad Creative Banner / Video</label>
                      <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-white p-0.5">
                        <button
                          type="button"
                          onClick={() => setEditMediaSourceMode('upload')}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded cursor-pointer ${
                            editMediaSourceMode === 'upload' ? 'bg-[#342A21] text-white' : 'text-[#70798C]'
                          }`}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditMediaSourceMode('url')}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded cursor-pointer ${
                            editMediaSourceMode === 'url' ? 'bg-[#342A21] text-white' : 'text-[#70798C]'
                          }`}
                        >
                          Image URL
                        </button>
                      </div>
                    </div>

                    {editMediaSourceMode === 'upload' ? (
                      <div>
                        <input
                          type="file"
                          accept="image/*,video/mp4"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingEditMedia(true);
                            try {
                              const processed = await processUploadedFile(file, 0);
                              setEditMediaUrl(processed.url);
                              setEditMediaType(processed.type);
                              setEditUploadedFileName(file.name);
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsUploadingEditMedia(false);
                            }
                          }}
                          className="w-full text-xs text-[#70798C] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#342A21] file:text-white hover:file:bg-[#231C16] cursor-pointer"
                        />
                        {isUploadingEditMedia && <span className="text-[11px] text-amber-700 block mt-1">Uploading...</span>}
                      </div>
                    ) : (
                      <input
                        type="url"
                        value={editMediaUrl}
                        onChange={(e) => setEditMediaUrl(e.target.value)}
                        placeholder="https://... image or MP4 URL"
                        className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-mono text-[#000004] focus:outline-none focus:border-[#342A21]"
                      />
                    )}

                    {editMediaUrl && (
                      <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-[#E5E7EB]">
                        <div className="w-12 h-12 rounded overflow-hidden bg-black shrink-0">
                          {editMediaType === 'video' ? (
                            <video src={editMediaUrl} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={editMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <span className="text-xs text-[#70798C] truncate flex-1 font-mono">{editMediaUrl}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingAdvert(null)}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#70798C] hover:bg-[#F6F3EF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingEdit ? (
                    <span>Saving Edits...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Save & Apply Updates</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Paystack Top Up Checkout Gateway Modal */}
      <PaystackModal
        isOpen={showPaystackModal}
        onClose={() => {
          setShowPaystackModal(false);
          setPendingPostTopUp(false);
        }}
        amount={topUpAmount}
        applicantEmail={currentAdvertiser.email}
        applicantName={currentAdvertiser.companyName}
        applicantPhone={whatsappNumber || phone || currentAdvertiser.phone}
        merchantName="Setlla Ad Credits Wallet"
        purposeTitle={`Wallet Top Up · ₦${topUpAmount.toLocaleString()} Ad Credits`}
        buttonText={`Pay ₦${topUpAmount.toLocaleString()} to Fund Wallet`}
        onSuccess={handleWalletTopUpSuccess}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#342A21] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-slide-up border border-[#342A21]/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white/70 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
