import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  CheckCircle, 
  MessageCircle, 
  Phone, 
  MapPin, 
  ShieldCheck,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { AdvertStory } from '../../data/mockAdverts';
import { DELTA_CITIES } from '../../data/mockListings';
import { formatNaira } from '../../utils/formatters';

interface PostAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAdvert: (newAd: AdvertStory) => void;
}

export const PostAdModal: React.FC<PostAdModalProps> = ({
  isOpen,
  onClose,
  onAddAdvert,
}) => {
  const [headline, setHeadline] = useState('');
  const [advertiserName, setAdvertiserName] = useState('Delta Heritage Realty');
  const [city, setCity] = useState('Asaba');
  const [neighborhood, setNeighborhood] = useState('');
  const [price, setPrice] = useState('1500000');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('0803 492 8172');
  const [whatsapp, setWhatsapp] = useState('2348034928172');
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly'>('weekly');
  const [uploadedImage, setUploadedImage] = useState('/images/properties/asaba_gra_exterior.jpg');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedImage(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newAd: AdvertStory = {
      id: `ad-user-${Date.now()}`,
      title: headline.slice(0, 14) || `${city} Rental`,
      advertiserName: advertiserName || 'Partner',
      category: 'Property',
      badgeText: selectedPlan === 'monthly' ? 'TOP AD' : 'FEATURED',
      thumbnailUrl: uploadedImage,
      mediaUrl: uploadedImage,
      mediaType: 'image',
      headline: headline || `Premium Rental in ${neighborhood || city}`,
      description: description || `Newly listed verified property in ${neighborhood}, ${city}. Contact directly for inspection clearance.`,
      location: `${neighborhood ? `${neighborhood}, ` : ''}${city}`,
      price: price ? `₦${parseInt(price, 10).toLocaleString()} /yr` : undefined,
      ctaText: 'Chat on WhatsApp',
      whatsappNumber: whatsapp.replace(/\D/g, ''),
      phone,
      isVerified: true,
    };

    onAddAdvert(newAd);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[92vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCF9F5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#000004] text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#000004]">
                Promote Rental Story Advert
              </h3>
              <p className="text-[11px] text-[#70798C]">
                Reach 50,000+ prospective tenants in Delta State
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#70798C] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="font-display text-xl font-bold text-[#000004]">
              Advert Story Live!
            </h4>
            <p className="text-xs text-[#70798C] max-w-xs">
              Your promoted rental story is now active with a verified gradient ring on the home feed.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
            {/* Promo Tier Selection */}
            <div>
              <label className="text-xs font-bold text-[#70798C] uppercase tracking-wider block mb-2">
                1. Select Advert Placement Plan
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlan('weekly')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedPlan === 'weekly'
                      ? 'border-[#000004] bg-[#000004]/5 ring-2 ring-[#000004]/10'
                      : 'border-[#E5E7EB] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#000004] text-xs">7-Day Story</span>
                    <span className="text-[10px] font-semibold text-[#275DAD]">₦5,000</span>
                  </div>
                  <p className="text-[10px] text-[#70798C] mt-1">
                    Featured story tray spot for 1 week
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan('monthly')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedPlan === 'monthly'
                      ? 'border-[#000004] bg-[#000004]/5 ring-2 ring-[#000004]/10'
                      : 'border-[#E5E7EB] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#000004] text-xs">30-Day Top</span>
                    <span className="text-[10px] font-semibold text-emerald-600">₦15,000</span>
                  </div>
                  <p className="text-[10px] text-[#70798C] mt-1">
                    Top placement with verified ring
                  </p>
                </button>
              </div>
            </div>

            {/* Advert Details */}
            <div className="space-y-3 pt-2 border-t border-[#E5E7EB]">
              <label className="text-xs font-bold text-[#70798C] uppercase tracking-wider block">
                2. Advert Information
              </label>

              <div>
                <label className="text-xs text-[#70798C] block mb-1">
                  Advert Headline *
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Last Unit: Serviced 2-Bed Flat in GRA Asaba"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#275DAD]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#70798C] block mb-1">City Hub</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] bg-white focus:outline-none focus:border-[#275DAD]"
                  >
                    {DELTA_CITIES.filter((c) => c !== 'All Delta Cities').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#70798C] block mb-1">Neighborhood</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="e.g. Airport Rd, GRA Phase 2"
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#275DAD]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#70798C] block mb-1">
                  Rent / Price (₦/year)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="1,500,000"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#275DAD]"
                />
              </div>

              <div>
                <label className="text-xs text-[#70798C] block mb-1">
                  Description / Key Features
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mention 24/7 power, borehole water, security, or special discount."
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#275DAD]"
                />
              </div>

              {/* Photo Upload & Preview */}
              <div>
                <label className="text-xs text-[#70798C] block mb-1">
                  Advert Banner Photo
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl border border-[#E5E7EB] overflow-hidden bg-slate-900 shrink-0">
                    <img src={uploadedImage} alt="preview" className="w-full h-full object-cover" />
                  </div>
                  <label className="cursor-pointer px-3 py-2 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-[#000004] flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#275DAD]" />
                    <span>Upload Custom Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Contact for Inquiries */}
            <div className="space-y-3 pt-2 border-t border-[#E5E7EB]">
              <label className="text-xs font-bold text-[#70798C] uppercase tracking-wider block">
                3. Lead Inquiries (WhatsApp / Calls)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#70798C] block mb-1">WhatsApp (Digits with 234)</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="2348034928172"
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#275DAD]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[#70798C] block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0803 492 8172"
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#000004] focus:outline-none focus:border-[#275DAD]"
                  />
                </div>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-3 border-t border-[#E5E7EB]">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#000004] hover:bg-neutral-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <span>
                  Launch Story Advert ({selectedPlan === 'weekly' ? '₦5,000' : '₦15,000'})
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
