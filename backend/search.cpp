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

// 🔥 Find Similar
string generate_explanation(const Result &r) {
    string exp = "";

    // Composition
    if (r.S_comp > 0.85)
        exp += "-> Very similar composition; \\n";
    else if (r.S_comp > 0.6)
        exp += "-> Moderate compositional similarity; \\n";
    else
        exp += "-> Different composition; \\n";

    // Structure
    if (r.S_struct > 0.85)
        exp += "-> structure closely matches; \\n";
    else if (r.S_struct > 0.6)
        exp += "-> partially similar structure; \\n";
    else
        exp += "-> different crystal structure; \\n";

    // Energy
    if (r.S_energy > 0.85)
        exp += "-> energetically very similar; \\n";
    else if (r.S_energy > 0.6)
        exp += "-> moderate energy similarity; \\n";
    else
        exp += "-> energy differs significantly; \\n";

    // Electronic
    if (r.S_elec > 0.85)
        exp += "-> electronic properties align well \\n";
    else if (r.S_elec > 0.6)
        exp += "-> some electronic similarity \\n";
    else
        exp += "-> electronic behavior is different \\n";

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
        r.explanation=generate_explanation(r);

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