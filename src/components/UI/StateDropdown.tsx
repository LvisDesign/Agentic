import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
  ChevronDown, 
  Check, 
  Search, 
  Lock, 
  X,
  AlertCircle
} from 'lucide-react';

export interface StateDropdownOption {
  name: string;
  isActive: boolean;
  subtitle?: string;
  badge?: string;
}

export const NIGERIAN_STATES_DATA: StateDropdownOption[] = [
  {
    name: 'Delta State',
    isActive: true,
    subtitle: 'Verified rentals & direct inspection bookings',
  },
  { name: 'Lagos State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Abuja (FCT)', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Rivers State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Edo State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Anambra State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Enugu State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Ogun State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Oyo State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Akwa Ibom State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Abia State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Imo State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Bayelsa State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Cross River State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Kano State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Kaduna State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Plateau State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Kwara State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Ondo State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Osun State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Ekiti State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Benue State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Kogi State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Nasarawa State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Niger State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Adamawa State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Bauchi State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Borno State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Gombe State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Taraba State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Yobe State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Jigawa State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Katsina State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Kebbi State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Sokoto State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Zamfara State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
  { name: 'Ebonyi State', isActive: false, subtitle: 'Expansion Market', badge: 'Coming Soon' },
];

interface StateDropdownProps {
  value: string;
  onChange: (state: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export const StateDropdown: React.FC<StateDropdownProps> = ({
  value,
  onChange,
  label,
  required = false,
  className = '',
  placeholder = 'Select state',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inactiveNotice, setInactiveNotice] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setInactiveNotice(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setInactiveNotice(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const vv = typeof window !== 'undefined' ? window.visualViewport : null;
        const viewportHeight = vv ? vv.height : window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const isMobile = window.innerWidth < 768;
        setOpenUpwards(isMobile ? (spaceAbove >= 160 || spaceAbove > spaceBelow) : (spaceBelow < 260 && spaceAbove > spaceBelow));
      }
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedStateObj = NIGERIAN_STATES_DATA.find(
    (s) => s.name.toLowerCase() === (value || '').toLowerCase()
  ) || NIGERIAN_STATES_DATA[0];

  const filteredStates = NIGERIAN_STATES_DATA.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeStates = filteredStates.filter((s) => s.isActive);
  const inactiveStates = filteredStates.filter((s) => !s.isActive);

  const handleSelectActive = (stateName: string) => {
    onChange(stateName);
    setIsOpen(false);
    setSearchQuery('');
    setInactiveNotice(null);
  };

  const handleAttemptDisabled = (stateName: string) => {
    setInactiveNotice(`${stateName} is coming soon!`);
    setTimeout(() => {
      setInactiveNotice(null);
    }, 3000);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? 'z-30' : 'z-10'} ${className}`}>
      {label && (
        <label className="block text-[11px] font-bold text-[#000004] mb-1 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-[#342A21]" />
          <span>{label}</span>
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs font-medium text-[#000004] flex items-center justify-between transition-all duration-150 cursor-pointer shadow-2xs select-none ${
          isOpen
            ? 'border-[#000004] ring-2 ring-[#000004]/10 bg-slate-50/40'
            : 'border-[#E5E7EB] hover:border-[#342A21]/60'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          <div className="w-6 h-6 rounded-lg bg-slate-100 text-[#342A21] flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="text-left truncate">
            <span className="font-bold text-xs text-[#000004] block leading-tight truncate">
              {selectedStateObj ? selectedStateObj.name : placeholder}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <ChevronDown
            className={`w-4 h-4 text-[#70798C] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#000004]' : ''
            }`}
          />
        </div>
      </button>

      {/* Custom Dropdown Popover */}
      {isOpen && (
        <div 
          className={`absolute left-0 right-0 ${
            openUpwards ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'
          } z-50 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-[#E5E7EB] p-2 overflow-hidden flex flex-col max-h-[240px] sm:max-h-[300px]`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Box */}
          <div className="relative mb-2 shrink-0">
            <Search className="w-3.5 h-3.5 text-[#70798C] absolute left-3 top-2.5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-[#E5E7EB] bg-slate-50 text-xs text-[#000004] placeholder:text-[#70798C] outline-none focus:border-[#000004] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-4 h-4 rounded-full bg-slate-200 text-[#70798C] flex items-center justify-center absolute right-2.5 top-2.5 hover:bg-slate-300"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Feedback banner if clicked disabled */}
          {inactiveNotice && (
            <div className="mb-2 p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5 shrink-0 animate-fade-in">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>{inactiveNotice}</span>
            </div>
          )}

          {/* States Scrollable List */}
          <div className="overflow-y-auto space-y-1 pr-1 text-xs no-scrollbar flex-1">
            {/* Active Delta State */}
            {activeStates.map((st) => {
              const isSelected = (value || '').toLowerCase() === st.name.toLowerCase();
              return (
                <button
                  key={st.name}
                  type="button"
                  onClick={() => handleSelectActive(st.name)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-100 border-slate-300 text-[#000004] font-bold shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-100 text-[#000004]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#000004] text-white'
                        : 'bg-slate-100 text-[#342A21]'
                    }`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs truncate">
                        {st.name}
                      </div>
                      <div className="text-[10px] text-[#70798C] font-normal truncate mt-0.5">
                        {st.subtitle}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#000004] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}

            {/* Subtle Divider */}
            {activeStates.length > 0 && inactiveStates.length > 0 && (
              <div className="border-t border-slate-100 my-1" />
            )}

            {/* Expansion States (Greyed Out) */}
            {inactiveStates.map((st) => (
              <button
                key={st.name}
                type="button"
                onClick={() => handleAttemptDisabled(st.name)}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors cursor-not-allowed select-none opacity-40 hover:opacity-60 hover:bg-slate-50 border border-transparent"
                title={`${st.name} is coming soon.`}
              >
                <div className="flex items-center gap-2 truncate mr-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium text-xs text-slate-500 truncate">
                    {st.name}
                  </span>
                </div>

                <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                  Coming Soon
                </span>
              </button>
            ))}

            {activeStates.length === 0 && inactiveStates.length === 0 && (
              <div className="py-6 text-center text-xs text-[#70798C]">
                No state matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
