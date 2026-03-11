// Mutex binario con cola FIFO para hilos bloqueados
export class Mutex {
  constructor() {
    this.locked = false; // true cuando la seccion critica esta tomada
    this.owner = null; // Hilo que tiene el mutex actualmente
    this.queue = []; // Cola de espera en orden de llegada
  }

  // Intenta adquirir el mutex para un hilo
  acquire(thread) {
    // Si release transfirio propiedad, este hilo puede continuar
    if (this.locked && this.owner === thread) {
      return true;
    }

    // Camino normal: mutex libre, se asigna al hilo
    if (!this.locked) {
      this.locked = true;
      this.owner = thread;
      return true;
    }

    // Mutex ocupado: hilo bloqueado y enviado a cola
    thread.state = "blocked";
    thread.blockedBy = this;
    // Evita duplicados cuando el hilo vuelve a intentar acquire
    if (!this.queue.includes(thread)) {
      this.queue.push(thread);
    }
    return false;
  }

  // Libera el mutex y, si existe cola, lo transfiere al siguiente hilo
  release(thread) {
    if (this.owner !== thread) {
      throw new Error("Solo el poseedor puede liberar el mutex");
    }

    if (this.queue.length === 0) {
      this.locked = false;
      this.owner = null;
    } else {
      // Transferencia directa para respetar FIFO sin dejar el mutex libre
      const nextThread = this.queue.shift();
      this.locked = true;
      nextThread.state = "ready";
      nextThread.blockedBy = null;
      this.owner = nextThread;
    }
  }
}
