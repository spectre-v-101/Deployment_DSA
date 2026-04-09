import { useState } from "react";
import { FaSun, FaMoon, FaMicrophone } from "react-icons/fa";
import { useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Results from "./results";
 import { useNavigate } from "react-router-dom";

// ─── Backend URL ──────────────────────────────────────────────────────────────
// In development:  set REACT_APP_API_URL=http://localhost:8080 in .env.local
// In production:   set REACT_APP_API_URL=https://vecta-backend.onrender.com
//                  (use the actual URL Render gives your service)
const API = process.env.REACT_APP_API_URL || "http://localhost:8080";

// Add to your index.html <head>:
// <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet" />

const ELEMENTS = [
  { num: 11, sym: "Na", name: "sodium" },
  { num: 17, sym: "Cl", name: "chlorine" },
  { num: 26, sym: "Fe", name: "iron" },
  { num: 8,  sym: "O",  name: "oxygen" },
  { num: 14, sym: "Si", name: "silicon" },
  { num: 13, sym: "Al", name: "aluminium" },
  { num: 6,  sym: "C",  name: "carbon" },
];

function formatFormula(formula) {
  return formula.split(/(\d+)/).map((part, i) =>
    /\d+/.test(part)
      ? <sub key={i} style={{ fontSize: "0.75em" }}>{part}</sub>
      : part
  );
}

const css = `
@keyframes moveBG { from { background-position: 0 0; } to { background-position: 60px 0; } }
@keyframes fadeDown { from { opacity:0; transform:translateY(-14px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeUp   { from { opacity:0; transform:translateY(12px);  } to { opacity:1; transform:translateY(0); } }
@keyframes pulse    { 0%,100%{ opacity:1; } 50%{ opacity:0.35; } }
@keyframes micPulse { 0%,100%{ box-shadow:0 0 0 0 rgba(248,81,73,.35); } 50%{ box-shadow:0 0 0 5px rgba(248,81,73,0); } }
@keyframes scanSweep { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
`;

function MainUI({
  handleSearch, query, setQuery, darkMode, setDarkMode,
  selectedIndex, setSelectedIndex, suggestions, setSuggestions,
  handleChange, handleKeyDown, ghostSuggestion, listening,
  recognitionRef, handleSuggestionClick,
}) {
  return (
    <>
      <style>{css}</style>

      {/* Background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: darkMode
          ? `radial-gradient(ellipse 70% 60% at 15% 20%, rgba(56, 138, 253, 0.1) 0%, transparent 65%),
             radial-gradient(ellipse 50% 50% at 85% 75%, rgba(63,185,80,0.05) 0%, transparent 60%),
             #0c141f`
          : `radial-gradient(ellipse 70% 60% at 15% 20%, rgba(56, 138, 253, 0.09) 0%, transparent 65%),
             radial-gradient(ellipse 50% 50% at 85% 75%, rgba(63, 185, 79, 0.08) 0%, transparent 60%),
             #ffffff`,
      }} />

      {/* Scanline shimmer overlay */}
      <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: 0, right: 0, height: "30%",
          background: darkMode
            ? "linear-gradient(to bottom, transparent 0%, rgba(88,166,255,0.035) 40%, rgba(88,166,255,0.06) 50%, rgba(88,166,255,0.035) 60%, transparent 100%)"
            : "linear-gradient(to bottom, transparent 0%, rgba(56, 253, 204, 0.34) 40%, rgba(56, 253, 237, 0.3) 50%, rgba(56, 253, 230, 0.06)60%, transparent 100%)",
          animation: "scanSweep 6s linear infinite",
        }} />
      </div>

      {/* Crystal lattice SVG */}
      <svg style={{ position:"fixed", inset:0, width:"100%", height:"100%", zIndex:0, opacity: darkMode ? 0.2 : 0.4 }}
        viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <g stroke="#58a6ff" strokeWidth="0.5" fill="none">
          {[150,300,450,600,750].map(y => <line key={y} x1="0" y1={y} x2="1400" y2={y} opacity="0.7"/>)}
          {[175,350,525,700,875,1050,1225].map(x => <line key={x} x1={x} y1="0" x2={x} y2="900" opacity="0.7"/>)}
          <circle cx="700" cy="450" r="4" fill="#58a6ff" opacity="0.6"/>
          <circle cx="525" cy="300" r="5" fill="#3fb950" opacity="0.5"/>
          <circle cx="875" cy="300" r="3" fill="#3fb950" opacity="0.4"/>
          <circle cx="350" cy="300" r="3" fill="#3fb950" opacity="0.4"/>
          <circle cx="525" cy="450" r="3" fill="#3fb950" opacity="0.4"/>
          <circle cx="700" cy="300" r="3" fill="#58a6ff" opacity="0.5"/>
          <circle cx="1050" cy="450" r="4" fill="#58a6ff" opacity="0.6"/>
          <circle cx="1225" cy="600" r="3" fill="#3fb950" opacity="0.4"/>
          <circle cx="175" cy="600" r="3" fill="#58a6ff" opacity="0.5"/>
          <circle cx="175" cy="450" r="3" fill="#3fb950" opacity="0.4"/>
          <line x1="350" y1="300" x2="700" y2="300" stroke="#58a6ff" strokeWidth="0.8" opacity="0.35"/>
          <line x1="700" y1="300" x2="700" y2="450" stroke="#58a6ff" strokeWidth="1"   opacity="0.4"/>
          <line x1="525" y1="300" x2="525" y2="450" stroke="#3fb950" strokeWidth="0.8" opacity="0.3"/>
          <line x1="700" y1="450" x2="875" y2="450" stroke="#58a6ff" strokeWidth="0.8" opacity="0.3"/>
        </g>
      </svg>

      {/* Top bar */}
      <div style={{
        position:"fixed", top:0, left:0, right:0, zIndex:10,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"12px 28px",
        borderBottom: `1px solid rgba(56,139,253,0.1)`,
        background: darkMode ? "rgba(6,10,16,0.75)" : "rgba(240,244,248,0.8)",
        backdropFilter:"blur(12px)",
        fontFamily:"'IBM Plex Mono', monospace",
        fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase",
        color: darkMode ? "#484f58" : "#8a9ab0",
      }} />

      {/* Main */}
      <div style={{
        position:"relative", zIndex:1,
        minHeight:"80vh", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:"80px 24px 40px",
        fontFamily:"'Rajdhani', sans-serif",
        color: darkMode ? "#cdd9e5" : "#1c2a3a",
      }}>

        {/* Mode toggle */}
        <button onClick={() => setDarkMode(!darkMode)} style={{
          position:"fixed", top:30, right:20, zIndex:20,
          width:36, height:36, borderRadius:6,
          border:`1px solid rgba(56,139,253,0.2)`,
          background: darkMode ? "rgba(10,18,30,0.8)" : "rgba(255,255,255,0.8)",
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {darkMode ? <FaSun color="orange" size={13}/> : <FaMoon color="#58a6ff" size={13}/>}
        </button>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:40, animation:"fadeDown 0.6s ease both" }}>
          <img
            src={darkMode ? "/vecta_logo_updated-removebg-preview-2.png" : "/vecta_logo_updated-removebg-preview.png"}
            alt="Logo" style={{ width:300, marginBottom:12 }}
          />
          <div style={{
            fontFamily:"'IBM Plex Mono', monospace", fontSize:10,
            letterSpacing:"0.3em", color: darkMode ? "#747e8d" : "#8a9ab0",
            textTransform:"uppercase", marginTop:6,
          }}>
            Where Materials Meets Intelligence
          </div>
        </div>

        {/* Element chips */}
        <div style={{
          display:"flex", gap:8, justifyContent:"center",
          marginBottom:36, animation:"fadeDown 0.6s 0.1s ease both", flexWrap:"wrap",
        }}>
          {ELEMENTS.map(el => (
            <div key={el.sym} style={{
              width:40, height:44, border:`1px solid rgba(56,139,253,0.2)`,
              borderRadius:4, background:darkMode?"rgba(56,139,253,0.04)":"rgba(56, 138, 253, 0.19)",
              display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", cursor:"default", transition:"all 0.2s",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(56,139,253,0.5)";
                e.currentTarget.style.background = "rgba(56,139,253,0.1)";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(56,139,253,0.2)";
                e.currentTarget.style.background = darkMode?"rgba(56,139,253,0.04)":"rgba(56, 138, 253, 0.19)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8,  color:"#6d7785" }}>{el.num}</div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:15, fontWeight:600, color:"#58a6ff" }}>{el.sym}</div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7,  color:"#6d7785" }}>{el.name}</div>
            </div>
          ))}
        </div>

        {/* Search bar — preserved exactly from original */}
        <div style={{ width:"100%", maxWidth:640, animation:"fadeUp 0.6s 0.15s ease both", position:"relative" }}>
          <div style={{
            fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:!darkMode ? "#484f58" : "#8a9ab0",
            letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10,
            display:"flex", alignItems:"center", gap:8,
          }}>
            <span style={{ display:"inline-block", width:16, height:1, background:"#58a6ff", opacity:0.5 }}/>
            Query formula or material
          </div>

          {/* Input wrapper */}
          <div style={{ position:"relative" }}>
            {/* Ghost suggestion */}
            {query!=="" && ghostSuggestion && (
              <div style={{
                position:"absolute", top:0, left:0, right:0, bottom:0,
                display:"flex", alignItems:"center",
                paddingLeft:16, paddingRight:48,
                fontFamily:"'IBM Plex Mono',monospace", fontSize:15, letterSpacing:"0.04em",
                pointerEvents:"none", zIndex:1,
                color: darkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
              }}>
                <span style={{ color:"transparent" }}>{query}</span>
                <span style={{ color: darkMode ? "#b1bdca" : "#929ba3" }}>{ghostSuggestion}</span>
              </div>
            )}

            <input
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g. SiC, Fe2O3, GaN..."
              style={{
                width:"100%", boxSizing:"border-box",
                padding:"14px 52px 14px 16px",
                fontFamily:"'IBM Plex Mono',monospace", fontSize:15, letterSpacing:"0.04em",
                background: darkMode ? "rgba(10,18,30,0.7)" : "rgba(255,255,255,0.85)",
                border: `1px solid rgba(56,139,253,0.25)`,
                borderRadius:8, color: darkMode ? "#cdd9e5" : "#1c2a3a",
                outline:"none", position:"relative", zIndex:2, backdropFilter:"blur(8px)",
              }}
            />

            {/* Mic button */}
            <button
              onClick={() => recognitionRef.current?.start()}
              style={{
                position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                zIndex:3, width:30, height:30, borderRadius:6,
                border:`1px solid ${listening ? "rgba(248,81,73,0.5)" : "rgba(56,139,253,0.2)"}`,
                background: listening ? "rgba(248,81,73,0.1)" : "transparent",
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                animation: listening ? "micPulse 1s infinite" : "none",
              }}
            >
              <FaMicrophone color={listening ? "#f85149" : "#58a6ff"} size={11}/>
            </button>
          </div>

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div style={{
              position:"absolute", top:"100%", left:0, right:0, zIndex:50,
              marginTop:4, borderRadius:8, overflow:"hidden",
              border:`1px solid rgba(56,139,253,0.2)`,
              background: darkMode ? "rgba(10,18,30,0.95)" : "rgba(255,255,255,0.97)",
              backdropFilter:"blur(16px)",
              boxShadow:"0 8px 32px rgba(0,0,0,0.3)",
              animation:"fadeDown 0.15s ease both",
            }}>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() => handleSuggestionClick(s.formula)}
                  style={{
                    padding:"10px 16px", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    background: i === selectedIndex
                      ? (darkMode ? "rgba(56,139,253,0.12)" : "rgba(56,139,253,0.08)")
                      : "transparent",
                    borderBottom: i < suggestions.length-1
                      ? `1px solid ${darkMode ? "rgba(56,139,253,0.08)" : "rgba(56,139,253,0.1)"}`
                      : "none",
                    transition:"background 0.1s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(56,139,253,0.1)" : "rgba(56,139,253,0.07)"}
                  onMouseLeave={e => e.currentTarget.style.background = i === selectedIndex ? (darkMode ? "rgba(56,139,253,0.12)" : "rgba(56,139,253,0.08)") : "transparent"}
                >
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, color: darkMode ? "#cdd9e5" : "#1c2a3a" }}>
                    {formatFormula(s.formula)}
                  </span>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:"#484f58" }}>
                    {s.crystal} · ρ {s.density?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Search button */}
          <button
            onClick={() => handleSearch()}
            style={{
              marginTop:14, width:"100%",
              padding:"12px", borderRadius:8, cursor:"pointer",
              fontFamily:"'IBM Plex Mono',monospace", fontSize:11,
              letterSpacing:"0.15em", textTransform:"uppercase",
              border:`1px solid rgba(56,139,253,0.3)`,
              background:"rgba(56,139,253,0.08)", color:"#58a6ff",
              transition:"all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(56,139,253,0.15)"; e.currentTarget.style.borderColor="rgba(56,139,253,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(56,139,253,0.08)"; e.currentTarget.style.borderColor="rgba(56,139,253,0.3)"; }}
          >
            Search
          </button>

          {/* Keyboard hints */}
          <div style={{ marginTop:14, display:"flex", gap:18, justifyContent:"center", flexWrap:"wrap" }}>
            {[["↑↓","navigate"],["↵","search"],["Tab","autocomplete"],["Esc","clear"]].map(([key, label]) => (
              <span key={key} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:darkMode ? "#959eac" : "#484f58", display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ padding:"2px 6px", border:"1px solid rgba(56,139,253,0.2)", borderRadius:3, fontSize:9, color:darkMode ? "#959eac" : "#484f58", background:"rgba(56,139,253,0.05)" }}>{key}</span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function App() {
  const [query, setQuery]           = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [darkMode, setDarkMode]     = useState(false);
  const [listening, setListening]   = useState(false);
  const recognitionRef              = useRef(null);

  const activeSuggestion =
    selectedIndex >= 0 ? suggestions[selectedIndex]?.formula : suggestions[0]?.formula;

  const ghostSuggestion = activeSuggestion
    ? activeSuggestion.startsWith(query)
      ? activeSuggestion.slice(query.length)
      : activeSuggestion
    : "";

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous     = false;
    recognition.interimResults = true;
    recognition.lang           = "en-IN";

    recognition.onstart  = () => setListening(true);
    recognition.onend    = () => setListening(false);
    recognition.onerror  = (e) => console.error("Speech error:", e.error);

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++)
        transcript += event.results[i][0].transcript;

      if (transcript) {
        const normalized = transcript.toLowerCase().trim();
        setQuery(normalized);
        fetch(`${API}/suggest?q=${normalized}&voice=true&t=${Date.now()}`)
          .then(r => r.json())
          .then(data => setSuggestions(data.suggestions));
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const handleChange = async (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    if (!value) { setSuggestions([]); return; }
    try {
      const res  = await fetch(`${API}/suggest?q=${value}`);
      const data = await res.json();
      setSuggestions(data.suggestions);
    } catch {
      console.error("Server not reachable");
    }
  };
 

const navigate = useNavigate();

const handleSearch = (text = query) => {
  if (!text.trim()) return;
  navigate(`/results?q=${encodeURIComponent(text)}`);
};
  

  const handleKeyDown = (e) => {
    if (e.key === "Escape") { setSelectedIndex(-1); setSuggestions([]); }
    else if (e.key === "Tab" && ghostSuggestion) {
      e.preventDefault();
      setQuery(activeSuggestion);
      setSuggestions([]);
      setSelectedIndex(-1);
    } else if (e.key === "ArrowDown") {
      setSelectedIndex(p => p < suggestions.length - 1 ? p + 1 : p);
    } else if (e.key === "ArrowUp") {
      setSelectedIndex(p => p > 0 ? p - 1 : -1);
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0) {
        const sel = suggestions[selectedIndex].formula;
        setQuery(sel);
        handleSearch(sel);
      } else {
        handleSearch();
      }
    }
  };

  const handleSuggestionClick = (text) => { setQuery(text); handleSearch(text); };

  return (
   /* <Router>*/
      <Routes>
        <Route path="/" element={
          <MainUI
            handleSearch={handleSearch} query={query} setQuery={setQuery}
            darkMode={darkMode} setDarkMode={setDarkMode}
            selectedIndex={selectedIndex} setSelectedIndex={setSelectedIndex}
            suggestions={suggestions} setSuggestions={setSuggestions}
            handleChange={handleChange} handleKeyDown={handleKeyDown}
            ghostSuggestion={ghostSuggestion} listening={listening}
            recognitionRef={recognitionRef} handleSuggestionClick={handleSuggestionClick}
          />
        }/>
        <Route path="/results" element={<Results />} />
      </Routes>
    /*</Router>*/
  );
}

export default App;