import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface AdminSelectOption {
  value: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
  dotColor?: string;
}

export interface AdminCustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | AdminSelectOption)[];
  placeholder?: string;
  variant?: 'filter' | 'form' | 'table';
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
  icon?: React.ReactNode;
  id?: string;
}

export const AdminCustomSelect: React.FC<AdminCustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  variant = 'form',
  searchable,
  disabled = false,
  className = '',
  menuClassName = '',
  icon,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize all options to AdminSelectOption structure
  const normalizedOptions: AdminSelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : (placeholder || value);

  const shouldSearch = searchable ?? normalizedOptions.length > 7;

  // Filter options if search query is active
  const filteredOptions = shouldSearch && searchQuery.trim()
    ? normalizedOptions.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        opt.value.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : normalizedOptions;

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      if (shouldSearch) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    } else {
      setSearchQuery('');
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, shouldSearch]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Variant-specific trigger button styling
  let triggerClasses = '';
  if (variant === 'filter') {
    triggerClasses = `py-2 px-3.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold text-[#000004] hover:bg-[#F6F3EF] hover:border-[#342A21]/30 transition-all cursor-pointer shadow-2xs select-none flex items-center justify-between gap-2 ${
      isOpen ? 'border-[#342A21] ring-2 ring-[#342A21]/15 bg-white' : ''
    }`;
  } else if (variant === 'table') {
    triggerClasses = `py-1 px-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[11px] font-bold text-[#000004] hover:border-[#342A21]/40 transition-all cursor-pointer select-none flex items-center justify-between gap-1.5 shadow-2xs ${
      isOpen ? 'border-[#342A21] ring-1 ring-[#342A21]/20' : ''
    }`;
  } else {
    // 'form'
    triggerClasses = `w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FCF9F5] text-xs font-semibold text-[#000004] hover:border-[#342A21]/40 transition-all cursor-pointer select-none flex items-center justify-between gap-2 ${
      isOpen ? 'border-[#342A21] ring-2 ring-[#342A21]/15 bg-white' : ''
    }`;
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${variant === 'form' ? 'w-full' : 'inline-block'} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`${triggerClasses} ${className}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          {(icon || selectedOption?.icon) && (
            <span className="shrink-0">{icon || selectedOption?.icon}</span>
          )}
          
          {selectedOption?.dotColor && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: selectedOption.dotColor }}
            />
          )}

          <span className="truncate">{displayLabel}</span>

          {selectedOption?.badge && (
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-wider ${
                selectedOption.badgeColor || 'bg-slate-100 text-slate-700'
              }`}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-[#70798C] transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? 'rotate-180 text-[#342A21]' : ''
          }`}
        />
      </button>

      {/* Floating Options Panel */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 top-[calc(100%+6px)] z-[999] min-w-full ${
            variant === 'form' ? 'w-full' : 'w-max max-w-[340px]'
          } bg-white rounded-2xl shadow-elevated border border-[#342A21]/15 p-1.5 animate-dropdown overflow-hidden ${menuClassName}`}
          style={{ minWidth: variant === 'form' ? '100%' : '180px' }}
        >
          {/* Optional Quick Search Header */}
          {shouldSearch && (
            <div className="p-1 mb-1 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FCF9F5] rounded-xl border border-[#E5E7EB]">
                <Search className="w-3.5 h-3.5 text-[#70798C] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter options..."
                  className="w-full bg-transparent text-xs text-[#000004] placeholder-[#70798C] focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 no-scrollbar py-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-3 px-3 text-center text-xs text-[#70798C]">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2.5 transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#342A21] text-white shadow-2xs'
                        : 'text-[#342A21] hover:bg-[#FCF9F5] hover:text-[#000004]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && (
                        <span className={`shrink-0 ${isSelected ? 'text-amber-300' : ''}`}>
                          {opt.icon}
                        </span>
                      )}

                      {opt.dotColor && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: opt.dotColor }}
                        />
                      )}

                      <span className="truncate">{opt.label}</span>

                      {opt.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : opt.badgeColor || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
