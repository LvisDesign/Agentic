import { PropertyListing } from '../types/marketplace';

export const INITIAL_LISTINGS: PropertyListing[] = [
  {
    id: 'prop-asaba-01',
    title: 'Luxury 2-Bedroom Serviced Flat (Emerald Haven, GRA Phase 2)',
    state: 'Delta State',
    city: 'Asaba',
    neighborhood: 'GRA Phase 2 (Behind Govt House)',
    fullAddress: 'Plot 18, Commissioners Quarters Drive, Off Okpanam Rd, GRA Phase 2, Asaba, Delta State',
    propertyType: '2-Bedroom Flat',
    bedrooms: 2,
    bathrooms: 2,
    toilets: 3,
    isServiced: true,
    isFurnished: false,
    electricityStatus: 'Band A (20+ hrs)',
    waterSupply: 'Borehole with Treatment',
    description: 'Immaculately finished 2-bedroom executive apartment in prime GRA Asaba. Features POP ceilings, fully fitted kitchen with granite tops, heat extractor, prepaid meter, security gatehouse, and 24-hour estate patrol. Interlocked compound with dedicated overhead water tank tower.',
    media: [
      {
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-living-room-interior-39744-large.mp4',
        caption: 'Live house walkthrough: Open-plan living room & private terrace'
      },
      {
        type: 'image',
        url: '/images/properties/asaba_gra_exterior.jpg',
        caption: 'Emerald Haven Apartments, GRA Asaba: Interlocked compound & water tower'
      },
      {
        type: 'image',
        url: '/images/properties/asaba_vacant_living.jpg',
        caption: 'Vacant living room with designer POP ceiling, polished floor tiles & balcony'
      },
      {
        type: 'image',
        url: '/images/properties/vacant_luxury_kitchen.jpg',
        caption: 'Fitted kitchen with mahogany cabinets, granite countertops & extractor'
      },
      {
        type: 'image',
        url: '/images/properties/vacant_luxury_bedroom.jpg',
        caption: 'Master bedroom with built-in wooden wardrobes & ensuite bathroom'
      }
    ],
    fees: {
      baseRent: 1800000,
      rentPeriod: 'per annum',
      cautionFee: 150000,
      legalAndAgencyFee: 360000, // 10% legal + 10% agency
      serviceCharge: 180000,     // Estate security, waste, borehole power
      totalMoveInPackage: 2490000
    },
    inspectionFee: 2500,
    agent: {
      id: 'agent-oghene-01',
      fullName: 'Chief Oghenetega Macaulay',
      agencyName: 'Delta Heritage Realty Ltd',
      isVerified: true,
      cacNumber: 'RC-1849204',
      rating: 4.9,
      reviewCount: 42,
      completedInspections: 138,
      responseTime: 'Responds within 10 mins',
      phone: '08034928172',
      whatsapp: '2348034928172',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    inspectionSlots: [
      {
        id: 'slot-asb-1',
        timeWindow: '10:00 AM – 11:00 AM',
        date: 'Today',
        capacityLimit: 5,
        bookedCount: 3,
        waitlistCount: 0
      },
      {
        id: 'slot-asb-2',
        timeWindow: '12:00 PM – 1:00 PM',
        date: 'Today',
        capacityLimit: 5,
        bookedCount: 5, // At max limit! Waitlist test
        waitlistCount: 2
      },
      {
        id: 'slot-asb-3',
        timeWindow: '2:00 PM – 3:00 PM',
        date: 'Today',
        capacityLimit: 5,
        bookedCount: 4,
        waitlistCount: 0
      },
      {
        id: 'slot-asb-4',
        timeWindow: '4:00 PM – 5:00 PM',
        date: 'Tomorrow',
        capacityLimit: 5,
        bookedCount: 1,
        waitlistCount: 0
      }
    ],
    inspectionDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
    tags: ['GRA Asaba', 'Band A Light', 'Serviced', 'Borehole', 'POP Ceilings'],
    createdAt: '2026-10-14T08:00:00Z'
  },
  {
    id: 'prop-warri-02',
    title: 'Modern 3-Bedroom Flat in Gated Estate (The Willows, Airport Road)',
    state: 'Delta State',
    city: 'Warri',
    neighborhood: 'Airport Road / Effurun (Near Delta Mall)',
    fullAddress: 'Block 4, The Willows Apartments, Palm Grove Crescent, Off Airport Road, Warri, Delta State',
    propertyType: '3-Bedroom Flat',
    bedrooms: 3,
    bathrooms: 3,
    toilets: 4,
    isServiced: true,
    isFurnished: false,
    electricityStatus: '24/7 Dedicated Line',
    waterSupply: 'Borehole with Treatment',
    description: 'Spacious 3-bedroom apartment designed for corporate and family convenience. Located 3 minutes from Delta Mall/Shoprite. Features dedicated prepaid meter, water heater in all rooms, private balcony, tight security, and flood-free paved compound.',
    media: [
      {
        type: 'image',
        url: '/images/properties/warri_estate_exterior.jpg',
        caption: 'The Willows Apartments, Warri: Gated entrance, 24/7 security & water towers'
      },
      {
        type: 'image',
        url: '/images/properties/asaba_vacant_living.jpg',
        caption: 'Spacious vacant lounge with vitrified cream porcelain tiles'
      },
      {
        type: 'image',
        url: '/images/properties/vacant_luxury_kitchen.jpg',
        caption: 'Chef kitchen with imported mahogany cabinets and gas connection'
      },
      {
        type: 'image',
        url: '/images/properties/vacant_luxury_bedroom.jpg',
        caption: 'Master suite with fitted wardrobes and cross-ventilation'
      }
    ],
    fees: {
      baseRent: 2200000,
      rentPeriod: 'per annum',
      cautionFee: 200000,
      legalAndAgencyFee: 440000,
      serviceCharge: 250000,
      totalMoveInPackage: 3090000
    },
    inspectionFee: 3000,
    agent: {
      id: 'agent-ese-02',
      fullName: 'Eseoghene Okoro (Esq.)',
      agencyName: 'Warri Prime Properties',
      isVerified: true,
      cacNumber: 'RC-2940182',
      rating: 4.8,
      reviewCount: 31,
      completedInspections: 95,
      responseTime: 'Responds within 15 mins',
      phone: '08129841029',
      whatsapp: '2348129841029',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    },
    inspectionSlots: [
      {
        id: 'slot-wri-1',
        timeWindow: '11:00 AM – 12:00 PM',
        date: 'Today',
        capacityLimit: 5,
        bookedCount: 5, // Fully booked!
        waitlistCount: 1
      },
      {
        id: 'slot-wri-2',
        timeWindow: '2:00 PM – 3:00 PM',
        date: 'Today',
        capacityLimit: 5,
        bookedCount: 2,
        waitlistCount: 0
      },
      {
        id: 'slot-wri-3',
        timeWindow: '4:00 PM – 5:00 PM',
        date: 'Tomorrow',
        capacityLimit: 5,
        bookedCount: 0,
        waitlistCount: 0
      }
    ],
    inspectionDays: ['Tuesday', 'Thursday', 'Saturday'],
    tags: ['Airport Rd', 'Shoprite Vicinity', 'Corporate Standard', '24/7 Power'],
    createdAt: '2026-10-13T11:20:00Z'
  },
  {
    id: 'prop-abraka-03',
    title: 'Executive Self-Contain Studio (DELSU Royal Lodge, Campus 3 Gate)',
    state: 'Delta State',
    city: 'Abraka',
    neighborhood: 'Campus 3 Main Gate / Ekrejeta',
    fullAddress: 'DELSU Royal Lodge, Old Abraka Road, DELSU Gate 3, Abraka, Delta State',
    propertyType: 'Self-contain',
    bedrooms: 1,
    bathrooms: 1,
    toilets: 1,
    isServiced: true,
    isFurnished: false,
    electricityStatus: 'Solar Powered',
    waterSupply: 'Borehole with Treatment',
    description: 'High-demand executive self-contain studio for students, lecturers, or young professionals. Features 24/7 solar light, treated borehole water running directly into kitchenette and private bathroom, uniform security guard, and perimeter fence.',
    media: [
      {
        type: 'image',
        url: '/images/properties/abraka_delsu_lodge.jpg',
        caption: 'DELSU Royal Lodge, Abraka: Gated student residence with Geepee water tower'
      },
      {
        type: 'image',
        url: '/images/properties/abraka_vacant_studio.jpg',
        caption: 'Vacant self-contain studio with kitchenette sink, burglar-proof window & ensuite bath'
      }
    ],
    fees: {
      baseRent: 450000,
      rentPeriod: 'per annum',
      cautionFee: 40000,
      legalAndAgencyFee: 90000,
      serviceCharge: 60000, // Solar inverter maintenance & security
      totalMoveInPackage: 640000
    },
    inspectionFee: 2000,
    agent: {
      id: 'agent-chidi-03',
      fullName: 'Blessing Chukwuma',
      agencyName: 'Abraka Campus Shelter Link',
      isVerified: true,
      cacNumber: 'RC-3019485',
      rating: 4.9,
      reviewCount: 64,
      completedInspections: 210,
      responseTime: 'Responds within 5 mins',
      phone: '09071239845',
      whatsapp: '2349071239845',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'
    },
    inspectionSlots: [
      {
        id: 'slot-abk-1',
        timeWindow: '10:00 AM – 11:00 AM',
        date: 'Today',
        capacityLimit: 5,
        bookedCount: 4,
        waitlistCount: 0
      },
      {
        id: 'slot-abk-2',
        timeWindow: '1:00 PM – 2:00 PM',
        date: 'Today',
        capacityLimit: 5,
        bookedCount: 5, // Full
        waitlistCount: 3
      },
      {
        id: 'slot-abk-3',
        timeWindow: '3:30 PM – 4:30 PM',
        date: 'Tomorrow',
        capacityLimit: 5,
        bookedCount: 2,
        waitlistCount: 0
      }
    ],
    inspectionDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    tags: ['DELSU Campus 3', 'Solar Light 24/7', 'Student Friendly', 'High Security'],
    createdAt: '2026-10-15T09:15:00Z'
  },
  {
    id: 'prop-ughelli-04',
    title: 'Newly Built 2-Bedroom Bungalow Flat in Otovwodo Layout',
    state: 'Delta State',
    city: 'Ughelli',
    neighborhood: 'Otovwodo / Afiesere Road',
    fullAddress: 'Apartment 4B, Unity Court, Off Otovwodo Junction, Ughelli, Delta State',
    propertyType: '2-Bedroom Flat',
    bedrooms: 2,
    bathrooms: 2,
    toilets: 2,
    isServiced: false,
    isFurnished: false,
    electricityStatus: 'Regular NEPA + Gen',
    waterSupply: 'Dedicated Tank',
    description: 'Freshly painted 2-bedroom flat with cross ventilation, personal prepaid meter, solid security doors, and spacious compound. Quiet family-friendly environment with quick access to Ughelli market and Warri expressway.',
    media: [
      {
        type: 'image',
        url: '/images/properties/ughelli_bungalow_exterior.jpg',
        caption: 'Apartment 4B Otovwodo, Ughelli: Stone cladding, Gerard roof & dedicated water tower'
      },
      {
        type: 'image',
        url: '/images/properties/asaba_vacant_living.jpg',
        caption: 'Freshly painted vacant living room with private entrance'
      },
      {
        type: 'image',
        url: '/images/properties/vacant_luxury_bedroom.jpg',
        caption: 'Spacious bedroom with security burglar bars and tiled floor'
      }
    ],
    fees: {
      baseRent: 850000,
      rentPeriod: 'per annum',
      cautionFee: 80000,
      legalAndAgencyFee: 170000,
      serviceCharge: 50000,
      totalMoveInPackage: 1150000
    },
    inspectionFee: 2500,
    agent: {
      id: 'agent-oghenevwede-04',
      fullName: 'Pastor Kenneth Edafe',
      agencyName: 'Ughelli Central Real Estate',
      isVerified: true,
      cacNumber: 'RC-1129405',
      rating: 4.7,
      reviewCount: 19,
      completedInspections: 62,
      responseTime: 'Responds within 20 mins',
      phone: '08056712390',
      whatsapp: '2348056712390',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
    },
    inspectionSlots: [
      {
        id: 'slot-ugh-1',
        timeWindow: '10:00 AM – 11:00 AM',
        date: 'Today',
        capacityLimit: 5,
        bookedCount: 1,
        waitlistCount: 0
      },
      {
        id: 'slot-ugh-2',
        timeWindow: '3:00 PM – 4:00 PM',
        date: 'Today',
        capacityLimit: 5,
        bookedCount: 3,
        waitlistCount: 0
      }
    ],
    inspectionDays: ['Wednesday', 'Saturday'],
    tags: ['Otovwodo', 'Individual Prepaid Meter', 'Family Friendly'],
    createdAt: '2026-10-12T14:40:00Z'
  },
  {
    id: 'prop-sapele-05',
    title: 'Executive 4-Bedroom Semi-Detached Duplex with BQ (Amukpe Palms)',
    state: 'Delta State',
    city: 'Sapele',
    neighborhood: 'Boyo Road / Amukpe GRA',
    fullAddress: 'Amukpe Palms Residence 12A & 12B, Off Boyo Road, Amukpe, Sapele, Delta State',
    propertyType: 'Duplex / Semi-Detached',
    bedrooms: 4,
    bathrooms: 4,
    toilets: 5,
    isServiced: true,
    isFurnished: true,
    electricityStatus: 'Band A (20+ hrs)',
    waterSupply: 'Borehole with Treatment',
    description: 'High-end duplex in prestigious Amukpe residential zone. Features automated security gate, standby 30kVA generator, smart lock front door, Italian marble floor, and private rooftop lounge with river breeze.',
    media: [
      {
        type: 'image',
        url: '/images/properties/sapele_duplex_exterior.jpg',
        caption: 'Amukpe Palms Residence, Sapele: Contemporary duplex with electric fence & automated gate'
      },
      {
        type: 'image',
        url: '/images/properties/asaba_vacant_living.jpg',
        caption: 'Double-volume living and dining area with modern POP ceiling'
      },
      {
        type: 'image',
        url: '/images/properties/vacant_luxury_kitchen.jpg',
        caption: 'Fully fitted chef kitchen with granite countertops and heat extractor'
      },
      {
        type: 'image',
        url: '/images/properties/vacant_luxury_bedroom.jpg',
        caption: 'Master bedroom suite with built-in wardrobes & balcony'
      }
    ],
    fees: {
      baseRent: 3500000,
      rentPeriod: 'per annum',
      cautionFee: 350000,
      legalAndAgencyFee: 700000,
      serviceCharge: 400000,
      totalMoveInPackage: 4950000
    },
    inspectionFee: 3500,
    agent: {
      id: 'agent-oghene-01',
      fullName: 'Chief Oghenetega Macaulay',
      agencyName: 'Delta Heritage Realty Ltd',
      isVerified: true,
      cacNumber: 'RC-1849204',
      rating: 4.9,
      reviewCount: 42,
      completedInspections: 138,
      responseTime: 'Responds within 10 mins',
      phone: '08034928172',
      whatsapp: '2348034928172',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    inspectionSlots: [
      {
        id: 'slot-spl-1',
        timeWindow: '11:00 AM – 12:00 PM',
        date: 'Today',
        capacityLimit: 5,
        bookedCount: 2,
        waitlistCount: 0
      },
      {
        id: 'slot-spl-2',
        timeWindow: '2:00 PM – 3:00 PM',
        date: 'Tomorrow',
        capacityLimit: 5,
        bookedCount: 5, // Full!
        waitlistCount: 1
      }
    ],
    inspectionDays: ['Thursday', 'Friday', 'Saturday'],
    tags: ['Amukpe GRA', 'Furnished Duplex', 'Smart Home', 'Standby Gen'],
    createdAt: '2026-10-11T16:00:00Z'
  },
  {
    id: 'prop-asaba-06',
    title: 'Brand New Luxury 2-Bedroom Apartment in Junic Estate',
    state: 'Delta State',
    city: 'Asaba',
    neighborhood: 'Junic Estate / Ibusa Road',
    fullAddress: 'Junic Estate, Off Ibusa Expressway, Asaba, Delta State',
    propertyType: '2-Bedroom Flat',
    bedrooms: 2,
    bathrooms: 2,
    toilets: 3,
    isServiced: true,
    isFurnished: false,
    electricityStatus: 'Band A (20+ hrs)',
    waterSupply: 'Borehole with Treatment',
    description: 'Vacant luxury 2-bedroom brand new apartment with dining space and store room. Located in serene Junic Estate along Ibusa Road. All rooms ensuite with guest toilet, spacious kitchen, and paved compound.',
    media: [
      {
        type: 'image',
        url: 'https://images.nigeriapropertycentre.com/properties/images/thumbs/3647656/06a956476bc7d1-luxury-massive-brand-new-2-bedroom-apartment-for-rent-asaba-delta.webp',
        caption: 'Junic Estate, Asaba: Brand-new contemporary residential block'
      },
      {
        type: 'image',
        url: '/images/properties/asaba_vacant_living.jpg',
        caption: 'Spacious vacant living room with dining area and store room'
      },
      {
        type: 'image',
        url: '/images/properties/vacant_luxury_kitchen.jpg',
        caption: 'Modern fitted kitchen with pantry'
      }
    ],
    fees: {
      baseRent: 2200000,
      rentPeriod: 'per annum',
      cautionFee: 150000,
      legalAndAgencyFee: 440000,
      serviceCharge: 180000,
      totalMoveInPackage: 2970000
    },
    inspectionFee: 2500,
    agent: {
      id: 'agent-oghene-01',
      fullName: 'Chief Oghenetega Macaulay',
      agencyName: 'Delta Heritage Realty Ltd',
      isVerified: true,
      cacNumber: 'RC-1849204',
      rating: 4.9,
      reviewCount: 42,
      completedInspections: 138,
      responseTime: 'Responds within 10 mins',
      phone: '08034928172',
      whatsapp: '2348034928172',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    inspectionSlots: [
      {
        id: 'slot-asb6-1',
        timeWindow: '10:00 AM – 11:00 AM',
        date: 'Today',
        capacityLimit: 5,
        bookedCount: 2,
        waitlistCount: 0
      },
      {
        id: 'slot-asb6-2',
        timeWindow: '1:00 PM – 2:00 PM',
        date: 'Today',
        capacityLimit: 5,
        bookedCount: 3,
        waitlistCount: 0
      }
    ],
    inspectionDays: ['Monday', 'Wednesday', 'Friday'],
    tags: ['Junic Estate', 'Ibusa Road', 'Newly Completed', 'Ensuite'],
    createdAt: '2026-10-15T12:00:00Z'
  },
  {
    id: 'prop-asaba-07',
    title: 'Well-Built 3-Bedroom Terraced Duplex Behind Government House',
    state: 'Delta State',
    city: 'Asaba',
    neighborhood: 'Behind Government House, GRA',
    fullAddress: 'Plot 9, Executive Crescent, Behind Government House, GRA Asaba, Delta State',
    propertyType: 'Duplex / Semi-Detached',
    bedrooms: 3,
    bathrooms: 3,
    toilets: 4,
    isServiced: true,
    isFurnished: false,
    electricityStatus: 'Band A (20+ hrs)',
    waterSupply: 'Borehole with Treatment',
    description: 'Exclusively finished 3-bedroom terraced duplex in the most secure zone of GRA Asaba behind Government House. Features interlocked compound, standby security personnel, dedicated water supply, and spacious private balcony.',
    media: [
      {
        type: 'image',
        url: 'https://images.nigeriapropertycentre.com/properties/images/thumbs/3625239/06a81a02109823-well-built-3-bedroom-duplex-terraced-duplexes-for-rent-asaba-delta.webp',
        caption: 'Behind Government House, GRA Asaba: Terraced duplex facade'
      },
      {
        type: 'image',
        url: '/images/properties/asaba_gra_exterior.jpg',
        caption: 'Paved compound with perimeter fencing and security guardhouse'
      },
      {
        type: 'image',
        url: '/images/properties/vacant_luxury_bedroom.jpg',
        caption: 'Master bedroom suite with walk-in wardrobe and ensuite bath'
      }
    ],
    fees: {
      baseRent: 4000000,
      rentPeriod: 'per annum',
      cautionFee: 300000,
      legalAndAgencyFee: 800000,
      serviceCharge: 350000,
      totalMoveInPackage: 5450000
    },
    inspectionFee: 3000,
    agent: {
      id: 'agent-oghene-01',
      fullName: 'Chief Oghenetega Macaulay',
      agencyName: 'Delta Heritage Realty Ltd',
      isVerified: true,
      cacNumber: 'RC-1849204',
      rating: 4.9,
      reviewCount: 42,
      completedInspections: 138,
      responseTime: 'Responds within 10 mins',
      phone: '08034928172',
      whatsapp: '2348034928172',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    inspectionSlots: [
      {
        id: 'slot-asb7-1',
        timeWindow: '11:00 AM – 12:00 PM',
        date: 'Today',
        capacityLimit: 5,
        bookedCount: 4,
        waitlistCount: 0
      },
      {
        id: 'slot-asb7-2',
        timeWindow: '3:00 PM – 4:00 PM',
        date: 'Tomorrow',
        capacityLimit: 5,
        bookedCount: 1,
        waitlistCount: 0
      }
    ],
    inspectionDays: ['Tuesday', 'Thursday', 'Saturday'],
    tags: ['Behind Govt House', 'Executive GRA', 'Terraced Duplex', 'Maximum Security'],
    createdAt: '2026-10-15T15:00:00Z'
  }
];

export const DELTA_CITIES = [
  'All Delta Cities',
  'Asaba',
  'Warri',
  'Effurun',
  'Udu',
  'Enerhen',
  'Opete',
  'Okpaka',
  'Okuokoko',
  'Otokutu',
  'Ujvewu',
  'Ughelli',
  'Sapele',
  'Agbor',
  'Abraka',
  'Okpanam',
  'Ibusa',
  'Ogwashi-Uku',
  'Oleh',
  'Ozoro',
  'Oghara',
  'Ekpan',
  'Ovwian',
  'Aladja',
  'Orhuwhorun',
  'Agbarho',
  'Eku',
  'Kwale',
  'Obiaruku',
  'Issele-Uku',
  'Orerokpe',
  'Koko',
  'Bomadi',
  'Patani',
  'Burutu',
  'Others'
];

export const ALL_NIGERIAN_STATES = [
  { value: 'Delta State (Active Launch)', label: 'Delta State (Active Launch)', disabled: false },
  { value: 'Edo State (Expanding Soon)', label: 'Edo State', disabled: true, badge: 'Coming Soon' },
  { value: 'Rivers State (Expanding Soon)', label: 'Rivers State', disabled: true, badge: 'Coming Soon' },
  { value: 'Lagos State (Expanding Soon)', label: 'Lagos State', disabled: true, badge: 'Coming Soon' },
  { value: 'Abuja FCT (Expanding Soon)', label: 'Abuja FCT', disabled: true, badge: 'Coming Soon' },
];

export const PROPERTY_TYPES = [
  'All Property Types',
  'Self-contain',
  'Single Room',
  'Bedseater',
  '2-Bedroom Flat',
  '3-Bedroom Flat',
  'Duplex / Semi-Detached'
];
