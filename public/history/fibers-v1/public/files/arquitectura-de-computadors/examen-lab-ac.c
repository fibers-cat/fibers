typedef struct {
	char c;
	int v[18];
	int tam;
} S;


/*
	esta es la funcion que hay que implementar en Rutina.s
	el numero de parametros entre esta y la del main es
	diferente pero el profesor dijo que no importa

int Rutina(S *str, int val) {
	int i, resultado;
	resultado = 0;	i = 0;
	do {
		if (str->v[i] >= val-14) ++resultado;
		++i;
	} while (i < str->tam);
	return resultado;
}

*/


int m[4][20] = {{'a', 3, 3, 3, 5, 5, 5, 5, 5, 9, 9, 9, 9, 9, 9, 9, 9, 9, 18},
				{'b', 3, 3, 3, 3, 5, 5, 5, 5, 9, 9, 9, 9, 9, 9, 9, 9, 9, 18},
				{'c', 3, 3, 3, 5, 5, 5, 5, 5, 9, 9, 9, 9, 9, 9, 9, 9, 9, 18},
				{'d', 3, 3, 3, 3, 5, 5, 5, 5, 9, 9, 9, 9, 9, 9, 9, 9, 9, 18}};
				
int Rutina(int *a, int limite, int fila);

void callee(int *p) {
	*p += 1;
	asm("movl $0, %eax");
	asm("movl $0, %ecx");
	asm("movl $0, %edx");
}

main() {
	Rutina(&m[0][0], 19, 2);
	Rutina(&m[1][0], 19, 0);
}
