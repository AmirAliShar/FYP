import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Gauge,
  Layers,
  Loader2,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";

import FrameControl from "../components/FrameControl.jsx";
import VideoUploader from "../components/VideoUploader.jsx";
import ResultPanel from "../components/ResultPanel.jsx";
import FrameGallery from "../components/FrameGallery.jsx";
import FrameMetadataTable from "../components/FrameMetadataTable.jsx";
import { predictVideos, FALLBACK_LIMITS } from "../api.js";

const ALLOWED_EXT = ["mp4", "avi", "mov", "mkv"];
const extOf = (name) => (name.split(".").pop() || "").toLowerCase();

function ResultCard({ result, videoUrl, expanded, onToggle }) {
  const ok = result.status === "ok";
  return (
    <article className={`result-card ${result.status}`}>
      <div className="result-card-head">
        <div className="result-card-title">
          <ScanSearch size={16} />
          <span className="result-name" title={result.filename}>{result.filename}</span>
          {ok ? (
            <span className={`verdict ${result.prediction?.toLowerCase()}`}>{result.prediction}</span>
          ) : (
            <span className="verdict error">Error</span>
          )}
        </div>
        {ok && (
          <button type="button" className="toggle-frames" onClick={onToggle} aria-expanded={expanded}>
            <span>{expanded ? "Hide frames" : "Frames & metadata"}</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      <ResultPanel result={result} />

      {ok && expanded && (
        <div className="result-detail">
          <FrameGallery videoUrl={videoUrl} frames={result.frames} filename={result.filename} />
          <FrameMetadataTable frames={result.frames} />
        </div>
      )}
    </article>
  );
}

export default function DetectPage({
  backendUrl,
  setBackendUrl,
  health,
  healthError,
  config,
  limits,
  pipelineReady,
}) {
  const [items, setItems] = useState([]);           // {file, url, name, size}
  const [warnings, setWarnings] = useState([]);
  const [numFrames, setNumFrames] = useState(limits?.default_frames ?? FALLBACK_LIMITS.default_frames);
  const [imgSize] = useState(224);
  const [facePadding] = useState(0);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState([]);

  const framesAutoSet = useRef(false);
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  // Adopt the server's default frame count once, the first time config arrives.
  useEffect(() => {
    if (!framesAutoSet.current && config?.default_frames) {
      setNumFrames(config.default_frames);
      framesAutoSet.current = true;
    }
  }, [config]);

  // Revoke any outstanding object URLs when the page unmounts.
  useEffect(() => () => itemsRef.current.forEach((it) => URL.revokeObjectURL(it.url)), []);

  const maxFiles = limits?.max_files ?? FALLBACK_LIMITS.max_files;
  const maxMb = limits?.max_file_mb ?? FALLBACK_LIMITS.max_file_mb;
  const maxDuration = limits?.max_video_seconds ?? 300;

  function handleFilesSelected(incoming) {
    const maxBytes = maxMb * 1024 * 1024;
    const warns = [];
    const valid = [];

    for (const f of incoming) {
      const ext = extOf(f.name);
      if (!ALLOWED_EXT.includes(ext)) {
        warns.push(`"${f.name}" skipped — unsupported format .${ext || "?"}`);
        continue;
      }
      if (!f.size) {
        warns.push(`"${f.name}" skipped — file is empty`);
        continue;
      }
      if (f.size > maxBytes) {
        warns.push(`"${f.name}" skipped — ${(f.size / 1048576).toFixed(1)}MB exceeds the ${maxMb}MB limit`);
        continue;
      }
      if (f.type && !["video/mp4", "video/x-msvideo", "video/avi", "video/quicktime", "video/x-matroska", "application/octet-stream"].includes(f.type)) {
        warns.push(`"${f.name}" skipped — unsupported video MIME type`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length) {
      const f = valid[valid.length - 1];
      if (valid.length > 1) warns.push("Only one video is allowed; using the last selected file.");
      itemsRef.current.forEach((it) => URL.revokeObjectURL(it.url));
      setItems([]);
      setResponse(null);
      setExpanded([]);
      setError("");
      const url = URL.createObjectURL(f);
      const media = document.createElement("video");
      media.preload = "metadata";
      media.onloadedmetadata = () => {
        const duration = Number.isFinite(media.duration) ? media.duration : null;
        if (duration != null && duration > maxDuration) {
          warns.push(`"${f.name}" skipped — video exceeds the 5 minute limit`);
          setWarnings([...warns]);
          URL.revokeObjectURL(url);
          return;
        }
        itemsRef.current.forEach((it) => URL.revokeObjectURL(it.url));
        setItems([{ file: f, url, name: f.name, size: f.size, duration }]);
        setWarnings(warns);
        setResponse(null);
        setError("");
      };
      media.onerror = () => { URL.revokeObjectURL(url); setWarnings([...warns, `"${f.name}" is not a readable video.`]); };
      media.src = url;
    }
  }

  function removeFile(i) {
    setItems((prev) => {
      const next = prev.slice();
      const [removed] = next.splice(i, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return next;
    });
  }

  function clearFiles() {
    items.forEach((it) => URL.revokeObjectURL(it.url));
    setItems([]);
    setWarnings([]);
    setResponse(null);
    setError("");
  }

  async function runInference() {
    if (!items.length) { setError("Select at least one video first."); return; }
    if (!pipelineReady) { setError("Backend pipeline is not ready."); return; }

    setIsLoading(true);
    setError("");
    setResponse(null);
    setExpanded([]);
    try {
      const payload = await predictVideos(backendUrl, items.map((it) => it.file), {
        numFrames,
        imgSize,
        facePadding,
        returnFrames: true,
      });
      setResponse(payload);
      setExpanded(payload?.results?.length ? [0] : []);
    } catch (e) {
      setError(e?.message || "Inference failed.");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleCard(i) {
    setExpanded((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  const urlFor = (filename) => items.find((it) => it.name === filename)?.url || "";
  const summary = response?.batch_summary;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <section className="panel">
          <div className="panel-title"><Activity size={18} /><span>Backend</span></div>
          <label className="field-label" htmlFor="backend-url">FastAPI endpoint</label>
          <input
            id="backend-url"
            className="text-input"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value.trim())}
          />
          <div className={`status ${pipelineReady ? "ready" : "error"}`}>
            {pipelineReady ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{pipelineReady ? "Pipeline ready" : healthError || "Pipeline unavailable"}</span>
          </div>
        </section>

        <section className="panel">
          <div className="panel-title"><Gauge size={18} /><span>Frame Sampling</span></div>
          <FrameControl
            value={numFrames}
            onChange={setNumFrames}
            min={limits?.min_frames ?? 8}
            max={limits?.max_frames ?? 64}
            defaultValue={limits?.default_frames ?? 24}
          />
          <p className="muted">
            Swin3D uses temporal sampling; the trained checkpoint uses 32 nominal frames.
          </p>
        </section>

        <section className="panel defaults">
          <div className="panel-title"><Layers size={18} /><span>Model &amp; Limits</span></div>
          <dl>
            <div><dt>Model</dt><dd>{config?.model_variant === "swin3d_t" ? "Swin3D-T" : "Swin3D"}{health?.device ? ` · ${health.device}` : ""}</dd></div>
            <div><dt>Trained frames</dt><dd>{limits?.trained_nominal_frames ?? "—"}</dd></div>
            <div><dt>Max videos</dt><dd>{maxFiles}</dd></div>
            <div><dt>Max size</dt><dd>{maxMb} MB</dd></div>
            <div><dt>Max duration</dt><dd>{Math.round(maxDuration / 60)} min</dd></div>
            <div><dt>Analysis window</dt><dd>First {limits?.default_analysis_seconds ?? 60}s</dd></div>
            <div><dt>Image size</dt><dd>{config?.image_size ?? imgSize} × {config?.image_size ?? imgSize}</dd></div>
          </dl>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Single-stream · Video Swin Transformer</p>
            <h2>Video Integrity Analysis</h2>
          </div>
          <button
            className="primary-action"
            type="button"
            onClick={runInference}
            disabled={isLoading || !items.length || !pipelineReady}
          >
            {isLoading ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}
            <span>{isLoading ? `Analyzing ${items.length}…` : "Analyze"}</span>
          </button>
        </header>

        <div className="workspace-body">
          <VideoUploader
            items={items}
            warnings={warnings}
            onFilesSelected={handleFilesSelected}
            onRemoveFile={removeFile}
            onClear={clearFiles}
            limits={limits}
            disabled={isLoading}
          />

          {error && (
            <div className="alert"><AlertTriangle size={18} /><span>{error}</span></div>
          )}

          {isLoading && (
            <div className="loading-state">
              <Loader2 className="spin" size={22} />
              <span>Running inference on {items.length} video{items.length > 1 ? "s" : ""}…</span>
            </div>
          )}

          {!isLoading && !response && !error && (
            <div className="empty-state">
              <ShieldCheck size={34} />
              <p>Upload one video and run analysis to view predictions, processed frames, and timing.</p>
            </div>
          )}

          {response && (
            <div className="results">
              {summary && (
                <div className="batch-summary">
                  <span><strong>{summary.succeeded}</strong> / {summary.total} succeeded</span>
                  {summary.failed > 0 && <span className="fail">{summary.failed} failed</span>}
                  <span className="muted">
                    forward {Number(summary.combined_forward_ms || 0).toFixed(0)} ms ·
                    total {Number(summary.combined_total_ms || 0).toFixed(0)} ms
                  </span>
                </div>
              )}
              <div className="results-list">
                {response.results.map((r, i) => (
                  <ResultCard
                    key={`${r.filename}-${i}`}
                    result={r}
                    videoUrl={urlFor(r.filename)}
                    expanded={expanded.includes(i)}
                    onToggle={() => toggleCard(i)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
