#include <iostream>
#include <vector>
using namespace std;


//En cada  momento seleccionamos el elemento mas pequeño de la parte no ordenada y lo insertamos ordenadamente en la parte
//ya ordenada.

void seleccion(vector<int>& v){
	int n = v.size();
	for(int i = 0; i < n-1; ++i){
		int p = pos_min(v,i,n-1);
		swap(v[i],v[p]);
	}
}

int pos_min(vector <int>& v, int i, int n){
	int p = i;
	for(int j = i+1; j <= n; ++j){
		if(v[j] < v[p]) p = j;
		return p;
	}
}


//En cada iteracion se selecciona el primer elemento de al parte no ordenada y se inserta ordenadamente en la parte ordenada.

void insercion(vector<elem>& v){
	int n = v.size();
	for(int i = 1; i < n; ++i){
		int x = v[i];
		int j;
		for(j = i; j > 0 and v[j-1] > x; --j){
			v[j] = v[j-1];
			v[j] = x;
		}
	}
}
