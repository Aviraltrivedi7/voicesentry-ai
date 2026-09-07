# 🛡️ VoiceSentry AI — Voice Cloning Impersonation Attack Detection & Prevention

<div align="center">
  <p><strong>Enterprise-Grade Real-Time Detection & Prevention of Voice Cloning Impersonation Attacks</strong></p>
  <p>Multi-Layer Voice Authenticity • Acoustic Forensics (Jitter/Shimmer/Pitch) • Real-Time Speech Transcription • AI Social Engineering Detection</p>
</div>

---

## 📁 Repository Structure

The project is cleanly decoupled into standalone **Frontend** and **Backend** directories:

```text
voicesentry-ai/
├── frontend/                     # React 19 + Vite + TailwindCSS Single Page Application
│   ├── src/
│   │   ├── components/           # AudioVisualizer, LiveScanner, AuditLogs, SpeakerProfiles, etc.
│   │   ├── services/             # API client with auto-proxy to backend
│   │   ├── utils/                # Web Audio API real-time acoustic feature extraction
│   │   ├── types.ts              # Acoustic metrics, telemetry & scan result contracts
│   │   ├── App.tsx               # Main application layout & state
│   │   └── main.tsx              # React entry point
│   ├── public/                   # Static web assets
│   ├── vite.config.ts            # Vite config with /api reverse proxy to port 5000
│   ├── tsconfig.json             # Frontend TypeScript configuration
│   └── package.json              # Frontend dependencies & scripts
│
├── backend/                      # Node.js + Express + TypeScript Security Gateway
│   ├── server.ts                 # Multi-layer forensic engine, Gemini NLP & Supabase APIs
│   ├── .env.example              # Backend environment variables template
│   ├── tsconfig.json             # Backend TypeScript configuration
│   └── package.json              # Backend dependencies & build scripts
│
├── .env.example                  # Root environment variables template
├── package.json                  # Monorepo orchestration (npm workspaces + concurrent dev)
└── README.md                     # Documentation
```

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (v8 or higher)

### 1. Install Dependencies
Run a single command from the root directory to install all packages across the root, frontend, and backend:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root (or in `backend/`):
```bash
cp .env.example .env
```
Fill in your API keys:
- `GEMINI_API_KEY`: (Optional) For AI conversational social engineering detection.
- `ZEROTRUE_API_KEY`: (Optional) ZeroTrue voice cloning detection engine key.
- `SUPABASE_URL` & `SUPABASE_ANON_KEY`: (Optional) For secure audio recording cloud storage.

### 3. Run Development Servers
Start both the **Backend (Port 5000)** and **Frontend (Port 3000)** simultaneously:
```bash
npm run dev
```

Open your browser at:
👉 **`http://localhost:3000`**

---

## 🛠️ Individual Commands

If you prefer to run or build the frontend and backend separately:

| Command | Action |
|---|---|
| `npm run dev` | Runs both backend and frontend concurrently |
| `npm run dev:frontend` | Runs Vite frontend development server (`http://localhost:3000`) |
| `npm run dev:backend` | Runs Express backend API gateway (`http://localhost:5000`) |
| `npm run build` | Builds both frontend (`frontend/dist`) and backend (`backend/dist`) |
| `npm run build:frontend` | Builds frontend production assets |
| `npm run build:backend` | Bundles backend TypeScript server into standalone CJS bundle |
| `npm run start` | Runs production backend bundle |
| `npm run lint` | Runs TypeScript type checking |

---

## 🔬 Core Forensic & Security Features

1. **Acoustic Biometric Engine (`frontend/src/utils/audioAnalysis.ts`)**:
   - Real-time Web Audio API signal processing for recorded microphone audio and uploaded audio files (WAV, MP3, WebM).
   - Extracts genuine acoustic metrics: **Local Jitter (%)**, **Local Shimmer (%)**, **Spectral Centroid (Hz)**, **Spectral Flatness (Wiener entropy)**, and **Pitch Dynamics (F0 standard deviation)**.
   - Extracts 64 normalized waveform peaks dynamically rendered by `AudioVisualizer.tsx`.

2. **Live Speech Recognition**:
   - Continuous in-browser Web Speech API transcription with real-time word-by-word streaming.

3. **Multi-Layer Defensive Pipeline (`backend/server.ts`)**:
   - **Layer 1: Acoustic Artifact Detection**: Computes deepfake confidence from synthesized acoustic signatures (unnatural pitch monotony, synthetic harmonic stability).
   - **Layer 2: Speaker Biometric Verification**: Compares speaker fundamental frequency and spectral centroid against enrolled authorized voiceprints.
   - **Layer 3: Social Engineering & Intent Analysis**: Analyzes caller transcripts using Google Gemini for urgency markers, wire transfers, credential requests, and coercion.
   - **Layer 4: ZeroTrue AI & Supabase Cloud Storage**: Enterprise integration for deepfake audio inspection and immutable evidence storage.
   - **Layer 5: Automated Preventative Action**: Dispatches immediate core banking transaction freezing and VoIP SIP termination if impersonation attack is detected.

---

## 📦 GitHub Repository

- **Repository**: [https://github.com/Aviraltrivedi7/voicesentry-ai](https://github.com/Aviraltrivedi7/voicesentry-ai)
