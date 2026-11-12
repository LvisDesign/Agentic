import { isSupabaseConfigured, getSupabaseClient, invalidateCache } from '../utils/supabaseClient';
import { BookingRecord, BookingStatus, PropertyListing } from '../types/marketplace';

const LOCAL_STORAGE_KEY = 'setlla_bookings';
const LEGACY_STORAGE_KEY = 'deltarent_bookings';

function getLocalSavedBookings(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
}

export function getSavedLocalBookingsList(): BookingRecord[] {
  const saved = getLocalSavedBookings();
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
  }
  return [];
}

/**
 * Maps a BookingRecord to a `public.listings` row (`property_type = '__INSPECTION_BOOKING__'`)
 * so inspection requests replicate across all devices via the same guaranteed `public.listings`
 * cloud table & Realtime channel used by Job Applications.
 */
export function mapBookingToListingsRow(booking: BookingRecord, targetListing?: PropertyListing) {
  const now = new Date().toISOString();
  return {
    id: booking.id,
    title: targetListing?.title || 'Property Inspection Request',
    state: targetListing?.state || 'Delta State',
    city: targetListing?.city || 'Asaba',
    neighborhood: targetListing?.neighborhood || 'Central District',
    full_address: targetListing?.fullAddress || '',
    property_type: '__INSPECTION_BOOKING__',
    bedrooms: 0,
    bathrooms: 0,
    toilets: 0,
    is_serviced: false,
    is_furnished: false,
    electricity_status: booking.status,
    water_supply: booking.slotTimeWindow,
    description: booking.slotDate,
    media: [],
    fees: {
      baseRent: 0,
      rentPeriod: 'per annum',
      cautionFee: 0,
      legalAndAgencyFee: 0,
      serviceCharge: 0,
      totalMoveInPackage: 0,
      _bookingData: booking,
      _agentId: targetListing?.agent?.id || '',
      _agentPhone: targetListing?.agent?.phone || '',
      _agentEmail: targetListing?.agent?.email || '',
      _agentName: targetListing?.agent?.fullName || '',
    },
    inspection_fee: booking.inspectionFeeAmount || 0,
    agent: {
      id: targetListing?.agent?.id || '',
      fullName: booking.applicantName,
      agencyName: targetListing?.agent?.fullName || 'Listing Agent',
      isVerified: true,
      rating: 5,
      reviewCount: 0,
      completedInspections: 0,
      responseTime: 'Instant',
      phone: booking.applicantPhone,
      whatsapp: booking.applicantPhone,
      email: booking.applicantEmail || '',
      avatarUrl: '',
    },
    inspection_slots: [],
    inspection_days: [],
    tags: [
      booking.propertyId,
      booking.status,
      booking.applicantPhone,
      booking.applicantEmail || '',
      booking.slotId || '',
    ],
    addons: [],
    availability_status: booking.status === 'CANCELLED' ? 'Deleted' : 'Available',
    created_at: booking.createdAt || now,
    last_confirmed_at: booking.confirmedAt || now,
  };
}

/**
 * Extracts a BookingRecord from a `public.listings` row with `property_type === '__INSPECTION_BOOKING__'`.
 */
export function mapListingsRowToBooking(row: any): BookingRecord | null {
  if (!row || !row.id) return null;
  if (row.availability_status === 'Deleted' || row.availability_status === 'Archived') return null;

  const embedded = row.fees?._bookingData;
  if (embedded && typeof embedded === 'object' && embedded.id && embedded.propertyId) {
    return {
      ...embedded,
      status: ((row.electricity_status as BookingStatus) || embedded.status || 'REQUEST_SUBMITTED') as BookingStatus,
      confirmedAt: embedded.confirmedAt || row.last_confirmed_at,
    };
  }

  if (row.property_type !== '__INSPECTION_BOOKING__') return null;

  const propId = row.tags?.[0] || '';
  if (!propId) return null;

  return {
    id: row.id,
    propertyId: propId,
    slotId: row.tags?.[4] || 'slot-0',
    slotTimeWindow: row.water_supply || '10:00 AM – 11:00 AM',
    slotDate: row.description || 'Today',
    applicantName: row.agent?.fullName || 'Applicant',
    applicantPhone: row.tags?.[2] || row.agent?.phone || '',
    applicantEmail: row.tags?.[3] || row.agent?.email || undefined,
    status: ((row.electricity_status as BookingStatus) || row.tags?.[1] || 'REQUEST_SUBMITTED') as BookingStatus,
    inspectionFeeAmount: Number(row.inspection_fee || 0),
    createdAt: row.created_at || new Date().toISOString(),
    confirmedAt: row.last_confirmed_at || undefined,
  };
}

function statusPriority(status: BookingStatus): number {
  switch (status) {
    case 'CONFIRMED_UNLOCKED':
    case 'APPROVED_CONFIRMED':
      return 4;
    case 'REJECTED_BY_AGENT':
    case 'CANCELLED':
      return 3;
    case 'ACCEPTED_PENDING_PAYMENT':
    case 'PAYMENT_PROCESSING':
      return 2;
    case 'REQUEST_SUBMITTED':
    case 'QUEUED':
    default:
      return 1;
  }
}

/**
 * Fetches inspection bookings from Supabase (`public.bookings` + `public.listings` `__INSPECTION_BOOKING__` rows
 * + embedded property `fees._bookings`) and merges with local storage.
 */
export async function fetchAllBookings(): Promise<BookingRecord[]> {
  const localBookings = getSavedLocalBookingsList();
  const client = getSupabaseClient();

  if (isSupabaseConfigured() && client) {
    try {
      const [bookingsTableRes, listingsTableRes] = await Promise.all([
        Promise.resolve(
          client
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false })
        ).catch(() => ({ data: null, error: null })),
        Promise.resolve(
          client
            .from('listings')
            .select('*')
            .neq('availability_status', 'Deleted')
            .neq('availability_status', 'Archived')
            .order('created_at', { ascending: false })
            .limit(100)
        ).catch(() => ({ data: null, error: null })),
      ]);

      const byId = new Map<string, BookingRecord>();

      const mergeBooking = (candidate: BookingRecord) => {
        if (!candidate || !candidate.id || !candidate.propertyId) return;
        const existing = byId.get(candidate.id);
        if (!existing) {
          byId.set(candidate.id, candidate);
          return;
        }
        const candPrio = statusPriority(candidate.status);
        const existPrio = statusPriority(existing.status);
        if (candPrio >= existPrio) {
          byId.set(candidate.id, {
            ...existing,
            ...candidate,
            applicantEmail: candidate.applicantEmail || existing.applicantEmail,
          });
        }
      };

      // 1. Standalone rows from `public.bookings`
      if (bookingsTableRes && !bookingsTableRes.error && Array.isArray(bookingsTableRes.data)) {
        for (const row of bookingsTableRes.data) {
          const rawPayRef = row.payment_reference || row.paymentReference || '';
          const encodedEmail =
            typeof rawPayRef === 'string' && rawPayRef.startsWith('EMAIL:')
              ? rawPayRef.slice(6).trim()
              : undefined;
          const cleanPayRef =
            typeof rawPayRef === 'string' && rawPayRef.startsWith('EMAIL:')
              ? undefined
              : rawPayRef || undefined;

          mergeBooking({
            id: row.id,
            propertyId: row.property_id || row.propertyId,
            slotId: row.slot_id || row.slotId,
            slotTimeWindow: row.slot_time_window || row.slotTimeWindow,
            slotDate: row.slot_date || row.slotDate,
            applicantName: row.applicant_name || row.applicantName,
            applicantPhone: row.applicant_phone || row.applicantPhone,
            applicantEmail: row.applicant_email || row.applicantEmail || encodedEmail,
            status: row.status as BookingStatus,
            queuePosition: row.queue_position ?? row.queuePosition,
            inspectionFeeAmount: row.inspection_fee_amount ?? row.inspectionFeeAmount ?? 0,
            paymentReference: cleanPayRef,
            paymentMethod: row.payment_method || row.paymentMethod,
            createdAt: row.created_at || row.createdAt || new Date().toISOString(),
            confirmedAt: row.confirmed_at || row.confirmedAt,
          });
        }
      }

      // 2. Standalone `__INSPECTION_BOOKING__` rows + embedded `fees._bookings` from `public.listings`
      const cloudListingBookingIds = new Set<string>();
      const listingRowById = new Map<string, any>();
      if (listingsTableRes && !listingsTableRes.error && Array.isArray(listingsTableRes.data)) {
        for (const row of listingsTableRes.data) {
          if (row.property_type === '__INSPECTION_BOOKING__') {
            cloudListingBookingIds.add(row.id);
            const mapped = mapListingsRowToBooking(row);
            if (mapped) {
              mergeBooking(mapped);
            }
          } else {
            listingRowById.set(row.id, row);
            if (Array.isArray(row.fees?._bookings)) {
              for (const embedded of row.fees._bookings) {
                if (embedded && embedded.id) {
                  cloudListingBookingIds.add(embedded.id);
                  mergeBooking({
                    ...embedded,
                    propertyId: embedded.propertyId || row.id,
                  });
                }
              }
            }
          }
        }
      }

      // 3. Merge any local bookings that haven't finished syncing yet & self-heal to `public.listings`
      for (const local of localBookings) {
        if (local && local.id) {
          if (!byId.has(local.id)) {
            mergeBooking(local);
          }
          if (!cloudListingBookingIds.has(local.id)) {
            const parentRow = listingRowById.get(local.propertyId);
            const pseudoListing: PropertyListing | undefined = parentRow
              ? ({
                  id: parentRow.id,
                  title: parentRow.title,
                  state: parentRow.state,
                  city: parentRow.city,
                  neighborhood: parentRow.neighborhood,
                  fullAddress: parentRow.full_address || '',
                  agent: parentRow.agent,
                } as PropertyListing)
              : undefined;
            const mirrorRow = mapBookingToListingsRow(local, pseudoListing);
            const { last_confirmed_at: _omitConfirm, ...safeMirrorRow } = mirrorRow;
            client.from('listings').upsert([safeMirrorRow]).then(() => {});
          }
        }
      }

      const merged = Array.from(byId.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged.slice(0, 150)));
      } catch (_) {}

      return merged;
    } catch (err) {
      console.warn('[Setlla Supabase] Failed fetching bookings from cloud:', err);
    }
  }

  return localBookings;
}

/**
 * Creates a new booking in Supabase (`public.bookings` + `public.listings` mirror) and locally
 */
export async function saveNewBooking(
  booking: BookingRecord,
  targetListing?: PropertyListing
): Promise<void> {
  try {
    const existing = getSavedLocalBookingsList();
    const updated = [booking, ...existing.filter((b) => b.id !== booking.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}

  const client = getSupabaseClient();
  if (isSupabaseConfigured() && client) {
    try {
      const encodedRef =
        booking.paymentReference ||
        (booking.applicantEmail ? `EMAIL:${booking.applicantEmail.trim()}` : null);

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
        payment_reference: encodedRef,
        payment_method: booking.paymentMethod || null,
        created_at: booking.createdAt || new Date().toISOString(),
        confirmed_at: booking.confirmedAt || null,
      };

      // A. Primary upsert to `public.bookings`
      const { error } = await client.from('bookings').upsert([row]);
      if (error) {
        const { applicant_email: _omitEmail, ...fallbackRow } = row;
        await client.from('bookings').upsert([fallbackRow]);
      }

      // B. Mirror as standalone `__INSPECTION_BOOKING__` row in `public.listings` (guaranteed Realtime & RLS delivery)
      const listingBookingRow = mapBookingToListingsRow(booking, targetListing);
      const { error: listErr } = await client.from('listings').upsert([listingBookingRow]);
      if (listErr) {
        const { last_confirmed_at: _omitConfirm, ...fallbackListingRow } = listingBookingRow;
        await client.from('listings').upsert([fallbackListingRow]);
      }

      // C. Also embed inside parent property's `fees._bookings` in `public.listings`
      if (booking.propertyId) {
        const { data: propRow } = await client
          .from('listings')
          .select('id, fees, inspection_slots')
          .eq('id', booking.propertyId)
          .maybeSingle();

        if (propRow) {
          const prevBookings: BookingRecord[] = Array.isArray(propRow.fees?._bookings)
            ? propRow.fees._bookings
            : [];
          const nextBookings = [
            booking,
            ...prevBookings.filter((b) => b && b.id !== booking.id),
          ].slice(0, 50);

          const updatedFees = {
            ...(propRow.fees || {}),
            _bookings: nextBookings,
          };

          await client
            .from('listings')
            .update({ fees: updatedFees })
            .eq('id', booking.propertyId);
        }
      }

      invalidateCache('listings_');
    } catch (err) {
      console.warn('[Setlla Supabase] Failed saving booking to cloud:', err);
    }
  }
}

/**
 * Updates booking status (e.g. CONFIRMED_UNLOCKED, APPROVED_CONFIRMED, REJECTED_BY_AGENT)
 * across both `public.bookings` and `public.listings` (`__INSPECTION_BOOKING__` + parent property `fees._bookings`).
 */
export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
  const confirmedAt =
    status === 'APPROVED_CONFIRMED' || status === 'CONFIRMED_UNLOCKED'
      ? new Date().toISOString()
      : undefined;

  let targetBooking: BookingRecord | undefined;
  try {
    const existing = getSavedLocalBookingsList();
    const updated = existing.map((b) => {
      if (b.id === bookingId) {
        targetBooking = { ...b, status, ...(confirmedAt ? { confirmedAt } : {}) };
        return targetBooking;
      }
      return b;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}

  const client = getSupabaseClient();
  if (isSupabaseConfigured() && client) {
    try {
      // A. Update `public.bookings`
      const updatePayload: Record<string, unknown> = { status };
      if (confirmedAt) {
        updatePayload.confirmed_at = confirmedAt;
      }
      const { error } = await client
        .from('bookings')
        .update(updatePayload)
        .eq('id', bookingId);

      if (error && confirmedAt) {
        await client.from('bookings').update({ status }).eq('id', bookingId);
      }

      // B. Update standalone `__INSPECTION_BOOKING__` row in `public.listings`
      const { data: bookingRow } = await client
        .from('listings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle();

      if (bookingRow) {
        const currentMapped = mapListingsRowToBooking(bookingRow) || targetBooking;
        const updatedBookingObj: BookingRecord | undefined = currentMapped
          ? { ...currentMapped, status, ...(confirmedAt ? { confirmedAt } : {}) }
          : undefined;

        const updatedFees = {
          ...(bookingRow.fees || {}),
          ...(updatedBookingObj ? { _bookingData: updatedBookingObj } : {}),
        };
        const updatedTags = Array.isArray(bookingRow.tags) ? [...bookingRow.tags] : [];
        if (updatedTags.length > 1) {
          updatedTags[1] = status;
        }

        await client
          .from('listings')
          .update({
            electricity_status: status,
            fees: updatedFees,
            tags: updatedTags,
          })
          .eq('id', bookingId);
      } else if (targetBooking) {
        const listingBookingRow = mapBookingToListingsRow(targetBooking);
        const { last_confirmed_at: _omitConfirm, ...safeRow } = listingBookingRow;
        await client.from('listings').upsert([safeRow]);
      }

      // C. Update parent property's `fees._bookings` in `public.listings`
      const propId = targetBooking?.propertyId || bookingRow?.tags?.[0];
      if (propId) {
        const { data: propRow } = await client
          .from('listings')
          .select('id, fees')
          .eq('id', propId)
          .maybeSingle();

        if (propRow && Array.isArray(propRow.fees?._bookings)) {
          const updatedEmbedded = propRow.fees._bookings.map((b: BookingRecord) =>
            b && b.id === bookingId
              ? { ...b, status, ...(confirmedAt ? { confirmedAt } : {}) }
              : b
          );
          await client
            .from('listings')
            .update({
              fees: {
                ...propRow.fees,
                _bookings: updatedEmbedded,
              },
            })
            .eq('id', propId);
        }
      }
    } catch (err) {
      console.warn('[Setlla Supabase] Failed updating booking status:', err);
    }
  }
}

/**
 * Permanently deletes an inspection booking from Supabase and local storage
 */
export async function deleteBooking(bookingId: string): Promise<void> {
  try {
    const existing = getSavedLocalBookingsList();
    const updated = existing.filter((b) => b.id !== bookingId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}

  const client = getSupabaseClient();
  if (isSupabaseConfigured() && client) {
    try {
      await client.from('bookings').delete().eq('id', bookingId);
      await client.from('listings').delete().eq('id', bookingId);
    } catch (err) {
      console.warn('[Setlla Supabase] Failed deleting booking from cloud:', err);
    }
  }
}
