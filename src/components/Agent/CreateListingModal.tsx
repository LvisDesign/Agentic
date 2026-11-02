import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  MapPin, 
  Image as ImageIcon, 
  Film, 
  Plus, 
  ShieldCheck,
  Calendar,
  Clock,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { PropertyListing, DeltaCity, PropertyType, NigerianState, UserProfile } from '../../types/marketplace';
import { formatNaira, formatCurrencyInput, parseCurrencyInput } from '../../utils/formatters';
import { CustomDropdown, DropdownOption } from '../UI/CustomDropdown';
import { DELTA_CITY_OPTIONS } from '../../data/deltaCities';
import { processUploadedFile, DEFAULT_FALLBACK_IMAGE } from '../../utils/mediaStorage';
import { ModalPortal } from '../UI/ModalPortal';

const NIGERIAN_STATE_OPTIONS: DropdownOption[] = [
  {
    value: 'Delta State',
    label: 'Delta State',
    subtitle: 'Primary Hub — Verified Direct Booking',
  },
  {
    value: 'Edo State',
    label: 'Edo State',
    subtitle: 'Benin City & Environs',
    badge: 'Coming Soon',
    disabled: true,
  },
  {
    value: 'Rivers State',
    label: 'Rivers State',
    subtitle: 'Port Harcourt Metro',
    badge: 'Coming Soon',
    disabled: true,
  },
  {
    value: 'Lagos State',
    label: 'Lagos State',
    subtitle: 'Island & Mainland Zones',
    badge: 'Coming Soon',
    disabled: true,
  },
  {
    value: 'Abuja (FCT)',
    label: 'Abuja (FCT)',
    subtitle: 'Federal Capital Territory',
    badge: 'Coming Soon',
    disabled: true,
  },
];



const PROPERTY_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'Self-contain', label: 'Self-contain', subtitle: 'Room with private toilet and kitchen' },
  { value: 'Single Room', label: 'Single Room', subtitle: 'Single room (shared toilet/bathroom)' },
  { value: 'Bedseater', label: 'Bedseater', subtitle: 'Spacious room self-contain' },
  { value: '2-Bedroom Flat', label: '2-Bedroom Flat', subtitle: '2 bedrooms with parlor and kitchen' },
  { value: '3-Bedroom Flat', label: '3-Bedroom Flat', subtitle: '3 bedrooms with parlor and kitchen' },
  { value: 'Duplex / Semi-Detached', label: 'Duplex / Whole House', subtitle: 'Standalone duplex or whole compound' },
];

const SUGGESTED_ADDONS: string[] = [
  '33KVA Dedicated Line',
  'High-Speed Internet / WiFi',
  'Solar Inverter Backup',
  'Standby Generator',
  'Treated Clean Water',
  'Uniformed Estate Security',
  'Prepaid Meter',
  'POP Ceilings',
  'Water Heater',
  'Ample Parking Space',
];


interface CreateListingModalProps {
  isOpen: boolean;
  currentUser?: UserProfile;
  initialListing?: PropertyListing | null;
  onClose: () => void;
  onListingCreated: (newListing: PropertyListing) => void;
  onListingUpdated?: (updatedListing: PropertyListing) => void;
}

interface MediaItemDraft {
  id: string;
  type: 'image' | 'video';
  url: string;
  poster?: string;
  caption?: string;
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  currentUser,
  initialListing,
  onClose,
  onListingCreated,
  onListingUpdated,
}) => {
  const isEditing = Boolean(initialListing);
  // Form State
  const initialCity = ((currentUser?.operatingCity || currentUser?.city || 'Asaba') as DeltaCity);
  const [title, setTitle] = useState('');
  const [selectedState, setSelectedState] = useState<NigerianState>(
    (currentUser?.operatingState as NigerianState) || 'Delta State'
  );
  const [city, setCity] = useState<DeltaCity>(initialCity);
  const [neighborhood, setNeighborhood] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('2-Bedroom Flat');
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [rentPeriod, setRentPeriod] = useState<'per annum' | 'per month'>('per annum');
  
  // Cost inputs formatted as currency strings (starts empty for agent to enter manually)
  const [baseRentInput, setBaseRentInput] = useState('');
  const [cautionFeeInput, setCautionFeeInput] = useState('');
  const [legalFeeInput, setLegalFeeInput] = useState('');
  const [agencyFeeInput, setAgencyFeeInput] = useState('');
  const [serviceChargeInput, setServiceChargeInput] = useState('');
  const [inspectionFeeInput, setInspectionFeeInput] = useState('');

  const [addons, setAddons] = useState<string[]>([]);
  const [addonInput, setAddonInput] = useState('');

  const handleAddCustomAddon = () => {
    const trimmed = addonInput.trim();
    if (!trimmed) return;
    if (!addons.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setAddons((prev) => [...prev, trimmed]);
    }
    setAddonInput('');
  };

  const handleAddSuggestedAddon = (item: string) => {
    if (!addons.some((a) => a.toLowerCase() === item.toLowerCase())) {
      setAddons((prev) => [...prev, item]);
    }
  };

  const handleRemoveAddon = (itemToRemove: string) => {
    setAddons((prev) => prev.filter((a) => a !== itemToRemove));
  };

  // Media
  const [uploadedMedia, setUploadedMedia] = useState<MediaItemDraft[]>([]);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [rentError, setRentError] = useState<string | null>(null);

  // Inspection Window Rules
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri', 'Sat']);
  const [timeSlots, setTimeSlots] = useState<string[]>([
    '10:00 AM – 11:00 AM',
    '12:00 PM – 1:00 PM',
    '2:00 PM – 3:00 PM',
    '4:00 PM – 5:00 PM'
  ]);

  // Synchronize state when editing an existing listing or opening new creation
  React.useEffect(() => {
    if (initialListing) {
      setTitle(initialListing.title || '');
      setSelectedState(initialListing.state || 'Delta State');
      setCity(initialListing.city || initialCity);
      setNeighborhood(initialListing.neighborhood || '');
      setPropertyType(initialListing.propertyType || '2-Bedroom Flat');
      setBedrooms(initialListing.bedrooms || 2);
      setBathrooms(initialListing.bathrooms || 2);
      setRentPeriod(initialListing.fees?.rentPeriod || 'per annum');
      setBaseRentInput(formatCurrencyInput(String(initialListing.fees?.baseRent || '')));
      setCautionFeeInput(formatCurrencyInput(String(initialListing.fees?.cautionFee || '')));
      setLegalFeeInput(
        initialListing.fees?.legalFee !== undefined
          ? formatCurrencyInput(String(initialListing.fees.legalFee || ''))
          : initialListing.fees?.legalAndAgencyFee
            ? formatCurrencyInput(String(Math.round(initialListing.fees.legalAndAgencyFee / 2)))
            : ''
      );
      setAgencyFeeInput(
        initialListing.fees?.agencyFee !== undefined
          ? formatCurrencyInput(String(initialListing.fees.agencyFee || ''))
          : initialListing.fees?.legalAndAgencyFee
            ? formatCurrencyInput(String(initialListing.fees.legalAndAgencyFee - Math.round(initialListing.fees.legalAndAgencyFee / 2)))
            : ''
      );
      setServiceChargeInput(formatCurrencyInput(String(initialListing.fees?.serviceCharge || '')));
      setInspectionFeeInput(formatCurrencyInput(String(initialListing.inspectionFee || '')));
      setAddons(initialListing.addons || []);
      setUploadedMedia(
        (initialListing.media || []).map((m, idx) => ({
          id: m.id || `media-existing-${idx}-${Date.now()}`,
          type: m.type,
          url: m.url,
          poster: m.poster,
          caption: m.caption,
        }))
      );
      if (initialListing.inspectionDays && initialListing.inspectionDays.length > 0) {
        setSelectedDays(initialListing.inspectionDays);
      }
      if (initialListing.inspectionSlots && initialListing.inspectionSlots.length > 0) {
        setTimeSlots(initialListing.inspectionSlots.map((s) => s.timeWindow));
      }
    } else if (isOpen) {
      setTitle('');
      setSelectedState((currentUser?.operatingState as NigerianState) || 'Delta State');
      setCity(initialCity);
      setNeighborhood('');
      setPropertyType('2-Bedroom Flat');
      setBedrooms(2);
      setBathrooms(2);
      setRentPeriod('per annum');
      setBaseRentInput('');
      setCautionFeeInput('');
      setLegalFeeInput('');
      setAgencyFeeInput('');
      setServiceChargeInput('');
      setInspectionFeeInput('');
      setAddons([]);
      setUploadedMedia([]);
      setSelectedDays(['Mon', 'Wed', 'Fri', 'Sat']);
      setTimeSlots([
        '10:00 AM – 11:00 AM',
        '12:00 PM – 1:00 PM',
        '2:00 PM – 3:00 PM',
        '4:00 PM – 5:00 PM'
      ]);
    }
  }, [initialListing, isOpen]);

  if (!isOpen) return null;

  // Numeric fees calculation strictly based on what agent enters
  const baseRentNum = parseCurrencyInput(baseRentInput);
  const cautionNum = parseCurrencyInput(cautionFeeInput);
  const legalFeeNum = parseCurrencyInput(legalFeeInput);
  const agencyFeeNum = parseCurrencyInput(agencyFeeInput);
  const serviceChargeNum = parseCurrencyInput(serviceChargeInput);
  const inspectionFeeNum = parseCurrencyInput(inspectionFeeInput) || 2500;
  const totalMoveIn = baseRentNum + cautionNum + legalFeeNum + agencyFeeNum + serviceChargeNum;

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => 
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingMedia(true);
    setMediaError(null);

    try {
      const fileList = Array.from(files);
      const processed = await Promise.all(
        fileList.map((file, idx) => processUploadedFile(file, uploadedMedia.length + idx))
      );

      setUploadedMedia((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error('Failed to process uploaded media files:', err);
      setMediaError('Could not process some files. Please check formats and try again.');
    } finally {
      setIsProcessingMedia(false);
      e.target.value = '';
    }
  };

  const handleRemoveMedia = (id: string) => {
    setUploadedMedia((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!baseRentNum || baseRentNum <= 0) {
      setRentError('Please enter a valid house rent amount.');
      return;
    }
    setRentError(null);

    if (uploadedMedia.length === 0) {
      setMediaError('Please upload at least 1 photo or video walkthrough of the property.');
      return;
    }

    if (isEditing && initialListing) {
      const updatedListing: PropertyListing = {
        ...initialListing,
        title: title || `${propertyType} in ${neighborhood || city}`,
        state: selectedState,
        city,
        neighborhood: neighborhood || 'Central Residential District',
        fullAddress: `${neighborhood ? `${neighborhood}, ` : ''}${city}, ${selectedState}`,
        propertyType,
        bedrooms,
        bathrooms,
        toilets: bathrooms + 1,
        isServiced: serviceChargeNum > 0,
        media: uploadedMedia.map((item, i) => ({
          id: item.id,
          type: item.type,
          url: item.url,
          poster: item.poster,
          caption: item.caption || `Property view ${i + 1}`,
        })),
        fees: {
          baseRent: baseRentNum,
          rentPeriod,
          cautionFee: cautionNum,
          legalFee: legalFeeNum,
          agencyFee: agencyFeeNum,
          legalAndAgencyFee: legalFeeNum + agencyFeeNum,
          serviceCharge: serviceChargeNum,
          totalMoveInPackage: totalMoveIn,
        },
        inspectionFee: inspectionFeeNum,
        inspectionDays: selectedDays,
        inspectionSlots: timeSlots.map((window, idx) => {
          const existing = initialListing.inspectionSlots?.[idx];
          return {
            id: existing?.id || `slot-${idx}-${Date.now().toString().slice(-4)}`,
            timeWindow: window,
            date: existing?.date || 'Today',
            capacityLimit: existing?.capacityLimit || 5,
            bookedCount: existing?.bookedCount || 0,
            waitlistCount: existing?.waitlistCount || 0,
          };
        }),
        tags: [city, neighborhood || 'Residential', 'Direct Agent', ...addons],
        addons: addons.length > 0 ? addons : undefined,
      };

      if (onListingUpdated) {
        onListingUpdated(updatedListing);
      }
      onClose();
      return;
    }

    const newListing: PropertyListing = {
      id: `prop-agent-${Date.now()}`,
      title: title || `${propertyType} in ${neighborhood || city}`,
      state: selectedState,
      city,
      neighborhood: neighborhood || 'Central Residential District',
      fullAddress: `${neighborhood ? `${neighborhood}, ` : ''}${city}, ${selectedState}`,
      propertyType,
      bedrooms,
      bathrooms,
      toilets: bathrooms + 1,
      isServiced: serviceChargeNum > 0,
      isFurnished: false,
      electricityStatus: undefined,
      waterSupply: undefined,
      description: `Newly published verified listing in ${neighborhood}, ${city}. Inspected and approved under Setlla fair regional tenancy standards.`,
      media: uploadedMedia.map((item, i) => ({
        id: item.id,
        type: item.type,
        url: item.url,
        poster: item.poster,
        caption: item.caption || `Property view ${i + 1}`,
      })),
      fees: {
        baseRent: baseRentNum,
        rentPeriod,
        cautionFee: cautionNum,
        legalFee: legalFeeNum,
        agencyFee: agencyFeeNum,
        legalAndAgencyFee: legalFeeNum + agencyFeeNum,
        serviceCharge: serviceChargeNum,
        totalMoveInPackage: totalMoveIn,
      },
      inspectionFee: inspectionFeeNum,
      agent: {
        id: currentUser?.id || `agt-${Date.now()}`,
        fullName: currentUser?.fullName || 'Verified Agent',
        agencyName: currentUser?.agencyName || currentUser?.fullName || 'Independent Agent',
        isVerified: true,
        cacNumber: currentUser?.cacNumber || 'VERIFIED-REG',
        rating: 5.0,
        reviewCount: 0,
        completedInspections: 0,
        responseTime: 'Responds within 10 mins',
        phone: currentUser?.phone || '',
        whatsapp: currentUser?.whatsapp || currentUser?.phone || '',
        avatarUrl: currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
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
      tags: [city, neighborhood || 'Residential', 'Direct Agent', ...addons],
      addons: addons.length > 0 ? addons : undefined,
      createdAt: new Date().toISOString(),
    };

    onListingCreated(newListing);
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[92vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCF9F5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#342A21]/10 text-[#342A21] text-xs font-semibold">
                {isEditing ? 'Listing Editor' : 'Agent Portal'}
              </span>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#000004] mt-1">
              {isEditing ? 'Edit Property Listing' : 'Add New Property'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#70798C] flex items-center justify-center transition-colors cursor-pointer"
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
              1. House Location
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-30">
              <div>
                <label className="text-xs text-[#70798C] block mb-1">State</label>
                <CustomDropdown
                  options={NIGERIAN_STATE_OPTIONS}
                  value={selectedState}
                  onChange={(val) => setSelectedState(val as NigerianState)}
                  headerTitle="Select State"
                  variant="form"
                />
              </div>

              <div>
                <label className="text-xs text-[#70798C] block mb-1">City / Town</label>
                <CustomDropdown
                  options={DELTA_CITY_OPTIONS}
                  value={city}
                  onChange={(val) => setCity(val as DeltaCity)}
                  headerTitle="Select City or Town"
                  placeholder="Select City / Town"
                  variant="form"
                  allowCustomInput={true}
                  customSearchSubtitle="Type city, area, or town"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#70798C] block mb-1">
                Area / Neighborhood
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
          </div>

          {/* SECTION 2: PROPERTY SPECS */}
          <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#70798C]">
              2. House Details
            </h4>

            <div>
              <label className="text-xs text-[#70798C] block mb-1">Property Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Newly built 2-Bedroom Flat with constant light and water"
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3 relative z-20">
              <div>
                <label className="text-xs text-[#70798C] block mb-1">House Type</label>
                <CustomDropdown
                  options={PROPERTY_TYPE_OPTIONS}
                  value={propertyType}
                  onChange={(val) => setPropertyType(val as PropertyType)}
                  headerTitle="Select House Type"
                  variant="form"
                />
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
                <label className="text-xs text-[#70798C] block mb-1">Bathrooms / Toilets</label>
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

            {/* Optional Property Add-ons & Amenities */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#000004] flex items-center gap-1.5">
                  <span>Property Add-ons & Key Amenities</span>
                  <span className="text-[10px] text-[#70798C] font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                    Optional
                  </span>
                </label>
                {addons.length > 0 && (
                  <span className="text-[10px] text-[#70798C] font-semibold">
                    {addons.length} {addons.length === 1 ? 'addon' : 'addons'} added
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#70798C] mb-2">
                Type any custom addon manually (e.g. <strong>33KVA</strong>, <strong>Internet</strong>, <strong>Starlink</strong>, <strong>Solar Inverter</strong>) or choose from suggestions below:
              </p>

              {/* Add Custom Addon Input Bar */}
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={addonInput}
                  onChange={(e) => setAddonInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomAddon();
                    }
                  }}
                  placeholder="Type an addon (e.g. 33KVA, Internet, Solar) and press Add or Enter"
                  className="flex-1 px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#000004] bg-white placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={handleAddCustomAddon}
                  disabled={!addonInput.trim()}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                    addonInput.trim()
                      ? 'bg-[#000004] hover:bg-[#1f2937] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Quick Suggestion Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                <span className="text-[10px] text-[#70798C] font-semibold mr-0.5">Quick picks:</span>
                {SUGGESTED_ADDONS.map((suggestion) => {
                  const isAdded = addons.some((a) => a.toLowerCase() === suggestion.toLowerCase());
                  return (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddSuggestedAddon(suggestion)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        isAdded
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-[#FCF9F5] border-[#E5E7EB] text-[#000004] hover:border-[#000004] hover:bg-white'
                      }`}
                    >
                      + {suggestion}
                    </button>
                  );
                })}
              </div>

              {/* Added Add-ons List */}
              {addons.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-amber-50/40 border border-amber-200/60 animate-fade-in">
                  {addons.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#E5E7EB] text-xs font-bold text-[#000004] shadow-2xs"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAddon(item)}
                        className="text-[#70798C] hover:text-rose-600 transition-colors ml-0.5 cursor-pointer p-0.5 rounded-full hover:bg-rose-50"
                        title={`Remove ${item}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: TRANSPARENT FEES SCHEDULE */}
          <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#70798C]">
                3. Rent & Payments
              </h4>
              <div className="flex items-center gap-1 bg-[#FCF9F5] p-1 rounded-lg border border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setRentPeriod('per annum')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    rentPeriod === 'per annum' ? 'bg-[#000004] text-white' : 'text-[#70798C]'
                  }`}
                >
                  Per Year
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
                  House Rent (₦) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#70798C] font-semibold">₦</span>
                  <input
                    type="text"
                    value={formatCurrencyInput(baseRentInput)}
                    onChange={(e) => {
                      setBaseRentInput(e.target.value);
                      if (rentError) setRentError(null);
                    }}
                    placeholder="1,500,000"
                    className={`w-full pl-7 pr-3 py-2 rounded-lg border text-xs text-[#000004] font-semibold focus:outline-none ${
                      rentError ? 'border-rose-500 bg-rose-50/20' : 'border-[#E5E7EB] focus:border-[#342A21]'
                    }`}
                    required
                  />
                </div>
                {rentError && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    {rentError}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs text-[#70798C] block mb-1">
                  Caution Deposit (₦) <span className="text-[11px] text-[#70798C] font-normal">(Optional)</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#70798C] block mb-1">
                  Legal & Agreement Fee (₦) <span className="text-[11px] text-[#70798C] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#70798C] font-semibold">₦</span>
                  <input
                    type="text"
                    value={formatCurrencyInput(legalFeeInput)}
                    onChange={(e) => setLegalFeeInput(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#70798C] block mb-1">
                  Agency Commission (₦) <span className="text-[11px] text-[#70798C] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#70798C] font-semibold">₦</span>
                  <input
                    type="text"
                    value={formatCurrencyInput(agencyFeeInput)}
                    onChange={(e) => setAgencyFeeInput(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#70798C] block mb-1">
                Service Charge / Estate Dues (₦) <span className="text-[11px] text-[#70798C] font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[#70798C] font-semibold">₦</span>
                <input
                  type="text"
                  value={formatCurrencyInput(serviceChargeInput)}
                  onChange={(e) => setServiceChargeInput(e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                />
              </div>
              <p className="text-[11px] text-[#70798C] mt-1">
                Leave optional fields blank or ₦0 if not charged. The system will never spread or invent fees.
              </p>
            </div>

            {/* Computed Move-in Total Live Preview */}
            <div className="p-3.5 rounded-xl bg-[#FCF9F5] border border-[#342A21]/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#70798C] font-semibold">
                  Total Move-in Package
                </span>
                <div className="text-xs text-[#70798C]">
                  {totalMoveIn > 0 
                    ? 'Total amount tenant pays before moving in'
                    : 'Calculated automatically as you enter rent and fees'}
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
                  4. House Photos & Videos
                </h4>
                <p className="text-[11px] text-[#70798C] mt-0.5">
                  Upload clear photos and video walkthrough of the house.
                </p>
              </div>
            </div>

            {/* Validation Alert if agent tries to submit with 0 media */}
            {mediaError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{mediaError}</span>
              </div>
            )}

            {/* Upload Button */}
            <div>
              <label 
                htmlFor="agent-media-files"
                className={`w-full py-3.5 px-4 rounded-xl border-2 border-dashed font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs select-none ${
                  isProcessingMedia 
                    ? 'bg-amber-50/70 border-amber-300 text-amber-900 cursor-wait' 
                    : 'cursor-pointer bg-slate-50 hover:bg-slate-100 border-[#E5E7EB] hover:border-[#000004]/40 text-[#000004] active:scale-[0.99]'
                }`}
              >
                {isProcessingMedia ? (
                  <>
                    <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Optimizing and saving media files...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-[#000004]" />
                    <span>Upload Photos & Walkthrough Videos</span>
                  </>
                )}
                <input
                  id="agent-media-files"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  disabled={isProcessingMedia}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Media Items Grid or Clean Empty Dropzone State */}
            {uploadedMedia.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-[#E5E7EB] bg-[#FCF9F5] text-center space-y-1.5">
                <div className="flex items-center justify-center gap-2 text-[#70798C] mb-1">
                  <Film className="w-5 h-5 text-amber-600" />
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs font-bold text-[#000004]">
                  No photos or videos added yet
                </p>
                <p className="text-[11px] text-[#70798C] max-w-sm mx-auto">
                  Click the upload button above to add clear walkthrough videos and photos of this property from your device.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {uploadedMedia.map((item, i) => (
                  <div 
                    key={item.id || i} 
                    className="relative rounded-lg overflow-hidden border border-[#E5E7EB] aspect-square group bg-slate-950 flex items-center justify-center"
                  >
                    {item.type === 'video' ? (
                      <video
                        src={item.url}
                        poster={item.poster}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      <img 
                        src={item.url} 
                        alt={item.caption || 'preview'} 
                        onError={(e) => { e.currentTarget.src = DEFAULT_FALLBACK_IMAGE; }}
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
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white hover:bg-red-600 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
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
            )}
          </div>

          {/* SECTION 5: INSPECTION RULES */}
          <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#70798C] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#342A21]" />
              5. Inspection Days & Time Slots
            </h4>

            <div>
              <label className="text-xs text-[#70798C] block mb-1.5">
                Days Available for Inspection
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
              <strong>Inspection Hours: </strong>
              10:00 AM – 11:00 AM, 12:00 PM – 1:00 PM, 2:00 PM – 3:00 PM, 4:00 PM – 5:00 PM. Each time slot takes a maximum of 5 house seekers so you don't get crowded or stressed.
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
              className="py-2.5 px-6 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              {isEditing ? 'Save Changes' : 'Publish Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
};
