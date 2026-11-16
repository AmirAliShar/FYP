import { Film, Scissors, Crop, Layers, BrainCircuit, Gauge, ScanSearch } from "lucide-react";

/**
 * End-to-end detection pipeline (rendered as a responsive CSS flow rather than
 * SVG so it reflows cleanly on narrow screens).
 */
const STEPS = [
  { icon: Film, title: "Input video", sub: "mp4 · avi · mov · mkv" },
  { icon: Scissors, title: "Sample N frames", sub: "uniform, 8–64 (default 24)" },
  { icon: Crop, title: "MTCNN face crop", sub: "square 224×224" },
  { icon: Layers, title: "3D patch embed", sub: "spatio-temporal tokens" },
  { icon: BrainCircuit, title: "Swin stages", sub: "shifted-window attention" },
  { icon: Gauge, title: "Pooled embedding", sub: "768-d clip vector" },
  { icon: ScanSearch, title: "Linear head", sub: "softmax → Real / Fake" },
];

export default function PipelineFlowchart() {
  return (
    <div className="flow" role="img" aria-label="End-to-end deepfake detection pipeline">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <div className="flow-row" key={step.title}>
            <div className="flow-step">
              <div className="flow-icon"><Icon size={18} /></div>
              <div className="flow-text">
                <div className="flow-title">{step.title}</div>
                <div className="flow-sub">{step.sub}</div>
              </div>
            </div>
            {i < STEPS.length - 1 && <span className="flow-arrow" aria-hidden="true">→</span>}
          </div>
        );
      })}
    </div>
  );
}
