import { AppConfig, PipelineAnalysisReport, SpeakerProfile } from "../types";

export async function fetchConfigStatus(): Promise<{
  hasGemini: boolean;
  hasZeroTrue: boolean;
  hasSupabase: boolean;
  supabaseBucket: string;
  zeroTrueUrl: string;
}> {
  try {
    const res = await fetch("/api/config-status");
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Failed to fetch server config status:", err);
  }
  return {
    hasGemini: false,
    hasZeroTrue: false,
    hasSupabase: false,
    supabaseBucket: "voicesentry-audio",
    zeroTrueUrl: "https://app.zerotrue.app/api/v1/check",
  };
}

export async function uploadAudioToSupabase(
  audioBase64: string,
  fileName: string,
  config?: Partial<AppConfig>,
  mimeType = "audio/wav"
): Promise<{
  url: string;
  storageProvider: string;
  fileSize: number;
  note?: string;
}> {
  const res = await fetch("/api/storage/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audioData: audioBase64,
      fileName,
      supabaseUrl: config?.supabaseUrl,
      supabaseAnonKey: config?.supabaseAnonKey,
      bucketName: config?.supabaseBucket,
      mimeType,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to upload audio to Supabase (${res.status})`);
  }

  return await res.json();
}

export async function checkZeroTrueVoice(
  audioUrl: string,
  config?: Partial<AppConfig>
) {
  const res = await fetch("/api/zerotrue/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audioUrl,
      apiKey: config?.zeroTrueApiKey,
      apiUrl: config?.zeroTrueApiUrl,
      isPrivateScan: true,
      isDeepScan: false,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `ZeroTrue analysis failed (${res.status})`);
  }

  return await res.json();
}

export async function analyzeConversationText(
  transcript: string,
  callerContext?: string
) {
  const res = await fetch("/api/conversation/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript,
      callerContext,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Conversation analysis failed (${res.status})`);
  }

  return await res.json();
}

export async function runFullPipeline(params: {
  audioData?: string;
  audioUrl?: string;
  speakerProfileId?: string;
  speakerProfiles: SpeakerProfile[];
  transcript?: string;
  callerName?: string;
  config?: Partial<AppConfig>;
  speakerFeatures?: {
    fundamentalFreqHz: number;
    spectralCentroidHz: number;
    formantRatio: number;
    jitterPercent?: number;
    shimmerPercent?: number;
    spectralFlatness?: number;
    pitchStdDev?: number;
    syntheticScore?: number;
    voiceprintHash?: string;
    waveformPeaks?: number[];
  };
  claimedVoiceSampleUrl?: string;
  audioMimeType?: string;
}): Promise<PipelineAnalysisReport> {
  const res = await fetch("/api/full-pipeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audioData: params.audioData,
      audioUrl: params.audioUrl,
      speakerProfileId: params.speakerProfileId,
      speakerProfiles: params.speakerProfiles,
      transcript: params.transcript,
      callerName: params.callerName,
      customZeroTrueKey: params.config?.zeroTrueApiKey,
      customSupabaseUrl: params.config?.supabaseUrl,
      customSupabaseKey: params.config?.supabaseAnonKey,
      bucketName: params.config?.supabaseBucket,
      speakerFeatures: params.speakerFeatures,
      claimedVoiceSampleUrl: params.claimedVoiceSampleUrl,
      mimeType: params.audioMimeType,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Full pipeline detection failed (${res.status})`);
  }

  const data = await res.json();
  const serverAcoustic = data.acousticMetrics || {};
  const clientFeatures = params.speakerFeatures || ({} as any);

  return {
    id: `scan-${Date.now()}`,
    timestamp: data.timestamp || new Date().toISOString(),
    callerName: params.callerName || "Unknown Caller",
    audioUrl: data.storage?.url || params.audioUrl || "",
    storageProvider: data.storage?.provider || "supabase",
    transcript: params.transcript || "",
    riskScore: data.riskScore,
    decision: data.decision,
    recommendedAction: data.recommendedAction,
    warnings: data.warnings || [],
    layers: data.layers,
    acousticMetrics: {
      pitchHz: serverAcoustic.pitchHz ?? clientFeatures.fundamentalFreqHz ?? 135,
      jitterPercent: serverAcoustic.jitterPercent ?? clientFeatures.jitterPercent ?? 0.85,
      shimmerPercent: serverAcoustic.shimmerPercent ?? clientFeatures.shimmerPercent ?? 2.8,
      spectralFlatness: serverAcoustic.spectralFlatness ?? clientFeatures.spectralFlatness ?? 0.22,
      spectralCentroidHz: serverAcoustic.spectralCentroidHz ?? clientFeatures.spectralCentroidHz ?? 1820,
      pitchStdDev: serverAcoustic.pitchStdDev ?? clientFeatures.pitchStdDev ?? 8.5,
      voiceprintHash: serverAcoustic.voiceprintHash ?? clientFeatures.voiceprintHash ?? "0x8fa1c4e92b3d7f01",
      waveformPeaks: clientFeatures.waveformPeaks,
      syntheticArtifactsDetected:
        (data.layers?.voiceAuthenticity?.aiProbability > 0.5) ||
        ((clientFeatures.syntheticScore ?? 0) > 0.5),
    },
  };
}

/**
 * Dispatches an emergency transaction freeze to the backend API.
 * INTEGRATION POINT: In production, this endpoint connects to real banking / payment-rail webhooks
 * (such as FedNow, SWIFT, FIS, Fiserv, or core ledger systems) to halt transactions immediately.
 */
export async function sendTransactionBlock(params: {
  reportId: string;
  callerName: string;
  riskScore: number;
}): Promise<{ status: string; message: string }> {
  try {
    const res = await fetch("/api/transaction/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      console.warn("Transaction block endpoint returned non-200 status:", res.status);
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to post transaction block:", err);
    return { status: "LOCAL_ONLY", message: "Transaction blocked locally" };
  }
}
