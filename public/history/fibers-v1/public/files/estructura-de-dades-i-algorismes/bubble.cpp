#include <iostream>
#include <vector>
using namespace std;

//Para todas las posiciones del vector, coge el ultimo elemento de este y hace que flote de manera ordenada hasta su posiccion
//adecuada. Con esto conseguiremos en cada iteracion decir cual es el minimo. PEOR ALGORITMO DE ORDENACION, REALIZA MUCHOS SWAPS.

void bubble(vector<int>& v){
	int n = v.size();
	bool b = true;
	for(int i = 0; i < n-1 and b; ++i){// comprueba que el vector no este vacio y el booleno este a true;
		b = false;
		for(int j = n-1; j > i; --j){// j = a la ultima posicion del vector(1ra iteracion) y se compara con la posicion 0;
			if(v[j-1] > v[j]){ //Si j-1 es mas grande que j, haces el swap [4 2 4 1], si 4 es > que 1, swap, es decir
								// [4 2 1 4] despues comprobara en 2 con el 1, y los swapeara, hasta el final[1 4 2 4];
				swap(v[j-1],v[j]);
				b = true;
			}
		}
	}
}
