import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  subtitle?: string;
  disabled?: boolean;
  badge?: string;
}

export interface CustomDropdownProps {
  options: (string | DropdownOption)[];
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  headerTitle?: string;
  icon?: React.ReactNode;
  variant?: 'pill' | 'form';
  align?: 'left' | 'right' | 'center';
  className?: string;
  menuClassName?: string;
  disabled?: boolean;
  allowCustomInput?: boolean;
  customSearchSubtitle?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  onClear,
  placeholder = 'Select option',
  headerTitle,
  icon,
  variant = 'pill',
  align = 'left',
  className = '',
  menuClassName = '',
  disabled = false,
  allowCustomInput = true,
  customSearchSubtitle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to DropdownOption objects
  const normalizedOptions: DropdownOption[] = options.map((opt) =>
    typeof opt === 'string'
      ? { value: opt, label: opt }
      : opt
  );

  const isSearchable = normalizedOptions.length > 7 || allowCustomInput;

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const isCustomValue = Boolean(
    value &&
    value !== 'All Delta Cities' &&
    value !== 'All Property Types' &&
    !selectedOption
  );
  const displayLabel = selectedOption ? selectedOption.label : (value || placeholder);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      if (isSearchable) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    } else {
      setSearchQuery('');
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSearchable]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSearchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      // If there's an exact match in displayed options, pick it
      const exactMatch = displayedOptions.find(
        (opt) => opt.label.toLowerCase() === trimmed.toLowerCase() || opt.value.toLowerCase() === trimmed.toLowerCase()
      );
      if (exactMatch && !exactMatch.disabled) {
        handleSelect(exactMatch.value);
      } else if (allowCustomInput) {
        handleSelect(trimmed);
      } else if (displayedOptions.length > 0 && !displayedOptions[0].disabled) {
        handleSelect(displayedOptions[0].value);
      }
    }
  };

  const displayedOptions = isSearchable && searchQuery
    ? normalizedOptions.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.subtitle && opt.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : normalizedOptions;

  // Alignment classes for dropdown panel
  const alignmentClass =
    align === 'right'
      ? 'right-0'
      : align === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : 'left-0';

  return (
    <div ref={dropdownRef} className={`relative inline-block ${variant === 'form' ? 'w-full' : ''}`}>
      {/* Trigger Button */}
      {variant === 'pill' ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-[#000004] hover:bg-slate-100/70 transition-all focus:outline-none cursor-pointer select-none active:scale-[0.98] ${
            isOpen ? 'bg-slate-100/80 text-[#342A21]' : ''
          } ${isCustomValue ? 'bg-amber-50 border border-amber-200 text-amber-900 font-bold' : ''} ${className}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="truncate max-w-[130px] sm:max-w-[170px]">{displayLabel}</span>
          {isCustomValue && onClear && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="w-3.5 h-3.5 rounded-full bg-amber-200 hover:bg-amber-300 text-amber-800 flex items-center justify-center cursor-pointer transition-colors"
              title="Reset location"
            >
              <X className="w-2.5 h-2.5" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#70798C] transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-[#342A21]' : ''
            }`}
          />
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full px-3 py-2 min-h-[38px] rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-[#000004] flex items-center justify-between hover:border-[#342A21]/50 focus:outline-none focus:ring-2 focus:ring-[#342A21]/20 transition-all cursor-pointer select-none active:scale-[0.99] ${
            isOpen ? 'border-[#342A21] ring-2 ring-[#342A21]/20' : ''
          } ${isCustomValue ? 'border-amber-400 bg-amber-50/50' : ''} ${className}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2 truncate">
            {icon && <span className="shrink-0">{icon}</span>}
            <span className="truncate">{displayLabel}</span>
            {selectedOption?.badge && !isCustomValue && (
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                selectedOption.badge.toLowerCase().includes('active')
                  ? 'bg-emerald-100 text-emerald-800'
                  : selectedOption.badge.toLowerCase().includes('beta')
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedOption.badge}
              </span>
            )}
            {isCustomValue && (
              <span className="text-[9px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                Custom Area
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
            {isCustomValue && onClear && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center cursor-pointer"
                title="Reset location"
              >
                <X className="w-2.5 h-2.5" />
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#70798C] transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#342A21]' : ''
              }`}
            />
          </div>
        </button>
      )}

      {/* Dropdown Floating Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute top-[calc(100%+6px)] z-50 bg-white/98 backdrop-blur-md rounded-2xl shadow-elevated border border-[#E5E7EB] p-1.5 overflow-hidden animate-dropdown ${
            variant === 'form' ? 'w-full' : 'min-w-[240px] w-max max-w-[320px]'
          } ${alignmentClass} ${menuClassName}`}
        >
          {headerTitle && (
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#70798C] border-b border-slate-100 mb-1 flex items-center justify-between">
              <span>{headerTitle}</span>
              {value && value !== 'All Delta Cities' && (
                <button
                  type="button"
                  onClick={() => handleSelect('All Delta Cities')}
                  className="text-[10px] font-semibold text-[#342A21] hover:underline cursor-pointer"
                >
                  Show All
                </button>
              )}
            </div>
          )}

          {/* Search Box */}
          {isSearchable && (
            <div className="relative px-1 pt-1 pb-1.5 shrink-0">
              <Search className="w-3.5 h-3.5 text-[#70798C] absolute left-3.5 top-3" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search city, area, or posted location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchInputKeyDown}
                className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-[#E5E7EB] bg-slate-50 text-xs text-[#000004] placeholder:text-[#70798C] outline-none focus:border-[#000004] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-4 h-4 rounded-full bg-slate-200 text-[#70798C] flex items-center justify-center absolute right-3 top-3 hover:bg-slate-300 cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}

          {/* Custom Search Option (if user typed a query and allowCustomInput is enabled) */}
          {allowCustomInput && searchQuery.trim() && (
            <div className="px-1 mb-1">
              <button
                type="button"
                onClick={() => handleSelect(searchQuery.trim())}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-300/80 hover:border-amber-400 text-left transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2 truncate mr-2">
                  <div className="w-6 h-6 rounded-lg bg-[#342A21] text-white flex items-center justify-center shrink-0">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-[#000004] truncate flex items-center gap-1.5">
                      <span className="truncate">Search "{searchQuery.trim()}"</span>
                      <span className="text-[9px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded shrink-0">
                        Custom Area
                      </span>
                    </div>
                    <div className="text-[10px] text-[#70798C] truncate">
                      {customSearchSubtitle || 'Search all listings matching this location or words'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#70798C] bg-white/80 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                  ↵ Enter
                </span>
              </button>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto space-y-0.5 overscroll-contain">
            {displayedOptions.map((option) => {
              const isSelected = option.value === value;
              const isDisabled = option.disabled;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isDisabled}
                  disabled={isDisabled}
                  onClick={() => {
                    if (!isDisabled) {
                      handleSelect(option.value);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all text-left select-none ${
                    isDisabled
                      ? 'opacity-40 text-slate-400 bg-slate-50/50 cursor-not-allowed hover:bg-slate-50/50'
                      : isSelected
                      ? 'bg-[#342A21]/10 text-[#342A21] font-bold shadow-xs cursor-pointer'
                      : 'text-[#000004] hover:bg-slate-100 hover:text-[#342A21] font-medium cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate mr-2">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <div className="truncate">
                      <div className="truncate">{option.label}</div>
                      {option.subtitle && (
                        <div className="text-[10px] text-[#70798C] font-normal truncate">
                          {option.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  {isDisabled ? (
                    <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                      {option.badge || 'Coming Soon'}
                    </span>
                  ) : option.badge ? (
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      option.badge.toLowerCase().includes('active') || option.badge.toLowerCase().includes('launch')
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {option.badge}
                    </span>
                  ) : isSelected ? (
                    <Check className="w-3.5 h-3.5 text-[#342A21] shrink-0 stroke-[2.5]" />
                  ) : null}
                </button>
              );
            })}

            {displayedOptions.length === 0 && (
              <div className="py-3 px-2 text-center text-xs text-[#70798C]">
                {searchQuery.trim() && allowCustomInput ? (
                  <span>
                    No predefined city named "{searchQuery.trim()}". Click above or press Enter to search this area across agent-posted properties!
                  </span>
                ) : (
                  <span>No matching option</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

