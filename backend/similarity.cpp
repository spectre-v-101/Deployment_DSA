#include "similarity.h"
#include <cmath>
using namespace std;

double clamp(double x) {
    if (x < 0) return 0;
    if (x > 1) return 1;
    return x;
}

double sim_diff(double a, double b) {
    return clamp(1.0 - fabs(a - b));
}
// ─────────────────────────────────────────────────────────────────────────
// Density: ratio-based — 2x denser is 2x denser regardless of absolute value.
// A log-ratio kernel is the physically correct measure.
// max_ratio controls the "tolerance": at what ratio do we call it 0 similarity?
// A value of 10.0 means density differing by 10x or more → score = 0.
// ─────────────────────────────────────────────────────────────────────────
double density_sim(double rho1, double rho2, double max_ratio = 10.0) {
    if (rho1 <= 0 || rho2 <= 0) return 0.0;
    double log_ratio = fabs(log(rho1 / rho2));              // symmetric, unit-free
    double log_max   = log(max_ratio);
    return clamp(1.0 - (log_ratio / log_max));
}

// ─────────────────────────────────────────────────────────────────────────
// Band gap: absolute difference matters BUT the metal/semiconductor boundary
// is categorical — crossing it should hard-penalize regardless of gap values.
// sigma controls the decay width in eV (1.5 eV default: gaps within ~1.5 eV
// of each other score ~0.5; gaps within 0.3 eV score ~0.98).
// ─────────────────────────────────────────────────────────────────────────
double bandgap_sim(double bg1, double bg2,
                   bool is_metal1, bool is_metal2,
                   double sigma = 1.5) {
    if (is_metal1 != is_metal2)
        return 0.0;             // categorically different — no meaningful comparison

    if (is_metal1 && is_metal2)
        return 1.0;             // both metals: band gap = 0 for both by definition

    // Both are semiconductors/insulators: Gaussian decay on absolute eV difference
    double diff = fabs(bg1 - bg2);
    return exp(-(diff * diff) / (2.0 * sigma * sigma));
}
double crystal_similarity(string a, string b) {
    if (a == b) return 1.0;

    if ((a == "cubic" && b == "tetragonal") ||
        (a == "tetragonal" && b == "cubic"))
        return 0.7;

    if ((a == "hexagonal" && b == "trigonal") ||
        (a == "trigonal" && b == "hexagonal"))
        return 0.7;

    return 0.3;
}

double structural_similarity(Material1 &m1, Material1 &m2) {
    double crystal_sim = crystal_similarity(m1.crystal_system, m2.crystal_system);
    double density_s = density_sim(m1.density, m2.density);
    double volume_sim  = sim_diff(m1.volume/ m2.volume,1.0);

    return clamp(0.6 * crystal_sim + 0.3 * density_s + 0.1 * volume_sim);
}

double energetic_similarity(Material1 &m1, Material1 &m2) {
    double formation_sim = sim_diff(m1.formation_energy, m2.formation_energy);
    double hull_sim      = sim_diff(m1.energy_above_hull, m2.energy_above_hull);

    return clamp(0.35 * formation_sim + 0.65 * hull_sim);
}

double electronic_similarity(Material1 &m1, Material1 &m2) {
    double bandgap_s = bandgap_sim(m1.band_gap, m2.band_gap, m1.is_metal, m2.is_metal);
    double metal_sim   = (m1.is_metal == m2.is_metal) ? 1.0 : 0.0;

    return clamp(0.85 * bandgap_s + 0.15 * metal_sim);
}

double compositional_similarity_old(Material1 &m1, Material1 &m2) {
    double dot = 0.0, norm1 = 0.0, norm2 = 0.0;

    for (auto &p : m1.composition) {
        double v1 = p.second;
        double v2 = m2.composition.count(p.first) ? m2.composition[p.first] : 0.0;

        dot += v1 * v2;
        norm1 += v1 * v1;
    }

    for (auto &p : m2.composition) {
        norm2 += p.second * p.second;
    }

    if (norm1 == 0 || norm2 == 0) return 0;

    return dot / (sqrt(norm1) * sqrt(norm2));
}
#include <map>
#include <string>
#include <cctype>
//#include <cmath>
#include <stdexcept>

// ── helpers ───────────────────────────────────────────────────────────────────

// Read an optional non-negative number (int or decimal) at position i.
// Returns 1.0 if no number is present.
static double read_number(const std::string &s, int &i) {
    std::string buf;
    while (i < (int)s.size() && (std::isdigit(s[i]) || s[i] == '.'))
        buf += s[i++];
    return buf.empty() ? 1.0 : std::stod(buf);
}

// Forward declaration
static std::map<std::string, double>
parse_group(const std::string &formula, int &i);

// ── core recursive parser ─────────────────────────────────────────────────────
//
// Parses from position i until end-of-string OR a closing bracket ) or ].
// Returns the element counts found (without applying any outer multiplier).
// On exit, i points to the character AFTER the closing bracket (if any).
//
static std::map<std::string, double>
parse_group(const std::string &formula, int &i)
{
    std::map<std::string, double> counts;
    int n = (int)formula.size();

    while (i < n) {
        char c = formula[i];

        // ── closing bracket: end this group ───────────────────────────────
        if (c == ')' || c == ']') {
            i++;                          // consume ')' or ']'
            return counts;                // multiplier applied by caller
        }

        // ── opening bracket: recurse into sub-group ────────────────────────
        if (c == '(' || c == '[') {
            i++;                          // consume '(' or '['
            auto sub   = parse_group(formula, i);          // recurse
            double mul = read_number(formula, i);           // e.g. '2' in (OH)2

            for (auto &p : sub)
                counts[p.first] += p.second * mul;

            continue;
        }

        // ── element symbol (starts with uppercase letter) ──────────────────
        if (std::isupper(c)) {
            // collect symbol: one uppercase + zero or more lowercase
            std::string elem;
            elem += formula[i++];
            while (i < n && std::islower(formula[i]))
                elem += formula[i++];

            double cnt = read_number(formula, i);  // stoichiometric count
            counts[elem] += cnt;
            continue;
        }

        // ── anything else (charges like '+', '-', spaces, dots) ───────────
        i++;
    }

    return counts;
}

// ── public entry point ────────────────────────────────────────────────────────
std::map<std::string, double> parse_formula(const std::string &formula) {
    int i = 0;
    return parse_group(formula, i);
}

// ── similarity using parsed formula ──────────────────────────────────────────
double compositional_similarity(Material1 &m1, Material1 &m2) {
    auto comp1 = parse_formula(m1.formula);
    auto comp2 = parse_formula(m2.formula);

    double dot = 0.0, norm1 = 0.0, norm2 = 0.0;

    // --- Cosine similarity ---
    for (auto &p : comp1) {
        double v1 = p.second;
        double v2 = comp2.count(p.first) ? comp2.at(p.first) : 0.0;

        dot   += v1 * v2;
        norm1 += v1 * v1;
    }

    for (auto &p : comp2) {
        norm2 += p.second * p.second;
    }

    double cosine = 0.0;
    if (norm1 > 0.0 && norm2 > 0.0) {
        cosine = dot / (std::sqrt(norm1) * std::sqrt(norm2));
    }

    // --- Jaccard similarity (element sets) ---
    int intersection = 0;
    for (auto &p : comp1) {
        if (comp2.count(p.first)) {
            intersection++;
        }
    }

    int union_count = comp1.size() + comp2.size() - intersection;

    double jaccard = 0.0;
    if (union_count > 0) {
        jaccard = (double)intersection / union_count;
    }

    // --- Final score ---
    return cosine * jaccard;
}
double compositional_similarity_old2(Material1 &m1, Material1 &m2) {
    auto comp1 = parse_formula(m1.formula);
    auto comp2 = parse_formula(m2.formula);

    double dot = 0.0, norm1 = 0.0, norm2 = 0.0;

    for (auto &p : comp1) {
        double v1 = p.second;
        double v2 = comp2.count(p.first) ? comp2.at(p.first) : 0.0;
        dot   += v1 * v2;
        norm1 += v1 * v1;
    }
    for (auto &p : comp2)
        norm2 += p.second * p.second;

    if (norm1 == 0.0 || norm2 == 0.0) return 0.0;
    return dot / (std::sqrt(norm1) * std::sqrt(norm2));
}
/*```

**How the recursion works:**
```
K4[Fe(CN)6]
     │
     ├─ K  × 4
     └─ [...]  × 1          ← parse_group called recursively
            ├─ Fe × 1
            └─ (...)  × 6   ← parse_group called recursively again
                   ├─ C × 1
                   └─ N × 1

Final: { K:4, Fe:1, C:6, N:6 }*/