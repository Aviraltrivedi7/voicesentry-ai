import React, { useState, useEffect, useRef } from "react";
import {
  PhoneCall,
  PhoneOff,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Lock,
  Volume2,
  KeyRound,
  Radio,
  User,
  Building,
} from "lucide-react";
import { PipelineAnalysisReport, PresetScenario, SpeakerProfile } from "../types";
import { PRESET_SCENARIOS } from "../data/mockData";

interface CallSimulatorProps {
  speakerProfiles: SpeakerProfile[];
  onTriggerActionModal: (report: PipelineAnalysisReport) => void;
  onBlockTransaction: (report: PipelineAnalysisReport) => void;
}

export const CallSimulator: React.FC<CallSimulatorProps> = ({
  speakerProfiles,
  onTriggerActionModal,
  onBlockTransaction,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<PresetScenario>(PRESET_SCENARIOS[0]);
  const [callStatus, setCallStatus] = useState<"idle" | "ringing" | "connected" | "blocked" | "completed">("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [currentRiskScore, setCurrentRiskScore] = useState(12);
  const [transcriptIndex, setTranscriptIndex] = useState(0);
  const [actionAlert, setActionAlert] = useState<string | null>(null);
  const [isBlockCooldown, setIsBlockCooldown] = useState(false);
  const actionAlertRef = useRef<string | null>(null);

  const durationTimerRef = useRef<number | null>(null);
  const riskSimulationTimerRef = useRef<number | null>(null);
  const cooldownTimerRef = useRef<number | null>(null);

  // Split transcript into streaming conversational chunks
  const transcriptTokens = selectedScenario.transcript.split(". ").map((s) => s.trim() + (s.endsWith(".") ? "" : "."));

  // Start Call
  const handleStartCall = () => {
    setCallStatus("ringing");
    setCallDuration(0);
    setCurrentRiskScore(15);
    setTranscriptIndex(0);
    setActionAlert(null);
    actionAlertRef.current = null;

    // Ring for 1.8 seconds then connect
    setTimeout(() => {
      setCallStatus("connected");

      // Start duration counter
      durationTimerRef.current = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Start simulated threat spike as conversation unfolds
      let tokenCounter = 0;
      riskSimulationTimerRef.current = window.setInterval(() => {
        tokenCounter++;
        setTranscriptIndex((prev) => Math.min(transcriptTokens.length - 1, prev + 1));

        if (selectedScenario.isClone) {
          // Progressively spike risk
          setCurrentRiskScore((prev) => {
            const next = Math.min(96, prev + Math.floor(Math.random() * 22 + 15));
            if (next >= 71 && !actionAlertRef.current) {
              const alertMsg = "CRITICAL RISK: Synthetic Voice & Coercive Extraction detected. Preventative block recommended.";
              actionAlertRef.current = alertMsg;
              setActionAlert(alertMsg);
            }
            return next;
          });
        } else {
          // Remain low for authentic calls
          setCurrentRiskScore((prev) => Math.min(18, Math.max(6, prev + (Math.random() * 4 - 2))));
        }

        if (tokenCounter >= transcriptTokens.length + 1) {
          if (riskSimulationTimerRef.current) clearInterval(riskSimulationTimerRef.current);
        }
      }, 2500);
    }, 1800);
  };

  // Hang up
  const handleEndCall = () => {
    setCallStatus("completed");
    cleanupTimers();
  };

  // Terminate & Freeze
  const handleBlockCall = () => {
    // Build report using createReportFromCall with decision hard-set to "BLOCK" and recommendedAction reflecting manual kill
    const report = createReportFromCall(true);

    // Call onBlockTransaction callback before or alongside local state updates
    if (onBlockTransaction) {
      onBlockTransaction(report);
    }

    setCallStatus("blocked");
    cleanupTimers();
    const blockMsg = "CALL KILLED: Automatic voice cloning fraud defense engaged. Incident logged.";
    actionAlertRef.current = blockMsg;
    setActionAlert(blockMsg);

    // Disable the "Simulate Incoming Call" button for 1.5s after a block action completes
    setIsBlockCooldown(true);
    cooldownTimerRef.current = window.setTimeout(() => {
      setIsBlockCooldown(false);
      cooldownTimerRef.current = null;
    }, 1500);
  };

  const cleanupTimers = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (riskSimulationTimerRef.current) {
      clearInterval(riskSimulationTimerRef.current);
      riskSimulationTimerRef.current = null;
    }
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupTimers();
  }, []);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Create mock pipeline report for modal trigger or manual block
  const createReportFromCall = (forceBlock = false): PipelineAnalysisReport => {
    const isBlock = forceBlock || currentRiskScore >= 71;
    const isVerify = !isBlock && currentRiskScore >= 31 && currentRiskScore < 71;
    return {
      id: `call-sim-${Date.now()}`,
      timestamp: new Date().toISOString(),
      callerName: selectedScenario.caller,
      audioUrl: `https://storage.supabase.voicesentry.co/v1/object/public/voicesentry-audio/live-calls/${selectedScenario.id}.wav`,
      storageProvider: "supabase",
      transcript: selectedScenario.transcript,
      riskScore: forceBlock ? Math.max(88, Math.round(currentRiskScore)) : Math.round(currentRiskScore),
      decision: isBlock ? "BLOCK" : isVerify ? "VERIFY" : "ALLOW",
      recommendedAction: forceBlock
        ? "MANUAL KILL & FREEZE: Telecom line forcefully severed and emergency financial freeze dispatched."
        : isBlock
        ? "IMMEDIATE BLOCK: High probability synthetic voice cloning detected during live call."
        : isVerify
        ? "SECONDARY VERIFICATION: Anomaly detected during live call."
        : "AUTHENTICATED: Routine authorized voice conversation.",
      layers: {
        voiceAuthenticity: {
          aiProbability: selectedScenario.isClone ? 0.92 : 0.08,
          humanProbability: selectedScenario.isClone ? 0.08 : 0.92,
          riskScore: selectedScenario.isClone ? 92 : 8,
          model: "ensemble",
          source: "zerotrue-api-live",
          zeroTrueId: `zt-call-${Date.now()}`,
        },
        speakerVerification: {
          profileName: selectedScenario.claimedIdentity || "Unenrolled",
          role: "Executive Target",
          matchConfidence: selectedScenario.isClone ? 0.32 : 0.95,
          divergenceRisk: selectedScenario.isClone ? 88 : 6,
          status: selectedScenario.isClone ? "CRITICAL_DIVERGENCE" : "VERIFIED_MATCH",
        },
        conversationAnalysis: {
          threatScore: selectedScenario.isClone ? 94 : 12,
          detectedSignals: selectedScenario.isClone
            ? [
                { category: "URGENT_FINANCIAL", severity: "HIGH", description: "Urgent wire payment instruction" },
                { category: "SECRECY_COERCION", severity: "HIGH", description: "Do not verify via callback instruction" },
              ]
            : [],
          explanation: selectedScenario.isClone
            ? "Multiple high-severity coercion indicators detected concurrently with synthetic acoustic characteristics."
            : "Call follows normal operational protocol.",
        },
      },
    };
  };

  return (
    <div id="call-simulator-panel" className="space-y-6">
      {/* Header Context with Sophisticated Dark Styling */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#080808] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="p-1 rounded-sm bg-indigo-600 text-white">
              <PhoneCall className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-indigo-400">
              Live Intercept • Telecom Gateway
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif text-white leading-tight">
            Live Call Intercept &amp; <span className="text-indigo-400 italic">Prevention Simulator</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Simulate incoming telephonic voice streams across banking desks and executive lines. Watch real-time acoustic drift and conversational coercion trigger instant automated freezes.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>ZeroTrue Daemon: Active</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Call Scenarios & Selector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 font-mono">
              Incoming Call Scenarios
            </h3>

            <div className="space-y-2.5">
              {PRESET_SCENARIOS.map((scen) => {
                const isSelected = selectedScenario.id === scen.id;
                return (
                  <button
                    key={scen.id}
                    type="button"
                    disabled={callStatus === "connected" || callStatus === "ringing"}
                    onClick={() => {
                      setSelectedScenario(scen);
                      setCallStatus("idle");
                      setCurrentRiskScore(12);
                      setTranscriptIndex(0);
                      setActionAlert(null);
                    }}
                    className={`w-full p-3.5 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between disabled:opacity-50 ${
                      isSelected
                        ? "bg-indigo-600/10 border-indigo-500/70 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                        : "bg-[#050505] border-white/5 hover:border-white/20 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-medium text-white">{scen.title}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          scen.expectedDecision === "BLOCK"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {scen.tag}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center space-x-2 text-[11px] text-slate-400">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>{scen.caller}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Virtual Phone Terminal & Live Risk Gauge */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-[#0F0F12] border border-white/10 shadow-2xl relative overflow-hidden space-y-5">
            {/* Top Phone Status Bar */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                <span className="font-mono text-slate-300 text-xs uppercase tracking-wider font-bold">VOIP CHANNEL 01 • AES-256</span>
              </div>

              <div className="flex items-center space-x-2 font-mono text-slate-400 text-xs">
                <span>Duration:</span>
                <span className="text-white font-bold">{formatDuration(callDuration)}</span>
              </div>
            </div>

            {/* Caller Identification Card */}
            <div className="p-4 rounded-xl bg-[#050505] border border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg ${
                    selectedScenario.isClone
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  <PhoneCall className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-serif italic text-white font-medium">{selectedScenario.caller}</h3>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 uppercase tracking-wider">
                      Target: {selectedScenario.targetPerson}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    Caller ID: +91 22 6821 **** • Route: Central PBX Gateway
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest ${
                    callStatus === "connected"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse"
                      : callStatus === "ringing"
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-ping"
                      : callStatus === "blocked"
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  {callStatus === "connected"
                    ? "LIVE IN-CALL"
                    : callStatus === "ringing"
                    ? "RINGING..."
                    : callStatus === "blocked"
                    ? "INTERCEPTED"
                    : "STANDBY"}
                </span>
              </div>
            </div>

            {/* Simulated Live Audio Waveform Stream */}
            <div className="p-3.5 rounded-xl bg-[#050505] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400 flex items-center space-x-1.5 uppercase tracking-wider">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Real-Time Acoustic Packet Stream</span>
                </span>
                <span className="text-indigo-400">48 kHz (Opus HD)</span>
              </div>

              {/* Animated Waveform Bars */}
              <div className="h-14 flex items-center justify-center space-x-1 px-2 overflow-hidden bg-[#0A0A0A] rounded-lg">
                {Array.from({ length: 48 }).map((_, i) => {
                  const isCallActive = callStatus === "connected";
                  const randomHeight = isCallActive
                    ? Math.max(8, Math.sin(i * 0.4 + callDuration) * 45 + Math.random() * 20)
                    : 4;
                  return (
                    <div
                      key={i}
                      style={{ height: `${randomHeight}px` }}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        currentRiskScore > 70
                          ? "bg-rose-500"
                          : currentRiskScore > 30
                          ? "bg-amber-400"
                          : "bg-indigo-500"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Dynamic Impersonation Risk Score Meter */}
            <div className="p-4 rounded-xl bg-[#050505] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-white font-mono block">
                    Dynamic Impersonation Risk Score
                  </span>
                  <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                    Real-time synthesis of ZeroTrue scan + speaker vector divergence + conversational urgency
                  </span>
                </div>

                <div className="text-right">
                  <span
                    className={`text-2xl font-extrabold font-mono ${
                      currentRiskScore >= 71
                        ? "text-rose-400"
                        : currentRiskScore >= 31
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {Math.round(currentRiskScore)}
                  </span>
                  <span className="text-xs text-slate-500 font-mono"> / 100</span>
                </div>
              </div>

              {/* Progress Bar Gauge */}
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, currentRiskScore)}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentRiskScore >= 71
                      ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                      : currentRiskScore >= 31
                      ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                      : "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                  }`}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                <span>0: SAFE ALLOW</span>
                <span>31: STEP-UP VERIFY</span>
                <span>71: AUTO-BLOCK</span>
                <span>100: CRITICAL</span>
              </div>
            </div>

            {/* Live Streaming Transcript */}
            <div className="p-3.5 rounded-xl bg-[#050505] border border-white/5 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                Speech-to-Text Transcription Stream
              </span>

              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 min-h-[50px] text-xs text-slate-200 leading-relaxed font-sans">
                {callStatus === "idle" && (
                  <span className="text-slate-500 italic">Call idle. Click &ldquo;Simulate Incoming Call&rdquo; below to initiate stream.</span>
                )}
                {callStatus === "ringing" && (
                  <span className="text-indigo-400 animate-pulse font-mono text-xs">Awaiting receiver pickup...</span>
                )}
                {callStatus === "connected" && (
                  <div>
                    {transcriptTokens.slice(0, transcriptIndex + 1).join(" ")}
                    <span className="inline-block w-1.5 h-3.5 ml-1 bg-indigo-400 animate-pulse align-middle"></span>
                  </div>
                )}
                {callStatus === "completed" && <span>{selectedScenario.transcript}</span>}
                {callStatus === "blocked" && (
                  <span className="text-rose-400 font-semibold font-mono text-xs">
                    [LINE TERMINATED BY SENTRY DAEMON] High confidence synthetic voice cloning detected.
                  </span>
                )}
              </div>
            </div>

            {/* Alert Banner if High Risk */}
            {actionAlert && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 animate-shake">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{actionAlert}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onTriggerActionModal(createReportFromCall())}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  Trigger Action
                </button>
              </div>
            )}

            {/* Terminal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {callStatus === "idle" || callStatus === "completed" || callStatus === "blocked" ? (
                <button
                  type="button"
                  onClick={handleStartCall}
                  disabled={isBlockCooldown}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-xl ${
                    isBlockCooldown
                      ? "bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-60"
                      : "bg-white text-black hover:bg-slate-200 cursor-pointer"
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{isBlockCooldown ? "Registering Block..." : "Simulate Incoming Call"}</span>
                </button>
              ) : (
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleEndCall}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-semibold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <PhoneOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hang Up</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBlockCall}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-rose-600/30"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Kill Call &amp; Freeze</span>
                  </button>
                </div>
              )}

              {callStatus === "connected" && (
                <button
                  type="button"
                  onClick={() => onTriggerActionModal(createReportFromCall())}
                  className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Issue 2FA Challenge</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
