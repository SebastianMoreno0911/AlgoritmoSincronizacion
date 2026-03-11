// Semaforo contador con cola FIFO y asignacion de recurso (impresoras)
export class Semaphore {
  constructor(initialCount) {
    // count representa cuantos hilos mas pueden entrar a "zona de impresion"
    this.count = Math.max(0, Number(initialCount) || 0);
    // Cola FIFO para respetar orden de llegada cuando se bloquean
    this.queue = [];
    // Mapeo para recordar que impresora tiene cada hilo
    this.assignments = new Map();
  }

  // Intenta tomar un token y una impresora libre
  wait(thread, printers) {
    // Si el hilo ya tiene recurso asignado por transferencia, puede continuar
    if (this.assignments.has(thread)) {
      // Devuelvo la misma impresora para que el hilo avance sin bloquearse de nuevo
      return this.assignments.get(thread);
    }

    // Solo puedo asignar si hay tokens libres
    if (this.count > 0) {
      // Busco primera impresora sin dueño
      const printerIndex = printers.findIndex((printer) => !printer.owner);
      if (printerIndex === -1) return null;

      // Consumo token y asigno impresora al hilo
      this.count--;
      this.assignments.set(thread, printerIndex);
      printers[printerIndex].owner = thread;
      return printerIndex;
    }

    // No hay token: se bloquea en cola
    thread.state = "blocked";
    thread.blockedBy = this;
    if (!this.queue.includes(thread)) this.queue.push(thread);
    return null;
  }

  // Libera token/impresora y transfiere al siguiente hilo si existe
  signal(thread, printers) {
    if (!this.assignments.has(thread)) {
      // Esto ayuda a detectar bugs: signal sin haber hecho wait
      throw new Error("El hilo no tiene recurso asignado para signal");
    }

    // Obtengo impresora actual para liberarla
    const releasedPrinter = this.assignments.get(thread);
    this.assignments.delete(thread);
    printers[releasedPrinter].owner = null;

    // Si hay cola, hago transferencia directa de la misma impresora
    if (this.queue.length > 0) {
      const nextThread = this.queue.shift();
      // El siguiente pasa de bloqueado a listo
      nextThread.state = "ready";
      nextThread.blockedBy = null;
      // Asigno impresora al siguiente sin subir count
      this.assignments.set(nextThread, releasedPrinter);
      printers[releasedPrinter].owner = nextThread;
      return { releasedPrinter, nextThread };
    }

    // Si nadie espera, entonces si regreso token al semaforo
    this.count++;
    return { releasedPrinter, nextThread: null };
  }

  // Devuelve el indice de impresora del hilo, o null si no tiene
  getAssignedPrinter(thread) {
    return this.assignments.has(thread) ? this.assignments.get(thread) : null;
  }
}
