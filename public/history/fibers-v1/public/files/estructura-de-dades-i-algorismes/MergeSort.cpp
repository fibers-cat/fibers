#include <iostream>
#include <vector>
using namespace std;


//MergeSort utiliza el esquema de Div&Conc
//-dividir: divides en dos el vector(tendremos 2 subpro)
//-resuelve el subprobelma: ordena los dos subvectores recursivamente con MS;
//-Combinar: fusiona los dos subvectores, sabiendo que cada uno de ellos ya esta ordenada para obtener un vector ordenado.

void mergeSort(vector<int>& v, int i, int j){
	if(i < j){ //Si el vector no esta vacio(i = izq j = der)
		int m = (i+j)/2; //coje los extremos del vector y encuentra la posicion media Ej: [5 7 0 3] 0+3/2 = 1 v[1] = 7;
		mergeSort(v,i,m);//aqui se llama a si misma pero con [5 7] solamente
		mergeSort(v,m+1,j);//aqui se llama a si misma pero con [0 3] solamente
		fusion(v,i,m,j);
	}
}

void fusion(vector<int>& v, int i, int m, int j){
	vector<int> w(j-i+1); //Aqui declara un vector auxiliar del tamaño 3-0+1 = 4;
	int auxi = i, auxj = m+1, k = 0;//Aqui declara las mismas i's i j's como la misma i, y la j ya dividida.
	while(auxi <= m and auxj <= j){ // Auxi hace referencia al primer elemento del subvector1 i auxj del subvector2
									// m a la ultima posicion del subvector 1, i j a la ultima posicion del subvector2;
		if(v[auxi] <= v[auxj]) w(k++) = v[auxi++]; //compara el contenido de esas posiciones dle vector y mete en el
													//vector auxiliar la mas pequeña.
		else w[k++] = v[auxj++];
	}
	while(auxi <= m) w[k++] = v[auxi++];		//whiles para asegurarse que todo se cumple
	while(auxj <= j) w[k++] = v[auxj++];
	for(k = 0; k <= j-i; ++k) v[i+k] = w[k];  //mete por orden todos los subvectores en el vector auxiliar y finaliza. 
}
