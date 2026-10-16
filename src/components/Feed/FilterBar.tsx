import React, { useState } from 'react';
import { 
  Filter, 
  MapPin, 
  Home, 
  ChevronDown, 
  X, 
  SlidersHorizontal,
  Check,
  Building
} from 'lucide-react';
import { DELTA_CITIES, ALL_NIGERIAN_STATES, PROPERTY_TYPES } from '../../data/mockListings';
import { formatNaira } from '../../utils/formatters';
import { AdvertStory } from '../../data/mockAdverts';
import { AdvertStoriesTray } from './AdvertStoriesTray';

interface FilterBarProps {
  selectedCity: string;
  onSelectCity: (city: string) => void;
  selectedType: string;
  onSelectType: (type: string) => void;
  selectedState: string;
  onSelectState: (state: string) => void;
  maxRent: number;
  onSelectMaxRent: (val: number) => void;
  totalFiltered: number;
  adverts?: AdvertStory[];
  onSelectAdvert?: (ad: AdvertStory) => void;
  onOpenPostAd?: () => void;
  activeStoryId?: string | null;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCity,
  onSelectCity,
  selectedType,
  onSelectType,
  selectedState,
  onSelectState,
  maxRent,
  onSelectMaxRent,
  totalFiltered,
  adverts,
  onSelectAdvert,
  onOpenPostAd,
  activeStoryId,
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);

  const activeFiltersCount = 
    (selectedCity !== 'All Delta Cities' ? 1 : 0) +
    (selectedType !== 'All Property Types' ? 1 : 0) +
    (maxRent < 5000000 ? 1 : 0);

  const resetFilters = () => {
    onSelectCity('All Delta Cities');
    onSelectType('All Property Types');
    onSelectMaxRent(5000000);
  };

  return (
    <>
      {/* Sub-Header Container docked directly below Header */}
      <div className="fixed top-16 left-0 right-0 z-30 bg-[#FCF9F5]/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-xs flex flex-col items-center">
        {/* Advert Stories Tray (Squared with Rounded Edges) on top of the FilterBar - ONLY ON MOBILE (< lg) */}
        {adverts && onSelectAdvert && onOpenPostAd && (
          <div className="w-full lg:hidden">
            <AdvertStoriesTray
              adverts={adverts}
              onSelectAdvert={onSelectAdvert}
              onOpenPostAd={onOpenPostAd}
              activeStoryId={activeStoryId}
            />
          </div>
        )}

        {/* Filter Pill Row (Screenshot 2 layer) */}
        <div className="h-11 w-full flex items-center justify-center px-3 border-t border-[#E5E7EB]/50 lg:border-t-0">
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-white border border-[#E5E7EB] shadow-xs max-w-full">
          {/* City Quick Selector */}
        <select
          value={selectedCity}
          onChange={(e) => onSelectCity(e.target.value)}
          className="bg-transparent text-xs font-semibold text-[#000004] py-1.5 pl-2.5 pr-6 rounded-full cursor-pointer focus:outline-none appearance-none hover:bg-slate-100/50"
          style={{
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23275DAD' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.35rem center',
            backgroundSize: '0.85em',
          }}
        >
          {DELTA_CITIES.map((city) => (
            <option key={city} value={city} className="text-black">
              {city}
            </option>
          ))}
        </select>

        <span className="w-px h-4 bg-[#E5E7EB]" />

        {/* Property Type Quick Selector */}
        <select
          value={selectedType}
          onChange={(e) => onSelectType(e.target.value)}
          className="bg-transparent text-xs font-medium text-[#70798C] py-1.5 pl-2 pr-6 rounded-full cursor-pointer focus:outline-none appearance-none hover:bg-slate-100/50 hidden sm:inline-block"
          style={{
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2370798C' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.35rem center',
            backgroundSize: '0.85em',
          }}
        >
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t} className="text-black">
              {t}
            </option>
          ))}
        </select>

        {/* More Filters Modal Trigger */}
        <button
          onClick={() => setIsOpenModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#000004] text-white text-xs font-semibold hover:bg-[#1f2937] transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filter</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-white text-[#275DAD] text-[10px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
        </div>
      </div>
    </div>

      {/* Expanded Filter Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FCF9F5]">
              <div>
                <h3 className="font-display text-lg font-bold text-[#000004]">
                  Refine Rental Search
                </h3>
                <p className="text-xs text-[#70798C]">
                  {totalFiltered} listings match current parameters
                </p>
              </div>
              <button
                onClick={() => setIsOpenModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#70798C] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Nigerian State Selector (Expansion Pattern) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#70798C] block mb-1.5">
                  Target Nigerian State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => onSelectState(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#000004] bg-white focus:outline-none focus:border-[#275DAD]"
                >
                  {ALL_NIGERIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#275DAD] mt-1">
                  Delta State is the active launch market with live inspection queues.
                </p>
              </div>

              {/* Delta Cities Pills */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#70798C] block mb-2">
                  Delta City / LGA Zone
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DELTA_CITIES.map((c) => {
                    const isSelected = selectedCity === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onSelectCity(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-[#000004] text-white shadow-xs font-semibold'
                            : 'bg-[#FCF9F5] text-[#70798C] border border-[#E5E7EB] hover:text-[#000004]'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Property Types */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#70798C] block mb-2">
                  Property Configuration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PROPERTY_TYPES.map((t) => {
                    const isSelected = selectedType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onSelectType(t)}
                        className={`p-2 rounded-lg text-xs text-left border transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50/40 border-[#275DAD] text-[#275DAD] font-semibold'
                            : 'bg-white border-[#E5E7EB] text-[#70798C] hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{t}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#275DAD]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Max Rent Price Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#70798C]">
                    Maximum Annual Rent
                  </label>
                  <span className="font-display text-sm font-bold text-[#000004]">
                    {formatNaira(maxRent)}
                  </span>
                </div>
                <input
                  type="range"
                  min={300000}
                  max={5000000}
                  step={100000}
                  value={maxRent}
                  onChange={(e) => onSelectMaxRent(parseInt(e.target.value, 10))}
                  className="w-full accent-[#275DAD] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#70798C] mt-1">
                  <span>₦300,000 (Student self-contain)</span>
                  <span>₦5,000,000 (Executive Duplex)</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E5E7EB] bg-[#FCF9F5] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-[#70798C] hover:text-[#000004]"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="py-2.5 px-5 rounded-lg bg-[#000004] text-white text-xs font-bold hover:bg-[#1f2937] shadow-xs"
              >
                Apply Filters ({totalFiltered} Available)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
