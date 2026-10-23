import React, { useState, useEffect } from 'react';
import { 
  X, 
  Code2, 
  Key, 
  Terminal, 
  Copy, 
  Check, 
  Play, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Layers
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

interface ApiWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdvertPushed?: (newAd: AdvertStory) => void;
}

export const ApiWebhookModal: React.FC<ApiWebhookModalProps> = ({
  isOpen,
  onClose,
  onAdvertPushed,
}) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'keys' | 'simulator'>('docs');
  const [keys, setKeys] = useState<PartnerApiKey[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);
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
  const [simHeadline, setSimHeadline] = useState('24/7 Solar Backup Power for Asaba Renters');
  const [simCompanyName, setSimCompanyName] = useState('Asaba Solar & Power Solutions Ltd');
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

  const handleCopyCurl = () => {
    const activeKey = keys[0]?.apiKey || 'stla_live_sample_partner_key';
    const curlCode = `curl -X POST "https://iadzihievmbhssqycpol.supabase.co/rest/v1/adverts" \\
  -H "Content-Type: application/json" \\
  -H "X-Setlla-Partner-Key: ${activeKey}" \\
  -d '{
    "companyName": "Asaba Solar & Power Solutions Ltd",
    "headline": "24/7 Solar Backup Power for Delta Renters",
    "description": "Zero down payment solar installations for apartments across Asaba & Warri.",
    "category": "Service",
    "mediaUrl": "https://images.unsplash.com/photo-1509391365360-2e959784a276",
    "ctaText": "Get Free Quote",
    "actionType": "contact",
    "whatsappNumber": "08031122334",
    "location": "Asaba, Delta State",
    "durationDays": 30
  }'`;
    navigator.clipboard.writeText(curlCode);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
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
      location: 'Delta State Network Wide',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scale-up">
        {/* Modal Top Header */}
        <div className="bg-[#000004] text-white p-6 sm:p-7 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Terminal className="w-3.5 h-3.5" />
            <span>Method 3: Programmatic Push API & Webhook Gateway</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Automated External Ad Ingestion
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Allow corporate brands, real estate portals, and digital agencies to programmatically push and update sponsored campaigns on Setlla via secured REST API keys.
          </p>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/10 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('docs')}
              className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'docs'
                  ? 'bg-white text-[#000004] shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>API Specs & cURL</span>
            </button>

            <button
              onClick={() => setActiveTab('keys')}
              className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'keys'
                  ? 'bg-white text-[#000004] shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Partner API Keys ({keys.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-amber-400 text-[#000004] shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#70798C] block">
                    Public Ingestion Endpoint
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-xs font-bold">
                      POST
                    </span>
                    <code className="text-xs sm:text-sm font-mono font-bold text-[#000004]">
                      https://iadzihievmbhssqycpol.supabase.co/rest/v1/adverts
                    </code>
                  </div>
                </div>

                <button
                  onClick={handleCopyCurl}
                  className="py-2 px-3.5 rounded-xl bg-[#000004] hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  {copiedCurl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
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

              {/* cURL Code Block */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#70798C] block mb-2">
                  Sample Request Body & Headers
                </label>
                <pre className="p-4 rounded-2xl bg-[#000004] text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  {`curl -X POST "https://iadzihievmbhssqycpol.supabase.co/rest/v1/adverts" \\
  -H "Content-Type: application/json" \\
  -H "X-Setlla-Partner-Key: stla_live_8f39a01b92c44de88a912bf7" \\
  -d '{
    "companyName": "Asaba Solar & Power Solutions Ltd",
    "headline": "24/7 Solar Backup Power for Delta Renters",
    "description": "Zero down payment solar installations for apartments across Asaba & Warri.",
    "category": "Service",
    "mediaUrl": "https://images.unsplash.com/photo-1509391365360-2e959784a276",
    "ctaText": "Get Free Quote",
    "actionType": "contact",
    "whatsappNumber": "08031122334",
    "location": "Asaba, Delta State",
    "durationDays": 30
  }'`}
                </pre>
              </div>

              {/* Payload Field Specs */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#70798C] block mb-3">
                  JSON Parameters Schema
                </label>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-[#70798C]">
                      <tr>
                        <th className="p-3">Field</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Required</th>
                        <th className="p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[#000004]">
                      <tr>
                        <td className="p-3 font-mono font-bold text-amber-700">companyName</td>
                        <td className="p-3 text-[#70798C]">string</td>
                        <td className="p-3 font-bold text-rose-600">Yes</td>
                        <td className="p-3">Official business / brand title displayed to users.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-amber-700">headline</td>
                        <td className="p-3 text-[#70798C]">string</td>
                        <td className="p-3 font-bold text-rose-600">Yes</td>
                        <td className="p-3">Promotional headline (max 60 characters).</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-amber-700">mediaUrl</td>
                        <td className="p-3 text-[#70798C]">string (url)</td>
                        <td className="p-3 font-bold text-rose-600">Yes</td>
                        <td className="p-3">Direct CDN link to high-res image (9:16 or 16:9) or MP4 video.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold">category</td>
                        <td className="p-3 text-[#70798C]">string</td>
                        <td className="p-3 text-[#70798C]">Optional</td>
                        <td className="p-3">Property | Estate | Promo | Service (defaults to Promo).</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold">whatsappNumber</td>
                        <td className="p-3 text-[#70798C]">string</td>
                        <td className="p-3 text-[#70798C]">Optional</td>
                        <td className="p-3">Nigerian WhatsApp number for direct tenant inquiries.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold">durationDays</td>
                        <td className="p-3 text-[#70798C]">integer</td>
                        <td className="p-3 text-[#70798C]">Optional</td>
                        <td className="p-3">Campaign flight length in days (defaults to 30 days).</td>
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
                  <h4 className="font-bold text-sm text-[#000004]">Registered Corporate Partner Keys</h4>
                  <p className="text-xs text-[#70798C] mt-0.5">
                    Generate and manage private keys for external brands pushing campaigns to Setlla.
                  </p>
                </div>

                <button
                  onClick={() => setShowNewKeyModal(true)}
                  className="py-2 px-3.5 rounded-xl bg-[#000004] hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Generate Partner Key</span>
                </button>
              </div>

              {/* Keys List */}
              <div className="space-y-3">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-[#000004]">{k.companyName}</span>
                        {k.isActive ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                            Revoked
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#70798C]">
                        <span>{k.contactEmail}</span>
                        <span>·</span>
                        <span>{k.requestsToday} requests today</span>
                        <span>·</span>
                        <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-[#000004]">
                          {k.apiKey.slice(0, 14)}••••••••••••••••
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleCopy(k.apiKey, k.id)}
                        className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-[#000004] flex items-center gap-1 cursor-pointer"
                        title="Copy Key"
                      >
                        {copiedKey === k.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[#70798C]" />
                        )}
                        <span className="text-[11px] font-semibold">Copy</span>
                      </button>

                      <button
                        onClick={() => handleToggleKey(k.id)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                          k.isActive
                            ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {k.isActive ? 'Suspend' : 'Activate'}
                      </button>

                      <button
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inline Modal to Create Key */}
              {showNewKeyModal && (
                <div className="p-5 rounded-2xl bg-[#FCF9F5] border border-dashed border-slate-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-[#000004]">Issue New Partner API Key</h5>
                    <button
                      onClick={() => setShowNewKeyModal(false)}
                      className="text-xs text-[#70798C] hover:text-[#000004]"
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
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Official Contact Email *"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Phone (Optional)"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#000004] text-white text-xs font-bold cursor-pointer shrink-0"
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
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <span className="font-bold block">Interactive Push API Sandbox</span>
                  Simulate an incoming automated HTTP push payload from an external corporate partner to test validation, storage, and live rendering across Setlla.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#000004] block mb-1">
                    Select Test Partner API Key
                  </label>
                  <select
                    value={simSelectedKey}
                    onChange={(e) => setSimSelectedKey(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FCF9F5] border border-slate-200 rounded-xl text-xs font-mono text-[#000004] focus:outline-none"
                  >
                    {keys.map((k) => (
                      <option key={k.id} value={k.apiKey}>
                        {k.companyName} ({k.apiKey.slice(0, 16)}...)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#000004] block mb-1">Partner Brand Name</label>
                  <input
                    type="text"
                    value={simCompanyName}
                    onChange={(e) => setSimCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FCF9F5] border border-slate-200 rounded-xl text-xs text-[#000004]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#000004] block mb-1">Campaign Headline</label>
                  <input
                    type="text"
                    value={simHeadline}
                    onChange={(e) => setSimHeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FCF9F5] border border-slate-200 rounded-xl text-xs text-[#000004]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#000004] block mb-1">Category</label>
                  <select
                    value={simCategory}
                    onChange={(e) => setSimCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FCF9F5] border border-slate-200 rounded-xl text-xs text-[#000004]"
                  >
                    <option value="Service">Service</option>
                    <option value="Property">Property</option>
                    <option value="Estate">Estate</option>
                    <option value="Promo">Promo</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-[#000004] block mb-1">Media Creative URL</label>
                  <input
                    type="url"
                    value={simMediaUrl}
                    onChange={(e) => setSimMediaUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FCF9F5] border border-slate-200 rounded-xl text-xs font-mono text-[#000004]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#70798C]">
                  Duration: <strong className="text-[#000004]">{simDuration} Days</strong>
                </span>

                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="py-2.5 px-5 rounded-xl bg-[#000004] hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
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
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {simResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      )}
                      HTTP {simResult.status} {simResult.success ? 'Created' : 'Error'}
                    </span>
                    <span className="font-mono text-[10px] bg-white/70 px-2 py-0.5 rounded">
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
  );
};
