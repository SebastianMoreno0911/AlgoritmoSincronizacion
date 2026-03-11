// Barrera ciclica simple: todos deben llegar para abrir paso
export class Barrier {
  constructor(participants) {
    // Cantidad de hilos que deben sincronizarse en el checkpoint
    this.participants = Math.max(1, Number(participants) || 1);
    // Cola FIFO de hilos bloqueados esperando apertura de barrera
    this.waitingQueue = [];
    // Cantidad de llegadas en la ronda actual
    this.arrived = 0;
    // Hilos con permiso concedido despues de abrir barrera
    this.granted = new Set();
  }

  // Un hilo llega a la barrera y espera si aun no esta completo el grupo
  arrive(thread) {
    // Si el hilo ya fue liberado por una apertura previa, pasa directo
    if (this.granted.has(thread)) {
      this.granted.delete(thread);
      return { passed: true, opened: false, released: [] };
    }

    this.arrived += 1;

    // Si todavia no llegan todos, el hilo se bloquea
    if (this.arrived < this.participants) {
      thread.state = "blocked";
      thread.blockedBy = this;
      if (!this.waitingQueue.includes(thread)) this.waitingQueue.push(thread);
      return { passed: false, opened: false, released: [] };
    }

    // Ultimo en llegar: abre barrera y despierta a todos los bloqueados
    const released = [];
    while (this.waitingQueue.length > 0) {
      const waitingThread = this.waitingQueue.shift();
      waitingThread.state = "ready";
      waitingThread.blockedBy = null;
      this.granted.add(waitingThread);
      released.push(waitingThread);
    }

    // Reinicio contador para posibles rondas futuras de barrera
    this.arrived = 0;
    return { passed: true, opened: true, released };
  }
}
