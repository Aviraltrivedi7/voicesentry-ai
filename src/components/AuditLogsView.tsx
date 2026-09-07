import React, { useState } from "react";
import {
  FileText,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Download,
  Filter,
  Search,
  ExternalLink,
  Calendar,
  Lock,
  Database,
  Key,
} from "lucide-react";
import { PipelineAnalysisReport } from "../types";

interface AuditLogsViewProps {
  logs: PipelineAnalysisReport[];
  onSelectLog: (log: PipelineAnalysisReport) => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs, onSelectLog }) => {
  const [filterDecision, setFilterDecision] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = logs.filter((log) => {
    const matchesDecision = filterDecision === "ALL" || log.decision === filterDecision;
    const matchesSearch =
      log.callerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.layers.voiceAuthenticity.zeroTrueId || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDecision && matchesSearch;
  });

  const exportToJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voicesentry-audit-log-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="audit-logs-panel" className="space-y-6">
      {/* Header Context with Sophisticated Dark Styling */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#080808] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="p-1 rounded-sm bg-indigo-600 text-white">
              <FileText className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-indigo-400">
              Audit Vault • Immutable Logs
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif text-white leading-tight">
            Forensic Audit &amp; <span className="text-indigo-400 italic">Incident Records</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Cryptographically timestamped incident history containing ZeroTrue AI model scan IDs, Supabase storage audio links, and preventative enforcement records for SIH compliance and fraud investigation.
          </p>
        </div>

        <button
          type="button"
          onClick={exportToJson}
          className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer border border-white/10 shadow-lg shrink-0"
        >
          <Download className="w-4 h-4 text-indigo-400" />
          <span>Export Dossier (JSON)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0F0F12] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by caller, text, or Scan ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#050505] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
          {["ALL", "BLOCK", "VERIFY", "ALLOW"].map((dec) => (
            <button
              key={dec}
              onClick={() => setFilterDecision(dec)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                filterDecision === dec
                  ? "bg-white text-black shadow-md"
                  : "bg-[#050505] text-slate-400 hover:text-white border border-white/5"
              }`}
            >
              {dec === "ALL" ? "All Incidents" : dec}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / Card List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#0F0F12] border border-white/10 text-center text-slate-500 text-xs font-mono">
            No incident records match the current filters.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isBlock = log.decision === "BLOCK";
            const isVerify = log.decision === "VERIFY";

            return (
              <div
                key={log.id}
                onClick={() => onSelectLog(log)}
                className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 hover:border-white/20 transition-all cursor-pointer space-y-3.5 shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isBlock
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : isVerify
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {isBlock ? <ShieldAlert className="w-5 h-5" /> : isVerify ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-serif italic text-white font-medium">{log.callerName}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                            isBlock
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : isVerify
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {log.decision}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5 font-mono">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                        <span>•</span>
                        <span>Risk Score: <strong className="text-slate-200">{log.riskScore}/100</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#050505] border border-white/5 text-slate-400">
                      <span>ZeroTrue: <strong className="text-indigo-400">{Math.round(log.layers.voiceAuthenticity.aiProbability * 100)}% AI</strong></span>
                      {log.layers.voiceAuthenticity.source?.includes("live") || log.layers.voiceAuthenticity.source === "zerotrue-api" ? (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                          LIVE API
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider bg-white/5 text-slate-400 border border-white/10">
                          SIMULATED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#050505] border border-white/5 text-slate-400">
                      <span>NLP: <strong className="text-purple-300">{log.layers.conversationAnalysis.threatScore}/100</strong></span>
                      {log.layers.conversationAnalysis.source === "gemini-3.6-flash" ||
                      log.layers.conversationAnalysis.source === "gemini" ? (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                          LIVE API
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider bg-white/5 text-slate-400 border border-white/10">
                          SIMULATED
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#050505] border border-white/5 text-xs text-slate-300 line-clamp-2 font-serif italic">
                  &ldquo;{log.transcript}&rdquo;
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center space-x-3 text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Database className="w-3 h-3 text-emerald-400" />
                      <span>Audio on Supabase</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Key className="w-3 h-3 text-indigo-400" />
                      <span>Scan: {log.layers.voiceAuthenticity.zeroTrueId || "zt-26104-log"}</span>
                    </span>
                  </div>

                  <span className="text-indigo-400 hover:text-indigo-300 uppercase tracking-wider text-[10px] font-bold">Inspect Forensic Dossier &rarr;</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
