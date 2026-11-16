/**
 * Schematic of Windowed Multi-head Self-Attention (W-MSA) vs. Shifted Window
 * (SW-MSA). Left: patches partitioned into fixed non-overlapping windows —
 * attention is computed only inside each window (linear cost). Right: the next
 * layer shifts the window partition so tokens that sat on a boundary now share
 * a window, propagating information across windows (and, for video, across the
 * temporal axis too). Shifted windows that cross the border are cyclically
 * wrapped and masked so unrelated regions don't attend to each other.
 */
const CELL = 34;
const N = 4;
const GAP = 3;
const COLORS = ["#0f766e", "#2563eb", "#d97706", "#7c3aed"];

function Cells({ ox, oy }) {
  const out = [];
  for (let r = 0; r < N; r += 1) {
    for (let c = 0; c < N; c += 1) {
      out.push(
        <rect
          key={`c${r}-${c}`}
          x={ox + c * CELL}
          y={oy + r * CELL}
          width={CELL - GAP}
          height={CELL - GAP}
          rx={3}
          fill="#eef2f7"
          stroke="#cbd5e1"
        />,
      );
    }
  }
  return out;
}

function Windows({ ox, oy, shift, clip }) {
  const out = [];
  for (let wr = 0; wr < 2; wr += 1) {
    for (let wc = 0; wc < 2; wc += 1) {
      const r0 = wr * 2 + shift;
      const c0 = wc * 2 + shift;
      out.push(
        <rect
          key={`w${wr}-${wc}`}
          x={ox + c0 * CELL}
          y={oy + r0 * CELL}
          width={2 * CELL - GAP}
          height={2 * CELL - GAP}
          rx={5}
          fill={COLORS[wr * 2 + wc]}
          opacity={0.85}
        />,
      );
    }
  }
  return <g clipPath={clip ? "url(#swin-grid-clip)" : undefined}>{out}</g>;
}

export default function ShiftedWindowDiagram() {
  const ox1 = 34;
  const oy = 52;
  const ox2 = 322;
  const gridPx = N * CELL - GAP;

  return (
    <figure className="diagram">
      <svg viewBox="0 0 520 250" role="img" aria-label="Windowed versus shifted-window self attention">
        <defs>
          <clipPath id="swin-grid-clip">
            <rect x={ox2} y={oy} width={gridPx} height={gridPx} rx={4} />
          </clipPath>
          <marker id="swin-arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill="#475569" />
          </marker>
        </defs>

        <text x={ox1} y={30} className="dg-title">Layer L · W-MSA</text>
        <Cells ox={ox1} oy={oy} />
        <Windows ox={ox1} oy={oy} shift={0} />

        <text x={ox2} y={30} className="dg-title">Layer L+1 · SW-MSA</text>
        <Cells ox={ox2} oy={oy} />
        <Windows ox={ox2} oy={oy} shift={1} clip />

        <line
          x1={ox1 + gridPx + 14}
          y1={oy + gridPx / 2}
          x2={ox2 - 16}
          y2={oy + gridPx / 2}
          stroke="#475569"
          strokeWidth={2}
          markerEnd="url(#swin-arrow)"
        />
        <text x={(ox1 + gridPx + ox2) / 2} y={oy + gridPx / 2 - 10} textAnchor="middle" className="dg-small">
          shift (1,1)
        </text>

        <text x={ox1} y={oy + gridPx + 30} className="dg-caption">
          Attention confined to each window → cost is linear in tokens.
        </text>
        <text x={ox2} y={oy + gridPx + 52} className="dg-caption">
          Shifted partition lets neighbouring windows exchange information.
        </text>
      </svg>
    </figure>
  );
}
