export type JobRoleType = 'Full-Time' | 'Contract' | 'Internship' | 'Part-Time';
export type JobWorkplaceType = 'On-Site' | 'Hybrid' | 'Remote';

export type UserPersona = 'job_seeker' | 'employer' | 'tenant' | 'lister';

export interface JobListing {
  id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  companyInitial: string;
  state: string; // e.g. "Delta State"
  city: string;  // e.g. "Asaba", "Warri", "Effurun"
  address: string; // Office address or landmark e.g. "Okpanam Road, Beside Zenith Bank, Asaba"
  workplaceType: JobWorkplaceType;
  roleType: JobRoleType;
  salaryRange: string; // e.g. "₦180,000 – ₦250,000 / month" or "Negotiable"
  postedDate: string; // e.g. "Posted 2 days ago"
  createdAt: string;
  summary: string; // 2-line truncated summary of key duties
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits?: string[];
  category: string; // e.g. "Technology", "Logistics", "Healthcare", "Real Estate"
  department?: string;
  slotsAvailable?: number;
  contactEmail?: string;
  isFeatured?: boolean;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  cvFileName: string;
  cvUrl: string;
  coverNote?: string;
  appliedAt: string;
  status: 'submitted' | 'reviewed' | 'shortlisted' | 'rejected';
}

export type PlatformRoom = 'rentals' | 'jobs';
