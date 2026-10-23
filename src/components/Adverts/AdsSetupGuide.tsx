import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Image as ImageIcon, 
  Video, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  Code2, 
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';

interface AdsSetupGuideProps {
  mode?: 'customer' | 'admin' | 'all';
  onClose?: () => void;
  isModal?: boolean;
}

export const AdsSetupGuide: React.FC<AdsSetupGuideProps> = ({
  mode = 'all',
  onClose,
  isModal = false,
}) => {
  const [activeSection, setActiveSection] = useState<'tiers' | 'specs' | 'sla' | 'leads' | 'api' | 'admin'>(
    mode === 'admin' ? 'admin' : 'tiers'
  );
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText('https://iadzihievmbhssqycpol.supabase.co/rest/v1/adverts');
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const navItems = [
    { id: 'tiers' as const, label: '1. Campaign Strategy & Tiers', icon: Sparkles },
    { id: 'specs' as const, label: '2. Creative Dimensions & Specs', icon: ImageIcon },
    { id: 'sla' as const, label: '3. Verification & 1-Hour SLA', icon: Clock },
    { id: 'leads' as const, label: '4. WhatsApp Lead Conversion', icon: MessageSquare },
    { id: 'api' as const, label: '5. Programmatic REST API', icon: Code2 },
    { id: 'admin' as const, label: '6. Super Admin Operations', icon: ShieldCheck, adminOnly: true },
  ].filter((item) => mode !== 'customer' || !item.adminOnly);

  const content = (
    <div className="space-y-8 font-body text-[#000004]">
      {/* Header Banner */}
      <div className="bg-[#FCF9F5] p-6 sm:p-8 rounded-3xl border border-[#342A21]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#342A21]/5 text-[#342A21] border border-[#342A21]/15 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Official Setlla Sponsored Media Playbook</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-[#342A21] font-normal tracking-tight">
            Ads Setup & Campaign Management Guide
          </h2>
          <p className="text-xs sm:text-sm text-[#70798C] mt-1 max-w-2xl leading-relaxed">
            Everything you need to plan, produce, launch, and measure high-impact sponsored property and brand campaigns across Delta State's rental network.
          </p>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-[#F6F3EF] border border-[#E5E7EB] text-[#70798C] hover:text-[#342A21] flex items-center justify-center transition-colors cursor-pointer self-start sm:self-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#E5E7EB] scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                  : 'bg-white text-[#70798C] border border-[#E5E7EB] hover:text-[#342A21]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-[#70798C]'}`} />
              <span>{item.label}</span>
              {item.adminOnly && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold uppercase">
                  Admin
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Section 1: Campaign Strategy & Tiers */}
      {activeSection === 'tiers' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="font-display text-xl text-[#342A21] font-normal">
              1. Choosing the Right Campaign Flight Package
            </h3>
            <p className="text-xs text-[#70798C] mt-1">
              Setlla offers three curated flight tiers tailored to business size, flight horizon, and conversion objectives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#70798C]">Short-Term Burst</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FCF9F5] border text-[#342A21]">₦15,000</span>
              </div>
              <h4 className="font-display font-medium text-base text-[#342A21]">Starter Spotlight (7 Days)</h4>
              <p className="text-xs text-[#70798C] leading-relaxed">
                Best for weekend open house viewings, shortlet discounts, or quick promotional announcements. Rotates actively in the Feed Stories Tray.
              </p>
              <div className="pt-2 border-t border-[#E5E7EB] text-[11px] text-[#342A21] space-y-1">
                <div>✓ Stories Tray Reel Priority</div>
                <div>✓ Direct 1-Click WhatsApp Lead Routing</div>
                <div>✓ Basic Campaign Impression Count</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-[#342A21] shadow-card space-y-3 relative">
              <span className="absolute -top-2.5 right-4 bg-[#342A21] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                Recommended
              </span>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#342A21]">Corporate Growth</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#342A21] text-white">₦45,000</span>
              </div>
              <h4 className="font-display font-medium text-base text-[#342A21]">Growth Partner (30 Days)</h4>
              <p className="text-xs text-[#70798C] leading-relaxed">
                Ideal for established agencies, solar energy contractors, interior decorators, and developers. Provides dual placement in Stories and Desktop Pinned Sidebar.
              </p>
              <div className="pt-2 border-t border-[#E5E7EB] text-[11px] text-[#342A21] space-y-1">
                <div>✓ Dual Placement: Stories + Desktop Pinned Banner</div>
                <div>✓ Official Blue "Verified Partner" Checkmark</div>
                <div>✓ Priority Regional Targeting (Asaba, Warri, Abraka)</div>
                <div>✓ Weekly Performance Analytics Digest</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#70798C]">Quarterly VIP</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FCF9F5] border text-[#342A21]">₦120,000</span>
              </div>
              <h4 className="font-display font-medium text-base text-[#342A21]">Corporate Leader (90 Days)</h4>
              <p className="text-xs text-[#70798C] leading-relaxed">
                Engineered for master estate developers, telecom, financial institutions, and multi-branch agencies seeking dominant brand presence across Delta State.
              </p>
              <div className="pt-2 border-t border-[#E5E7EB] text-[11px] text-[#342A21] space-y-1">
                <div>✓ Permanent Top Rotation Across All Feed Views</div>
                <div>✓ Dedicated WhatsApp Concierge & Custom CTA</div>
                <div>✓ Network-Wide Delta Broadcast (All Cities)</div>
                <div>✓ Direct Property Listing Integration</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Creative & Asset Specifications */}
      {activeSection === 'specs' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="font-display text-xl text-[#342A21] font-normal">
              2. Creative Asset Guidelines & Dimension Specs
            </h3>
            <p className="text-xs text-[#70798C] mt-1">
              To ensure pristine visual fidelity and avoid cropped copy on mobile devices, follow these specifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] space-y-3">
              <div className="flex items-center gap-2 text-[#342A21] font-semibold text-xs uppercase tracking-wider">
                <ImageIcon className="w-4 h-4 text-[#B45309]" />
                <span>Stories Reel Format (9:16 Vertical)</span>
              </div>
              <ul className="text-xs text-[#70798C] space-y-2">
                <li>• <strong>Recommended Resolution:</strong> 1080 × 1920 pixels (9:16 ratio).</li>
                <li>• <strong>Safe Zones:</strong> Leave 150px top and bottom clear of text or logos to prevent overlap with the progress bar and CTA buttons.</li>
                <li>• <strong>Supported Formats:</strong> JPG, PNG, WEBP, or MP4 video (max 20MB, 15 seconds max duration).</li>
                <li>• <strong>Visual Style:</strong> Authentic photography with crisp natural lighting is favored over heavily text-crowded fliers.</li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] space-y-3">
              <div className="flex items-center gap-2 text-[#342A21] font-semibold text-xs uppercase tracking-wider">
                <Layers className="w-4 h-4 text-[#B45309]" />
                <span>Desktop Pinned Banner (16:9 Landscape)</span>
              </div>
              <ul className="text-xs text-[#70798C] space-y-2">
                <li>• <strong>Recommended Resolution:</strong> 1200 × 675 pixels (16:9 ratio).</li>
                <li>• <strong>Layout:</strong> Featured card anchored on the left sidebar of desktop browser screens.</li>
                <li>• <strong>Typography:</strong> Headline strictly under 60 characters for crisp 1-line or 2-line rendering.</li>
                <li>• <strong>Location Anchor:</strong> Include your primary Delta operating city (e.g., "Asaba GRA", "Effurun Warri") in the copy.</li>
              </ul>
            </div>
          </div>

          <div className="bg-[#FCF9F5] p-4 rounded-2xl border border-[#E5E7EB] flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
            <div className="text-xs text-[#342A21]">
              <span className="font-semibold block">Prohibited Content:</span>
              Setlla strictly prohibits unverified off-plan lottery schemes, deceptive guaranteed returns, watermarked third-party photography, or unlicensed financial solicitations.
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Verification & Fast-Track 1-Hour SLA */}
      {activeSection === 'sla' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="font-display text-xl text-[#342A21] font-normal">
              3. Verification Workflow & Fast-Track SLA
            </h3>
            <p className="text-xs text-[#70798C] mt-1">
              Every campaign undergoes quality assurance to ensure trust and brand safety across Delta State.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-1">
                <span className="text-[11px] font-bold text-[#70798C] uppercase">Step 1</span>
                <h5 className="font-semibold text-xs text-[#342A21]">Submission Received</h5>
                <p className="text-[11px] text-[#70798C]">
                  Your campaign is logged with a unique tracking reference (e.g., <code>REF-STL-8921</code>) and placed in the Super Admin review queue.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-1">
                <span className="text-[11px] font-bold text-[#70798C] uppercase">Step 2</span>
                <h5 className="font-semibold text-xs text-[#342A21]">60-Minute Review SLA</h5>
                <p className="text-[11px] text-[#70798C]">
                  Ad desk checks image resolution, links, phone verification, and payment confirmation during business hours (8am - 8pm).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-1">
                <span className="text-[11px] font-bold text-[#70798C] uppercase">Step 3</span>
                <h5 className="font-semibold text-xs text-[#342A21]">Live Instant Broadcast</h5>
                <p className="text-[11px] text-[#70798C]">
                  Once approved, your campaign broadcasts immediately across active seeker feeds via Supabase Realtime with zero delay.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <span>Need Instant Flight Activation?</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Message our WhatsApp Ad Concierge with your campaign tracking reference for priority same-hour clearance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: WhatsApp Lead Conversion */}
      {activeSection === 'leads' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="font-display text-xl text-[#342A21] font-normal">
              4. WhatsApp Lead Conversion Best Practices
            </h3>
            <p className="text-xs text-[#70798C] mt-1">
              Nigerian property renters and buyers prefer instant messaging over cold emails. Maximize your return on ad spend with these protocols.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] space-y-3">
              <h4 className="font-semibold text-xs text-[#342A21] uppercase tracking-wider">
                1. Dedicated WhatsApp Business Number
              </h4>
              <p className="text-xs text-[#70798C] leading-relaxed">
                Connect a Nigerian WhatsApp Business line. Configure an automated greeting acknowledging the specific Setlla promotion so prospects immediately feel recognized.
              </p>
              <div className="p-3 bg-[#FCF9F5] rounded-xl border border-[#E5E7EB] text-[11px] font-mono text-[#342A21]">
                "Hello! Thanks for reaching out via our Setlla ad. Are you looking to schedule an inspection or receive our pricing sheet?"
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] space-y-3">
              <h4 className="font-semibold text-xs text-[#342A21] uppercase tracking-wider">
                2. The 5-Minute Lead Response Rule
              </h4>
              <p className="text-xs text-[#70798C] leading-relaxed">
                Tenants seeking rental units or serviced apartments in Asaba & Warri message multiple listings. Replying within 5 minutes results in a <strong>400% higher booking rate</strong> than responding after 1 hour.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 5: Programmatic REST API */}
      {activeSection === 'api' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="font-display text-xl text-[#342A21] font-normal">
              5. Programmatic REST API & Automated Push Gateway
            </h3>
            <p className="text-xs text-[#70798C] mt-1">
              For real estate CRM systems, property portals, and agencies automating campaign flights via secured REST API keys.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FCF9F5] p-4 rounded-xl border border-[#E5E7EB]">
              <div>
                <span className="text-[10px] font-bold text-[#70798C] uppercase tracking-wider block">Endpoint</span>
                <code className="text-xs font-mono font-bold text-[#342A21]">
                  POST https://iadzihievmbhssqycpol.supabase.co/rest/v1/adverts
                </code>
              </div>
              <button
                onClick={handleCopyEndpoint}
                className="py-1.5 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-xs font-semibold text-[#342A21] flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedEndpoint ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEndpoint ? 'Copied' : 'Copy Endpoint'}</span>
              </button>
            </div>

            <div>
              <span className="text-xs font-bold text-[#342A21] block mb-1">Required Headers:</span>
              <div className="p-3 bg-[#FCF9F5] rounded-xl border border-[#E5E7EB] text-xs font-mono text-[#342A21] space-y-1">
                <div>Content-Type: application/json</div>
                <div>X-Setlla-Partner-Key: stla_live_your_corporate_key_here</div>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-[#342A21] block mb-1">Sample cURL Payload:</span>
              <pre className="p-4 bg-[#FCF9F5] rounded-xl border border-[#E5E7EB] text-xs font-mono text-[#342A21] overflow-x-auto">
{`curl -X POST "https://iadzihievmbhssqycpol.supabase.co/rest/v1/adverts" \\
  -H "Content-Type: application/json" \\
  -H "X-Setlla-Partner-Key: stla_live_8f39a01b92c44de88a912bf7" \\
  -d '{
    "companyName": "Asaba Solar & Power Solutions Ltd",
    "headline": "24/7 Solar Backup Power for Delta Renters",
    "category": "Service",
    "mediaUrl": "https://images.unsplash.com/photo-1509391365360-2e959784a276",
    "whatsappNumber": "08031122334",
    "durationDays": 30
  }'`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Section 6: Super Admin Operations Protocol */}
      {activeSection === 'admin' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="font-display text-xl text-[#342A21] font-normal">
              6. Super Admin Operations & Review Protocol
            </h3>
            <p className="text-xs text-[#70798C] mt-1">
              Standard Operating Procedures for Platform Administrators managing incoming partner adverts and API keys.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] space-y-3">
              <h4 className="font-semibold text-xs text-[#342A21] uppercase tracking-wider">
                Approval Checklist
              </h4>
              <ul className="text-xs text-[#70798C] space-y-2">
                <li>1. <strong>Identity Check:</strong> Verify advertiser corporate email and working phone.</li>
                <li>2. <strong>Creative Review:</strong> Ensure image aspect ratio is 9:16 or 16:9 with no blurry pixels or deceptive trademarks.</li>
                <li>3. <strong>Payment Reference:</strong> Confirm bank receipt or payment reference matching the selected package tier (₦15k, ₦45k, or ₦120k).</li>
                <li>4. <strong>Click "Approve & Broadcast":</strong> Sets the exact start and expiry dates in UTC and sets <code>is_verified: true</code>.</li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] space-y-3">
              <h4 className="font-semibold text-xs text-[#342A21] uppercase tracking-wider">
                Fraud & Takedown Protocol
              </h4>
              <ul className="text-xs text-[#70798C] space-y-2">
                <li>• <strong>Instant Pause:</strong> Toggle campaign status to "paused" in the Super Admin Ads grid.</li>
                <li>• <strong>API Key Revocation:</strong> Open the "API & Keys" drawer to suspend or delete the offending corporate API key immediately.</li>
                <li>• <strong>Decline with Reason:</strong> Record notes in the audit log for transparency.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-card border border-[#342A21]/15 p-6 sm:p-8 max-h-[85vh] overflow-y-auto my-auto animate-scale-up">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
