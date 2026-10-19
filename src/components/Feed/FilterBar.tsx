import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  MapPin, 
  Home, 
  ChevronDown, 
  X, 
  SlidersHorizontal,
  Check,
  Building,
  Sparkles,
  Search
} from 'lucide-react';
import { DELTA_CITIES, ALL_NIGERIAN_STATES, PROPERTY_TYPES } from '../../data/mockListings';
import { formatNaira } from '../../utils/formatters';
import { AdvertStory } from '../../data/mockAdverts';
import { CustomDropdown, DropdownOption } from '../UI/CustomDropdown';
import { PropertyListing } from '../../types/marketplace';
import { extractPostedLocations } from '../../utils/locationMatcher';

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
  listings?: PropertyListing[];
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
  listings = [],
  adverts,
  onSelectAdvert,
  onOpenPostAd,
  activeStoryId,
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [modalCustomLocation, setModalCustomLocation] = useState('');

  // Extract dynamic areas & neighborhoods posted by agents across listings in chosen state
  const postedAreas = useMemo(() => {
    return extractPostedLocations(listings, selectedState);
  }, [listings, selectedState]);

  // Build combined options list for location dropdown
  const locationDropdownOptions = useMemo(() => {
    const opts: DropdownOption[] = [
      {
        value: 'All Delta Cities',
        label: 'All Delta Cities',
        subtitle: 'Show all properties across Delta State',
      },
    ];

    // If current selectedCity is a custom string not in postedAreas and not in DELTA_CITIES
    const isCustomActive =
      selectedCity &&
      selectedCity !== 'All Delta Cities' &&
      !DELTA_CITIES.includes(selectedCity) &&
      !postedAreas.some((p) => p.name.toLowerCase() === selectedCity.toLowerCase());

    if (isCustomActive) {
      opts.push({
        value: selectedCity,
        label: `"${selectedCity}"`,
        subtitle: 'Custom Location / Word Match',
        badge: 'Custom',
      });
    }

    // Dynamic Agent-Posted Areas
    postedAreas.forEach((area) => {
      opts.push({
        value: area.name,
        label: area.name,
        subtitle: `${area.city} • Active Agent Area`,
        badge: `${area.count} listing${area.count > 1 ? 's' : ''}`,
      });
    });

    // Predefined Standard Cities
    DELTA_CITIES.filter((c) => c !== 'All Delta Cities').forEach((c) => {
      opts.push({
        value: c,
        label: c,
        subtitle: 'Delta LGA / Zone',
      });
    });

    return opts;
  }, [postedAreas, selectedCity]);

  const activeFiltersCount = 
    (selectedCity !== 'All Delta Cities' ? 1 : 0) +
    (selectedType !== 'All Property Types' ? 1 : 0) +
    (maxRent < 5000000 ? 1 : 0);

  const resetFilters = () => {
    onSelectCity('All Delta Cities');
    onSelectType('All Property Types');
    onSelectMaxRent(5000000);
    setModalCustomLocation('');
  };

  const handleApplyModalCustomLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalCustomLocation.trim()) {
      onSelectCity(modalCustomLocation.trim());
      setModalCustomLocation('');
    }
  };

  return (
    <>
      {/* Sub-Header Container docked directly below Header */}
      <div className="fixed top-16 left-0 right-0 z-30 bg-[#FCF9F5]/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-xs flex items-center justify-center">
        {/* Filter Pill Row */}
        <div className="h-11 w-full flex items-center justify-center px-3">
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-white border border-[#E5E7EB] shadow-xs max-w-full">
            {/* City & Area Quick Selector (Dynamic with agent-posted locations & custom entry) */}
            <CustomDropdown
              options={locationDropdownOptions}
              value={selectedCity}
              onChange={onSelectCity}
              onClear={() => onSelectCity('All Delta Cities')}
              headerTitle="Delta State Cities & Areas"
              icon={<MapPin className="w-3.5 h-3.5 text-[#342A21]" />}
              align="left"
              variant="pill"
              allowCustomInput={true}
              customSearchSubtitle="Search listings with this location name or similar words"
            />

            <span className="w-px h-4 bg-[#E5E7EB]" />

            {/* Property Type Quick Selector */}
            <div className="hidden sm:inline-block">
              <CustomDropdown
                options={PROPERTY_TYPES}
                value={selectedType}
                onChange={onSelectType}
                headerTitle="Property Types"
                icon={<Home className="w-3.5 h-3.5 text-[#70798C]" />}
                align="center"
                variant="pill"
              />
            </div>

            {/* More Filters Modal Trigger */}
            <button
              onClick={() => setIsOpenModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#000004] text-white text-xs font-semibold hover:bg-[#1f2937] transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-[#342A21] text-[10px] font-bold flex items-center justify-center">
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
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#70798C] flex items-center justify-center cursor-pointer"
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
                <CustomDropdown
                  options={ALL_NIGERIAN_STATES}
                  value={selectedState}
                  onChange={onSelectState}
                  headerTitle="Select Nigerian State"
                  icon={<Building className="w-3.5 h-3.5 text-[#342A21]" />}
                  variant="form"
                />
                <p className="text-[11px] text-[#342A21] mt-1">
                  Delta State is the active launch market with live inspection queues.
                </p>
              </div>

              {/* Custom Location / Specific Neighborhood Search Box */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#70798C] block mb-1.5">
                  Search Any Location / Landmark
                </label>
                <form onSubmit={handleApplyModalCustomLocation} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-[#70798C] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Airport Road, GRA Phase 2, DELSU, Amukpe..."
                      value={modalCustomLocation}
                      onChange={(e) => setModalCustomLocation(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E5E7EB] bg-slate-50 text-xs text-[#000004] placeholder:text-[#70798C] outline-none focus:border-[#342A21] focus:bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!modalCustomLocation.trim()}
                    className="px-3 py-2 bg-[#342A21] disabled:opacity-40 text-white rounded-xl text-xs font-bold hover:bg-[#251E17] cursor-pointer"
                  >
                    Set Area
                  </button>
                </form>
                {selectedCity !== 'All Delta Cities' && (
                  <div className="mt-2 flex items-center justify-between bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs text-amber-900 font-medium truncate">
                      <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="truncate">Active Filter: <strong>{selectedCity}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectCity('All Delta Cities')}
                      className="text-[10px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer shrink-0 ml-2"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Dynamic Agent-Posted Active Neighborhoods */}
              {postedAreas.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <label className="text-xs font-bold uppercase tracking-wider text-[#70798C]">
                      Agent-Posted Areas in Delta
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {postedAreas.map((area) => {
                      const isSelected = selectedCity.toLowerCase() === area.name.toLowerCase();
                      return (
                        <button
                          key={area.name}
                          type="button"
                          onClick={() => onSelectCity(area.name)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-[#342A21] text-white shadow-xs font-bold'
                              : 'bg-amber-50/70 text-amber-900 border border-amber-200/60 hover:bg-amber-100 hover:border-amber-300'
                          }`}
                        >
                          <span className="truncate">{area.name}</span>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-amber-200/60 text-amber-800'
                          }`}>
                            {area.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Standard Delta Cities Pills */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#70798C] block mb-2">
                  Standard Delta Cities & LGAs
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DELTA_CITIES.map((c) => {
                    const isSelected = selectedCity === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onSelectCity(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
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
                        className={`p-2 rounded-lg text-xs text-left border transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#342A21]/10 border-[#342A21] text-[#342A21] font-semibold'
                            : 'bg-white border-[#E5E7EB] text-[#70798C] hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{t}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#342A21]" />}
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
                  className="w-full accent-[#342A21] cursor-pointer"
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
