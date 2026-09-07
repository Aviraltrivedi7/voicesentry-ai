import React, { useState, useEffect } from "react";
import { X, ShieldAlert, ShieldCheck, KeyRound, PhoneOff, Lock, CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { DetectionDecision, PipelineAnalysisReport } from "../types";

interface PreventativeActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: PipelineAnalysisReport | null;
  onActionComplete: (actionTaken: string) => void;
}

export const PreventativeActionModal: React.FC<PreventativeActionModalProps> = ({
  isOpen,
  onClose,
  report,
  onActionComplete,
}) => {
  const [activeStep, setActiveStep] = useState<"options" | "otp-sent" | "voice-challenge" | "freeze-success" | "override">("options");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  // Reset internal modal flow whenever opened or when inspection report changes
  useEffect(() => {
    if (isOpen) {
      setActiveStep("options");
      setEnteredOtp("");
      setOverrideReason("");
      setNotificationStatus(null);
    }
  }, [isOpen, report?.id]);

  if (!isOpen || !report) return null;

  const isBlock = report.decision === "BLOCK";
  const isVerify = report.decision === "VERIFY";

  const handleSendOtp = () => {
    setActiveStep("otp-sent");
    setNotificationStatus(`Out-of-band verification challenge dispatched to ${report.callerName}'s registered device via encrypted SMS/Push.`);
  };

  const handleConfirmOtp = () => {
    onActionComplete("Step-Up OTP Challenge Successfully Verified. Transaction Unlocked.");
    onClose();
  };

  const handleEnforceFreeze = () => {
    setActiveStep("freeze-success");
    onActionComplete("EMERGENCY TRANSACTION FREEZE ENFORCED. Incident flagged in SOC SIEM.");
  };

  const handleSupervisorOverride = () => {
    if (!overrideReason) return;
    onActionComplete(`SUPERVISOR MANUAL OVERRIDE APPLIED: ${overrideReason}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        id="preventative-action-dialog"
        className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl text-slate-200 space-y-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isBlock
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  : isVerify
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}
            >
              {isBlock ? <ShieldAlert className="w-5 h-5" /> : isVerify ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-serif italic text-white font-medium">
                  {isBlock ? "Threat Intercept Protocol" : isVerify ? "Secondary Verification Trigger" : "Transaction Cleared"}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                    isBlock
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : isVerify
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {report.decision}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic Impersonation Risk Score: <span className="font-mono font-bold text-white">{report.riskScore}/100</span>
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

        {/* Threat Context Summary */}
        <div className="p-4 rounded-xl bg-[#0F0F12] border border-white/10 text-xs space-y-2 font-sans">
          <div className="flex justify-between text-slate-400">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">Target Context:</span>
            <span className="font-medium text-slate-200 font-serif italic">{report.callerName}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">ZeroTrue Synthetic AI:</span>
            <span className="font-mono font-bold text-rose-400">
              {Math.round(report.layers.voiceAuthenticity.aiProbability * 100)}%
            </span>
          </div>
          <div className="flex justify-between text-slate-400 pt-1 border-t border-white/5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">Action:</span>
            <span className="text-slate-300 font-medium text-right max-w-[280px] leading-relaxed">
              {report.recommendedAction}
            </span>
          </div>
        </div>

        {/* Step 1: Initial Options */}
        {activeStep === "options" && (
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">Available Preventative Protocols</h4>

            {isBlock && (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleEnforceFreeze}
                  className="w-full p-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  <div className="flex items-center space-x-2.5">
                    <Lock className="w-4 h-4" />
                    <span>Enforce Emergency Freeze &amp; Terminate Call</span>
                  </div>
                  <span className="font-mono text-[9px] uppercase bg-rose-950 px-1.5 py-0.5 rounded">Action 1</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStep("override")}
                  className="w-full p-3 rounded-xl bg-[#050505] hover:bg-white/5 text-slate-300 text-xs transition-all flex items-center justify-between cursor-pointer border border-white/10"
                >
                  <div className="flex items-center space-x-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Supervisor Multi-Sig Emergency Override</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[10px] uppercase">Requires Reason</span>
                </button>
              </div>
            )}

            {isVerify && (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full p-3.5 rounded-xl bg-white text-black hover:bg-slate-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer shadow-lg"
                >
                  <div className="flex items-center space-x-2.5">
                    <Send className="w-4 h-4" />
                    <span>Issue Out-of-Band 2FA OTP Challenge</span>
                  </div>
                  <span className="font-mono text-[9px] uppercase bg-black/10 px-1.5 py-0.5 rounded">Step-Up</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStep("voice-challenge")}
                  className="w-full p-3 rounded-xl bg-[#050505] hover:bg-white/5 text-slate-300 text-xs transition-all flex items-center justify-between cursor-pointer border border-white/10"
                >
                  <div className="flex items-center space-x-2">
                    <KeyRound className="w-4 h-4 text-indigo-400" />
                    <span>Prompt Secondary Voice Passphrase Verification</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[10px] uppercase">Acoustic</span>
                </button>
              </div>
            )}

            {!isBlock && !isVerify && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Risk is low. Voice and conversation parameters verified against baseline. No preventative intervention necessary.</span>
              </div>
            )}
          </div>
        )}

        {/* Step: OTP Sent / Challenge Input */}
        {activeStep === "otp-sent" && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 leading-relaxed font-sans">
              {notificationStatus}
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Enter Received 6-Digit OTP:
              </label>
              <input
                type="text"
                maxLength={6}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="6 2 9 1 4 0"
                className="w-full px-4 py-2.5 rounded-xl bg-[#050505] border border-white/10 text-center font-mono text-lg tracking-widest text-indigo-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveStep("options")}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={enteredOtp.length !== 6}
                onClick={handleConfirmOtp}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-slate-200 disabled:opacity-30 transition-all cursor-pointer shadow-lg"
              >
                Verify &amp; Unlock Transaction
              </button>
            </div>
          </div>
        )}

        {/* Step: Voice Passphrase Challenge */}
        {activeStep === "voice-challenge" && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-300">
              Instruct the caller to repeat the dynamic security passphrase:
            </p>
            <div className="p-3 rounded-xl bg-[#050505] border border-white/10 text-center font-mono text-sm font-bold text-indigo-300 tracking-wider">
              &ldquo;Delta Sentry Falcon 8821&rdquo;
            </div>
            <p className="text-slate-500 text-[11px] font-mono">
              The acoustic phase analyzer will compare the live response against the enrolled vocal tract formant signature in real-time.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setActiveStep("options")}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  onActionComplete("Vocal Passphrase Formant Verified. Identity Authenticated.");
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-slate-200 cursor-pointer shadow-lg"
              >
                Simulate Pass
              </button>
            </div>
          </div>
        )}

        {/* Step: Freeze Success */}
        {activeStep === "freeze-success" && (
          <div className="p-5 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <PhoneOff className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-serif italic text-white font-medium">Call Terminated &amp; Funds Frozen</h4>
            <p className="text-xs text-rose-200 leading-relaxed font-sans">
              The pending wire instruction has been locked. Audit package dispatched to Fraud Operations with ZeroTrue detection proof ID <code className="font-mono text-indigo-300">{report.layers.voiceAuthenticity.zeroTrueId || "zt-scan-881"}</code>.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-slate-200 cursor-pointer shadow-lg"
            >
              Done &amp; Return to Dashboard
            </button>
          </div>
        )}

        {/* Step: Supervisor Override */}
        {activeStep === "override" && (
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 leading-relaxed font-sans">
              Warning: Overriding an AI detection alert will be permanently signed and recorded in the cryptographically sealed audit trail.
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">Justification / Authorization Code:</label>
              <textarea
                rows={2}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="E.g. In-person physical confirmation from CEO Rajesh Singhania at headquarters desk."
                className="w-full p-2.5 rounded-xl bg-[#050505] border border-white/10 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setActiveStep("options")}
                className="px-3 py-1.5 text-slate-400 hover:text-white cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!overrideReason.trim()}
                onClick={handleSupervisorOverride}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs disabled:opacity-30 cursor-pointer shadow-lg"
              >
                Sign &amp; Enforce Override
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
