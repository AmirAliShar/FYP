import { useState } from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ScanSearch,
  BookOpen,
} from "lucide-react";

import DetectPage from "./pages/DetectPage.jsx";
import AboutSwinPage from "./pages/AboutSwinPage.jsx";
import { DEFAULT_API_URL, useBackend } from "./api.js";

function StatusPill({ ready, error }) {
  return (
    <div className={`nav-status ${ready ? "ready" : "error"}`} title={ready ? "Backend pipeline ready" : error}>
      {ready ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
      <span>{ready ? "Pipeline ready" : error || "Backend offline"}</span>
    </div>
  );
}

export default function App() {
  const [backendUrl, setBackendUrl] = useState(DEFAULT_API_URL);
  const { health, healthError, config, limits, pipelineReady } = useBackend(backendUrl);

  const detectElement = (
    <DetectPage
      backendUrl={backendUrl}
      setBackendUrl={setBackendUrl}
      health={health}
      healthError={healthError}
      config={config}
      limits={limits}
      pipelineReady={pipelineReady}
    />
  );

  return (
    <div className="app-root">
      <header className="topnav">
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1>Deepfake Detection</h1>
            <p>Swin3D video transformer</p>
          </div>
        </div>

        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            <ScanSearch size={16} />
            <span>Detect</span>
          </NavLink>
          <NavLink to="/about-swin" className={({ isActive }) => (isActive ? "active" : "")}>
            <BookOpen size={16} />
            <span>About Swin</span>
          </NavLink>
        </nav>

        <StatusPill ready={pipelineReady} error={healthError} />
      </header>

      <Routes>
        <Route path="/" element={detectElement} />
        <Route path="/about-swin" element={<AboutSwinPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
