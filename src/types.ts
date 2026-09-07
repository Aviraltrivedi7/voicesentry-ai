export type DetectionDecision = "ALLOW" | "VERIFY" | "BLOCK";

export interface ZeroTrueResult {
  ai_probability: number;
  human_probability: number;
  combined_probability: number;
  result_type: "ai" | "human";
  ml_model: string;
  ml_model_version: string;
  created_at: string;
  status: string;
}

export interface ZeroTrueResponse {
  id: string;
  status: string;
  source?: string;
  result: ZeroTrueResult;
}

export interface SocialEngineeringSignal {
  category: "URGENT_FINANCIAL" | "OTP_HARVESTING" | "CREDENTIAL_PHISHING" | "ARTIFICIAL_URGENCY" | "SECRECY_COERCION" | "OTP_DEMAND" | "URGENT_PAYMENT" | "NONE";
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  trigger_quote?: string;
}

export interface ConversationAnalysisResult {
  social_engineering_score: number;
  detected_signals: SocialEngineeringSignal[];
  urgency_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NORMAL";
  financial_intent_detected: boolean;
  otp_demanded: boolean;
  explanation: string;
}

export interface SpeakerProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  enrolledDate: string;
  sampleCount: number;
  fundamentalFreqHz: number; // e.g. 115 Hz
  spectralCentroidHz: number; // e.g. 1850 Hz
  formantRatio: number;
  confidenceThreshold: number; // e.g. 0.85
  avatarColor: string;
  isVip: boolean;
  voiceprintHash?: string;
  voiceSampleUrl: string;
  voiceSampleDuration?: number;
}

export interface DetectionLayers {
  voiceAuthenticity: {
    aiProbability: number;
    humanProbability: number;
    riskScore: number;
    model: string;
    source: string;
    zeroTrueId?: string;
  };
  speakerVerification: {
    profileName: string;
    role: string;
    matchConfidence: number;
    divergenceRisk: number;
    status: "VERIFIED_MATCH" | "POSSIBLE_MISMATCH" | "CRITICAL_DIVERGENCE";
    voiceSampleUrl?: string;
  };
  conversationAnalysis: {
    threatScore: number;
    detectedSignals: SocialEngineeringSignal[];
    explanation: string;
    source?: string;
  };
}

export interface PipelineAnalysisReport {
  id: string;
  timestamp: string;
  callerName: string;
  audioUrl: string;
  storageProvider: string;
  fileSize?: number;
  durationSec?: number;
  transcript: string;
  riskScore: number;
  decision: DetectionDecision;
  recommendedAction: string;
  warnings?: string[];
  layers: DetectionLayers;
  acousticMetrics?: {
    pitchHz: number;
    jitterPercent: number;
    shimmerPercent?: number;
    spectralFlatness: number;
    spectralCentroidHz?: number;
    pitchStdDev?: number;
    voiceprintHash?: string;
    waveformPeaks?: number[];
    syntheticArtifactsDetected: boolean;
  };
}

export interface AppConfig {
  zeroTrueApiKey: string;
  zeroTrueApiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseBucket: string;
}

export interface PresetScenario {
  id: string;
  title: string;
  caller: string;
  claimedIdentity: string;
  targetPerson: string;
  tag: "CEO Fraud" | "Bank Phishing" | "Family Ransom" | "Legitimate";
  isClone: boolean;
  expectedDecision: DetectionDecision;
  transcript: string;
  description: string;
}
