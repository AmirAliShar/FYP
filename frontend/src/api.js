import { useEffect, useState } from "react";

export const DEFAULT_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Used when GET /config is unavailable so the UI still has sane bounds.
export const FALLBACK_LIMITS = {
  default_frames: 32,
  min_frames: 8,
  max_frames: 64,
  max_files: 1,
  max_file_mb: 100,
  max_video_seconds: 300,
  default_analysis_seconds: 60,
  min_analysis_seconds: 5,
  max_analysis_seconds: 60,
};

function normalizeBase(base) {
  return (base || DEFAULT_API_URL).replace(/\/+$/, "");
}

export async function fetchHealth(base) {
  const res = await fetch(`${normalizeBase(base)}/`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchConfig(base) {
  const res = await fetch(`${normalizeBase(base)}/config`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * POST a batch of videos to /predict. `files` is an array of File objects;
 * each is appended under the same "files" key so FastAPI receives a list.
 */
export async function predictVideos(base, files, params) {
  const fd = new FormData();
  files.forEach((file) => fd.append("files", file));
  fd.append("num_frames", String(params.numFrames));
  fd.append("img_size", String(params.imgSize));
  fd.append("face_padding", String(params.facePadding));
  fd.append("return_frames", params.returnFrames ? "true" : "false");

  const res = await fetch(`${normalizeBase(base)}/predict`, { method: "POST", body: fd });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      typeof payload.detail === "string"
        ? payload.detail
        : `Inference failed with HTTP ${res.status}`;
    throw new Error(detail);
  }
  return payload;
}

/**
 * Polls backend health every 7s and pulls /config once the pipeline is ready.
 * Returns merged limits (server values over fallbacks) plus readiness flags.
 */
export function useBackend(backendUrl) {
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState("");
  const [config, setConfig] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const data = await fetchHealth(backendUrl);
        if (cancelled) return;
        setHealth(data);
        setHealthError("");
        if (data?.pipeline_loaded) {
          try {
            const cfg = await fetchConfig(backendUrl);
            if (!cancelled) setConfig(cfg);
          } catch {
            /* keep any previously fetched config */
          }
        }
      } catch (err) {
        if (cancelled) return;
        setHealth(null);
        setHealthError(err?.message || "Backend unreachable");
      }
    }

    poll();
    const id = window.setInterval(poll, 7000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [backendUrl]);

  const limits = { ...FALLBACK_LIMITS, ...(config || {}) };
  return {
    health,
    healthError,
    config,
    limits,
    pipelineReady: Boolean(health?.pipeline_loaded),
  };
}
