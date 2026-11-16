import { useState } from "react";
import { Layers, Network, Boxes, Zap, ScanSearch, Cpu } from "lucide-react";

import ShiftedWindowDiagram from "../components/diagrams/ShiftedWindowDiagram.jsx";
import PatchMergingDiagram from "../components/diagrams/PatchMergingDiagram.jsx";
import PipelineFlowchart from "../components/diagrams/PipelineFlowchart.jsx";

const MODELS = [
  { key: "swin", name: "3D Swin (ours)" },
  { key: "vit", name: "Standard ViT" },
  { key: "cnn", name: "CNN / 3D-CNN" },
];

const COMPARISON = [
  {
    criterion: "Patch merging",
    swin: "Yes — 4 hierarchical stages (÷2 resolution, ×2 channels)",
    vit: "No — one fixed patch size, flat token sequence",
    cnn: "Downsampling via pooling / strided convolutions",
  },
  {
    criterion: "Attention complexity",
    swin: <>O(N) — linear in #tokens (windowed)</>,
    vit: <>O(N<sup>2</sup>) — global, all-pairs</>,
    cnn: <>O(k·N) — fixed kernel, strictly local</>,
  },
  {
    criterion: "3D spatio-temporal modeling",
    swin: "Native 3D windows across (T, H, W) + temporal shifts",
    vit: "2D frames; video needs extra temporal tokens/attention",
    cnn: "3D convolutions work but are compute-heavy",
  },
  {
    criterion: "Receptive field",
    swin: "Local → global via shifted windows + depth",
    vit: "Global from the very first layer",
    cnn: "Grows slowly with depth / dilation",
  },
  {
    criterion: "Positional encoding",
    swin: "Relative positional bias, per window",
    vit: "Absolute / learned global embeddings",
    cnn: "Implicit (convolution weight sharing)",
  },
  {
    criterion: "Fit for deepfake video",
    swin: "Fine spatial artifacts + temporal flicker, efficient on long clips",
    vit: "Strong global semantics, but data- and compute-hungry",
    cnn: "Good local texture cues, weaker long-range temporal context",
  },
];

const FOCUS = {
  swin: "Why this app uses it: linear-cost windowed attention scales to many frames, the hierarchical pyramid captures both fine blending artifacts and coarse structure, and 3D windows model motion and temporal flicker — the key deepfake tells — inside a single backbone.",
  vit: "A Vision Transformer attends globally from layer one (quadratic in token count). That is powerful on single images but expensive for high-resolution video and data-hungry, and it has no native hierarchical or 3D structure.",
  cnn: "Convolutional nets are efficient and excellent at local texture, but their receptive field expands slowly and capturing long-range temporal dynamics requires deep 3D stacks that cost a lot of compute.",
};

const HERO_STATS = [
  { icon: Zap, label: "O(N) attention", note: "linear in tokens" },
  { icon: Layers, label: "4 stages", note: "hierarchical pyramid" },
  { icon: Boxes, label: "3D windows", note: "over (T, H, W)" },
  { icon: ScanSearch, label: "32 frames", note: "trained nominal sample" },
];

export default function AboutSwinPage() {
  const [selected, setSelected] = useState("swin");

  return (
    <div className="about">
      <section className="about-hero">
        <p className="eyebrow">Model deep-dive</p>
        <h2>How the 3D Swin Transformer detects deepfakes</h2>
        <p className="lede">
          Swin adapts the Transformer to vision by computing attention inside small local windows and
          then <em>shifting</em> those windows between layers. Extended to video (3D Swin), the windows
          span time as well as space, so a single backbone learns both spatial manipulation artifacts
          and temporal inconsistencies.
        </p>
        <div className="hero-stats">
          {HERO_STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div className="hero-stat" key={s.label}>
                <Icon size={18} />
                <div>
                  <strong>{s.label}</strong>
                  <span>{s.note}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="about-section">
        <div className="section-head"><ScanSearch size={20} /><h3>Complete detection pipeline</h3></div>
        <div className="pipeline-explainer">
          <article><b>1 · Upload</b><p>Choose one MP4, AVI, MOV, or MKV up to 100 MB and 5 minutes. The backend analyzes up to the first 60 seconds automatically.</p></article>
          <article><b>2 · Sample frames</b><p>Frames are sampled uniformly from the beginning of the video, limited to its first minute. Example: a 120-second video uses 32 frames from its first 60 seconds.</p></article>
          <article><b>3 · Detect faces</b><p>MTCNN proposes face boxes and confidence scores. Each box is clipped, squared and cropped from the original resolution. Failed detections use the nearest detected crop for model input when available; the diagnostic remains marked fallback. If no face is found, the current full-frame fallback is retained.</p></article>
          <article><b>4 · Prepare crops</b><p>Crops are resized to 224 × 224 and transformed with the Swin checkpoint normalization. Short clips repeat the last frame with deterministic padding noise.</p></article>
          <article><b>5 · Swin3D-T</b><p>The video transformer maps space and time together. Local 3D attention windows limit computation; shifted windows let information cross window boundaries between layers.</p></article>
          <article><b>6 · LoRA adaptation</b><p>Low-rank adapters specialize pretrained Swin weights for this task while most backbone weights stay frozen; the configured last stage is also fine-tuned.</p></article>
          <article><b>7 · Classification</b><p>A linear head converts the pooled clip representation to Real and Fake scores. For example, 0.82 Fake and 0.18 Real yields a Fake prediction with 82% confidence.</p></article>
          <article><b>8 · Results</b><p>The API returns probabilities, confidence, timing, embedding norm and per-frame diagnostics. These scores describe this model's output; they do not guarantee detection of every manipulation.</p></article>
        </div>
      </section>

      <section className="about-section">
        <div className="section-head">
          <Network size={20} />
          <h3>Shifted window attention</h3>
        </div>
        <p>
          Self-attention over every token in an image (or video) is quadratic and quickly infeasible.
          Swin partitions tokens into non-overlapping <strong>windows</strong> and computes attention
          only inside each one — cost becomes <strong>linear</strong> in the number of tokens. Because
          fixed windows would isolate regions, the next layer <strong>shifts</strong> the partition by a
          few tokens so that neighbours which were split across a boundary now share a window. For video
          the windows are 3D cubes over (T, H, W), so the shift also connects adjacent
          <strong> time steps</strong>, letting the network reason about motion and flicker.
        </p>
        <ShiftedWindowDiagram />
        <p className="muted">
          Shifted windows that wrap past the border are handled with a cyclic shift plus an attention
          mask, so unrelated regions never attend to one another.
        </p>
      </section>

      <section className="about-section">
        <div className="section-head">
          <Layers size={20} />
          <h3>Hierarchical feature maps &amp; patch merging</h3>
        </div>
        <p>
          Unlike a flat ViT, Swin builds a <strong>feature pyramid</strong>. After a 3D patch-embedding,
          four stages repeatedly apply <strong>patch merging</strong>: neighbouring tokens are concatenated
          and projected, halving spatial resolution while doubling the channel count. Early stages keep
          fine detail (compression edges, blending seams); deeper stages encode coarse semantics. The
          final map is globally pooled into one embedding for the classifier head.
        </p>
        <PatchMergingDiagram />
      </section>

      <section className="about-section">
        <div className="section-head">
          <ScanSearch size={20} />
          <h3>End-to-end pipeline in this app</h3>
        </div>
        <p>
          From an uploaded clip to a Real/Fake verdict — the exact stages the backend runs, with the
          dynamic frame count you choose on the Detect page.
        </p>
        <PipelineFlowchart />
      </section>

      <section className="about-section">
        <div className="section-head">
          <Cpu size={20} />
          <h3>Swin vs. ViT vs. CNN</h3>
        </div>
        <p>Select a model to highlight its column.</p>
        <div className="compare">
          <table className="compare-table">
            <thead>
              <tr>
                <th className="crit-col">Criterion</th>
                {MODELS.map((m) => (
                  <th key={m.key}>
                    <button
                      type="button"
                      className={`model-toggle ${selected === m.key ? "active" : ""}`}
                      onClick={() => setSelected(m.key)}
                      aria-pressed={selected === m.key}
                    >
                      {m.name}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.criterion}>
                  <th scope="row" className="crit-col">{row.criterion}</th>
                  {MODELS.map((m) => (
                    <td key={m.key} className={selected === m.key ? "cell active" : "cell"}>
                      {row[m.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="focus-note">
            <strong>{MODELS.find((m) => m.key === selected)?.name}:</strong> {FOCUS[selected]}
          </p>
        </div>
      </section>
    </div>
  );
}
