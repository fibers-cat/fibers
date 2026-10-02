#include <iostream>
#include <vector>
using namespace std;


//El algoritmo de QuickSelect se utiliza para saber que elemento ocuparia una posicion k en un vector T(no ordenado) si
//llegase a estar ordenado. Se trata de una mezcla de quicksort y busqueda dicotomica:

//-Primero ordena el vector T usando la tecnica del pivote. Colocando los elementos menores que el pivote a su izq y los
//mayores que el pivote a su derecha.

//-Luego podemos saber si la posicion del elemento k estaria en el subvector uno o en el dos, y por lo tanto, llamamos
//recursivamente a Quick select tan solo con ese subvector.

int quickSelect(vector<int>& v, int i, int j, int k){
	if(i-j > 0){
		int q = partition(v,i,j);
		if(q == k) return v[q];
		if(k < q) quickSelect(v,i,q-1,k);
		else quickSelect(v,q+1,j,k);
	}
}


El coste de este algoritmo, sacando la recurrencia es :

	Tsel(n) = 0(1) si n = 1;
				Tsel(n/2)+0(n) si n > 1;

En su totalidad, equivale a n;
