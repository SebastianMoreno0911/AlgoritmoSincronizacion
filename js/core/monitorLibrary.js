// Monitor para problema lectores-escritor en biblioteca
export class LibraryMonitor {
  constructor() {
    // Cantidad de lectores activos dentro de la biblioteca
    this.activeReaders = 0;
    // true cuando el bibliotecario esta escribiendo catalogo
    this.writerActive = false;
    // Cola FIFO de lectores bloqueados
    this.readerQueue = [];
    // Cola FIFO de escritores bloqueados
    this.writerQueue = [];
    // Lectores despertados que ya tienen permiso concedido para entrar
    this.readerGranted = new Set();
    // Escritor despertado que ya tiene permiso concedido para entrar
    this.writerGranted = null;
  }

  // Lector pide entrar: solo bloquea si hay escritor activo o esperando con prioridad
  enterRead(thread) {
    // Si fue despertado por el monitor, entra directo sin volver a bloquearse
    if (this.readerGranted.has(thread)) {
      this.readerGranted.delete(thread);
      this.activeReaders += 1;
      return true;
    }

    // Doy prioridad al escritor esperando para evitar inanicion de escritura
    const writerWaiting = this.writerQueue.length > 0;
    if (!this.writerActive && !writerWaiting) {
      this.activeReaders += 1;
      return true;
    }

    thread.state = "blocked";
    thread.blockedBy = this;
    if (!this.readerQueue.includes(thread)) this.readerQueue.push(thread);
    return false;
  }

  // Lector sale y, si era el ultimo, intenta despertar escritor
  exitRead() {
    if (this.activeReaders > 0) this.activeReaders -= 1;
    return this.wakeUpThreads();
  }

  // Escritor pide entrar: solo entra si no hay lectores ni otro escritor
  enterWrite(thread) {
    // Si el monitor ya le concedio paso al escritor, entra directo
    if (this.writerGranted === thread) {
      this.writerGranted = null;
      this.writerActive = true;
      return true;
    }

    if (!this.writerActive && this.activeReaders === 0) {
      this.writerActive = true;
      return true;
    }

    thread.state = "blocked";
    thread.blockedBy = this;
    if (!this.writerQueue.includes(thread)) this.writerQueue.push(thread);
    return false;
  }

  // Escritor sale y despierta siguiente segun politica del monitor
  exitWrite() {
    this.writerActive = false;
    return this.wakeUpThreads();
  }

  // Politica: primero escritor si hay alguno; si no, despierta todos los lectores
  wakeUpThreads() {
    const awakened = [];

    if (
      !this.writerActive &&
      this.activeReaders === 0 &&
      this.writerQueue.length > 0
    ) {
      const nextWriter = this.writerQueue.shift();
      nextWriter.state = "ready";
      nextWriter.blockedBy = null;
      // Nota: aqui solo doy permiso; ENTER_WRITE consumira este permiso
      this.writerGranted = nextWriter;
      awakened.push(nextWriter);
      return awakened;
    }

    if (
      !this.writerActive &&
      this.writerQueue.length === 0 &&
      this.readerQueue.length > 0
    ) {
      while (this.readerQueue.length > 0) {
        const reader = this.readerQueue.shift();
        reader.state = "ready";
        reader.blockedBy = null;
        // Igual que escritor: concedo permiso y lo consumira ENTER_READ
        this.readerGranted.add(reader);
        awakened.push(reader);
      }
    }

    return awakened;
  }
}
