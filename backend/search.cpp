#include <iostream>
#include <fstream>
#include <unordered_map>
#include <vector>
#include "json.hpp"
#include "search.h"

using namespace std;
using json = nlohmann::json;

#define MAX 30000

Material1 materialDB_search[MAX];
unordered_map<string, int> formulaToID_search;
int search_count = 0;
bool isLoaded = false;

// 🔥 Load JSON
void loadFromJSON_search(const string& filename) {
    ifstream file(filename);

    if (!file.is_open()) {
        cout << "Failed to open JSON file\n";
        return;
    }

    json data;
    file >> data;

    search_count = 0;

    for (auto& item : data) {

    Material1 m;
    if (item.contains("material_id") && !item["material_id"].is_null()) {
    m.material_id = item["material_id"].get<string>();
} else {
    m.material_id = "MISSING"; // debug marker
}
    // 🔹 STRING
    if(item.contains("formula") && item["formula"].is_string())
        m.formula = item["formula"];
    else
        m.formula = "Unknown";

    if(item.contains("crystal_system") && item["crystal_system"].is_string())
        m.crystal_system = item["crystal_system"];
    else
        m.crystal_system = "Unknown";

    // 🔹 DOUBLE / FLOAT
    if(item.contains("density") && item["density"].is_number())
        m.density = item["density"];
    else
        m.density = 0.0;

    if(item.contains("band_gap") && item["band_gap"].is_number())
        m.band_gap = item["band_gap"];
    else
        m.band_gap = 0.0;

    if(item.contains("volume") && item["volume"].is_number())
        m.volume = item["volume"];
    else
        m.volume = 0.0;

    if(item.contains("formation_energy") && item["formation_energy"].is_number())
        m.formation_energy = item["formation_energy"];
    else
        m.formation_energy = 0.0;

    if(item.contains("energy_above_hull") && item["energy_above_hull"].is_number())
        m.energy_above_hull = item["energy_above_hull"];
    else
        m.energy_above_hull = 0.0;

    // 🔹 INT
    if(item.contains("nsites") && item["nsites"].is_number_integer())
        m.nsites = item["nsites"];
    else
        m.nsites = 0;

    // 🔹 BOOL
    if(item.contains("is_metal") && item["is_metal"].is_boolean())
        m.is_metal = item["is_metal"];
    else
        m.is_metal = false;

    // 🔹 MAP (composition)
    if(item.contains("composition") && item["composition"].is_object()){
        for(auto &el : item["composition"].items()){
            if(el.value().is_number()) {
                m.composition[el.key()] = el.value();
            }
        }
    }

    // 🔹 Insert into DB
    if (!m.formula.empty()) {
        materialDB_search[search_count] = m;
        formulaToID_search[m.formula] = search_count;
        search_count++;
    }
}

    cout << "Search DB Loaded: " << search_count << " materials\n";
}

// 🔥 Init
void initSearchEngine() {
    if (!isLoaded) {
        loadFromJSON_search("materials.json");
        isLoaded = true;
    }
}
// σ²=0.0625 → score drops to ~0.6 at 0.25 away from peak (reasonable boundary)
auto hi  = [](double x) { return exp(-pow(x - 1.0, 2) / (2 * 0.0625)); };
auto lo  = [](double x) { return exp(-pow(x - 0.0, 2) / (2 * 0.0625)); };
auto mid = [](double x) { return exp(-pow(x - 0.5, 2) / (2 * 0.0625)); };
// 🔥 Find Similar
string generate_explanation(const Result &r, float w_struct, float w_energy, float w_elec, float w_comp) {
    string exp = "";

    // ─────────────────────────────────────────────────────────────────
    // 1. COMPOSITION
    // ─────────────────────────────────────────────────────────────────
    // S_comp = cosine * jaccard, so it captures both stoichiometric
    // ratio similarity AND element-set overlap simultaneously.
    // A high score requires BOTH conditions to be true.
    exp += "[Composition]\\n";
    if (r.S_comp > 0.9)
        exp += "  Strong candidate for compositional equivalence; materials share nearly identical elemental makeup and stoichiometric ratios. Any deeper chemical relationship (e.g., substitution or electronic equivalence) requires additional validation.\\n";
    else if (r.S_comp > 0.6)
        exp += "  Moderate compositional similarity: partial element overlap "
               "with differing stoichiometry or one/two substituted elements. "
               "May belong to the same material family with modified properties.\\n";
    else if (r.S_comp > 0.3)
        exp += "  Low compositional similarity: few shared elements or "
               "significantly different ratios. Chemistry likely diverges; "
               "similar properties, if any, arise from other factors.\\n";
    else
        exp += "  Negligible compositional similarity: largely different "
               "elements. Any overall similarity is structurally or "
               "energetically driven, not chemical.\\n";

    // ─────────────────────────────────────────────────────────────────
    // 2. STRUCTURE
    // ─────────────────────────────────────────────────────────────────
    // NOTE: density_sim and volume_sim via raw sim_diff are only
    // meaningful if values are pre-normalized. Flag when crystal_sim
    // dominates (which it almost always will given the unit issue).
    exp += "[Structure]\\n";
    if (r.S_struct > 0.85)
        exp +=  " High structural similarity: structural descriptors are closely matched, indicating similar symmetry features and atomic packing motifs."
               "May exhibit similar mechanical and transport properties."
                "Exact crystallographic equivalence should be verified separately.\\n";
    else if (r.S_struct > 0.6) {
        exp += "  Moderate structural similarity: compatible symmetry class "
               "(e.g. cubic-tetragonal or hexagonal-trigonal relationship) "
               "but density or volume differ. Structures may be distorted "
               "variants of each other.\\n";
    }
    else if (r.S_struct > 0.3)
        exp += "  Low structural similarity: different crystal systems and/or "
               "incompatible packing. Shared properties unlikely to stem "
               "from structural resemblance.\\n";
    else
        exp += "  Negligible structural similarity: fundamentally different "
               "crystal symmetry and packing. No structural basis for "
               "analogous behaviour.\\n";

    // ─────────────────────────────────────────────────────────────────
    // 3. ENERGETICS
    // ─────────────────────────────────────────────────────────────────
    // hull_sim (weight 0.65) dominates over formation_sim (0.35).
    // energy_above_hull is the physically critical stability descriptor;
    // formation_energy alone conflates stability with bonding strength.
    exp += "[Thermodynamic Stability]\\n";
    if (r.S_energy > 0.9)
        exp += "  High energetic similarity: comparable distance from the "
               "convex hull and similar formation energy. Both materials "
               "likely occupy the same stability regime "
               "(stable / metastable / unstable).\\n";
    else if (r.S_energy > 0.6)
        exp += "  Moderate energetic similarity: broadly similar stability "
               "landscape but formation energies diverge. One material may "
               "be more exothermically bonded while maintaining comparable "
               "hull proximity.\\n";
    else if (r.S_energy > 0.3)
        exp += "  Low energetic similarity: different thermodynamic stability "
               "regimes. One is likely significantly closer to or on the "
               "hull; synthesis/stability conditions will differ.\\n";
    else
        exp += "  Negligible energetic similarity: materials sit in "
               "fundamentally different regions of thermodynamic stability. "
               "Distinct synthesis windows and degradation behaviour expected.\\n";

    // ─────────────────────────────────────────────────────────────────
    // 4. ELECTRONIC
    // ─────────────────────────────────────────────────────────────────
    // Warn explicitly when is_metal differs — a non-zero band_gap sim
    // between a metal and insulator is physically misleading.
    exp += "[Electronic Character]\\n";

    bool metal_mismatch = (r.S_elec < 0.15); // proxy: metal_sim=0 pulls score down hard
    if (metal_mismatch) {
        exp += "  WARNING: one material is metallic and the other is "
               "insulating/semiconducting. Band gap comparison is not "
               "meaningful across this boundary. Electronic similarity "
               "score should be treated with caution.\\n";
    } else if (r.S_elec > 0.9)
        exp += "  High electronic similarity: closely matched band gap and "
               "same metallic classification. Likely comparable optical "
               "absorption edge, carrier effective mass regime, and "
               "conductivity type.\\n";
    else if (r.S_elec > 0.6)
        exp += "  Moderate electronic similarity: same metallic class but "
               "band gap values differ. May share broad optical/electronic "
               "behaviour but quantitative properties (e.g. absorption "
               "onset, doping response) will differ.\\n";
    else if (r.S_elec > 0.3)
        exp += "  Low electronic similarity: band gap differs substantially. "
               "Electronic and optical applications are unlikely to be "
               "interchangeable.\\n";
    else
        exp += "  Negligible electronic similarity: different band gap range "
               "and/or conflicting metallic character.\\n";

    // ─────────────────────────────────────────────────────────────────
    // 5. DOMINANT FACTOR — with score-aware nuance
    // ─────────────────────────────────────────────────────────────────
    // Raw contribution = weight × score.
    // Distinguish: high-weight + high-score (genuine driver)
    //          vs  high-weight + low-score  (weight artefact, not a match signal)
    float c_comp   = w_comp   * r.S_comp;
    float c_struct = w_struct * r.S_struct;
    float c_energy = w_energy * r.S_energy;
    float c_elec   = w_elec   * r.S_elec;

    float max_c = max({c_comp, c_struct, c_energy, c_elec});

    // Identify which score and label belong to the dominant contributor
    float  dom_score;
    string dom_name, dom_detail;

    if (max_c == c_comp) {
        dom_score  = r.S_comp;
        dom_name   = "compositional";
        dom_detail = "shared elemental chemistry";
    } else if (max_c == c_struct) {
        dom_score  = r.S_struct;
        dom_name   = "structural";
        dom_detail = "crystal symmetry and packing";
    } else if (max_c == c_energy) {
        dom_score  = r.S_energy;
        dom_name   = "thermodynamic";
        dom_detail = "hull proximity and formation energy";
    } else {
        dom_score  = r.S_elec;
        dom_name   = "electronic";
        dom_detail = "band gap and metallic character";
    }

    exp += "[Overall Driver]\\n";

    if (dom_score > 0.6) {
        // Genuinely high similarity in the dominant dimension
        exp += "  Overall similarity is genuinely driven by " + dom_name +
               " affinity (" + dom_detail + "). "
               "The high weight and high score together indicate a "
               "physically meaningful match in this dimension.\\n";
    } else {
        // Weight is large but the actual score is mediocre/low —
        // the dimension dominates the sum arithmetically, not physically
        exp += "  The largest weighted contribution comes from " + dom_name +
               " (high weight), but the raw score is only moderate/low. "
               "This is a weighting artefact: no single dimension shows "
               "strong similarity. Interpret the overall score conservatively.\\n";
    }

    // ─────────────────────────────────────────────────────────────────
    // 6. CROSS-CONSISTENCY SANITY CHECK
    // ─────────────────────────────────────────────────────────────────
    // High structural + low compositional is physically suspicious
    // (different atoms, same crystal = possible but worth flagging).
  // Widths: consistent and physically motivated

// All three use the same σ — symmetric, no asymmetric inflation

/*struct Hypothesis { string name, note; double conf; };
vector<Hypothesis> hyps;

hyps.push_back({
    "Polymorphs",
    "Same or near-identical composition with different crystal structure. "
    "Likely polymorphs (e.g. TiO2 rutile/anatase, SiO2 quartz/cristobalite). "
    "Check which phase is thermodynamically stable at target T/P.",
    hi(r.S_comp) * lo(r.S_struct)
    // No blending — polymorph signal is clearest when BOTH conditions are extreme
});

hyps.push_back({
    "Isostructural",
    "Same crystal prototype but different elemental chemistry "
    "(e.g. NaCl/MgO rocksalt, perovskite family ABO3). "
    "Properties may differ substantially despite structural match.",
    hi(r.S_struct) * lo(r.S_comp)
    // Restored to pure lo(S_comp) — penalizes correctly as comp rises
});

hyps.push_back({
    "Solid Solution / Isovalent Substitution",
    "High structural match with moderate compositional overlap. "
    "Likely derived via substitution (e.g. Ga->In, Ba->Sr). "
    "Properties vary continuously across alloy series.",
    hi(r.S_struct) * mid(r.S_comp) * mid(r.S_elec)
});

hyps.push_back({
    "Isoelectronic Analogues",
    "Different composition but matching structure and electronic character. "
    "Likely same valence electron count (e.g. GaAs/Ge/ZnSe).",
    hi(r.S_struct) * hi(r.S_elec) * lo(r.S_comp)
});

hyps.push_back({
    "Related Phases (same system)",
    "Moderate compositional similarity with different structure. "
    "Likely different stoichiometric phases (e.g. TiO/TiO2, Fe2O3/Fe3O4).",
    mid(r.S_comp) * lo(r.S_struct)
});

hyps.push_back({
    "Coincidental Hull Proximity",
    "Similar thermodynamic stability but no structural/compositional relation. "
    "Energy similarity is coincidental.",
    hi(r.S_energy) * lo(r.S_comp) * lo(r.S_struct) * lo(r.S_elec)
});

double dup_conf =
    hi(r.S_comp) * hi(r.S_struct) * hi(r.S_energy) * hi(r.S_elec);

hyps.push_back({
    "Near-identical / Duplicate Entry",
    "All similarity dimensions are high. Likely same compound or duplicate entry.",
    dup_conf
});

// ── Competition suppression (only the one that's physically justified) ──
// Duplicate dominating → suppress all others (they're noise if it's the same material)
if (dup_conf > 0.7)
    for (auto &h : hyps)
        if (h.name != "Near-identical / Duplicate Entry")
            h.conf *= 0.2;

// Solid solution is strictly more specific than isostructural when strong —
// suppress isostructural only, and only moderately
double solid_conf = 0.0;
for (auto &h : hyps)
    if (h.name == "Solid Solution / Isovalent Substitution")
        solid_conf = h.conf;

if (solid_conf > 0.6)
    for (auto &h : hyps)
        if (h.name == "Isostructural")
            h.conf *= 0.6;

// ── Ranking + output (unchanged) ──
sort(hyps.begin(), hyps.end(),
     [](const Hypothesis &a, const Hypothesis &b) {
         return a.conf > b.conf;
     });

const double MIN_CONF = 0.25;
bool any_fired = false;

for (auto &h : hyps) {
    if (h.conf < MIN_CONF) continue;
    if (!any_fired) {
        exp += "[Relationship Hypotheses]\\n";
        any_fired = true;
    }
    string label = (h.conf > 0.70) ? "Strong"
                 : (h.conf > 0.45) ? "Moderate"
                 :                   "Weak";
    exp += "  [" + label + " | "
        +  to_string((int)round(h.conf * 100)) + "%] "
        +  h.name + "\\n"
        +  "  " + h.note + "\\n\\n";
}

if (!any_fired)
    exp += "[Relationship] Ambiguous — no hypothesis clears confidence "
           "threshold. Manual inspection recommended.\\n";*/

    return exp;
}
string generate_explanation_old(const Result &r, float w_struct, float w_energy, float w_elec, float w_comp) {
    string exp = "";

    // Composition
    if (r.S_comp > 0.85)
        exp += "-> Very similar elemental composition; likely comparable chemistry.\\n";
    else if (r.S_comp > 0.6)
        exp += "-> Moderate overlap in elements; partial chemical similarity.\\n";
    else
        exp += "-> Chemically different composition.\\n";

    // Structure
    if (r.S_struct > 0.85)
        exp += "-> Similar crystal symmetry and packing characteristics.\\n";
    else if (r.S_struct > 0.6)
        exp += "-> Some structural resemblance (symmetry or density overlap).\\n";
    else
        exp += "-> Different structural arrangement and symmetry.\\n";

    // Energy
    if (r.S_energy > 0.85)
        exp += "-> Comparable thermodynamic stability (formation/hull energy).\\n";
    else if (r.S_energy > 0.6)
        exp += "-> Moderately similar stability landscape.\\n";
    else
        exp += "-> Different thermodynamic stability.\\n";

    // Electronic
    if (r.S_elec > 0.85)
        exp += "-> Similar band gap and metallic classification (energy scale of excitation).\\n";
    else if (r.S_elec > 0.6)
        exp += "-> Partial similarity in band gap or metallic behavior.\\n";
    else
        exp += "-> Different band gap or metallic nature.\\n";
    float c_comp = w_comp * r.S_comp;
float c_struct = w_struct * r.S_struct;
float c_energy = w_energy * r.S_energy;
float c_elec = w_elec * r.S_elec;
exp += "-> Overall similarity influenced mainly by ";
double max_c = max(max(c_comp, c_struct), max(c_energy, c_elec));

if (max_c == c_comp)
    exp += "composition similarity.\\n";
else if (max_c == c_struct)
    exp += "structure symmetry similarity.\\n";
else if (max_c == c_energy)
    exp += "thermodynamic similarity.\\n";
else
    exp += "electronic (band gap) similarity.\\n";
    return exp;
}

vector<Result> find_similar(string formula, int top_k , float struct_weight, float energy_weight, float elec_weight, float comp_weight) {

    if (!isLoaded) initSearchEngine();

    vector<Result> results;

    if (!formulaToID_search.count(formula)) {
        return results;
    }

    int id = formulaToID_search[formula];
    Material1 query = materialDB_search[id];

    // 🔥 Min Heap (size = top_k)
    Result heap[20];  // safe buffer
    int heap_size = 0;

    // -------- heapify up --------
    auto heapify_up = [&](int i){
        while(i > 0){
            int parent = (i - 1) / 2;
            if(heap[parent].S_total > heap[i].S_total){
                swap(heap[parent], heap[i]);
                i = parent;
            } else break;
        }
    };

    // -------- heapify down --------
    auto heapify_down = [&](int i){
        while(true){
            int left = 2*i + 1;
            int right = 2*i + 2;
            int smallest = i;

            if(left < heap_size && heap[left].S_total < heap[smallest].S_total)
                smallest = left;

            if(right < heap_size && heap[right].S_total < heap[smallest].S_total)
                smallest = right;

            if(smallest != i){
                swap(heap[i], heap[smallest]);
                i = smallest;
            } else break;
        }
    };

    // 🔥 MAIN LOOP (NO FULL SORT)
    for (int i = 0; i < search_count; i++) {
        if (i == id) continue;

        Result r;
        r.formula = materialDB_search[i].formula;
        r.crystal_system = materialDB_search[i].crystal_system;
        r.material_id = materialDB_search[i].material_id;
        r.S_struct = structural_similarity(query, materialDB_search[i]);
        r.S_energy = energetic_similarity(query, materialDB_search[i]);
        r.S_elec   = electronic_similarity(query, materialDB_search[i]);
        r.S_comp   = compositional_similarity(query, materialDB_search[i]);
        r.explanation=generate_explanation(r, struct_weight, energy_weight, elec_weight, comp_weight);

        r.S_total = (r.S_struct * struct_weight) + (r.S_energy * energy_weight) + (r.S_elec * elec_weight) + (r.S_comp * comp_weight);

        // 🔥 heap logic
        if(heap_size < top_k){
            heap[heap_size] = r;
            heapify_up(heap_size);
            heap_size++;
        }
        else if(r.S_total > heap[0].S_total){
            heap[0] = r;
            heapify_down(0);
        }
    }

    // 🔥 convert heap → vector
    for(int i = 0; i < heap_size; i++){
        results.push_back(heap[i]);
    }

    // 🔥 final small sort (only top_k elements)
    for(int i = 0; i < results.size(); i++){
        for(int j = i+1; j < results.size(); j++){
            if(results[j].S_total > results[i].S_total){
                swap(results[i], results[j]);
            }
        }
    }

    return results;
}
vector<Result> find_similar_old(string formula, int top_k) {

    if (!isLoaded) initSearchEngine();

    vector<Result> results;

    if (!formulaToID_search.count(formula)) {
        return results;
    }

    int id = formulaToID_search[formula];
    Material1 query = materialDB_search[id];

    for (int i = 0; i < search_count; i++) {
        if (i == id) continue;

        Result r;
        r.formula = materialDB_search[i].formula;
        r.crystal_system = materialDB_search[i].crystal_system;
        r.material_id = materialDB_search[i].material_id;
        r.S_struct = structural_similarity(query, materialDB_search[i]);
        r.S_energy = energetic_similarity(query, materialDB_search[i]);
        r.S_elec   = electronic_similarity(query, materialDB_search[i]);
        r.S_comp   = compositional_similarity(query, materialDB_search[i]);

        r.S_total = (r.S_struct + r.S_energy + r.S_elec + r.S_comp);

        results.push_back(r);
    }

    // 🔥 manual sort (descending)
    for(int i = 0; i < results.size(); i++){
        for(int j = i+1; j < results.size(); j++){
            if(results[j].S_total > results[i].S_total){
                swap(results[i], results[j]);
            }
        }
    }

    if(results.size() > top_k)
        results.resize(top_k);

    return results;
}