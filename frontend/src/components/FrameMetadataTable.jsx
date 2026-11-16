/**
 * Responsive per-frame metadata table: index, timestamp, dimensions, crop
 * status (face detection), and MTCNN detection confidence.
 */
export default function FrameMetadataTable({ frames }) {
  const list = frames || [];
  if (!list.length) return <p className="muted">No frame metadata returned.</p>;

  return (
    <div className="table-wrap">
      <table className="meta-table">
        <thead>
          <tr>
            <th>Frame #</th>
            <th>Source</th>
            <th>Timestamp (s)</th>
            <th>Dimensions</th>
            <th>Crop status</th>
            <th>Face conf.</th>
          </tr>
        </thead>
        <tbody>
          {list.map((f) => (
            <tr key={f.index}>
              <td>
                {f.index}
                {f.is_padded ? <span className="tag pad">pad</span> : null}
              </td>
              <td className="mono">{f.source_frame}</td>
              <td className="mono">{f.timestamp_s != null ? f.timestamp_s.toFixed(3) : "—"}</td>
              <td className="mono">{f.width}×{f.height}</td>
              <td>
                <span className={`tag ${f.crop_status === "face" ? "face" : "fallback"}`}>
                  {f.crop_status === "face" ? "Face detected" : "Fallback resize"}
                </span>
              </td>
              <td className="mono">{(Number(f.face_confidence || 0) * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
