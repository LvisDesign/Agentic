import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Filter, 
  MapPin, 
  Home, 
  ChevronDown, 
  X, 
  SlidersHorizontal,
  Check,
  Building,
  Search,
  User,
  Building2
} from 'lucide-react';
import { DELTA_CITIES, ALL_NIGERIAN_STATES, PROPERTY_TYPES } from '../../data/mockListings';
import { DELTA_ALL_TOWNS } from '../../data/deltaCities';
import { formatNaira } from '../../utils/formatters';
import { AdvertStory } from '../../data/mockAdverts';
import { CustomDropdown, DropdownOption } from '../UI/CustomDropdown';
import { PropertyListing } from '../../types/marketplace';
import { extractPostedLocations } from '../../utils/locationMatcher';
import { ModalPortal } from '../UI/ModalPortal';
import { getRegisteredUsers } from '../../utils/userRegistry';

interface FilterBarProps {
  selectedCity: string;
  onSelectCity: (city: string) => void;
  selectedType: string;
  onSelectType: (type: string) => void;
  selectedState: string;
  onSelectState: (state: string) => void;
  maxRent: number;
  onSelectMaxRent: (val: number) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
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
  searchQuery = '',
  onSearchChange,
  totalFiltered,
  listings = [],
  adverts,
  onSelectAdvert,
  onOpenPostAd,
  activeStoryId,
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [modalCustomLocation, setModalCustomLocation] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSearchExpanded) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchExpanded]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    if (!isSearchExpanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchExpanded]);

  // Build searchable directory of unique users/agents (from listings + registered users)
  const searchableUsers = useMemo(() => {
    const map = new Map<string, {
      id: string;
      fullName: string;
      agencyName: string;
      city: string;
      avatarUrl?: string;
      listingCount: number;
      isAgent: boolean;
    }>();

    listings.forEach((l) => {
      if (!l.agent) return;
      const key = (l.agent.agencyName || l.agent.fullName || l.agent.id || '').toLowerCase().trim();
      if (!key) return;
      const existing = map.get(key);
      if (existing) {
        existing.listingCount += 1;
      } else {
        map.set(key, {
          id: l.agent.id,
          fullName: l.agent.fullName || l.agent.agencyName || 'Verified Agent',
          agencyName: l.agent.agencyName || l.agent.fullName || 'Partner Agent',
          city: l.city || 'Delta State',
          avatarUrl: l.agent.avatarUrl,
          listingCount: 1,
          isAgent: true,
        });
      }
    });

    try {
      const regUsers = getRegisteredUsers();
      regUsers.forEach((u) => {
        if (!u || !u.fullName || u.id === 'GUEST_USER') return;
        const key = (u.agencyName || u.fullName || u.id).toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, {
            id: u.id,
            fullName: u.fullName,
            agencyName: u.agencyName || (u.isAgent ? 'Partner Agent' : 'Setlla Member'),
            city: u.operatingCity || u.city || 'Delta State',
            avatarUrl: u.avatarUrl,
            listingCount: 0,
            isAgent: Boolean(u.isAgent),
          });
        }
      });
    } catch (_) {}

    return Array.from(map.values());
  }, [listings]);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const matchingUsers = useMemo(() => {
    if (!trimmedQuery) return searchableUsers.slice(0, 4);
    return searchableUsers
      .filter(
        (u) =>
          u.fullName.toLowerCase().includes(trimmedQuery) ||
          u.agencyName.toLowerCase().includes(trimmedQuery) ||
          u.city.toLowerCase().includes(trimmedQuery)
      )
      .slice(0, 5);
  }, [searchableUsers, trimmedQuery]);

  const matchingListings = useMemo(() => {
    if (!trimmedQuery) return listings.slice(0, 4);
    return listings
      .filter((l) => {
        const agentName = (l.agent?.fullName || '').toLowerCase();
        const agencyName = (l.agent?.agencyName || '').toLowerCase();
        return (
          l.title.toLowerCase().includes(trimmedQuery) ||
          l.propertyType.toLowerCase().includes(trimmedQuery) ||
          l.city.toLowerCase().includes(trimmedQuery) ||
          l.neighborhood.toLowerCase().includes(trimmedQuery) ||
          l.description.toLowerCase().includes(trimmedQuery) ||
          agentName.includes(trimmedQuery) ||
          agencyName.includes(trimmedQuery) ||
          (l.tags || []).some((t) => t.toLowerCase().includes(trimmedQuery))
        );
      })
      .slice(0, 6);
  }, [listings, trimmedQuery]);

  // Extract dynamic areas & neighborhoods posted by agents across listings in chosen state
  const postedAreas = useMemo(() => {
    return extractPostedLocations(listings, selectedState);
  }, [listings, selectedState]);

  // Build combined options list for location dropdown
  const locationDropdownOptions = useMemo(() => {
    const opts: DropdownOption[] = [
      {
        value: 'All Delta Cities',
        label: 'All Cities',
        subtitle: 'Show all properties across all locations',
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

    // Predefined Standard Cities & Towns
    DELTA_ALL_TOWNS.forEach((town) => {
      opts.push({
        value: town.value,
        label: town.label,
        subtitle: town.subtitle,
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
    onSearchChange?.('');
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
      <div
        ref={searchContainerRef}
        className="fixed top-16 left-0 right-0 z-30 bg-gradient-to-r from-[#FCF9F5]/95 via-[#FFFDF9]/95 to-[#FFF9EB]/95 backdrop-blur-md border-b border-[#EFE3C6] shadow-xs flex flex-col items-center justify-center"
      >
        {/* Filter Pill Row */}
        <div className="h-11 w-full flex items-center justify-center px-3 relative">
          {isSearchExpanded ? (
            /* Expanded Search Input Pill */
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#FFAD05]/60 ring-2 ring-[#FFAD05]/15 shadow-sm w-full max-w-md transition-all">
              <Search className="w-3.5 h-3.5 text-[#C68400] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    setIsSearchExpanded(false);
                  }
                }}
                placeholder="Search user, agent, or listing..."
                className="flex-1 bg-transparent text-xs text-[#000004] placeholder:text-[#70798C] outline-none min-w-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange?.('');
                    searchInputRef.current?.focus();
                  }}
                  className="px-1.5 py-0.5 rounded-full bg-[#FFF8E6] hover:bg-[#FFEFCA] text-[10px] font-bold text-[#342A21] border border-[#F0D9A0] transition-colors cursor-pointer shrink-0"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsSearchExpanded(false)}
                aria-label="Close search"
                className="w-6 h-6 rounded-full bg-[#FFF9EB] hover:bg-[#FFEFCA] text-[#342A21] border border-[#EDDAA6] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Default Filter Pill with Search Icon */
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-gradient-to-r from-white via-[#FFFDF8] to-[#FFF6DF] border border-[#EDDAA6] shadow-xs max-w-full">
              {/* City & Area Quick Selector (Dynamic with agent-posted locations & custom entry) */}
              <CustomDropdown
                options={locationDropdownOptions}
                value={selectedCity}
                onChange={onSelectCity}
                onClear={() => onSelectCity('All Delta Cities')}
                headerTitle="Cities & Areas"
                icon={<MapPin className="w-3.5 h-3.5 text-[#C68400]" />}
                align="left"
                variant="pill"
                allowCustomInput={true}
                customSearchSubtitle="Search listings with this location name or similar words"
              />

              <span className="w-px h-4 bg-[#EDDAA6]" />

              {/* Property Type Quick Selector */}
              <div className="hidden sm:inline-block">
                <CustomDropdown
                  options={PROPERTY_TYPES}
                  value={selectedType}
                  onChange={onSelectType}
                  headerTitle="Property Types"
                  icon={<Home className="w-3.5 h-3.5 text-[#C68400]" />}
                  align="center"
                  variant="pill"
                />
              </div>

              {/* More Filters Modal Trigger */}
              <button
                onClick={() => setIsOpenModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF8E6] hover:bg-[#FFEFCA] text-[#342A21] border border-[#EDDAA6] text-xs font-semibold transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#C68400]" />
                <span>Filter</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#FFAD05] text-[#000004] text-[10px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <span className="w-px h-4 bg-[#EDDAA6]" />

              {/* Search User or Listing Trigger */}
              {searchQuery.trim() ? (
                <div className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-[#342A21] text-white text-xs font-semibold max-w-[140px] sm:max-w-[180px] border border-[#FFAD05]/40">
                  <button
                    type="button"
                    onClick={() => setIsSearchExpanded(true)}
                    className="flex items-center gap-1.5 truncate cursor-pointer"
                    title="Edit search"
                  >
                    <Search className="w-3 h-3 text-[#FFAD05] shrink-0" />
                    <span className="truncate">{searchQuery}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSearchChange?.('');
                    }}
                    aria-label="Clear search"
                    className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSearchExpanded(true)}
                  aria-label="Search user or listing"
                  title="Search user or listing"
                  className="flex items-center justify-center w-7 h-7 sm:w-auto sm:px-2.5 sm:py-1.5 sm:gap-1.5 rounded-full bg-[#FFF8E6] hover:bg-[#FFEFCA] text-[#342A21] border border-[#EDDAA6] text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5 text-[#C68400]" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              )}
            </div>
          )}

          {/* Live Search Suggestions Dropdown (Users/Agents & Property Listings) */}
          {isSearchExpanded && (
            <div className="absolute top-11 left-1/2 -translate-x-1/2 w-[calc(100vw-1.5rem)] max-w-md bg-white rounded-2xl border border-[#E5E7EB] shadow-xl overflow-hidden z-50 animate-fade-in">
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-[#F0ECE3]">
                {/* Section 1: Users & Agents */}
                {matchingUsers.length > 0 && (
                  <div className="p-2.5">
                    <div className="px-2 pb-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#70798C] flex items-center gap-1">
                        <User className="w-3 h-3 text-[#342A21]" />
                        {trimmedQuery ? 'Matching Users & Agents' : 'Verified Agents & Users'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {matchingUsers.map((user) => (
                        <button
                          key={user.id + user.agencyName}
                          type="button"
                          onClick={() => {
                            onSearchChange?.(user.agencyName || user.fullName);
                            setIsSearchExpanded(false);
                          }}
                          className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[#FCF9F5] text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-[#342A21] text-white font-display font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                              ) : (
                                (user.agencyName || user.fullName || 'U').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#000004] truncate">
                                {user.agencyName && user.agencyName !== 'Partner Agent' && user.agencyName !== 'Setlla Member'
                                  ? user.agencyName
                                  : user.fullName}
                              </p>
                              <p className="text-[11px] text-[#70798C] truncate">
                                {user.fullName} · {user.city}
                              </p>
                            </div>
                          </div>
                          {user.listingCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FAF6F0] border border-[#E8E0D4] text-[10px] font-semibold text-[#342A21] shrink-0">
                              {user.listingCount} {user.listingCount === 1 ? 'listing' : 'listings'}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 2: Property Listings */}
                {matchingListings.length > 0 && (
                  <div className="p-2.5">
                    <div className="px-2 pb-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#70798C] flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-[#342A21]" />
                        {trimmedQuery ? 'Matching Listings' : 'Recent Listings'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {matchingListings.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onSearchChange?.(item.title);
                            setIsSearchExpanded(false);
                          }}
                          className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl hover:bg-[#FCF9F5] text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-[#E5E7EB] overflow-hidden shrink-0 flex items-center justify-center">
                              {item.media?.[0]?.poster || item.media?.[0]?.url ? (
                                <img
                                  src={item.media[0].poster || item.media[0].url}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Home className="w-4 h-4 text-[#70798C]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#000004] truncate">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-[#70798C] truncate">
                                {item.neighborhood}, {item.city} · {item.agent?.agencyName || item.agent?.fullName}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-[#342A21] shrink-0">
                            {formatNaira(item.fees.baseRent)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty Search State */}
                {trimmedQuery && matchingUsers.length === 0 && matchingListings.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-xs font-semibold text-[#000004]">
                      No user or listing matches "{searchQuery}"
                    </p>
                    <p className="text-[11px] text-[#70798C] mt-0.5">
                      Try searching by agent name, agency, house title, or street area.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Filter Modal */}
      {isOpenModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
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
                  Available with live inspection queues.
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
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <label className="text-xs font-bold uppercase tracking-wider text-[#70798C]">
                      Agent-Posted Areas
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

              {/* Standard Cities Pills */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#70798C] block mb-2">
                  Popular Cities & Areas
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
                className="py-2.5 px-5 rounded-lg bg-[#FFAD05] text-[#000004] text-xs font-extrabold hover:bg-[#e69c04] shadow-xs cursor-pointer"
              >
                Apply Filters ({totalFiltered} Available)
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    )}
    </>
  );
};
