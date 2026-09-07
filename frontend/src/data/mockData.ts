import { SpeakerProfile, PresetScenario, PipelineAnalysisReport } from "../types";

/**
 * Generates an enrolled reference WAV audio data URI for initial executive profiles
 */
function createReferenceVoiceWav(f0: number, durationSec = 2.5, sampleRate = 8000): string {
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + numSamples * 2, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.sin((t / durationSec) * Math.PI);
    const s1 = Math.sin(2 * Math.PI * f0 * t);
    const s2 = 0.4 * Math.sin(2 * Math.PI * f0 * 2 * t);
    const val = Math.max(-1, Math.min(1, (s1 + s2) * 0.35 * env));
    view.setInt16(44 + i * 2, Math.floor(val * 32767), true);
  }

  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return "data:audio/wav;base64," + btoa(binary);
}

export const INITIAL_SPEAKER_PROFILES: SpeakerProfile[] = [
  {
    id: "spk-1",
    name: "Vikram Singhania",
    role: "Chief Executive Officer (CEO)",
    department: "Executive Leadership",
    enrolledDate: "2026-01-15",
    sampleCount: 24,
    fundamentalFreqHz: 118,
    spectralCentroidHz: 1720,
    formantRatio: 1.28,
    confidenceThreshold: 0.88,
    avatarColor: "bg-blue-600",
    isVip: true,
    voiceprintHash: "0x8fa1c4e92b3d7f01",
    voiceSampleUrl: createReferenceVoiceWav(118, 2.5),
    voiceSampleDuration: 2.5,
  },
  {
    id: "spk-2",
    name: "Priya Sharma",
    role: "Chief Financial Officer (CFO)",
    department: "Treasury & Finance",
    enrolledDate: "2026-02-01",
    sampleCount: 18,
    fundamentalFreqHz: 215,
    spectralCentroidHz: 2340,
    formantRatio: 1.42,
    confidenceThreshold: 0.90,
    avatarColor: "bg-purple-600",
    isVip: true,
    voiceprintHash: "0x7bc2d5f03e4a8b12",
    voiceSampleUrl: createReferenceVoiceWav(215, 2.5),
    voiceSampleDuration: 2.5,
  },
  {
    id: "spk-3",
    name: "Dr. Ananya Rao",
    role: "VP of Engineering & Security",
    department: "R&D CyberDefense",
    enrolledDate: "2026-02-18",
    sampleCount: 15,
    fundamentalFreqHz: 198,
    spectralCentroidHz: 2180,
    formantRatio: 1.36,
    confidenceThreshold: 0.85,
    avatarColor: "bg-emerald-600",
    isVip: true,
    voiceprintHash: "0x9da3e6014f5b9c23",
    voiceSampleUrl: createReferenceVoiceWav(198, 2.5),
    voiceSampleDuration: 2.5,
  },
  {
    id: "spk-4",
    name: "Rohan Mehra",
    role: "Senior Accounts Payable Lead",
    department: "Finance & Operations",
    enrolledDate: "2026-03-02",
    sampleCount: 9,
    fundamentalFreqHz: 132,
    spectralCentroidHz: 1880,
    formantRatio: 1.22,
    confidenceThreshold: 0.80,
    avatarColor: "bg-amber-600",
    isVip: false,
    voiceprintHash: "0x4eb5f7126a8c0d34",
    voiceSampleUrl: createReferenceVoiceWav(132, 2.5),
    voiceSampleDuration: 2.5,
  },
];

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: "scen-1",
    title: "CEO Impersonation - Emergency Wire Authorization",
    caller: "Vikram Singhania (Claimed CEO)",
    claimedIdentity: "spk-1",
    targetPerson: "Finance Treasury Desk",
    tag: "CEO Fraud",
    isClone: true,
    expectedDecision: "BLOCK",
    transcript:
      "Rajesh, this is Vikram. I am in an emergency closed-door meeting with the acquisition partners in Singapore. We need to immediately wire ₹18,50,000 to the escrow account before 5 PM or the entire deal collapses. Do not call my phone or alert the office, just execute the transfer right away. I take full responsibility.",
    description:
      "AI cloned voice mimicking the CEO. High conversational urgency, financial extraction vector, and explicit instructions to bypass standard verification channels.",
  },
  {
    id: "scen-2",
    title: "Bank CyberCell Scam - OTP Harvesting",
    caller: "Pradeep Verma (Claimed Bank Officer)",
    claimedIdentity: "",
    targetPerson: "Retail Banking Account Holder",
    tag: "Bank Phishing",
    isClone: true,
    expectedDecision: "BLOCK",
    transcript:
      "Good afternoon Mr. Sharma. This is Pradeep from Central Fraud Detection. We are observing an unauthorized international debit transaction of $3,400 from Frankfurt on your primary corporate card. To halt this fraud and freeze the card, our automated system has dispatched a 6-digit OTP to your phone. Read out that 6-digit code immediately so we can block the theft.",
    description:
      "Synthesized voice with caller ID spoofing mimicking bank fraud prevention. High urgency attempt to capture second-factor authentication OTP.",
  },
  {
    id: "scen-3",
    title: "Family Emergency Distress Voice Clone",
    caller: "Aarav (Claimed Son / Grandchild)",
    claimedIdentity: "",
    targetPerson: "Elderly Parent",
    tag: "Family Ransom",
    isClone: true,
    expectedDecision: "BLOCK",
    transcript:
      "Mom, dad, it's Aarav! Please listen, don't panic, but I was in a terrible road accident near Pune. The other driver is threatening to arrest me unless I pay ₹65,000 on the spot for damages. A police officer is right here. Please don't call anyone else, just Google Pay the money to this number immediately, I'm terrified!",
    description:
      "Deepfake voice cloned from social media audio clips imitating a family member in distress. High emotional coercion and urgency.",
  },
  {
    id: "scen-4",
    title: "Legitimate Corporate Sync - CFO Quarterly Review",
    caller: "Priya Sharma (CFO)",
    claimedIdentity: "spk-2",
    targetPerson: "Finance Team",
    tag: "Legitimate",
    isClone: false,
    expectedDecision: "ALLOW",
    transcript:
      "Hi team, good morning. Just checking in ahead of tomorrow's quarterly audit. Please ensure the vendor reconciliations are uploaded to SharePoint by 3 PM so we can review them before Friday's finance committee meeting. Thanks!",
    description:
      "Authentic human speech exhibiting natural acoustic dispersion, zero synthetic artifacts, and verified matching against enrolled CFO voiceprint.",
  },
];

export const INITIAL_AUDIT_LOGS: PipelineAnalysisReport[] = [
  {
    id: "log-901",
    timestamp: "2026-09-06T02:14:22.000Z",
    callerName: "Vikram Singhania (Claimed CEO)",
    audioUrl: "https://storage.supabase.voicesentry.co/v1/object/public/voicesentry-audio/recordings/ceo-scam-call-01.wav",
    storageProvider: "supabase",
    fileSize: 492040,
    durationSec: 14.2,
    transcript: "Rajesh, this is Vikram. I need you to immediately wire ₹18,50,000 to the escrow account before 5 PM. Do not call my phone, just process it immediately.",
    riskScore: 94,
    decision: "BLOCK",
    recommendedAction: "IMMEDIATE BLOCK: High probability synthetic voice cloning detected. Freeze pending transactions and dispatch incident alert.",
    layers: {
      voiceAuthenticity: {
        aiProbability: 0.93,
        humanProbability: 0.07,
        riskScore: 93,
        model: "ensemble",
        source: "zerotrue-api-live",
        zeroTrueId: "zt-scan-8819a-901",
      },
      speakerVerification: {
        profileName: "Vikram Singhania (CEO)",
        role: "Chief Executive Officer (CEO)",
        matchConfidence: 0.28,
        divergenceRisk: 88,
        status: "CRITICAL_DIVERGENCE",
      },
      conversationAnalysis: {
        threatScore: 95,
        source: "gemini-3.6-flash",
        detectedSignals: [
          {
            category: "URGENT_FINANCIAL",
            severity: "HIGH",
            description: "High-value fund wire transfer extraction instruction",
          },
          {
            category: "SECRECY_COERCION",
            severity: "HIGH",
            description: "Explicit demand to avoid phone callback or office alert",
          },
        ],
        explanation: "Critical risk: Voice synthetic probability 93% combined with biometric vector mismatch and extreme financial coercion.",
      },
    },
  },
  {
    id: "log-902",
    timestamp: "2026-09-06T01:45:10.000Z",
    callerName: "Priya Sharma (CFO)",
    audioUrl: "https://storage.supabase.voicesentry.co/v1/object/public/voicesentry-audio/recordings/cfo-quarterly-sync.wav",
    storageProvider: "supabase",
    fileSize: 310890,
    durationSec: 9.8,
    transcript: "Hi team, good morning. Just checking in ahead of tomorrow's quarterly audit. Please ensure the vendor reconciliations are uploaded by 3 PM.",
    riskScore: 9,
    decision: "ALLOW",
    recommendedAction: "Proceed normally. Risk thresholds are within safe baseline parameters.",
    layers: {
      voiceAuthenticity: {
        aiProbability: 0.04,
        humanProbability: 0.96,
        riskScore: 4,
        model: "ensemble",
        source: "zerotrue-api-live",
        zeroTrueId: "zt-scan-8819a-902",
      },
      speakerVerification: {
        profileName: "Priya Sharma (CFO)",
        role: "Chief Financial Officer (CFO)",
        matchConfidence: 0.95,
        divergenceRisk: 5,
        status: "VERIFIED_MATCH",
      },
      conversationAnalysis: {
        threatScore: 10,
        source: "gemini-3.6-flash",
        detectedSignals: [],
        explanation: "Natural acoustic parameters, high biometric confidence match (95%), and standard non-sensitive operational discussion.",
      },
    },
  },
];
