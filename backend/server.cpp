
//  server.cpp  —  POSIX socket HTTP server (Linux / Render compatible)
//  Replaces the WinSock2 version.


#include <iostream>
#include <sstream>
#include <vector>
#include <string>
#include <cstring>
#include <fstream>
#include <unordered_map>
#include <cctype>
#include <algorithm>

// ── POSIX networking (Linux / macOS) 
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>      // close()
#include <sys/time.h>    // struct timeval  (replaces DWORD timeout)

// ── Project headers 
#include "trie.h"
#include "json.hpp"
#include "search.h"

using json = nlohmann::json;
using namespace std;


//  Helpers


string urlDecode(const string& str) {
    string decoded;
    char hex[3] = {0};
    for (size_t i = 0; i < str.size(); i++) {
        if (str[i] == '%') {
            if (i + 2 < str.size()) {
                hex[0] = str[i + 1];
                hex[1] = str[i + 2];
                decoded += static_cast<char>(strtol(hex, nullptr, 16));
                i += 2;
            }
        } else if (str[i] == '+') {
            decoded += ' ';
        } else {
            decoded += str[i];
        }
    }
    if (!decoded.empty() && decoded.back() == '.')
        decoded.pop_back();
    return decoded;
}


//  Material DB  (local to server — for autocomplete details)


unordered_map<string, string> materialMap;   // formula → material_id

struct Material {
    string formula;
    string crystal_system;
    float  density;
    float  band_gap;
};

unordered_map<string, int>  formulaToID;
unordered_map<int, Material> materialDB;



/*string getMaterialDetails(const string& formula) {
    if (!formulaToID.count(formula)) return "{}";
    int id = formulaToID.at(formula);
    const Material& m = materialDB.at(id);
    string j = "{";
    j += "\"formula\":\"" + m.formula + "\",";
    j += "\"crystal\":\"" + m.crystal_system + "\",";
    j += (m.density  >= 0) ? "\"density\":"  + to_string(m.density)  + "," : "\"density\":null,";
    j += (m.band_gap >= 0) ? "\"band_gap\":" + to_string(m.band_gap)       : "\"band_gap\":null";
    j += "}";
    return j;
}*/

void loadFromJSON(const string& filename) {
    ifstream file(filename);
    if (!file.is_open()) { cout << "Failed to open JSON file\n"; return; }

    nlohmann::json data;
    file >> data;
    int count = 0;

    for (auto& item : data) {
        string formula = (item.contains("formula") && item["formula"].is_string())
                         ? item["formula"].get<string>() : "Unknown";
        string material_id = (item.contains("material_id") && item["material_id"].is_string())
                             ? item["material_id"].get<string>() : "0";
        string crystal = (item.contains("crystal_system") && item["crystal_system"].is_string())
                         ? item["crystal_system"].get<string>() : "Unknown";
        float density  = (item.contains("density")  && item["density"].is_number())
                         ? item["density"].get<float>()  : 0.0f;
        float band_gap = (item.contains("band_gap") && item["band_gap"].is_number())
                         ? item["band_gap"].get<float>() : 0.0f;

        if (!formula.empty()) {
            push((char*)formula.c_str(), formula.length());
            materialDB[count]     = {formula, crystal, density, band_gap};
            formulaToID[formula]  = count;
            materialMap[formula]  = material_id;
            count++;
        }
    }
    cout << "Loaded " << count << " materials into Trie\n";
}

//  Autocomplete helpers


vector<string> tokenize(const string& query) {
    vector<string> tokens;
    string word;
    for (char c : query) {
        if (c == ' ') {
            if (!word.empty()) { tokens.push_back(word); word.clear(); }
        } else {
            word += tolower(c);
        }
    }
    if (!word.empty()) tokens.push_back(word);
    return tokens;
}

string getSuggestions(const string& query, bool isVoice = false) {
    if (!isVoice) {
        Node* temp  = root;
        bool  found = true;

        for (char c : query) {
            int idx = (int)(unsigned char)c;
            if (temp->children[idx]) temp = temp->children[idx];
            else { found = false; break; }
        }

        vector<string> suggestions;
        if (found) {
            // redirect stdout to capture DFS output
            streambuf* old = cout.rdbuf();
            stringstream ss;
            cout.rdbuf(ss.rdbuf());

            heap_size = 0;
            char buffer[256];
            DFS(temp, buffer, 0, (char*)query.c_str());

            // sort heap descending
            for (int i = 0; i < heap_size; i++)
                for (int j = i+1; j < heap_size; j++)
                    if (heap_freq[j] > heap_freq[i]) {
                        swap(heap_freq[i], heap_freq[j]);
                        swap(heap_words[i], heap_words[j]);
                    }
            for (int i = 0; i < heap_size; i++) cout << heap_words[i] << "\n";
            cout.rdbuf(old);

            string line;
            while (getline(ss, line))
                if (!line.empty()) suggestions.push_back(line);
        }

        string j = "[";
        for (size_t i = 0; i < suggestions.size(); i++) {
            j += "\"" + suggestions[i] + "\"";
            if (i != suggestions.size()-1) j += ",";
        }
        j += "]";
        return j;

    } else {
        // Voice mode: map spoken element names → symbols
        unordered_map<string,string> elementMap = {
            {"iron","Fe"},{"oxygen","O"},{"aluminum","Al"},{"silicon","Si"},
            {"copper","Cu"},{"carbon","C"},{"calcium","Ca"},{"sodium","Na"},
            {"magnesium","Mg"},{"potassium","K"},{"nitrogen","N"},{"sulfur","S"},
            {"phosphorus","P"},{"chlorine","Cl"},{"fluorine","F"},{"zinc","Zn"},{"cadmium","Cd"},{"germanium","Ge"}
            {"lead","Pb"},{"mercury","Hg"},{"silver","Ag"},{"gold","Au"},{"aluminium","Al"},{"hydrogen","H"}
        };
        unordered_map<string,string> compoundMap = {
            {"oxide","O"},{"nitride","N"},{"carbide","C"},{"sulfide","S"},
            {"phosphide","P"},{"chloride","Cl"},{"fluoride","F"},{"hydroxide","OH"},
            {"carbonate","CO3"},{"sulfate","SO4"},{"nitrate","NO3"},{"phosphate","PO4"},
            {"sulphide","S"},{"sulphate","SO4"}
        };

        vector<string> tokens   = tokenize(query);
        vector<string> elements;
        for (auto& w : tokens) {
            if (elementMap.count(w))   elements.push_back(elementMap[w]);
            else if (compoundMap.count(w)) elements.push_back(compoundMap[w]);
        }

        vector<string> suggestions;
        /*for (auto& p : materialMap) {
            const string& formula = p.first;
            bool match = true;
            for (auto& el : elements)
                if (formula.find(el, 0) == string::npos) { match = false; break; }
            if (match) suggestions.push_back(formula);
            if (suggestions.size() >= 7) break;
        }

        nlohmann::json j = nlohmann::json::array();
        for (auto& s : suggestions) j.push_back(s);
        return j.dump();*/
        vector<pair<int,string>> scored;

for (auto& p : materialMap) {
    const string& formula = p.first;
    int score = 0;
    int match_count = 0;

    // -------- match score --------
    for (auto& el : elements) {
        if (formula.find(el) != string::npos) {
            score += 10;
            match_count++;
        }
    }

    // -------- FULL MATCH BONUS 🔥 --------
    if (match_count == elements.size()) {
        score += 30;  // strong boost
    }

    // -------- PENALIZE EXTRA ELEMENTS 🔥 --------
    int extra_penalty = 0;

    for (int i = 0; i < formula.size(); i++) {
        if (isupper(formula[i])) {
            string symbol;
            symbol += formula[i];

            if (i + 1 < formula.size() && islower(formula[i+1])) {
                symbol += formula[i+1];
            }

            // if this element is NOT in query → penalize
            bool found = false;
            for (auto& el : elements) {
                if (symbol == el || symbol.find(el) != string::npos) {
                    found = true;
                    break;
                }
            }

            if (!found) extra_penalty += 5;
        }
    }

    score -= extra_penalty;

    // -------- push if relevant --------
    if (score > 0)
        scored.push_back({score, formula});
}

// -------- sort --------
sort(scored.rbegin(), scored.rend());

// -------- top 7 --------
for (auto& s : scored) {
    suggestions.push_back(s.second);
    if (suggestions.size() >= 7) break;
}
 nlohmann::json j = nlohmann::json::array();
        for (auto& s : suggestions) j.push_back(s);
        return j.dump();
    }

}

string buildRichSuggestions(const string& suggestions_json) {
    vector<string> formulas;
    string temp;
    for (char c : suggestions_json) {
        if (c!='"') { temp += c; }
        else { if (!temp.empty()) { formulas.push_back(temp); temp.clear(); } }
    }

    nlohmann::json output;
    output["suggestions"] = nlohmann::json::array();
    for (auto& f : formulas) {
        if (!formulaToID.count(f)) continue;
        int id = formulaToID[f];
        Material& m = materialDB[id];
        output["suggestions"].push_back({
            {"formula",  m.formula},
            {"crystal",  m.crystal_system},
            {"density",  m.density  >= 0 ? m.density  : 0.0f},
            {"band_gap", m.band_gap >= 0 ? m.band_gap : 0.0f}
        });
    }
    return output.dump();
}


//  CORS preflight helper

static void send_options(int client_fd) {
    const char* resp =
        "HTTP/1.1 204 No Content\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type\r\n"
        "Connection: close\r\n"
        "Content-Length: 0\r\n"
        "\r\n";
    send(client_fd, resp, strlen(resp), 0);
}


//  main

int main() {
    loadFromJSON("materials.json");
    initSearchEngine();

    // ── Read PORT from environment (Render sets $PORT automatically) 
    int port = 8080;
    const char* env_port = getenv("PORT");
    if (env_port) port = atoi(env_port);

    // ── Create socket 
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) { perror("socket"); return 1; }

    // Allow address reuse (avoids "Address already in use" on restart)
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    sockaddr_in server{};
    server.sin_family      = AF_INET;
    server.sin_addr.s_addr = INADDR_ANY;
    server.sin_port        = htons(port);

    if (bind(server_fd, (sockaddr*)&server, sizeof(server)) < 0)
        { perror("bind"); return 1; }

    if (listen(server_fd, 10) < 0)
        { perror("listen"); return 1; }

    cout << "Server running on port " << port << "\n";
    

    // ── Accept loop 
    while (true) {
        sockaddr_in client_addr{};
        socklen_t   addrlen = sizeof(client_addr);
        int client = accept(server_fd, (sockaddr*)&client_addr, &addrlen);
        if (client < 0) { perror("accept"); continue; }

        // 2-second receive timeout (replaces WinSock SO_RCVTIMEO with DWORD)
        struct timeval tv{ .tv_sec = 2, .tv_usec = 0 };
        setsockopt(client, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));

        char buf[4096] = {0};
        int  bytes     = recv(client, buf, sizeof(buf)-1, 0);
        if (bytes <= 0) { close(client); continue; }

        string request(buf, bytes);
        cout << "Request: " << request.substr(0, 120) << "\n";

        // ── CORS preflight
        if (request.rfind("OPTIONS", 0) == 0) {
            send_options(client);
            close(client);
            continue;
        }

        // ── /suggest?q=...
        if (request.find("/suggest?q=") != string::npos) {
            size_t pos = request.find("/suggest?q=") + 11;
            bool isVoice = (request.find("voice=true") != string::npos);

            string query;
            while (pos < request.size() && request[pos] != ' ' && request[pos] != '&')
                query += request[pos++];
            query = urlDecode(query);

            string raw        = getSuggestions(query, isVoice);
            string final_json = buildRichSuggestions(raw);

            string response =
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: application/json\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Connection: close\r\n"
                "Content-Length: " + to_string(final_json.size()) + "\r\n"
                "\r\n" + final_json;

            send(client, response.c_str(), response.size(), 0);
            close(client);
            continue;
        }

        // ── /search?q=... 
        if (request.find("/search?q=") != string::npos) {
            size_t pos = request.find("/search?q=") + 10;

            string query;
            while (pos < request.size() && request[pos] != ' ' && request[pos] != '&')
                query += request[pos++];
            query = urlDecode(query);

            increment_frequency(query.c_str(), query.length());
            cout << "Search: " << query << "\n";

            // parse optional weight params
            auto getParam = [&](const string& key, float def) -> float {
                size_t p = request.find(key + "=");
                if (p == string::npos) return def;
                p += key.size() + 1;
                string v;
                while (p < request.size() && request[p] != '&' && request[p] != ' ')
                    v += request[p++];
                return stof(v);
            };

            float w_struct = getParam("w_struct", 0.25f);
            float w_energy = getParam("w_energy", 0.25f);
            float w_elec   = getParam("w_elec",   0.25f);
            float w_comp   = getParam("w_comp",   0.25f);

            vector<Result> results = find_similar(query, 20, w_struct, w_energy, w_elec, w_comp);

            string body = "[";
            for (size_t i = 0; i < results.size(); i++) {
                body += "{";
                body += "\"material_id\":\""  + results[i].material_id   + "\",";
                body += "\"formula\":\""       + results[i].formula        + "\",";
                body += "\"crystal_system\":\"" + results[i].crystal_system + "\",";
                body += "\"struct\":"   + to_string(results[i].S_struct) + ",";
                body += "\"energy\":"   + to_string(results[i].S_energy) + ",";
                body += "\"elec\":"     + to_string(results[i].S_elec)   + ",";
                body += "\"comp\":"     + to_string(results[i].S_comp)   + ",";
                body += "\"explanation\":\"" + results[i].explanation    + "\",";
                body += "\"score\":"    + to_string(results[i].S_total);
                body += "}";
                if (i != results.size()-1) body += ",";
            }
            body += "]";

            string response =
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: application/json\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                "Connection: close\r\n"
                "Content-Length: " + to_string(body.size()) + "\r\n"
                "\r\n" + body;

            send(client, response.c_str(), response.size(), 0);
            close(client);
            continue;
        }

        // ── 404 fallback 
        const char* not_found =
            "HTTP/1.1 404 Not Found\r\n"
            "Access-Control-Allow-Origin: *\r\n"
            "Connection: close\r\n"
            "Content-Length: 0\r\n\r\n";
        send(client, not_found, strlen(not_found), 0);
        close(client);
    }

    close(server_fd);
    return 0;
}