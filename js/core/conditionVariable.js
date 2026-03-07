// Variable de condicion basica con cola FIFO.
export class ConditionVariable {
  constructor(name = "Condition") {
    // Nombre para debug y para mostrar en mensajes si hace falta.
    this.name = name;
    // Cola de hilos que hicieron wait y quedaron dormidos.
    this.queue = [];
  }

  // Agrega un hilo a la cola de espera de la condicion.
  wait(thread) {
    // Evito duplicados por seguridad si el hilo intenta esperar otra vez.
    if (!this.queue.includes(thread)) this.queue.push(thread);
  }

  // Despierta a un hilo (el mas antiguo) si existe.
  signal() {
    if (this.queue.length === 0) return null;
    return this.queue.shift();
  }
}
