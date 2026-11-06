import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  MapPin, 
  Image as ImageIcon, 
  Film, 
  Plus, 
  Minus,
  Clock,
  Trash2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown
} from 'lucide-react';
import { PropertyListing, DeltaCity, PropertyType, NigerianState, UserProfile } from '../../types/marketplace';
import { formatNaira, formatCurrencyInput, parseCurrencyInput } from '../../utils/formatters';
import { CustomDropdown, DropdownOption } from '../UI/CustomDropdown';
import { DELTA_CITY_OPTIONS } from '../../data/deltaCities';
import { processUploadedFile, DEFAULT_FALLBACK_IMAGE } from '../../utils/mediaStorage';
import { ModalPortal } from '../UI/ModalPortal';

const NIGERIAN_STATE_OPTIONS: DropdownOption[] = [
  { value: 'Delta State', label: 'Delta State' },
  { value: 'Edo State', label: 'Edo State', badge: 'Soon', disabled: true },
  { value: 'Rivers State', label: 'Rivers State', badge: 'Soon', disabled: true },
  { value: 'Lagos State', label: 'Lagos State', badge: 'Soon', disabled: true },
  { value: 'Abuja (FCT)', label: 'Abuja (FCT)', badge: 'Soon', disabled: true },
];

const PROPERTY_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'Self-contain', label: 'Self-contain' },
  { value: 'Single Room', label: 'Single Room' },
  { value: 'Bedseater', label: 'Bedseater' },
  { value: '2-Bedroom Flat', label: '2-Bedroom Flat' },
  { value: '3-Bedroom Flat', label: '3-Bedroom Flat' },
  { value: 'Duplex / Semi-Detached', label: 'Duplex / Whole House' },
];

const SUGGESTED_ADDONS: string[] = [
  '33KVA Light',
  'Solar / Inverter',
  'Prepaid Meter',
  'Clean Water',
  'Estate Security',
  'POP Ceiling',
  'Water Heater',
  'WiFi',
  'Parking',
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
  const initialCity = ((currentUser?.operatingCity || currentUser?.city || 'Asaba') as DeltaCity);

  const [step, setStep] = useState<1 | 2 | 3>(1);
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

  // Cost inputs
  const [baseRentInput, setBaseRentInput] = useState('');
  const [cautionFeeInput, setCautionFeeInput] = useState('');
  const [legalFeeInput, setLegalFeeInput] = useState('');
  const [agencyFeeInput, setAgencyFeeInput] = useState('');
  const [serviceChargeInput, setServiceChargeInput] = useState('');
  const [inspectionFeeInput, setInspectionFeeInput] = useState('');
  const [showOptionalFees, setShowOptionalFees] = useState(false);

  // Amenities
  const [addons, setAddons] = useState<string[]>([]);
  const [addonInput, setAddonInput] = useState('');

  // Media
  const [uploadedMedia, setUploadedMedia] = useState<MediaItemDraft[]>([]);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [rentError, setRentError] = useState<string | null>(null);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // Inspection Window Rules
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Wed', 'Fri', 'Sat']);
  const [timeSlots, setTimeSlots] = useState<string[]>([
    '10:00 AM – 11:00 AM',
    '12:00 PM – 1:00 PM',
    '2:00 PM – 3:00 PM',
    '4:00 PM – 5:00 PM'
  ]);

  React.useEffect(() => {
    if (initialListing) {
      setStep(1);
      setTitle(initialListing.title || '');
      setSelectedState(initialListing.state || 'Delta State');
      setCity(initialListing.city || initialCity);
      setNeighborhood(initialListing.neighborhood || '');
      setPropertyType(initialListing.propertyType || '2-Bedroom Flat');
      setBedrooms(initialListing.bedrooms || 2);
      setBathrooms(initialListing.bathrooms || 2);
      setRentPeriod(initialListing.fees?.rentPeriod || 'per annum');
      setBaseRentInput(formatCurrencyInput(String(initialListing.fees?.baseRent || '')));
      const cautionVal = initialListing.fees?.cautionFee || 0;
      const legalVal =
        initialListing.fees?.legalFee !== undefined
          ? initialListing.fees.legalFee
          : initialListing.fees?.legalAndAgencyFee
            ? Math.round(initialListing.fees.legalAndAgencyFee / 2)
            : 0;
      const agencyVal =
        initialListing.fees?.agencyFee !== undefined
          ? initialListing.fees.agencyFee
          : initialListing.fees?.legalAndAgencyFee
            ? initialListing.fees.legalAndAgencyFee - Math.round(initialListing.fees.legalAndAgencyFee / 2)
            : 0;
      const serviceVal = initialListing.fees?.serviceCharge || 0;

      setCautionFeeInput(formatCurrencyInput(String(cautionVal || '')));
      setLegalFeeInput(formatCurrencyInput(String(legalVal || '')));
      setAgencyFeeInput(formatCurrencyInput(String(agencyVal || '')));
      setServiceChargeInput(formatCurrencyInput(String(serviceVal || '')));
      setInspectionFeeInput(formatCurrencyInput(String(initialListing.inspectionFee || '')));
      setShowOptionalFees(Boolean(cautionVal || legalVal || agencyVal || serviceVal));
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
      setStep(1);
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
      setShowOptionalFees(false);
      setAddons([]);
      setUploadedMedia([]);
      setStep1Error(null);
      setRentError(null);
      setMediaError(null);
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

  const baseRentNum = parseCurrencyInput(baseRentInput);
  const cautionNum = parseCurrencyInput(cautionFeeInput);
  const legalFeeNum = parseCurrencyInput(legalFeeInput);
  const agencyFeeNum = parseCurrencyInput(agencyFeeInput);
  const serviceChargeNum = parseCurrencyInput(serviceChargeInput);
  const inspectionFeeNum = parseCurrencyInput(inspectionFeeInput) || 2500;
  const totalMoveIn = baseRentNum + cautionNum + legalFeeNum + agencyFeeNum + serviceChargeNum;

  const handleToggleAddon = (item: string) => {
    setAddons((prev) => {
      const exists = prev.some((a) => a.toLowerCase() === item.toLowerCase());
      if (exists) {
        return prev.filter((a) => a.toLowerCase() !== item.toLowerCase());
      }
      return [...prev, item];
    });
  };

  const handleAddCustomAddon = () => {
    const trimmed = addonInput.trim();
    if (!trimmed) return;
    if (!addons.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setAddons((prev) => [...prev, trimmed]);
    }
    setAddonInput('');
  };

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

  const handleNextStep = () => {
    if (step === 1) {
      if (!neighborhood.trim()) {
        setStep1Error('Please enter the area or neighborhood.');
        return;
      }
      setStep1Error(null);
      setStep(2);
    } else if (step === 2) {
      if (!baseRentNum || baseRentNum <= 0) {
        setRentError('Please enter a valid house rent amount.');
        return;
      }
      setRentError(null);
      setStep(3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!neighborhood.trim()) {
      setStep1Error('Please enter the area or neighborhood.');
      setStep(1);
      return;
    }

    if (!baseRentNum || baseRentNum <= 0) {
      setRentError('Please enter a valid house rent amount.');
      setStep(2);
      return;
    }
    setRentError(null);

    if (uploadedMedia.length === 0) {
      setMediaError('Please upload at least 1 photo or video of the property.');
      setStep(3);
      return;
    }

    const finalTitle = title.trim() || `${propertyType} in ${neighborhood.trim() || city}`;

    if (isEditing && initialListing) {
      const updatedListing: PropertyListing = {
        ...initialListing,
        title: finalTitle,
        state: selectedState,
        city,
        neighborhood: neighborhood.trim() || 'Central Residential District',
        fullAddress: `${neighborhood.trim() ? `${neighborhood.trim()}, ` : ''}${city}, ${selectedState}`,
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
        tags: [city, neighborhood.trim() || 'Residential', 'Direct Agent', ...addons],
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
      title: finalTitle,
      state: selectedState,
      city,
      neighborhood: neighborhood.trim() || 'Central Residential District',
      fullAddress: `${neighborhood.trim() ? `${neighborhood.trim()}, ` : ''}${city}, ${selectedState}`,
      propertyType,
      bedrooms,
      bathrooms,
      toilets: bathrooms + 1,
      isServiced: serviceChargeNum > 0,
      isFurnished: false,
      electricityStatus: undefined,
      waterSupply: undefined,
      description: `Verified ${propertyType.toLowerCase()} in ${neighborhood.trim()}, ${city}.`,
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
        avatarUrl: currentUser?.avatarUrl && !currentUser.avatarUrl.includes('/images/properties/') && !currentUser.avatarUrl.includes('images.unsplash.com')
          ? currentUser.avatarUrl
          : '',
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
      tags: [city, neighborhood.trim() || 'Residential', 'Direct Agent', ...addons],
      addons: addons.length > 0 ? addons : undefined,
      createdAt: new Date().toISOString(),
    };

    onListingCreated(newListing);
    onClose();
  };

  // Combine default pills + any custom addons the agent typed
  const allAddonOptions = Array.from(new Set([...SUGGESTED_ADDONS, ...addons]));

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Compact Header + 3-Step Tab Bar */}
          <div className="px-4 pt-4 pb-3 sm:px-5 border-b border-[#E5E7EB] bg-[#FCF9F5] shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-[#342A21]/10 text-[#342A21] text-[10px] font-bold uppercase tracking-wider">
                  {isEditing ? 'Edit Listing' : 'Agent Portal'}
                </span>
                <h3 className="font-display text-lg font-bold text-[#000004] mt-0.5">
                  {isEditing ? 'Update Property' : 'Add New Property'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white hover:bg-[#F4F5F7] border border-[#E5E7EB] text-[#70798C] hover:text-[#000004] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Pills */}
            <div className="grid grid-cols-3 gap-1.5 mt-3">
              {[
                { num: 1 as const, label: '1. Details' },
                { num: 2 as const, label: '2. Rent' },
                { num: 3 as const, label: '3. Media' },
              ].map((s) => {
                const isActive = step === s.num;
                const isDone = step > s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => {
                      if (s.num < step || isEditing) setStep(s.num);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#342A21] text-[#FCF9F5] shadow-2xs'
                        : isDone
                        ? 'bg-[#F6F3EF] text-[#342A21] border border-[#342A21]/20'
                        : 'bg-white text-[#70798C] border border-[#E5E7EB]'
                    }`}
                  >
                    {isDone && <Check className="w-3 h-3 shrink-0" />}
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Step Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
            {/* ============================================================ */}
            {/* STEP 1: LOCATION & PROPERTY SPECS                            */}
            {/* ============================================================ */}
            {step === 1 && (
              <div className="space-y-3.5 animate-fade-in">
                {step1Error && (
                  <div className="p-2.5 rounded-xl bg-[#FEECEB] border border-[#F0544F]/30 text-[#F0544F] text-[11px] font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{step1Error}</span>
                  </div>
                )}

                {/* State & City */}
                <div className="grid grid-cols-2 gap-2.5 relative z-30">
                  <div className="min-w-0">
                    <label className="text-[11px] font-semibold text-[#70798C] block mb-1">State</label>
                    <CustomDropdown
                      options={NIGERIAN_STATE_OPTIONS}
                      value={selectedState}
                      onChange={(val) => setSelectedState(val as NigerianState)}
                      headerTitle="Select State"
                      variant="form"
                      allowCustomInput={false}
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="text-[11px] font-semibold text-[#70798C] block mb-1">City / Town</label>
                    <CustomDropdown
                      options={DELTA_CITY_OPTIONS}
                      value={city}
                      onChange={(val) => setCity(val as DeltaCity)}
                      headerTitle="Select City"
                      placeholder="Select City"
                      variant="form"
                      allowCustomInput={true}
                      customSearchSubtitle="Type city or town"
                    />
                  </div>
                </div>

                {/* Area / Neighborhood */}
                <div>
                  <label className="text-[11px] font-semibold text-[#70798C] block mb-1">
                    Area / Street Landmark *
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-[#70798C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => {
                        setNeighborhood(e.target.value);
                        if (step1Error) setStep1Error(null);
                      }}
                      placeholder="e.g. GRA Phase 2, Okpanam Road, Okuisoko"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#000004] font-medium focus:outline-none focus:border-[#342A21]"
                      required
                    />
                  </div>
                </div>

                {/* Property Title */}
                <div>
                  <label className="text-[11px] font-semibold text-[#70798C] block mb-1">
                    Property Title <span className="font-normal text-[#70798C]">(Optional — auto-generated if blank)</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Newly Built 2-Bedroom Flat off Jakpa Road"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#000004] font-medium focus:outline-none focus:border-[#342A21]"
                  />
                </div>

                {/* House Type (Full width on mobile so dropdown never clips!) */}
                <div className="relative z-20">
                  <label className="text-[11px] font-semibold text-[#70798C] block mb-1">House Type</label>
                  <CustomDropdown
                    options={PROPERTY_TYPE_OPTIONS}
                    value={propertyType}
                    onChange={(val) => setPropertyType(val as PropertyType)}
                    headerTitle="Select House Type"
                    variant="form"
                    allowCustomInput={false}
                  />
                </div>

                {/* Bedrooms & Bathrooms Steppers (Clean 2-Column Row) */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="min-w-0 overflow-hidden p-2 sm:p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5]/60 flex items-center justify-between gap-1.5">
                    <span className="text-[11px] sm:text-xs font-semibold text-[#000004] truncate">Bedrooms</span>
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setBedrooms((b) => Math.max(1, b - 1))}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#342A21] text-[#000004] flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-3.5 sm:w-4 text-center font-bold text-[11px] sm:text-xs text-[#000004]">{bedrooms}</span>
                      <button
                        type="button"
                        onClick={() => setBedrooms((b) => Math.min(10, b + 1))}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#342A21] text-[#000004] flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="min-w-0 overflow-hidden p-2 sm:p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5]/60 flex items-center justify-between gap-1.5">
                    <span className="text-[11px] sm:text-xs font-semibold text-[#000004] truncate">Bathrooms</span>
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setBathrooms((b) => Math.max(1, b - 1))}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#342A21] text-[#000004] flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-3.5 sm:w-4 text-center font-bold text-[11px] sm:text-xs text-[#000004]">{bathrooms}</span>
                      <button
                        type="button"
                        onClick={() => setBathrooms((b) => Math.min(10, b + 1))}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#342A21] text-[#000004] flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 1-Tap Amenities Toggle Chips */}
                <div className="pt-2 border-t border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-semibold text-[#70798C]">
                      Key Amenities <span className="font-normal">(Tap to select)</span>
                    </label>
                    {addons.length > 0 && (
                      <span className="text-[10px] font-bold text-[#342A21]">
                        {addons.length} selected
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {allAddonOptions.map((item) => {
                      const isSelected = addons.some((a) => a.toLowerCase() === item.toLowerCase());
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleToggleAddon(item)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-[#342A21] border-[#342A21] text-[#FCF9F5] shadow-2xs'
                              : 'bg-[#FCF9F5] border-[#E5E7EB] text-[#000004] hover:border-[#342A21]/40'
                          }`}
                        >
                          {isSelected ? <Check className="w-3 h-3 shrink-0" /> : <Plus className="w-3 h-3 text-[#70798C] shrink-0" />}
                          <span>{item}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Compact Custom Addon Input */}
                  <div className="flex items-center gap-1.5 mt-2">
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
                      placeholder="Add custom feature (e.g. Starlink, Boys Quarters)..."
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-[11px] text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomAddon}
                      disabled={!addonInput.trim()}
                      className="px-3 py-1.5 rounded-xl bg-[#F6F3EF] hover:bg-[#342A21] text-[#342A21] hover:text-[#FCF9F5] disabled:opacity-40 text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 2: RENT & MOVE-IN FEES                                  */}
            {/* ============================================================ */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#000004]">
                    Base Rent Amount (₦) *
                  </label>
                  <div className="flex items-center gap-1 bg-[#FCF9F5] p-1 rounded-xl border border-[#E5E7EB]">
                    <button
                      type="button"
                      onClick={() => setRentPeriod('per annum')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        rentPeriod === 'per annum' ? 'bg-[#342A21] text-[#FCF9F5]' : 'text-[#70798C]'
                      }`}
                    >
                      Per Year
                    </button>
                    <button
                      type="button"
                      onClick={() => setRentPeriod('per month')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        rentPeriod === 'per month' ? 'bg-[#342A21] text-[#FCF9F5]' : 'text-[#70798C]'
                      }`}
                    >
                      Per Month
                    </button>
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70798C] font-bold text-sm">₦</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      value={formatCurrencyInput(baseRentInput)}
                      onChange={(e) => {
                        setBaseRentInput(e.target.value);
                        if (rentError) setRentError(null);
                      }}
                      placeholder="1,500,000"
                      className={`w-full pl-8 pr-4 py-3 rounded-xl border text-sm text-[#000004] font-bold focus:outline-none ${
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

                {/* Collapsible Optional Fees Toggle */}
                <div className="rounded-2xl border border-[#E5E7EB] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowOptionalFees(!showOptionalFees)}
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F5] hover:bg-[#F6F3EF] flex items-center justify-between text-xs font-bold text-[#342A21] transition-colors cursor-pointer"
                  >
                    <span>Optional Fees (Caution, Legal, Agency, Service)</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showOptionalFees ? 'rotate-180' : ''}`} />
                  </button>

                  {showOptionalFees && (
                    <div className="p-3.5 bg-white border-t border-[#E5E7EB] grid grid-cols-2 gap-2.5 animate-fade-in">
                      <div>
                        <label className="text-[11px] font-semibold text-[#70798C] block mb-1">Caution Fee (₦)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatCurrencyInput(cautionFeeInput)}
                          onChange={(e) => setCautionFeeInput(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#70798C] block mb-1">Legal Fee (₦)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatCurrencyInput(legalFeeInput)}
                          onChange={(e) => setLegalFeeInput(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#70798C] block mb-1">Agency Fee (₦)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatCurrencyInput(agencyFeeInput)}
                          onChange={(e) => setAgencyFeeInput(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#70798C] block mb-1">Service Charge (₦)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatCurrencyInput(serviceChargeInput)}
                          onChange={(e) => setServiceChargeInput(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Move-in Total Card */}
                <div className="p-3.5 rounded-2xl bg-[#FCF9F5] border border-[#342A21]/20 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#70798C] font-bold">
                      Total Move-In Package
                    </span>
                    <div className="text-[11px] text-[#70798C]">
                      Rent + any optional fees entered above
                    </div>
                  </div>
                  <div className="font-display text-lg sm:text-xl font-bold text-[#000004]">
                    {formatNaira(totalMoveIn)}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 3: PHOTOS / VIDEOS & INSPECTION DAYS                    */}
            {/* ============================================================ */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                {mediaError && (
                  <div className="p-2.5 rounded-xl bg-[#FEECEB] border border-[#F0544F]/30 text-[#F0544F] text-[11px] font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{mediaError}</span>
                  </div>
                )}

                {/* Unified Dropzone Card */}
                <label
                  htmlFor="agent-media-files"
                  className={`block p-5 rounded-2xl border-2 border-dashed text-center transition-all select-none ${
                    isProcessingMedia
                      ? 'bg-[#FCF9F5] border-[#342A21]/40 text-[#342A21] cursor-wait'
                      : 'cursor-pointer bg-[#FCF9F5] hover:bg-[#F6F3EF] border-[#342A21]/25 hover:border-[#342A21] text-[#000004]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center mx-auto mb-2 shadow-2xs">
                    {isProcessingMedia ? (
                      <div className="w-4 h-4 border-2 border-[#342A21] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-[#342A21]" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-[#000004]">
                    {isProcessingMedia ? 'Optimizing media files...' : 'Tap to Upload Photos or Video Walkthrough'}
                  </div>
                  <div className="text-[11px] text-[#70798C] mt-0.5">
                    {uploadedMedia.length > 0
                      ? `${uploadedMedia.length} file${uploadedMedia.length > 1 ? 's' : ''} added • Tap to add more`
                      : 'Supports JPG, PNG, MP4'}
                  </div>
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

                {/* Uploaded Media Thumbnails */}
                {uploadedMedia.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {uploadedMedia.map((item, i) => (
                      <div
                        key={item.id || i}
                        className="relative rounded-xl overflow-hidden border border-[#E5E7EB] aspect-square bg-slate-950"
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
                        <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                          {item.type === 'video' ? <Film className="w-2.5 h-2.5" /> : <ImageIcon className="w-2.5 h-2.5" />}
                          <span>{item.type === 'video' ? 'Video' : 'Photo'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(item.id)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white hover:bg-rose-600 flex items-center justify-center cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inspection Days */}
                <div className="pt-2 border-t border-[#E5E7EB] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#000004] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#342A21]" />
                      <span>Available Inspection Days</span>
                    </label>
                    <span className="text-[10px] text-[#70798C] font-medium">
                      10 AM – 5 PM
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                      const isChecked = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`py-2 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                            isChecked
                              ? 'bg-[#342A21] text-[#FCF9F5] shadow-2xs'
                              : 'bg-[#FCF9F5] text-[#70798C] border border-[#E5E7EB]'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Pinned Bottom Navigation Footer */}
            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between gap-2">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                  className="py-2.5 px-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#FCF9F5] text-[#000004] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-[#70798C] hover:text-[#000004] cursor-pointer"
                >
                  Cancel
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 sm:flex-initial py-2.5 px-6 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isProcessingMedia}
                  className="flex-1 sm:flex-initial py-2.5 px-6 rounded-xl bg-[#342A21] hover:bg-[#231C16] disabled:opacity-50 text-[#FCF9F5] text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Save Changes' : 'Publish Property'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
