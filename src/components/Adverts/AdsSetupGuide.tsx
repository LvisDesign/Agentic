import React, { useState } from 'react';
import { 
  BookOpen, 
  Target, 
  Layers, 
  CheckCircle2, 
  Image as ImageIcon, 
  Clock, 
  ShieldCheck, 
  Code2, 
  Copy, 
  Check, 
  ExternalLink,
  AlertCircle,
  X,
  KeyRound,
  Terminal,
  Send,
  Zap,
  Globe
} from 'lucide-react';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
import { ModalPortal } from '../UI/ModalPortal';

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
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedGreeting, setCopiedGreeting] = useState(false);
  const [apiCodeLang, setApiCodeLang] = useState<'curl' | 'javascript' | 'python'>('curl');

  const endpointUrl = 'https://iadzihievmbhssqycpol.supabase.co/rest/v1/adverts';

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(endpointUrl);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const navItems = [
    { id: 'tiers' as const, label: '1. Strategy & Tiers', icon: Target },
    { id: 'specs' as const, label: '2. Creative Specs', icon: ImageIcon },
    { id: 'sla' as const, label: '3. 1-Hour SLA', icon: Clock },
    { id: 'leads' as const, label: '4. WhatsApp Leads', icon: WhatsAppIcon },
    { id: 'api' as const, label: '5. REST API Connection', icon: Code2 },
    { id: 'admin' as const, label: '6. Admin Operations', icon: ShieldCheck, adminOnly: true },
  ].filter((item) => mode !== 'customer' || !item.adminOnly);

  const getCodeSnippet = () => {
    if (apiCodeLang === 'javascript') {
      return `// Push campaign advert to Setlla Realtime Feed
async function pushSetllaAd() {
  const response = await fetch("${endpointUrl}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Setlla-Partner-Key": "stla_live_8f39a01b92c44de88a912bf7"
    },
    body: JSON.stringify({
      companyName: "Apex Solar & Power Solutions Ltd",
      headline: "24/7 Clean Solar Energy for Modern Homes",
      category: "Service",
      mediaUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276",
      mediaType: "image",
      whatsappNumber: "08031122334",
      location: "Nationwide",
      durationDays: 30,
      budgetAmount: 45000,
      ctaText: "Chat on WhatsApp"
    })
  });

  const result = await response.json();
  console.log("Campaign Live:", result.trackingRef);
}`;
    }

    if (apiCodeLang === 'python') {
      return `# Push campaign advert to Setlla Realtime Feed via Python
import requests

url = "${endpointUrl}"
headers = {
    "Content-Type": "application/json",
    "X-Setlla-Partner-Key": "stla_live_8f39a01b92c44de88a912bf7"
}
payload = {
    "companyName": "Apex Solar & Power Solutions Ltd",
    "headline": "24/7 Clean Solar Energy for Modern Homes",
    "category": "Service",
    "mediaUrl": "https://images.unsplash.com/photo-1509391365360-2e959784a276",
    "mediaType": "image",
    "whatsappNumber": "08031122334",
    "location": "Nationwide",
    "durationDays": 30,
    "budgetAmount": 45000,
    "ctaText": "Chat on WhatsApp"
}

response = requests.post(url, json=payload, headers=headers)
print("Response Status:", response.status_code)
print("Campaign Data:", response.json())`;
    }

    return `curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-Setlla-Partner-Key: stla_live_8f39a01b92c44de88a912bf7" \\
  -d '{
    "companyName": "Apex Solar & Power Solutions Ltd",
    "headline": "24/7 Clean Solar Energy for Modern Homes",
    "category": "Service",
    "mediaUrl": "https://images.unsplash.com/photo-1509391365360-2e959784a276",
    "mediaType": "image",
    "whatsappNumber": "08031122334",
    "location": "Nationwide",
    "durationDays": 30,
    "budgetAmount": 45000,
    "ctaText": "Chat on WhatsApp"
  }'`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const greetingTemplate = "Hello! Thanks for reaching out via our Setlla ad. Are you looking to schedule an inspection or receive our brochure?";

  const handleCopyGreeting = () => {
    navigator.clipboard.writeText(greetingTemplate);
    setCopiedGreeting(true);
    setTimeout(() => setCopiedGreeting(false), 2000);
  };

  // Section Contents
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'tiers':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-[#B45309] shrink-0" />
                <h3 className="font-display text-lg sm:text-xl text-[#342A21] font-semibold">
                  Choosing the Right Campaign Package
                </h3>
              </div>
              <p className="text-xs text-[#70798C] leading-relaxed">
                Setlla offers three transparent campaign packages matched to objectives, business scale, and budget.
              </p>
            </div>

            {/* 3 Package Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Starter Spotlight */}
              <div className="bg-[#FCF9F5] p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#70798C] bg-white px-2 py-0.5 rounded-md border border-[#E5E7EB]">
                      7-Day Plan
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-[#342A21]/20 text-[#342A21]">
                      ₦15,000
                    </span>
                  </div>
                  <h4 className="font-display font-medium text-base text-[#342A21]">
                    Starter Spotlight
                  </h4>
                  <p className="text-xs text-[#70798C] leading-relaxed">
                    Designed for fast promo bursts, weekend open house viewings, shortlet offers, or flash discounts.
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E5E7EB] text-xs text-[#342A21] space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Stories Tray reel prominent rotation</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>1-Click direct WhatsApp lead routing</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Basic weekly campaign impression metrics</span>
                  </div>
                </div>
              </div>

              {/* Growth Partner (Recommended) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#342A21] shadow-card flex flex-col justify-between space-y-3 relative">
                <span className="absolute -top-2.5 right-4 bg-[#342A21] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                  Most Popular · 30 Days
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#342A21] bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                      Corporate Growth
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#342A21] text-white">
                      ₦45,000
                    </span>
                  </div>
                  <h4 className="font-display font-semibold text-base text-[#342A21]">
                    Growth Partner
                  </h4>
                  <p className="text-xs text-[#70798C] leading-relaxed">
                    Recommended for real estate agencies, interior decorators, solar installers, and local service providers.
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E5E7EB] text-xs text-[#342A21] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Dual Placement: Stories + Pinned Sidebar</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Featured Partner Placement</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Priority targeting across Asaba, Warri, Abraka</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Weekly performance digest report</span>
                  </div>
                </div>
              </div>

              {/* Corporate Leader */}
              <div className="bg-[#FCF9F5] p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#70798C] bg-white px-2 py-0.5 rounded-md border border-[#E5E7EB]">
                      Quarterly VIP · 90 Days
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-[#342A21]/20 text-[#342A21]">
                      ₦120,000
                    </span>
                  </div>
                  <h4 className="font-display font-medium text-base text-[#342A21]">
                    Corporate Leader
                  </h4>
                  <p className="text-xs text-[#70798C] leading-relaxed">
                    Tailored for master estate developers, telecom, financial institutions, and multi-branch agencies.
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E5E7EB] text-xs text-[#342A21] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Permanent top-rotation across all property feeds</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Dedicated VIP Account Manager</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Network-wide broadcast across all cities</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Direct property listing integration & webhook</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Comparison Bar */}
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="font-semibold">Quick Rule of Thumb:</span>
                <span>Choose <strong>Starter (7d)</strong> for quick sales, <strong>Growth (30d)</strong> for brand building, and <strong>Corporate (90d)</strong> for continuous dominance.</span>
              </div>
            </div>
          </div>
        );

      case 'specs':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ImageIcon className="w-4 h-4 text-[#B45309] shrink-0" />
                <h3 className="font-display text-lg sm:text-xl text-[#342A21] font-semibold">
                  Creative Asset Specifications & Safe Zones
                </h3>
              </div>
              <p className="text-xs text-[#70798C] leading-relaxed">
                Follow these specifications so your creative looks sharp on smartphones and desktop screens without cropped text.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stories Format */}
              <div className="bg-[#FCF9F5] p-5 rounded-2xl border border-[#E5E7EB] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#342A21] uppercase tracking-wider flex items-center gap-1.5">
                    <SmartphoneIcon className="w-3.5 h-3.5 text-[#B45309]" />
                    <span>Stories Reel (Vertical 9:16)</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[#342A21]">
                    1080 × 1920 px
                  </span>
                </div>
                <ul className="text-xs text-[#70798C] space-y-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-800 font-bold">•</span>
                    <span><strong>Aspect Ratio:</strong> Vertical 9:16 portrait. Perfect for mobile reels full-screen view.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-800 font-bold">•</span>
                    <span><strong>Safe Zone:</strong> Keep top 150px and bottom 180px free of text to avoid overlap with timer & CTA.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-800 font-bold">•</span>
                    <span><strong>Format:</strong> High-res JPG, PNG, WEBP, or MP4 video (max 20MB, up to 15 seconds).</span>
                  </li>
                </ul>
              </div>

              {/* Desktop Pinned Banner */}
              <div className="bg-[#FCF9F5] p-5 rounded-2xl border border-[#E5E7EB] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#342A21] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#B45309]" />
                    <span>Desktop Sidebar (Landscape 16:9)</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[#342A21]">
                    1200 × 675 px
                  </span>
                </div>
                <ul className="text-xs text-[#70798C] space-y-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-800 font-bold">•</span>
                    <span><strong>Aspect Ratio:</strong> Landscape 16:9 banner. Pinned on desktop browse screens.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-800 font-bold">•</span>
                    <span><strong>Headline Limit:</strong> Keep copy under 60 characters for clean 1-line or 2-line title rendering.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-800 font-bold">•</span>
                    <span><strong>City Anchor:</strong> Explicitly mention target city or region.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Prohibited Alert */}
            <div className="bg-white p-3.5 rounded-xl border border-red-200/80 text-xs text-red-950 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Content Standards:</span>
                <span className="text-red-900 ml-1">
                  Off-plan lottery schemes, watermarked third-party photos, misleading guaranteed returns, and unlicensed financial solicitations are strictly prohibited and rejected.
                </span>
              </div>
            </div>
          </div>
        );

      case 'sla':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-[#B45309] shrink-0" />
                <h3 className="font-display text-lg sm:text-xl text-[#342A21] font-semibold">
                  Campaign Verification & 60-Minute SLA
                </h3>
              </div>
              <p className="text-xs text-[#70798C] leading-relaxed">
                How every campaign moves from submission to live broadcasting across the network.
              </p>
            </div>

            {/* 3 Step Visual Workflow */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-[#342A21] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span className="text-[10px] font-bold text-[#70798C] uppercase">Instant</span>
                </div>
                <h5 className="font-semibold text-xs text-[#342A21]">Submission & Tracking Ref</h5>
                <p className="text-xs text-[#70798C] leading-relaxed">
                  Campaign is assigned an official tracking reference (e.g. <code className="text-[#342A21] bg-white px-1 py-0.5 rounded border">REF-STL-8921</code>) and queued for ad desk review.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-[#342A21] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase">
                    ≤ 60 Mins
                  </span>
                </div>
                <h5 className="font-semibold text-xs text-[#342A21]">Ad Desk Compliance QA</h5>
                <p className="text-xs text-[#70798C] leading-relaxed">
                  Super Admin validates creative resolution, landing link, WhatsApp number verification, and payment confirmation.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 uppercase">
                    Live
                  </span>
                </div>
                <h5 className="font-semibold text-xs text-[#342A21]">Realtime Feed Broadcast</h5>
                <p className="text-xs text-[#70798C] leading-relaxed">
                  Once approved, your ad broadcasts in real-time across seeker feeds with zero page reloads required.
                </p>
              </div>
            </div>

            {/* Fast Track Callout */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="font-semibold text-xs text-emerald-950 flex items-center gap-1.5">
                  <WhatsAppIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Need Immediate Priority Activation?</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Message our WhatsApp Ad Support with your tracking reference for expedited same-hour clearance.
                </p>
              </div>
              <a
                href="https://wa.me/2348000000000?text=Hello%20Setlla%20Team%2C%20I%20have%20submitted%20a%20campaign%20advert%20and%20need%20priority%20review."
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer no-underline"
              >
                <span>WhatsApp Support</span>
                <ExternalLink className="w-3 h-3 text-emerald-200" />
              </a>
            </div>
          </div>
        );

      case 'leads':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <WhatsAppIcon className="w-4 h-4 text-[#B45309] shrink-0" />
                <h3 className="font-display text-lg sm:text-xl text-[#342A21] font-semibold">
                  WhatsApp Lead Conversion Playbook
                </h3>
              </div>
              <p className="text-xs text-[#70798C] leading-relaxed">
                Nigerian property seekers prioritize direct WhatsApp conversations over cold emails. Maximize conversion with these proven protocols.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#FCF9F5] p-5 rounded-2xl border border-[#E5E7EB] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#342A21] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h4 className="font-semibold text-xs text-[#342A21] uppercase tracking-wider">
                    The 5-Minute Lead Rule
                  </h4>
                </div>
                <p className="text-xs text-[#70798C] leading-relaxed">
                  Renters in Asaba & Warri message multiple properties simultaneously. Responding within <strong>5 minutes delivers a 400% higher inspection booking rate</strong> than replying after an hour.
                </p>
              </div>

              <div className="bg-[#FCF9F5] p-5 rounded-2xl border border-[#E5E7EB] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#342A21] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h4 className="font-semibold text-xs text-[#342A21] uppercase tracking-wider">
                    Automated Welcome Greeting
                  </h4>
                </div>
                <p className="text-xs text-[#70798C] leading-relaxed">
                  Use WhatsApp Business auto-replies acknowledging Setlla so prospects immediately know they connected with the verified advertiser.
                </p>
              </div>
            </div>

            {/* Template Box */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#342A21] uppercase tracking-wider">
                  Recommended Auto-Reply Template:
                </span>
                <button
                  onClick={handleCopyGreeting}
                  className="py-1 px-2.5 rounded-lg border border-[#E5E7EB] bg-[#FCF9F5] hover:bg-[#F6F3EF] text-[11px] font-semibold text-[#342A21] flex items-center gap-1 cursor-pointer"
                >
                  {copiedGreeting ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedGreeting ? 'Copied' : 'Copy Template'}</span>
                </button>
              </div>
              <div className="p-3 bg-[#FCF9F5] rounded-xl border border-[#E5E7EB] text-xs font-mono text-[#342A21] leading-relaxed">
                "{greetingTemplate}"
              </div>
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Code2 className="w-4 h-4 text-[#B45309] shrink-0" />
                <h3 className="font-display text-lg sm:text-xl text-[#342A21] font-semibold">
                  Programmatic REST API & Webhook Integration
                </h3>
              </div>
              <p className="text-xs text-[#70798C] leading-relaxed">
                Automate ad campaigns directly from your company CRM, website backend, or property management software using secure REST endpoints.
              </p>
            </div>

            {/* Step-by-Step Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-1.5">
                <span className="w-5 h-5 rounded-full bg-[#342A21] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <h5 className="font-semibold text-xs text-[#342A21]">Get API Key</h5>
                <p className="text-[11px] text-[#70798C] leading-relaxed">
                  Generated in Super Admin or Partner Portal. Looks like <code className="text-[#342A21]">stla_live_...</code>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-1.5">
                <span className="w-5 h-5 rounded-full bg-[#342A21] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <h5 className="font-semibold text-xs text-[#342A21]">Attach Header</h5>
                <p className="text-[11px] text-[#70798C] leading-relaxed">
                  Pass your key in the header: <code className="text-[#342A21]">X-Setlla-Partner-Key</code>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-1.5">
                <span className="w-5 h-5 rounded-full bg-[#342A21] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <h5 className="font-semibold text-xs text-[#342A21]">POST Payload</h5>
                <p className="text-[11px] text-[#70798C] leading-relaxed">
                  Send JSON with media URL, headline, WhatsApp phone, and duration days.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  4
                </span>
                <h5 className="font-semibold text-xs text-[#342A21]">201 Created</h5>
                <p className="text-[11px] text-[#70798C] leading-relaxed">
                  Ad is stored in database & immediately queues for live broadcast.
                </p>
              </div>
            </div>

            {/* Endpoint & Interactive Code Snippet Box */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] space-y-4">
              {/* Endpoint row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#FCF9F5] p-3 rounded-xl border border-[#E5E7EB]">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-[#70798C] uppercase tracking-wider block">
                    HTTP Method & Endpoint
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                      POST
                    </span>
                    <code className="text-xs font-mono font-bold text-[#342A21] truncate">
                      {endpointUrl}
                    </code>
                  </div>
                </div>
                <button
                  onClick={handleCopyEndpoint}
                  className="py-1.5 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-xs font-semibold text-[#342A21] flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                >
                  {copiedEndpoint ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEndpoint ? 'Copied Endpoint' : 'Copy Endpoint'}</span>
                </button>
              </div>

              {/* Code Language Switcher */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 p-1 bg-[#FCF9F5] rounded-xl border border-[#E5E7EB]">
                    <button
                      onClick={() => setApiCodeLang('curl')}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        apiCodeLang === 'curl' ? 'bg-[#342A21] text-white shadow-xs' : 'text-[#70798C] hover:text-[#342A21]'
                      }`}
                    >
                      cURL
                    </button>
                    <button
                      onClick={() => setApiCodeLang('javascript')}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        apiCodeLang === 'javascript' ? 'bg-[#342A21] text-white shadow-xs' : 'text-[#70798C] hover:text-[#342A21]'
                      }`}
                    >
                      JavaScript
                    </button>
                    <button
                      onClick={() => setApiCodeLang('python')}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        apiCodeLang === 'python' ? 'bg-[#342A21] text-white shadow-xs' : 'text-[#70798C] hover:text-[#342A21]'
                      }`}
                    >
                      Python
                    </button>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="py-1.5 px-3 rounded-lg border border-[#E5E7EB] bg-[#FCF9F5] hover:bg-[#F6F3EF] text-xs font-semibold text-[#342A21] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied Code' : 'Copy Snippet'}</span>
                  </button>
                </div>

                <pre className="p-4 bg-[#1E1E1E] text-stone-200 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed max-h-72">
                  {getCodeSnippet()}
                </pre>
              </div>

              {/* JSON Field Schema Reference */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-[#342A21] block">
                  Payload Fields Specification:
                </span>
                <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FCF9F5] border-b border-[#E5E7EB] text-[#70798C]">
                        <th className="py-2 px-3 font-semibold">Field</th>
                        <th className="py-2 px-3 font-semibold">Type</th>
                        <th className="py-2 px-3 font-semibold">Required</th>
                        <th className="py-2 px-3 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] text-[#342A21]">
                      <tr>
                        <td className="py-2 px-3 font-mono font-medium">companyName</td>
                        <td className="py-2 px-3 text-[#70798C]">string</td>
                        <td className="py-2 px-3"><span className="text-amber-700 font-bold">Yes</span></td>
                        <td className="py-2 px-3">Brand, corporate, or agency name</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-medium">headline</td>
                        <td className="py-2 px-3 text-[#70798C]">string</td>
                        <td className="py-2 px-3"><span className="text-amber-700 font-bold">Yes</span></td>
                        <td className="py-2 px-3">Catchy campaign pitch (max 70 characters)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-medium">category</td>
                        <td className="py-2 px-3 text-[#70798C]">string</td>
                        <td className="py-2 px-3"><span className="text-amber-700 font-bold">Yes</span></td>
                        <td className="py-2 px-3">Property | Estate | Promo | Service</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-medium">mediaUrl</td>
                        <td className="py-2 px-3 text-[#70798C]">string (URL)</td>
                        <td className="py-2 px-3"><span className="text-amber-700 font-bold">Yes</span></td>
                        <td className="py-2 px-3">Direct CDN/HTTPS image or video link</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-medium">whatsappNumber</td>
                        <td className="py-2 px-3 text-[#70798C]">string</td>
                        <td className="py-2 px-3"><span className="text-amber-700 font-bold">Yes</span></td>
                        <td className="py-2 px-3">Nigerian phone line for instant lead routing</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-medium">durationDays</td>
                        <td className="py-2 px-3 text-[#70798C]">number</td>
                        <td className="py-2 px-3"><span className="text-amber-700 font-bold">Yes</span></td>
                        <td className="py-2 px-3">Campaign duration: 7, 30, or 90 days</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-medium">location</td>
                        <td className="py-2 px-3 text-[#70798C]">string</td>
                        <td className="py-2 px-3 text-[#70798C]">Optional</td>
                        <td className="py-2 px-3">Target city (e.g. Asaba, Warri, Abraka)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status Codes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                  <span className="font-mono font-bold text-emerald-800">201 Created</span>
                  <p className="text-[11px] text-emerald-900 mt-0.5">Advert stored & queued for live broadcast.</p>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                  <span className="font-mono font-bold text-amber-800">401 Unauthorized</span>
                  <p className="text-[11px] text-amber-900 mt-0.5">Missing or invalid X-Setlla-Partner-Key header.</p>
                </div>
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs">
                  <span className="font-mono font-bold text-red-800">422 Unprocessable</span>
                  <p className="text-[11px] text-red-900 mt-0.5">Required field missing or invalid media URL format.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'admin':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-[#B45309] shrink-0" />
                <h3 className="font-display text-lg sm:text-xl text-[#342A21] font-semibold">
                  Super Admin Review & Operations Protocol
                </h3>
              </div>
              <p className="text-xs text-[#70798C] leading-relaxed">
                Standard operating procedures for validating submissions, issuing API keys, and managing live campaigns.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#FCF9F5] p-5 rounded-2xl border border-[#E5E7EB] space-y-3">
                <h4 className="font-semibold text-xs text-[#342A21] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>4-Point Approval Checklist</span>
                </h4>
                <ul className="text-xs text-[#70798C] space-y-2">
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-[#342A21]">1.</span>
                    <span><strong>Advertiser Authenticity:</strong> Check company email domain and active WhatsApp phone.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-[#342A21]">2.</span>
                    <span><strong>Media Quality:</strong> Confirm aspect ratio (9:16 or 16:9) with no pixelation or unauthorized logos.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-[#342A21]">3.</span>
                    <span><strong>Payment Match:</strong> Verify proof of payment matches the selected campaign tier (₦15k, ₦45k, ₦120k).</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-[#342A21]">4.</span>
                    <span><strong>Broadcast:</strong> Click "Approve & Broadcast" in Super Admin Dashboard to deploy immediately.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#FCF9F5] p-5 rounded-2xl border border-[#E5E7EB] space-y-3">
                <h4 className="font-semibold text-xs text-[#342A21] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Fraud & Takedown Protocol</span>
                </h4>
                <ul className="text-xs text-[#70798C] space-y-2">
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-red-600">•</span>
                    <span><strong>Instant Pause:</strong> Toggle campaign status to "paused" in the Ads table to hide immediately from the feed.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-red-600">•</span>
                    <span><strong>API Key Revocation:</strong> In the API Webhook modal, toggle the corporate key to inactive.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-red-600">•</span>
                    <span><strong>Audit Trail:</strong> Document reason in the Admin Activity log for legal compliance.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Smartphone icon helper
  function SmartphoneIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
        <path d="M12 18h.01" />
      </svg>
    );
  }

  // If rendered as a Modal dialog
  if (isModal) {
    return (
      <ModalPortal>
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget && onClose) onClose();
          }}
        >
        <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-[#342A21]/15 overflow-hidden animate-scale-up">
          {/* 1. Fixed Header (Always visible) */}
          <div className="p-4 sm:p-6 border-b border-[#342A21]/10 bg-[#FCF9F5] flex items-center justify-between gap-4 shrink-0">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#342A21]/5 text-[#342A21] border border-[#342A21]/15 text-[11px] font-semibold mb-1">
                <BookOpen className="w-3 h-3 text-[#B45309] shrink-0" />
                <span>Official Setlla Media Playbook</span>
              </div>
              <h2 className="font-display text-lg sm:text-2xl text-[#342A21] font-normal tracking-tight truncate">
                Ads Setup & Campaign Management Guide
              </h2>
              <p className="text-xs text-[#70798C] mt-0.5 hidden sm:block truncate">
                Plan, launch, and connect programmatic campaigns across Setlla's property network.
              </p>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white hover:bg-[#F6F3EF] border border-[#E5E7EB] text-[#70798C] hover:text-[#342A21] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                title="Close guide"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 2. Fixed Navigation Bar (Sticky, never overflows container) */}
          <div className="bg-white px-4 sm:px-6 pt-2.5 pb-2 border-b border-[#E5E7EB] shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-nowrap sm:flex-wrap">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                        : 'bg-white text-[#70798C] border border-[#E5E7EB] hover:text-[#342A21]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-300' : 'text-[#70798C]'}`} />
                    <span>{item.label}</span>
                    {item.adminOnly && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold uppercase shrink-0">
                        Admin
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Scrollable Content Body with generous bottom padding */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain">
            {renderSectionContent()}
          </div>

          {/* 4. Fixed Footer */}
          <div className="px-4 sm:px-6 py-3 border-t border-[#E5E7EB] bg-[#FCF9F5] flex items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-[#70798C] hidden sm:inline">
              Need technical or campaign assistance? Our WhatsApp Ad Support is on standby.
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <a
                href="https://wa.me/2348000000000?text=Hello%20Setlla%20Team%2C%20I%20have%20a%20question%20regarding%20Setlla%20advertising."
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer no-underline shrink-0"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Ad Support</span>
              </a>
              {onClose && (
                <button
                  onClick={onClose}
                  className="py-1.5 px-3.5 rounded-xl border border-[#342A21]/20 bg-white hover:bg-[#F6F3EF] text-xs font-semibold text-[#342A21] cursor-pointer transition-colors shadow-2xs shrink-0"
                >
                  Close Guide
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
  }

  // Default Inline View (for PartnerPortalPage and AdvertiserDashboard)
  return (
    <div className="space-y-6 font-body text-[#000004]">
      {/* Header Banner */}
      <div className="bg-[#FCF9F5] p-5 sm:p-7 rounded-3xl border border-[#342A21]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#342A21]/5 text-[#342A21] border border-[#342A21]/15 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
            <span>Official Setlla Sponsored Media Playbook</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-[#342A21] font-normal tracking-tight">
            Ads Setup & Campaign Management Guide
          </h2>
          <p className="text-xs sm:text-sm text-[#70798C] mt-1 max-w-2xl leading-relaxed">
            Everything you need to plan, produce, launch, and connect programmatic campaigns across Setlla's rental network.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-[#F6F3EF] border border-[#E5E7EB] text-[#70798C] hover:text-[#342A21] flex items-center justify-center transition-colors cursor-pointer self-start sm:self-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#E5E7EB] no-scrollbar flex-nowrap sm:flex-wrap">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                  : 'bg-white text-[#70798C] border border-[#E5E7EB] hover:text-[#342A21]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-300' : 'text-[#70798C]'}`} />
              <span>{item.label}</span>
              {item.adminOnly && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold uppercase shrink-0">
                  Admin
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-[#E5E7EB] shadow-xs">
        {renderSectionContent()}
      </div>
    </div>
  );
};
