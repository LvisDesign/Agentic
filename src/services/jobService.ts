import { JobListing, JobApplication } from '../types/jobs';
import { INITIAL_JOB_LISTINGS } from '../data/mockJobs';
import { AdvertStory } from '../data/mockAdverts';
import { isSupabaseConfigured, getSupabaseClient } from '../utils/supabaseClient';
import { UserProfile } from '../types/marketplace';
import { saveRegisteredUser, normalizePhoneNumber, normalizeEmail } from '../utils/userRegistry';
import { recordNotificationInInbox } from './notificationService';
import { showDeviceNotification } from '../utils/realtimeNotifications';

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
  const rowStatus = row.availability_status;
  if (
    rowStatus === 'Deleted' ||
    rowStatus === 'Archived' ||
    rowStatus === 'Inactive' ||
    rowStatus === 'Removed'
  ) {
    recordDeletedJobId(String(row.id));
    return null;
  }
  const embedded = row.fees?._jobData;
  if (embedded && typeof embedded === 'object' && embedded.id) {
    const resolvedStatus: 'active' | 'closed' | 'expired' =
      rowStatus === 'Rented Out'
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
          .neq('availability_status', 'Archived')
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

function mapApplicationToListingsRow(app: JobApplication, job?: JobListing) {
  return {
    id: app.id,
    title: app.jobTitle || job?.title || 'Job Application',
    state: 'Delta State',
    city: app.city || job?.city || 'Asaba',
    neighborhood: app.companyName || job?.companyName || 'Employer',
    full_address: job?.address || app.city || 'Asaba',
    property_type: '__JOB_APPLICATION__',
    bedrooms: 0,
    bathrooms: 0,
    toilets: 0,
    is_serviced: false,
    is_furnished: false,
    electricity_status: app.status || 'submitted',
    water_supply: app.roleType || job?.roleType || 'Full-Time',
    description: app.coverNote || '',
    media: app.cvUrl ? [{ type: 'image', url: app.cvUrl, caption: app.cvFileName }] : [],
    fees: {
      baseRent: 0,
      _applicationData: app,
    },
    inspection_fee: 0,
    agent: {
      id: app.posterId || job?.posterId || 'employer',
      fullName: app.applicantName,
      agencyName: app.companyName || job?.companyName || '',
      email: app.posterEmail || job?.posterEmail || job?.contactEmail || '',
      phone: app.posterPhone || job?.contactPhone || app.applicantPhone || '',
    },
    inspection_slots: [],
    inspection_days: [],
    tags: [app.jobId, app.status || 'submitted', app.applicantEmail || '', app.applicantPhone || ''],
    addons: [],
    availability_status: app.status === 'rejected' ? 'Rejected' : 'Available',
    created_at: app.appliedAt || new Date().toISOString(),
    last_confirmed_at: new Date().toISOString(),
  };
}

function mapListingsRowToApplication(row: any): JobApplication | null {
  if (!row || !row.id) return null;
  if (row.availability_status === 'Deleted' || row.availability_status === 'Archived') return null;

  const embedded = row.fees?._applicationData;
  if (embedded && typeof embedded === 'object' && embedded.id && embedded.jobId) {
    return {
      ...embedded,
      status: (row.electricity_status as any) || embedded.status || 'submitted',
    };
  }

  if (row.property_type !== '__JOB_APPLICATION__') return null;

  return {
    id: row.id,
    jobId: row.tags?.[0] || '',
    jobTitle: row.title || 'Job Role',
    companyName: row.neighborhood || row.agent?.agencyName || 'Employer',
    applicantId: 'CANDIDATE',
    applicantName: row.agent?.fullName || 'Applicant',
    applicantEmail: row.tags?.[2] || '',
    applicantPhone: row.tags?.[3] || row.agent?.phone || '',
    cvFileName: row.media?.[0]?.caption || 'Candidate_CV.pdf',
    cvUrl: row.media?.[0]?.url || '',
    coverNote: row.description || undefined,
    appliedAt: row.created_at || new Date().toISOString(),
    status: (row.electricity_status as any) || 'submitted',
    posterId: row.agent?.id,
    posterEmail: row.agent?.email,
    posterPhone: row.agent?.phone,
    city: row.city,
    roleType: row.water_supply,
  };
}

/**
 * Retrieves all cached applications synchronously from local storage.
 */
export function getSavedApplications(): JobApplication[] {
  try {
    const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

/**
 * Fetches all job applications from Supabase cloud (`listings` rows with `property_type = '__JOB_APPLICATION__'`
 * plus embedded `_jobData.applications` inside `__JOB_LISTING__` rows) and merges with local cache.
 */
export async function fetchAllJobApplications(): Promise<JobApplication[]> {
  const localApps = getSavedApplications();
  const deletedJobIds = getDeletedJobIds();

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        const { data, error } = await client
          .from('listings')
          .select('*')
          .in('property_type', ['__JOB_APPLICATION__', '__JOB_LISTING__'])
          .neq('availability_status', 'Deleted')
          .neq('availability_status', 'Archived')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const byId = new Map<string, JobApplication>();

          // 1. Standalone __JOB_APPLICATION__ rows (authoritative latest status)
          for (const row of data) {
            if (row.property_type === '__JOB_APPLICATION__') {
              const mapped = mapListingsRowToApplication(row);
              if (mapped && mapped.id && mapped.jobId && !deletedJobIds.has(mapped.jobId)) {
                byId.set(mapped.id, mapped);
              }
            }
          }

          // 2. Embedded applications inside __JOB_LISTING__ rows
          for (const row of data) {
            if (row.property_type === '__JOB_LISTING__' && !deletedJobIds.has(String(row.id))) {
              const embeddedApps = row.fees?._jobData?.applications;
              if (Array.isArray(embeddedApps)) {
                for (const app of embeddedApps) {
                  if (app && app.id && !byId.has(app.id)) {
                    byId.set(app.id, {
                      ...app,
                      jobId: app.jobId || row.id,
                      jobTitle: app.jobTitle || row.title,
                      companyName: app.companyName || row.agent?.agencyName || row.agent?.fullName || 'Employer',
                      posterId: app.posterId || row.agent?.id,
                      posterEmail: app.posterEmail || row.agent?.email,
                      posterPhone: app.posterPhone || row.agent?.phone,
                    });
                  }
                }
              }
            }
          }

          // 3. Merge any local applications that haven't finished uploading yet
          for (const local of localApps) {
            if (local && local.id && !byId.has(local.id) && !deletedJobIds.has(local.jobId)) {
              byId.set(local.id, local);
            }
          }

          const merged = Array.from(byId.values()).sort(
            (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
          );

          try {
            localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(merged));
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('setlla:job-applications-updated'));
            }
          } catch (_) {}

          return merged;
        }
      }
    } catch (e) {
      console.warn('[JobService] Cloud job applications sync notice:', e);
    }
  }

  return localApps.filter((a) => a && a.id && !deletedJobIds.has(a.jobId));
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
    if (user?.phone && app.applicantPhone && normalizePhoneNumber(app.applicantPhone) === normalizePhoneNumber(user.phone)) return true;
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
 * Uploads CV file to Supabase storage bucket (`property-media` or `resumes`) or generates a resilient Base64 Data URL fallback.
 */
export async function uploadCandidateCVFile(file: File, userId?: string): Promise<{ url: string; fileName: string }> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `resumes/${userId || 'candidate'}-${Date.now()}-${sanitizedName}`;

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        // 1. Upload to active public bucket `property-media` (configured in backend/schema.sql)
        const { data: propData, error: propErr } = await client.storage
          .from('property-media')
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (!propErr && propData?.path) {
          const { data: pubData } = client.storage.from('property-media').getPublicUrl(propData.path);
          if (pubData?.publicUrl) {
            return { url: pubData.publicUrl, fileName: file.name };
          }
        }

        // 2. Fallback attempt to `resumes` bucket if present
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

  // Fallback: convert file to Base64 Data URL so it persists across devices in JSONB
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve({ url: result, fileName: file.name });
    };
    reader.onerror = () => {
      resolve({ url: '', fileName: file.name });
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
 * Submits candidate application to Supabase (`public.listings` as `__JOB_APPLICATION__` + parent job `_jobData`)
 * and local registry so employers and administrators receive applications in real time across all devices.
 */
export async function submitJobApplication(params: ApplicationSubmissionParams): Promise<JobApplication> {
  const application: JobApplication = {
    id: `job-app-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    jobId: params.job.id,
    jobTitle: params.job.title,
    companyName: params.job.companyName,
    applicantId: params.user.id || 'GUEST_APPLICANT',
    applicantName: params.applicantName.trim(),
    applicantEmail: params.applicantEmail.trim(),
    applicantPhone: params.applicantPhone.trim(),
    cvFileName: params.cvFileName,
    cvUrl: params.cvUrl,
    coverNote: params.coverNote?.trim(),
    appliedAt: new Date().toISOString(),
    status: 'submitted',
    posterId: params.job.posterId,
    posterEmail: params.job.posterEmail || params.job.contactEmail,
    posterPhone: params.job.contactPhone,
    city: params.job.city,
    salaryRange: params.job.salaryRange,
    roleType: params.job.roleType,
  };

  // 1. Save to local storage for instant offline access & card state persistence
  const existing = getSavedApplications();
  const updatedApps = [application, ...existing.filter((a) => a.id !== application.id)];
  try {
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(updatedApps));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('setlla:job-applications-updated'));
    }
  } catch (_) {}

  // 2. Cache CV details to candidate profile for 1-tap future quick-applies
  saveCandidateCV(params.cvFileName, params.cvUrl, params.user);

  // 3. Persist to Supabase `public.listings` (both standalone `__JOB_APPLICATION__` row AND parent job `_jobData.applications`)
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        // A. Upsert standalone application row in `public.listings`
        const appRow = mapApplicationToListingsRow(application, params.job);
        await client.from('listings').upsert([appRow]);

        // B. Also embed inside parent job's `_jobData.applications` and increment `applicantsCount`
        const { data: jobRow } = await client
          .from('listings')
          .select('*')
          .eq('id', params.job.id)
          .maybeSingle();

        if (jobRow) {
          const currentJob = mapListingsRowToJob(jobRow) || params.job;
          const prevApps: JobApplication[] = Array.isArray(currentJob.applications) ? currentJob.applications : [];
          const nextApps = [application, ...prevApps.filter((a) => a && a.id !== application.id)];
          const updatedJob: JobListing = {
            ...currentJob,
            applicantsCount: nextApps.length,
            applications: nextApps,
          };
          await client.from('listings').upsert([mapJobToListingsRow(updatedJob)]);
        }
      }
    } catch (e) {
      console.warn('[JobService] Cloud application sync fallback (stored locally):', e);
    }
  }

  // 4. Notify applicant & employer inbox
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('setlla:trigger-notification', {
        detail: {
          eventKey: `job_app_sent_${application.id}`,
          title: 'Job Application Submitted',
          body: `Your application and CV for "${application.jobTitle}" at ${application.companyName} have been delivered.`,
          type: 'job_status_updated',
          actionText: 'View Applications',
        },
      })
    );
  }

  if (params.job.posterId || params.job.posterEmail || params.job.contactEmail || params.job.contactPhone) {
    recordNotificationInInbox({
      eventKey: `employer_job_app_${application.id}`,
      title: 'New Candidate Application',
      body: `${application.applicantName} applied for "${application.jobTitle}" with CV (${application.cvFileName}).`,
      type: 'job_application_received',
      recipientId: params.job.posterId,
      recipientEmail: params.job.posterEmail || params.job.contactEmail,
      recipientPhone: params.job.contactPhone,
      jobId: application.jobId,
      applicationId: application.id,
      actionLabel: 'Review Candidate CV',
    });
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

  // 3. Notify employer that their job vacancy has been published
  if (typeof window !== 'undefined') {
    const publishedTitle = 'Job Vacancy Published';
    const publishedBody = `"${newJob.title}" at ${newJob.companyName} (${newJob.city}) is now live on Setlla Jobs.`;
    window.dispatchEvent(
      new CustomEvent('setlla:trigger-notification', {
        detail: {
          eventKey: `job_published_${newJob.id}`,
          title: publishedTitle,
          body: publishedBody,
          type: 'job_published',
          actionText: 'View in Setlla Jobs',
        },
      })
    );
    showDeviceNotification(publishedTitle, {
      body: publishedBody,
    });
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

  const userPhoneNorm = user.phone ? normalizePhoneNumber(user.phone) : '';
  const userEmailNorm = user.email ? normalizeEmail(user.email) : '';
  const userCompanyNorm = (user.companyName || user.agencyName || '').toLowerCase().trim();
  const userFullNameNorm = (user.fullName || '').toLowerCase().trim();

  // Return jobs posted by this user (matched by ID, email, phone, company name, or poster name)
  const userJobs = all.filter((j) => {
    if (j.posterId && user.id && j.posterId === user.id) return true;
    if (userEmailNorm && j.posterEmail && normalizeEmail(j.posterEmail) === userEmailNorm) return true;
    if (userEmailNorm && j.contactEmail && normalizeEmail(j.contactEmail) === userEmailNorm) return true;
    if (userPhoneNorm && j.contactPhone && normalizePhoneNumber(j.contactPhone) === userPhoneNorm) return true;
    if (userCompanyNorm && j.companyName && j.companyName.toLowerCase().trim() === userCompanyNorm) return true;
    if (userFullNameNorm && j.posterName && j.posterName.toLowerCase().trim() === userFullNameNorm) return true;
    return false;
  });

  return userJobs;
}

/**
 * Retrieves all candidate applications submitted for an employer's job vacancies from Supabase cloud + local storage.
 */
export async function getEmployerApplications(
  user?: UserProfile | null,
  employerJobs?: JobListing[]
): Promise<JobApplication[]> {
  const [allApps, resolvedJobs] = await Promise.all([
    fetchAllJobApplications(),
    employerJobs ? Promise.resolve(employerJobs) : getEmployerJobs(user),
  ]);

  if (!user) return [];

  const jobIds = new Set(resolvedJobs.map((j) => j.id));
  const companyNames = new Set(
    resolvedJobs
      .map((j) => (j.companyName || '').toLowerCase().trim())
      .filter(Boolean)
  );
  if (user.companyName) companyNames.add(user.companyName.toLowerCase().trim());
  if (user.agencyName) companyNames.add(user.agencyName.toLowerCase().trim());

  const userPhoneNorm = user.phone ? normalizePhoneNumber(user.phone) : '';
  const userEmailNorm = user.email ? normalizeEmail(user.email) : '';

  return allApps.filter((app) => {
    if (jobIds.has(app.jobId)) return true;
    if (user.id && app.posterId && app.posterId === user.id) return true;
    if (userEmailNorm && app.posterEmail && normalizeEmail(app.posterEmail) === userEmailNorm) return true;
    if (userPhoneNorm && app.posterPhone && normalizePhoneNumber(app.posterPhone) === userPhoneNorm) return true;
    if (app.companyName && companyNames.has(app.companyName.toLowerCase().trim())) return true;
    return false;
  });
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
  let targetApp: JobApplication | undefined;
  const updated = existing.map((a) => {
    if (a.id === appId) {
      targetApp = { ...a, status };
      return targetApp;
    }
    return a;
  });
  try {
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('setlla:job-applications-updated'));
    }
  } catch (_) {}

  // Sync updated status to Supabase `public.listings` (`__JOB_APPLICATION__` row + parent job `_jobData.applications`)
  if (isSupabaseConfigured() && targetApp) {
    const appToSync = targetApp;
    (async () => {
      try {
        const client = getSupabaseClient();
        if (client) {
          await client.from('listings').upsert([mapApplicationToListingsRow(appToSync)]);

          if (appToSync.jobId) {
            const { data: jobRow } = await client
              .from('listings')
              .select('*')
              .eq('id', appToSync.jobId)
              .maybeSingle();

            if (jobRow) {
              const currentJob = mapListingsRowToJob(jobRow);
              if (currentJob && Array.isArray(currentJob.applications)) {
                const updatedJobApps = currentJob.applications.map((item) =>
                  item && item.id === appToSync.id ? { ...item, status } : item
                );
                await client.from('listings').upsert([
                  mapJobToListingsRow({
                    ...currentJob,
                    applications: updatedJobApps,
                  }),
                ]);
              }
            }
          }
        }
      } catch (e) {
        console.warn('[JobService] Cloud application status update notice:', e);
      }
    })();
  }

  if (targetApp && (status === 'shortlisted' || status === 'reviewed')) {
    const statusLabel = status === 'shortlisted' ? 'Shortlisted' : 'Reviewed';
    recordNotificationInInbox({
      eventKey: `job_app_status_${targetApp.id}_${status}`,
      title: `Application ${statusLabel}`,
      body: `${targetApp.companyName} marked your application for "${targetApp.jobTitle}" as ${statusLabel}.`,
      type: 'job_status_updated',
      recipientId: targetApp.applicantId,
      recipientEmail: targetApp.applicantEmail,
      recipientPhone: targetApp.applicantPhone,
      jobId: targetApp.jobId,
      applicationId: targetApp.id,
      actionLabel: 'View Application Status',
    });
  }
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
        const now = new Date().toISOString();
        await client
          .from('listings')
          .update({ availability_status: 'Archived', last_confirmed_at: now })
          .eq('id', jobId);
        try {
          await client.from('deleted_adverts').upsert({ id: jobId, deleted_at: now });
        } catch (_) {}
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

