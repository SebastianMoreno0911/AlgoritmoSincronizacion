// Modelo de hilo con contador de programa y estado de ejecucion.
export class Thread {
  constructor(name, instructions) {
    this.name = name; // Nombre visible en UI y logs.
    this.instructions = instructions; // Lista ordenada de instrucciones.
    this.pc = 0; // Indice de la instruccion actual.
    this.state = "ready"; // ready, running, blocked, finished.
    this.blockedBy = null; // Recurso que bloqueo el hilo.
  }

  // Devuelve la instruccion apuntada por el PC.
  currentInstruction() {
    return this.instructions[this.pc];
  }

  // Avanza el PC a la siguiente instruccion.
  nextInstruction() {
    this.pc++;
  }
}
