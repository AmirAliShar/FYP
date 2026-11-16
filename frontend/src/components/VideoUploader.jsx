import { UploadCloud, X, AlertTriangle, FileVideo } from "lucide-react";

function formatBytes(bytes) {
  return `${(Number(bytes || 0) / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Single video picker. Validation (count/size/format) happens in DetectPage;
 * this component renders the drop target, accepted-file chips, and warnings.
 */
export default function VideoUploader({ items, warnings, onFilesSelected, onRemoveFile, onClear, limits, disabled }) {
  const maxFiles = limits?.max_files ?? 1;
  const maxMb = limits?.max_file_mb ?? 100;

  return (
    <section className="upload-zone">
      <input
        id="video-upload"
        type="file"
        accept="video/mp4,video/avi,video/quicktime,video/x-matroska,.mp4,.avi,.mov,.mkv"
        onChange={(e) => {
          onFilesSelected(Array.from(e.target.files || []));
          e.target.value = "";
        }}
        disabled={disabled}
      />
      <label htmlFor="video-upload" className="drop-target">
        <UploadCloud size={34} />
        <strong>{items.length ? "1 video selected · choose another to replace" : "Select a video for analysis"}</strong>
        <span>MP4, AVI, MOV, MKV · up to {maxMb}MB · 5 minutes</span>
      </label>

      {warnings.length > 0 && (
        <div className="warn-stack">
          {warnings.map((w, i) => (
            <div className="alert" key={i}>
              <AlertTriangle size={16} />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="file-list">
          <ul className="file-chips">
            {items.map((it, i) => (
              <li className="file-chip" key={`${it.name}-${i}`}>
                <FileVideo size={16} />
                <span className="chip-name" title={it.name}>{it.name}</span>
                <span className="chip-size">{formatBytes(it.size)}</span>
                {it.duration != null && <span className="chip-size">{it.duration.toFixed(1)} s</span>}
                <button type="button" className="chip-remove" onClick={() => onRemoveFile(i)} aria-label={`Remove ${it.name}`}>
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="link-button" onClick={onClear}>Clear all</button>
        </div>
      )}
      <p className="muted">Upload a video up to 5 minutes long. The AI model analyzes up to the first minute.</p>
    </section>
  );
}
