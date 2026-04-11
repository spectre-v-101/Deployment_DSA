#include <iostream>
#include <cstring>

using namespace std;

string heap_words[20];
 int heap_freq[20];

 int heap_size = 0;
int K = 7;
struct Node{
    struct Node* children[128];
    bool end;
    int frequency;
    int max_subtree_freq;
    
    
};
struct Node* root=NULL;

struct Node * createNode(){
    struct Node * newnode=new struct Node;
    for(int i =0;i<128;i++){
        newnode->children[i]=NULL;
    }
    newnode->end=false;
    newnode->frequency=0;
    newnode->max_subtree_freq=0;
    return newnode;
}
void push(char * word,int n){
    struct Node* temp=root;
    if(root==NULL){
            struct Node* newnode=createNode();
            temp=root=newnode;
        }
    struct Node* path[256]; 
    int depth=0;
    //path[depth++] = root;
    for(int i=0;i<n;i++){
        int index=(int)word[i];
        
        
        if(temp->children[index]==NULL){
            struct Node* newnode=createNode();
            temp->children[index]=newnode;
            temp=temp->children[index];
        }
        else{
            temp=temp->children[index];
        }
        path[depth++]=temp;
    }
    //bool already_exists = temp->end;
    temp->end=true;
    //if(!already_exists){
    temp->frequency++;
    //}
    for(int i=0;i<depth;i++){ 
        if(path[i]->max_subtree_freq < temp->frequency){
             path[i]->max_subtree_freq = temp->frequency; 
    }
} 
}

void increment_frequency(const char* word, int n) {
    struct Node* temp = root;

    // Only traverse — never create new nodes
    for (int i = 0; i < n; i++) {
        int index = (int)word[i];
        if (temp->children[index] == NULL)
            return; // word not in trie — abort silently
        temp = temp->children[index];
    }

    // Only update if this is a real terminal node (i.e. a known formula)
    if (!temp->end) return;

    temp->frequency++;

    // Bubble up max_subtree_freq along the path
    // Need to re-traverse since we don't store the path here
    struct Node* path_nodes[256];
    int depth = 0;
    struct Node* cur = root;
    for (int i = 0; i < n; i++) {
        cur = cur->children[(int)word[i]];
        path_nodes[depth++] = cur;
    }
    int new_freq = temp->frequency;
    for (int i = 0; i < depth; i++) {
        if (path_nodes[i]->max_subtree_freq < new_freq)
            path_nodes[i]->max_subtree_freq = new_freq;
    }
}
void DFS(struct Node * node , char * word , int depth,char * prefix){
    if(node==NULL){
        return;
    }
    int currentMin = (heap_size==K) ? heap_freq[0] : -1;

    if(node->max_subtree_freq <= currentMin){
    return;
    }
    
    if(node->end==true){

    string full = prefix;

    for(int i=0;i<depth;i++){
        full += word[i];
    }
    //cout<<full<<"\n";
    if(heap_size < K){

        heap_words[heap_size] = full;
        heap_freq[heap_size] = node->frequency;

        int child = heap_size;
        heap_size++;

        while(child > 0){

            int parent = (child-1)/2;

            if(heap_freq[parent] <= heap_freq[child])
                break;

            swap(heap_freq[parent],heap_freq[child]);
            swap(heap_words[parent],heap_words[child]);

            child = parent;
        }

    }
    else if(node->frequency > heap_freq[0]){

        heap_words[0] = full;
        heap_freq[0] = node->frequency;

        int parent = 0;

        while(true){

            int left = 2*parent + 1;
            int right = 2*parent + 2;
            int smallest = parent;

            if(left < heap_size && heap_freq[left] < heap_freq[smallest])
                smallest = left;

            if(right < heap_size && heap_freq[right] < heap_freq[smallest])
                smallest = right;

            if(smallest == parent)
                break;

            swap(heap_freq[parent],heap_freq[smallest]);
            swap(heap_words[parent],heap_words[smallest]);

            parent = smallest;
        }
    }
}
    /*if(node->end==true){
        cout<<prefix;
        for(int i=0;i<depth;i++){
            cout<<word[i];
        }
        cout<<"\n";
        
    }*/
    for(int i=0;i<128;i++){
        if(node->children[i]!=NULL){
            word[depth]=(char)i;
            DFS(node->children[i],word,depth+1,prefix);
        }
    }
}