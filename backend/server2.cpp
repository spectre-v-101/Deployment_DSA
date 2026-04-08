#include <iostream>
#include <sstream>
#include <vector>
#include <string>
#include <cstring>

#include "trie.h"

using namespace std;

/* ---------- GLOBAL TRIE INITIALIZATION ---------- */
/* This runs during Lambda cold start */

bool initialized = false;

void initializeTrie() {

    if(initialized) return;

    push((char*)"hello world", strlen("hello world"));
    push((char*)"hello there", strlen("hello there"));
    push((char*)"good morning", strlen("good morning"));
    push((char*)"good night", strlen("good night"));

    initialized = true;
}

/* ---------- SUGGESTION FUNCTION ---------- */

string getSuggestions(string query){

    Node* temp = root;
    bool found = true;

    for(int i=0;i<query.size();i++){

        int index = (int)query[i];

        if(temp->children[index])
            temp = temp->children[index];
        else{
            found = false;
            break;
        }
    }

    vector<string> suggestions;

    if(found){

        char buffer[256];

        streambuf* old = cout.rdbuf();
        stringstream ss;
        cout.rdbuf(ss.rdbuf());

        DFS(temp,buffer,0,(char*)query.c_str());

        cout.rdbuf(old);

        string line;

        while(getline(ss,line)){
            if(line.size()>0)
                suggestions.push_back(line);
        }
    }

    string json = "[";

    for(int i=0;i<suggestions.size();i++){
        json += "\"" + suggestions[i] + "\"";
        if(i != suggestions.size()-1) json += ",";
    }

    json += "]";

    return json;
}

/* ---------- LAMBDA HANDLER ---------- */

string handleRequest(string path){

    initializeTrie();

    string query = "";

    /* ---------- AUTOCOMPLETE ---------- */

    if(path.find("/suggest?q=") != string::npos){

        size_t pos = path.find("/suggest?q=");
        pos += 11;

        while(pos < path.size() && path[pos] != '&'){
            query += path[pos];
            pos++;
        }

        return getSuggestions(query);
    }

    /* ---------- SAVE SEARCH ---------- */

    else if(path.find("/search?q=") != string::npos){

        size_t pos = path.find("/search?q=");
        pos += 10;

        while(pos < path.size() && path[pos] != '&'){
            query += path[pos];
            pos++;
        }

        if(query.size() > 0){
            push((char*)query.c_str(), query.length());
        }

        return "{\"status\":\"ok\"}";
    }

    return "{\"error\":\"invalid endpoint\"}";
}

/* ---------- MAIN (LOCAL TESTING) ---------- */

int main(){

    initializeTrie();

    string test = "/suggest?q=he";

    cout << handleRequest(test) << endl;

    return 0;
}