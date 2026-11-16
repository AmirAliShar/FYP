import { Minus, Plus } from "lucide-react";

/**
 * Dynamic frame-count control: a numeric stepper plus a range slider.
 * Bounds come from the backend /config (fallback 8–64, default 24).
 */
export default function FrameControl({ value, onChange, min, max, defaultValue, step = 1 }) {
  const clamp = (v) => Math.min(max, Math.max(min, Math.round(Number(v) || min)));
  const set = (v) => onChange(clamp(v));

  return (
    <div className="frame-control">
      <div className="frame-head">
        <span className="field-label">Sample frames per video</span>
        <div className="stepper">
          <button type="button" onClick={() => set(value - step)} disabled={value <= min} aria-label="Decrease frames">
            <Minus size={15} />
          </button>
          <input
            className="frame-number"
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => set(e.target.value)}
            aria-label="Frames per video"
          />
          <button type="button" onClick={() => set(value + step)} disabled={value >= max} aria-label="Increase frames">
            <Plus size={15} />
          </button>
        </div>
      </div>

      <input
        className="frame-slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => set(e.target.value)}
        aria-label="Frames per video slider"
      />
      <div className="frame-bounds">
        <span>min {min}</span>
        <span className="muted">default {defaultValue ?? 24}</span>
        <span>max {max}</span>
      </div>
    </div>
  );
}
