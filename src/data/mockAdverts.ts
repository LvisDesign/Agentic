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
  status?: 'pending_review' | 'active' | 'paused' | 'expired' | 'rejected';
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

export const MOCK_ADVERT_STORIES: AdvertStory[] = [
  {
    id: 'ad-asaba-emerald',
    title: 'Emerald GRA',
    advertiserName: 'Delta Heritage Realty',
    advertiserHandle: 'delta_heritage',
    avatarUrl: '/images/properties/asaba_gra_exterior.jpg',
    timeAgo: '2d',
    likesCount: 171,
    commentsCount: 92,
    sharesCount: 67,
    category: 'Property',
    badgeText: 'HOT DEAL',
    thumbnailUrl: '/images/properties/asaba_gra_exterior.jpg',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-living-room-interior-39744-large.mp4',
    mediaType: 'video',
    headline: 'Emerald Haven Phase 2 — 2 Units Remaining in Prime GRA Asaba 🏡',
    description: 'Executive 2-Bedroom Serviced Flat with 24/7 Band A Electricity, dedicated transformer & treated borehole. 100% verified move-in package with transparent regional lease guarantee.\n\nWater heater in all rooms, private balcony with serene view of government reserve.',
    location: 'GRA Phase 2 (Behind Govt House), Asaba',
    price: '₦1,800,000 /yr',
    ctaText: 'View Property',
    actionType: 'property',
    whatsappNumber: '2348034928172',
    phone: '0803 492 8172',
    isVerified: true,
    propertyId: 'prop-asaba-01',
  },
  {
    id: 'ad-warri-movers',
    title: 'Warri Fast Movers',
    advertiserName: 'Warri Express Movers & Haulage',
    advertiserHandle: 'warri_movers',
    avatarUrl: '/images/properties/warri_estate_exterior.jpg',
    timeAgo: '1d',
    likesCount: 238,
    commentsCount: 114,
    sharesCount: 89,
    category: 'Service',
    badgeText: 'POPULAR',
    thumbnailUrl: '/images/properties/warri_estate_exterior.jpg',
    mediaUrl: '/images/properties/warri_estate_exterior.jpg',
    mediaType: 'image',
    headline: 'Apartment Relocation & Furniture Packers in Warri & Asaba 🚚📦',
    description: 'Moving into a new flat? We handle delicate furniture dismantling, bubble wrapping, truck transit & reassembly.\n\nZero breakage guarantee with uniformed trusted crew. Available 7 days a week across Delta State.',
    location: 'Warri, Effurun, Asaba & Sapele',
    price: 'From ₦35,000 /trip',
    ctaText: 'Contact Us',
    actionType: 'contact',
    whatsappNumber: '2348129841029',
    phone: '0812 984 1029',
    isVerified: true,
  },
  {
    id: 'ad-delta-solar',
    title: 'Solar Backup',
    advertiserName: 'Delta Green Energy Ltd',
    advertiserHandle: 'solar_delta',
    avatarUrl: '/images/properties/asaba_vacant_living.jpg',
    timeAgo: '3d',
    likesCount: 312,
    commentsCount: 145,
    sharesCount: 104,
    category: 'Service',
    badgeText: 'SPONSORED',
    thumbnailUrl: '/images/properties/asaba_vacant_living.jpg',
    mediaUrl: '/images/properties/asaba_vacant_living.jpg',
    mediaType: 'image',
    headline: 'Zero Power Cuts: Tenant Solar & Inverter Setup in Delta ⚡',
    description: 'Special 3.5kVA & 5kVA solar backup systems tailored for tenant apartments in Asaba, Warri, and Sapele.\n\nPowers your fridge, fans, TV, and work laptops. Seamless installation with flexible monthly financing options.',
    location: 'Asaba, Warri & Sapele Hubs',
    price: 'From ₦25,000 /mo',
    ctaText: 'Visit Website',
    actionType: 'website',
    websiteUrl: 'https://deltagreenenergy.ng',
    whatsappNumber: '2348034928172',
    phone: '0803 492 8172',
    isVerified: true,
  },
  {
    id: 'ad-warri-willows',
    title: 'The Willows',
    advertiserName: 'Warri Prime Properties',
    advertiserHandle: 'warri_prime',
    avatarUrl: '/images/properties/warri_estate_exterior.jpg',
    timeAgo: '2d',
    likesCount: 189,
    commentsCount: 76,
    sharesCount: 42,
    category: 'Estate',
    badgeText: 'FEATURED',
    thumbnailUrl: '/images/properties/warri_estate_exterior.jpg',
    mediaUrl: '/images/properties/warri_estate_exterior.jpg',
    mediaType: 'image',
    headline: 'The Willows Apartments — Corporate 3-Bed Flats near Delta Mall ✨',
    description: 'Located in private Palm Grove corridor 3 minutes from Shoprite. Tight security, flood-free paved compound, prepaid meter & water heater in all rooms.\n\nDirect key handoff with zero middleman fee.',
    location: 'Airport Road / Effurun, Warri',
    price: '₦2,200,000 /yr',
    ctaText: 'View Property',
    actionType: 'property',
    whatsappNumber: '2348129841029',
    phone: '0812 984 1029',
    isVerified: true,
    propertyId: 'prop-warri-02',
  },
  {
    id: 'ad-delta-paints',
    title: 'Delta POP & Paint',
    advertiserName: 'Delta Interior & POP Masters',
    advertiserHandle: 'deltapaints',
    avatarUrl: '/images/properties/vacant_luxury_bedroom.jpg',
    timeAgo: '4d',
    likesCount: 142,
    commentsCount: 53,
    sharesCount: 31,
    category: 'Service',
    badgeText: 'ARTISAN',
    thumbnailUrl: '/images/properties/vacant_luxury_bedroom.jpg',
    mediaUrl: '/images/properties/vacant_luxury_bedroom.jpg',
    mediaType: 'image',
    headline: 'Modern POP Ceiling Design & Washable Wall Painting 🎨',
    description: 'Moving into an apartment that needs a fresh look? We offer premium Italian wash coat paints, 3D wall panels, and sleek gypsum POP.\n\nFast 48-hour room turnarounds with clean finish guarantee.',
    location: 'Delta Wide Coverage',
    price: 'Free Consultation',
    ctaText: 'Contact Us',
    actionType: 'contact',
    whatsappNumber: '2348056712390',
    phone: '0805 671 2390',
    isVerified: true,
  },
  {
    id: 'ad-abraka-delsu',
    title: 'DELSU Lodge',
    advertiserName: 'Abraka Campus Shelter Link',
    advertiserHandle: 'delsu_lodges',
    avatarUrl: '/images/properties/abraka_delsu_lodge.jpg',
    timeAgo: '5d',
    likesCount: 420,
    commentsCount: 204,
    sharesCount: 165,
    category: 'Promo',
    badgeText: 'CAMPUS',
    thumbnailUrl: '/images/properties/abraka_delsu_lodge.jpg',
    mediaUrl: '/images/properties/abraka_delsu_lodge.jpg',
    mediaType: 'image',
    headline: 'DELSU Royal Lodge — Self-Contain Studio near Gate 3 🎓',
    description: 'Top-choice executive student self-contain lodge with 24/7 solar study lighting, private balcony, treated borehole & 24hr security personnel.',
    location: 'DELSU Campus 3 Gate / Ekrejeta, Abraka',
    price: '₦450,000 /yr',
    ctaText: 'Visit Website',
    actionType: 'website',
    websiteUrl: 'https://delsulodges.com',
    whatsappNumber: '2349071239845',
    phone: '0907 123 9845',
    isVerified: true,
    propertyId: 'prop-abraka-03',
  },
  {
    id: 'ad-sapele-palms',
    title: 'Amukpe Palms',
    advertiserName: 'Delta Heritage Realty',
    advertiserHandle: 'amukpe_palms',
    avatarUrl: '/images/properties/sapele_duplex_exterior.jpg',
    timeAgo: '6d',
    likesCount: 98,
    commentsCount: 41,
    sharesCount: 19,
    category: 'Estate',
    badgeText: 'LUXURY',
    thumbnailUrl: '/images/properties/sapele_duplex_exterior.jpg',
    mediaUrl: '/images/properties/sapele_duplex_exterior.jpg',
    mediaType: 'image',
    headline: 'Amukpe Palms Residence — 4-Bedroom Semi-Detached Duplex 💎',
    description: 'High-end furnished duplex in prestigious Amukpe residential layout. Automated gate, standby 30kVA generator, smart lock & private rooftop lounge.',
    location: 'Amukpe GRA, Sapele',
    price: '₦3,500,000 /yr',
    ctaText: 'View Property',
    actionType: 'property',
    whatsappNumber: '2348034928172',
    phone: '0803 492 8172',
    isVerified: true,
    propertyId: 'prop-sapele-05',
  },
  {
    id: 'ad-ughelli-otovwodo',
    title: 'Otovwodo Court',
    advertiserName: 'Ughelli Central Real Estate',
    advertiserHandle: 'ughelli_central',
    avatarUrl: '/images/properties/ughelli_bungalow_exterior.jpg',
    timeAgo: '1w',
    likesCount: 165,
    commentsCount: 62,
    sharesCount: 38,
    category: 'Property',
    badgeText: 'NEW',
    thumbnailUrl: '/images/properties/ughelli_bungalow_exterior.jpg',
    mediaUrl: '/images/properties/ughelli_bungalow_exterior.jpg',
    mediaType: 'image',
    headline: 'Apartment 4B Otovwodo — Stone-Clad 2-Bedroom Bungalow 🔑',
    description: 'Freshly painted 2-bedroom flat with Gerard stone-coated roof, personal prepaid meter, solid security doors & dedicated water storage tower.',
    location: 'Otovwodo / Afiesere Road, Ughelli',
    price: '₦850,000 /yr',
    ctaText: 'View Property',
    actionType: 'property',
    whatsappNumber: '2348056712390',
    phone: '0805 671 2390',
    isVerified: true,
    propertyId: 'prop-ughelli-04',
  },
];
