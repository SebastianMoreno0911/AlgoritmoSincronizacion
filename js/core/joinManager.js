// Gestor de sincronizacion tipo join/await entre hilos.
export class JoinManager {
  constructor() {
    // Nombres de hilos que ya terminaron (END ejecutado).
    this.finished = new Set();
    // Mapa: objetivo -> lista de hilos esperando join(objetivo).
    this.joinWaiters = new Map();
    // Lista de hilos esperando await sobre varios objetivos.
    this.awaitAllWaiters = [];
  }

  // join(target): true si el objetivo ya termino, false si debe esperar.
  join(thread, targetName) {
    if (this.finished.has(targetName)) return true;

    const queue = this.joinWaiters.get(targetName) ?? [];
    if (!queue.includes(thread)) queue.push(thread);
    this.joinWaiters.set(targetName, queue);
    return false;
  }

  // awaitAll(targets): true si todos terminaron, false si debe esperar.
  awaitAll(thread, targets) {
    const safeTargets = Array.from(new Set(targets.filter(Boolean)));
    const allDone = safeTargets.every((target) => this.finished.has(target));
    if (allDone) return true;

    const alreadyRegistered = this.awaitAllWaiters.some((entry) => entry.thread === thread);
    if (!alreadyRegistered) {
      this.awaitAllWaiters.push({ thread, targets: safeTargets });
    }
    return false;
  }

  // Marca hilo terminado y despierta hilos que dependian de el.
  markFinished(thread) {
    this.finished.add(thread.name);
    const awakened = [];

    // 1) Despierto todos los joiners que esperaban este hilo.
    const joiners = this.joinWaiters.get(thread.name) ?? [];
    this.joinWaiters.delete(thread.name);
    joiners.forEach((waitingThread) => {
      awakened.push(waitingThread);
    });

    // 2) Reviso awaitAll y despierto los que ya cumplieron todos sus objetivos.
    const pending = [];
    this.awaitAllWaiters.forEach((entry) => {
      const ready = entry.targets.every((target) => this.finished.has(target));
      if (ready) awakened.push(entry.thread);
      else pending.push(entry);
    });
    this.awaitAllWaiters = pending;

    return awakened;
  }
}
