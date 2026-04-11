#ifndef TRIE_H
#define TRIE_H

#include <iostream>
#include <cstring>

struct Node{
    Node* children[128];
    bool end;
    int frequency;
    int max_subtree_freq;
    
};

extern Node* root;
extern int heap_size;
extern std::string heap_words[20];
extern int heap_freq[20];
extern int K;

// core trie functions
Node* createNode();
void push(char* word, int n);
void increment_frequency(const char* word, int n);
void DFS(Node* node, char* word, int depth, char* prefix);

#endif