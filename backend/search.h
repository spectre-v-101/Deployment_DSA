#ifndef SEARCH_H
#define SEARCH_H

#include <vector>
#include <string>
#include "similarity.h"
using namespace std;

struct Result {
    string formula;
    string crystal_system;
    double S_struct;
    double S_energy;
    double S_elec;
    double S_comp;
    double S_total;
    string material_id;
    string explanation;
};

void initSearchEngine();
vector<Result> find_similar(string formula, int top_k, float struct_weight, float energy_weight, float elec_weight, float comp_weight);

#endif