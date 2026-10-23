export interface AdvertStory {
  id: string;
  title: string;
  advertiserName: string;
  advertiserHandle?: string;
  avatarUrl?: string;
  timeAgo?: string;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  category: 'Property' | 'Estate' | 'Promo' | 'Service';
  badgeText: string;
  thumbnailUrl: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  headline: string;
  description: string;
  location: string;
  price?: string;
  ctaText?: string;
  websiteUrl?: string;
  actionType?: 'website' | 'contact' | 'property';
  whatsappNumber?: string;
  phone?: string;
  isVerified: boolean;
  propertyId?: string;

  // Ingestion & Campaign Flight Metadata
  status?: 'pending_review' | 'active' | 'paused' | 'expired' | 'rejected' | 'deleted';
  submissionSource?: 'admin' | 'partner_portal' | 'api_webhook';
  partnerEmail?: string;
  packageTier?: 'starter' | 'growth' | 'corporate' | string;
  budgetAmount?: number;
  startDate?: string;
  endDate?: string;
  impressionsCount?: number;
  clicksCount?: number;
  apiKeyRef?: string;
  createdAt?: string;
}

export interface AdvertCtaConfig {
  label: string;
  type: 'website' | 'contact' | 'property';
  destinationHint: string;
}

export const getAdvertCtaConfig = (ad: AdvertStory): AdvertCtaConfig => {
  // 1. Organization or influencer website link
  if (ad.actionType === 'website' || (ad.websiteUrl && !ad.propertyId)) {
    let domain = '';
    if (ad.websiteUrl) {
      try {
        domain = new URL(ad.websiteUrl).hostname.replace(/^www\./, '');
      } catch {
        domain = ad.websiteUrl.replace(/^https?:\/\//, '').split('/')[0];
      }
    }
    return {
      label: ad.ctaText && ad.ctaText !== 'Learn More' ? ad.ctaText : 'Visit Website',
      type: 'website',
      destinationHint: domain || 'Organization Link',
    };
  }

  // 2. Direct rental listing on platform
  if (ad.actionType === 'property' || ad.propertyId) {
    return {
      label: ad.ctaText && ad.ctaText !== 'Learn More' ? ad.ctaText : 'View Property',
      type: 'property',
      destinationHint: 'Verified Listing',
    };
  }

  // 3. Direct Contact / Inquiries
  return {
    label: ad.ctaText && ad.ctaText !== 'Learn More' ? ad.ctaText : 'Contact Us',
    type: 'contact',
    destinationHint: ad.whatsappNumber ? 'WhatsApp & Calls' : 'Direct Inquiry',
  };
};

export const MOCK_ADVERT_STORIES: AdvertStory[] = [];
