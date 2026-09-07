import React, { useState, useRef, useEffect } from "react";
import {
  Users,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Mic,
  Upload,
  Activity,
  Fingerprint,
  Award,
  Trash2,
  Square,
  FileAudio,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { AppConfig, SpeakerProfile } from "../types";
import { AudioVisualizer } from "./AudioVisualizer";
import { uploadAudioToSupabase } from "../services/api";
import { extractVoiceFeatures, ExtractedVoiceFeatures } from "../utils/audioAnalysis";

interface SpeakerProfilesViewProps {
  profiles: SpeakerProfile[];
  onAddProfile: (profile: SpeakerProfile) => void;
  onDeleteProfile: (id: string) => void;
  config?: AppConfig;
}

export const SpeakerProfilesView: React.FC<SpeakerProfilesViewProps> = ({
  profiles,
  onAddProfile,
  onDeleteProfile,
  config,
}) => {
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newDept, setNewDept] = useState("Executive Board");

  // Audio capture state for enrollment
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBase64, setAudioBase64] = useState<string>("");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Extracted biometric features state
  const [extractedFeatures, setExtractedFeatures] = useState<ExtractedVoiceFeatures | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  // Clean up recording stream on unmount or modal close
  const cleanupStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, []);

  // Process captured audio blob: generate base64 and extract real acoustic biometric features
  const processAudioData = async (blob: Blob, fileName: string) => {
    setAudioBlob(blob);
    setSelectedFileName(fileName);
    setEnrollError(null);
    setIsExtracting(true);

    try {
      // 1. Read as base64 data URL
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const b64 = await base64Promise;
      setAudioBase64(b64);

      // 2. Real Web Audio acoustic feature extraction
      const features = await extractVoiceFeatures(blob);
      setExtractedFeatures(features);
    } catch (err: any) {
      console.error("Feature extraction error:", err);
      setEnrollError("Failed to extract acoustic features from audio sample.");
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    cleanupStream();
    processAudioData(file, file.name);
  };

  // Handle mic recording
  const startRecording = async () => {
    setEnrollError(null);
    setAudioBlob(null);
    setAudioBase64("");
    setExtractedFeatures(null);
    setSelectedFileName("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const name = `enrolled-sample-${Date.now()}.webm`;
        processAudioData(recordedBlob, name);

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
      setEnrollError("Microphone access denied or not supported by browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resetModalState = () => {
    cleanupStream();
    setNewName("");
    setNewRole("");
    setNewDept("Executive Board");
    setAudioBlob(null);
    setAudioBase64("");
    setSelectedFileName("");
    setExtractedFeatures(null);
    setEnrollError(null);
    setIsUploading(false);
    setShowEnrollModal(false);
  };

  // Submit enrollment with real audio upload to Supabase and extracted biometrics
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newRole.trim()) {
      setEnrollError("Please provide both name and corporate role.");
      return;
    }

    if (!audioBlob || !audioBase64) {
      setEnrollError("A reference voice sample is required. Please record with your microphone or upload an audio file.");
      return;
    }

    setIsUploading(true);
    setEnrollError(null);

    try {
      // 1. Upload audio blob to Supabase Storage
      const fileName = selectedFileName || `enrolled-voice-${Date.now()}.webm`;
      const uploadRes = await uploadAudioToSupabase(audioBase64, fileName, config);
      const voiceSampleUrl = uploadRes.url;

      // 2. Ensure we have acoustic features
      let features = extractedFeatures;
      if (!features) {
        features = await extractVoiceFeatures(audioBlob);
      }

      const AVATAR_COLORS = [
        "bg-indigo-600",
        "bg-blue-600",
        "bg-purple-600",
        "bg-emerald-600",
        "bg-amber-600",
        "bg-rose-600",
        "bg-cyan-600",
      ];
      const selectedColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

      const newProfile: SpeakerProfile = {
        id: `spk-${Date.now()}`,
        name: newName.trim(),
        role: newRole.trim(),
        department: newDept,
        enrolledDate: new Date().toISOString().split("T")[0],
        sampleCount: 1,
        fundamentalFreqHz: features.fundamentalFreqHz,
        spectralCentroidHz: features.spectralCentroidHz,
        formantRatio: features.formantRatio,
        confidenceThreshold: 0.85,
        avatarColor: selectedColor,
        isVip: true,
        voiceprintHash: features.voiceprintHash,
        voiceSampleUrl,
        voiceSampleDuration: features.durationSec,
      };

      onAddProfile(newProfile);
      resetModalState();
    } catch (err: any) {
      console.error("Enrollment upload failure:", err);
      setEnrollError(err.message || "Failed to upload reference voice sample to vault.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div id="speaker-profiles-panel" className="space-y-6">
      {/* Header Context with Sophisticated Dark Styling */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#080808] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="p-1 rounded-sm bg-indigo-600 text-white">
              <Users className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-indigo-400">
              Identity Vault • Biometrics
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif text-white leading-tight">
            Enrolled Biometric <span className="text-indigo-400 italic">Voiceprints</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            VoiceSentry Layer 2 biometric verification analyzes acoustic vocal tract formants and pitch vectors. Incoming callers are compared against enrolled key personnel reference audio to instantly catch synthetic timbre divergence.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowEnrollModal(true)}
          className="px-5 py-3 rounded-xl bg-white text-black hover:bg-slate-200 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer shadow-xl shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Enroll New Voiceprint</span>
        </button>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="p-5 rounded-2xl bg-[#0F0F12] border border-white/10 hover:border-white/20 transition-all space-y-4 shadow-lg flex flex-col justify-between"
          >
            <div className="space-y-3.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${
                      profile.avatarColor || "bg-indigo-600"
                    } border border-white/20 text-white flex items-center justify-center font-bold text-sm shadow-sm font-mono`}
                  >
                    {profile.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-serif italic text-white font-medium">{profile.name}</h3>
                    <p className="text-xs text-indigo-400 font-mono mt-0.5">{profile.role}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteProfile(profile.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                  title="Remove Voiceprint"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Acoustic Metrics Breakdown */}
              <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wider">Department:</span>
                  <span className="text-slate-200 font-medium">{profile.department}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wider">Enrolled:</span>
                  <span className="text-slate-200 font-mono text-xs">{profile.enrolledDate}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wider">F0 Pitch:</span>
                  <span className="text-indigo-300 font-mono text-xs font-semibold">{profile.fundamentalFreqHz} Hz</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wider">Spectral Centroid:</span>
                  <span className="text-emerald-400 font-mono text-xs font-semibold">{profile.spectralCentroidHz} Hz</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wider">Formant Ratio (F2/F1):</span>
                  <span className="text-purple-300 font-mono text-xs font-semibold">{profile.formantRatio || 1.35}</span>
                </div>
              </div>

              {/* Enrolled Reference Audio Player */}
              {profile.voiceSampleUrl && (
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="uppercase tracking-wider text-[10px] text-slate-500 flex items-center space-x-1">
                      <Mic className="w-3 h-3 text-indigo-400" />
                      <span>Reference Audio:</span>
                    </span>
                    {profile.voiceSampleDuration && (
                      <span className="text-indigo-300 text-[10px]">{profile.voiceSampleDuration}s sample</span>
                    )}
                  </div>
                  <AudioVisualizer audioUrl={profile.voiceSampleUrl} height={42} />
                </div>
              )}
            </div>

            {/* Voiceprint Hash Badge */}
            <div className="p-2.5 rounded-xl bg-[#050505] border border-white/5 text-[11px] font-mono text-slate-400 flex items-center justify-between mt-2">
              <span className="flex items-center space-x-1.5 text-slate-500">
                <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
                <span className="uppercase tracking-widest text-[10px]">Biometric Hash:</span>
              </span>
              <span className="truncate max-w-[140px] text-indigo-300 font-semibold">{profile.voiceprintHash}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-200">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Biometric Enrollment Engine</span>
              </div>
              <h3 className="text-lg font-serif italic text-white font-medium">
                Enroll Authorized Executive Voiceprint
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Capture an authentic reference audio sample. Acoustic analysis extracts the fundamental frequency, vocal tract spectral centroid, and formant ratios to register a deterministic voiceprint hash in the vault.
              </p>
            </div>

            {enrollError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{enrollError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="E.g. Rajesh Singhania"
                    className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Corporate Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="E.g. Chief Risk Officer"
                    className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  placeholder="Executive Office / Treasury"
                  className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Voice Sample Capture: Recording or Upload */}
              <div className="p-4 rounded-xl bg-[#0F0F12] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold">
                    Reference Voice Sample *
                  </label>
                  <span className="text-[10px] uppercase font-mono text-slate-500">Required</span>
                </div>

                {/* Audio Visualizer Component for sample preview */}
                <AudioVisualizer
                  audioBlob={audioBlob || undefined}
                  isLiveRecording={isRecording}
                  mediaStream={mediaStream}
                  height={65}
                />

                {/* Buttons: Record vs Upload */}
                <div className="grid grid-cols-2 gap-2.5">
                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg animate-pulse"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>Stop ({recordingSeconds}s)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer border border-white/10"
                    >
                      <Mic className="w-4 h-4 text-indigo-400" />
                      <span>Record Voice Sample</span>
                    </button>
                  )}

                  <label className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer border border-white/10">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Upload Voice File</span>
                    <input
                      type="file"
                      accept="audio/*,.wav,.mp3,.ogg,.webm"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {selectedFileName && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#050505] border border-white/10 text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <FileAudio className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-slate-200 truncate font-mono text-xs">{selectedFileName}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Sample Loaded</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Live Extracted Features Feedback */}
              {isExtracting && (
                <div className="p-3 rounded-xl bg-[#0F0F12] border border-white/10 flex items-center space-x-2 text-indigo-300 text-xs font-mono">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
                  <span>Computing real-time acoustic pitch and spectral centroid vectors...</span>
                </div>
              )}

              {extractedFeatures && !isExtracting && (
                <div className="p-3.5 rounded-xl bg-[#050505] border border-white/10 space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-indigo-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Computed Biometric Vector</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[10px] text-slate-500 uppercase">F0 Pitch</div>
                      <div className="text-sm font-bold text-indigo-300 mt-0.5">{extractedFeatures.fundamentalFreqHz} Hz</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[10px] text-slate-500 uppercase">Centroid</div>
                      <div className="text-sm font-bold text-emerald-400 mt-0.5">{extractedFeatures.spectralCentroidHz} Hz</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[10px] text-slate-500 uppercase">Formant (F2/F1)</div>
                      <div className="text-sm font-bold text-purple-300 mt-0.5">{extractedFeatures.formantRatio}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                    <span className="text-slate-500">Deterministic Hash:</span>
                    <span className="text-indigo-300 font-semibold">{extractedFeatures.voiceprintHash}</span>
                  </div>
                </div>
              )}

              {/* Requirement prompt when no audio captured */}
              {!audioBlob && (
                <p className="text-[11px] text-amber-400/80 font-mono flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Voice sample required: Record or upload an audio sample to enable enrollment.</span>
                </p>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={resetModalState}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!audioBlob || !newName.trim() || !newRole.trim() || isUploading || isExtracting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-slate-200 cursor-pointer transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading to Vault...</span>
                    </>
                  ) : (
                    <span>Enroll Voiceprint &amp; Save to Vault</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
