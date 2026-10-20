import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  UploadCloud, 
  Key, 
  ExternalLink,
  ShieldCheck 
} from 'lucide-react';
import { checkSupabaseHealth, getSupabaseConfig, SupabaseHealth } from '../../utils/supabaseClient';
import { forceSyncLocalListings } from '../../services/listingService';

interface CloudDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted?: () => void;
}

export const CloudDatabaseModal: React.FC<CloudDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSyncCompleted,
}) => {
  const [health, setHealth] = useState<SupabaseHealth>({
    configured: false,
    status: 'DISCONNECTED',
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Manual configuration inputs (fallback if Vercel env vars didn't inject)
  const currentConfig = getSupabaseConfig();
  const [manualUrl, setManualUrl] = useState(currentConfig.url || '');
  const [manualKey, setManualKey] = useState(currentConfig.key || '');
  const [showConfigInputs, setShowConfigInputs] = useState(false);

  const checkConnection = async () => {
    setLoading(true);
    setSyncResult(null);
    try {
      const res = await checkSupabaseHealth();
      setHealth(res);
      if (!res.configured || res.status === 'ERROR') {
        setShowConfigInputs(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveManualConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl || !manualKey) return;

    localStorage.setItem('deltarent_supabase_url', manualUrl.trim());
    localStorage.setItem('deltarent_supabase_key', manualKey.trim());
    window.location.reload();
  };

  const handleClearManualConfig = () => {
    localStorage.removeItem('deltarent_supabase_url');
    localStorage.removeItem('deltarent_supabase_key');
    window.location.reload();
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await forceSyncLocalListings();
      if (res.error) {
        setSyncResult(`Error: ${res.error}`);
      } else {
        setSyncResult(`Success: Uploaded ${res.uploaded} listing(s) to Supabase cloud! All tenants on mobile can now see them.`);
        if (onSyncCompleted) onSyncCompleted();
        checkConnection();
      }
    } catch (err: any) {
      setSyncResult(`Sync failed: ${err?.message || 'Unknown network error'}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#E5E7EB] space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#000004]">
                Supabase Live Cloud Status
              </h3>
              <p className="text-[11px] text-[#70798C]">
                Real-time cross-device sync between Agents and Tenants
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-[#70798C] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Pill Card */}
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          health.status === 'CONNECTED'
            ? 'bg-emerald-50/70 border-emerald-200'
            : health.status === 'ERROR'
            ? 'bg-amber-50/80 border-amber-200'
            : 'bg-red-50/70 border-red-200'
        }`}>
          {health.status === 'CONNECTED' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : health.status === 'ERROR' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#000004]">
                {health.status === 'CONNECTED'
                  ? 'Connected to Supabase'
                  : health.status === 'ERROR'
                  ? 'Supabase Connection Error'
                  : 'Supabase Not Connected'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-white border border-[#E5E7EB]">
                Source: {health.source || 'None'}
              </span>
            </div>

            {health.status === 'CONNECTED' && (
              <p className="text-[11px] text-emerald-800">
                Live database connected! Listings in cloud: <strong>{health.listingsCount ?? 0}</strong>. Any listing posted on this computer will instantly show on mobile.
              </p>
            )}

            {health.errorMessage && (
              <p className="text-[11px] text-red-700 font-medium">
                {health.errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* Action: Force Sync Local Listings to Cloud */}
        <div className="p-4 rounded-xl bg-[#FCF9F5] border border-[#E5E7EB] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#000004]">
              Sync Local Desktop Listings to Cloud
            </span>
            <button
              onClick={handleTriggerSync}
              disabled={syncing}
              className="px-3.5 py-1.5 rounded-lg bg-[#000004] hover:bg-[#1f2937] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing Now...' : 'Sync Properties Now'}</span>
            </button>
          </div>
          <p className="text-[11px] text-[#70798C] leading-relaxed">
            If you posted a property on this computer while offline or before the database was connected, click the button above to immediately upload it to Supabase so tenants on mobile can view it.
          </p>

          {syncResult && (
            <div className={`p-2.5 rounded-lg text-xs font-semibold ${
              syncResult.startsWith('Success')
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {syncResult}
            </div>
          )}
        </div>

        {/* Manual Key Override Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowConfigInputs(!showConfigInputs)}
            className="text-xs font-semibold text-[#70798C] hover:text-[#000004] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-amber-600" />
            <span>{showConfigInputs ? 'Hide Supabase Keys Configuration' : 'Enter / Update Supabase Keys in Browser'}</span>
          </button>

          {showConfigInputs && (
            <form onSubmit={handleSaveManualConfig} className="mt-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3 animate-fade-in text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://xxxxxxxxxxxx.supabase.co"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:border-[#000004]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Supabase Anon / Public API Key
                </label>
                <input
                  type="password"
                  value={manualKey}
                  onChange={(e) => setManualKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:border-[#000004]"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Save & Connect
                </button>
                {localStorage.getItem('deltarent_supabase_url') && (
                  <button
                    type="button"
                    onClick={handleClearManualConfig}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Reset to Vercel Defaults
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#70798C]">
          <span>Schema: backend/schema.sql</span>
          <button
            onClick={checkConnection}
            disabled={loading}
            className="text-xs font-bold text-[#000004] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Recheck Connection</span>
          </button>
        </div>
      </div>
    </div>
  );
};
