import { JobListing, JobApplication } from '../types/jobs';
import { INITIAL_JOB_LISTINGS } from '../data/mockJobs';
import { AdvertStory } from '../data/mockAdverts';
import { isSupabaseConfigured, getSupabaseClient } from '../utils/supabaseClient';
import { UserProfile } from '../types/marketplace';
import { saveRegisteredUser } from '../utils/userRegistry';

const JOBS_STORAGE_KEY = 'setlla_job_listings';
const DELETED_JOBS_STORAGE_KEY = 'setlla_deleted_job_ids';
const APPLICATIONS_STORAGE_KEY = 'setlla_job_applications';
const USER_SAVED_CV_KEY = 'setlla_saved_candidate_cv';

export interface SavedCandidateCV {
  fileName: string;
  fileSize?: number;
  dataUrl?: string;
  uploadedAt: string;
}

/**
 * Returns set of permanently deleted job listing IDs to prevent resurrection.
 */
export function getDeletedJobIds(): Set<string> {
  const set = new Set<string>();
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(DELETED_JOBS_STORAGE_KEY) : null;
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((id) => set.add(id));
      }
    }
  } catch (_) {}
  return set;
}

/**
 * Records a deleted job ID into the permanent tombstone registry.
 */
export function recordDeletedJobId(jobId: string): void {
  try {
    const set = getDeletedJobIds();
    set.add(jobId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DELETED_JOBS_STORAGE_KEY, JSON.stringify(Array.from(set)));
    }
  } catch (_) {}
}

/**
 * Detects whether a job is a dummy demo/mock/test vacancy.
 * Strips out test entries (e.g., "Test", "Test Co", "job-demo-*", "mock-*", etc.)
 */
export const isDemoOrTestJob = (j: any): boolean => {
  if (!j) return true;
  const id = String(j.id || '').toLowerCase().trim();

  return Boolean(
    id.startsWith('job-asaba-') ||
    id.startsWith('job-warri-') ||
    id.startsWith('job-sapele-') ||
    id.startsWith('job-demo-') ||
    id.startsWith('demo-') ||
    id.startsWith('mock-')
  );
};

function mapJobToListingsRow(job: JobListing) {
  return {
    id: job.id,
    title: job.title,
    state: job.state || 'Delta State',
    city: job.city || 'Asaba',
    neighborhood: job.address || job.city || 'Asaba',
    full_address: job.address || job.city || 'Asaba',
    property_type: '__JOB_LISTING__',
    bedrooms: 0,
    bathrooms: 0,
    toilets: 0,
    is_serviced: Boolean(job.isFeatured),
    is_furnished: false,
    electricity_status: job.workplaceType || 'On-Site',
    water_supply: job.roleType || 'Full-Time',
    description: job.description || job.summary || '',
    media: job.companyLogo ? [{ type: 'image', url: job.companyLogo }] : [],
    fees: {
      baseRent: job.listingFeePaid || 0,
      _jobData: job,
    },
    inspection_fee: job.listingFeePaid || 0,
    agent: {
      id: job.posterId || 'employer',
      fullName: job.posterName || job.companyName,
      agencyName: job.companyName,
      email: job.posterEmail || job.contactEmail,
      phone: job.contactPhone || '',
    },
    inspection_slots: [],
    inspection_days: [],
    tags: [job.category || 'General', job.roleType || 'Full-Time', job.workplaceType || 'On-Site'],
    addons: [],
    availability_status: job.status === 'closed' ? 'Rented Out' : job.status === 'expired' ? 'Expired' : 'Available',
    created_at: job.createdAt || new Date().toISOString(),
    last_confirmed_at: job.lastConfirmedAt || new Date().toISOString(),
  };
}

function mapListingsRowToJob(row: any): JobListing | null {
  if (!row || !row.id) return null;
  const embedded = row.fees?._jobData;
  if (embedded && typeof embedded === 'object' && embedded.id) {
    const rowStatus = row.availability_status;
    const resolvedStatus: 'active' | 'closed' | 'expired' =
      rowStatus === 'Deleted'
        ? 'expired'
        : rowStatus === 'Rented Out'
        ? 'closed'
        : embedded.status || 'active';
    return {
      ...embedded,
      status: resolvedStatus,
      isFeatured: Boolean(row.is_serviced ?? embedded.isFeatured),
      lastConfirmedAt: row.last_confirmed_at || embedded.lastConfirmedAt,
    };
  }
  return {
    id: row.id,
    title: row.title || 'Open Role',
    companyName: row.agent?.agencyName || row.agent?.fullName || 'Hiring Company',
    companyLogo: row.media?.[0]?.url || undefined,
    companyInitial: (row.agent?.agencyName || row.title || 'SJ').slice(0, 2).toUpperCase(),
    state: row.state || 'Delta State',
    city: row.city || 'Asaba',
    address: row.full_address || row.neighborhood || '',
    workplaceType: (row.electricity_status as any) || 'On-Site',
    roleType: (row.water_supply as any) || 'Full-Time',
    salaryRange: row.fees?.salaryRange || 'Negotiable',
    postedDate: 'Recently Posted',
    createdAt: row.created_at || new Date().toISOString(),
    lastConfirmedAt: row.last_confirmed_at || row.created_at || new Date().toISOString(),
    summary: (row.description || '').slice(0, 140),
    description: row.description || '',
    responsibilities: [],
    requirements: [],
    benefits: [],
    category: row.tags?.[0] || 'General',
    contactEmail: row.agent?.email,
    contactPhone: row.agent?.phone,
    posterId: row.agent?.id,
    posterEmail: row.agent?.email,
    posterName: row.agent?.fullName,
    isFeatured: Boolean(row.is_serviced),
    status: row.availability_status === 'Rented Out' ? 'closed' : 'active',
  };
}

/**
 * Loads all available job listings from Supabase (`listings` table where `property_type = '__JOB_LISTING__'`)
 * and merges any unsynced local jobs.
 */
export async function getAllJobs(): Promise<JobListing[]> {
  const deletedIds = getDeletedJobIds();

  let localJobs: JobListing[] = [];
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localJobs = parsed.filter((j) => j && j.id && !deletedIds.has(j.id) && !isDemoOrTestJob(j));
      }
    }
  } catch (_) {}

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        const { data, error } = await client
          .from('listings')
          .select('*')
          .eq('property_type', '__JOB_LISTING__')
          .neq('availability_status', 'Deleted')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const cloudJobs: JobListing[] = data
            .map((row: any) => mapListingsRowToJob(row))
            .filter((j): j is JobListing => Boolean(j && j.id && !deletedIds.has(j.id) && !isDemoOrTestJob(j)));

          try {
            localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(cloudJobs));
          } catch (_) {}
          return cloudJobs;
        }
      }
    } catch (e) {
      console.warn('[JobService] Cloud jobs sync notice:', e);
    }
  }

  // Fallback to local jobs if offline or network call failed
  return localJobs.map((j) => ({
    ...j,
    isFeatured: Boolean(j.isFeatured),
    listingFeePaid: j.listingFeePaid !== undefined ? j.listingFeePaid : (j.isFeatured ? 2000 : 0),
    paymentReference: j.paymentReference || (j.isFeatured ? `SET-PAY-${j.id.slice(-6)}` : 'FREE_ORGANIC_POST'),
  }));
}

/**
 * Retrieves all applications submitted by candidate.
 */
export function getSavedApplications(): JobApplication[] {
  try {
    const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

/**
 * Checks if a user has already submitted an application for this specific job.
 */
export function hasUserApplied(jobId: string, user?: UserProfile | null): boolean {
  if (!jobId) return false;
  const applications = getSavedApplications();
  return applications.some((app) => {
    if (app.jobId !== jobId) return false;
    if (user?.id && app.applicantId === user.id) return true;
    if (user?.email && app.applicantEmail && app.applicantEmail.toLowerCase() === user.email.toLowerCase()) return true;
    if (user?.phone && app.applicantPhone && app.applicantPhone === user.phone) return true;
    return false;
  });
}

/**
 * Retrieves candidate's previously uploaded CV from cache or profile.
 */
export function getSavedCandidateCV(user?: UserProfile | null): SavedCandidateCV | null {
  // Check user profile first
  if (user?.cvFileName && user?.cvUrl) {
    return {
      fileName: user.cvFileName,
      dataUrl: user.cvUrl,
      uploadedAt: new Date().toISOString()
    };
  }

  // Fallback to local storage saved CV
  try {
    const raw = localStorage.getItem(USER_SAVED_CV_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_) {}

  return null;
}

/**
 * Saves candidate CV to local cache and updates active user profile.
 */
export function saveCandidateCV(fileName: string, dataUrl: string, user?: UserProfile | null): void {
  const cvData: SavedCandidateCV = {
    fileName,
    dataUrl,
    uploadedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(USER_SAVED_CV_KEY, JSON.stringify(cvData));
  } catch (_) {}

  if (user && user.id) {
    const updated: UserProfile = {
      ...user,
      cvUrl: dataUrl,
      cvFileName: fileName
    };
    saveRegisteredUser(updated);
    try {
      localStorage.setItem('setlla_user', JSON.stringify(updated));
    } catch (_) {}
  }
}

/**
 * Uploads CV file to Supabase storage bucket `resumes` (or generates resilient data URL fallback).
 */
export async function uploadCandidateCVFile(file: File, userId?: string): Promise<{ url: string; fileName: string }> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `resumes/${userId || 'candidate'}-${Date.now()}-${sanitizedName}`;

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        // Attempt upload to `resumes` bucket
        const { data, error } = await client.storage
          .from('resumes')
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (!error && data?.path) {
          const { data: pubData } = client.storage.from('resumes').getPublicUrl(data.path);
          if (pubData?.publicUrl) {
            return { url: pubData.publicUrl, fileName: file.name };
          }
        }
      }
    } catch (err) {
      console.warn('[JobService] Cloud resume bucket upload notice:', err);
    }
  }

  // Fallback: convert file to local object URL / base64 for seamless zero-failure candidate experience
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : URL.createObjectURL(file);
      resolve({ url: result, fileName: file.name });
    };
    reader.onerror = () => {
      resolve({ url: URL.createObjectURL(file), fileName: file.name });
    };
    reader.readAsDataURL(file);
  });
}

export interface ApplicationSubmissionParams {
  job: JobListing;
  user: UserProfile;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  cvFileName: string;
  cvUrl: string;
  coverNote?: string;
}

/**
 * Submits candidate application to `public.job_applications` and local registry.
 */
export async function submitJobApplication(params: ApplicationSubmissionParams): Promise<JobApplication> {
  const application: JobApplication = {
    id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    jobId: params.job.id,
    jobTitle: params.job.title,
    companyName: params.job.companyName,
    applicantId: params.user.id || 'GUEST_APPLICANT',
    applicantName: params.applicantName,
    applicantEmail: params.applicantEmail,
    applicantPhone: params.applicantPhone,
    cvFileName: params.cvFileName,
    cvUrl: params.cvUrl,
    coverNote: params.coverNote?.trim(),
    appliedAt: new Date().toISOString(),
    status: 'submitted'
  };

  // 1. Save to local storage for instant offline access & card state persistence
  const existing = getSavedApplications();
  existing.unshift(application);
  try {
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(existing));
  } catch (_) {}

  // 2. Cache CV details to candidate profile for 1-tap future quick-applies
  saveCandidateCV(params.cvFileName, params.cvUrl, params.user);

  // 3. Persist to Supabase `public.job_applications`
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        await client.from('job_applications').insert([
          {
            id: application.id,
            job_id: application.jobId,
            job_title: application.jobTitle,
            company_name: application.companyName,
            applicant_id: application.applicantId,
            applicant_name: application.applicantName,
            applicant_email: application.applicantEmail,
            applicant_phone: application.applicantPhone,
            cv_file_name: application.cvFileName,
            cv_url: application.cvUrl,
            cover_note: application.coverNote || null,
            status: application.status,
            applied_at: application.appliedAt
          }
        ]);
      }
    } catch (e) {
      console.warn('[JobService] Cloud application insert fallback (stored locally):', e);
    }
  }

  return application;
}

export interface CreateJobListingParams {
  title: string;
  companyName: string;
  companyLogo?: string;
  city: string;
  address: string;
  workplaceType: JobListing['workplaceType'];
  roleType: JobListing['roleType'];
  salaryRange: string;
  summary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits?: string[];
  category: string;
  contactEmail?: string;
  contactPhone?: string;
  posterId?: string;
  posterEmail?: string;
  posterName?: string;
  paymentReference?: string;
  listingFeePaid?: number;
  isFeatured?: boolean;
}

/**
 * Creates a new job listing under the Indeed freemium model:
 * - Free Organic Listing (₦0)
 * - Sponsored Spotlight Boost (₦2,000 flat boost)
 */
export async function createJobListing(params: CreateJobListingParams): Promise<JobListing> {
  const isFeatured = params.isFeatured ?? (params.listingFeePaid && params.listingFeePaid > 0 ? true : false);
  const listingFeePaid = params.listingFeePaid !== undefined ? params.listingFeePaid : (isFeatured ? 2000 : 0);
  const paymentReference = params.paymentReference || (isFeatured ? `SET-PAY-${Date.now().toString().slice(-6)}` : `SET-ORG-${Date.now().toString().slice(-6)}`);

  const newJob: JobListing = {
    id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: params.title.trim(),
    companyName: params.companyName.trim(),
    companyLogo: params.companyLogo,
    companyInitial: params.companyName.trim().slice(0, 2).toUpperCase() || 'SJ',
    state: 'Delta State',
    city: params.city,
    address: params.address.trim(),
    workplaceType: params.workplaceType,
    roleType: params.roleType,
    salaryRange: params.salaryRange.trim() || 'Negotiable',
    postedDate: 'Just now',
    createdAt: new Date().toISOString(),
    lastConfirmedAt: new Date().toISOString(),
    summary: params.summary.trim(),
    description: params.description.trim(),
    responsibilities: params.responsibilities.filter(Boolean),
    requirements: params.requirements.filter(Boolean),
    benefits: params.benefits?.filter(Boolean) || [],
    category: params.category,
    contactEmail: params.contactEmail?.trim(),
    contactPhone: params.contactPhone?.trim(),
    isFeatured,
    posterId: params.posterId,
    posterEmail: params.posterEmail,
    posterName: params.posterName,
    status: 'active',
    paymentReference,
    listingFeePaid,
    viewsCount: 1,
    applicantsCount: 0,
  };

  // 1. Prepend to local storage immediately
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    const existing: JobListing[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify([newJob, ...existing.filter((j) => j.id !== newJob.id)]));
  } catch (_) {}

  // 2. Sync to Supabase `listings` table (`property_type = '__JOB_LISTING__'`) so it persists across refreshes & devices
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        const row = mapJobToListingsRow(newJob);
        const { error } = await client.from('listings').upsert([row]);
        if (error) {
          console.warn('[JobService] Cloud job upsert notice:', error.message);
        }
      }
    } catch (e) {
      console.warn('[JobService] Cloud job insert notice:', e);
    }
  }

  return newJob;
}

/**
 * Upgrades an existing free organic job listing to a Sponsored Spotlight listing (₦2,000 boost).
 */
export async function sponsorJobListing(jobId: string, paymentReference: string): Promise<JobListing | null> {
  const all = await getAllJobs();
  let updatedJob: JobListing | null = null;

  const updated = all.map((j) => {
    if (j.id === jobId) {
      updatedJob = {
        ...j,
        isFeatured: true,
        listingFeePaid: 2000,
        paymentReference,
      };
      return updatedJob;
    }
    return j;
  });

  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}

  if (isSupabaseConfigured() && updatedJob) {
    try {
      const client = getSupabaseClient();
      if (client) {
        await client.from('listings').upsert([mapJobToListingsRow(updatedJob)]);
      }
    } catch (e) {
      console.warn('[JobService] Cloud sponsor update notice:', e);
    }
  }

  return updatedJob;
}

/**
 * Retrieves jobs posted by an employer/job agent.
 */
export async function getEmployerJobs(user?: UserProfile | null): Promise<JobListing[]> {
  const all = await getAllJobs();
  if (!user) return [];

  // Return jobs posted by this user
  const userJobs = all.filter((j) => {
    if (j.posterId && user.id && j.posterId === user.id) return true;
    if (j.posterEmail && user.email && j.posterEmail.toLowerCase() === user.email.toLowerCase()) return true;
    if (j.companyName && (user.companyName || user.agencyName) && j.companyName.toLowerCase() === (user.companyName || user.agencyName || '').toLowerCase()) return true;
    return false;
  });

  return userJobs;
}

/**
 * Toggles a job vacancy between active and closed.
 * If closed, records takenAt timestamp to initiate 24-hour cleanup countdown.
 * If reactivated, resets lastConfirmedAt to now.
 */
export async function toggleJobStatus(jobId: string, newStatus: 'active' | 'closed' | 'expired'): Promise<void> {
  const all = await getAllJobs();
  const now = new Date().toISOString();
  let targetModified: JobListing | null = null;
  const updated = all.map((j) => {
    if (j.id !== jobId) return j;
    const modified: JobListing = { ...j, status: newStatus };
    if (newStatus === 'closed') {
      modified.takenAt = now;
    } else if (newStatus === 'active') {
      modified.lastConfirmedAt = now;
      modified.takenAt = undefined;
    }
    targetModified = modified;
    return modified;
  });

  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}

  if (isSupabaseConfigured() && targetModified) {
    try {
      const client = getSupabaseClient();
      if (client) {
        await client.from('listings').upsert([mapJobToListingsRow(targetModified)]);
      }
    } catch (_) {}
  }
}

/**
 * Confirms job vacancy availability / proof-of-life heartbeat
 */
export async function confirmJobFreshness(jobId: string): Promise<void> {
  const all = await getAllJobs();
  const now = new Date().toISOString();
  let targetModified: JobListing | null = null;
  const updated = all.map((j) => {
    if (j.id !== jobId) return j;
    const mod: JobListing = { ...j, lastConfirmedAt: now, status: 'active' as const, takenAt: undefined };
    targetModified = mod;
    return mod;
  });

  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}

  if (isSupabaseConfigured() && targetModified) {
    try {
      const client = getSupabaseClient();
      if (client) {
        await client.from('listings').upsert([mapJobToListingsRow(targetModified)]);
      }
    } catch (_) {}
  }
}

/**
 * Updates review status of a candidate application.
 */
export function updateApplicationReviewStatus(
  appId: string, 
  status: 'submitted' | 'reviewed' | 'shortlisted' | 'rejected'
): void {
  const existing = getSavedApplications();
  const updated = existing.map((a) => (a.id === appId ? { ...a, status } : a));
  try {
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}
}

/**
 * Permanently removes a job vacancy from storage and synced tables.
 */
export async function deleteJobListing(jobId: string): Promise<void> {
  // 1. Immediately register tombstone to prevent resurrection
  recordDeletedJobId(jobId);

  // 2. Cleanse active local jobs synchronously
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((j: any) => j && j.id !== jobId);
        localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(filtered));
      }
    }
  } catch (_) {}

  // 3. Dispatch cloud delete to Supabase `listings` table
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        await client.from('listings').delete().eq('id', jobId);
      }
    } catch (e) {
      console.warn('[JobService] Cloud job delete notice:', e);
    }
  }
}

/**
 * Toggles a job vacancy's featured spotlight status.
 */
export async function toggleJobFeatured(jobId: string, isFeatured: boolean): Promise<void> {
  const all = await getAllJobs();
  let targetJob: JobListing | null = null;
  const updated = all.map((j) => {
    if (j.id === jobId) {
      targetJob = { ...j, isFeatured };
      return targetJob;
    }
    return j;
  });
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}

  if (isSupabaseConfigured() && targetJob) {
    try {
      const client = getSupabaseClient();
      if (client) {
        await client.from('listings').upsert([mapJobToListingsRow(targetJob)]);
      }
    } catch (e) {
      console.warn('[JobService] Cloud job update notice:', e);
    }
  }
}



export type JobsFeedItem = 
  | { type: 'job'; job: JobListing; key: string }
  | { type: 'advert'; advert: AdvertStory; key: string }
  | { type: 'carousel'; adverts: AdvertStory[]; key: string };

/**
 * Injects sponsored ads directly among job offers as users scroll:
 * - After 2nd job card (idx === 1) or 1st job if only 1 exists: in-feed sponsored promotions carousel
 * - After 5th job card (idx === 4): featured native billboard card
 * - Every 3-4 cards thereafter: alternating in-feed promos and billboard cards
 */
export function injectNativeBillboardAds(
  jobs: JobListing[], 
  adverts: AdvertStory[]
): JobsFeedItem[] {
  if (!jobs || jobs.length === 0) return [];
  if (!adverts || adverts.length === 0) {
    return jobs.map((j, idx) => ({ type: 'job', job: j, key: `job-${j.id}-${idx}` }));
  }

  const items: JobsFeedItem[] = [];
  let adIndex = 0;

  jobs.forEach((job, idx) => {
    items.push({ type: 'job', job, key: `job-${job.id}-${idx}` });

    // Seat sponsored ads among job offers as users scroll:
    // 1. After 2nd job card (idx === 1), or after 1st job if only 1 exists
    // 2. After 5th job card (idx === 4)
    // 3. Every 3-4 cards thereafter as users continue scrolling down
    const isFirstAdSlot = idx === 1 || (jobs.length === 1 && idx === 0);
    const isSubsequentAdSlot = idx > 1 && (idx - 1) % 3 === 0;

    if (isFirstAdSlot || isSubsequentAdSlot) {
      if (isFirstAdSlot) {
        // First in-feed ad slot: Rich swipeable sponsored carousel of Delta State promotions
        items.push({
          type: 'carousel',
          adverts,
          key: `ad-carousel-${idx}`,
        });
      } else if (Math.floor((idx - 1) / 3) % 2 === 1) {
        // Prominent full partner billboard ad card
        const ad = adverts[adIndex % adverts.length];
        items.push({
          type: 'advert',
          advert: ad,
          key: `ad-billboard-${ad.id}-${idx}`,
        });
        adIndex++;
      } else {
        // Secondary carousel rotation
        items.push({
          type: 'carousel',
          adverts: [...adverts].reverse(),
          key: `ad-carousel-${idx}`,
        });
      }
    }
  });

  return items;
}

