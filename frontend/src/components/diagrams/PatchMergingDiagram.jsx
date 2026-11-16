/**
 * Hierarchical feature extraction. A 3D patch-embedding turns the cropped clip
 * into tokens, then four Swin stages progressively merge patches: each merge
 * halves spatial resolution and doubles the channel count, building a multiscale
 * pyramid from fine texture to coarse semantics. The final map is globally
 * pooled into one embedding and passed to the Linear classifier head.
 */
const BASE_Y = 196;

const STAGES = [
  { label: "Stage 1", size: 104, ch: "C", color: "#99f6e4" },
  { label: "Stage 2", size: 78, ch: "2C", color: "#5eead4" },
  { label: "Stage 3", size: 54, ch: "4C", color: "#2dd4bf" },
  { label: "Stage 4", size: 34, ch: "8C", color: "#14b8a6" },
];

const START_X = 196;
const GAP_X = 112;

export default function PatchMergingDiagram() {
  const stageX = STAGES.map((_, i) => START_X + i * GAP_X);

  return (
    <figure className="diagram">
      <svg viewBox="0 0 900 260" role="img" aria-label="Hierarchical patch merging across four Swin stages">
        <defs>
          <marker id="pm-arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill="#475569" />
          </marker>
        </defs>

        {/* Input clip (stacked frames) */}
        <g>
          <rect x={26} y={BASE_Y - 74} width={54} height={44} rx={4} fill="#e2e8f0" stroke="#94a3b8" />
          <rect x={20} y={BASE_Y - 80} width={54} height={44} rx={4} fill="#f1f5f9" stroke="#94a3b8" />
          <rect x={14} y={BASE_Y - 86} width={54} height={44} rx={4} fill="#ffffff" stroke="#64748b" />
          <text x={41} y={BASE_Y - 58} textAnchor="middle" className="dg-tiny">clip</text>
          <text x={41} y={BASE_Y + 20} textAnchor="middle" className="dg-caption">T×224×224×3</text>
        </g>

        {/* Patch embed */}
        <rect x={104} y={BASE_Y - 78} width={70} height={56} rx={6} fill="#164e63" />
        <text x={139} y={BASE_Y - 54} textAnchor="middle" className="dg-light">3D Patch</text>
        <text x={139} y={BASE_Y - 38} textAnchor="middle" className="dg-light">Embed</text>
        <line x1={70} y1={BASE_Y - 50} x2={100} y2={BASE_Y - 50} stroke="#475569" strokeWidth={2} markerEnd="url(#pm-arrow)" />
        <line x1={176} y1={BASE_Y - 50} x2={START_X - 6} y2={BASE_Y - 52} stroke="#475569" strokeWidth={2} markerEnd="url(#pm-arrow)" />

        {/* Stage maps */}
        {STAGES.map((s, i) => {
          const x = stageX[i];
          const y = BASE_Y - s.size;
          return (
            <g key={s.label}>
              <rect x={x} y={y} width={s.size} height={s.size} rx={5} fill={s.color} stroke="#0f766e" />
              <text x={x + s.size / 2} y={y + s.size / 2 + 4} textAnchor="middle" className="dg-tiny-dark">{s.ch}</text>
              <text x={x + s.size / 2} y={BASE_Y + 20} textAnchor="middle" className="dg-caption">{s.label}</text>
            </g>
          );
        })}

        {/* Merge arrows between stages */}
        {STAGES.slice(0, -1).map((s, i) => {
          const x1 = stageX[i] + s.size;
          const y1 = BASE_Y - s.size / 2;
          const x2 = stageX[i + 1];
          const y2 = BASE_Y - STAGES[i + 1].size / 2;
          return (
            <g key={`m${i}`}>
              <line x1={x1 + 4} y1={y1} x2={x2 - 6} y2={y2} stroke="#475569" strokeWidth={2} markerEnd="url(#pm-arrow)" />
              <text x={(x1 + x2) / 2} y={Math.min(y1, y2) - 12} textAnchor="middle" className="dg-tiny">merge</text>
            </g>
          );
        })}

        {/* Pool → head → outputs */}
        {(() => {
          const lastX = stageX[3] + STAGES[3].size;
          const poolX = 660;
          const headX = 768;
          return (
            <g>
              <line x1={lastX + 4} y1={BASE_Y - STAGES[3].size / 2} x2={poolX - 6} y2={BASE_Y - 50} stroke="#475569" strokeWidth={2} markerEnd="url(#pm-arrow)" />
              <rect x={poolX} y={BASE_Y - 78} width={80} height={56} rx={6} fill="#0f766e" />
              <text x={poolX + 40} y={BASE_Y - 54} textAnchor="middle" className="dg-light">Global</text>
              <text x={poolX + 40} y={BASE_Y - 38} textAnchor="middle" className="dg-light">Pool</text>

              <line x1={poolX + 80} y1={BASE_Y - 50} x2={headX - 6} y2={BASE_Y - 50} stroke="#475569" strokeWidth={2} markerEnd="url(#pm-arrow)" />
              <rect x={headX} y={BASE_Y - 74} width={70} height={48} rx={6} fill="#164e63" />
              <text x={headX + 35} y={BASE_Y - 46} textAnchor="middle" className="dg-light">Linear</text>

              <line x1={headX + 70} y1={BASE_Y - 50} x2={headX + 96} y2={BASE_Y - 66} stroke="#16a34a" strokeWidth={2} markerEnd="url(#pm-arrow)" />
              <line x1={headX + 70} y1={BASE_Y - 50} x2={headX + 96} y2={BASE_Y - 34} stroke="#e11d48" strokeWidth={2} markerEnd="url(#pm-arrow)" />
              <rect x={headX + 98} y={BASE_Y - 80} width={40} height={22} rx={11} fill="#dcfce7" />
              <text x={headX + 118} y={BASE_Y - 64} textAnchor="middle" className="dg-tiny-dark">Real</text>
              <rect x={headX + 98} y={BASE_Y - 46} width={40} height={22} rx={11} fill="#ffe4e6" />
              <text x={headX + 118} y={BASE_Y - 30} textAnchor="middle" className="dg-tiny-dark">Fake</text>
            </g>
          );
        })()}

        <text x={START_X + 150} y={238} textAnchor="middle" className="dg-small">
          Each patch merge: ÷2 spatial resolution, ×2 channels → multiscale feature pyramid
        </text>
      </svg>
    </figure>
  );
}
