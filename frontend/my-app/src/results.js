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