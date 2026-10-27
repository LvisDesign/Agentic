import React, { useState, useEffect } from 'react';
import { 
  X, 
  Code2, 
  KeyRound, 
  Copy, 
  Check, 
  Play, 
  Plus, 
  Trash2, 
  Zap, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { 
  getPartnerApiKeys, 
  createPartnerApiKey, 
  togglePartnerApiKey, 
  deletePartnerApiKey, 
  pushProgrammaticAdvert, 
  PartnerApiKey,
  ProgrammaticPushPayload 
} from '../../services/adService';
import { AdvertStory } from '../../data/mockAdverts';
import { CustomConfirmModal } from '../UI/CustomConfirmModal';
import { ModalPortal } from '../UI/ModalPortal';
import { AdminCustomSelect } from '../UI/AdminCustomSelect';

interface ApiWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdvertPushed?: (newAd: AdvertStory) => void;
  onOpenFullPage?: () => void;
}

export const ApiWebhookModal: React.FC<ApiWebhookModalProps> = ({
  isOpen,
  onClose,
  onAdvertPushed,
  onOpenFullPage,
}) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'keys' | 'simulator'>('docs');
  const [keys, setKeys] = useState<PartnerApiKey[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemTitle?: string;
    badge?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    isAlertOnly?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // New Key Form
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Simulator State
  const [simSelectedKey, setSimSelectedKey] = useState('');
  const [simHeadline, setSimHeadline] = useState('24/7 Solar Backup Power for Modern Homes');
  const [simCompanyName, setSimCompanyName] = useState('Apex Solar & Power Solutions Ltd');
  const [simMediaUrl, setSimMediaUrl] = useState('https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1080&q=80');
  const [simCategory, setSimCategory] = useState<'Property' | 'Estate' | 'Promo' | 'Service'>('Service');
  const [simCtaText, setSimCtaText] = useState('Get Free Quote');
  const [simWhatsapp, setSimWhatsapp] = useState('08031122334');
  const [simDuration, setSimDuration] = useState(30);

  const [simResult, setSimResult] = useState<{
    status: number;
    success: boolean;
    advert?: AdvertStory;
    error?: string;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadedKeys = getPartnerApiKeys();
      setKeys(loadedKeys);
      if (loadedKeys.length > 0 && !simSelectedKey) {
        setSimSelectedKey(loadedKeys[0].apiKey);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText('https://iadzihievmbhssqycpol.supabase.co/rest/v1/adverts');
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const handleCopyCurl = () => {
    const activeKey = keys[0]?.apiKey || 'stla_live_sample_partner_key';
    const curlCode = `curl -X POST "https://iadzihievmbhssqycpol.supabase.co/rest/v1/adverts" \\
  -H "Content-Type: application/json" \\
  -H "X-Setlla-Partner-Key: ${activeKey}" \\
  -d '{
    "companyName": "Apex Solar & Power Solutions Ltd",
    "headline": "24/7 Solar Backup Power for Modern Homes",
    "description": "Zero down payment solar installations for apartments nationwide.",
    "category": "Service",
    "mediaUrl": "https://images.unsplash.com/photo-1509391365360-2e959784a276",
    "ctaText": "Get Free Quote",
    "actionType": "contact",
    "whatsappNumber": "08031122334",
    "location": "Nationwide",
    "durationDays": 30
  }'`;
    navigator.clipboard.writeText(curlCode);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleOpenPage = () => {
    onClose();
    if (onOpenFullPage) {
      onOpenFullPage();
    } else {
      window.location.hash = '#/partner';
    }
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName || !newEmail) return;
    const created = createPartnerApiKey(newCompanyName, newEmail, newPhone);
    setKeys(getPartnerApiKeys());
    setShowNewKeyModal(false);
    setNewCompanyName('');
    setNewEmail('');
    setNewPhone('');
    setSimSelectedKey(created.apiKey);
  };

  const handleToggleKey = (id: string) => {
    const updated = togglePartnerApiKey(id);
    setKeys(updated);
  };

  const handleDeleteKey = (id: string) => {
    const targetKey = keys.find((k) => k.id === id);
    setConfirmState({
      isOpen: true,
      title: 'Revoke & Delete Partner API Key?',
      message: 'Any automated marketing scripts or server integrations using this API key will immediately be rejected.',
      itemTitle: targetKey ? `${targetKey.companyName} (${targetKey.apiKey})` : id,
      badge: 'API SECURITY ACTION',
      confirmText: 'Yes, Revoke Key',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        const updated = deletePartnerApiKey(id);
        setKeys(updated);
        setConfirmState(null);
      },
    });
  };

  const handleRunSimulation = async () => {
    if (!simSelectedKey) {
      setConfirmState({
        isOpen: true,
        title: 'Partner API Key Required',
        message: 'Please generate or select an active Partner API Key before executing a programmatic push simulation.',
        badge: 'GATEWAY VALIDATION',
        confirmText: 'Understood',
        variant: 'warning',
        isAlertOnly: true,
        onConfirm: () => setConfirmState(null),
      });
      return;
    }
    setIsSimulating(true);
    setSimResult(null);

    const payload: ProgrammaticPushPayload = {
      companyName: simCompanyName,
      headline: simHeadline,
      description: 'Programmatic push test campaign executed via Setlla Live Webhook API Gateway.',
      category: simCategory,
      mediaUrl: simMediaUrl,
      mediaType: 'image',
      ctaText: simCtaText,
      actionType: 'contact',
      whatsappNumber: simWhatsapp,
      location: 'Network Wide',
      durationDays: simDuration,
    };

    setTimeout(async () => {
      const res = await pushProgrammaticAdvert(payload, simSelectedKey);
      setSimResult({
        status: res.statusCode,
        success: res.success,
        advert: res.advert,
        error: res.error,
      });
      setIsSimulating(false);
      if (res.success && res.advert && onAdvertPushed) {
        onAdvertPushed(res.advert);
      }
      setKeys(getPartnerApiKeys());
    }, 600);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto font-body">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-card border border-[#342A21]/15 overflow-hidden my-auto animate-scale-up">
        {/* Modal Top Header: Warm Ivory & Serif */}
        <div className="bg-[#FCF9F5] p-6 sm:p-7 border-b border-[#342A21]/10 relative">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#342A21]/5 text-[#342A21] border border-[#342A21]/15 text-xs font-semibold">
              <Code2 className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Programmatic Push API & Webhook Ingestion</span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#F6F3EF] border border-[#E5E7EB] text-[#70798C] hover:text-[#342A21] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl text-[#342A21] font-normal tracking-tight mt-3">
            Automated External Ad Ingestion
          </h2>
          <p className="text-xs sm:text-sm text-[#70798C] mt-1 max-w-2xl leading-relaxed">
            Allow corporate brands, real estate CMS portals, and digital marketing agencies to programmatically push and update sponsored campaigns on Setlla via secured REST API keys.
          </p>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[#342A21]/10 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('docs')}
              className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'docs'
                  ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                  : 'bg-white text-[#70798C] border border-[#E5E7EB] hover:text-[#342A21]'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>API Specs & cURL</span>
            </button>

            <button
              onClick={() => setActiveTab('keys')}
              className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'keys'
                  ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                  : 'bg-white text-[#70798C] border border-[#E5E7EB] hover:text-[#342A21]'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Partner API Keys ({keys.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-[#342A21] text-[#FCF9F5] shadow-xs'
                  : 'bg-white text-[#70798C] border border-[#E5E7EB] hover:text-[#342A21]'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>Live Push Simulator</span>
            </button>
          </div>
        </div>

        {/* Modal Body Panels */}
        <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto">
          {/* TAB 1: API SPECS & CURL */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FCF9F5] p-4 rounded-2xl border border-[#E5E7EB]">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#70798C] block">
                    Public Ingestion Endpoint
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-[#342A21] text-white font-mono text-xs font-bold">
                      POST
                    </span>
                    <code className="text-xs sm:text-sm font-mono font-semibold text-[#342A21]">
                      https://iadzihievmbhssqycpol.supabase.co/rest/v1/adverts
                    </code>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopyEndpoint}
                    className="py-2 px-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F6F3EF] text-[#342A21] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedEndpoint ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#70798C]" />}
                    <span>{copiedEndpoint ? 'Copied' : 'Copy URL'}</span>
                  </button>

                  <button
                    onClick={handleCopyCurl}
                    className="py-2 px-3.5 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {copiedCurl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-amber-300" />
                        <span>Copied cURL!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy cURL Command</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* cURL Code Block */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#342A21] block mb-2">
                  Sample Request Body & Headers
                </label>
                <pre className="p-4 rounded-2xl bg-[#FCF9F5] text-[#342A21] text-xs font-mono overflow-x-auto leading-relaxed border border-[#E5E7EB]">
{`curl -X POST "https://iadzihievmbhssqycpol.supabase.co/rest/v1/adverts" \\
  -H "Content-Type: application/json" \\
  -H "X-Setlla-Partner-Key: stla_live_8f39a01b92c44de88a912bf7" \\
  -d '{
    "companyName": "Apex Solar & Power Solutions Ltd",
    "headline": "24/7 Solar Backup Power for Modern Homes",
    "description": "Zero down payment solar installations for apartments nationwide.",
    "category": "Service",
    "mediaUrl": "https://images.unsplash.com/photo-1509391365360-2e959784a276",
    "ctaText": "Get Free Quote",
    "actionType": "contact",
    "whatsappNumber": "08031122334",
    "location": "Nationwide",
    "durationDays": 30
  }'`}
                </pre>
              </div>

              {/* Payload Field Specs */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#342A21] block mb-3">
                  JSON Parameters Schema
                </label>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-[#E5E7EB] rounded-xl overflow-hidden">
                    <thead className="bg-[#FCF9F5] border-b border-[#E5E7EB] font-semibold text-[#70798C]">
                      <tr>
                        <th className="p-3">Field</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Required</th>
                        <th className="p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] text-[#342A21]">
                      <tr>
                        <td className="p-3 font-mono font-semibold text-[#B45309]">companyName</td>
                        <td className="p-3 text-[#70798C]">string</td>
                        <td className="p-3 font-semibold text-rose-700">Yes</td>
                        <td className="p-3">Official business / brand title displayed to users.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-semibold text-[#B45309]">headline</td>
                        <td className="p-3 text-[#70798C]">string</td>
                        <td className="p-3 font-semibold text-rose-700">Yes</td>
                        <td className="p-3">Promotional headline (max 60 characters).</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-semibold text-[#B45309]">mediaUrl</td>
                        <td className="p-3 text-[#70798C]">string (url)</td>
                        <td className="p-3 font-semibold text-rose-700">Yes</td>
                        <td className="p-3">Direct CDN link to high-res image (9:16 or 16:9) or MP4 video.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-semibold">category</td>
                        <td className="p-3 text-[#70798C]">string</td>
                        <td className="p-3 text-[#70798C]">Optional</td>
                        <td className="p-3">Property | Estate | Promo | Service (defaults to Promo).</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-semibold">whatsappNumber</td>
                        <td className="p-3 text-[#70798C]">string</td>
                        <td className="p-3 text-[#70798C]">Optional</td>
                        <td className="p-3">Nigerian WhatsApp number for direct tenant inquiries.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-semibold">durationDays</td>
                        <td className="p-3 text-[#70798C]">integer</td>
                        <td className="p-3 text-[#70798C]">Optional</td>
                        <td className="p-3">Campaign duration in days (defaults to 30 days).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PARTNER API KEYS */}
          {activeTab === 'keys' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display font-medium text-base text-[#342A21]">Registered Corporate Partner Keys</h4>
                  <p className="text-xs text-[#70798C] mt-0.5">
                    Generate and manage private keys for external brands pushing campaigns to Setlla.
                  </p>
                </div>

                <button
                  onClick={() => setShowNewKeyModal(true)}
                  className="py-2 px-3.5 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-300" />
                  <span>Generate Partner Key</span>
                </button>
              </div>

              {/* Keys List */}
              <div className="space-y-3">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="p-4 rounded-2xl bg-[#FCF9F5] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#342A21]/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-[#342A21]">{k.companyName}</span>
                        {k.isActive ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            Suspended
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#70798C]">
                        <span>{k.contactEmail}</span>
                        <span>·</span>
                        <span>{k.requestsToday} requests today</span>
                        <span>·</span>
                        <code className="font-mono bg-white px-2 py-0.5 rounded border border-[#E5E7EB] text-[11px] text-[#342A21]">
                          {k.apiKey.slice(0, 14)}••••••••••••••••
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleCopy(k.apiKey, k.id)}
                        className="py-1.5 px-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F6F3EF] text-xs text-[#342A21] font-medium flex items-center gap-1 cursor-pointer"
                        title="Copy Key"
                      >
                        {copiedKey === k.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[#70798C]" />
                        )}
                        <span>{copiedKey === k.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => handleToggleKey(k.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                          k.isActive
                            ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {k.isActive ? 'Suspend' : 'Activate'}
                      </button>

                      <button
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inline Form to Create Key */}
              {showNewKeyModal && (
                <div className="p-5 rounded-2xl bg-white border border-[#342A21]/20 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h5 className="font-display font-medium text-xs text-[#342A21]">Issue New Partner API Key</h5>
                    <button
                      onClick={() => setShowNewKeyModal(false)}
                      className="text-xs text-[#70798C] hover:text-[#342A21]"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleCreateKey} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Company Name *"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      className="px-3.5 py-2 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Official Contact Email *"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="px-3.5 py-2 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Phone (Optional)"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004] focus:outline-none focus:border-[#342A21]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#342A21] text-white text-xs font-semibold cursor-pointer shrink-0"
                      >
                        Generate
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-5">
              <div className="bg-[#FCF9F5] border border-[#E5E7EB] rounded-2xl p-4 flex items-start gap-3">
                <Zap className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
                <div className="text-xs text-[#342A21]">
                  <span className="font-semibold block text-[#342A21]">Interactive Push API Sandbox</span>
                  Simulate an incoming automated HTTP push payload from an external corporate partner to test validation, storage, and live rendering across Setlla.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1">
                    Select Test Partner API Key
                  </label>
                  <AdminCustomSelect
                    value={simSelectedKey}
                    onChange={(val) => setSimSelectedKey(val)}
                    options={keys.map((k) => ({
                      value: k.apiKey,
                      label: `${k.companyName} (${k.apiKey.slice(0, 16)}...)`,
                    }))}
                    placeholder="Select API Key..."
                    variant="form"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1">Partner Brand Name</label>
                  <input
                    type="text"
                    value={simCompanyName}
                    onChange={(e) => setSimCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1">Campaign Headline</label>
                  <input
                    type="text"
                    value={simHeadline}
                    onChange={(e) => setSimHeadline(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs text-[#000004]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#342A21] block mb-1">Category</label>
                  <AdminCustomSelect
                    value={simCategory}
                    onChange={(val) => setSimCategory(val as any)}
                    options={[
                      { value: 'Service', label: 'Service' },
                      { value: 'Property', label: 'Property' },
                      { value: 'Estate', label: 'Estate' },
                      { value: 'Promo', label: 'Promo' },
                    ]}
                    variant="form"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-[#342A21] block mb-1">Media Creative URL</label>
                  <input
                    type="url"
                    value={simMediaUrl}
                    onChange={(e) => setSimMediaUrl(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FCF9F5] border border-[#E5E7EB] rounded-xl text-xs font-mono text-[#000004]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#70798C]">
                  Duration: <strong className="text-[#342A21]">{simDuration} Days</strong>
                </span>

                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="py-2.5 px-5 rounded-xl bg-[#342A21] hover:bg-[#231C16] text-[#FCF9F5] text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>{isSimulating ? 'Executing POST...' : 'Execute Push API Request'}</span>
                </button>
              </div>

              {/* Simulation Result */}
              {simResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2 animate-fade-in ${
                    simResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      {simResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      )}
                      HTTP {simResult.status} {simResult.success ? 'Created' : 'Error'}
                    </span>
                    <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-200">
                      ID: {simResult.advert?.id || 'N/A'}
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed">
                    {simResult.success
                      ? `Campaign "${simResult.advert?.headline}" received, verified, and broadcasted live across Setlla's Stories Tray and Desktop Banners!`
                      : simResult.error}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {confirmState && (
        <CustomConfirmModal
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          itemTitle={confirmState.itemTitle}
          badge={confirmState.badge}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          variant={confirmState.variant}
          isAlertOnly={confirmState.isAlertOnly}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  </ModalPortal>
  );
};
