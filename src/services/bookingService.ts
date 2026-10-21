import { supabase, isSupabaseConfigured, getSupabaseClient } from '../utils/supabaseClient';
import { BookingRecord, BookingStatus } from '../types/marketplace';

const LOCAL_STORAGE_KEY = 'setlla_bookings';
const LEGACY_STORAGE_KEY = 'deltarent_bookings';

function getLocalSavedBookings(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
}

/**
 * Fetches inspection bookings from Supabase (or local storage fallback)
 */
export async function fetchAllBookings(): Promise<BookingRecord[]> {
  const client = getSupabaseClient();
  if (isSupabaseConfigured() && client) {
    try {
      const { data, error } = await client
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const cloudBookings: BookingRecord[] = data.map((row) => ({
          id: row.id,
          propertyId: row.property_id || row.propertyId,
          slotId: row.slot_id || row.slotId,
          slotTimeWindow: row.slot_time_window || row.slotTimeWindow,
          slotDate: row.slot_date || row.slotDate,
          applicantName: row.applicant_name || row.applicantName,
          applicantPhone: row.applicant_phone || row.applicantPhone,
          applicantEmail: row.applicant_email || row.applicantEmail,
          status: row.status as BookingStatus,
          queuePosition: row.queue_position ?? row.queuePosition,
          inspectionFeeAmount: row.inspection_fee_amount ?? row.inspectionFeeAmount ?? 0,
          paymentReference: row.payment_reference || row.paymentReference,
          paymentMethod: row.payment_method || row.paymentMethod,
          createdAt: row.created_at || row.createdAt || new Date().toISOString(),
          confirmedAt: row.confirmed_at || row.confirmedAt,
        }));

        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudBookings));
        } catch (e) {}

        return cloudBookings;
      }
    } catch (err) {
      console.warn('[Setlla Supabase] Failed fetching bookings from cloud:', err);
    }
  }

  // Fallback: Local storage
  const saved = getLocalSavedBookings();
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
}

/**
 * Creates a new booking in Supabase and locally
 */
export async function saveNewBooking(booking: BookingRecord): Promise<void> {
  const client = getSupabaseClient();
  if (isSupabaseConfigured() && client) {
    try {
      const row = {
        id: booking.id,
        property_id: booking.propertyId,
        slot_id: booking.slotId,
        slot_time_window: booking.slotTimeWindow,
        slot_date: booking.slotDate,
        applicant_name: booking.applicantName,
        applicant_phone: booking.applicantPhone,
        applicant_email: booking.applicantEmail || null,
        status: booking.status,
        queue_position: booking.queuePosition || null,
        inspection_fee_amount: booking.inspectionFeeAmount || 0,
        payment_reference: booking.paymentReference || null,
        payment_method: booking.paymentMethod || null,
        created_at: booking.createdAt || new Date().toISOString(),
        confirmed_at: booking.confirmedAt || null,
      };

      await client.from('bookings').upsert([row]);
    } catch (err) {
      console.warn('[Setlla Supabase] Failed saving booking to cloud:', err);
    }
  }

  try {
    const saved = getLocalSavedBookings();
    const existing: BookingRecord[] = saved ? JSON.parse(saved) : [];
    const updated = [booking, ...existing.filter((b) => b.id !== booking.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}
}

/**
 * Updates booking status (e.g. APPROVED_CONFIRMED, REJECTED_BY_AGENT)
 */
export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
  const confirmedAt = status === 'APPROVED_CONFIRMED' || status === 'CONFIRMED_UNLOCKED' ? new Date().toISOString() : undefined;
  const client = getSupabaseClient();

  if (isSupabaseConfigured() && client) {
    try {
      await client
        .from('bookings')
        .update({ status, confirmed_at: confirmedAt })
        .eq('id', bookingId);
    } catch (err) {
      console.warn('[Setlla Supabase] Failed updating booking status:', err);
    }
  }

  try {
    const saved = getLocalSavedBookings();
    if (saved) {
      const existing: BookingRecord[] = JSON.parse(saved);
      const updated = existing.map((b) =>
        b.id === bookingId ? { ...b, status, ...(confirmedAt ? { confirmedAt } : {}) } : b
      );
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {}
}
