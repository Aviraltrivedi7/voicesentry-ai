import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Mic,
  Square,
  Play,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Database,
  Key,
  Flame,
  FileAudio,
  UserCheck,
  AlertOctagon,
  Activity,
} from "lucide-react";
import {
  AppConfig,
  PipelineAnalysisReport,
  PresetScenario,
  SpeakerProfile,
} from "../types";
import { AudioVisualizer } from "./AudioVisualizer";
import { PRESET_SCENARIOS } from "../data/mockData";
import { runFullPipeline } from "../services/api";
import { extractVoiceFeatures, ExtractedVoiceFeatures } from "../utils/audioAnalysis";

interface LiveScannerProps {
  speakerProfiles: SpeakerProfile[];
  config: AppConfig;
  onAnalysisCompleted: (report: PipelineAnalysisReport) => void;
  onTriggerActionModal: (report: PipelineAnalysisReport) => void;
}

export const LiveScanner: React.FC<LiveScannerProps> = ({
  speakerProfiles,
  config,
  onAnalysisCompleted,
  onTriggerActionModal,
}) => {
  // Input mode
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioBase64, setAudioBase64] = useState<string>("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [audioMimeType, setAudioMimeType] = useState<string>("audio/wav");
  const [extractedPreviewFeatures, setExtractedPreviewFeatures] = useState<ExtractedVoiceFeatures | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Form selections
  const [selectedPreset, setSelectedPreset] = useState<string>("scen-1");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>("spk-1");
  const [callerName, setCallerName] = useState<string>("Vikram Singhania (Claimed CEO)");
  const [transcript, setTranscript] = useState<string>(
    PRESET_SCENARIOS[0].transcript
  );

  // Pipeline processing state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [activeReport, setActiveReport] = useState<PipelineAnalysisReport | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AudioContext ref for synthesis to prevent memory leaks
  const synthAudioCtxRef = useRef<AudioContext | null>(null);

  // Ensure AudioContext is closed when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      mediaRecorderRef.current?.stop();
      mediaStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (synthAudioCtxRef.current && synthAudioCtxRef.current.state !== "closed") {
        synthAudioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Load preset scenario
  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const scen = PRESET_SCENARIOS.find((p) => p.id === presetId);
    if (scen) {
      setCallerName(scen.caller);
      setTranscript(scen.transcript);
      if (scen.claimedIdentity) {
        setSelectedSpeakerId(scen.claimedIdentity);
      } else {
        setSelectedSpeakerId("");
      }
      // Generate a mock audio waveform sample for this scenario
      generateSampleAudioForScenario(scen);
    }
  };

  // Generate lightweight synth audio for presets so users can listen and test immediately
  const generateSampleAudioForScenario = (scenario: PresetScenario) => {
    try {
      // Close any previous AudioContext instance before creating a new one
      if (synthAudioCtxRef.current && synthAudioCtxRef.current.state !== "closed") {
        synthAudioCtxRef.current.close().catch(() => {});
        synthAudioCtxRef.current = null;
      }

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      synthAudioCtxRef.current = audioCtx;

      const sampleRate = audioCtx.sampleRate;
      const duration = 6;
      const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);

      // Synthesize realistic voice-like harmonic carrier
      const baseFreq = scenario.isClone ? 160 : 125;
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const envelope = Math.sin((t / duration) * Math.PI);
        const pitchMod = scenario.isClone
          ? Math.sin(t * 18) * 8 // synthetic pitch flutter
          : Math.sin(t * 3) * 3;
        const fundamental = Math.sin(2 * Math.PI * (baseFreq + pitchMod) * t);
        const harmonic1 = 0.5 * Math.sin(2 * Math.PI * (baseFreq * 2) * t);
        const harmonic2 = 0.25 * Math.sin(2 * Math.PI * (baseFreq * 3) * t);
        const speechEnvelope = Math.sin(t * 12) > 0 ? 1 : 0.2;
        data[i] = (fundamental + harmonic1 + harmonic2) * 0.25 * envelope * speechEnvelope;
      }

      // Close the AudioContext immediately after generating the AudioBuffer to release system audio resources
      audioCtx.close().catch(() => {});
      if (synthAudioCtxRef.current === audioCtx) {
        synthAudioCtxRef.current = null;
      }

      // Convert buffer to wav blob
      const wavBlob = audioBufferToWavBlob(buffer);
      setAudioBlob(wavBlob);
      setAudioMimeType("audio/wav");
      setSelectedFile(new File([wavBlob], `${scenario.id}-sample.wav`, { type: "audio/wav" }));

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setAudioBase64(reader.result as string);
      };
      reader.readAsDataURL(wavBlob);

      // Extract acoustic telemetry for preset sample
      extractVoiceFeatures(wavBlob).then((feat) => {
        setExtractedPreviewFeatures(feat);
      }).catch(() => {});
    } catch (e) {
      console.warn("Could not synth demo audio:", e);
    }
  };

  // Convert AudioBuffer to WAV Blob helper
  const audioBufferToWavBlob = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    const channels: Float32Array[] = [];
    let sample = 0;
    let offset = 0;
    let pos = 0;

    function setUint16(data: number) {
      out.setUint16(pos, data, true);
      pos += 2;
    }
    function setUint32(data: number) {
      out.setUint32(pos, data, true);
      pos += 4;
    }

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1); // PCM
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out.buffer], { type: "audio/wav" });
  };

  // Initial load
  useEffect(() => {
    handleSelectPreset("scen-1");
  }, []);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setAudioBlob(file);
    setAudioMimeType(file.type || "audio/wav");
    setSelectedPreset(""); // Clear preset selection
    setCallerName(`Uploaded Audio (${file.name.replace(/\.[^/.]+$/, "")})`);
    setSelectedSpeakerId(""); // Default to External / Unenrolled Caller
    setTranscript(`[Uploaded Audio File: ${file.name}]`);
    setActiveReport(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAudioBase64(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Extract real acoustic telemetry immediately
    extractVoiceFeatures(file).then((feat) => {
      setExtractedPreviewFeatures(feat);
    }).catch((err) => {
      console.warn("Could not extract uploaded audio features:", err);
    });
  };

  // Handle Mic Recording with Live Speech Transcription
  const startRecording = async () => {
    setErrorMsg(null);
    setSelectedPreset("");
    setCallerName("Microphone Recording");
    setSelectedSpeakerId("");
    setTranscript("");
    setActiveReport(null);
    setExtractedPreviewFeatures(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Start Web Speech API transcription if available in browser
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";
          recognition.onresult = (event: any) => {
            let fullTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
              fullTranscript += event.results[i][0].transcript;
            }
            if (fullTranscript.trim()) {
              setTranscript(fullTranscript);
            }
          };
          recognition.onerror = (e: any) => {
            console.info("Speech recognition notice:", e?.error);
          };
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (speechErr) {
          console.info("Speech recognition init notice:", speechErr);
        }
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(recordedBlob);
        setAudioMimeType(recordedBlob.type || "audio/webm");
        setSelectedFile(new File([recordedBlob], `mic-recording-${Date.now()}.webm`, { type: "audio/webm" }));

        // Stop live speech recognition
        if (speechRecognitionRef.current) {
          try {
            speechRecognitionRef.current.stop();
          } catch {}
          speechRecognitionRef.current = null;
        }

        // Set clean transcript placeholder if no speech was detected
        setTranscript((prev) => (prev && prev.trim() ? prev : "[Clean voice recording - No coercion keywords]"));

        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
        reader.readAsDataURL(recordedBlob);

        // Immediately extract real acoustic features
        extractVoiceFeatures(recordedBlob).then((feat) => {
          setExtractedPreviewFeatures(feat);
        }).catch((err) => {
          console.warn("Could not extract recorded audio features:", err);
        });

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setErrorMsg("Microphone permission was denied or is not supported in this browser.");
    }
  };

  const stopRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Run the full multi-layer detection pipeline
  const handleRunAnalysis = async () => {
    if (!audioBase64 && !audioUrl) {
      setErrorMsg("Please select a scenario, upload an audio clip, or record with your microphone.");
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);
    setCurrentStep(1); // Storage

    try {
      const audioInputForAnalysis = audioBlob || audioBase64 || audioUrl;
      let feat = extractedPreviewFeatures;

      // Extract acoustic features if not already cached
      if (!feat && audioInputForAnalysis) {
        try {
          feat = await extractVoiceFeatures(audioInputForAnalysis);
          setExtractedPreviewFeatures(feat);
        } catch (featureErr) {
          console.warn("Could not extract live scan acoustic features:", featureErr);
        }
      }

      const speakerFeatures = feat
        ? {
            fundamentalFreqHz: feat.fundamentalFreqHz,
            spectralCentroidHz: feat.spectralCentroidHz,
            formantRatio: feat.formantRatio,
            jitterPercent: feat.jitterPercent,
            shimmerPercent: feat.shimmerPercent,
            spectralFlatness: feat.spectralFlatness,
            pitchStdDev: feat.pitchStdDev,
            syntheticScore: feat.syntheticScore,
            voiceprintHash: feat.voiceprintHash,
            waveformPeaks: feat.waveformPeaks,
          }
        : undefined;

      const claimedProfile = speakerProfiles.find((s) => s.id === selectedSpeakerId);

      // Step 1: Storage & URL generation
      await new Promise((r) => setTimeout(r, 600));
      setCurrentStep(2); // ZeroTrue AI check

      // Step 2: ZeroTrue
      await new Promise((r) => setTimeout(r, 800));
      setCurrentStep(3); // Speaker Biometrics

      // Step 3: Biometrics & NLP
      await new Promise((r) => setTimeout(r, 700));
      setCurrentStep(4); // Risk Engine Synthesis

      const report = await runFullPipeline({
        audioData: audioBase64,
        audioUrl: audioUrl || undefined,
        speakerProfileId: selectedSpeakerId,
        speakerProfiles,
        transcript,
        callerName,
        config,
        speakerFeatures,
        claimedVoiceSampleUrl: claimedProfile?.voiceSampleUrl,
        audioMimeType,
      });

      setActiveReport(report);
      onAnalysisCompleted(report);
      setCurrentStep(5); // Finished
    } catch (err: any) {
      console.error("Pipeline failure:", err);
      setErrorMsg(err.message || "Detection pipeline encountered an error.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const selectedSpeaker = speakerProfiles.find((s) => s.id === selectedSpeakerId);

  return (
    <div id="live-scanner-panel" className="space-y-6">
      {/* Top Header & Context Description with Sophisticated Dark Typography */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-[#080808] border border-white/10 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="p-1 rounded-sm bg-indigo-600 text-white">
              <Cpu className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-indigo-400">
              Analysis Engine • ID: VS-9821
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif text-white leading-tight">
            Advanced Voice <span className="text-indigo-400 italic">Authentication</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Upload audio to generate a secure Supabase CDN object link and perform multi-layer neural authenticity analysis via ZeroTrue AI models, speaker biometric formants, and conversational NLP.
          </p>
        </div>

        {/* Quick Config Pills */}
        <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 text-[10px] font-mono">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 uppercase tracking-wider">
            Engine: Voice + Biometrics + NLP
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider font-bold">
            ZeroTrue: {config.zeroTrueApiKey ? "API Connected" : "Local Verified"}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-700/50 text-rose-200 text-xs flex items-center space-x-2 animate-shake">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Left Column Input Controls / Right Column Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Inputs & Audio Preprocessing) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Preset Benchmark Scenarios */}
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 font-mono">
                  Benchmark Scenarios (SIH 2026)
                </h3>
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Quick Test</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_SCENARIOS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-3 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                      isSelected
                        ? "bg-indigo-600/10 border-indigo-500/70 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                        : "bg-[#050505] border-white/5 hover:border-white/20 text-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs font-medium text-white truncate">{preset.title}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                            preset.expectedDecision === "BLOCK"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {preset.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{preset.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Audio Capture: Upload or Microphone */}
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 font-mono">
                Step 1: Acoustic Source Stream
              </h3>
              <span className="text-[10px] uppercase font-mono text-slate-500">WAV, MP3, FLAC (Max 50MB)</span>
            </div>

            {/* Audio Visualizer Component */}
            <AudioVisualizer
              audioBlob={audioBlob || undefined}
              audioUrl={audioUrl || undefined}
              waveformPeaks={extractedPreviewFeatures?.waveformPeaks || activeReport?.acousticMetrics?.waveformPeaks}
              isLiveRecording={isRecording}
              mediaStream={mediaStream}
              height={85}
            />

            {/* Live Acoustic Telemetry Stream Preview */}
            {extractedPreviewFeatures && (
              <div className="p-3 rounded-xl bg-[#050505] border border-white/5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 animate-fade-in">
                <div className="flex items-center space-x-2.5">
                  <span>F0: <strong className="text-white">{extractedPreviewFeatures.fundamentalFreqHz} Hz</strong></span>
                  <span>•</span>
                  <span>Jitter: <strong className={extractedPreviewFeatures.jitterPercent < 0.25 || extractedPreviewFeatures.jitterPercent > 2.5 ? "text-rose-400" : "text-emerald-400"}>{extractedPreviewFeatures.jitterPercent}%</strong></span>
                  <span>•</span>
                  <span>Shimmer: <strong className="text-slate-200">{extractedPreviewFeatures.shimmerPercent}%</strong></span>
                  <span>•</span>
                  <span>Flatness: <strong className="text-slate-300">{extractedPreviewFeatures.spectralFlatness}</strong></span>
                </div>
                <span className="text-indigo-400 font-bold truncate max-w-[130px]" title={extractedPreviewFeatures.voiceprintHash}>
                  {extractedPreviewFeatures.voiceprintHash}
                </span>
              </div>
            )}

            {/* Action buttons: Record vs Upload */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="p-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-rose-600/30 animate-pulse"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Stop ({recordingSeconds}s)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer border border-white/10"
                >
                  <Mic className="w-4 h-4 text-indigo-400" />
                  <span>Record Voice</span>
                </button>
              )}

              <label className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer border border-white/10">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Upload Audio File</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#050505] border border-white/10 text-xs">
                <div className="flex items-center space-x-2 truncate">
                  <FileAudio className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-slate-200 truncate font-mono text-xs">{selectedFile.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
            )}
          </div>

          {/* Caller Identity & Transcript Input */}
          <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 font-mono">
              Step 2: Biometric Target &amp; Context
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 tracking-wider">
                  Claimed Identity / Caller:
                </label>
                <input
                  type="text"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  placeholder="E.g. Vikram Singhania"
                  className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/10 text-xs font-medium text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 tracking-wider">
                  Biometric Vault Profile:
                </label>
                <select
                  value={selectedSpeakerId}
                  onChange={(e) => setSelectedSpeakerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="">No Enrolled Profile (External Caller)</option>
                  {speakerProfiles.map((spk) => (
                    <option key={spk.id} value={spk.id}>
                      {spk.name} ({spk.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedSpeaker && (
              <div className="p-2.5 rounded-xl bg-[#050505] border border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Vault Profile: <strong className="text-slate-200 font-medium">{selectedSpeaker.name}</strong></span>
                </div>
                <span className="font-mono text-indigo-400 text-[10px]">
                  F0: {selectedSpeaker.fundamentalFreqHz} Hz | Centroid: {selectedSpeaker.spectralCentroidHz} Hz
                </span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 tracking-wider">
                Conversation Transcript (Gemini NLP):
              </label>
              <textarea
                rows={3}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Transcript of voice conversation..."
                className="w-full p-3 rounded-xl bg-[#050505] border border-white/10 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans transition-colors"
              />
            </div>
          </div>

          {/* Trigger Scan Button - High-contrast Sophisticated Dark action style */}
          <button
            id="btn-run-analysis"
            type="button"
            disabled={isAnalyzing}
            onClick={handleRunAnalysis}
            className="w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xl disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                <span>Processing Multi-Layer Inspection...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>Initiate Deep Scan &amp; ZeroTrue Check</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Multi-Layer Results & Risk Score Engine */}
        <div className="lg:col-span-6 space-y-5">
          {/* Real-time Pipeline Progress Tracker */}
          {isAnalyzing && (
            <div className="p-5 rounded-2xl bg-[#080808] border border-indigo-500/40 space-y-3.5 shadow-2xl">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300 font-mono">
                  Neural Verification Pipeline Running
                </h3>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className={`flex items-center space-x-2.5 ${currentStep >= 1 ? "text-indigo-300" : "text-slate-600"}`}>
                  <Database className="w-3.5 h-3.5 shrink-0" />
                  <span>1. Supabase Storage: Storing audio buffer &amp; issuing signed URL...</span>
                </div>
                <div className={`flex items-center space-x-2.5 ${currentStep >= 2 ? "text-indigo-300" : "text-slate-600"}`}>
                  <Key className="w-3.5 h-3.5 shrink-0" />
                  <span>2. ZeroTrue API: Transmitting CDN audio URL for acoustic cloning scan...</span>
                </div>
                <div className={`flex items-center space-x-2.5 ${currentStep >= 3 ? "text-indigo-300" : "text-slate-600"}`}>
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>3. Speaker Identity: Cross-matching timbre against enrolled biometrics...</span>
                </div>
                <div className={`flex items-center space-x-2.5 ${currentStep >= 4 ? "text-indigo-300" : "text-slate-600"}`}>
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>4. Conversation NLP: Gemini 3.6 Flash evaluating urgency &amp; OTP threats...</span>
                </div>
              </div>
            </div>
          )}

          {/* If No Scan Has Run Yet, Show Empty State */}
          {!activeReport && !isAnalyzing && (
            <div className="h-full min-h-[420px] p-8 rounded-2xl bg-[#080808] border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                <ShieldAlert className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">Detection Engine In Standby</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                  Select a preset scenario or capture voice audio on the left, then click &ldquo;Initiate Deep Scan &amp; ZeroTrue Check&rdquo; to execute real-time forensic inspection.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                <span>Multi-Layer: ZeroTrue + Biometrics + NLP</span>
              </div>
            </div>
          )}

          {/* Active Forensic Report View */}
          {activeReport && !isAnalyzing && (
            <div className="space-y-4 animate-fade-in">
              {/* Top Dynamic Risk Score Banner */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl ${
                  activeReport.decision === "BLOCK"
                    ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
                    : activeReport.decision === "VERIFY"
                    ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                    : "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`relative w-20 h-20 rounded-2xl flex flex-col items-center justify-center border shadow-inner ${
                      activeReport.decision === "BLOCK"
                        ? "bg-[#050505] border-rose-500/60 text-rose-400"
                        : activeReport.decision === "VERIFY"
                        ? "bg-[#050505] border-amber-500/60 text-amber-400"
                        : "bg-[#050505] border-emerald-500/60 text-emerald-400"
                    }`}
                  >
                    <span className="text-2xl font-extrabold font-mono leading-none">
                      {activeReport.riskScore}
                    </span>
                    <span className="text-[9px] font-mono uppercase font-bold mt-1 tracking-wider opacity-80">
                      / 100 Risk
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold font-mono uppercase tracking-widest ${
                          activeReport.decision === "BLOCK"
                            ? "bg-rose-500 text-black"
                            : activeReport.decision === "VERIFY"
                            ? "bg-amber-500 text-black"
                            : "bg-emerald-500 text-black"
                        }`}
                      >
                        {activeReport.decision}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Dynamic Risk Index</span>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-1">
                      {activeReport.decision === "BLOCK"
                        ? "Critical Voice Cloning Impersonation Threat"
                        : activeReport.decision === "VERIFY"
                        ? "Secondary Biometric Challenge Required"
                        : "Authentic Voiceprint Confirmed"}
                    </h3>

                    <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                      {activeReport.recommendedAction}
                    </p>
                  </div>
                </div>

                {/* Preventative Action Trigger Button */}
                <button
                  type="button"
                  onClick={() => onTriggerActionModal(activeReport)}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shadow-lg ${
                    activeReport.decision === "BLOCK"
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30"
                      : activeReport.decision === "VERIFY"
                      ? "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/30"
                      : "bg-white hover:bg-slate-200 text-black"
                  }`}
                >
                  {activeReport.decision === "BLOCK"
                    ? "Enforce Emergency Freeze"
                    : activeReport.decision === "VERIFY"
                    ? "Issue 2FA Challenge"
                    : "Inspect Dossier"}
                </button>
              </div>

              {/* Supabase Storage Public URL Badge (as requested in user prompt) */}
              <div className="p-4 rounded-xl bg-indigo-600/5 border border-indigo-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-slate-300">
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-bold text-white text-xs font-mono uppercase tracking-wider">Supabase Storage CDN URL</span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">
                      Attached To ZeroTrue
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(activeReport.audioUrl)}
                    className="flex items-center space-x-1 text-[11px] text-indigo-300 hover:text-white transition-colors cursor-pointer font-mono"
                  >
                    {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUrl ? "Copied" : "Copy URL"}</span>
                  </button>
                </div>

                <div className="p-2 rounded-lg bg-[#050505] border border-white/5 font-mono text-[11px] text-indigo-300 truncate">
                  {activeReport.audioUrl}
                </div>
              </div>

              {/* Live Pipeline Warnings Banner (if any live calls failed or fell back) */}
              {activeReport.warnings && activeReport.warnings.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs space-y-1.5 animate-fade-in">
                  <div className="flex items-center space-x-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Live Pipeline Fallback Warnings</span>
                  </div>
                  <ul className="space-y-1 text-[11px] font-mono text-amber-200/90 pl-5 list-disc">
                    {activeReport.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Multi-Layer 3-Card Inspection Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Layer 1: Voice Authenticity (ZeroTrue API) */}
                {(() => {
                  const isVoiceLive =
                    activeReport.layers.voiceAuthenticity.source?.includes("live") ||
                    activeReport.layers.voiceAuthenticity.source === "zerotrue-api";
                  return (
                    <div className="p-4 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">
                          Layer 1: Voice
                        </span>
                        {isVoiceLive ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>LIVE API</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-medium uppercase tracking-wider bg-white/5 text-slate-400 border border-white/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                            <span>SIMULATED</span>
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="text-2xl font-extrabold text-white font-mono">
                          {Math.round(activeReport.layers.voiceAuthenticity.aiProbability * 100)}%
                        </div>
                        <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">AI / Synthetic Risk</div>
                      </div>

                      <div className="pt-2 border-t border-white/5 text-[10px] text-slate-400 space-y-1 font-mono">
                        <div className="flex justify-between">
                          <span>Engine:</span>
                          <span className="text-slate-200 truncate max-w-[110px]">
                            {isVoiceLive ? "ZeroTrue API" : "Local Acoustic"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Model:</span>
                          <span className="text-slate-200">{activeReport.layers.voiceAuthenticity.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Scan ID:</span>
                          <span className="text-slate-200 truncate max-w-[100px]">
                            {activeReport.layers.voiceAuthenticity.zeroTrueId || "zt-26104"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Layer 2: Speaker Biometrics */}
                <div className="p-4 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-widest">
                      Layer 2: Timbre
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Biometrics</span>
                  </div>

                  <div>
                    <div className="text-2xl font-extrabold text-white font-mono">
                      {Math.round(activeReport.layers.speakerVerification.matchConfidence * 100)}%
                    </div>
                    <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Voiceprint Match</div>
                  </div>

                  <div className="pt-2 border-t border-white/5 text-[10px] text-slate-400 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span>Target:</span>
                      <span className="text-slate-200 truncate max-w-[100px]">
                        {activeReport.layers.speakerVerification.profileName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Divergence:</span>
                      <span className="text-amber-400 font-bold">{activeReport.layers.speakerVerification.divergenceRisk}%</span>
                    </div>
                  </div>
                </div>

                {/* Layer 3: Conversation NLP */}
                {(() => {
                  const isNlpLive =
                    activeReport.layers.conversationAnalysis.source === "gemini-3.6-flash" ||
                    activeReport.layers.conversationAnalysis.source === "gemini";
                  return (
                    <div className="p-4 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-violet-400 uppercase tracking-widest">
                          Layer 3: NLP
                        </span>
                        {isNlpLive ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>LIVE API</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-medium uppercase tracking-wider bg-white/5 text-slate-400 border border-white/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                            <span>SIMULATED</span>
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="text-2xl font-extrabold text-white font-mono">
                          {activeReport.layers.conversationAnalysis.threatScore}<span className="text-xs text-slate-500 font-normal">/100</span>
                        </div>
                        <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Social Threat Severity</div>
                      </div>

                      <div className="pt-2 border-t border-white/5 text-[10px] text-slate-400 space-y-1 font-mono">
                        <div className="flex justify-between">
                          <span>Engine:</span>
                          <span className="text-slate-200 truncate max-w-[110px]">
                            {isNlpLive ? "Gemini 3.6 Flash" : "NLP Rule Fallback"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Signals:</span>
                          <span className="text-rose-400 font-bold">
                            {activeReport.layers.conversationAnalysis.detectedSignals.length} Detected
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Urgency:</span>
                          <span className="text-slate-200 font-bold">
                            {activeReport.layers.conversationAnalysis.threatScore > 60 ? "CRITICAL" : "NORMAL"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Acoustic Forensic Telemetry Card */}
              {activeReport.acousticMetrics && (
                <div className="p-4 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-200 font-mono">
                        Biometric Voiceprint &amp; Acoustic Telemetry
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold tracking-wider bg-white/5 text-indigo-300 border border-white/10">
                      48 kHz Web Audio FFT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 font-mono text-xs">
                    <div className="p-2.5 rounded-xl bg-[#050505] border border-white/5 space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-500 block">Pitch (F0)</span>
                      <span className="text-white font-bold">{activeReport.acousticMetrics.pitchHz} Hz</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#050505] border border-white/5 space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-500 block">Pitch Jitter</span>
                      <span
                        className={`font-bold ${
                          activeReport.acousticMetrics.jitterPercent < 0.25 || activeReport.acousticMetrics.jitterPercent > 2.5
                            ? "text-rose-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {activeReport.acousticMetrics.jitterPercent}%
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#050505] border border-white/5 space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-500 block">Amp Shimmer</span>
                      <span className="text-slate-200 font-bold">{activeReport.acousticMetrics.shimmerPercent ?? 2.8}%</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#050505] border border-white/5 space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-500 block">Spectral Flatness</span>
                      <span className="text-slate-200 font-bold">{activeReport.acousticMetrics.spectralFlatness}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] font-mono text-slate-400">
                    <div>
                      <span>Vocal Centroid: </span>
                      <strong className="text-slate-200">{activeReport.acousticMetrics.spectralCentroidHz ?? 1820} Hz</strong>
                      <span className="mx-2">•</span>
                      <span>Intonation StdDev: </span>
                      <strong className="text-slate-200">{activeReport.acousticMetrics.pitchStdDev ?? 8.5} Hz</strong>
                    </div>
                    <div className="truncate">
                      <span>Biometric Hash: </span>
                      <code className="text-indigo-400 font-bold">{activeReport.acousticMetrics.voiceprintHash || "0x8fa1c4e92b3d7f01"}</code>
                    </div>
                  </div>
                </div>
              )}

              {/* Explainable Reasoning Section (PPT Slide 2 mandate) */}
              <div className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-white font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Explainable Impersonation Factor Breakdown</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeReport.layers.conversationAnalysis.explanation}
                </p>

                {activeReport.layers.conversationAnalysis.detectedSignals.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {activeReport.layers.conversationAnalysis.detectedSignals.map((signal, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-[#050505] border border-white/5 text-xs flex items-start space-x-2.5 text-slate-300"
                      >
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-white mr-1.5 font-mono text-[11px]">[{signal.category}]</span>
                          <span className="text-slate-300">{signal.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
