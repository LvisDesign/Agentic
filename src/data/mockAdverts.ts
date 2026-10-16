export interface AdvertStory {
  id: string;
  title: string;
  advertiserName: string;
  category: 'Property' | 'Estate' | 'Promo' | 'Service';
  badgeText: string;
  thumbnailUrl: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  headline: string;
  description: string;
  location: string;
  price?: string;
  ctaText: string;
  whatsappNumber?: string;
  phone?: string;
  isVerified: boolean;
  propertyId?: string;
}

export const MOCK_ADVERT_STORIES: AdvertStory[] = [
  {
    id: 'ad-asaba-emerald',
    title: 'Emerald GRA',
    advertiserName: 'Delta Heritage Realty',
    category: 'Property',
    badgeText: 'HOT DEAL',
    thumbnailUrl: '/images/properties/asaba_gra_exterior.jpg',
    mediaUrl: '/images/properties/asaba_gra_exterior.jpg',
    mediaType: 'image',
    headline: 'Emerald Haven Phase 2 — 2 Units Remaining in Prime GRA Asaba',
    description: 'Executive 2-Bedroom Serviced Flat with 24/7 Band A Electricity, dedicated transformer & treated borehole. 100% verified move-in package with transparent regional lease guarantee.',
    location: 'GRA Phase 2 (Behind Govt House), Asaba',
    price: '₦1,800,000 /yr',
    ctaText: 'Inspect Property',
    whatsappNumber: '2348034928172',
    phone: '0803 492 8172',
    isVerified: true,
    propertyId: 'prop-asaba-01',
  },
  {
    id: 'ad-warri-willows',
    title: 'The Willows',
    advertiserName: 'Warri Prime Properties',
    category: 'Estate',
    badgeText: 'FEATURED',
    thumbnailUrl: '/images/properties/warri_estate_exterior.jpg',
    mediaUrl: '/images/properties/warri_estate_exterior.jpg',
    mediaType: 'image',
    headline: 'The Willows Apartments — Corporate 3-Bed Flats near Delta Mall',
    description: 'Located in private Palm Grove corridor 3 minutes from Shoprite. Tight security, flood-free paved compound, prepaid meter & water heater in all rooms.',
    location: 'Airport Road / Effurun, Warri',
    price: '₦2,200,000 /yr',
    ctaText: 'View Listing',
    whatsappNumber: '2348129841029',
    phone: '0812 984 1029',
    isVerified: true,
    propertyId: 'prop-warri-02',
  },
  {
    id: 'ad-abraka-delsu',
    title: 'DELSU Lodge',
    advertiserName: 'Abraka Campus Shelter Link',
    category: 'Promo',
    badgeText: 'CAMPUS',
    thumbnailUrl: '/images/properties/abraka_delsu_lodge.jpg',
    mediaUrl: '/images/properties/abraka_delsu_lodge.jpg',
    mediaType: 'image',
    headline: 'DELSU Royal Lodge — Self-Contain Studio near Gate 3',
    description: 'Top-choice executive student self-contain lodge with 24/7 solar study lighting, private balcony, treated borehole & 24hr security personnel.',
    location: 'DELSU Campus 3 Gate / Ekrejeta, Abraka',
    price: '₦450,000 /yr',
    ctaText: 'Reserve Room',
    whatsappNumber: '2349071239845',
    phone: '0907 123 9845',
    isVerified: true,
    propertyId: 'prop-abraka-03',
  },
  {
    id: 'ad-sapele-palms',
    title: 'Amukpe Palms',
    advertiserName: 'Delta Heritage Realty',
    category: 'Estate',
    badgeText: 'LUXURY',
    thumbnailUrl: '/images/properties/sapele_duplex_exterior.jpg',
    mediaUrl: '/images/properties/sapele_duplex_exterior.jpg',
    mediaType: 'image',
    headline: 'Amukpe Palms Residence — 4-Bedroom Semi-Detached Duplex',
    description: 'High-end furnished duplex in prestigious Amukpe residential layout. Automated gate, standby 30kVA generator, smart lock & private rooftop lounge.',
    location: 'Amukpe GRA, Sapele',
    price: '₦3,500,000 /yr',
    ctaText: 'Chat on WhatsApp',
    whatsappNumber: '2348034928172',
    phone: '0803 492 8172',
    isVerified: true,
    propertyId: 'prop-sapele-05',
  },
  {
    id: 'ad-ughelli-otovwodo',
    title: 'Otovwodo Court',
    advertiserName: 'Ughelli Central Real Estate',
    category: 'Property',
    badgeText: 'NEW',
    thumbnailUrl: '/images/properties/ughelli_bungalow_exterior.jpg',
    mediaUrl: '/images/properties/ughelli_bungalow_exterior.jpg',
    mediaType: 'image',
    headline: 'Apartment 4B Otovwodo — Stone-Clad 2-Bedroom Bungalow',
    description: 'Freshly painted 2-bedroom flat with Gerard stone-coated roof, personal prepaid meter, solid security doors & dedicated water storage tower.',
    location: 'Otovwodo / Afiesere Road, Ughelli',
    price: '₦850,000 /yr',
    ctaText: 'Book Inspection',
    whatsappNumber: '2348056712390',
    phone: '0805 671 2390',
    isVerified: true,
    propertyId: 'prop-ughelli-04',
  },
  {
    id: 'ad-delta-solar',
    title: 'Solar Backup',
    advertiserName: 'Delta Green Energy Ltd',
    category: 'Service',
    badgeText: 'SPONSORED',
    thumbnailUrl: '/images/properties/asaba_vacant_living.jpg',
    mediaUrl: '/images/properties/asaba_vacant_living.jpg',
    mediaType: 'image',
    headline: 'Zero Power Cuts: Rental Solar & Inverter Backup in Delta',
    description: 'Special 3.5kVA & 5kVA solar backup systems tailored for tenant apartments in Asaba, Warri, and Sapele. Seamless installation with monthly financing option.',
    location: 'Asaba & Warri Service Hubs',
    price: 'From ₦25,000 /mo',
    ctaText: 'Get Free Quote',
    whatsappNumber: '2348034928172',
    phone: '0803 492 8172',
    isVerified: true,
  },
];
