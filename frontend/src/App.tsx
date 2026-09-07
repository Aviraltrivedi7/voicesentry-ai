import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { LiveScanner } from "./components/LiveScanner";
import { CallSimulator } from "./components/CallSimulator";
import { SpeakerProfilesView } from "./components/SpeakerProfilesView";
import { AuditLogsView } from "./components/AuditLogsView";
import { SettingsModal } from "./components/SettingsModal";
import { ArchitectureModal } from "./components/ArchitectureModal";
import { PreventativeActionModal } from "./components/PreventativeActionModal";
import { AppConfig, PipelineAnalysisReport, SpeakerProfile } from "./types";
import { INITIAL_SPEAKER_PROFILES, INITIAL_AUDIT_LOGS } from "./data/mockData";
import { fetchConfigStatus, sendTransactionBlock } from "./services/api";
import { CheckCircle2, Shield, Radio, PhoneCall, Users, FileText, Sparkles, ExternalLink, X } from "lucide-react";

const DEFAULT_CONFIG: AppConfig = {
  zeroTrueApiKey: "",
  zeroTrueApiUrl: "https://app.zerotrue.app/api/v1/check",
  supabaseUrl: "",
  supabaseAnonKey: "",
  supabaseBucket: "voicesentry-audio",
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"scanner" | "simulator" | "profiles" | "audit">("scanner");

  // Config state (clean empty-string defaults, populated from server config or user overrides)
  const [config, setConfig] = useState<AppConfig>(() => {
    const version = localStorage.getItem("voicesentry_config_version");
    if (version !== "v2") {
      localStorage.removeItem("voicesentry_config");
      localStorage.setItem("voicesentry_config_version", "v2");
      return DEFAULT_CONFIG;
    }
    const saved = localStorage.getItem("voicesentry_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          zeroTrueApiKey: typeof parsed.zeroTrueApiKey === "string" ? parsed.zeroTrueApiKey : "",
          zeroTrueApiUrl: parsed.zeroTrueApiUrl || "https://app.zerotrue.app/api/v1/check",
          supabaseUrl: typeof parsed.supabaseUrl === "string" ? parsed.supabaseUrl : "",
          supabaseAnonKey: typeof parsed.supabaseAnonKey === "string" ? parsed.supabaseAnonKey : "",
          supabaseBucket: parsed.supabaseBucket || "voicesentry-audio",
        };
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_CONFIG;
  });

  // Real server capabilities state populated via fetchConfigStatus
  const [hasServerGemini, setHasServerGemini] = useState(false);
  const [serverConfigStatus, setServerConfigStatus] = useState<{
    hasGemini: boolean;
    hasZeroTrue: boolean;
    hasSupabase: boolean;
    supabaseBucket: string;
    zeroTrueUrl: string;
  } | null>(null);

  // Fetch real server configuration and capabilities on mount
  useEffect(() => {
    fetchConfigStatus()
      .then((status) => {
        setHasServerGemini(status.hasGemini);
        setServerConfigStatus(status);
        setConfig((prev) => ({
          ...prev,
          zeroTrueApiUrl: prev.zeroTrueApiUrl || status.zeroTrueUrl || "https://app.zerotrue.app/api/v1/check",
          supabaseBucket: prev.supabaseBucket || status.supabaseBucket || "voicesentry-audio",
        }));
      })
      .catch((err) => {
        console.warn("Failed to fetch server config status:", err);
      });
  }, []);

  // Speakers & Logs State
  const [speakerProfiles, setSpeakerProfiles] = useState<SpeakerProfile[]>(() => {
    const saved = localStorage.getItem("voicesentry_speakers");
    return saved ? JSON.parse(saved) : INITIAL_SPEAKER_PROFILES;
  });

  const [auditLogs, setAuditLogs] = useState<PipelineAnalysisReport[]>(() => {
    const saved = localStorage.getItem("voicesentry_logs");
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedReportForAction, setSelectedReportForAction] = useState<PipelineAnalysisReport | null>(null);
  const [inspectLogReport, setInspectLogReport] = useState<PipelineAnalysisReport | null>(null);

  // System notification banner
  const [notification, setNotification] = useState<string | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem("voicesentry_config", JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem("voicesentry_speakers", JSON.stringify(speakerProfiles));
  }, [speakerProfiles]);

  useEffect(() => {
    localStorage.setItem("voicesentry_logs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Handle new scan report
  const handleAnalysisCompleted = (report: PipelineAnalysisReport) => {
    setAuditLogs((prev) => [report, ...prev]);
    if (report.decision === "BLOCK") {
      setNotification(`CRITICAL ALERT: Impersonation Attack Detected (${report.callerName})! Automatic block recommended.`);
    } else if (report.decision === "VERIFY") {
      setNotification(`SECONDARY AUTHENTICATION REQUIRED: High uncertainty for ${report.callerName}. Issue challenge.`);
    }
  };

  // Handle manual or automated transaction block from live simulator
  const handleBlockTransaction = async (report: PipelineAnalysisReport) => {
    // 1. Force decision to "BLOCK"
    const blockedReport: PipelineAnalysisReport = {
      ...report,
      decision: "BLOCK",
    };

    // 2. Push full PipelineAnalysisReport into auditLogs (exactly like handleAnalysisCompleted does)
    setAuditLogs((prev) => [blockedReport, ...prev]);

    // 3. Fire global toast notification at the top of the app
    setNotification("TRANSACTION BLOCKED: Call terminated and incident logged.");

    // 4. Dispatch to backend transaction block endpoint (placeholder for real banking/payment webhook)
    // Production integration point: Dispatches real banking payment freeze webhook
    try {
      await sendTransactionBlock({
        reportId: blockedReport.id,
        callerName: blockedReport.callerName,
        riskScore: blockedReport.riskScore,
      });
    } catch (err) {
      console.warn("Block transaction API warning:", err);
    }
  };

  const handleTriggerActionModal = (report: PipelineAnalysisReport) => {
    setSelectedReportForAction(report);
    setIsActionModalOpen(true);
  };

  const handleActionComplete = (actionTakenMessage: string) => {
    setNotification(actionTakenMessage);
  };

  const handleAddProfile = (newProfile: SpeakerProfile) => {
    setSpeakerProfiles((prev) => [newProfile, ...prev]);
    setNotification(`Biometric voiceprint for ${newProfile.name} enrolled.`);
  };

  const handleDeleteProfile = (id: string) => {
    setSpeakerProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        hasZeroTrueConfig={Boolean(config.zeroTrueApiKey)}
        hasSupabaseConfig={Boolean(config.supabaseUrl && config.supabaseAnonKey)}
      />

      {/* Global Toast / System Alert */}
      {notification && (
        <div className="bg-[#0A0A0A] border-b border-white/10 py-2.5 px-4 text-xs animate-fade-in sticky top-[100px] z-30 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-indigo-300">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="font-medium text-xs">{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-500 hover:text-white p-1 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === "scanner" && (
          <LiveScanner
            speakerProfiles={speakerProfiles}
            config={config}
            onAnalysisCompleted={handleAnalysisCompleted}
            onTriggerActionModal={handleTriggerActionModal}
          />
        )}

        {activeTab === "simulator" && (
          <CallSimulator
            speakerProfiles={speakerProfiles}
            onTriggerActionModal={handleTriggerActionModal}
            onBlockTransaction={handleBlockTransaction}
          />
        )}

        {activeTab === "profiles" && (
          <SpeakerProfilesView
            profiles={speakerProfiles}
            onAddProfile={handleAddProfile}
            onDeleteProfile={handleDeleteProfile}
            config={config}
          />
        )}

        {activeTab === "audit" && (
          <AuditLogsView
            logs={auditLogs}
            onSelectLog={(log) => setInspectLogReport(log)}
          />
        )}
      </main>

      {/* Detailed Forensic Inspector Modal (when inspecting an audit log entry) */}
      {inspectLogReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">Forensic Dossier</span>
                <span className="text-sm font-serif italic text-white font-medium">{inspectLogReport.callerName}</span>
              </div>
              <button
                onClick={() => setInspectLogReport(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#050505] border border-white/5">
                <span className="text-slate-500 uppercase font-mono text-[10px] tracking-widest block mb-1">Dynamic Risk Index</span>
                <span className="text-2xl font-bold font-mono text-white">{inspectLogReport.riskScore}<span className="text-xs text-slate-500">/100</span></span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#050505] border border-white/5">
                <span className="text-slate-500 uppercase font-mono text-[10px] tracking-widest block mb-1">Enforced Decision</span>
                <span className={`text-xl font-bold font-mono ${
                  inspectLogReport.decision === "BLOCK"
                    ? "text-rose-400"
                    : inspectLogReport.decision === "VERIFY"
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}>{inspectLogReport.decision}</span>
              </div>
            </div>

            {/* Live vs Simulated Engine Grounding */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#050505] border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Layer 1: Voice</span>
                  {inspectLogReport.layers.voiceAuthenticity.source?.includes("live") || inspectLogReport.layers.voiceAuthenticity.source === "zerotrue-api" ? (
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LIVE API</span>
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider bg-white/5 text-slate-400 border border-white/10">
                      SIMULATED
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-slate-300">
                  Engine: <span className="text-white">{inspectLogReport.layers.voiceAuthenticity.source || "zerotrue-local-engine"}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#050505] border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Layer 3: NLP</span>
                  {inspectLogReport.layers.conversationAnalysis.source === "gemini-3.6-flash" ||
                  inspectLogReport.layers.conversationAnalysis.source === "gemini" ? (
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LIVE API</span>
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider bg-white/5 text-slate-400 border border-white/10">
                      SIMULATED
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-slate-300">
                  Engine: <span className="text-white">{inspectLogReport.layers.conversationAnalysis.source || "nlp-rule-engine-fallback"}</span>
                </div>
              </div>
            </div>

            {/* Warnings Alert Banner (if any) */}
            {inspectLogReport.warnings && inspectLogReport.warnings.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                  Pipeline Fallback Warnings
                </span>
                <ul className="space-y-0.5 text-[11px] font-mono text-amber-200/90 pl-4 list-disc">
                  {inspectLogReport.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-[#050505] border border-white/5 space-y-1.5 text-xs">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 block">Supabase Cloud Object Link</span>
              <p className="font-mono text-indigo-300 break-all text-[11px] bg-white/[0.02] p-2 rounded border border-white/5">{inspectLogReport.audioUrl}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050505] border border-white/5 space-y-1.5 text-xs">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 block">Audio Transcript</span>
              <p className="text-slate-300 leading-relaxed italic text-xs">&ldquo;{inspectLogReport.transcript}&rdquo;</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050505] border border-white/5 space-y-1.5 text-xs">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 block">Explainable AI Reasoning</span>
              <p className="text-slate-300 leading-relaxed text-xs">{inspectLogReport.layers.conversationAnalysis.explanation}</p>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setInspectLogReport(null)}
                className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={setConfig}
        hasServerGemini={hasServerGemini}
        hasServerZeroTrue={serverConfigStatus?.hasZeroTrue}
        hasServerSupabase={serverConfigStatus?.hasSupabase}
      />

      {/* Architecture & SIH 2026 Presentation Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      {/* Preventative Action Enforcement Modal */}
      <PreventativeActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        report={selectedReportForAction}
        onActionComplete={handleActionComplete}
      />

      {/* Footer styled to match Sophisticated Dark design */}
      <footer className="px-6 sm:px-8 py-5 bg-[#0A0A0A] border-t border-white/5 text-[11px] text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-slate-400">
            <span className="text-white font-serif italic text-sm">VoiceSentry AI</span>
            <span>•</span>
            <span className="text-slate-400">GATEWAY: <span className="text-slate-300">API.ZEROTRUE.IO/V1</span></span>
            <span>•</span>
            <span className="text-slate-400">STORAGE: <span className="text-indigo-400">SUPABASE_PROD</span></span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400">
            <span>SIH 2026 #26104</span>
            <span>•</span>
            <button
              onClick={() => setIsArchitectureOpen(true)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Presentation
            </button>
            <span>•</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
