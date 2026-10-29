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
  const title = String(j.title || '').toLowerCase().trim();
  const company = String(j.companyName || j.company_name || '').toLowerCase().trim();
  const summary = String(j.summary || '').toLowerCase().trim();
  const desc = String(j.description || '').toLowerCase().trim();

  return Boolean(
    id.startsWith('job-asaba-') ||
    id.startsWith('job-warri-') ||
    id.startsWith('job-sapele-') ||
    id.startsWith('job-demo-') ||
    id.startsWith('demo-') ||
    id.startsWith('mock-') ||
    id.includes('test') ||
    title === 'test' ||
    title === 'test job' ||
    title === 'demo' ||
    title.startsWith('test ') ||
    company === 'test' ||
    company === 'test co' ||
    company.includes('test co') ||
    company === 'demo' ||
    summary === 'summary' ||
    (summary === 'test' && desc === 'test')
  );
};

/**
 * Loads all available job listings.
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

  // Save cleaned local jobs without demo items
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(localJobs));
  } catch (_) {}

  // If Supabase is configured, fetch live jobs from `job_listings` table
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        const { data, error } = await client.from('job_listings').select('*');
        if (!error && Array.isArray(data)) {
          const cloudJobs: JobListing[] = data
            .filter((d: any) => d && d.id && !deletedIds.has(d.id) && !isDemoOrTestJob(d))
            .map((d: any) => ({
              id: d.id,
              title: d.title,
              companyName: d.company_name || d.companyName,
              companyLogo: d.company_logo || d.companyLogo,
              companyInitial: d.company_initial || (d.company_name ? d.company_name.slice(0, 2).toUpperCase() : 'ST'),
              state: d.state || 'Delta State',
              city: d.city || 'Asaba',
              address: d.address || '',
              workplaceType: d.workplace_type || 'On-Site',
              roleType: d.role_type || 'Full-Time',
              salaryRange: d.salary_range || 'Negotiable',
              postedDate: d.posted_date || 'Recently Posted',
              createdAt: d.created_at || new Date().toISOString(),
              summary: d.summary || '',
              description: d.description || '',
              responsibilities: Array.isArray(d.responsibilities) ? d.responsibilities : [],
              requirements: Array.isArray(d.requirements) ? d.requirements : [],
              benefits: Array.isArray(d.benefits) ? d.benefits : [],
              category: d.category || 'General',
              isFeatured: Boolean(d.is_featured)
            }));

          localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(cloudJobs));
          return cloudJobs;
        }
      }
    } catch (e) {
      console.warn('[JobService] Cloud jobs sync notice:', e);
    }
  }

  // Normalize freemium fields (Free Organic ₦0 vs Sponsored Spotlight ₦2,000)
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

  // 1. Prepend to local storage
  const all = await getAllJobs();
  const updated = [newJob, ...all];
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}

  // 2. Sync to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        const baseRow = {
          id: newJob.id,
          title: newJob.title,
          company_name: newJob.companyName,
          company_logo: newJob.companyLogo || null,
          company_initial: newJob.companyInitial,
          state: newJob.state,
          city: newJob.city,
          address: newJob.address,
          workplace_type: newJob.workplaceType,
          role_type: newJob.roleType,
          salary_range: newJob.salaryRange,
          summary: newJob.summary,
          description: newJob.description,
          responsibilities: newJob.responsibilities,
          requirements: newJob.requirements,
          benefits: newJob.benefits,
          category: newJob.category,
          is_featured: newJob.isFeatured,
          created_at: newJob.createdAt,
        };

        const fullRow = newJob.contactEmail ? { ...baseRow, contact_email: newJob.contactEmail } : baseRow;
        const { error } = await client.from('job_listings').insert([fullRow]);
        if (error) {
          // If contact_email or optional column isn't in DB schema, retry with base columns
          console.warn('[JobService] Cloud job insert notice, retrying with core columns:', error.message);
          await client.from('job_listings').insert([baseRow]);
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

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        await client.from('job_listings').update({ is_featured: true }).eq('id', jobId);
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
  if (!user) return all.slice(0, 3);

  // Return jobs posted by this user
  const userJobs = all.filter((j) => {
    if (j.posterId && user.id && j.posterId === user.id) return true;
    if (j.posterEmail && user.email && j.posterEmail.toLowerCase() === user.email.toLowerCase()) return true;
    return false;
  });

  // If this employer hasn't posted a custom job yet, populate with 2 initial active mock jobs for their agency/company
  if (userJobs.length === 0) {
    return all.slice(0, 2).map((j, idx) => ({
      ...j,
      status: 'active' as const,
      isFeatured: idx === 0,
      listingFeePaid: idx === 0 ? 2000 : 0,
      paymentReference: idx === 0 ? `SET-JOB-INIT-${1000 + idx}` : 'FREE_ORGANIC_POST',
      posterId: user.id,
      posterEmail: user.email,
    }));
  }

  return userJobs;
}

/**
 * Toggles a job vacancy between active and closed.
 */
export async function toggleJobStatus(jobId: string, newStatus: 'active' | 'closed'): Promise<void> {
  const all = await getAllJobs();
  const updated = all.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j));
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}
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

  // 3. Dispatch cloud delete to Supabase table
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        await client.from('job_listings').delete().eq('id', jobId);
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
  const updated = all.map((j) => (j.id === jobId ? { ...j, isFeatured } : j));
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        await client.from('job_listings').update({ is_featured: isFeatured }).eq('id', jobId);
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

