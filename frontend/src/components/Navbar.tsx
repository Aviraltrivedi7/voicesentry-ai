import React from "react";
import { ShieldCheck, Settings, BookOpen, Radio, Database, Sparkles, PhoneCall, Users, FileText } from "lucide-react";

interface NavbarProps {
  activeTab: "scanner" | "simulator" | "profiles" | "audit";
  onTabChange: (tab: "scanner" | "simulator" | "profiles" | "audit") => void;
  onOpenSettings: () => void;
  onOpenArchitecture: () => void;
  hasZeroTrueConfig: boolean;
  hasSupabaseConfig: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenArchitecture,
  hasZeroTrueConfig,
  hasSupabaseConfig,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-md">
      {/* Top Status Banner */}
      <div className="bg-[#050505] border-b border-white/5 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 text-slate-300">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 tracking-wider">
              Active Shield
            </span>
            <span className="text-slate-300 text-xs font-medium tracking-normal">
              Voice Cloning Impersonation Attack Detection &amp; Prevention
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className={`w-1.5 h-1.5 rounded-full ${hasZeroTrueConfig ? "bg-emerald-400 animate-pulse" : "bg-emerald-500/50"}`}></span>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                ZeroTrue API: {hasZeroTrueConfig ? "Connected" : "Standby"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              <span className={`w-1.5 h-1.5 rounded-full ${hasSupabaseConfig ? "bg-indigo-400 animate-pulse" : "bg-indigo-500/50"}`}></span>
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                Supabase: {hasSupabaseConfig ? "Linked" : "Active"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3.5 cursor-pointer" onClick={() => onTabChange("scanner")}>
            <div className="relative flex items-center justify-center w-8 h-8 rounded-sm bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <div className="w-3.5 h-3.5 border-2 border-white rotate-45 flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-serif italic tracking-tight font-medium text-white">
                  VoiceSentry <span className="text-indigo-400 not-italic font-sans font-semibold text-base tracking-normal">AI</span>
                </h1>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold bg-white/5 text-slate-400 border border-white/10 tracking-wider">
                  v2.6
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono hidden sm:block">
                Multi-Layer Impersonation Defense Vault
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav id="nav-tabs" className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-[#080808] border border-white/10">
            <button
              id="tab-scanner"
              onClick={() => onTabChange("scanner")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs tracking-wider uppercase font-medium transition-all cursor-pointer ${
                activeTab === "scanner"
                  ? "bg-white text-black font-bold shadow-md shadow-white/10"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Voice Scanner</span>
            </button>

            <button
              id="tab-simulator"
              onClick={() => onTabChange("simulator")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs tracking-wider uppercase font-medium transition-all cursor-pointer ${
                activeTab === "simulator"
                  ? "bg-white text-black font-bold shadow-md shadow-white/10"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Monitor</span>
            </button>

            <button
              id="tab-profiles"
              onClick={() => onTabChange("profiles")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs tracking-wider uppercase font-medium transition-all cursor-pointer ${
                activeTab === "profiles"
                  ? "bg-white text-black font-bold shadow-md shadow-white/10"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Speaker Vault</span>
            </button>

            <button
              id="tab-audit"
              onClick={() => onTabChange("audit")}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs tracking-wider uppercase font-medium transition-all cursor-pointer ${
                activeTab === "audit"
                  ? "bg-white text-black font-bold shadow-md shadow-white/10"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Logs</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              id="btn-architecture-modal"
              onClick={onOpenArchitecture}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0F0F12] border border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
              title="View Technical Architecture & Presentation Slides"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Presentation</span>
            </button>

            <button
              id="btn-settings-modal"
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0F0F12] border border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Configure ZeroTrue API Key and Supabase Storage Credentials"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-300 hover:rotate-45 transition-transform" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex lg:hidden overflow-x-auto gap-1.5 mt-3 pt-2.5 border-t border-white/5 pb-1 scrollbar-none">
          <button
            onClick={() => onTabChange("scanner")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap font-medium ${
              activeTab === "scanner" ? "bg-white text-black font-bold" : "text-slate-400 bg-[#0A0A0A] border border-white/5"
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>Voice Scanner</span>
          </button>
          <button
            onClick={() => onTabChange("simulator")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap font-medium ${
              activeTab === "simulator" ? "bg-white text-black font-bold" : "text-slate-400 bg-[#0A0A0A] border border-white/5"
            }`}
          >
            <PhoneCall className="w-3 h-3" />
            <span>Call Monitor</span>
          </button>
          <button
            onClick={() => onTabChange("profiles")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap font-medium ${
              activeTab === "profiles" ? "bg-white text-black font-bold" : "text-slate-400 bg-[#0A0A0A] border border-white/5"
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Vault</span>
          </button>
          <button
            onClick={() => onTabChange("audit")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap font-medium ${
              activeTab === "audit" ? "bg-white text-black font-bold" : "text-slate-400 bg-[#0A0A0A] border border-white/5"
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>Audit Logs</span>
          </button>
        </div>
      </div>
    </header>
  );
};
