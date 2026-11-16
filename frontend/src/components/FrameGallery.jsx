import { useState } from "react";

/**
 * Raw input video shown alongside the processed (cropped) frame sequence that
 * was actually fed to the model.
 */
export default function FrameGallery({ videoUrl, frames, filename }) {
  const [selected, setSelected] = useState(null);
  const list = frames || [];
  return (
    <div className="gallery">
      <div className="gallery-raw">
        <div className="gallery-label">Raw input</div>
        {videoUrl ? (
          <video src={videoUrl} controls muted playsInline />
        ) : (
          <div className="gallery-placeholder">Preview unavailable</div>
        )}
        <div className="gallery-file" title={filename}>{filename}</div>
      </div>

      <div className="gallery-frames">
        <div className="gallery-label">Processed frames ({list.length})</div>
        {list.length ? (
          <div className="thumb-grid">
            {list.map((f) => (
              <figure
                className={`thumb ${f.is_padded ? "padded" : ""} ${f.crop_status === "face" ? "detected" : "fallback"}`}
                key={f.index}
                title={`Frame ${f.index} · ${f.timestamp_s != null ? `${f.timestamp_s.toFixed(2)}s` : "—"} · ${f.crop_status === "face" ? "face detected" : f.inference_replaced ? "fallback detection; nearest face used for model input" : "fallback crop"}`}
              >
                {f.thumb_b64 ? (
                  <button type="button" className="thumb-button" onClick={() => setSelected(f)} aria-label={`View frame ${f.index}`}><img src={f.thumb_b64} alt={`Processed frame ${f.index}`} loading="lazy" /></button>
                ) : (
                  <div className="thumb-empty" />
                )}
                <figcaption>{f.index} · {f.timestamp_s != null ? `${f.timestamp_s.toFixed(1)}s` : "—"} · {f.crop_status === "face" ? `${(Number(f.face_confidence || 0) * 100).toFixed(0)}% face` : f.inference_replaced ? "fallback · nearest face input" : "fallback"}{f.is_padded ? " · padded" : ""}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="muted">No frame thumbnails returned.</p>
        )}
      </div>
      {selected && <div className="frame-lightbox" role="dialog" aria-modal="true" onClick={() => setSelected(null)}><button type="button" onClick={() => setSelected(null)}>Close</button><img src={selected.thumb_b64} alt={`Frame ${selected.index}`} /><p>Frame {selected.index} · {selected.timestamp_s?.toFixed(2) ?? "—"}s · {selected.crop_status}{selected.is_padded ? " · padded" : ""}</p></div>}
    </div>
  );
}
