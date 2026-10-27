import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  Globe, 
  Copy, 
  Check, 
  Play, 
  Plus, 
  Trash2, 
  ChevronRight,
  Megaphone,
  Eye,
  TrendingUp,
  Clock,
  Layers,
  Building2,
  Phone,
  Mail,
  Zap,
  ExternalLink,
  Code2,
  KeyRound,
  BookOpen,
  ArrowRight,
  Upload,
  ImageIcon,
  Film,
  AlertCircle,
  X,
  Lock,
  ShieldCheck,
  Compass,
  ArrowLeft
} from 'lucide-react';
import { PaystackModal } from '../Booking/PaystackModal';
import { 
  submitPartnerAdvert, 
  PartnerSubmissionPayload,
  getPartnerApiKeys,
  createPartnerApiKey,
  togglePartnerApiKey,
  deletePartnerApiKey,
  pushProgrammaticAdvert,
  PartnerApiKey,
  ProgrammaticPushPayload
} from '../../services/adService';
import { AdvertStory } from '../../data/mockAdverts';
import { UserProfile } from '../../types/marketplace';
import { CustomConfirmModal } from '../UI/CustomConfirmModal';
import { AdminCustomSelect } from '../UI/AdminCustomSelect';
import { AdvertiserUser, getActiveAdvertiser, logoutAdvertiser } from '../../services/advertiserAuthService';
import { isSuperAdminAuthenticated } from '../../services/adminAuthService';
import { AdvertiserAuthModal } from '../Advertiser/AdvertiserAuthModal';
import { AdvertiserDashboard } from '../Advertiser/AdvertiserDashboard';
import { AdsSetupGuide } from '../Adverts/AdsSetupGuide';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
import { processUploadedFile } from '../../utils/mediaStorage';

interface PartnerPortalPageProps {
  onBackToExplore?: () => void;
  onAdSubmitted?: (ad: AdvertStory) => void;
  currentUser?: UserProfile;
}

export const PartnerPortalPage: React.FC<PartnerPortalPageProps> = ({
  onBackToExplore,
  onAdSubmitted,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'packages' | 'placements' | 'api' | 'guide'>('packages');
  const [activeAdvertiser, setActiveAdvertiser] = useState<AdvertiserUser | null>(() => getActiveAdvertiser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'signup'>('login');
  const [viewMode, setViewMode] = useState<'landing' | 'advertiser-dashboard'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if ((hash.includes('advertiser') || hash.includes('manage')) && getActiveAdvertiser()) {
        return 'advertiser-dashboard';
      }
    }
    return 'landing';
  });

  // Campaign Booking State
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

  const handleClearMedia = () => {
    setMediaUrl('');
    setUploadedFileName(null);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    trackingRef: string;
    advert: AdvertStory;
    paymentRef?: string;
    paymentMethod?: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPaystackModal, setShowPaystackModal] = useState(false);

  // Placements Preview State
  const [previewPlacement, setPreviewPlacement] = useState<'stories' | 'sidebar' | 'feed'>('stories');

  // Developer REST API & Webhook State
  const [keys, setKeys] = useState<PartnerApiKey[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // API Sandbox State
  const [simSelectedKey, setSimSelectedKey] = useState('');
  const [simHeadline, setSimHeadline] = useState('24/7 Solar Backup Power for Modern Homes');
  const [simCompanyName, setSimCompanyName] = useState('Apex Solar & Power Solutions Ltd');
  const [simMediaUrl, setSimMediaUrl] = useState('https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1080&q=80');
  const [simCategory, setSimCategory] = useState<'Property' | 'Estate' | 'Promo' | 'Service'>('Service');
  const [simCtaText, setSimCtaText] = useState('Get Free Quote');
  const [simWhatsapp, setSimWhatsapp] = useState('08031122334');
  const [simDuration, setSimDuration] = useState(30);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    status: number;
    success: boolean;
    advert?: AdvertStory;
    error?: string;
  } | null>(null);

  // Custom Confirm Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemTitle?: string;
    badge?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    isAlertOnly?: boolean;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const loadedKeys = getPartnerApiKeys();
    setKeys(loadedKeys);
    if (loadedKeys.length > 0) {
      setSimSelectedKey(loadedKeys[0].apiKey);
    }

    const handleHash = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.toLowerCase();
        if (hash.includes('advertiser') || hash.includes('manage')) {
          if (getActiveAdvertiser()) {
            setViewMode('advertiser-dashboard');
          } else {
            setAuthModalInitialMode('login');
            setIsAuthModalOpen(true);
          }
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const TIERS = [
    {
      id: 'starter' as const,
      name: 'Starter Spotlight',
      durationDays: 7,
      price: '₦15,000',
      budgetAmount: 15000,
      description: 'Ideal for shortlet promos, flash discounts, or weekend property launches.',
      badge: '7-Day Plan',
      features: [
        'Feed Stories Tray prominent rotation',
        'Direct 1-Click WhatsApp & call routing',
        'Standard sponsor attribution badge',
        'Basic weekly impression metrics',
      ],
    },
    {
      id: 'growth' as const,
      name: 'Growth Partner',
      durationDays: 30,
      price: '₦45,000',
      budgetAmount: 45000,
      popular: true,
      description: 'Recommended for corporate agencies, solar installers, and interior furnishers.',
      badge: 'Most Popular · 30 Days',
      features: [
        'Dual Placement: Stories Tray + Desktop Pinned Banner',
        'Featured Partner Placement',
        'Priority targeting across Asaba, Warri & Abraka',
        'Direct WhatsApp lead routing',
        'Weekly campaign performance digest',
      ],
    },
    {
      id: 'corporate' as const,
      name: 'Corporate Leader',
      durationDays: 90,
      price: '₦120,000',
      budgetAmount: 120000,
      description: 'Built for enterprise developers, financial institutions, and major brands.',
      badge: 'Quarterly VIP · 90 Days',
      features: [
        'Permanent top-rotation across all property feeds',
        'Dedicated VIP Account Executive & ad design assistance',
        'Direct listing integration & custom lead webhook',
        'Network-wide broadcast across all marketplace feeds',
        'Comprehensive monthly conversion analytics report',
      ],
    },
  ];

  const currentTier = TIERS.find((t) => t.id === packageTier) || TIERS[1];

  const handleMediaPreset = (url: string, type: 'image' | 'video' = 'image') => {
    setMediaUrl(url);
    setMediaType(type);
    setUploadedFileName(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!companyName || !headline || !partnerEmail || !mediaUrl) {
      setFormError('Please complete your brand name, campaign headline, official email, and media URL.');
      return;
    }

    // Lead advertiser directly to the Paystack payment platform
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
        price: price || undefined,
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
      if (onAdSubmitted) {
        onAdSubmitted(result.advert);
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setFormError('Payment confirmed, but could not register campaign. Please contact support with payment ref: ' + paymentReference);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText('https://iadzihievmbhssqycpol.supabase.co/rest/v1/adverts');
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const handleCopyCurl = () => {
    const activeKey = keys[0]?.apiKey || 'stla_live_sample_partner_key';
    const curlCode = `curl -X POST "https://iadzihievmbhssqycpol.supabase.co/rest/v1/adverts" \\
  -H "Content-Type: application/json" \\
  -H "X-Setlla-Partner-Key: ${activeKey}" \\
  -d '{
    "companyName": "Apex Solar & Power Solutions Ltd",
    "headline": "24/7 Solar Backup Power for Modern Homes",
    "description": "Zero down payment solar installations for apartments and commercial spaces.",
    "category": "Service",
    "mediaUrl": "https://images.unsplash.com/photo-1509391365360-2e959784a276",
    "ctaText": "Get Free Quote",
    "actionType": "contact",
    "whatsappNumber": "08031122334",
    "location": "Nationwide",
    "durationDays": 30
  }'`;
    navigator.clipboard.writeText(curlCode);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName || !newEmail) return;
    const created = createPartnerApiKey(newCompanyName, newEmail, newPhone);
    setKeys(getPartnerApiKeys());
    setShowNewKeyModal(false);
    setNewCompanyName('');
    setNewEmail('');
    setNewPhone('');
    setSimSelectedKey(created.apiKey);
  };

  const handleToggleKey = (id: string) => {
    const updated = togglePartnerApiKey(id);
    setKeys(updated);
  };

  const handleDeleteKey = (id: string) => {
    const targetKey = keys.find((k) => k.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Revoke Corporate Partner API Key?',
      message: 'Any automated marketing scripts or server integrations using this API key will immediately be rejected.',
      itemTitle: targetKey ? `${targetKey.companyName} (${targetKey.apiKey})` : id,
      badge: 'API SECURITY ACTION',
      confirmText: 'Yes, Revoke Key',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        const updated = deletePartnerApiKey(id);
        setKeys(updated);
        setConfirmModal(null);
      },
    });
  };

  const handleRunSimulation = async () => {
    if (!simSelectedKey) {
      setConfirmModal({
        isOpen: true,
        title: 'Partner API Key Required',
        message: 'Please generate or select an active Partner API Key before executing a programmatic push simulation.',
        badge: 'GATEWAY VALIDATION',
        confirmText: 'Understood',
        variant: 'warning',
        isAlertOnly: true,
        onConfirm: () => setConfirmModal(null),
      });
      return;
    }
    setIsSimulating(true);
    setSimResult(null);

    const payload: ProgrammaticPushPayload = {
      companyName: simCompanyName,
      headline: simHeadline,
      description: 'Programmatic push test campaign executed via Setlla Live Webhook API Gateway.',
      category: simCategory,
      mediaUrl: simMediaUrl,
      mediaType: 'image',
      ctaText: simCtaText,
      actionType: 'contact',
      whatsappNumber: simWhatsapp,
      location: 'Network Wide',
      durationDays: simDuration,
    };

    setTimeout(async () => {
      const res = await pushProgrammaticAdvert(payload, simSelectedKey);
      setSimResult({
        status: res.statusCode,
        success: res.success,
        advert: res.advert,
        error: res.error,
      });
      setIsSimulating(false);
      if (res.success && res.advert && onAdSubmitted) {
        onAdSubmitted(res.advert);
      }
      setKeys(getPartnerApiKeys());
    }, 600);
  };

  const handleReturn = () => {
    // Strictly clear any admin tokens from storage so explore feed is 100% public
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('setlla_admin_auth');
        localStorage.removeItem('setlla_admin_user');
      } catch (_) {}
    }
    if (onBackToExplore) {
      onBackToExplore();
    } else {
      window.location.hash = '#/explore';
    }
  };

  // Dedicated Full-Page Advertiser Customer Dashboard
  if (viewMode === 'advertiser-dashboard' && activeAdvertiser) {
    return (
      <>
        <AdvertiserDashboard
          advertiser={activeAdvertiser}
          onLogout={() => {
            logoutAdvertiser();
            setActiveAdvertiser(null);
            setViewMode('landing');
            window.location.hash = '#/partner';
          }}
          onBackToPortal={() => {
            setViewMode('landing');
            window.location.hash = '#/partner';
          }}
          onBackToExplore={() => {
            setViewMode('landing');
            window.location.hash = '#/partner';
          }}
          onCampaignCreated={(newAd) => {
            if (onAdSubmitted) onAdSubmitted(newAd);
          }}
        />
        {/* Custom Confirmation Modal */}
        {confirmModal && (
          <CustomConfirmModal
            isOpen={confirmModal.isOpen}
            title={confirmModal.title}
            message={confirmModal.message}
            itemTitle={confirmModal.itemTitle}
            badge={confirmModal.badge}
            confirmText={confirmModal.confirmText}
            cancelText={confirmModal.cancelText}
            variant={confirmModal.variant}
            isAlertOnly={confirmModal.isAlertOnly}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal(null)}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCF9F5] text-[#000004] font-body selection:bg-[#342A21]/10 selection:text-[#342A21]">
      {/* 1. Brand Top Navigation Bar (Partner & Customer Focused) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#342A21]/10">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Dedicated Explore Feed Return Button / UI */}
            <button
              onClick={handleReturn}
              className="py-1.5 sm:py-2 px-2.5 sm:px-3.5 rounded-xl border border-[#342A21]/20 bg-white hover:bg-[#342A21] text-[#342A21] hover:text-[#FCF9F5] text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 group"
              title="Return to property explore feed"
            >
              <Compass className="w-4 h-4 text-[#F95700] group-hover:rotate-45 transition-transform shrink-0" />
              <span className="whitespace-nowrap">Explore Feed</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <img 
                src="/images/setlla-logo.png" 
                alt="Setlla" 
                className="h-5 sm:h-5.5 w-auto object-contain cursor-pointer shrink-0" 
                onClick={handleReturn}
              />
              <span className="hidden md:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#342A21]/5 text-[#342A21] border border-[#342A21]/15 whitespace-nowrap">
                Partner Ads
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <nav className="hidden md:flex items-center gap-1 p-1 bg-[#FCF9F5] rounded-xl border border-[#E5E7EB]">
              <button
                onClick={() => {
                  setActiveTab('packages');
                  const el = document.getElementById('ad-creation-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'packages'
                    ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                    : 'text-[#70798C] hover:text-[#342A21]'
                }`}
              >
                Ad Packages
              </button>
              <button
                onClick={() => {
                  setActiveTab('placements');
                  const el = document.getElementById('ad-creation-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'placements'
                    ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                    : 'text-[#70798C] hover:text-[#342A21]'
                }`}
              >
                Showcase
              </button>
              <button
                onClick={() => {
                  setActiveTab('api');
                  const el = document.getElementById('ad-creation-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'api'
                    ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                    : 'text-[#70798C] hover:text-[#342A21]'
                }`}
              >
                REST API
              </button>
              <button
                onClick={() => {
                  setActiveTab('guide');
                  const el = document.getElementById('ad-creation-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === 'guide'
                    ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                    : 'text-[#70798C] hover:text-[#342A21]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Ads Guide</span>
              </button>
            </nav>

            {/* Advertiser Account Login / Dashboard trigger */}
            {activeAdvertiser ? (
              <button
                onClick={() => setViewMode('advertiser-dashboard')}
                className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#342A21] text-[#FCF9F5] hover:bg-[#231C16] text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                title="Go to your Customer Ads Dashboard"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="max-w-[100px] sm:max-w-[150px] truncate">{activeAdvertiser.companyName}</span>
                <ChevronRight className="w-3 h-3 text-stone-300 shrink-0" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setAuthModalInitialMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-[#F6F3EF] text-[#342A21] border border-[#342A21]/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#342A21] shrink-0" />
                  <span className="whitespace-nowrap">Sign In</span>
                </button>
                <button
                  onClick={() => {
                    setAuthModalInitialMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span className="whitespace-nowrap">Register</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden border-t border-[#342A21]/5 bg-[#FCF9F5] px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar scroll-smooth">
          <button
            onClick={handleReturn}
            className="py-1.5 px-3 rounded-lg font-bold transition-all shrink-0 whitespace-nowrap text-xs bg-white hover:bg-[#342A21] text-[#342A21] hover:text-white border border-[#342A21]/20 flex items-center gap-1.5 shadow-2xs cursor-pointer group active:scale-95"
          >
            <Compass className="w-3.5 h-3.5 text-[#F95700] group-hover:rotate-45 transition-transform shrink-0" />
            <span>Explore Feed</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('packages');
              const el = document.getElementById('ad-creation-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`py-1.5 px-3 rounded-lg font-semibold transition-colors shrink-0 whitespace-nowrap text-xs ${
              activeTab === 'packages' ? 'bg-[#342A21] text-white shadow-2xs' : 'text-[#70798C] bg-white border border-[#E5E7EB]'
            }`}
          >
            Ad Packages
          </button>
          <button
            onClick={() => {
              setActiveTab('placements');
              const el = document.getElementById('ad-creation-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`py-1.5 px-3 rounded-lg font-semibold transition-colors shrink-0 whitespace-nowrap text-xs ${
              activeTab === 'placements' ? 'bg-[#342A21] text-white shadow-2xs' : 'text-[#70798C] bg-white border border-[#E5E7EB]'
            }`}
          >
            Showcase
          </button>
          <button
            onClick={() => {
              setActiveTab('api');
              const el = document.getElementById('ad-creation-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`py-1.5 px-3 rounded-lg font-semibold transition-colors shrink-0 whitespace-nowrap text-xs ${
              activeTab === 'api' ? 'bg-[#342A21] text-white shadow-2xs' : 'text-[#70798C] bg-white border border-[#E5E7EB]'
            }`}
          >
            REST API
          </button>
          <button
            onClick={() => {
              setActiveTab('guide');
              const el = document.getElementById('ad-creation-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`py-1.5 px-3 rounded-lg font-semibold transition-colors shrink-0 whitespace-nowrap text-xs ${
              activeTab === 'guide' ? 'bg-[#342A21] text-white shadow-2xs' : 'text-[#70798C] bg-white border border-[#E5E7EB]'
            }`}
          >
            Ads Guide
          </button>
        </div>
      </header>

      {/* 2. Hero Section: Marketing Presentation & Direct Action Buttons */}
      <section className="relative pt-10 sm:pt-14 pb-14 px-4 sm:px-6 overflow-hidden border-b border-[#342A21]/10 bg-gradient-to-b from-[#FCF9F5] via-white to-[#FCF9F5]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#342A21]/5 border border-[#342A21]/15 text-[#342A21] text-xs font-semibold">
            <span>Premier Property & Renter Audience</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-[#342A21] font-normal tracking-tight leading-[1.12]">
            Put your brand in front of <em className="italic font-normal">active renters & property investors.</em>
          </h1>

          <p className="text-sm sm:text-base text-[#70798C] max-w-2xl mx-auto leading-relaxed">
            The dedicated ads platform for businesses, realtors, solar installers, interior decorators, and corporate platforms. Upload and manage your own campaigns self-serve, or integrate our enterprise REST API to push programmatic ads directly from your platform.
          </p>

          {/* Primary Action Buttons for Ads Customers */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {activeAdvertiser ? (
              <button
                onClick={() => setViewMode('advertiser-dashboard')}
                className="py-3 px-6 rounded-2xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] font-bold text-sm flex items-center gap-2 shadow-card cursor-pointer transition-all active:scale-[0.99]"
              >
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>Open {activeAdvertiser.companyName} Ads Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthModalInitialMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                  className="py-3 px-6 rounded-2xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] font-bold text-sm flex items-center gap-2 shadow-card cursor-pointer transition-all active:scale-[0.99]"
                >
                  <span>Create Advertiser Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setAuthModalInitialMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="py-3 px-5 rounded-2xl bg-white hover:bg-[#F6F3EF] text-[#342A21] border border-[#342A21]/20 font-bold text-sm flex items-center gap-2 shadow-subtle cursor-pointer transition-all"
                >
                  <KeyRound className="w-4 h-4 text-[#342A21]" />
                  <span>Sign In to Ads Dashboard</span>
                </button>
              </>
            )}

            <button
              onClick={() => {
                setActiveTab('packages');
                const el = document.getElementById('ad-creation-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="py-3 px-4 rounded-2xl bg-[#342A21]/5 hover:bg-[#342A21]/10 text-[#342A21] font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#F95700]" />
              <span>Upload Ad Self-Serve</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('api');
                const el = document.getElementById('ad-creation-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="py-3 px-4 rounded-2xl bg-[#342A21]/5 hover:bg-[#342A21]/10 text-[#342A21] font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-[#B45309]" />
              <span>Enterprise API & Docs</span>
            </button>

            <button
              onClick={handleReturn}
              className="py-3 px-4 rounded-2xl bg-white hover:bg-[#342A21] text-[#342A21] hover:text-[#FCF9F5] border border-[#342A21]/15 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
              title="Preview listings and ads in the live property feed"
            >
              <Compass className="w-4 h-4 text-[#F95700] group-hover:rotate-45 transition-transform" />
              <span>Explore Live Feed</span>
            </button>
          </div>

          {/* Key Value & Audience Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-3xl mx-auto text-left">
            <div className="bg-white p-4 rounded-2xl border border-[#342A21]/10 shadow-subtle">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#70798C] block">Monthly Reach</span>
              <span className="text-xl sm:text-2xl font-bold text-[#342A21] block mt-0.5">50,000+</span>
              <span className="text-[11px] text-[#70798C] block mt-0.5">High-intent viewers</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#342A21]/10 shadow-subtle">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#70798C] block">Direct Conversions</span>
              <span className="text-xl sm:text-2xl font-bold text-[#342A21] block mt-0.5">1-Click</span>
              <span className="text-[11px] text-[#70798C] block mt-0.5">WhatsApp lead routing</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#342A21]/10 shadow-subtle">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#70798C] block">Target Audience</span>
              <span className="text-xl sm:text-2xl font-bold text-[#342A21] block mt-0.5">High-Intent</span>
              <span className="text-[11px] text-[#70798C] block mt-0.5">Renters & property buyers</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#342A21]/10 shadow-subtle">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#70798C] block">Partner Status</span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-700 block mt-0.5">Verified</span>
              <span className="text-[11px] text-[#70798C] block mt-0.5">Official blue badge</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Two Core Customer Pathways: Self-Serve vs Enterprise API */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-6xl mx-auto border-b border-[#342A21]/10">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs uppercase tracking-widest font-bold text-[#B45309]">Built For Modern Advertisers</span>
          <h2 className="font-display text-2xl sm:text-4xl text-[#342A21] font-normal">
            Two Flexible Ways to Market on Setlla
          </h2>
          <p className="text-xs sm:text-sm text-[#70798C] leading-relaxed">
            Whether you prefer to upload your ads directly through our self-serve studio or programmatically push campaigns via our REST API from your own platform, Setlla gives you complete control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pathway A: Self-Serve Upload */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#342A21]/15 shadow-subtle flex flex-col justify-between space-y-6 hover:shadow-card transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#342A21]/5 text-[#342A21] text-[11px] font-bold uppercase tracking-wider border border-[#342A21]/10">
                  Option 1: Self-Service Studio
                </span>
                <span className="w-8 h-8 rounded-xl bg-amber-50 text-[#B45309] flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </span>
              </div>

              <h3 className="font-display text-2xl text-[#342A21] font-normal">
                Upload & Launch Your Own Ads
              </h3>

              <p className="text-xs sm:text-sm text-[#70798C] leading-relaxed">
                Ideal for real estate agencies, interior furnishers, solar companies, hospitality venues, and local merchants who want to upload their banners or flyers directly in minutes.
              </p>

              <ul className="space-y-2.5 text-xs text-[#342A21]/90 pt-2 border-t border-[#E5E7EB]">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold shrink-0">✓</span>
                  <span><strong>Zero Technical Skills Needed:</strong> Upload image banners or vertical story videos with one click.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold shrink-0">✓</span>
                  <span><strong>Dedicated Customer Dashboard:</strong> Private portal to monitor active campaigns, impressions, and click rates.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold shrink-0">✓</span>
                  <span><strong>1-Click WhatsApp Routing:</strong> High-intent renter leads are sent directly to your phone.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold shrink-0">✓</span>
                  <span><strong>Admin Quality Assurance:</strong> Every ad campaign is reviewed and approved by Setlla Admins before going live.</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => {
                  if (activeAdvertiser) {
                    setViewMode('advertiser-dashboard');
                  } else {
                    setAuthModalInitialMode('signup');
                    setIsAuthModalOpen(true);
                  }
                }}
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>{activeAdvertiser ? 'Open Your Ad Studio' : 'Create Advertiser Account'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('packages');
                  const el = document.getElementById('ad-creation-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#FCF9F5] hover:bg-[#F6F3EF] text-[#342A21] border border-[#E5E7EB] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View Ad Packages ↓</span>
              </button>
            </div>
          </div>

          {/* Pathway B: Automated REST API */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#342A21]/15 shadow-subtle flex flex-col justify-between space-y-6 hover:shadow-card transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#342A21]/5 text-[#342A21] text-[11px] font-bold uppercase tracking-wider border border-[#342A21]/10">
                  Option 2: Programmatic REST API
                </span>
                <span className="w-8 h-8 rounded-xl bg-stone-100 text-[#342A21] flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </span>
              </div>

              <h3 className="font-display text-2xl text-[#342A21] font-normal">
                Enterprise REST API & Ingestion
              </h3>

              <p className="text-xs sm:text-sm text-[#70798C] leading-relaxed">
                Tailored for property portals, national brands, proptech apps, and marketing agencies with their own platforms who require automated campaign injection.
              </p>

              <ul className="space-y-2.5 text-xs text-[#342A21]/90 pt-2 border-t border-[#E5E7EB]">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold shrink-0">✓</span>
                  <span><strong>Automated JSON Ingestion:</strong> Push campaigns directly using <code className="bg-[#FCF9F5] px-1 rounded text-[#342A21]">POST /rest/v1/adverts</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold shrink-0">✓</span>
                  <span><strong>Secure API Key Authentication:</strong> Generate and manage personal keys (<code className="bg-[#FCF9F5] px-1 rounded text-[#342A21]">X-Setlla-Partner-Key</code>).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold shrink-0">✓</span>
                  <span><strong>Admin Review Queue:</strong> API-pushed campaigns enter the admin verification queue automatically.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold shrink-0">✓</span>
                  <span><strong>Interactive Sandbox:</strong> Test live payload delivery, curl snippets, and webhook integrations.</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => {
                  setActiveTab('api');
                  const el = document.getElementById('ad-creation-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Explore REST API Docs & Sandbox</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('guide');
                  const el = document.getElementById('ad-creation-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#FCF9F5] hover:bg-[#F6F3EF] text-[#342A21] border border-[#E5E7EB] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Read Integration Guide →</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The 4-Step Review & Publishing Lifecycle */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-6xl mx-auto border-b border-[#342A21]/10">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs uppercase tracking-widest font-bold text-[#B45309]">Admin Review Workflow</span>
          <h2 className="font-display text-2xl sm:text-4xl text-[#342A21] font-normal">
            How Setlla Partner Ads Work
          </h2>
          <p className="text-xs sm:text-sm text-[#70798C] leading-relaxed">
            Every sponsored ad passes through Setlla's verification desk to ensure brand safety, accurate pricing, and market trust.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-[#342A21]/10 shadow-subtle space-y-3">
            <div className="w-9 h-9 rounded-xl bg-[#342A21] text-white flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h4 className="font-display text-lg text-[#342A21] font-medium">Initiate Campaign</h4>
            <p className="text-xs text-[#70798C] leading-relaxed">
              Upload via your Customer Dashboard or push programmatically using our enterprise REST API with your partner key.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#342A21]/10 shadow-subtle space-y-3">
            <div className="w-9 h-9 rounded-xl bg-[#B45309] text-white flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h4 className="font-display text-lg text-[#342A21] font-medium">Admin Review</h4>
            <p className="text-xs text-[#70798C] leading-relaxed">
              Setlla Super Admins inspect the creative, verify contact information, and ensure no fraudulent claims within 1-2 hours.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#342A21]/10 shadow-subtle space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h4 className="font-display text-lg text-[#342A21] font-medium">Explore Feed Live</h4>
            <p className="text-xs text-[#70798C] leading-relaxed">
              Once accepted, your campaign status flips to <strong className="text-emerald-700">Active</strong> and broadcasts to 50,000+ active renters & buyers.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#342A21]/10 shadow-subtle space-y-3">
            <div className="w-9 h-9 rounded-xl bg-[#342A21] text-white flex items-center justify-center font-bold text-xs">
              04
            </div>
            <h4 className="font-display text-lg text-[#342A21] font-medium">Leads & Telemetry</h4>
            <p className="text-xs text-[#70798C] leading-relaxed">
              Renter inquiries route directly to your WhatsApp, while impressions and clicks update in your Customer Dashboard.
            </p>
          </div>
        </div>

        {/* Customer Dashboard vs Super Admin Notice Callout */}
        <div className="mt-8 bg-gradient-to-r from-[#342A21] via-[#231C16] to-[#342A21] text-white rounded-3xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold">
              <span>Customer Ads Management Dashboard</span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl text-white font-normal">
              Dedicated Client Portal for Ads Customers
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              Please note: The <strong>Customer Ads Management Dashboard</strong> is your private portal to manage campaigns, schedules, and API credentials. It is completely distinct from the Setlla Super Admin moderation console.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {activeAdvertiser ? (
              <button
                onClick={() => setViewMode('advertiser-dashboard')}
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-white hover:bg-stone-100 text-[#342A21] font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Open {activeAdvertiser.companyName} Dashboard →</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthModalInitialMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full sm:w-auto py-3 px-5 rounded-xl bg-white hover:bg-stone-100 text-[#342A21] font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#342A21]" />
                  <span>Sign In to Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    setAuthModalInitialMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full sm:w-auto py-3 px-5 rounded-xl bg-[#F95700] hover:bg-[#E65100] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <span>Create Account</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 5. Main Interactive Workspace (Ad Packages, Placements, API, & Guide) */}
      <main id="ad-creation-section" className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#342A21]/10 mb-8">
          <div>
            <h3 className="font-display text-2xl text-[#342A21] font-normal">
              Explore Formats, Ad Rates & API Tools
            </h3>
            <p className="text-xs text-[#70798C] mt-0.5">
              Select a section below to configure self-serve packages, inspect placements, or test the REST API.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#E5E7EB] self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('packages')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === 'packages'
                  ? 'bg-[#342A21] text-white shadow-xs'
                  : 'text-[#70798C] hover:text-[#342A21]'
              }`}
            >
              Ad Packages & Campaign Builder
            </button>
            <button
              onClick={() => setActiveTab('placements')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === 'placements'
                  ? 'bg-[#342A21] text-white shadow-xs'
                  : 'text-[#70798C] hover:text-[#342A21]'
              }`}
            >
              Showcase
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === 'api'
                  ? 'bg-[#342A21] text-white shadow-xs'
                  : 'text-[#70798C] hover:text-[#342A21]'
              }`}
            >
              REST API & Sandbox
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                activeTab === 'guide'
                  ? 'bg-[#342A21] text-white shadow-xs'
                  : 'text-[#70798C] hover:text-[#342A21]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Ads Guide</span>
            </button>
          </div>
        </div>
        {/* ========================================================================= */}
        {/* TAB 1: CAMPAIGN PACKAGES & SELF-SERVICE BOOKING FORM                       */}
        {/* ========================================================================= */}
        {activeTab === 'packages' && (
          <div className="space-y-12">
            {/* Step 1: Package Selection Cards */}
            <div>
              <div className="text-center max-w-xl mx-auto mb-8 space-y-1">
                <span className="text-xs uppercase tracking-widest font-semibold text-[#70798C]">Step 1 of 2</span>
                <h2 className="font-display text-2xl sm:text-3xl text-[#342A21] font-normal">
                  Select your campaign duration
                </h2>
                <p className="text-xs sm:text-sm text-[#70798C]">
                  Choose an upfront ad package. All campaigns include real-time engagement and lead routing.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {TIERS.map((tier) => {
                  const isSelected = packageTier === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setPackageTier(tier.id)}
                      className={`relative bg-white rounded-3xl p-6 border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#342A21] shadow-card ring-2 ring-[#342A21]/15'
                          : 'border-[#342A21]/15 hover:border-[#342A21]/40 shadow-subtle'
                      }`}
                    >
                      {tier.popular && (
                        <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-[#342A21] text-[#FCF9F5] text-[10px] font-bold uppercase tracking-wider shadow-xs">
                          {tier.badge}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-[#70798C] uppercase tracking-wider">
                            {tier.durationDays} Days Duration
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#342A21] text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        <h3 className="font-display text-xl text-[#342A21] font-normal mt-2">
                          {tier.name}
                        </h3>

                        <div className="mt-2 mb-3">
                          <span className="text-2xl sm:text-3xl font-bold text-[#342A21]">{tier.price}</span>
                          <span className="text-xs text-[#70798C]"> / {tier.durationDays} days</span>
                        </div>

                        <p className="text-xs text-[#70798C] leading-relaxed pb-4 border-b border-[#E5E7EB]">
                          {tier.description}
                        </p>

                        <ul className="mt-4 space-y-2.5 text-xs text-[#70798C]">
                          {tier.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-emerald-700 font-bold shrink-0 mt-0.5">✓</span>
                              <span className="text-[#342A21]/90">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-6 mt-6 border-t border-[#E5E7EB]">
                        <button
                          type="button"
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-[#342A21] text-white shadow-xs'
                              : 'bg-[#FCF9F5] hover:bg-[#F6F3EF] text-[#342A21] border border-[#E5E7EB]'
                          }`}
                        >
                          {isSelected ? 'Selected Plan' : 'Choose Plan'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Campaign Booking Form / Confirmation Screen */}
            <div className="bg-white rounded-3xl border border-[#342A21]/15 p-6 sm:p-10 shadow-card">
              {submittedResult ? (
                /* Success Screen */
                <div className="py-6 text-center max-w-xl mx-auto space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold inline-block mb-3 border border-emerald-200">
                      Campaign Queued for Priority Desk Review
                    </span>
                    <h3 className="font-display text-2xl sm:text-3xl text-[#342A21] font-normal">
                      Campaign Successfully Submitted!
                    </h3>
                    <p className="text-xs sm:text-sm text-[#70798C] mt-2 leading-relaxed">
                      We have logged your sponsored campaign for <strong className="text-[#342A21]">"{submittedResult.advert.advertiserName}"</strong>. Your private tracking reference is:
                    </p>

                    <div className="mt-4 p-3.5 bg-[#FCF9F5] rounded-2xl border border-[#E5E7EB] text-left text-xs space-y-2 max-w-sm mx-auto">
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

                  <div className="bg-[#FCF9F5] border border-[#E5E7EB] rounded-2xl p-4 text-left text-xs text-[#342A21] space-y-1.5">
                    <div className="font-semibold flex items-center gap-1.5 text-[#342A21]">
                      <Clock className="w-4 h-4 text-[#B45309]" />
                      <span>Next Step: Fast-Track Creative Review (Typical turn: ~1 hour)</span>
                    </div>
                    <p className="text-[11px] text-[#70798C] leading-relaxed">
                      Our partnership desk verifies creative aspect ratios and business registration before campaign activation. For instant activation, message our WhatsApp desk with your reference code.
                    </p>
                  </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          if (activeAdvertiser) {
                            setViewMode('advertiser-dashboard');
                          } else {
                            setAuthModalInitialMode('signup');
                            setIsAuthModalOpen(true);
                          }
                        }}
                        className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                      >
                        <Building2 className="w-4 h-4 text-amber-300" />
                        <span>{activeAdvertiser ? 'Manage on Advertiser Dashboard' : 'Open Ads Dashboard'}</span>
                      </button>

                      <a
                        href={`https://wa.me/2348000000000?text=${encodeURIComponent(
                          `Hello Setlla Team, I submitted an ad campaign with Ref: ${submittedResult.trackingRef} for ${submittedResult.advert.advertiserName}. Please review and activate.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                      >
                        <WhatsAppIcon className="w-4 h-4" />
                        <span>Fast-Track on WhatsApp</span>
                      </a>

                      <button
                        onClick={() => setSubmittedResult(null)}
                        className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#FCF9F5] hover:bg-[#F6F3EF] text-[#342A21] text-xs font-semibold border border-[#E5E7EB] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Submit Another
                      </button>
                    </div>
                </div>
              ) : (
                /* Booking Form */
                <form onSubmit={handleFormSubmit} className="space-y-8">
                  <div>
                    <span className="text-xs uppercase tracking-widest font-semibold text-[#70798C]">Step 2 of 2</span>
                    <h3 className="font-display text-2xl text-[#342A21] font-normal mt-1">
                      Campaign & creative details
                    </h3>
                    <p className="text-xs text-[#70798C] mt-1">
                      You are booking <strong className="text-[#342A21]">{currentTier.name}</strong> ({currentTier.price} for {currentTier.durationDays} days).
                    </p>
                  </div>

                  {/* Section A: Business & Contact Information */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#342A21] pb-2 border-b border-[#E5E7EB]">
                      1. Brand & Contact Information
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-[#342A21] block mb-1.5">
                          Brand / Company Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Asaba Royal Suites & Residences"
                          className="w-full px-4 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21] focus:ring-1 focus:ring-[#342A21]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-[#342A21] block mb-1.5">
                          Official Contact Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={partnerEmail}
                          onChange={(e) => setPartnerEmail(e.target.value)}
                          placeholder="partners@yourbrand.ng"
                          className="w-full px-4 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21] focus:ring-1 focus:ring-[#342A21]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-[#342A21] block mb-1.5">
                          WhatsApp Business Number (for Instant Tenant Leads) *
                        </label>
                        <input
                          type="text"
                          required
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                          placeholder="e.g. 08012345678"
                          className="w-full px-4 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21] focus:ring-1 focus:ring-[#342A21]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-[#342A21] block mb-1.5">
                          Alternate Phone Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 08123456789"
                          className="w-full px-4 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21] focus:ring-1 focus:ring-[#342A21]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section B: Campaign Content & Creative Assets */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#342A21] pb-2 border-b border-[#E5E7EB]">
                      2. Creative Copy & Visual Assets
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-[#342A21] block mb-1.5">
                          Campaign Headline * (Max 60 chars)
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={65}
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          placeholder="e.g. 20% Off Fully Furnished Shortlet in Asaba"
                          className="w-full px-4 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21] focus:ring-1 focus:ring-[#342A21]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-[#342A21] block mb-1.5">
                          Business / Campaign Category
                        </label>
                        <AdminCustomSelect
                          value={category}
                          onChange={(val) => setCategory(val as any)}
                          options={[
                            { value: 'Promo', label: 'Brand Campaign & Special Offers' },
                            { value: 'Property', label: 'Direct Property Rental' },
                            { value: 'Estate', label: 'Estate Development & Plots' },
                            { value: 'Service', label: 'Home Services (Solar, Interiors, Logistics)' },
                          ]}
                          variant="form"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#342A21] block mb-1.5">
                        Offer Description & Value Proposition
                      </label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detail your special offer, pricing advantages, or why renters and buyers should connect with your brand..."
                        className="w-full px-4 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21] focus:ring-1 focus:ring-[#342A21] leading-relaxed"
                      />
                    </div>

                    {/* Creative Media Upload & URL */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="text-xs font-medium text-[#342A21] block">
                            Creative Media Asset (High-Resolution Image or Video) *
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

                          {mediaUrl && (
                            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row items-center gap-3.5">
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-black shrink-0 relative flex items-center justify-center">
                                {mediaType === 'video' ? (
                                  <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />
                                ) : (
                                  <img src={mediaUrl} alt="Campaign creative preview" className="w-full h-full object-cover" />
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
                          <input
                            type="url"
                            required
                            value={mediaUrl}
                            onChange={(e) => {
                              setMediaUrl(e.target.value);
                              setUploadedFileName(null);
                            }}
                            placeholder="https://... direct image or MP4 URL"
                            className="w-full px-4 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-mono text-[#000004] focus:outline-none focus:border-[#342A21] focus:ring-1 focus:ring-[#342A21]"
                          />

                          {/* Presets */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] text-[#70798C]">Sample Presets:</span>
                            <button
                              type="button"
                              onClick={() => handleMediaPreset('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1080&q=80')}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FCF9F5] hover:bg-[#F6F3EF] border border-[#E5E7EB] text-[#342A21] font-medium transition-colors cursor-pointer"
                            >
                              Modern Penthouse
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMediaPreset('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1080&q=80')}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FCF9F5] hover:bg-[#F6F3EF] border border-[#E5E7EB] text-[#342A21] font-medium transition-colors cursor-pointer"
                            >
                              Luxury Estate
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMediaPreset('https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1080&q=80')}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FCF9F5] hover:bg-[#F6F3EF] border border-[#E5E7EB] text-[#342A21] font-medium transition-colors cursor-pointer"
                            >
                              Solar Power
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

                    {/* Target Action */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                      <div>
                        <label className="text-xs font-medium text-[#342A21] block mb-1.5">Lead Destination</label>
                        <AdminCustomSelect
                          value={actionType}
                          onChange={(val) => {
                            const v = val as any;
                            setActionType(v);
                            if (v === 'website') setCtaText('Visit Website');
                            else setCtaText('Chat on WhatsApp');
                          }}
                          options={[
                            { value: 'website', label: 'Send to Website' },
                            { value: 'contact', label: '1-Click WhatsApp Chat' },
                          ]}
                          variant="form"
                        />
                      </div>

                      {actionType === 'website' ? (
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-[#342A21] block mb-1.5">Destination Web URL</label>
                          <input
                            type="url"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            placeholder="https://yourbrand.ng/promo"
                            className="w-full px-4 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                          />
                        </div>
                      ) : (
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-[#342A21] block mb-1.5">Call to Action Button Label</label>
                          <input
                            type="text"
                            value={ctaText}
                            onChange={(e) => setCtaText(e.target.value)}
                            placeholder="Chat on WhatsApp"
                            className="w-full px-4 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Error Banner */}
                  {formError && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                      {formError}
                    </div>
                  )}

                  {/* Bottom Submission Bar */}
                  <div className="pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] text-[#70798C] uppercase tracking-wider block">Campaign Duration & Fee</span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-bold text-[#342A21]">{currentTier.price}</span>
                        <span className="text-xs text-[#70798C]">({currentTier.durationDays} Days Duration)</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-stretch sm:items-end gap-1.5 w-full sm:w-auto">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleReturn}
                          className="py-3 px-5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F6F3EF] text-xs font-semibold text-[#70798C] hover:text-[#342A21] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="py-3 px-7 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-semibold flex items-center justify-center gap-2 shadow-card transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span>Proceed to Pay {currentTier.price} via Paystack</span>
                          <ChevronRight className="w-4 h-4 text-amber-300 shrink-0" />
                        </button>
                      </div>
                      <span className="text-[10px] text-[#70798C] flex items-center gap-1.5 self-center sm:self-end">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Secured by Paystack · Cards, Bank Transfer & USSD</span>
                      </span>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PLACEMENTS SHOWCASE                                                */}
        {/* ========================================================================= */}
        {activeTab === 'placements' && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center max-w-xl mx-auto space-y-1">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#70798C]">Native Surfaces</span>
              <h2 className="font-display text-2xl sm:text-3xl text-[#342A21] font-normal">
                Where your campaigns appear on Setlla
              </h2>
              <p className="text-xs sm:text-sm text-[#70798C]">
                Designed to feel like native editorial features, not intrusive ads.
              </p>
            </div>

            {/* Placement Switcher */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPreviewPlacement('stories')}
                className={`py-2 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  previewPlacement === 'stories'
                    ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                    : 'bg-white text-[#70798C] border border-[#E5E7EB] hover:text-[#342A21]'
                }`}
              >
                1. Feed Stories Tray
              </button>
              <button
                onClick={() => setPreviewPlacement('sidebar')}
                className={`py-2 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  previewPlacement === 'sidebar'
                    ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                    : 'bg-white text-[#70798C] border border-[#E5E7EB] hover:text-[#342A21]'
                }`}
              >
                2. Desktop Pinned Sidebar
              </button>
              <button
                onClick={() => setPreviewPlacement('feed')}
                className={`py-2 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  previewPlacement === 'feed'
                    ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                    : 'bg-white text-[#70798C] border border-[#E5E7EB] hover:text-[#342A21]'
                }`}
              >
                3. In-Feed Verified Card
              </button>
            </div>

            {/* Visual Placement Render */}
            <div className="bg-white rounded-3xl border border-[#342A21]/15 p-6 sm:p-10 shadow-card">
              {previewPlacement === 'stories' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                    <div>
                      <h3 className="font-display text-lg text-[#342A21]">Stories Tray Placement</h3>
                      <p className="text-xs text-[#70798C] mt-0.5">
                        High-engagement circular squircle reel directly above the property listings filter bar.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                      92% View Rate
                    </span>
                  </div>

                  {/* Stories Mockup */}
                  <div className="p-6 bg-[#FCF9F5] rounded-2xl border border-[#E5E7EB] flex items-center justify-center gap-6 overflow-x-auto">
                    {/* Story Circle 1 (Advertiser) */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className="w-18 h-18 rounded-2xl p-0.5 bg-gradient-to-tr from-amber-500 via-[#342A21] to-emerald-500 shadow-sm cursor-pointer">
                        <img
                          src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80"
                          alt="Story preview"
                          className="w-full h-full object-cover rounded-[14px]"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-[#342A21] max-w-[70px] truncate text-center">
                        Asaba Suites
                      </span>
                    </div>

                    {/* Story Circle 2 */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0 opacity-75">
                      <div className="w-18 h-18 rounded-2xl p-0.5 bg-slate-300">
                        <img
                          src="https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80"
                          alt="Story preview"
                          className="w-full h-full object-cover rounded-[14px]"
                        />
                      </div>
                      <span className="text-[11px] font-medium text-[#70798C] max-w-[70px] truncate text-center">
                        Solar Power
                      </span>
                    </div>

                    {/* Story Circle 3 */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0 opacity-50">
                      <div className="w-18 h-18 rounded-2xl p-0.5 bg-slate-200">
                        <img
                          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80"
                          alt="Story preview"
                          className="w-full h-full object-cover rounded-[14px]"
                        />
                      </div>
                      <span className="text-[11px] font-medium text-[#70798C] max-w-[70px] truncate text-center">
                        Prime Plots
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {previewPlacement === 'sidebar' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                    <div>
                      <h3 className="font-display text-lg text-[#342A21]">Desktop Featured Sidebar</h3>
                      <p className="text-xs text-[#70798C] mt-0.5">
                        Prominently pinned on the left side of desktop browser screens next to the continuous feed.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                      Exclusive to Desktop
                    </span>
                  </div>

                  {/* Sidebar Mockup */}
                  <div className="max-w-xs mx-auto p-4 bg-[#FCF9F5] rounded-2xl border border-[#E5E7EB]">
                    <div className="bg-white rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-xs">
                      <div className="relative h-36">
                        <img
                          src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80"
                          alt="Sidebar banner"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/95 text-[10px] font-bold text-[#342A21]">
                          SPONSORED
                        </span>
                      </div>
                      <div className="p-3 space-y-1">
                        <h4 className="font-display text-xs font-semibold text-[#342A21] line-clamp-1">
                          20% Off Fully Furnished Shortlet
                        </h4>
                        <p className="text-[11px] text-[#70798C] line-clamp-2">
                          Asaba Royal Suites & Residences · GRA Phase 1
                        </p>
                        <div className="pt-2">
                          <button className="w-full py-1.5 rounded-lg bg-[#342A21] text-white text-[10px] font-semibold">
                            Visit Website
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {previewPlacement === 'feed' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                    <div>
                      <h3 className="font-display text-lg text-[#342A21]">In-Feed Verified Native Card</h3>
                      <p className="text-xs text-[#70798C] mt-0.5">
                        Integrated smoothly into the mobile and web rental stream as seekers swipe through properties.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                      Native Context
                    </span>
                  </div>

                  {/* Feed Mockup */}
                  <div className="max-w-md mx-auto bg-[#FCF9F5] p-4 rounded-2xl border border-[#E5E7EB]">
                    <div className="bg-white rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-xs">
                      <div className="p-3 flex items-center justify-between border-b border-[#E5E7EB]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#342A21] text-white flex items-center justify-center text-xs font-bold">
                            A
                          </div>
                          <div>
                            <span className="font-semibold text-xs text-[#342A21] block">Asaba Solar Solutions</span>
                            <span className="text-[10px] text-[#70798C]">Sponsored Partner</span>
                          </div>
                        </div>
                      </div>
                      <img
                        src="https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80"
                        alt="Feed ad"
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-3 space-y-2">
                        <h4 className="font-display text-sm font-semibold text-[#342A21]">
                          Zero-Down Payment Solar Installation for Modern Homes
                        </h4>
                        <p className="text-xs text-[#70798C]">
                          Keep your inverter and fans running 24/7. Flexible monthly lease-to-own plans.
                        </p>
                        <button className="w-full py-2 rounded-xl bg-[#25D366] text-white text-xs font-semibold flex items-center justify-center gap-1.5">
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                          <span>Chat on WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: ADS SETUP & MANAGEMENT EDITORIAL GUIDE                               */}
        {/* ========================================================================= */}
        {activeTab === 'guide' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white rounded-3xl border border-[#342A21]/15 p-6 sm:p-8 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#70798C] block">
                  Official Editorial Handbook
                </span>
                <h2 className="font-display text-2xl sm:text-3xl text-[#342A21] font-normal mt-1">
                  Ads Setup, Verification & Lead Guide
                </h2>
                <p className="text-xs sm:text-sm text-[#70798C] mt-1 max-w-xl">
                  A complete playbook for advertisers: creative specs, rapid review SLAs, WhatsApp conversion tactics, and programmatic API documentation.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeAdvertiser ? (
                  <button
                    onClick={() => setViewMode('advertiser-dashboard')}
                    className="py-2.5 px-4 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>Open My Ads Dashboard</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setAuthModalInitialMode('login');
                        setIsAuthModalOpen(true);
                      }}
                      className="py-2.5 px-4 rounded-xl bg-white hover:bg-[#F6F3EF] text-[#342A21] border border-[#342A21]/20 text-xs font-semibold cursor-pointer"
                    >
                      Advertiser Login
                    </button>
                    <button
                      onClick={() => {
                        setAuthModalInitialMode('signup');
                        setIsAuthModalOpen(true);
                      }}
                      className="py-2.5 px-4 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Create Account
                    </button>
                  </>
                )}
              </div>
            </div>

            <AdsSetupGuide mode="customer" isModal={false} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ENTERPRISE PROGRAMMATIC REST API & DEVELOPER GATEWAY               */}
        {/* ========================================================================= */}
        {activeTab === 'api' && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center max-w-xl mx-auto space-y-1">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#70798C]">Method 3: Automation</span>
              <h2 className="font-display text-2xl sm:text-3xl text-[#342A21] font-normal">
                Enterprise REST API & Ingestion Gateway
              </h2>
              <p className="text-xs sm:text-sm text-[#70798C]">
                Allow corporate marketing servers, real estate CMS platforms, or digital agencies to push campaigns automatically.
              </p>
            </div>

            {/* Ingestion Endpoint Card */}
            <div className="bg-white rounded-3xl border border-[#342A21]/15 p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#70798C] block">
                  Public REST Ingestion Endpoint
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-md bg-[#342A21] text-white font-mono text-[11px] font-bold">
                    POST
                  </span>
                  <code className="text-xs sm:text-sm font-mono font-semibold text-[#342A21]">
                    https://iadzihievmbhssqycpol.supabase.co/rest/v1/adverts
                  </code>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyEndpoint}
                  className="py-2 px-3.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] hover:bg-[#F6F3EF] text-xs font-semibold text-[#342A21] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedEndpoint ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#70798C]" />}
                  <span>{copiedEndpoint ? 'Copied!' : 'Copy URL'}</span>
                </button>

                <button
                  onClick={handleCopyCurl}
                  className="py-2 px-4 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCurl ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Code2 className="w-3.5 h-3.5 text-amber-300" />}
                  <span>{copiedCurl ? 'Copied cURL!' : 'Copy cURL Command'}</span>
                </button>
              </div>
            </div>

            {/* cURL Snippet Card (Styled cleanly with warm light stone background, NOT cyberpunk) */}
            <div className="bg-white rounded-3xl border border-[#342A21]/15 p-6 shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#342A21]">
                  Sample HTTP Request & Headers
                </label>
                <span className="text-[11px] text-[#70798C]">Content-Type: application/json</span>
              </div>

              <pre className="p-5 rounded-2xl bg-[#FCF9F5] text-[#342A21] text-xs font-mono overflow-x-auto leading-relaxed border border-[#E5E7EB]">
{`curl -X POST "https://iadzihievmbhssqycpol.supabase.co/rest/v1/adverts" \\
  -H "Content-Type: application/json" \\
  -H "X-Setlla-Partner-Key: stla_live_8f39a01b92c44de88a912bf7" \\
  -d '{
    "companyName": "Apex Solar & Power Solutions Ltd",
    "headline": "24/7 Solar Backup Power for Modern Homes",
    "description": "Zero down payment solar installations for apartments and commercial spaces.",
    "category": "Service",
    "mediaUrl": "https://images.unsplash.com/photo-1509391365360-2e959784a276",
    "ctaText": "Get Free Quote",
    "actionType": "contact",
    "whatsappNumber": "08031122334",
    "location": "Nationwide",
    "durationDays": 30
  }'`}
              </pre>
            </div>

            {/* Corporate Partner Keys Management */}
            <div className="bg-white rounded-3xl border border-[#342A21]/15 p-6 sm:p-8 shadow-card space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg text-[#342A21]">Corporate Partner API Keys</h3>
                  <p className="text-xs text-[#70798C] mt-0.5">
                    Generate and manage private API keys for external automated push integrations.
                  </p>
                </div>

                <button
                  onClick={() => setShowNewKeyModal(true)}
                  className="py-2.5 px-4 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-300" />
                  <span>Generate New Partner Key</span>
                </button>
              </div>

              {/* Keys List */}
              <div className="space-y-3">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="p-4 rounded-2xl bg-[#FCF9F5] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#342A21]/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-[#342A21]">{k.companyName}</span>
                        {k.isActive ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            Suspended
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#70798C]">
                        <span>{k.contactEmail}</span>
                        <span>·</span>
                        <span>{k.requestsToday} requests today</span>
                        <span>·</span>
                        <code className="font-mono bg-white px-2 py-0.5 rounded border border-[#E5E7EB] text-[11px] text-[#342A21]">
                          {k.apiKey.slice(0, 14)}••••••••••••••••
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleCopy(k.apiKey, k.id)}
                        className="py-1.5 px-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F6F3EF] text-xs text-[#342A21] font-medium flex items-center gap-1 cursor-pointer"
                        title="Copy Key"
                      >
                        {copiedKey === k.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#70798C]" />}
                        <span>{copiedKey === k.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => handleToggleKey(k.id)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                          k.isActive
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {k.isActive ? 'Suspend' : 'Activate'}
                      </button>

                      <button
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inline Create Key Form */}
              {showNewKeyModal && (
                <div className="p-5 rounded-2xl bg-white border border-[#342A21]/20 space-y-4 shadow-sm animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-sm text-[#342A21]">Issue New Corporate Partner API Key</h4>
                    <button
                      onClick={() => setShowNewKeyModal(false)}
                      className="text-xs text-[#70798C] hover:text-[#342A21]"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleCreateKey} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Company Name *"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      className="px-3.5 py-2 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Official Contact Email *"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="px-3.5 py-2 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Phone (Optional)"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#342A21] text-white text-xs font-semibold cursor-pointer shrink-0"
                      >
                        Generate
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Live Push Simulator Sandbox */}
            <div className="bg-white rounded-3xl border border-[#342A21]/15 p-6 sm:p-8 shadow-card space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-[#B45309]" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-[#342A21]">Live Push Sandbox & Validation</h3>
                  <p className="text-xs text-[#70798C] mt-0.5">
                    Test an incoming automated push payload against your API key to verify database ingestion and feed broadcast.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1.5">
                    Select Test API Key
                  </label>
                  <AdminCustomSelect
                    value={simSelectedKey}
                    onChange={(val) => setSimSelectedKey(val)}
                    options={keys.map((k) => ({
                      value: k.apiKey,
                      label: `${k.companyName} (${k.apiKey.slice(0, 16)}...)`,
                    }))}
                    placeholder="Select API Key..."
                    variant="form"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1.5">Brand / Company Name</label>
                  <input
                    type="text"
                    value={simCompanyName}
                    onChange={(e) => setSimCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1.5">Campaign Headline</label>
                  <input
                    type="text"
                    value={simHeadline}
                    onChange={(e) => setSimHeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1.5">Category</label>
                  <AdminCustomSelect
                    value={simCategory}
                    onChange={(val) => setSimCategory(val as any)}
                    options={[
                      { value: 'Service', label: 'Service' },
                      { value: 'Property', label: 'Property' },
                      { value: 'Estate', label: 'Estate' },
                      { value: 'Promo', label: 'Promo' },
                    ]}
                    variant="form"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-[#342A21] block mb-1.5">Media Creative URL</label>
                  <input
                    type="url"
                    value={simMediaUrl}
                    onChange={(e) => setSimMediaUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-mono text-[#000004]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#70798C]">
                  Duration: <strong className="text-[#342A21]">{simDuration} Days</strong>
                </span>

                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="py-2.5 px-5 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>{isSimulating ? 'Executing POST...' : 'Execute Test Push Request'}</span>
                </button>
              </div>

              {simResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-1.5 animate-fade-in ${
                    simResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      HTTP {simResult.status} {simResult.success ? 'Campaign Ingested' : 'Error'}
                    </span>
                    <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-emerald-200">
                      ID: {simResult.advert?.id || 'N/A'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {simResult.success
                      ? `Campaign "${simResult.advert?.headline}" received and broadcasted live across Setlla's Stories Tray and Desktop Banners!`
                      : simResult.error}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 4. Footer & Partnerships Support */}
      <footer className="mt-20 border-t border-[#342A21]/10 bg-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <img src="/images/setlla-logo.png" alt="Setlla" className="h-4.5 w-auto object-contain" />
              <span className="text-xs font-semibold text-[#342A21]">Partnerships & Media Desk</span>
            </div>
            <p className="text-xs text-[#70798C]">
              High-traffic direct rental and property inspection marketplace.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[#70798C]">
            <a
              href="mailto:partners@setlla.com"
              className="hover:text-[#342A21] flex items-center gap-1 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>partners@setlla.com</span>
            </a>
            <span>·</span>
            <a
              href="https://wa.me/2348000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#342A21] flex items-center gap-1 transition-colors"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Support</span>
            </a>
            <span>·</span>
            <button
              onClick={handleReturn}
              className="text-[#342A21] hover:underline cursor-pointer"
            >
              Back to Property Feed
            </button>
          </div>
        </div>
      </footer>

      {/* Advertiser Authentication Modal (Sign In / Register) */}
      <AdvertiserAuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalInitialMode}
        initialEmail={currentUser?.email || ''}
        initialName={currentUser?.fullName || ''}
        initialPhone={currentUser?.phone || ''}
        initialCompanyName={currentUser?.agencyName || currentUser?.fullName || ''}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user: AdvertiserUser) => {
          setActiveAdvertiser(user);
          setIsAuthModalOpen(false);
          setViewMode('advertiser-dashboard');
        }}
      />

      {/* Custom Confirmation Modal */}
      {confirmModal && (
        <CustomConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          itemTitle={confirmModal.itemTitle}
          badge={confirmModal.badge}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          variant={confirmModal.variant}
          isAlertOnly={confirmModal.isAlertOnly}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
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
