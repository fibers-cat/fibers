#include <iostream>
#include <vector>
using namespace std;


//El algoritmo nos retorna la posición donde esta el elemento x de un vector crecientement ordenado.
int bsearch(const vector<int>& v, int x, int i, int j){
	if(i > j) return -1; //Si la posicion de la izq es mas grande que la der (vector vacío) retornas un -1;
	int m = (i+j)/2; //m = a la posicion de la mitad del vector [1 2 3 4 5 6 7 8] m apuntaria a 4;
	if(v[m] == x) return m;  //Si en la posicion m del vector esta el elemento x, retornas la posicion ya.
	else if (x < v[m]) return bsearch(v,x,i,m-1); // Si x esta por detras de la posicion m, llamas a la funcion con la posicion m-1;
	else return bsearch(v,x,m+1,j); //Si la x esta por delante, llamas a la funcion pero con la m aumentada.
}

El coste de binary search seria,
		0(1) si n = 2;
		Tbs(n/2) + 0(1); si n > 2;

a = 1; b = 2; g(n) = 0(1), f(n) = 0(1);

Viendo que se trata  de una recurrencia divisoria, k= =, a = log2 1 = 0; (a = k), el coste es: 0(n^k log n) = 0(log n);
