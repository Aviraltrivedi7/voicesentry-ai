import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Volume2 } from "lucide-react";
import { extractWaveformPeaks } from "../utils/audioAnalysis";

interface AudioVisualizerProps {
  audioUrl?: string;
  audioBlob?: Blob;
  waveformPeaks?: number[];
  isLiveRecording?: boolean;
  mediaStream?: MediaStream | null;
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioUrl,
  audioBlob,
  waveformPeaks,
  isLiveRecording = false,
  mediaStream = null,
  height = 90,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [decodedPeaks, setDecodedPeaks] = useState<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);

  // Object URL cleanup
  const [activeSrc, setActiveSrc] = useState<string>("");

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setActiveSrc(url);
      return () => URL.revokeObjectURL(url);
    } else if (audioUrl) {
      setActiveSrc(audioUrl);
    } else {
      setActiveSrc("");
    }
  }, [audioBlob, audioUrl]);

  // Decode audio to extract actual peaks if waveformPeaks wasn't provided directly
  useEffect(() => {
    if (waveformPeaks && waveformPeaks.length > 0) {
      setDecodedPeaks(waveformPeaks);
      return;
    }

    if (!isLiveRecording && (audioBlob || audioUrl)) {
      let isMounted = true;
      const extractPeaks = async () => {
        try {
          let arrayBuffer: ArrayBuffer;
          if (audioBlob) {
            arrayBuffer = await audioBlob.arrayBuffer();
          } else if (audioUrl) {
            if (audioUrl.startsWith("data:")) {
              const base64 = audioUrl.split(",")[1];
              const binary = atob(base64);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              arrayBuffer = bytes.buffer;
            } else {
              const res = await fetch(audioUrl);
              arrayBuffer = await res.arrayBuffer();
            }
          } else {
            return;
          }

          const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtxClass) {
            const ctx = new AudioCtxClass();
            const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
            const peaks = extractWaveformPeaks(decoded.getChannelData(0), 64);
            if (isMounted) {
              setDecodedPeaks(peaks);
              if (decoded.duration > 0) setDuration(decoded.duration);
            }
            await ctx.close().catch(() => {});
          }
        } catch {
          // If decode fails, fallback to subtle baseline peaks
          if (isMounted) {
            const fallback = Array.from({ length: 64 }, (_, i) =>
              parseFloat((0.15 + Math.sin(i * 0.2) * 0.15).toFixed(2))
            );
            setDecodedPeaks(fallback);
          }
        }
      };

      extractPeaks();
      return () => {
        isMounted = false;
      };
    } else {
      setDecodedPeaks([]);
    }
  }, [audioBlob, audioUrl, waveformPeaks, isLiveRecording]);

  // Handle live recording microphone visualizer
  useEffect(() => {
    if (isLiveRecording && mediaStream && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(mediaStream);
      source.connect(analyser);
      sourceNodeRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const renderLive = () => {
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
          grad.addColorStop(0, "rgba(99, 102, 241, 0.3)");
          grad.addColorStop(0.7, "rgba(99, 102, 241, 0.85)");
          grad.addColorStop(1, "rgba(165, 180, 252, 1)");

          ctx.fillStyle = grad;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
          x += barWidth;
        }

        animationFrameRef.current = requestAnimationFrame(renderLive);
      };

      renderLive();

      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        source.disconnect();
        audioCtx.close().catch(() => {});
      };
    }
  }, [isLiveRecording, mediaStream]);

  // Static waveform rendering for pre-recorded or uploaded audio using REAL peaks
  useEffect(() => {
    if (!isLiveRecording && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const drawWaveform = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const bars = 64;
        const barWidth = canvas.width / bars;
        const progressPercent = duration > 0 ? currentTime / duration : 0;

        for (let i = 0; i < bars; i++) {
          // Use decoded peaks if available; otherwise use resting baseline
          const peakValue = decodedPeaks.length === bars ? decodedPeaks[i] : 0.08;
          const barHeight = Math.max(3, peakValue * (canvas.height * 0.85));
          const isPlayed = i / bars <= progressPercent;

          ctx.fillStyle = isPlayed ? "rgba(99, 102, 241, 0.95)" : "rgba(255, 255, 255, 0.15)";
          const y = (canvas.height - barHeight) / 2;
          ctx.beginPath();
          ctx.roundRect(i * barWidth + 1, y, barWidth - 2, barHeight, 2);
          ctx.fill();
        }
      };

      drawWaveform();
    }
  }, [isLiveRecording, currentTime, duration, decodedPeaks]);

  const togglePlay = () => {
    if (!audioRef.current || !activeSrc) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.warn(e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekTime = (clickX / rect.width) * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div id="audio-visualizer-container" className="w-full bg-[#0F0F12] border border-white/10 rounded-2xl p-3.5 shadow-inner">
      {activeSrc && (
        <audio
          ref={audioRef}
          src={activeSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
        />
      )}

      {/* Canvas Spectrum / Waveform */}
      <div
        id="waveform-canvas-box"
        className="relative w-full cursor-pointer overflow-hidden rounded-xl bg-[#050505] border border-white/5"
        onClick={handleSeek}
      >
        <canvas
          ref={canvasRef}
          width={640}
          height={height}
          className="w-full h-full block"
        />
        {isLiveRecording && (
          <div className="absolute top-2.5 left-2.5 flex items-center space-x-2 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[10px] font-mono uppercase font-bold tracking-wider animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            <span>Live Microphone Stream</span>
          </div>
        )}
      </div>

      {/* Media Playback Controls */}
      {!isLiveRecording && activeSrc && (
        <div className="flex items-center justify-between pt-3 text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={togglePlay}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer border border-white/10 shadow-sm"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  setCurrentTime(0);
                }
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Restart"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] text-slate-300 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-indigo-400 text-[11px]">
            <Volume2 className="w-3.5 h-3.5" />
            <span>48 kHz</span>
          </div>
        </div>
      )}
    </div>
  );
};
