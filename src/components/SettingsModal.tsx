import React, { useState, useEffect } from "react";
import { X, Key, Database, Globe, CheckCircle2, AlertTriangle, RefreshCw, ExternalLink, ShieldAlert } from "lucide-react";
import { AppConfig } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSaveConfig: (updated: AppConfig) => void;
  hasServerGemini: boolean;
  hasServerZeroTrue?: boolean;
  hasServerSupabase?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  hasServerGemini,
  hasServerZeroTrue = false,
  hasServerSupabase = false,
}) => {
  const [formData, setFormData] = useState<AppConfig>({ ...config });
  const [testStatus, setTestStatus] = useState<{
    type: "zerotrue" | "supabase" | null;
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ type: null, loading: false });

  // Keep form fields synchronized with config whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ ...config });
      setTestStatus({ type: null, loading: false });
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleChange = (field: keyof AppConfig, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSaveConfig(formData);
    onClose();
  };

  const handleTestZeroTrue = async () => {
    setTestStatus({ type: "zerotrue", loading: true });
    try {
      const res = await fetch("/api/zerotrue/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
          apiKey: formData.zeroTrueApiKey,
          apiUrl: formData.zeroTrueApiUrl || "https://app.zerotrue.app/api/v1/check",
          isPrivateScan: false,
          isDeepScan: false,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const modelName = data.result?.ml_model || data.result?.summary?.overall_assessment || "VoiceAIDetector";
        const aiProb = data.result?.ai_probability !== undefined
          ? `${(data.result.ai_probability * 100).toFixed(1)}%`
          : "analyzed";
        setTestStatus({
          type: "zerotrue",
          loading: false,
          success: true,
          message: `Connected successfully! ML Model: ${modelName} | AI Prob: ${aiProb} (Source: ${data.source || "zerotrue"})`,
        });
      } else {
        setTestStatus({
          type: "zerotrue",
          loading: false,
          success: false,
          message: data.error || "Failed to reach ZeroTrue endpoint",
        });
      }
    } catch (err: any) {
      setTestStatus({
        type: "zerotrue",
        loading: false,
        success: false,
        message: err.message || "Network error",
      });
    }
  };

  const handleTestSupabase = async () => {
    setTestStatus({ type: "supabase", loading: true });
    try {
      // Small test buffer
      const dummyBase64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
      const res = await fetch("/api/storage/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioData: dummyBase64,
          fileName: "test-ping.wav",
          supabaseUrl: formData.supabaseUrl,
          supabaseAnonKey: formData.supabaseAnonKey,
          bucketName: formData.supabaseBucket || "voicesentry-audio",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTestStatus({
          type: "supabase",
          loading: false,
          success: true,
          message: `Storage Verified! Public URL Generated: ${data.url}`,
        });
      } else {
        setTestStatus({
          type: "supabase",
          loading: false,
          success: false,
          message: data.error || "Supabase storage check failed",
        });
      }
    } catch (err: any) {
      setTestStatus({
        type: "supabase",
        loading: false,
        success: false,
        message: err.message || "Network error",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        id="settings-modal-card"
        className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif italic text-white font-medium">API &amp; Cloud Storage Configuration</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ZeroTrue AI voice authenticity endpoint &amp; Supabase audio bucket synchronization
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Alert on Data Flow */}
        <div className="my-4 p-4 rounded-xl bg-[#0F0F12] border border-white/10 text-xs text-slate-300 leading-relaxed flex items-start space-x-3">
          <Globe className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white font-mono uppercase tracking-wider text-[11px] block mb-0.5">Target Architecture Workflow:</span>
            Uploaded voice clips are stored directly into your Supabase Storage bucket, generating an authenticated public audio URL. This URL is then attached to the ZeroTrue detection payload (<code className="bg-black/60 px-1 py-0.5 rounded text-indigo-300 font-mono text-[11px]">{"{ input: { type: 'url', value: '<url>' } }"}</code>) exactly conforming to the ZeroTrue API specification.
          </div>
        </div>

        <div className="space-y-5">
          {/* 1. ZeroTrue API Settings */}
          <div className="p-5 rounded-xl bg-[#0F0F12] border border-white/10 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-white">ZeroTrue Voice AI Detection</h3>
              </div>
              <div className="flex items-center space-x-2">
                {hasServerZeroTrue && (
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                    Server Key Active
                  </span>
                )}
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">v1 Check API</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                ZeroTrue API Key
              </label>
              <input
                id="input-zerotrue-key"
                type="password"
                value={formData.zeroTrueApiKey}
                onChange={(e) => handleChange("zeroTrueApiKey", e.target.value)}
                placeholder="Enter ZeroTrue API Key (or leave blank to use server env)"
                className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/10 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Found in your ZeroTrue developer dashboard. Leave blank to use server environment credentials.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                ZeroTrue Check Endpoint URL
              </label>
              <input
                id="input-zerotrue-url"
                type="text"
                value={formData.zeroTrueApiUrl}
                onChange={(e) => handleChange("zeroTrueApiUrl", e.target.value)}
                placeholder="https://app.zerotrue.app/api/v1/check"
                className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/10 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestZeroTrue}
                disabled={testStatus.loading && testStatus.type === "zerotrue"}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-indigo-300 border border-white/10 transition-all cursor-pointer"
              >
                {testStatus.loading && testStatus.type === "zerotrue" ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Key className="w-3.5 h-3.5" />
                )}
                <span>Test ZeroTrue Endpoint</span>
              </button>

              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Payload format: <span className="text-slate-300">JSON + Bearer token</span>
              </span>
            </div>
          </div>

          {/* 2. Supabase Storage Settings */}
          <div className="p-5 rounded-xl bg-[#0F0F12] border border-white/10 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-white">Supabase Cloud Audio Storage</h3>
              </div>
              <div className="flex items-center space-x-2">
                {hasServerSupabase && (
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                    Server Storage Active
                  </span>
                )}
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Object Storage</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Supabase Project URL
                </label>
                <input
                  id="input-supabase-url"
                  type="text"
                  value={formData.supabaseUrl}
                  onChange={(e) => handleChange("supabaseUrl", e.target.value)}
                  placeholder="https://xyzabcdefg.supabase.co"
                  className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/10 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Storage Bucket Name
                </label>
                <input
                  id="input-supabase-bucket"
                  type="text"
                  value={formData.supabaseBucket}
                  onChange={(e) => handleChange("supabaseBucket", e.target.value)}
                  placeholder="voicesentry-audio"
                  className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/10 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Supabase Anon / Service Key
              </label>
              <input
                id="input-supabase-key"
                type="password"
                value={formData.supabaseAnonKey}
                onChange={(e) => handleChange("supabaseAnonKey", e.target.value)}
                placeholder="Enter Supabase Key (or leave blank to use server env)"
                className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/10 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={testStatus.loading && testStatus.type === "supabase"}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-emerald-300 border border-white/10 transition-all cursor-pointer"
              >
                {testStatus.loading && testStatus.type === "supabase" ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Database className="w-3.5 h-3.5" />
                )}
                <span>Test Bucket Upload</span>
              </button>

              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Auto-generates public CDN URL
              </span>
            </div>
          </div>

          {/* Test Feedback */}
          {testStatus.message && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
                testStatus.success
                  ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-950/30 border-rose-500/40 text-rose-300"
              }`}
            >
              {testStatus.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="break-all font-mono text-[11px]">{testStatus.message}</span>
            </div>
          )}

          {/* Gemini AI Status */}
          <div className="p-3.5 rounded-xl bg-[#050505] border border-white/5 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-300">
              <div className={`w-2 h-2 rounded-full ${hasServerGemini ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></div>
              <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider">Conversation NLP:</span>
              <span className="font-medium text-white">Google Gemini 3.6 Flash (Server-Side)</span>
            </div>
            <span className={`font-mono text-[10px] uppercase tracking-wider font-bold ${hasServerGemini ? "text-emerald-400" : "text-amber-400"}`}>
              {hasServerGemini ? "Active & Grounded" : "Rule-Based Fallback"}
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-slate-200 shadow-lg transition-all cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
