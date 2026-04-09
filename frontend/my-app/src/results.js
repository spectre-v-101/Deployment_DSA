// results.js — only the API URL reference is changed; all UI code is original
// Replace every  http://localhost:8080  with the  API  constant below.

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// ─── Backend URL (same constant as App.js) ────────────────────────────────────
const API = process.env.REACT_APP_API_URL || "http://localhost:8080";

function formatFormula(formula) {
  return formula.split(/(\d+)/).map((part, i) =>
    /\d+/.test(part)
      ? <sub key={i} style={{ fontSize: "0.75em" }}>{part}</sub>
      : part
  );
}

const themes = {
  dark: {
    bg: `
      radial-gradient(ellipse 80% 50% at 20% 10%, rgba(56,139,253,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 80%, rgba(63,185,80,0.06) 0%, transparent 60%),
      #0d1117
    `,
    text:           "#e6edf3",
    textMuted:      "#7d8590",
    textFaint:      "#484f58",
    cardBg:         "rgba(22,27,34,0.8)",
    cardBorder:     "rgba(48,54,61,0.8)",
    cardBorderHov:  "rgba(56,139,253,0.4)",
    cardBorderSel:  "rgba(0,255,220,0.5)",
    cardShadowSel:  "0 0 0 1px rgba(0,255,220,0.15)",
    metricBg:       "rgba(13,17,23,0.6)",
    metricBgActive: "rgba(56,139,253,0.08)",
    metricSep:      "rgba(48,54,61,0.5)",
    panelBg:        "rgba(13,17,23,0.85)",
    panelBorder:    "rgba(56,139,253,0.2)",
    panelDivider:   "rgba(48,54,61,0.6)",
    accent:         "#58a6ff",
    accentBg:       "rgba(56,139,253,0.15)",
    accentBorder:   "rgba(56,139,253,0.6)",
    accentBgDim:    "rgba(56,139,253,0.12)",
    accentBorderDim:"rgba(56,139,253,0.25)",
    green:          "#3fb950",
    greenBg:        "rgba(63,185,80,0.08)",
    greenBorder:    "rgba(63,185,80,0.2)",
    teal:           "rgba(0,255,220,0.85)",
    tealBg:         "rgba(0,255,220,0.04)",
    tealBorder:     "rgba(0,255,220,0.15)",
    tealDim:        "rgba(0,255,220,0.3)",
    btnBg:          "rgba(22,27,34,0.8)",
    btnBorder:      "rgba(48,54,61,0.8)",
    dismissBorder:  "rgba(48,54,61,0.6)",
    radarGrid:      "rgba(88,166,255,0.12)",
    radarTick:      "#484f58",
    radarLabel:     "#8b949e",
    toggleBg:       "rgba(22,27,34,0.9)",
    toggleBorder:   "rgba(56,139,253,0.3)",
    toggleIcon:     "☀️",
    toggleLabel:    "Light mode",
    sliderTrack:    "rgba(48,54,61,0.9)",
    sliderFill:     "rgba(56,139,253,0.7)",
    researchBg:     "rgba(255,165,0,0.06)",
    researchBorder: "rgba(255,165,0,0.3)",
    researchActive: "rgba(255,165,0,0.15)",
    researchColor:  "#f0a040",
    researchGlow:   "0 0 12px rgba(255,165,0,0.15)",
    inputBg:        "rgba(13,17,23,0.8)",
    inputBorder:    "rgba(48,54,61,0.8)",
    warningBg:      "rgba(255,165,0,0.06)",
    warningBorder:  "rgba(255,165,0,0.2)",
    warningText:    "#f0a040",
  },
  light: {
    bg: `
      radial-gradient(ellipse 80% 50% at 20% 10%, rgba(56,139,253,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 80%, rgba(63,185,80,0.05) 0%, transparent 60%),
      #f0f4f8
    `,
    text:           "#1c2128",
    textMuted:      "#57606a",
    textFaint:      "#8c959f",
    cardBg:         "rgba(255,255,255,0.92)",
    cardBorder:     "rgba(208,215,222,0.9)",
    cardBorderHov:  "rgba(56,139,253,0.5)",
    cardBorderSel:  "rgba(0,185,160,0.6)",
    cardShadowSel:  "0 0 0 1px rgba(0,185,160,0.12)",
    metricBg:       "rgba(246,248,250,0.8)",
    metricBgActive: "rgba(56,139,253,0.07)",
    metricSep:      "rgba(208,215,222,0.6)",
    panelBg:        "rgba(255,255,255,0.95)",
    panelBorder:    "rgba(56,139,253,0.25)",
    panelDivider:   "rgba(208,215,222,0.7)",
    accent:         "#0969da",
    accentBg:       "rgba(56,139,253,0.1)",
    accentBorder:   "rgba(56,139,253,0.5)",
    accentBgDim:    "rgba(56,139,253,0.08)",
    accentBorderDim:"rgba(56,139,253,0.2)",
    green:          "#1a7f37",
    greenBg:        "rgba(26,127,55,0.07)",
    greenBorder:    "rgba(26,127,55,0.2)",
    teal:           "rgba(0,155,120,0.9)",
    tealBg:         "rgba(0,155,120,0.04)",
    tealBorder:     "rgba(0,155,120,0.2)",
    tealDim:        "rgba(0,155,120,0.35)",
    btnBg:          "rgba(255,255,255,0.9)",
    btnBorder:      "rgba(208,215,222,0.9)",
    dismissBorder:  "rgba(208,215,222,0.8)",
    radarGrid:      "rgba(56,139,253,0.12)",
    radarTick:      "#8c959f",
    radarLabel:     "#57606a",
    toggleBg:       "rgba(255,255,255,0.95)",
    toggleBorder:   "rgba(56,139,253,0.3)",
    toggleIcon:     "🌙",
    toggleLabel:    "Dark mode",
    sliderTrack:    "rgba(208,215,222,0.9)",
    sliderFill:     "rgba(56,139,253,0.6)",
    researchBg:     "rgba(240,140,30,0.05)",
    researchBorder: "rgba(240,140,30,0.25)",
    researchActive: "rgba(240,140,30,0.1)",
    researchColor:  "#c07000",
    researchGlow:   "0 0 12px rgba(240,140,30,0.1)",
    inputBg:        "rgba(246,248,250,0.9)",
    inputBorder:    "rgba(208,215,222,0.9)",
    warningBg:      "rgba(240,140,30,0.05)",
    warningBorder:  "rgba(240,140,30,0.2)",
    warningText:    "#c07000",
  },
};

function WeightSlider_old({ label, value, onChange, t, color }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {label}
        </span>
        <span style={{
          fontFamily: "monospace", fontSize: 12, fontWeight: 600,
          color: color || t.accent,
          background: t.accentBgDim,
          border: `1px solid ${t.accentBorderDim}`,
          borderRadius: 4, padding: "1px 7px",
          minWidth: 36, textAlign: "center",
        }}>
          {pct}%
        </span>
      </div>
      <div style={{ position: "relative", height: 6, borderRadius: 3, background: t.sliderTrack, cursor: "pointer" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${pct}%`, borderRadius: 3,
          background: color || t.sliderFill,
          transition: "width 0.1s",
        }} />
        <input
          type="range" min={0} max={1} step={0.05} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            opacity: 0, cursor: "pointer", margin: 0,
          }}
        />
      </div>
    </div>
  );
}
function WeightSlider({ label, value, onChange, t, color }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {label}
        </span>
        <span style={{
          fontFamily: "monospace", fontSize: 12, fontWeight: 600,
          color: color || t.accent,
          background: t.accentBgDim,
          border: `1px solid ${t.accentBorderDim}`,
          borderRadius: 4, padding: "1px 7px",
          minWidth: 36, textAlign: "center",
        }}>
          {pct}%
        </span>
      </div>
      <div style={{ position: "relative", height: 6, borderRadius: 3, background: t.sliderTrack, cursor: "pointer" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${pct}%`, borderRadius: 3,
          background: color || t.sliderFill,
          transition: "width 0.1s",
        }} />
        <input
          type="range" min={0} max={1} step={0.05} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            opacity: 0, cursor: "pointer", margin: 0,
          }}
        />
      </div>
    </div>
  );
}
function Results() {
  const [results, setResults]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [sortBy, setSortBy]           = useState("score");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDark, setIsDark]           = useState(true);

  // Weights
  const [weights, setWeights] = useState({ energy: 0.25, elec: 0.25, comp: 0.25, struct: 0.25 });
  const [showWeights, setShowWeights] = useState(false);
  const [pendingWeights, setPendingWeights] = useState({ energy: 0.25, elec: 0.25, comp: 0.25, struct: 0.25 });

  // Research mode
  const [researchMode, setResearchMode] = useState(false);
  const [researchLimit, setResearchLimit] = useState(50);
  const [researchThreshold, setResearchThreshold] = useState(0.1);

  const t = isDark ? themes.dark : themes.light;

  const params = new URLSearchParams(window.location.search);
  const query = params.get("q");

  const totalWeight = pendingWeights.energy + pendingWeights.elec + pendingWeights.comp + pendingWeights.struct;
  const weightsBalanced = Math.abs(totalWeight - 1.0) < 0.001;

  const fetchResults = useCallback(async (w, isResearch) => {
    setLoading(true);
    try {
      const limit     = isResearch ? researchLimit : 20;
      const threshold = isResearch ? researchThreshold : 0.25;
      const url = `${API}/search?q=${query}`
        + `&w_energy=${w.energy.toFixed(3)}`
        + `&w_elec=${w.elec.toFixed(3)}`
        + `&w_comp=${w.comp.toFixed(3)}`
        + `&w_struct=${w.struct.toFixed(3)}`
        + `&limit=${limit}`
        + `&threshold=${threshold}`;
      const res  = await fetch(url);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Failed to fetch results:", err.message, err);
    } finally {
      setLoading(false);
    }
  }, [query, researchLimit, researchThreshold]);

  useEffect(() => {
    fetchResults(weights, researchMode);
  }, []);

  const handleApplyWeights = () => {
    if (!weightsBalanced) return;
    setWeights({ ...pendingWeights });
    setShowWeights(false);
    fetchResults(pendingWeights, researchMode);
  };

  const handleNormalise = () => {
    const total = pendingWeights.energy + pendingWeights.elec + pendingWeights.comp + pendingWeights.struct;
    if (total === 0) return;
    setPendingWeights({
      energy: pendingWeights.energy / total,
      elec:   pendingWeights.elec   / total,
      comp:   pendingWeights.comp   / total,
      struct: pendingWeights.struct / total,
    });
  };

  const handleResearchToggle = () => {
    const next = !researchMode;
    setResearchMode(next);
    fetchResults(weights, next);
  };

  const sortOptions = [
    { key: "score",  label: "Total" },
    { key: "energy", label: "Energy" },
    { key: "elec",   label: "Elec" },
    { key: "comp",   label: "Comp" },
    { key: "struct", label: "Struct" },
  ];

  const sorted = [...results].sort((a, b) => {
    const aVal = parseFloat(a[sortBy]);
    const bVal = parseFloat(b[sortBy]);
    if (isNaN(aVal) || isNaN(bVal)) return 0;
    return bVal - aVal;
  });

  const AXES       = ["energy", "elec", "comp", "struct", "score"];
  const AXIS_LABELS = ["Energy", "Elec", "Comp", "Struct", "Score"];
  const queryRadarData = AXES.map(() => 1.0);

  const selectedRadarData = selectedItem
    ? AXES.map((k) => parseFloat(selectedItem[k]) || 0)
    : null;

  const radarData = {
    labels: AXIS_LABELS,
    datasets: [
      {
        label: `Query (${query})`,
        data: queryRadarData,
        borderColor:       isDark ? "rgba(56,139,253,0.9)"  : "rgba(9,105,218,0.9)",
        backgroundColor:   isDark ? "rgba(56,139,253,0.12)" : "rgba(9,105,218,0.1)",
        borderWidth: 1.5,
        pointBackgroundColor: isDark ? "rgba(56,139,253,0.9)" : "rgba(9,105,218,0.9)",
        pointRadius: 3,
      },
      ...(selectedItem ? [{
        label: selectedItem.formula,
        data: selectedRadarData,
        borderColor:     isDark ? "rgba(0,255,220,0.85)"  : "rgba(0,155,120,0.9)",
        backgroundColor: isDark ? "rgba(0,255,220,0.08)"  : "rgba(0,155,120,0.08)",
        borderWidth: 1.5,
        pointBackgroundColor: isDark ? "rgba(0,255,220,0.85)" : "rgba(0,155,120,0.9)",
        pointRadius: 3,
      }] : []),
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toFixed(2)}` } },
    },
    scales: {
      r: {
        min: 0, max: 1,
        ticks: { stepSize: 0.1, backdropColor: "transparent", color: t.radarTick, font: { size: 9, family: "'IBM Plex Mono', monospace" } },
        grid: { color: t.radarGrid, circular: false },
        angleLines: { color: t.radarGrid },
        pointLabels: { color: t.radarLabel, font: { size: 10, family: "'IBM Plex Mono', monospace" } },
      },
    },
  };

  const weightColors = {
    energy: isDark ? "#f78166" : "#c0392b",
    elec:   isDark ? "#d2a8ff" : "#6f42c1",
    comp:   isDark ? "#79c0ff" : "#0550ae",
    struct: isDark ? "#3fb950" : "#1a7f37",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: t.bg,
      padding: "40px 24px",
      fontFamily: "'IBM Plex Mono', monospace",
      color: t.text,
      boxSizing: "border-box",
      transition: "background 0.3s, color 0.3s",
    }}>

      {/* ── Header row ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 500, color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
            Results for &ldquo;<span style={{ color: t.accent }}>{query}</span>&rdquo;
          </h2>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: t.textFaint, display: "flex", alignItems: "center", gap: 10 }}>
            <span>{results.length} match{results.length !== 1 ? "es" : ""} found</span>
            {researchMode && (
              <span style={{ color: t.researchColor, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                ⬡ research mode — up to {researchLimit} results
              </span>
            )}
            {loading && (
              <span style={{ color: t.accent, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", animation: "pulse 1s ease infinite" }}>
                fetching…
              </span>
            )}
          </div>
        </div>
        <a href="/" style={{ textDecoration: "none", color: t.accent, fontFamily: "monospace", fontSize: 13, letterSpacing: "0.1em" }}>← VECTA</a>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {/* Research mode toggle */}
          <button
            onClick={handleResearchToggle}
            title="Research Mode: more results, lower threshold"
            style={{
              display: "flex", alignItems: "center", gap: 7,
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              padding: "7px 14px", borderRadius: 20,
              border: `1px solid ${researchMode ? t.researchBorder : t.btnBorder}`,
              background: researchMode ? t.researchActive : t.btnBg,
              color: researchMode ? t.researchColor : t.textMuted,
              cursor: "pointer", outline: "none",
              letterSpacing: "0.05em",
              transition: "all 0.2s",
              backdropFilter: "blur(8px)",
              boxShadow: researchMode ? t.researchGlow : "none",
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>⬡</span>
            Research
          </button>

          {/* Weights toggle */}
          <button
            onClick={() => setShowWeights(!showWeights)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              padding: "7px 14px", borderRadius: 20,
              border: `1px solid ${showWeights ? t.accentBorder : t.btnBorder}`,
              background: showWeights ? t.accentBg : t.btnBg,
              color: showWeights ? t.accent : t.textMuted,
              cursor: "pointer", outline: "none",
              letterSpacing: "0.05em",
              transition: "all 0.2s", backdropFilter: "blur(8px)",
            }}
          >
            <span style={{ fontSize: 13, lineHeight: 1 }}>⚖</span>
            Weights
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            title={t.toggleLabel}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
              padding: "7px 14px", borderRadius: 20,
              border: `1px solid ${t.toggleBorder}`,
              background: t.toggleBg, color: t.textMuted,
              cursor: "pointer", outline: "none",
              letterSpacing: "0.05em",
              transition: "all 0.2s", backdropFilter: "blur(8px)",
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>{t.toggleIcon}</span>
            {t.toggleLabel}
          </button>
        </div>
      </div>

      {/* ── Weight sliders panel ── */}
      {showWeights && (
        <div style={{
          marginBottom: 20,
          padding: "18px 20px",
          borderRadius: 10,
          background: t.cardBg,
          border: `1px solid ${t.accentBorderDim}`,
          backdropFilter: "blur(8px)",
          transition: "all 0.2s",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Similarity weights
            </span>
            {/* mini weight bars visualisation */}
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              {Object.entries(pendingWeights).map(([k, v]) => (
                <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ width: 20, height: 30, background: t.sliderTrack, borderRadius: 2, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                    <div style={{ width: "100%", height: `${v * 100}%`, background: weightColors[k], transition: "height 0.15s", borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 8, color: t.textFaint, textTransform: "uppercase" }}>{k.slice(0, 2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px", marginBottom: 14 }}>
            {Object.entries(pendingWeights).map(([key, val]) => (
              <WeightSlider
                key={key}
                label={key}
                value={val}
                color={weightColors[key]}
                t={t}
                onChange={(v) => setPendingWeights(prev => ({ ...prev, [key]: v }))}
              />
            ))}
          </div>

          {/* total indicator */}
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              flex: 1, height: 4, borderRadius: 2,
              background: t.sliderTrack, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: `${Math.min(totalWeight * 100, 100)}%`,
                background: weightsBalanced
                  ? (isDark ? "#3fb950" : "#1a7f37")
                  : (totalWeight > 1 ? "#f85149" : "#f0a040"),
                transition: "width 0.1s, background 0.2s",
              }} />
            </div>
            <span style={{ fontSize: 10, fontFamily: "monospace", color: weightsBalanced ? t.green : t.warningText, minWidth: 60, textAlign: "right" }}>
              total: {(totalWeight * 100).toFixed(0)}%
              {weightsBalanced ? " ✓" : totalWeight > 1 ? " ↑ over" : " ↓ under"}
            </span>
          </div>

          {!weightsBalanced && (
            <div style={{
              marginBottom: 10, padding: "6px 10px", borderRadius: 6,
              background: t.warningBg, border: `1px solid ${t.warningBorder}`,
              fontFamily: "monospace", fontSize: 11, color: t.warningText,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>Weights must sum to 100% before applying.</span>
              <button
                onClick={handleNormalise}
                style={{
                  fontFamily: "monospace", fontSize: 10,
                  padding: "3px 9px", borderRadius: 4,
                  border: `1px solid ${t.warningBorder}`,
                  background: "transparent", color: t.warningText,
                  cursor: "pointer",
                }}
              >
                Auto-normalise
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                const eq = { energy: 0.25, elec: 0.25, comp: 0.25, struct: 0.25 };
                setPendingWeights(eq);
              }}
              style={{
                fontFamily: "monospace", fontSize: 11, padding: "6px 14px",
                borderRadius: 6, border: `1px solid ${t.btnBorder}`,
                background: t.btnBg, color: t.textMuted, cursor: "pointer",
              }}
            >
              Reset equal
            </button>
            <button
              onClick={handleApplyWeights}
              disabled={!weightsBalanced}
              style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                padding: "6px 18px", borderRadius: 6,
                border: `1px solid ${weightsBalanced ? t.accentBorder : t.btnBorder}`,
                background: weightsBalanced ? t.accentBg : t.btnBg,
                color: weightsBalanced ? t.accent : t.textFaint,
                cursor: weightsBalanced ? "pointer" : "not-allowed",
                transition: "all 0.15s",
              }}
            >
              Apply & re-search →
            </button>
          </div>
        </div>
      )}

      {/* ── Research mode config ── */}
      {researchMode && (
        <div style={{
          marginBottom: 20, padding: "14px 18px",
          borderRadius: 10,
          background: t.researchBg,
          border: `1px solid ${t.researchBorder}`,
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
        }}>
          <span style={{ fontFamily: "monospace", fontSize: 10, color: t.researchColor, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>
            ⬡ research config
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: t.textMuted }}>Max results</span>
            {[20, 50, 100, 200].map(n => (
              <button key={n} onClick={() => setResearchLimit(n)} style={{
                fontFamily: "monospace", fontSize: 11, padding: "3px 10px",
                borderRadius: 4, cursor: "pointer",
                border: `1px solid ${researchLimit === n ? t.researchBorder : t.btnBorder}`,
                background: researchLimit === n ? t.researchActive : t.btnBg,
                color: researchLimit === n ? t.researchColor : t.textMuted,
              }}>{n}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: t.textMuted }}>Min score</span>
            {[0.05, 0.1, 0.15, 0.2].map(v => (
              <button key={v} onClick={() => setResearchThreshold(v)} style={{
                fontFamily: "monospace", fontSize: 11, padding: "3px 10px",
                borderRadius: 4, cursor: "pointer",
                border: `1px solid ${researchThreshold === v ? t.researchBorder : t.btnBorder}`,
                background: researchThreshold === v ? t.researchActive : t.btnBg,
                color: researchThreshold === v ? t.researchColor : t.textMuted,
              }}>{v}</button>
            ))}
          </div>
          <button
            onClick={() => fetchResults(weights, true)}
            style={{
              marginLeft: "auto", fontFamily: "monospace", fontSize: 11,
              padding: "5px 14px", borderRadius: 6,
              border: `1px solid ${t.researchBorder}`,
              background: t.researchActive, color: t.researchColor,
              cursor: "pointer",
            }}
          >
            Re-run →
          </button>
        </div>
      )}

      {/* ── Active weights bar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 2 }}>
          Weights:
        </span>
        {Object.entries(weights).map(([k, v]) => (
          <span key={k} style={{
            fontFamily: "monospace", fontSize: 10,
            padding: "2px 8px", borderRadius: 10,
            background: t.metricBg,
            border: `1px solid ${t.cardBorder}`,
            color: weightColors[k],
          }}>
            {k} {Math.round(v * 100)}%
          </span>
        ))}
      </div>

      {/* ── Sort buttons ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4 }}>
          Sort by
        </span>
        {sortOptions.map(({ key, label }) => {
          const active = sortBy === key;
          return (
            <button key={key} onClick={() => setSortBy(key)} style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
              padding: "5px 14px", borderRadius: 20,
              border: active ? `1px solid ${t.accentBorder}` : `1px solid ${t.btnBorder}`,
              background: active ? t.accentBg : t.btnBg,
              color: active ? t.accent : t.textMuted,
              cursor: "pointer", transition: "all 0.15s", outline: "none",
            }}>
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Main split layout ── */}
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

        {/* Left: cards */}
        <div style={{ flex: "0 0 62%", minWidth: 0 }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{
                  height: 130, borderRadius: 10, background: t.cardBg,
                  border: `1px solid ${t.cardBorder}`,
                  animation: "pulse 1.5s ease-in-out infinite",
                  opacity: 0.5,
                }} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <p style={{ fontFamily: "monospace", color: t.textFaint }}>No results found</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sorted.map((item, index) => {
                const isSelected = selectedItem?.material_id === item.material_id;
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedItem(isSelected ? null : item)}
                    style={{
                      background: t.cardBg,
                      border: isSelected ? `1px solid ${t.cardBorderSel}` : `1px solid ${t.cardBorder}`,
                      borderRadius: 10, padding: "20px 24px",
                      backdropFilter: "blur(8px)",
                      transition: "border-color 0.2s, transform 0.15s, box-shadow 0.2s",
                      cursor: "pointer",
                      boxShadow: isSelected ? t.cardShadowSel : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = t.cardBorderHov;
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = t.cardBorder;
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }
                    }}
                  >
                    {/* Card header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontFamily: "monospace", fontSize: 11, color: t.textFaint, minWidth: 20 }}>
                          #{index + 1}
                        </div>
                        <div style={{ fontFamily: "IBM Plex Mono", fontSize: 16, fontWeight: 600, color: t.text }}>
                          {formatFormula(item.formula)}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {isSelected && (
                          <span style={{ fontSize: 10, color: t.teal, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            comparing ↗
                          </span>
                        )}
                        {researchMode && (
                          <span style={{ fontSize: 9, color: t.researchColor, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 6px", border: `1px solid ${t.researchBorder}`, borderRadius: 3 }}>
                            ⬡ research
                          </span>
                        )}
                        <div style={{
                          fontFamily: "monospace", fontSize: 12, padding: "4px 10px",
                          borderRadius: 20,
                          background: t.accentBgDim, border: `1px solid ${t.accentBorderDim}`,
                          color: t.accent,
                        }}>
                          total: {item.score}
                        </div>
                      </div>
                    </div>

                    {/* Struct tag */}
                    <div style={{
                      display: "inline-block", fontFamily: "monospace", fontSize: 11,
                      color: t.green, background: t.greenBg, border: `1px solid ${t.greenBorder}`,
                      borderRadius: 4, padding: "2px 8px", marginBottom: 14,
                    }}>
                      Struct: {item.crystal_system}
                    </div>

                    {/* Metrics grid — mini weight bars alongside scores */}
                    <div style={{
                      display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1,
                      background: t.metricSep, borderRadius: 6, overflow: "hidden",
                    }}>
                      {[["struct", item.struct, "struct"],
                        ["energy", item.energy, "energy"],
                        ["elec",   item.elec,   "elec"],
                        ["comp",   item.comp,   "comp"],
                      ].map(([label, val, wkey]) => {
                        const isActive = sortBy === label;
                        const wPct = Math.round(weights[wkey] * 100);
                        return (
                          <div key={label} style={{
                            background: isActive ? t.metricBgActive : t.metricBg,
                            padding: "10px 12px", transition: "background 0.2s",
                          }}>
                            <div style={{
                              fontFamily: "monospace", fontSize: 10,
                              color: isActive ? t.accent : t.textFaint,
                              textTransform: "uppercase", marginBottom: 4,
                              display: "flex", justifyContent: "space-between",
                            }}>
                              <span>{label}{isActive ? " ↑" : ""}</span>
                              <span style={{ color: weightColors[wkey], fontSize: 9 }}>{wPct}%</span>
                            </div>
                            <div style={{
                              fontFamily: "monospace", fontSize: 13,
                              color: isActive ? t.text : t.textMuted,
                              fontWeight: isActive ? 600 : 400,
                            }}>
                              {val}
                            </div>
                            {/* tiny weight indicator */}
                            <div style={{ marginTop: 5, height: 2, borderRadius: 1, background: t.sliderTrack }}>
                              <div style={{ height: "100%", width: `${wPct}%`, borderRadius: 1, background: weightColors[wkey] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div style={{
                      marginTop: 14, padding: "10px 12px",
                      whiteSpace: "pre-wrap", borderRadius: 6,
                      fontFamily: "monospace", fontSize: 12, color: t.text,
                    }}>
                      {item.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: radar panel */}
        <div style={{
          width: 500, flexShrink: 0,
          border: `1px solid ${t.panelBorder}`,
          borderRadius: 12, background: t.panelBg,
          backdropFilter: "blur(12px)",
          display: "flex", flexDirection: "column",
          position: "sticky", top: 24, overflow: "hidden",
          transition: "background 0.3s, border-color 0.3s",
        }}>
          {/* Panel header */}
          <div style={{
            padding: "14px 18px",
            borderBottom: `1px solid ${t.panelDivider}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{
              display: "inline-block", width: 6, height: 6, borderRadius: "50%",
              background: selectedItem ? t.teal : t.tealDim, flexShrink: 0,
            }} />
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
              letterSpacing: "0.15em", textTransform: "uppercase", color: t.textMuted,
            }}>
              Comparison radar
            </span>
          </div>

          {/* Panel body */}
          <div style={{
            padding: "20px 16px", display: "flex",
            flexDirection: "column", alignItems: "center",
            justifyContent: selectedItem ? "flex-start" : "center",
            minHeight: 400,
          }}>
            {!selectedItem ? (
              <div style={{ textAlign: "center", color: t.textFaint, fontFamily: "'IBM Plex Mono', monospace" }}>
                <svg width="44" height="44" viewBox="0 0 44 44" style={{ marginBottom: 14, opacity: 0.35 }}>
                  <polygon points="22,3 40,13 40,31 22,41 4,31 4,13" fill="none" stroke={t.accent} strokeWidth="1.2" />
                  <polygon points="22,11 32,17 32,27 22,33 12,27 12,17" fill="none" stroke={t.accent} strokeWidth="0.8" opacity="0.5" />
                  <line x1="22" y1="3"  x2="22" y2="11" stroke={t.accent} strokeWidth="0.8" />
                  <line x1="40" y1="13" x2="32" y2="17" stroke={t.accent} strokeWidth="0.8" />
                  <line x1="40" y1="31" x2="32" y2="27" stroke={t.accent} strokeWidth="0.8" />
                  <line x1="22" y1="41" x2="22" y2="33" stroke={t.accent} strokeWidth="0.8" />
                  <line x1="4"  y1="31" x2="12" y2="27" stroke={t.accent} strokeWidth="0.8" />
                  <line x1="4"  y1="13" x2="12" y2="17" stroke={t.accent} strokeWidth="0.8" />
                </svg>
                <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 4 }}>Click a result to compare</div>
                <div style={{ fontSize: 11, color: t.textFaint }}>Radar chart will appear here</div>
              </div>
            ) : (
              <>
                <div style={{
                  width: "100%", marginBottom: 12, padding: "8px 12px",
                  background: t.tealBg, border: `1px solid ${t.tealBorder}`,
                  borderRadius: 6, fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11, color: t.teal, textAlign: "center",
                }}>
                  {formatFormula(selectedItem.formula)}
                  <span style={{ color: t.textFaint, marginLeft: 8 }}>vs query</span>
                </div>

                <div style={{ position: "relative", width: "100%", height: 350 }}>
                  <Radar data={radarData} options={radarOptions} />
                </div>

                {/* Legend */}
                <div style={{
                  display: "flex", gap: 16, marginTop: 12,
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                  color: t.textMuted, flexWrap: "wrap", justifyContent: "center",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: t.accent, flexShrink: 0 }} />
                    Query
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: t.teal, flexShrink: 0 }} />
                    {selectedItem.formula}
                  </span>
                </div>

                {/* Dismiss */}
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{
                    marginTop: 16, fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
                    color: t.textFaint, background: "transparent",
                    border: `1px solid ${t.dismissBorder}`, borderRadius: 4,
                    padding: "5px 12px", cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = t.textMuted)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = t.textFaint)}
                >
                  Clear selection
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
      `}</style>
    </div>
  );
}

function Results_old() {
  const [results, setResults]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [sortBy, setSortBy]             = useState("score");
  const [selectedItem, setSelectedItem] = useState(null);
  const [darkMode, setDarkMode]         = useState(true);
  const [showPanel, setShowPanel]       = useState(false);
  const [weights, setWeights]           = useState({ struct: 0.25, energy: 0.25, elec: 0.25, comp: 0.25 });
  const [threshold, setThreshold]       = useState(0.0);
  const [queryInfo, setQueryInfo]       = useState(null);
  const fetchedRef                      = useRef(false);

  const t = themes[darkMode ? "dark" : "light"];

  const params  = new URLSearchParams(window.location.search);
  const formula = params.get("q") || "";

  const weightColors = {
    struct: "#58a6ff",
    energy: "#3fb950",
    elec:   "#f0a040",
    comp:   "rgba(0,255,220,0.85)",
  };

  const fetchResults = useCallback(async () => {
    if (!formula) return;
    setLoading(true);
    try {
      const url = `${API}/search?q=${encodeURIComponent(formula)}`
        + `&w_struct=${weights.struct}&w_energy=${weights.energy}`
        + `&w_elec=${weights.elec}&w_comp=${weights.comp}`;
      const res  = await fetch(url);
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, [formula, weights]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const sorted = [...results]
    .filter(r => r.score >= threshold)
    .sort((a, b) => {
      if (sortBy === "score")  return b.score  - a.score;
      if (sortBy === "struct") return b.struct  - a.struct;
      if (sortBy === "energy") return b.energy  - a.energy;
      if (sortBy === "elec")   return b.elec    - a.elec;
      if (sortBy === "comp")   return b.comp    - a.comp;
      return 0;
    });

  const radarData = selectedItem ? {
    labels: ["Structural", "Energetic", "Electronic", "Compositional"],
    datasets: [
      {
        label: formula,
        data: [1, 1, 1, 1],
        backgroundColor: "rgba(56,139,253,0.08)",
        borderColor: t.accent,
        borderWidth: 1.5,
        pointBackgroundColor: t.accent,
        pointRadius: 3,
      },
      {
        label: selectedItem.formula,
        data: [selectedItem.struct, selectedItem.energy, selectedItem.elec, selectedItem.comp],
        backgroundColor: "rgba(0,255,220,0.06)",
        borderColor: t.teal,
        borderWidth: 1.5,
        pointBackgroundColor: t.teal,
        pointRadius: 3,
      },
    ],
  } : null;

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0, max: 1,
        ticks: { stepSize: 0.2, color: t.radarTick, font: { size: 10, family: "monospace" }, backdropColor: "transparent" },
        grid:        { color: t.radarGrid },
        angleLines:  { color: t.radarGrid },
        pointLabels: { color: t.radarLabel, font: { size: 11, family: "monospace" } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: darkMode ? "rgba(13,17,23,0.95)" : "rgba(255,255,255,0.97)",
        titleColor: t.text, bodyColor: t.textMuted,
        borderColor: t.panelBorder, borderWidth: 1,
        titleFont: { family: "monospace", size: 11 },
        bodyFont:  { family: "monospace", size: 11 },
      },
    },
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'IBM Plex Mono', monospace", transition: "background 0.3s, color 0.3s" }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        padding: "12px 24px",
        background: darkMode ? "rgba(13,17,23,0.9)" : "rgba(240,244,248,0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${t.panelDivider}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        <a href="/" style={{ textDecoration: "none", color: t.accent, fontFamily: "monospace", fontSize: 13, letterSpacing: "0.1em" }}>← VECTA</a>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: t.textMuted }}>
          Results for <span style={{ color: t.text }}>{formula}</span>
          {!loading && <span style={{ marginLeft: 10, color: t.textFaint }}>({sorted.length} matches)</span>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setShowPanel(p => !p)} style={{
            fontFamily: "monospace", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
            color: showPanel ? t.researchColor : t.textMuted,
            background: showPanel ? t.researchActive : "transparent",
            border: `1px solid ${showPanel ? t.researchBorder : t.btnBorder}`,
            borderRadius: 6, padding: "5px 12px", cursor: "pointer",
            boxShadow: showPanel ? t.researchGlow : "none",
            transition: "all 0.2s",
          }}>
            ⚙ Weights
          </button>
          <button onClick={() => setDarkMode(d => !d)} style={{
            fontFamily: "monospace", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
            color: t.textMuted, background: t.toggleBg,
            border: `1px solid ${t.toggleBorder}`,
            borderRadius: 6, padding: "5px 12px", cursor: "pointer",
          }}>
            {t.toggleIcon} {t.toggleLabel}
          </button>
        </div>
      </div>

      {/* Weights panel */}
      {showPanel && (
        <div style={{
          margin: "16px 24px", padding: "20px 24px",
          background: t.panelBg, border: `1px solid ${t.researchBorder}`,
          borderRadius: 12, backdropFilter: "blur(12px)",
          boxShadow: t.researchGlow,
        }}>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: t.researchColor, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>
            Similarity Weights
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {[["struct","Structural"],["energy","Energetic"],["elec","Electronic"],["comp","Compositional"]].map(([k,label]) => (
              <WeightSlider key={k} label={label} value={weights[k]} color={weightColors[k]} t={t}
                onChange={v => setWeights(w => ({ ...w, [k]: v }))} />
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <WeightSlider label="Min score threshold" value={threshold} t={t}
              onChange={v => setThreshold(v)} color={t.textMuted} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={fetchResults} style={{
              fontFamily: "monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em",
              color: darkMode ? "#0d1117" : "#fff",
              background: t.researchColor, border: "none", borderRadius: 6,
              padding: "7px 18px", cursor: "pointer",
            }}>
              Apply
            </button>
            <button onClick={() => setWeights({ struct:0.25, energy:0.25, elec:0.25, comp:0.25 })} style={{
              fontFamily: "monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em",
              color: t.textMuted, background: "transparent",
              border: `1px solid ${t.btnBorder}`, borderRadius: 6,
              padding: "7px 18px", cursor: "pointer",
            }}>
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Sort bar */}
      <div style={{
        padding: "10px 24px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        borderBottom: `1px solid ${t.panelDivider}`,
      }}>
        <span style={{ fontSize: 10, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.1em", marginRight: 4 }}>Sort:</span>
        {[["score","Total"],["struct","Structural"],["energy","Energetic"],["elec","Electronic"],["comp","Compositional"]].map(([k,label]) => (
          <button key={k} onClick={() => setSortBy(k)} style={{
            fontFamily: "monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em",
            color: sortBy === k ? (darkMode ? "#0d1117" : "#fff") : t.textMuted,
            background: sortBy === k ? t.accent : "transparent",
            border: `1px solid ${sortBy === k ? t.accent : t.btnBorder}`,
            borderRadius: 4, padding: "4px 10px", cursor: "pointer", transition: "all 0.15s",
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ display: "flex", gap: 20, padding: "20px 24px", alignItems: "flex-start" }}>
        {/* Results list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: t.textFaint, fontSize: 12 }}>
              <div style={{ animation: "pulse 1.5s infinite", marginBottom: 8 }}>⬡</div>
              Searching materials database…
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8 }}>No results found for <strong>{formula}</strong></div>
              <div style={{ fontSize: 11, color: t.textFaint }}>Check the formula spelling or lower the threshold.</div>
            </div>
          ) : sorted.map((item, idx) => {
            const isSelected = selectedItem?.formula === item.formula;
            return (
              <div key={idx} onClick={() => setSelectedItem(isSelected ? null : item)} style={{
                marginBottom: 10, padding: "16px 18px",
                background: t.cardBg,
                border: `1px solid ${isSelected ? t.cardBorderSel : t.cardBorder}`,
                borderRadius: 10,
                boxShadow: isSelected ? t.cardShadowSel : "none",
                cursor: "pointer", transition: "all 0.2s",
              }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = t.cardBorderHov; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = t.cardBorder; }}
              >
                {/* Row 1: rank + formula + score */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontFamily: "monospace", fontSize: 10, color: t.textFaint,
                      background: t.metricBg, border: `1px solid ${t.metricSep}`,
                      borderRadius: 3, padding: "2px 6px", minWidth: 22, textAlign: "center",
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 600, color: t.text }}>
                      {formatFormula(item.formula)}
                    </span>
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: t.textFaint }}>
                      {item.material_id}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: "monospace", fontSize: 13, fontWeight: 700,
                    color: t.accent,
                    background: t.accentBg, border: `1px solid ${t.accentBorder}`,
                    borderRadius: 6, padding: "3px 10px",
                  }}>
                    {item.score?.toFixed(3)}
                  </div>
                </div>

                {/* Crystal tag */}
                <div style={{
                  display: "inline-block", fontFamily: "monospace", fontSize: 11,
                  color: t.green, background: t.greenBg, border: `1px solid ${t.greenBorder}`,
                  borderRadius: 4, padding: "2px 8px", marginBottom: 14,
                }}>
                  Struct: {item.crystal_system}
                </div>

                {/* Metrics grid */}
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1,
                  background: t.metricSep, borderRadius: 6, overflow: "hidden",
                }}>
                  {[["struct", item.struct, "struct"],
                    ["energy", item.energy, "energy"],
                    ["elec",   item.elec,   "elec"],
                    ["comp",   item.comp,   "comp"],
                  ].map(([label, val, wkey]) => {
                    const isActive = sortBy === label;
                    const wPct = Math.round(weights[wkey] * 100);
                    return (
                      <div key={label} style={{
                        background: isActive ? t.metricBgActive : t.metricBg,
                        padding: "10px 12px", transition: "background 0.2s",
                      }}>
                        <div style={{
                          fontFamily: "monospace", fontSize: 10,
                          color: isActive ? t.accent : t.textFaint,
                          textTransform: "uppercase", marginBottom: 4,
                          display: "flex", justifyContent: "space-between",
                        }}>
                          <span>{label}{isActive ? " ↑" : ""}</span>
                          <span style={{ color: weightColors[wkey], fontSize: 9 }}>{wPct}%</span>
                        </div>
                        <div style={{
                          fontFamily: "monospace", fontSize: 13,
                          color: isActive ? t.text : t.textMuted,
                          fontWeight: isActive ? 600 : 400,
                        }}>
                          {typeof val === "number" ? val.toFixed(3) : val}
                        </div>
                        <div style={{ marginTop: 5, height: 2, borderRadius: 1, background: t.sliderTrack }}>
                          <div style={{ height: "100%", width: `${wPct}%`, borderRadius: 1, background: weightColors[wkey] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div style={{
                  marginTop: 14, padding: "10px 12px",
                  whiteSpace: "pre-wrap", borderRadius: 6,
                  fontFamily: "monospace", fontSize: 12, color: t.text,
                }}>
                  {item.explanation}
                </div>
              </div>
            );
          })}
        </div>

        {/* Radar panel */}
        <div style={{
          width: 500, flexShrink: 0,
          border: `1px solid ${t.panelBorder}`,
          borderRadius: 12, background: t.panelBg,
          backdropFilter: "blur(12px)",
          display: "flex", flexDirection: "column",
          position: "sticky", top: 70, overflow: "hidden",
          transition: "background 0.3s, border-color 0.3s",
        }}>
          <div style={{
            padding: "14px 18px",
            borderBottom: `1px solid ${t.panelDivider}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{
              display: "inline-block", width: 6, height: 6, borderRadius: "50%",
              background: selectedItem ? t.teal : t.tealDim, flexShrink: 0,
            }} />
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
              letterSpacing: "0.15em", textTransform: "uppercase", color: t.textMuted,
            }}>
              Comparison radar
            </span>
          </div>
          <div style={{
            padding: "20px 16px", display: "flex",
            flexDirection: "column", alignItems: "center",
            justifyContent: selectedItem ? "flex-start" : "center",
            minHeight: 400,
          }}>
            {!selectedItem ? (
              <div style={{ textAlign: "center", color: t.textFaint, fontFamily: "'IBM Plex Mono', monospace" }}>
                <svg width="44" height="44" viewBox="0 0 44 44" style={{ marginBottom: 14, opacity: 0.35 }}>
                  <polygon points="22,3 40,13 40,31 22,41 4,31 4,13" fill="none" stroke={t.accent} strokeWidth="1.2" />
                  <polygon points="22,11 32,17 32,27 22,33 12,27 12,17" fill="none" stroke={t.accent} strokeWidth="0.8" opacity="0.5" />
                  <line x1="22" y1="3"  x2="22" y2="11" stroke={t.accent} strokeWidth="0.8" />
                  <line x1="40" y1="13" x2="32" y2="17" stroke={t.accent} strokeWidth="0.8" />
                  <line x1="40" y1="31" x2="32" y2="27" stroke={t.accent} strokeWidth="0.8" />
                  <line x1="22" y1="41" x2="22" y2="33" stroke={t.accent} strokeWidth="0.8" />
                  <line x1="4"  y1="31" x2="12" y2="27" stroke={t.accent} strokeWidth="0.8" />
                  <line x1="4"  y1="13" x2="12" y2="17" stroke={t.accent} strokeWidth="0.8" />
                </svg>
                <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 4 }}>Click a result to compare</div>
                <div style={{ fontSize: 11, color: t.textFaint }}>Radar chart will appear here</div>
              </div>
            ) : (
              <>
                <div style={{
                  width: "100%", marginBottom: 12, padding: "8px 12px",
                  background: t.tealBg, border: `1px solid ${t.tealBorder}`,
                  borderRadius: 6, fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11, color: t.teal, textAlign: "center",
                }}>
                  {formatFormula(selectedItem.formula)}
                  <span style={{ color: t.textFaint, marginLeft: 8 }}>vs query</span>
                </div>
                <div style={{ position: "relative", width: "100%", height: 350 }}>
                  <Radar data={radarData} options={radarOptions} />
                </div>
                <div style={{
                  display: "flex", gap: 16, marginTop: 12,
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                  color: t.textMuted, flexWrap: "wrap", justifyContent: "center",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: t.accent, flexShrink: 0 }} />
                    Query
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: t.teal, flexShrink: 0 }} />
                    {selectedItem.formula}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{
                    marginTop: 16, fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
                    color: t.textFaint, background: "transparent",
                    border: `1px solid ${t.dismissBorder}`, borderRadius: 4,
                    padding: "5px 12px", cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = t.textMuted)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = t.textFaint)}
                >
                  Clear selection
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity:0.5; } 50% { opacity:1; } }`}</style>
    </div>
  );
}

export default Results;