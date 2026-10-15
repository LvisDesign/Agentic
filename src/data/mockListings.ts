import { PropertyListing } from '../types/marketplace';

export const INITIAL_LISTINGS: PropertyListing[] = [
  {
    id: 'prop-asaba-01',
    title: 'Luxury 2-Bedroom Serviced Flat with Solar Backup',
    state: 'Delta State',
    city: 'Asaba',
    neighborhood: 'GRA Phase 2 (Near Govt House)',
    fullAddress: 'Plot 18, Commissioners Quarters Drive, Off Okpanam Rd, GRA Phase 2, Asaba, Delta State',
    propertyType: '2-Bedroom Flat',
    bedrooms: 2,
    bathrooms: 2,
    toilets: 3,
    isServiced: true,
    isFurnished: false,
    electricityStatus: 'Band A (20+ hrs)',
    waterSupply: 'Borehole with Treatment',
    description: 'Immaculately finished 2-bedroom executive apartment in prime GRA Asaba. Features POP ceilings, fully fitted kitchen with granite tops, heat extractor, prepaid meter, security gatehouse, and 24-hour estate patrol. Interlocked compound with ample parking.',
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
        caption: 'Spacious living room with natural lighting and chandelier fittings'
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
        caption: 'Gated compound with perimeter electric fencing'
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
        caption: 'Master bedroom with ensuite Italian tiled bath'
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80',
        caption: 'Chef kitchen with imported mahogany cabinets'
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
    title: 'Modern 3-Bedroom Flat in Gated Shell/Chevron Corridor',
    state: 'Delta State',
    city: 'Warri',
    neighborhood: 'Airport Road (Near Shoprite)',
    fullAddress: 'Block 4, Palm Grove Crescent, Off Airport Road, Warri, Delta State',
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
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
        caption: 'Contemporary facade and private car park'
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=80',
        caption: 'Generous dining and lounge area'
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80',
        caption: 'Spacious master suite with wardrobe'
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
    title: 'Self-Contain Studio (Delsu Campus 3 Gate Vicinity)',
    state: 'Delta State',
    city: 'Abraka',
    neighborhood: 'Campus 3 Main Gate / Ekrejeta',
    fullAddress: 'Lodge 7, Royal Scholars Haven, Old Abraka Road, DELSU Gate 3, Abraka, Delta State',
    propertyType: 'Self-contain',
    bedrooms: 1,
    bathrooms: 1,
    toilets: 1,
    isServiced: true,
    isFurnished: false,
    electricityStatus: 'Solar Powered',
    waterSupply: 'Borehole with Treatment',
    description: 'High-demand executive self-contain studio for serious students, lecturers, or young professionals. Features 24/7 solar light for studying, treated borehole water running directly into kitchen and bathroom, uniform security guard, and perimeter CCTV.',
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
        caption: 'Compact modern studio interior'
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
        caption: 'Kitchenette with induction socket and pantry'
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80',
        caption: 'Clean tiled bathroom with shower'
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
    title: 'Newly Built 2-Bedroom Flat in Serene Residential Estate',
    state: 'Delta State',
    city: 'Ughelli',
    neighborhood: 'Otovwodo / Afiesere Road',
    fullAddress: 'Compound 12, Unity Court, Off Otovwodo Junction, Ughelli, Delta State',
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
        url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1000&q=80',
        caption: 'Clean exterior compound'
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1000&q=80',
        caption: 'Bedroom with wardrobe space'
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
    title: 'Executive 4-Bedroom Semi-Detached Duplex with BQ',
    state: 'Delta State',
    city: 'Sapele',
    neighborhood: 'Boyo Road / Amukpe GRA',
    fullAddress: 'Plot 5B, Palm View Haven, Off Boyo Road, Amukpe, Sapele, Delta State',
    propertyType: 'Duplex / Semi-Detached',
    bedrooms: 4,
    bathrooms: 4,
    toilets: 5,
    isServiced: true,
    isFurnished: true,
    electricityStatus: 'Band A (20+ hrs)',
    waterSupply: 'Borehole with Treatment',
    description: 'High-end fully furnished duplex in prestigious Amukpe residential zone. Features automated security gate, standby 30kVA generator, smart lock front door, Italian marble floor, and private rooftop lounge with river breeze.',
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1000&q=80',
        caption: 'Luxury exterior architectural facade'
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80',
        caption: 'Designer interior with smart lighting'
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1000&q=80',
        caption: 'Master bath with jacuzzi tub'
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
  }
];

export const DELTA_CITIES = [
  'All Delta Cities',
  'Asaba',
  'Warri',
  'Abraka',
  'Ughelli',
  'Sapele',
  'Agbor',
  'Oleh',
  'Effurun'
];

export const ALL_NIGERIAN_STATES = [
  'Delta State (Active Launch)',
  'Edo State (Expanding Soon)',
  'Rivers State (Expanding Soon)',
  'Lagos State (Expanding Soon)',
  'Abuja FCT (Expanding Soon)'
];

export const PROPERTY_TYPES = [
  'All Property Types',
  'Self-contain',
  'Single Room',
  '1-Bedroom Flat',
  '2-Bedroom Flat',
  '3-Bedroom Flat',
  'Duplex / Semi-Detached'
];
