import { BookingRecord, PropertyListing } from '../types/marketplace';
import { JobApplication, JobListing } from '../types/jobs';

const APP_PORTAL_URL = 'https://setlla.com';
const dispatchedEmailKeys = new Set<string>();

function isValidEmail(email?: string): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

async function dispatchTransactionalEmail(params: {
  dedupKey: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  fromName?: string;
  eventType: string;
  metadata: Record<string, string>;
}): Promise<boolean> {
  if (!isValidEmail(params.to)) return false;

  if (dispatchedEmailKeys.has(params.dedupKey)) {
    return true;
  }
  dispatchedEmailKeys.add(params.dedupKey);

  const recipient = params.to.trim();

  // 1. Primary Delivery: Serverless API Route (/api/send-admin-notification)
  try {
    const res = await fetch('/api/send-admin-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: [recipient],
        subject: params.subject,
        text: params.text,
        html: params.html,
        replyTo: params.replyTo || 'support@setlla.com',
        fromName: params.fromName || 'Setlla Notifications',
        eventType: params.eventType,
        metadata: params.metadata,
      }),
    });

    if (res.ok) {
      return true;
    }
  } catch (_) {
    // Fall through to direct browser AJAX relay if running on static preview
  }

  // 2. Fallback Delivery: Direct FormSubmit AJAX relay
  try {
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: params.subject,
        _template: 'box',
        _captcha: 'false',
        ...params.metadata,
        Message: params.text,
      }),
    });
    return true;
  } catch (err) {
    console.warn('[TransactionalEmail] Delivery notice:', err);
    return false;
  }
}

/**
 * 1. Sends an instant email alert to the Property Agent when a user books an inspection slot.
 */
export async function sendInspectionRequestToAgentEmail(
  booking: BookingRecord,
  listing?: PropertyListing
): Promise<boolean> {
  const agentEmail = listing?.agent?.email?.trim();
  if (!isValidEmail(agentEmail)) return false;

  const propTitle = listing?.title || 'Listed Property';
  const propLocation = listing ? `${listing.neighborhood}, ${listing.city}` : 'Delta State';
  const slotInfo = `${booking.slotDate} (${booking.slotTimeWindow})`;
  const isStandby = booking.status === 'QUEUED';
  const subject = `[Setlla] ${isStandby ? 'New Standby Inspection Request' : 'New Inspection Request'}: ${propTitle}`;

  const text = [
    `Hello ${listing?.agent?.fullName || 'Partner Agent'},`,
    ``,
    `${booking.applicantName} has just booked an inspection slot for "${propTitle}" (${propLocation}) on Setlla.`,
    ``,
    `INSPECTION REQUEST DETAILS:`,
    `- Property: ${propTitle}`,
    `- Location: ${propLocation}`,
    `- Requested Slot: ${slotInfo}`,
    `- Applicant Name: ${booking.applicantName}`,
    `- Applicant Phone: ${booking.applicantPhone}`,
    booking.applicantEmail ? `- Applicant Email: ${booking.applicantEmail}` : '',
    `- Booking Reference: ${booking.id}`,
    `- Request Status: ${isStandby ? `Standby Queue (#${booking.queuePosition || 1})` : 'Awaiting Your Confirmation'}`,
    ``,
    `Respond now in your Setlla Agent Portal to unlock direct contact with the tenant:`,
    `${APP_PORTAL_URL}`,
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FCF9F5; border: 1px solid #EFE3C6; border-radius: 16px; overflow: hidden;">
      <div style="background-color: #000004; padding: 22px 24px; border-bottom: 2px solid #FFAD05;">
        <span style="display: inline-block; background-color: #FFAD05; color: #000004; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; margin-bottom: 8px;">
          ${isStandby ? 'Standby Inspection Request' : 'New Inspection Request'}
        </span>
        <h2 style="color: #FFFFFF; margin: 0; font-size: 19px; font-weight: 700;">
          ${booking.applicantName} requested to inspect "${propTitle}"
        </h2>
      </div>
      <div style="padding: 24px; color: #1C1613; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Hello <strong>${listing?.agent?.fullName || 'Partner Agent'}</strong>, a prospective tenant has booked an inspection slot for your property. Please review and approve or decline the slot on Setlla.</p>
        <div style="background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin: 18px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #70798C; width: 38%;">Property</td>
              <td style="padding: 6px 0; font-weight: 700; color: #000004;">${propTitle} (${propLocation})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #70798C;">Inspection Window</td>
              <td style="padding: 6px 0; font-weight: 700; color: #B45309;">${slotInfo}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #70798C;">Applicant Name</td>
              <td style="padding: 6px 0; font-weight: 600; color: #000004;">${booking.applicantName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #70798C;">Applicant Phone</td>
              <td style="padding: 6px 0; font-weight: 600; color: #000004;">${booking.applicantPhone}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #70798C;">Booking Ref</td>
              <td style="padding: 6px 0; font-family: monospace; color: #342A21;">${booking.id}</td>
            </tr>
          </table>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${APP_PORTAL_URL}" style="display: inline-block; background-color: #000004; color: #FFAD05; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 26px; border-radius: 12px; border: 1px solid #FFAD05;">
            Approve or Respond on Setlla &rarr;
          </a>
        </div>
      </div>
    </div>
  `;

  return dispatchTransactionalEmail({
    dedupKey: `agent_booking_req_${booking.id}`,
    to: agentEmail!,
    subject,
    text,
    html,
    replyTo: booking.applicantEmail || 'support@setlla.com',
    fromName: 'Setlla Inspections',
    eventType: 'inspection_request',
    metadata: {
      Event: 'New Property Inspection Request',
      Property: `${propTitle} (${propLocation})`,
      Inspection_Slot: slotInfo,
      Applicant_Name: booking.applicantName,
      Applicant_Phone: booking.applicantPhone,
      Booking_Reference: booking.id,
      Action_URL: APP_PORTAL_URL,
    },
  });
}

/**
 * 2. Sends an instant booking confirmation email to the Tenant when they book an inspection slot.
 */
export async function sendInspectionSubmittedToTenantEmail(
  booking: BookingRecord,
  listing?: PropertyListing
): Promise<boolean> {
  if (!isValidEmail(booking.applicantEmail)) return false;

  const propTitle = listing?.title || 'Selected Property';
  const propLocation = listing ? `${listing.neighborhood}, ${listing.city}` : 'Delta State';
  const slotInfo = `${booking.slotDate} (${booking.slotTimeWindow})`;
  const subject = `[Setlla] Inspection Request Sent: ${propTitle}`;

  const text = [
    `Hello ${booking.applicantName},`,
    ``,
    `Your inspection request for "${propTitle}" (${propLocation}) has been sent to the listing agent (${listing?.agent?.fullName || 'Verified Agent'}).`,
    ``,
    `- Requested Slot: ${slotInfo}`,
    `- Booking Reference: ${booking.id}`,
    `- Status: ${booking.status === 'QUEUED' ? `Standby Queue (#${booking.queuePosition || 1})` : 'Awaiting Agent Confirmation'}`,
    ``,
    `You will receive an instant notification and email with the unlocked street address and agent phone number as soon as the agent confirms your slot.`,
    ``,
    `Track your pass anytime at: ${APP_PORTAL_URL}`,
  ].join('\n');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FCF9F5; border: 1px solid #EFE3C6; border-radius: 16px; overflow: hidden;">
      <div style="background-color: #000004; padding: 22px 24px; border-bottom: 2px solid #FFAD05;">
        <span style="display: inline-block; background-color: #FFAD05; color: #000004; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; margin-bottom: 8px;">
          Inspection Request Sent
        </span>
        <h2 style="color: #FFFFFF; margin: 0; font-size: 19px; font-weight: 700;">
          Your request for "${propTitle}" is with the agent
        </h2>
      </div>
      <div style="padding: 24px; color: #1C1613; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Hello <strong>${booking.applicantName}</strong>, we have notified <strong>${listing?.agent?.fullName || 'the property agent'}</strong> of your inspection request. As soon as they confirm, your inspection pass and direct agent contact will unlock automatically.</p>
        <div style="background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin: 18px 0;">
          <p style="margin: 4px 0;"><strong>Property:</strong> ${propTitle} (${propLocation})</p>
          <p style="margin: 4px 0;"><strong>Requested Slot:</strong> ${slotInfo}</p>
          <p style="margin: 4px 0;"><strong>Booking Ref:</strong> ${booking.id}</p>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${APP_PORTAL_URL}" style="display: inline-block; background-color: #000004; color: #FFAD05; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 26px; border-radius: 12px; border: 1px solid #FFAD05;">
            View Inspection Pass on Setlla &rarr;
          </a>
        </div>
      </div>
    </div>
  `;

  return dispatchTransactionalEmail({
    dedupKey: `tenant_booking_submitted_${booking.id}`,
    to: booking.applicantEmail!,
    subject,
    text,
    html,
    replyTo: listing?.agent?.email || 'support@setlla.com',
    fromName: 'Setlla Inspections',
    eventType: 'inspection_submitted',
    metadata: {
      Event: 'Inspection Request Submitted',
      Property: `${propTitle} (${propLocation})`,
      Inspection_Slot: slotInfo,
      Booking_Reference: booking.id,
      Action_URL: APP_PORTAL_URL,
    },
  });
}

/**
 * 3. Sends an instant email to the Tenant when an Agent responds (Approves or Declines) their inspection request.
 */
export async function sendInspectionResponseToTenantEmail(
  booking: BookingRecord,
  listing: PropertyListing | undefined,
  decision: 'approved' | 'declined'
): Promise<boolean> {
  if (!isValidEmail(booking.applicantEmail)) return false;

  const propTitle = listing?.title || 'Property Listing';
  const propLocation = listing ? `${listing.neighborhood}, ${listing.city}` : 'Delta State';
  const slotInfo = `${booking.slotDate} (${booking.slotTimeWindow})`;
  const isApproved = decision === 'approved';

  const subject = isApproved
    ? `[Setlla] Inspection Approved & Contact Unlocked: ${propTitle}`
    : `[Setlla] Inspection Request Update: ${propTitle}`;

  const text = isApproved
    ? [
        `Hello ${booking.applicantName},`,
        ``,
        `Great news! ${listing?.agent?.fullName || 'The property agent'} has APPROVED your inspection request for "${propTitle}".`,
        ``,
        `UNLOCKED INSPECTION PASS & AGENT COORDINATES:`,
        `- Property: ${propTitle}`,
        `- Full Address: ${listing?.fullAddress || propLocation}`,
        `- Confirmed Slot: ${slotInfo}`,
        `- Agent Name: ${listing?.agent?.fullName || 'Verified Agent'}`,
        `- Agent Direct Phone: ${listing?.agent?.phone || 'Available in app'}`,
        `- Agent WhatsApp: ${listing?.agent?.whatsapp || listing?.agent?.phone || 'Available in app'}`,
        `- Pass Reference: ${booking.id}`,
        ``,
        `Open Setlla to view your digital QR Inspection Pass or call/WhatsApp the agent directly:`,
        `${APP_PORTAL_URL}`,
      ].join('\n')
    : [
        `Hello ${booking.applicantName},`,
        ``,
        `The agent for "${propTitle}" (${propLocation}) was unable to accommodate the requested inspection slot (${slotInfo}).`,
        ``,
        `You can visit Setlla to select an alternative inspection window or explore other verified properties in ${listing?.city || 'Delta State'}:`,
        `${APP_PORTAL_URL}`,
      ].join('\n');

  const html = isApproved
    ? `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FCF9F5; border: 1px solid #EFE3C6; border-radius: 16px; overflow: hidden;">
      <div style="background-color: #000004; padding: 22px 24px; border-bottom: 2px solid #10B981;">
        <span style="display: inline-block; background-color: #10B981; color: #FFFFFF; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; margin-bottom: 8px;">
          Inspection Approved &bull; Contact Unlocked
        </span>
        <h2 style="color: #FFFFFF; margin: 0; font-size: 19px; font-weight: 700;">
          Your inspection pass for "${propTitle}" is ready!
        </h2>
      </div>
      <div style="padding: 24px; color: #1C1613; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Hello <strong>${booking.applicantName}</strong>, <strong>${listing?.agent?.fullName || 'the listing agent'}</strong> has approved your inspection request. Your direct contact details and full property address are now unlocked below:</p>
        <div style="background-color: #FFFFFF; border: 1px solid #A7F3D0; border-radius: 12px; padding: 16px; margin: 18px 0;">
          <p style="margin: 5px 0;"><strong>Property:</strong> ${propTitle}</p>
          <p style="margin: 5px 0;"><strong>Unlocked Street Address:</strong> ${listing?.fullAddress || propLocation}</p>
          <p style="margin: 5px 0;"><strong>Confirmed Slot:</strong> <span style="color: #047857; font-weight: 700;">${slotInfo}</span></p>
          <p style="margin: 5px 0;"><strong>Agent Name:</strong> ${listing?.agent?.fullName || 'Verified Agent'}</p>
          <p style="margin: 5px 0;"><strong>Agent Direct Phone:</strong> <a href="tel:${listing?.agent?.phone || ''}" style="color: #000004; font-weight: 700;">${listing?.agent?.phone || 'Open app'}</a></p>
          <p style="margin: 5px 0;"><strong>Pass Reference:</strong> <span style="font-family: monospace;">${booking.id}</span></p>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${APP_PORTAL_URL}" style="display: inline-block; background-color: #000004; color: #FFAD05; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 26px; border-radius: 12px; border: 1px solid #FFAD05;">
            Open Unlocked Pass on Setlla &rarr;
          </a>
        </div>
      </div>
    </div>
  `
    : `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FCF9F5; border: 1px solid #EFE3C6; border-radius: 16px; overflow: hidden;">
      <div style="background-color: #000004; padding: 22px 24px; border-bottom: 2px solid #F59E0B;">
        <span style="display: inline-block; background-color: #F59E0B; color: #000004; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; margin-bottom: 8px;">
          Inspection Slot Update
        </span>
        <h2 style="color: #FFFFFF; margin: 0; font-size: 19px; font-weight: 700;">
          Update on your inspection request for "${propTitle}"
        </h2>
      </div>
      <div style="padding: 24px; color: #1C1613; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Hello <strong>${booking.applicantName}</strong>, the agent for <strong>"${propTitle}"</strong> (${propLocation}) was unable to confirm the ${slotInfo} slot.</p>
        <p>You can choose another available inspection slot or browse other verified listings on Setlla.</p>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${APP_PORTAL_URL}" style="display: inline-block; background-color: #000004; color: #FFAD05; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 26px; border-radius: 12px; border: 1px solid #FFAD05;">
            Browse Available Properties &rarr;
          </a>
        </div>
      </div>
    </div>
  `;

  return dispatchTransactionalEmail({
    dedupKey: `tenant_booking_${decision}_${booking.id}`,
    to: booking.applicantEmail!,
    subject,
    text,
    html,
    replyTo: listing?.agent?.email || 'support@setlla.com',
    fromName: 'Setlla Inspections',
    eventType: `inspection_${decision}`,
    metadata: {
      Event: isApproved ? 'Inspection Request Approved (Contact Unlocked)' : 'Inspection Request Declined by Agent',
      Property: `${propTitle} (${propLocation})`,
      Unlocked_Address: isApproved ? listing?.fullAddress || propLocation : 'N/A',
      Agent_Phone: isApproved ? listing?.agent?.phone || 'N/A' : 'N/A',
      Inspection_Slot: slotInfo,
      Booking_Reference: booking.id,
      Action_URL: APP_PORTAL_URL,
    },
  });
}

/**
 * 4. Sends an instant email to the Employer when a Job Seeker applies for their job vacancy.
 */
export async function sendNewJobApplicationToEmployerEmail(
  application: JobApplication,
  job?: JobListing
): Promise<boolean> {
  const employerEmail = (application.posterEmail || job?.posterEmail || job?.contactEmail || '').trim();
  if (!isValidEmail(employerEmail)) return false;

  const subject = `[Setlla Jobs] New Candidate Application: ${application.applicantName} for "${application.jobTitle}"`;
  const cvLink = application.cvUrl && application.cvUrl.startsWith('http') ? application.cvUrl : APP_PORTAL_URL;

  const text = [
    `Hello ${application.companyName} Hiring Team,`,
    ``,
    `You have received a new job application on Setlla Jobs for "${application.jobTitle}".`,
    ``,
    `CANDIDATE DETAILS:`,
    `- Candidate Name: ${application.applicantName}`,
    `- Email: ${application.applicantEmail}`,
    `- Phone / WhatsApp: ${application.applicantPhone}`,
    `- Attached CV: ${application.cvFileName}`,
    application.coverNote ? `- Cover Note: ${application.coverNote}` : '',
    ``,
    `Review and download the candidate's CV or shortlist them in your Setlla Employer Portal:`,
    `${APP_PORTAL_URL}`,
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FCF9F5; border: 1px solid #EFE3C6; border-radius: 16px; overflow: hidden;">
      <div style="background-color: #000004; padding: 22px 24px; border-bottom: 2px solid #FFAD05;">
        <span style="display: inline-block; background-color: #FFAD05; color: #000004; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; margin-bottom: 8px;">
          New Candidate Application
        </span>
        <h2 style="color: #FFFFFF; margin: 0; font-size: 19px; font-weight: 700;">
          ${application.applicantName} applied for "${application.jobTitle}"
        </h2>
      </div>
      <div style="padding: 24px; color: #1C1613; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Hello <strong>${application.companyName}</strong>, a new candidate has submitted their application and CV for your vacancy on Setlla Jobs.</p>
        <div style="background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin: 18px 0;">
          <p style="margin: 5px 0;"><strong>Role:</strong> ${application.jobTitle}</p>
          <p style="margin: 5px 0;"><strong>Candidate Name:</strong> ${application.applicantName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${application.applicantEmail}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${application.applicantPhone}</p>
          <p style="margin: 5px 0;"><strong>CV Attached:</strong> ${application.cvFileName}</p>
          ${application.coverNote ? `<p style="margin: 8px 0 0; padding-top: 8px; border-top: 1px solid #F3F4F6; color: #4B5563;"><em>"${application.coverNote}"</em></p>` : ''}
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${cvLink}" style="display: inline-block; background-color: #000004; color: #FFAD05; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 26px; border-radius: 12px; border: 1px solid #FFAD05;">
            Review Candidate CV on Setlla &rarr;
          </a>
        </div>
      </div>
    </div>
  `;

  return dispatchTransactionalEmail({
    dedupKey: `employer_job_app_${application.id}`,
    to: employerEmail,
    subject,
    text,
    html,
    replyTo: application.applicantEmail || 'support@setlla.com',
    fromName: 'Setlla Jobs',
    eventType: 'job_application_received',
    metadata: {
      Event: 'New Candidate Job Application',
      Job_Title: application.jobTitle,
      Company: application.companyName,
      Candidate_Name: application.applicantName,
      Candidate_Email: application.applicantEmail,
      Candidate_Phone: application.applicantPhone,
      CV_File: application.cvFileName,
      Action_URL: APP_PORTAL_URL,
    },
  });
}

/**
 * 5. Sends an instant email to the Job Seeker when they apply or when an Employer updates their application status (Reviewed, Shortlisted, Declined).
 */
export async function sendJobApplicationStatusToSeekerEmail(
  application: JobApplication,
  status: 'submitted' | 'reviewed' | 'shortlisted' | 'rejected'
): Promise<boolean> {
  if (!isValidEmail(application.applicantEmail)) return false;

  const statusHeadline =
    status === 'shortlisted'
      ? `Congratulations! You've been Shortlisted for "${application.jobTitle}"`
      : status === 'reviewed'
      ? `${application.companyName} viewed your CV for "${application.jobTitle}"`
      : status === 'rejected'
      ? `Update on your application for "${application.jobTitle}" at ${application.companyName}`
      : `Application Delivered: "${application.jobTitle}" at ${application.companyName}`;

  const subject = `[Setlla Jobs] ${statusHeadline}`;

  const bodyCopy =
    status === 'shortlisted'
      ? `Great news! ${application.companyName} has reviewed your credentials and SHORTLISTED you for the "${application.jobTitle}" role. The employer may reach out to you directly via phone (${application.applicantPhone}) or email (${application.applicantEmail}) for the next stage.`
      : status === 'reviewed'
      ? `${application.companyName} has just opened and reviewed your CV (${application.cvFileName}) for the "${application.jobTitle}" vacancy on Setlla Jobs.`
      : status === 'rejected'
      ? `Thank you for applying for "${application.jobTitle}" at ${application.companyName}. The employer has updated the status of your application and is currently proceeding with other candidates. Explore more verified vacancies on Setlla Jobs.`
      : `Your application and CV (${application.cvFileName}) for "${application.jobTitle}" have been delivered to ${application.companyName}. We will notify you as soon as the employer reviews or shortlists your application.`;

  const text = [
    `Hello ${application.applicantName},`,
    ``,
    bodyCopy,
    ``,
    `- Role: ${application.jobTitle}`,
    `- Company: ${application.companyName}`,
    `- Application Status: ${status.toUpperCase()}`,
    ``,
    `View your application tracker on Setlla Jobs: ${APP_PORTAL_URL}`,
  ].join('\n');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FCF9F5; border: 1px solid #EFE3C6; border-radius: 16px; overflow: hidden;">
      <div style="background-color: #000004; padding: 22px 24px; border-bottom: 2px solid #FFAD05;">
        <span style="display: inline-block; background-color: #FFAD05; color: #000004; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; margin-bottom: 8px;">
          Setlla Jobs &bull; ${status.toUpperCase()}
        </span>
        <h2 style="color: #FFFFFF; margin: 0; font-size: 18px; font-weight: 700;">
          ${statusHeadline}
        </h2>
      </div>
      <div style="padding: 24px; color: #1C1613; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Hello <strong>${application.applicantName}</strong>,</p>
        <p>${bodyCopy}</p>
        <div style="background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin: 18px 0;">
          <p style="margin: 4px 0;"><strong>Role:</strong> ${application.jobTitle}</p>
          <p style="margin: 4px 0;"><strong>Company:</strong> ${application.companyName}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> <span style="font-weight: 700; text-transform: capitalize;">${status}</span></p>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${APP_PORTAL_URL}" style="display: inline-block; background-color: #000004; color: #FFAD05; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 26px; border-radius: 12px; border: 1px solid #FFAD05;">
            View Application Status on Setlla &rarr;
          </a>
        </div>
      </div>
    </div>
  `;

  return dispatchTransactionalEmail({
    dedupKey: `seeker_job_status_${application.id}_${status}`,
    to: application.applicantEmail!,
    subject,
    text,
    html,
    replyTo: application.posterEmail || 'support@setlla.com',
    fromName: 'Setlla Jobs',
    eventType: `job_status_${status}`,
    metadata: {
      Event: statusHeadline,
      Job_Title: application.jobTitle,
      Company: application.companyName,
      Application_Status: status.toUpperCase(),
      Action_URL: APP_PORTAL_URL,
    },
  });
}
