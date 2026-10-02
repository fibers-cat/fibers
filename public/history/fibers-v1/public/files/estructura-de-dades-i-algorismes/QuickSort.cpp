#include <iostream>
#include <vector>
using namespace std;


//QuickSort utiliza el esquema de Div&Conc
//dividir: se elige un pivote(un elemento del vector elegido al azar o por otros sistemas) y colocas los elementos menores que
//el pivote a su izquierda y los mayores o igual a su derecha
//resuelve el problema: ordena los dos subvectores recursivamente con QuickSOrt
//combinar: como cada subvector se ordena in-situ no requiere trabajo.
//Para elegir el pivote usaremos el metodo Hoare

void quickSort(vector<int>& T, int i, int j){
	if(i < j){ //Si el vector no esta vacio
		int q = partition(v,i,j);
		quickSort(v,i,q);
		quickSort(v,q+1,j);
	}
}

int partition(vector<int>& v,int i, int j){
	int x = v[i], auxi = i-1, auxj = j+1;
	for(;;){//bucle infinito hasta que retornes algo.
		while(x < v[--auxj]);//comprueba la primera posiciond el vector con la ultima, si se cumple, hace lo mismo(iterando las varables), sino, salta.
		while(v[++auxi] < x);//comprueba la primera posicion del vector con ella misma(en la primera iteracion);
		if(auxi >= auxj) return auxj; //si se cumple devuelve pivote, sino, salta y hace el swap.
		swap(v[auxi],v[auxj]);

	}
}


El coste de l'algoritmo es nlogn;

En el peor caso, aplicamos el teorema maestro para recurrencias sustractoras:

Tqs(j-i+1) = Tqs(n)= 	0(1) si n = 1;
					 Tqs(1) + Tqs(n-1)+0(n) si n > 1;

y el coste total de l'algoritmo es n^2;
