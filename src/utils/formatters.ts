/**
 * Format numeric value to Nigerian Naira currency representation (₦)
 * e.g. 1500000 -> ₦1,500,000
 */
export function formatNaira(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₦0';
  }
  const formatted = new Intl.NumberFormat('en-NG', {
    maximumFractionDigits: 0,
  }).format(amount);
  return `₦${formatted}`;
}

/**
 * Parses user input currency string back into a plain integer
 * e.g. "₦ 1,500,000" -> 1500000
 */
export function parseCurrencyInput(value: string): number {
  const clean = value.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

/**
 * Format currency while typing for input fields
 */
export function formatCurrencyInput(val: string | number): string {
  const num = typeof val === 'number' ? val : parseCurrencyInput(val);
  if (!num) return '';
  return new Intl.NumberFormat('en-NG').format(num);
}

/**
 * Generate a unique Nigerian real estate booking inspection code
 * e.g., "DT-ASB-9482"
 */
export function generateBookingRef(city: string = 'ASB'): string {
  const prefix = 'DT';
  const cityCode = city.slice(0, 3).toUpperCase();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${cityCode}-${randomDigits}`;
}

/**
 * Format a Nigerian telephone number for display and WhatsApp deep links
 * Local e.g. 08034567890 -> +234 803 456 7890
 */
export function formatNigerianPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('234') && digits.length === 13) {
    return `+234 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `+234 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

/**
 * Clean phone for WhatsApp web api URL
 */
export function getWhatsAppUrl(phone: string, propertyTitle: string, bookingRef: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  let intlNumber = digits;
  if (digits.startsWith('0')) {
    intlNumber = `234${digits.slice(1)}`;
  } else if (!digits.startsWith('234')) {
    intlNumber = `234${digits}`;
  }
  const message = encodeURIComponent(
    `Hello Agent! I have confirmed and unlocked my inspection booking for "${propertyTitle}" (Pass ID: ${bookingRef}). Looking forward to meeting you!`
  );
  return `https://wa.me/${intlNumber}?text=${message}`;
}
