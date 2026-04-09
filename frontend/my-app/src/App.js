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
<div style={{
  position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", overflow: "hidden",
}}>
  <div style={{
    position: "absolute", left: 0, right: 0,
    height: "30%",
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
          {[[350,300],[525,300],[700,300],[700,450],[875,450],[525,450],[700,300,700,450],[350,300,525,300]].slice(0,5).map(([cx,cy],i) =>
            <circle key={i} cx={cx} cy={cy} r="2.5" fill="#58a6ff" opacity="0.5"/>
          )}
          <circle cx="700" cy="450" r="4" fill="#58a6ff" opacity="0.6"/>
          <circle cx="525" cy="300" r="5" fill="#3fb950" opacity="0.5"/>
          <circle cx="875" cy="300" r="3"   fill="#3fb950" opacity="0.4"/>
          <circle cx="350" cy="300" r="3"   fill="#3fb950" opacity="0.4"/>
          <circle cx="525" cy="450" r="3"   fill="#3fb950" opacity="0.4"/>
          <circle cx="700" cy="300" r="3"   fill="#58a6ff" opacity="0.5"/>
          <circle cx="350" cy="300" r="3"   fill="#58a6ff" opacity="0.5"/>
          <circle cx="525" cy="300" r="3"   fill="#58a6ff" opacity="0.5"/>
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
      }}>
        
      </div>

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
          <img src={darkMode ? "/vecta_logo_updated-removebg-preview-2.png" : "/vecta_logo_updated-removebg-preview.png"} alt="Logo" style={{ width:300, marginBottom:12 }}/>
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
              justifyContent:"center", cursor:"default",
              transition:"all 0.2s",
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
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:"#6d7785" }}>{el.num}</div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:15, fontWeight:600, color:"#58a6ff" }}>{el.sym}</div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7, color:"#6d7785" }}>{el.name}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ width:"100%", maxWidth:640, animation:"fadeUp 0.6s 0.15s ease both", position:"relative" }}>
          <div style={{
            fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:!darkMode ? "#484f58" : "#8a9ab0",
            letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10,
            display:"flex", alignItems:"center", gap:8,
          }}>
            <span style={{ display:"inline-block", width:16, height:1, background:"#58a6ff", opacity:0.5 }}/>
            Query formula or material
          </div>

          <div style={{
            position:"relative", display:"flex", alignItems:"center",
            background: darkMode ? "rgba(10,18,30,0.9)" : "rgba(255,255,255,0.9)",
            border:darkMode ? `1px solid rgb(56, 253, 230)` : `3px solid rgba(56, 253, 230, 0.78)`,
            borderRadius:6, transition:"border-color 0.2s, box-shadow 0.2s",
          }}>
            <span style={{
              fontFamily:"'IBM Plex Mono',monospace", fontSize:12,
              color:"#58a6ff", padding:"0 14px", opacity:0.7, userSelect:"none",
            }}>λ ›</span>

            {/* Ghost text */}
            {query !== "" && ghostSuggestion && (
              <span style={{
                position:"absolute", left:50, top:"50%", transform:"translateY(-50%)",
                fontFamily:"'IBM Plex Mono',monospace", fontSize:16,
                pointerEvents:"none", whiteSpace:"nowrap",
              }}>
                <span style={{ color:"transparent" }}>{formatFormula(query)}</span>
                <span style={{ color: darkMode ? "#b1bdca" : "#929ba3" }}>{formatFormula(ghostSuggestion)}</span>
              </span>
            )}

            <input
              type="text" value={query}
              onChange={handleChange} onKeyDown={handleKeyDown}
              placeholder="e.g. NaCl, Fe₂O₃, SiO₂..."
              style={{
                flex:1, background:"transparent", border:"none", outline:"none",
                fontFamily:"'IBM Plex Mono',monospace", fontSize:15,
                color: darkMode ? "#cdd9e5" : "#1c2a3a",
                padding:"14px 0", caretColor:"#58a6ff",
              }}
            />

            <div style={{ display:"flex", alignItems:"center", padding:"0 8px", gap:4 }}>
              {query !== "" && (
                <button onClick={() => { setQuery(""); setSuggestions([]); setSelectedIndex(-1); }}
                  style={{
                    width:30, height:30, borderRadius:4, border:"1px solid transparent",
                    background:"transparent", color:"#484f58", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:13,
                  }}>✕</button>
              )}
              <button onClick={() => recognitionRef.current?.start()}
              
                style={{
                  width:30, height:30, borderRadius:4,
                  border: listening ? "1px solid rgba(248,81,73,0.3)" : "1px solid transparent",
                  background: listening ? "rgba(248,81,73,0.08)" : "transparent",
                  color: listening ? "#f85149" : "#484f58", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  animation: listening ? "micPulse 1s ease infinite" : "none",
                  
                }
              } onMouseEnter={e => {
                    if (!listening) {
                      e.currentTarget.style.transform = "scale(1.3)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!listening) {
                      e.currentTarget.style.transform = "scale(1)";
                      
                    }
                  }}
                >
                <FaMicrophone size={18}/>
                
                
              </button>
            </div>

            <button onClick={() => handleSearch()} style={{
              margin:5, padding:"8px 18px",
              background:darkMode?"rgba(56,139,253,0.12)":"rgba(56, 138, 253, 0.31)",
              border:"1px solid rgba(56,139,253,0.3)",
              borderRadius:4, color:darkMode?"#58a6ff":"#396fab",
              fontFamily:"'IBM Plex Mono',monospace", fontSize:11,
              letterSpacing:"0.08em", cursor:"pointer",
            }}>SEARCH</button>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div style={{
                position:"absolute", top:"calc(100% + 6px)", left:0, right:0,
                background: darkMode ? "rgba(8,13,22,0.97)" : "rgba(250,252,255,0.97)",
                border:`1px solid rgba(56,139,253,0.2)`,
                borderRadius:6, overflow:"hidden",
                backdropFilter:"blur(20px)", zIndex:100,
                boxShadow:"0 16px 40px rgba(0,0,0,0.4)",
              }}>
                {/* Header */}
                <div style={{
                  display:"grid", gridTemplateColumns:"2fr 2fr 1.2fr 1.2fr",
                  padding:"8px 16px",
                  borderBottom:`1px solid rgba(48,54,61,0.5)`,
                  background:"rgb(0, 255, 221)",
                }}>
                  {["Formula","Crystal System","Density","Band Gap"].map(h => (
                    <span key={h} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:"#000000", textTransform:"uppercase", letterSpacing:"0.1em" }}>{h}</span>
                  ))}
                </div>
                {suggestions.map((item, index) => (
                  <div key={index}
                    onClick={() => handleSuggestionClick(item.formula)}
                    style={{
                      display:"grid", gridTemplateColumns:"2fr 2fr 1.2fr 1.2fr",
                      padding:"10px 16px",
                      borderBottom:`1px solid rgba(48,54,61,0.25)`,
                      cursor:"pointer",
                      background: index === selectedIndex ? "rgba(53, 151, 255, 0.1)" : "transparent",
                      transition:"background 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(56, 253, 217, 0.68)"}
                    onMouseLeave={e => e.currentTarget.style.background = index === selectedIndex ? "rgba(56,139,253,0.08)" : "transparent"}
                  >
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:500, color: index === selectedIndex ? "#ff58f1" : (darkMode ? "#cdd9e5" : "#1c2a3a") }}>
                      {formatFormula(item.formula)}
                    </div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:index === selectedIndex ? "#58a6ff" : (darkMode?"#818d9d":"#484f58" )}}>{item.crystal}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:index === selectedIndex ? "#58a6ff" : (darkMode?"#818d9d":"#484f58" )}}>{item.density ? `${item.density} g/cm³` : "—"}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:index === selectedIndex ? "#58a6ff" : (darkMode?"#818d9d":"#484f58" )}}>{item.band_gap ? `${item.band_gap} eV` : "—"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
  //window.open(`${window.location.origin}/results?q=${encodeURIComponent(text)}`, "_blank");
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