import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

export interface CustomDropdownProps {
  options: (string | DropdownOption)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  headerTitle?: string;
  icon?: React.ReactNode;
  variant?: 'pill' | 'form';
  align?: 'left' | 'right' | 'center';
  className?: string;
  menuClassName?: string;
  disabled?: boolean;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  headerTitle,
  icon,
  variant = 'pill',
  align = 'left',
  className = '',
  menuClassName = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize options to DropdownOption objects
  const normalizedOptions: DropdownOption[] = options.map((opt) =>
    typeof opt === 'string'
      ? { value: opt, label: opt }
      : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

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
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

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
          } ${className}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="truncate max-w-[130px] sm:max-w-[170px]">{displayLabel}</span>
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
          className={`w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs font-medium text-[#000004] flex items-center justify-between hover:border-[#342A21]/50 focus:outline-none focus:ring-2 focus:ring-[#342A21]/20 transition-all cursor-pointer select-none active:scale-[0.99] ${
            isOpen ? 'border-[#342A21] ring-2 ring-[#342A21]/20' : ''
          } ${className}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2 truncate">
            {icon && <span className="shrink-0">{icon}</span>}
            <span className="truncate">{displayLabel}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#70798C] transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-[#342A21]' : ''
            }`}
          />
        </button>
      )}

      {/* Dropdown Floating Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute top-[calc(100%+6px)] z-50 bg-white/98 backdrop-blur-md rounded-2xl shadow-elevated border border-[#E5E7EB] p-1.5 overflow-hidden animate-dropdown ${
            variant === 'form' ? 'w-full' : 'min-w-[200px] w-max max-w-[280px]'
          } ${alignmentClass} ${menuClassName}`}
        >
          {headerTitle && (
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#70798C] border-b border-slate-100 mb-1">
              {headerTitle}
            </div>
          )}

          <div className="max-h-64 overflow-y-auto space-y-0.5 overscroll-contain">
            {normalizedOptions.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all cursor-pointer text-left select-none ${
                    isSelected
                      ? 'bg-[#342A21]/10 text-[#342A21] font-bold shadow-xs'
                      : 'text-[#000004] hover:bg-slate-100 hover:text-[#342A21] font-medium'
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
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#342A21] shrink-0 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
