import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  MapPin, 
  Image as ImageIcon, 
  Film, 
  CheckCircle, 
  Plus, 
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  Trash2
} from 'lucide-react';
import { PropertyListing, DeltaCity, PropertyType, NigerianState } from '../../types/marketplace';
import { formatNaira, formatCurrencyInput, parseCurrencyInput } from '../../utils/formatters';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListingCreated: (newListing: PropertyListing) => void;
}

const PRESET_SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80'
];

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  onListingCreated,
}) => {
  // Form State
  const [title, setTitle] = useState('');
  const [selectedState, setSelectedState] = useState<NigerianState>('Delta State');
  const [city, setCity] = useState<DeltaCity>('Asaba');
  const [neighborhood, setNeighborhood] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('2-Bedroom Flat');
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [rentPeriod, setRentPeriod] = useState<'per annum' | 'per month'>('per annum');
  
  // Cost inputs formatted as currency strings
  const [baseRentInput, setBaseRentInput] = useState('1500000');
  const [cautionFeeInput, setCautionFeeInput] = useState('100000');
  const [legalAgencyFeeInput, setLegalAgencyFeeInput] = useState('300000');
  const [serviceChargeInput, setServiceChargeInput] = useState('120000');
  const [inspectionFeeInput, setInspectionFeeInput] = useState('2500');

  // Media
  const [uploadedImages, setUploadedImages] = useState<string[]>([...PRESET_SAMPLE_PHOTOS]);
  const [hasVideoReel, setHasVideoReel] = useState(true);

  // Inspection Window Rules
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri', 'Sat']);
  const [timeSlots, setTimeSlots] = useState<string[]>([
    '10:00 AM – 11:00 AM',
    '12:00 PM – 1:00 PM',
    '2:00 PM – 3:00 PM',
    '4:00 PM – 5:00 PM'
  ]);

  if (!isOpen) return null;

  // Numeric fees calculation
  const baseRentNum = parseCurrencyInput(baseRentInput);
  const cautionNum = parseCurrencyInput(cautionFeeInput);
  const legalAgencyNum = parseCurrencyInput(legalAgencyFeeInput);
  const serviceChargeNum = parseCurrencyInput(serviceChargeInput);
  const inspectionFeeNum = parseCurrencyInput(inspectionFeeInput) || 2500;
  const totalMoveIn = baseRentNum + cautionNum + legalAgencyNum + serviceChargeNum;

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => 
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddSamplePreset = () => {
    setTitle('Executive 2-Bedroom Terraced Flat with Dedicated Transformer');
    setCity('Warri');
    setNeighborhood('DDPA Estate, Effurun / Warri');
    setFullAddress('House 14, Road 3, DDPA Estate, Off Airport Road, Warri, Delta State');
    setPropertyType('2-Bedroom Flat');
    setBaseRentInput('1800000');
    setCautionFeeInput('150000');
    setLegalAgencyFeeInput('360000');
    setServiceChargeInput('150000');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newListing: PropertyListing = {
      id: `prop-agent-${Date.now()}`,
      title: title || `${propertyType} in ${neighborhood || city}`,
      state: selectedState,
      city,
      neighborhood: neighborhood || 'Central Residential District',
      fullAddress: fullAddress || `Protected Address in ${neighborhood}, ${city}, Delta State`,
      propertyType,
      bedrooms,
      bathrooms,
      toilets: bathrooms + 1,
      isServiced: serviceChargeNum > 0,
      isFurnished: false,
      electricityStatus: 'Band A (20+ hrs)',
      waterSupply: 'Borehole with Treatment',
      description: `Newly published verified listing in ${neighborhood}, ${city}. Inspected and approved under DeltaRent fair regional tenancy standards.`,
      media: uploadedImages.map((url, i) => ({
        type: i === 0 && hasVideoReel ? 'video' : 'image',
        url,
        caption: `Property view ${i + 1}`,
      })),
      fees: {
        baseRent: baseRentNum,
        rentPeriod,
        cautionFee: cautionNum,
        legalAndAgencyFee: legalAgencyNum,
        serviceCharge: serviceChargeNum,
        totalMoveInPackage: totalMoveIn,
      },
      inspectionFee: inspectionFeeNum,
      agent: {
        id: 'agent-chief-oghene',
        fullName: 'Chief Oghenetega Macaulay',
        agencyName: 'Delta Heritage Realty Ltd',
        isVerified: true,
        cacNumber: 'RC-1849204',
        rating: 4.9,
        reviewCount: 43,
        completedInspections: 139,
        responseTime: 'Responds within 10 mins',
        phone: '08034928172',
        whatsapp: '2348034928172',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      },
      inspectionSlots: timeSlots.map((window, idx) => ({
        id: `slot-new-${idx}-${Date.now().toString().slice(-4)}`,
        timeWindow: window,
        date: 'Today',
        capacityLimit: 5,
        bookedCount: 0,
        waitlistCount: 0,
      })),
      inspectionDays: selectedDays,
      tags: [city, neighborhood || 'Residential', 'Verified Agent', 'Borehole'],
      createdAt: new Date().toISOString(),
    };

    onListingCreated(newListing);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[92vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCF9F5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#275DAD]/10 text-[#275DAD] text-xs font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Agent Portal
              </span>
              <button
                type="button"
                onClick={handleAddSamplePreset}
                className="text-[11px] text-[#275DAD] hover:underline font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Autofill Test Property
              </button>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#000004] mt-1">
              Publish Verified Property Listing
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#70798C] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs">
          {/* SECTION 1: LOCATION */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#70798C] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#275DAD]" />
              1. Geographic Location & Address
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#70798C] block mb-1">State (Nigeria)</label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value as NigerianState)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#000004] bg-white focus:outline-none focus:border-[#275DAD]"
                >
                  <option value="Delta State">Delta State (Active Launch)</option>
                  <option value="Edo State">Edo State (Beta Expansion)</option>
                  <option value="Rivers State">Rivers State (Beta Expansion)</option>
                  <option value="Lagos State">Lagos State (Beta Expansion)</option>
                  <option value="Abuja (FCT)">Abuja (FCT) (Beta Expansion)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#70798C] block mb-1">Delta City / LGA Hub</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value as DeltaCity)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#000004] bg-white focus:outline-none focus:border-[#275DAD]"
                >
                  <option value="Asaba">Asaba (Capital City)</option>
                  <option value="Warri">Warri (Commercial Hub)</option>
                  <option value="Abraka">Abraka (DELSU Academic Hub)</option>
                  <option value="Ughelli">Ughelli (Central Zone)</option>
                  <option value="Sapele">Sapele (Coastal Corridor)</option>
                  <option value="Agbor">Agbor (Transit Hub)</option>
                  <option value="Oleh">Oleh (Law Campus Zone)</option>
                  <option value="Effurun">Effurun (Metropolitan Hub)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#70798C] block mb-1">
                  Public Neighborhood Tag
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="e.g. GRA Phase 2, Airport Road, Campus 3"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#275DAD]"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-[#70798C] block mb-1">
                  Protected Street Address (Revealed on Clearance)
                </label>
                <input
                  type="text"
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="e.g. Plot 18 Commissioners Quarters, Asaba"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#275DAD]"
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PROPERTY SPECS */}
          <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#70798C]">
              2. Property Title & Configuration
            </h4>

            <div>
              <label className="text-xs text-[#70798C] block mb-1">Listing Headline</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Luxury 2-Bedroom Serviced Flat with Solar Backup"
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#275DAD]"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#70798C] block mb-1">Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] bg-white focus:outline-none focus:border-[#275DAD]"
                >
                  <option value="Self-contain">Self-contain</option>
                  <option value="Single Room">Single Room</option>
                  <option value="1-Bedroom Flat">1-Bedroom Flat</option>
                  <option value="2-Bedroom Flat">2-Bedroom Flat</option>
                  <option value="3-Bedroom Flat">3-Bedroom Flat</option>
                  <option value="Duplex / Semi-Detached">Duplex / Semi-Detached</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#70798C] block mb-1">Bedrooms</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={bedrooms}
                  onChange={(e) => setBedrooms(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#275DAD]"
                />
              </div>

              <div>
                <label className="text-xs text-[#70798C] block mb-1">Baths</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={bathrooms}
                  onChange={(e) => setBathrooms(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#275DAD]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: TRANSPARENT FEES SCHEDULE */}
          <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#70798C]">
                3. Cost Inputs (Auto-Masked in ₦)
              </h4>
              <div className="flex items-center gap-1 bg-[#FCF9F5] p-1 rounded-lg border border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setRentPeriod('per annum')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    rentPeriod === 'per annum' ? 'bg-[#000004] text-white' : 'text-[#70798C]'
                  }`}
                >
                  Per Annum
                </button>
                <button
                  type="button"
                  onClick={() => setRentPeriod('per month')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    rentPeriod === 'per month' ? 'bg-[#000004] text-white' : 'text-[#70798C]'
                  }`}
                >
                  Per Month
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#70798C] block mb-1">
                  Base Rent Amount (₦) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#70798C] font-semibold">₦</span>
                  <input
                    type="text"
                    value={formatCurrencyInput(baseRentInput)}
                    onChange={(e) => setBaseRentInput(e.target.value)}
                    placeholder="1,500,000"
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] font-semibold focus:outline-none focus:border-[#275DAD]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#70798C] block mb-1">
                  Refundable Caution Deposit (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#70798C] font-semibold">₦</span>
                  <input
                    type="text"
                    value={formatCurrencyInput(cautionFeeInput)}
                    onChange={(e) => setCautionFeeInput(e.target.value)}
                    placeholder="100,000"
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#275DAD]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#70798C] block mb-1">
                  Legal & Agency Fee (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#70798C] font-semibold">₦</span>
                  <input
                    type="text"
                    value={formatCurrencyInput(legalAgencyFeeInput)}
                    onChange={(e) => setLegalAgencyFeeInput(e.target.value)}
                    placeholder="300,000"
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#275DAD]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#70798C] block mb-1">
                  Service Charge (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#70798C] font-semibold">₦</span>
                  <input
                    type="text"
                    value={formatCurrencyInput(serviceChargeInput)}
                    onChange={(e) => setServiceChargeInput(e.target.value)}
                    placeholder="120,000"
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#275DAD]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#70798C] block mb-1">
                  Inspection Fee (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#70798C] font-semibold">₦</span>
                  <input
                    type="text"
                    value={formatCurrencyInput(inspectionFeeInput)}
                    onChange={(e) => setInspectionFeeInput(e.target.value)}
                    placeholder="2,500"
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#275DAD]"
                  />
                </div>
              </div>
            </div>

            {/* Computed Move-in Total Live Preview */}
            <div className="p-3.5 rounded-xl bg-[#FCF9F5] border border-[#275DAD]/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#70798C] font-semibold">
                  Computed Total Move-in Package
                </span>
                <div className="text-xs text-[#70798C]">
                  All transparent items certified for applicant display
                </div>
              </div>
              <div className="font-display text-xl font-bold text-[#000004]">
                {formatNaira(totalMoveIn)}
              </div>
            </div>
          </div>

          {/* SECTION 4: MEDIA UPLOADER & REEL */}
          <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#70798C] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#275DAD]" />
                4. Media Carousel & Video Reel
              </h4>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasVideoReel}
                  onChange={(e) => setHasVideoReel(e.target.checked)}
                  className="accent-[#275DAD]"
                />
                <span className="text-[11px] font-medium text-[#000004]">
                  Enable Vertical Video Reel
                </span>
              </label>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {uploadedImages.map((img, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden border border-[#E5E7EB] aspect-square group">
                  <img src={img} alt="preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded">
                    {i === 0 && hasVideoReel ? 'Reel' : `Photo ${i + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: INSPECTION RULES */}
          <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#70798C] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#275DAD]" />
              5. Inspection Capacity Rules (Concurrency Cap: 5/hr)
            </h4>

            <div>
              <label className="text-xs text-[#70798C] block mb-1.5">
                Active Weekly Inspection Days
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                  const isChecked = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                        isChecked
                          ? 'bg-[#000004] text-white shadow-xs'
                          : 'bg-[#FCF9F5] text-[#70798C] border border-[#E5E7EB]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-50/60 border border-[#275DAD]/20 text-[11px] text-[#000004]">
              <strong>Standard Delta Windows Configured: </strong>
              10:00 AM – 11:00 AM, 12:00 PM – 1:00 PM, 2:00 PM – 3:00 PM, 4:00 PM – 5:00 PM. Each capped at strictly 5 concurrent seekers.
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-semibold text-[#70798C] hover:text-[#000004]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-6 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold shadow-md transition-colors"
            >
              Publish to Delta Marketplace Feed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
