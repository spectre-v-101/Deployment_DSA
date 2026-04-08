#ifndef SIMILARITY_H
#define SIMILARITY_H

#include <string>
#include <map>
using namespace std;

struct Material1 {
    string formula;
    double band_gap, density, volume;
    double formation_energy, energy_above_hull;
    int nsites;
    bool is_metal;
    string crystal_system;
    map<string, double> composition;
    string material_id;
};

double structural_similarity(Material1 &m1, Material1 &m2);
double energetic_similarity(Material1 &m1, Material1 &m2);
double electronic_similarity(Material1 &m1, Material1 &m2);
double compositional_similarity(Material1 &m1, Material1 &m2);

#endif