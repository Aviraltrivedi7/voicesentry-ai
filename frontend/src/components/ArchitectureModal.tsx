import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight, Layers, ShieldCheck, Cpu, Target, Award, BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeSlide, setActiveSlide] = useState<number>(1);

  if (!isOpen) return null;

  const totalSlides = 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        id="architecture-presentation-card"
        className="relative w-full max-w-4xl bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-200"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#050505]">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-white/5 text-indigo-300 border border-white/10">
              SIH 2026
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Syntax Surgeons • Slide {activeSlide} of {totalSlides}</span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 mr-2">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setActiveSlide(num)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeSlide === num
                      ? "bg-white text-black shadow-md"
                      : "bg-white/5 text-slate-400 hover:text-white border border-white/5"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-[#0A0A0A]">
          {/* Slide 1: Title Page */}
          {activeSlide === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="inline-block px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-white/5 text-indigo-400 border border-white/10">
                SMART INDIA HACKATHON 2026 • PS ID: 26104
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-serif italic text-white tracking-tight leading-tight font-medium">
                  AI-Powered Real-Time Detection &amp; Prevention of Voice Cloning Impersonation Attacks
                </h1>
                <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">
                  Theme: Blockchain &amp; Cybersecurity • Category: Software • Team: Syntax Surgeons
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div className="p-4 rounded-xl bg-[#0F0F12] border border-white/10">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Problem Statement ID</div>
                  <div className="text-xl font-bold text-white font-mono mt-1">26104</div>
                  <div className="text-[11px] text-slate-500 mt-1">Cybersecurity &amp; Fraud Prevention</div>
                </div>

                <div className="p-4 rounded-xl bg-[#0F0F12] border border-white/10">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Target Vulnerability</div>
                  <div className="text-xl font-bold text-amber-400 font-serif italic mt-1">Deepfake Impersonation</div>
                  <div className="text-[11px] text-slate-500 mt-1">Wire Fraud, OTP Theft &amp; Extortion</div>
                </div>

                <div className="p-4 rounded-xl bg-[#0F0F12] border border-white/10">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Engineering Team</div>
                  <div className="text-xl font-bold text-indigo-300 font-serif italic mt-1">Syntax Surgeons</div>
                  <div className="text-[11px] text-slate-500 mt-1">Full-Stack AI Defense Core</div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#0F0F12] border border-white/10">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-2">Executive Summary</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Voice cloning technology allows adversaries to replicate an individual&apos;s voice with as little as 3 seconds of audio. VoiceSentry AI pioneers a real-time, multi-layer verification mesh combining acoustic synthetic voice detection via ZeroTrue API, speaker voiceprint verification, and LLM-powered conversational social-engineering analysis to stop attacks before sensitive transactions occur.
                </p>
              </div>
            </div>
          )}

          {/* Slide 2: Proposed Solution & Innovation */}
          {activeSlide === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-serif italic text-white font-medium">Proposed Solutions &amp; Unique Innovation</h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono uppercase tracking-wider">
                  Multi-layer holistic verification instead of naive binary classification
                </p>
              </div>

              {/* 5-Step Process Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {[
                  { step: "1", title: "Real-Time Voice Input", desc: "Analyzes incoming voice stream prior to sensitive actions." },
                  { step: "2", title: "Multi-Layer Detection", desc: "Checks Voice Authenticity + Speaker Identity + Conversation." },
                  { step: "3", title: "Identity & Context", desc: "Matches biometric voiceprint & detects social-engineering cues." },
                  { step: "4", title: "Dynamic Risk Score", desc: "Calculates 0-100 risk score with explainable reasoning." },
                  { step: "5", title: "Preventative Action", desc: "Executes Allow, Step-Up Verification, or Block." },
                ].map((item) => (
                  <div key={item.step} className="p-4 rounded-xl bg-[#0F0F12] border border-white/10 flex flex-col justify-between">
                    <div>
                      <span className="w-6 h-6 rounded-full bg-white/5 text-indigo-400 text-xs font-mono font-bold flex items-center justify-center mb-3 border border-white/10">
                        {item.step}
                      </span>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-[#0F0F12] border border-white/10 space-y-3">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">How it Addresses the Problem</h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Detects voice-cloning attacks before sensitive actions are executed.</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Goes beyond superficial caller ID and acoustic familiarity.</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Identifies risky requests like urgent money transfers or OTP sharing.</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Adds secondary verification &amp; automatic blocks for high-risk cases.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-xl bg-[#0F0F12] border border-white/10 space-y-3">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Innovation &amp; Uniqueness</h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span><strong>Multi-Layer Detection:</strong> Voice + Identity + Conversation triangulation.</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span><strong>Dynamic Risk Score:</strong> 0-100 continuous score instead of simple Fake/Real.</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span><strong>Explainable Reasons:</strong> Transparent risk breakdown behind every decision.</span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span><strong>API-Ready Security Layer:</strong> Easy integration into banking/enterprise systems.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Slide 3: Technical Approach & Architecture */}
          {activeSlide === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-serif italic text-white font-medium">Technical Approach &amp; Flow Architecture</h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono uppercase tracking-wider">
                  End-to-end processing pipeline from audio input to dynamic preventative enforcement
                </p>
              </div>

              {/* Architectural Flow Diagram */}
              <div className="p-5 rounded-xl bg-[#050505] border border-white/10 space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
                  <div className="w-full md:w-1/4 p-3 rounded-xl bg-[#0F0F12] border border-white/10">
                    <span className="text-xs font-mono font-bold uppercase text-white block">Voice Input</span>
                    <span className="text-[10px] text-slate-400">Microphone / Audio Upload</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0 hidden md:block" />
                  <div className="w-full md:w-1/4 p-3 rounded-xl bg-[#0F0F12] border border-white/10">
                    <span className="text-xs font-mono font-bold uppercase text-indigo-300 block">Supabase Storage</span>
                    <span className="text-[10px] text-slate-400">Public CDN Audio URL</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0 hidden md:block" />
                  <div className="w-full md:w-1/3 p-3 rounded-xl bg-[#0F0F12] border border-white/10">
                    <span className="text-xs font-mono font-bold uppercase text-emerald-400 block">Pre-processing</span>
                    <span className="text-[10px] text-slate-400">Acoustic normalization &amp; vectors</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-[#0F0F12] border border-white/10 text-left">
                    <div className="text-[11px] font-mono font-bold text-indigo-300 uppercase tracking-wider">Layer 1: Voice Authenticity</div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      ZeroTrue API detects synthetic neural speech artifacts &amp; AI probability.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0F0F12] border border-white/10 text-left">
                    <div className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">Layer 2: Speaker Verification</div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Compares speaker acoustic biometric profile vs enrolled trusted voiceprints.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0F0F12] border border-white/10 text-left">
                    <div className="text-[11px] font-mono font-bold text-indigo-300 uppercase tracking-wider">Layer 3: Conversation NLP</div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Google Gemini 3.6 Flash detects urgency, money transfer &amp; OTP demands.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0F0F12] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="text-left">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-white block">Dynamic Risk Engine (0-100)</span>
                    <span className="text-[11px] text-slate-400">
                      Weighted multi-layer synthesis with explainable factor breakdown
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Allow (0-30)
                    </span>
                    <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Verify (31-70)
                    </span>
                    <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Block (71-100)
                    </span>
                  </div>
                </div>
              </div>

              {/* Technologies Table from PPT */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-[#0F0F12] border border-white/10">
                  <span className="text-slate-500 block text-[10px] font-mono uppercase tracking-wider">Frontend</span>
                  <span className="font-semibold text-white mt-0.5 block">React + Tailwind</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0F0F12] border border-white/10">
                  <span className="text-slate-500 block text-[10px] font-mono uppercase tracking-wider">Backend</span>
                  <span className="font-semibold text-white mt-0.5 block">Express Server</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0F0F12] border border-white/10">
                  <span className="text-slate-500 block text-[10px] font-mono uppercase tracking-wider">Speech &amp; NLP</span>
                  <span className="font-semibold text-white mt-0.5 block">Gemini + ZeroTrue</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0F0F12] border border-white/10">
                  <span className="text-slate-500 block text-[10px] font-mono uppercase tracking-wider">Database</span>
                  <span className="font-semibold text-white mt-0.5 block">Supabase Storage</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0F0F12] border border-white/10">
                  <span className="text-slate-500 block text-[10px] font-mono uppercase tracking-wider">API Gate</span>
                  <span className="font-semibold text-white mt-0.5 block">RESTful Gateway</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0F0F12] border border-white/10">
                  <span className="text-slate-500 block text-[10px] font-mono uppercase tracking-wider">Runtime</span>
                  <span className="font-semibold text-white mt-0.5 block">Cloud Container</span>
                </div>
              </div>
            </div>
          )}

          {/* Slide 4: Feasibility and Viability */}
          {activeSlide === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-serif italic text-white font-medium">Feasibility, Viability &amp; Challenges</h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono uppercase tracking-wider">
                  Realistic execution path, operational mitigation, and privacy compliance
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-[#0F0F12] border border-white/10 space-y-3">
                  <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Feasibility &amp; Viability</h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong>Proven Stack:</strong> Leverages existing AI/ML speech technologies &amp; ZeroTrue ensemble models.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong>Modular Architecture:</strong> Allows rapid independent testing of voice authenticity, biometrics, and NLP.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong>Commercial Viability:</strong> Critical for banks, CXOs, government departments, and customer support centers.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong>Privacy-First:</strong> Minimal voice retention policy; hashes and vectors stored rather than raw voice records.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-xl bg-[#0F0F12] border border-white/10 space-y-3">
                  <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Challenges &amp; Strategic Solutions</h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-400 font-bold font-mono">1.</span>
                      <span><strong>Challenge:</strong> Evolving neural voice cloning realism. <strong>Strategy:</strong> Multi-layer detection (voice + identity + semantics).</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-400 font-bold font-mono">2.</span>
                      <span><strong>Challenge:</strong> Background noise &amp; cell distortion. <strong>Strategy:</strong> Audio pre-processing &amp; acoustic spectral normalization.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-400 font-bold font-mono">3.</span>
                      <span><strong>Challenge:</strong> False positive blocking. <strong>Strategy:</strong> Step-up secondary verification (OTP/voice passphrase) before hard blocking.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-400 font-bold font-mono">4.</span>
                      <span><strong>Challenge:</strong> Real-time latency. <strong>Strategy:</strong> Asynchronous streaming pipelines and lightweight edge feature extractors.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Slide 5: Impact and Benefits */}
          {activeSlide === 5 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-serif italic text-white font-medium">Impact, Benefits &amp; Target Stakeholders</h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono uppercase tracking-wider">
                  Societal protection, financial fraud reduction, and trust restoration
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-[#0F0F12] border border-white/10 space-y-2.5">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Social Impact</h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li>• Protects everyday citizens from traumatic distress scams and grandparent voice extortion.</li>
                    <li>• Improves public awareness regarding generative AI voice cloning capabilities.</li>
                    <li>• Re-establishes trust in voice-based telecom and customer support channels.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-xl bg-[#0F0F12] border border-white/10 space-y-2.5">
                  <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Economic Value</h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li>• Prevents multi-million dollar executive wire fraud (CEO fraud).</li>
                    <li>• Eliminates bank customer service OTP redirection losses.</li>
                    <li>• Reduces insurance liability for enterprise telecom fraud.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-xl bg-[#0F0F12] border border-white/10 space-y-2.5">
                  <h3 className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">Security Architecture</h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li>• Adds an out-of-band biometric security layer to sensitive financial transactions.</li>
                    <li>• Supports continuous risk-based authentication throughout call lifecycles.</li>
                    <li>• Generates courtroom-grade forensic audit logs.</li>
                  </ul>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#0F0F12] border border-white/10">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-2">Target Enterprise Users</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-[#050505] border border-white/10 text-slate-300">Banks &amp; Financial Institutions</span>
                  <span className="px-3 py-1 rounded-full bg-[#050505] border border-white/10 text-slate-300">Enterprises &amp; CXOs</span>
                  <span className="px-3 py-1 rounded-full bg-[#050505] border border-white/10 text-slate-300">Government &amp; Defense Departments</span>
                  <span className="px-3 py-1 rounded-full bg-[#050505] border border-white/10 text-slate-300">High-Risk Customer Support Call Centers</span>
                </div>
              </div>
            </div>
          )}

          {/* Slide 6: Research & References */}
          {activeSlide === 6 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-serif italic text-white font-medium">Research &amp; References</h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono uppercase tracking-wider">
                  Academic foundations and regulatory benchmarks referenced in the presentation
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-5 rounded-xl bg-[#0F0F12] border border-white/10">
                  <h3 className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">ASVspoof Challenge Research</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Automatic Speaker Verification Spoofing and Countermeasures Challenge (ASVspoof 2021 Dataset) — Primary academic benchmark evaluating speech synthesis, voice conversion, and neural acoustic deepfake detection.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#0F0F12] border border-white/10">
                  <h3 className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">The FTC Voice Cloning Challenge (Federal Trade Commission)</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Regulatory and technical challenge exploring defensive measures against synthetic voice cloning consumer fraud and impersonation attacks.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#0F0F12] border border-white/10">
                  <h3 className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">FTC Consumer Advice: Fighting Back Against Harmful Voice Cloning</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Guidelines on social-engineering attack patterns, emergency distress voice clone scams, and secondary verification protocols.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#050505]">
          <button
            onClick={() => setActiveSlide((prev) => Math.max(1, prev - 1))}
            disabled={activeSlide === 1}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-200 border border-white/10 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
            Slide {activeSlide} of {totalSlides}
          </span>

          <button
            onClick={() => setActiveSlide((prev) => Math.min(totalSlides, prev + 1))}
            disabled={activeSlide === totalSlides}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-slate-200 disabled:opacity-30 transition-all cursor-pointer shadow-lg"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
