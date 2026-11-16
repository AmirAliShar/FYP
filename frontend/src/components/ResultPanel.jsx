import { AlertTriangle, Clock } from "lucide-react";

function pct(v) {
  return `${(Number(v || 0) * 100).toFixed(2)}%`;
}

/**
 * Prediction + probability bars + inference timing diagnostics for one video.
 */
export default function ResultPanel({ result }) {
  if (!result) return null;

  if (result.status === "error") {
    return (
      <div className="alert">
        <AlertTriangle size={18} />
        <span>{result.error || "Processing failed for this video."}</span>
      </div>
    );
  }

  const t = result.timing || {};
  const pre = Number(t.preprocess_ms || 0);
  const fwd = Number(t.forward_ms || 0);
  const tot = Number(t.total_ms || pre + fwd);
  const prePct = tot > 0 ? (pre / tot) * 100 : 0;
  const fwdPct = tot > 0 ? (fwd / tot) * 100 : 0;
  const params = result.params_used || {};
  const meta = result.video_meta || {};

  return (
    <div className="prediction">
      <div className={`prediction-banner ${result.prediction?.toLowerCase()}`}>
        <span>{result.prediction}</span>
        <strong>{pct(result.confidence)}</strong>
      </div>

      <div className="probability-row">
        <span>Real</span>
        <div className="bar"><span style={{ width: pct(result.prob_real) }} /></div>
        <strong>{pct(result.prob_real)}</strong>
      </div>
      <div className="probability-row">
        <span>Fake</span>
        <div className="bar fake"><span style={{ width: pct(result.prob_fake) }} /></div>
        <strong>{pct(result.prob_fake)}</strong>
      </div>

      <div className="metrics-block">
        <div className="metrics-title">
          <Clock size={15} />
          <span>Inference timing</span>
        </div>
        <div className="timing-bar" aria-hidden="true">
          <span className="seg pre" style={{ width: `${prePct}%` }} title={`Preprocessing ${pre.toFixed(0)} ms`} />
          <span className="seg fwd" style={{ width: `${fwdPct}%` }} title={`Forward pass ${fwd.toFixed(0)} ms`} />
        </div>
        <div className="timing-legend">
          <span><i className="dot pre" /> Preprocess</span>
          <span><i className="dot fwd" /> Forward pass</span>
        </div>
        <dl className="metric-grid">
          <div><dt>Total</dt><dd>{tot.toFixed(0)} ms</dd></div>
          <div><dt>Preprocess</dt><dd>{pre.toFixed(0)} ms</dd></div>
          <div><dt>Forward</dt><dd>{fwd.toFixed(0)} ms</dd></div>
          <div><dt>Throughput</dt><dd>{t.throughput_fps != null ? `${Number(t.throughput_fps).toFixed(1)} fps` : "—"}</dd></div>
          <div><dt>Device</dt><dd>{t.device || "—"}</dd></div>
          <div><dt>Embed ‖·‖₂</dt><dd>{result.embedding_norm != null ? Number(result.embedding_norm).toFixed(2) : "—"}</dd></div>
          <div><dt>Video duration</dt><dd>{meta.duration_s != null ? `${Number(meta.duration_s).toFixed(2)} s` : "—"}</dd></div>
          <div><dt>Analyzed duration</dt><dd>{meta.analyzed_duration_s != null ? `${Number(meta.analyzed_duration_s).toFixed(2)} s` : "—"}</dd></div>
          <div><dt>Total frames</dt><dd>{meta.total_frames ?? "—"}</dd></div>
          <div><dt>Analyzed frames</dt><dd>{meta.analyzed_frames ?? "—"}</dd></div>
          <div><dt>Requested frames</dt><dd>{params.requested_frames ?? "—"}</dd></div>
          <div><dt>Detected faces</dt><dd>{params.detected_faces ?? "—"}</dd></div>
          <div><dt>Fallback frames</dt><dd>{params.fallback_frames ?? "—"}</dd></div>
        </dl>
      </div>

      <div className="payload">
        <span>Frames used</span>
        <strong>
          {params.num_frames ?? "—"}
          {params.padded_frames ? ` (+${params.padded_frames} padded)` : ""}
        </strong>
      </div>
    </div>
  );
}
