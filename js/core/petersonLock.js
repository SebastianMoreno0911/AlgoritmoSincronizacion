// Algoritmo de Peterson para exclusion mutua de 2 hilos/robots
export class PetersonLock {
  constructor() {
    // flag[i] = true cuando el robot i quiere entrar a seccion critica
    this.flag = [false, false];
    // turn define quien cede paso en caso de conflicto
    this.turn = 0;
    // Para visualizacion: dueño actual de la estacion
    this.owner = null;
  }

  // Intenta tomar lock para robot i (0 o 1). Devuelve true si puede entrar
  lock(i) {
    const other = 1 - i;
    this.flag[i] = true;
    this.turn = other;

    // Condicion de espera activa de Peterson
    if (this.flag[other] && this.turn === other) {
      return false;
    }

    this.owner = i;
    return true;
  }

  // Libera lock del robot i
  unlock(i) {
    this.flag[i] = false;
    if (this.owner === i) this.owner = null;
  }
}
