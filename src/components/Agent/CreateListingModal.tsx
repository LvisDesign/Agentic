import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  MapPin, 
  Image as ImageIcon, 
  Film, 
  CheckCircle, 
  Plus, 
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

interface MediaItemDraft {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption?: string;
}

const DEFAULT_SAMPLE_MEDIA: MediaItemDraft[] = [
  {
    id: 'sample-video-1',
    type: 'video',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-living-room-interior-39744-large.mp4',
    caption: 'House Walkthrough Video',
  },
  {
    id: 'sample-img-1',
    type: 'image',
    url: '/images/properties/warri_estate_exterior.jpg',
    caption: 'Gated Estate Compound & Security Gatehouse',
  },
  {
    id: 'sample-img-2',
    type: 'image',
    url: '/images/properties/asaba_vacant_living.jpg',
    caption: 'Spacious Vacant Living Room with POP Ceiling',
  },
  {
    id: 'sample-img-3',
    type: 'image',
    url: '/images/properties/vacant_luxury_kitchen.jpg',
    caption: 'Fitted Kitchen with Granite Tops & Heat Extractor',
  },
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

  // Media (Whatever the agent uploads: house videos or images)
  const [uploadedMedia, setUploadedMedia] = useState<MediaItemDraft[]>([...DEFAULT_SAMPLE_MEDIA]);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('video');
  const [newMediaCaption, setNewMediaCaption] = useState('');

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


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: MediaItemDraft[] = Array.from(files).map((file, idx) => {
      const isVideo = file.type.startsWith('video/');
      const objectUrl = URL.createObjectURL(file);
      return {
        id: `upload-${Date.now()}-${idx}`,
        type: isVideo ? 'video' : 'image',
        url: objectUrl,
        caption: file.name.replace(/\.[^/.]+$/, ''),
      };
    });

    setUploadedMedia((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  const handleAddMediaUrl = () => {
    if (!newMediaUrl.trim()) return;
    setUploadedMedia((prev) => [
      ...prev,
      {
        id: `url-${Date.now()}`,
        type: newMediaType,
        url: newMediaUrl.trim(),
        caption: newMediaCaption.trim() || (newMediaType === 'video' ? 'House Walkthrough Video' : 'House Photo'),
      },
    ]);
    setNewMediaUrl('');
    setNewMediaCaption('');
  };

  const handleRemoveMedia = (id: string) => {
    setUploadedMedia((prev) => prev.filter((m) => m.id !== id));
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
      media: uploadedMedia.length > 0
        ? uploadedMedia.map((item, i) => ({
            type: item.type,
            url: item.url,
            caption: item.caption || `Property view ${i + 1}`,
          }))
        : [
            {
              type: 'image',
              url: '/images/properties/asaba_gra_exterior.jpg',
              caption: 'Property exterior view',
            },
          ],
      fees: {
        baseRent: baseRentNum,
        rentPeriod,
        cautionFee: cautionNum,
        legalAndAgencyFee: legalAgencyNum,
        serviceCharge: serviceChargeNum,
        totalMoveInPackage: totalMoveIn,
      },
      inspectionFee: 0,
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
      tags: [city, neighborhood || 'Residential', 'Direct Agent', 'Borehole'],
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
              <span className="px-2 py-0.5 rounded-full bg-[#342A21]/10 text-[#342A21] text-xs font-semibold">
                Agent Portal
              </span>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#000004] mt-1">
              Publish Property Listing
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
              <MapPin className="w-3.5 h-3.5 text-[#342A21]" />
              1. Geographic Location & Address
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#70798C] block mb-1">State (Nigeria)</label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value as NigerianState)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#000004] bg-white focus:outline-none focus:border-[#342A21]"
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
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#000004] bg-white focus:outline-none focus:border-[#342A21]"
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
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-[#70798C] block mb-1">
                  Internal Property Address (Private Agent Record — Never Disclosed to Tenants)
                </label>
                <input
                  type="text"
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="e.g. Plot 18 Commissioners Quarters, Asaba"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
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
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#70798C] block mb-1">Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] bg-white focus:outline-none focus:border-[#342A21]"
                >
                  <option value="Self-contain">Self-contain</option>
                  <option value="Single Room">Single Room</option>
                  <option value="Bedseater">Bedseater</option>
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
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
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
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
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
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] font-semibold focus:outline-none focus:border-[#342A21]"
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
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
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
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
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
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#70798C] block mb-1">
                  Seeker Inspection Fee
                </label>
                <div className="w-full px-3 py-2 rounded-lg bg-[#FCF9F5] border border-[#E5E7EB] text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Free Booking (₦0)</span>
                </div>
              </div>
            </div>

            {/* Computed Move-in Total Live Preview */}
            <div className="p-3.5 rounded-xl bg-[#FCF9F5] border border-[#342A21]/20 flex items-center justify-between">
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

          {/* SECTION 4: PROPERTY MEDIA (VIDEOS & IMAGES) */}
          <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#70798C] flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-[#342A21]" />
                  4. Property Media (House Videos & Photos)
                </h4>
                <p className="text-[11px] text-[#70798C] mt-0.5">
                  Upload house walkthrough videos and high-res photos. Tenants see whatever you upload directly in the feed.
                </p>
              </div>
            </div>

            {/* Upload Buttons & Direct URL Input */}
            <div className="flex flex-col sm:flex-row gap-2">
              <label 
                htmlFor="agent-media-files"
                className="cursor-pointer px-3 py-2 rounded-lg bg-white border border-[#000004]/20 hover:border-[#000004] text-[#000004] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Upload className="w-3.5 h-3.5 text-[#342A21]" />
                <span>Upload Videos & Photos</span>
                <input
                  id="agent-media-files"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* URL Quick-Add */}
              <div className="flex-1 flex gap-1.5">
                <select
                  value={newMediaType}
                  onChange={(e) => setNewMediaType(e.target.value as 'image' | 'video')}
                  className="px-2 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-[#000004] focus:outline-none focus:border-[#342A21]"
                >
                  <option value="video">House Video</option>
                  <option value="image">Photo</option>
                </select>
                <input
                  type="url"
                  placeholder={newMediaType === 'video' ? 'Paste MP4 / Video URL' : 'Paste Image URL'}
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                />
                <button
                  type="button"
                  onClick={handleAddMediaUrl}
                  disabled={!newMediaUrl.trim()}
                  className="px-3 py-1.5 rounded-lg bg-[#000004] text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-40 transition-colors shrink-0"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Media Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {uploadedMedia.map((item, i) => (
                <div 
                  key={item.id || i} 
                  className="relative rounded-lg overflow-hidden border border-[#E5E7EB] aspect-square group bg-slate-950 flex items-center justify-center"
                >
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img 
                      src={item.url} 
                      alt={item.caption || 'preview'} 
                      className="w-full h-full object-cover" 
                    />
                  )}

                  {/* Badge */}
                  <span className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                    {item.type === 'video' ? (
                      <>
                        <Film className="w-2.5 h-2.5 text-amber-200" />
                        <span>Video</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-2.5 h-2.5 text-white/80" />
                        <span>Photo</span>
                      </>
                    )}
                  </span>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(item.id)}
                    title="Remove media"
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white hover:bg-red-600 flex items-center justify-center transition-colors shadow-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {/* Bottom Caption */}
                  {item.caption && (
                    <span className="absolute bottom-1 left-1 right-1 text-center bg-black/60 backdrop-blur-xs text-white text-[9px] px-1 py-0.5 rounded truncate">
                      {item.caption}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: INSPECTION RULES */}
          <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#70798C] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#342A21]" />
              5. Inspection Capacity Rules (Agent Cap: Max 5 Bookings per Window)
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

            <div className="p-3 rounded-lg bg-[#342A21]/5 border border-[#342A21]/20 text-[11px] text-[#000004]">
              <strong>Standard Delta Windows Configured: </strong>
              10:00 AM – 11:00 AM, 12:00 PM – 1:00 PM, 2:00 PM – 3:00 PM, 4:00 PM – 5:00 PM. As an agent, each window is capped at strictly 5 bookings to ensure you don't overcommit or waste house seekers' valuable time.
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
