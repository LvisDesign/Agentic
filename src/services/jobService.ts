import { JobListing, JobApplication } from '../types/jobs';
import { INITIAL_JOB_LISTINGS } from '../data/mockJobs';
import { AdvertStory } from '../data/mockAdverts';
import { isSupabaseConfigured, getSupabaseClient } from '../utils/supabaseClient';
import { UserProfile } from '../types/marketplace';
import { saveRegisteredUser } from '../utils/userRegistry';

const JOBS_STORAGE_KEY = 'setlla_job_listings';
const APPLICATIONS_STORAGE_KEY = 'setlla_job_applications';
const USER_SAVED_CV_KEY = 'setlla_saved_candidate_cv';

export interface SavedCandidateCV {
  fileName: string;
  fileSize?: number;
  dataUrl?: string;
  uploadedAt: string;
}

/**
 * Loads all available job listings.
 */
export async function getAllJobs(): Promise<JobListing[]> {
  let localJobs: JobListing[] = [];
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    if (raw) {
      localJobs = JSON.parse(raw);
    }
  } catch (_) {}

  if (!localJobs || localJobs.length === 0) {
    localJobs = INITIAL_JOB_LISTINGS;
    try {
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(localJobs));
    } catch (_) {}
  } else {
    // Ensure any newly added initial job listings (e.g. PPA corper roles) are synced in
    const existingIds = new Set(localJobs.map((j) => j.id));
    let hasNew = false;
    INITIAL_JOB_LISTINGS.forEach((initJob) => {
      if (!existingIds.has(initJob.id)) {
        localJobs.push(initJob);
        hasNew = true;
      }
    });
    if (hasNew) {
      try {
        localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(localJobs));
      } catch (_) {}
    }
  }

  // If Supabase is configured, attempt background sync with `job_listings` table
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        const { data, error } = await client.from('job_listings').select('*');
        if (!error && data && data.length > 0) {
          const cloudJobs: JobListing[] = data.map((d: any) => ({
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

          // Merge cloud jobs with local jobs ensuring no duplicates
          const jobMap = new Map<string, JobListing>();
          localJobs.forEach((j) => jobMap.set(j.id, j));
          cloudJobs.forEach((j) => jobMap.set(j.id, j));
          const merged = Array.from(jobMap.values());
          localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
      }
    } catch (e) {
      console.warn('[JobService] Cloud jobs sync fallback to local mock:', e);
    }
  }

  return localJobs;
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

