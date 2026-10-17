export type NigerianState = 
  | 'Delta State'
  | 'Edo State'
  | 'Rivers State'
  | 'Lagos State'
  | 'Abuja (FCT)';

export type DeltaCity = 
  | 'Asaba'
  | 'Warri'
  | 'Abraka'
  | 'Ughelli'
  | 'Sapele'
  | 'Agbor'
  | 'Oleh'
  | 'Effurun';

export type PropertyType = 
  | 'Self-contain'
  | 'Single Room'
  | 'Bedseater'
  | '2-Bedroom Flat'
  | '3-Bedroom Flat'
  | 'Duplex / Semi-Detached'
  | 'Commercial Shop';

export interface FeeBreakdown {
  baseRent: number;          // NGN per annum (or month)
  rentPeriod: 'per annum' | 'per month';
  cautionFee: number;        // Refundable security deposit
  legalAndAgencyFee: number; // Agreement & Commission
  serviceCharge: number;     // Security, waste disposal, borehole power
  totalMoveInPackage: number;
}

export interface InspectionSlot {
  id: string;
  timeWindow: string; // e.g. "10:00 AM – 11:00 AM"
  date: string;       // e.g. "Today" or "Tomorrow"
  capacityLimit: number; // strictly 5
  bookedCount: number;
  waitlistCount: number;
}

export type BookingStatus = 
  | 'IDLE'
  | 'REQUEST_SUBMITTED'           // Count < 5, booked directly, waiting for agent
  | 'QUEUED'                      // Count == 5, placed on standby queue with position
  | 'ACCEPTED_PENDING_PAYMENT'    // Agent approved, ready to pay micro-clearance fee
  | 'PAYMENT_PROCESSING'
  | 'CONFIRMED_UNLOCKED'          // Paid! Contact, address, and QR pass revealed
  | 'REJECTED_BY_AGENT'
  | 'CANCELLED';

export interface BookingRecord {
  id: string;
  propertyId: string;
  slotId: string;
  slotTimeWindow: string;
  slotDate: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail?: string;
  status: BookingStatus;
  queuePosition?: number;         // e.g. 1, 2 if QUEUED
  inspectionFeeAmount: number;    // e.g. 2500 NGN
  paymentReference?: string;
  paymentMethod?: 'Card' | 'Bank Transfer' | 'USSD';
  createdAt: string;
  confirmedAt?: string;
}

export interface AgentProfile {
  id: string;
  fullName: string;
  agencyName: string;
  isVerified: boolean;
  cacNumber?: string;
  rating: number; // e.g. 4.9
  reviewCount: number;
  completedInspections: number;
  responseTime: string; // e.g. "Usually responds in <15 mins"
  phone: string; // Protected until unlocked!
  whatsapp: string; // Protected until unlocked!
  avatarUrl: string;
}

export interface PropertyListing {
  id: string;
  title: string;
  state: NigerianState;
  city: DeltaCity | string;
  neighborhood: string; // e.g. "GRA Phase 2", "Airport Road"
  fullAddress: string;  // Protected until unlocked!
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  toilets: number;
  isServiced: boolean;
  isFurnished: boolean;
  electricityStatus: '24/7 Dedicated Line' | 'Band A (20+ hrs)' | 'Regular NEPA + Gen' | 'Solar Powered';
  waterSupply: 'Borehole with Treatment' | 'Public Water' | 'Dedicated Tank';
  description: string;
  media: {
    type: 'image' | 'video';
    url: string;
    caption: string;
  }[];
  fees: FeeBreakdown;
  inspectionFee: number; // clearance fee e.g. 2,500 or 3,000 NGN
  agent: AgentProfile;
  inspectionSlots: InspectionSlot[];
  inspectionDays: string[]; // e.g. ["Mon", "Wed", "Sat"]
  tags: string[];
  createdAt: string;
}

export type UserRole = 'seeker' | 'agent';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: DeltaCity | string;
  preferredPropertyType?: PropertyType | string;
  budget?: number;
  nin?: string;
  isVerifiedTenant: boolean;
  avatarUrl?: string;
  isAgent: boolean;
  agencyName?: string;
  cacNumber?: string;
  savedListingIds: string[];
}
