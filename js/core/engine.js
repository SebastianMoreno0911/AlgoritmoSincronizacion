import { Instructions } from "./instructions.js";

// Motor de ejecucion: recorre hilos y procesa instrucciones
export class Engine {
  constructor() {
    this.threads = []; // Lista de hilos registrados
    this.tick = 0; // Ciclo global del simulador
  }

  // Registra un hilo en el motor
  addThread(thread) {
    this.threads.push(thread);
  }

  // Ejecuta un ciclo completo sobre todos los hilos.
  step(context) {
    this.tick++;
    const logs = [];

    for (const thread of this.threads) {
      // Ignora hilos que no pueden avanzar.
      if (thread.state === "blocked" || thread.state === "finished") continue;

      thread.state = "running";
      const inst = thread.currentInstruction();

      // Si no quedan instrucciones, marca fin.
      if (!inst) {
        thread.state = "finished";
        continue;
      }

      // Ejecuta la instruccion y guarda mensaje para timeline.
      const resultLog = this.execute(thread, inst, context);
      if (resultLog) logs.push(resultLog);
    }

    return logs;
  }

  // Ejecuta una instruccion puntual de un hilo.
  execute(thread, inst, ctx) {
    const { mutex, account } = ctx;

    switch (inst.type) {
      case Instructions.ACQUIRE:
        if (mutex.acquire(thread)) {
          thread.nextInstruction();
          return `🔑 ${thread.name} entro en Seccion Critica`;
        }
        return `🔒 ${thread.name} esta esperando el Mutex`;

      case Instructions.WITHDRAW:
        // Regla de seguridad: nunca deja el saldo negativo.
        const requested = Number(inst.amount) || 0;
        const allowed = Math.min(requested, Math.max(0, account.balance));
        account.balance -= allowed;
        thread.nextInstruction();

        if (allowed < requested) {
          return `⚠️ ${thread.name} pidio retirar $${requested}, pero solo se retiro $${allowed} (saldo insuficiente)`;
        }

        return `💸 ${thread.name} modifico el saldo: -$${allowed}`;

      case Instructions.DEPOSIT:
        // Ingreso directo al saldo compartido.
        account.balance += inst.amount;
        thread.nextInstruction();
        return `💵 ${thread.name} ingreso al saldo: +$${inst.amount}`;

      case Instructions.RELEASE:
        mutex.release(thread);
        thread.nextInstruction();
        return `🔓 ${thread.name} salio y libero el Mutex`;

      case Instructions.WAIT_SEM: {
        // wait intenta reservar token + impresora.
        const printerIndex = ctx.semaphore.wait(thread, ctx.printers);
        if (printerIndex !== null) {
          // Si pudo entrar, avanza al siguiente paso del flujo.
          thread.nextInstruction();
          return `🟢 ${thread.name} obtuvo Impresora-${printerIndex + 1}`;
        }
        // Si no, queda bloqueado en cola del semaforo.
        return `⏳ ${thread.name} espera una impresora libre`;
      }

      case Instructions.PRINT: {
        // PRINT solo simula el trabajo (no consume tiempo real por paginas).
        const pages = Math.max(1, Number(inst.pages) || 1);
        const printerIndex = ctx.semaphore.getAssignedPrinter(thread);
        thread.nextInstruction();

        if (printerIndex === null) {
          return `⚠️ ${thread.name} no tiene impresora asignada`;
        }
        return `🖨️ ${thread.name} imprime ${pages} paginas en Impresora-${printerIndex + 1}`;
      }

      case Instructions.SIGNAL_SEM: {
        // Antes de liberar, guardo metricas de uso en la impresora actual.
        const printerIndex = ctx.semaphore.getAssignedPrinter(thread);
        if (printerIndex !== null && ctx.printers?.[printerIndex]) {
          const printer = ctx.printers[printerIndex];
          const pages = Math.max(1, Number(thread.jobPages) || 1);
          printer.completedJobs += 1;
          printer.totalPages += pages;
          printer.lastCompletedJob = { name: thread.name, pages };
        }

        // signal libera y puede transferir impresora al siguiente de la cola.
        const transfer = ctx.semaphore.signal(thread, ctx.printers);
        thread.nextInstruction();

        if (transfer.nextThread) {
          return `🔁 ${thread.name} libera Impresora-${printerIndex + 1} y la pasa a ${transfer.nextThread.name}`;
        }
        return `✅ ${thread.name} libera Impresora-${printerIndex + 1}`;
      }

      case Instructions.WAIT_FOOD: {
        // Si ya hay plato, el cliente lo reserva para que nadie mas se lo gane.
        if (ctx.restaurant.availableDishes > 0) {
          ctx.restaurant.availableDishes -= 1;
          thread.hasReservedDish = true;
          thread.nextInstruction();
          return `🍽️ ${thread.name} recibio un plato y pasa a comer`;
        }

        // Si no hay comida, queda bloqueado en la variable de condicion.
        thread.state = "blocked";
        thread.blockedBy = ctx.restaurant.foodCondition;
        ctx.restaurant.foodCondition.wait(thread);
        return `🪑 ${thread.name} espera comida en el restaurante`;
      }

      case Instructions.EAT_FOOD: {
        // Esta bandera se activa cuando WAIT_FOOD logro reservar un plato.
        const hasDish = Boolean(thread.hasReservedDish);
        thread.hasReservedDish = false;
        if (hasDish) {
          ctx.restaurant.totalEaten += 1;
        }

        thread.nextInstruction();
        if (!hasDish) {
          return `⚠️ ${thread.name} intento comer sin plato reservado`;
        }
        return `🍴 ${thread.name} comio su plato`;
      }

      case Instructions.COOK_DISH: {
        // El chef cocina un plato y lo deja disponible.
        ctx.restaurant.availableDishes += 1;
        ctx.restaurant.totalCooked += 1;
        thread.nextInstruction();
        return `👨‍🍳 ${thread.name} preparo un plato (${ctx.restaurant.totalCooked}/${ctx.restaurant.mealsTarget})`;
      }

      case Instructions.SIGNAL_FOOD: {
        // signal despierta a un cliente en espera (si existe).
        const awakened = ctx.restaurant.foodCondition.signal();
        thread.nextInstruction();

        if (!awakened) {
          return `📣 ${thread.name} anuncio comida, pero no habia clientes esperando`;
        }

        awakened.state = "ready";
        awakened.blockedBy = null;
        return `🔔 ${thread.name} llamo a ${awakened.name}: comida lista`;
      }

      case Instructions.ENTER_READ: {
        // El lector intenta entrar al monitor como lector.
        const entered = ctx.library.monitor.enterRead(thread);
        if (!entered)
          return `📚 ${thread.name} espera para leer (monitor ocupado)`;

        thread.nextInstruction();
        return `📖 ${thread.name} entro a la biblioteca como lector`;
      }

      case Instructions.READ_BOOK: {
        // Simulo lectura dentro del monitor.
        const book = inst.title || thread.targetBook || "Libro";
        ctx.library.totalReads += 1;
        thread.nextInstruction();
        return `👩‍🎓 ${thread.name} esta leyendo ${book} (catalogo v${ctx.library.catalogVersion})`;
      }

      case Instructions.EXIT_READ: {
        // Al salir lector, el monitor decide si despierta escritores/lectores.
        const awakened = ctx.library.monitor.exitRead();
        thread.nextInstruction();
        if (awakened.length === 0) return `🚪 ${thread.name} salio de lectura`;

        const names = awakened.map((t) => t.name).join(", ");
        return `🚪 ${thread.name} salio y desperto a: ${names}`;
      }

      case Instructions.ENTER_WRITE: {
        // El bibliotecario intenta entrar con exclusividad.
        const entered = ctx.library.monitor.enterWrite(thread);
        if (!entered)
          return `⏳ ${thread.name} espera para actualizar catalogo`;

        thread.nextInstruction();
        return `🧑‍💼 ${thread.name} entro al monitor en modo escritura`;
      }

      case Instructions.UPDATE_CATALOG: {
        // Escritura exclusiva: aumenta version de catalogo.
        ctx.library.catalogVersion += 1;
        ctx.library.totalWrites += 1;
        thread.nextInstruction();
        return `🗂️ ${thread.name} actualizo catalogo a version ${ctx.library.catalogVersion}`;
      }

      case Instructions.EXIT_WRITE: {
        // Al salir escritor, el monitor despierta siguiente segun politica.
        const awakened = ctx.library.monitor.exitWrite();
        thread.nextInstruction();
        if (awakened.length === 0) return `✅ ${thread.name} libero el monitor`;

        const names = awakened.map((t) => t.name).join(", ");
        return `✅ ${thread.name} libero monitor y desperto a: ${names}`;
      }

      case Instructions.RUN_STAGE: {
        // Dos tramos didacticos: hacia checkpoint y hacia meta.
        const stage = inst.stage;

        if (stage === "to-checkpoint") {
          thread.nextInstruction();
          return `🏃 ${thread.name} llego al checkpoint`;
        }

        if (stage === "to-finish") {
          if (!thread.finishedRace) {
            thread.finishedRace = true;
            ctx.race.finishedCount += 1;
          }
          thread.nextInstruction();
          return `🏁 ${thread.name} llego a la meta`;
        }

        thread.nextInstruction();
        return `🏃 ${thread.name} avanzo en la carrera`;
      }

      case Instructions.BARRIER_WAIT: {
        // El corredor se sincroniza en el checkpoint con todos los demas.
        const result = ctx.race.barrier.arrive(thread);
        if (!result.passed) {
          return `🧱 ${thread.name} espera en el checkpoint (${ctx.race.barrier.waitingQueue.length}/${ctx.race.totalRacers - 1} en cola)`;
        }

        if (!thread.passedCheckpoint) {
          thread.passedCheckpoint = true;
          ctx.race.passedCheckpointCount += 1;
        }

        thread.nextInstruction();

        if (!result.opened) {
          return `✅ ${thread.name} cruza el checkpoint tras apertura de barrera`;
        }

        const releasedNames = result.released.map((t) => t.name).join(", ");
        if (!releasedNames) {
          return `🚦 ${thread.name} abrio la barrera y continuo`;
        }
        return `🚦 ${thread.name} abrio barrera y libero a: ${releasedNames}`;
      }

      case Instructions.BUILD_STAGE: {
        // Simulo trabajo por "ticks": cada tick avanza 1 unidad de etapa.
        const stage = inst.stage || "Etapa";
        const total = Math.max(1, Number(inst.duration) || 1);
        const progressMap = (thread.stageProgress ??= {});
        const current = (progressMap[stage] ?? 0) + 1;
        progressMap[stage] = current;

        if (ctx.house?.stages?.[stage]) {
          ctx.house.stages[stage].current = current;
        }

        if (current < total) {
          return `🧱 ${thread.name} construye ${stage} (${current}/${total})`;
        }

        // Al completar la etapa, marco done y avanzo al siguiente paso.
        if (ctx.house?.stages?.[stage]) {
          ctx.house.stages[stage].done = true;
        }
        thread.nextInstruction();
        return `🏗️ ${thread.name} termino ${stage}`;
      }

      case Instructions.JOIN_THREAD: {
        // join: espero a que termine un hilo puntual.
        const target = inst.target;
        const ready = ctx.joinManager.join(thread, target);
        if (!ready) {
          thread.state = "blocked";
          thread.blockedBy = ctx.joinManager;
          return `⛓️ ${thread.name} espera join de ${target}`;
        }

        thread.nextInstruction();
        return `✅ ${thread.name} join cumplido con ${target}`;
      }

      case Instructions.AWAIT_ALL: {
        // await all: espero a que termine un conjunto de hilos.
        const targets = Array.isArray(inst.targets) ? inst.targets : [];
        const ready = ctx.joinManager.awaitAll(thread, targets);
        if (!ready) {
          thread.state = "blocked";
          thread.blockedBy = ctx.joinManager;
          return `🕒 ${thread.name} espera await de: ${targets.join(", ")}`;
        }

        thread.nextInstruction();
        return `✅ ${thread.name} await cumplido: ${targets.join(", ")}`;
      }

      case Instructions.COMPLETE_HOUSE:
        // Entrega final de la obra.
        if (ctx.house) ctx.house.delivered = true;
        thread.nextInstruction();
        return `🏠 ${thread.name} entrego la casa terminada`;

      case Instructions.PETERSON_LOCK: {
        // Peterson: cada robot tiene id 0 o 1.
        const id = Number(thread.petersonId);
        const entered = ctx.station.lock.lock(id);
        if (!entered) {
          thread.state = "blocked";
          thread.blockedBy = ctx.station.lock;
          return `🤖 ${thread.name} espera turno en estacion (turn=${ctx.station.lock.turn + 1})`;
        }

        thread.nextInstruction();
        return `🔐 ${thread.name} entro a estacion compartida`;
      }

      case Instructions.USE_STATION: {
        // Solo incrementa contadores para mostrar que hubo uso exclusivo.
        const id = Number(thread.petersonId);
        ctx.station.usageCount[id] += 1;
        ctx.station.totalUses += 1;
        thread.nextInstruction();
        return `⚙️ ${thread.name} usa estacion (uso ${ctx.station.usageCount[id]})`;
      }

      case Instructions.PETERSON_UNLOCK: {
        const id = Number(thread.petersonId);
        ctx.station.lock.unlock(id);
        thread.nextInstruction();

        // Si el otro esta bloqueado por Peterson, lo pongo en ready para reintento.
        const otherId = 1 - id;
        const other = this.threads.find(
          (t) => Number(t.petersonId) === otherId,
        );
        if (
          other &&
          other.state === "blocked" &&
          other.blockedBy === ctx.station.lock
        ) {
          other.state = "ready";
          other.blockedBy = null;
          return `🔓 ${thread.name} libero estacion y desperto a ${other.name}`;
        }
        return `🔓 ${thread.name} libero estacion compartida`;
      }

      case Instructions.END:
        thread.state = "finished";
        // Si hay join manager activo, despierto hilos que dependian de este.
        if (ctx.joinManager) {
          const awakened = ctx.joinManager.markFinished(thread);
          awakened.forEach((waitingThread) => {
            waitingThread.state = "ready";
            waitingThread.blockedBy = null;
          });

          if (awakened.length > 0) {
            const names = awakened.map((t) => t.name).join(", ");
            return `🏁 ${thread.name} finalizo y desperto a: ${names}`;
          }
        }
        return `🏁 ${thread.name} finalizo sus tareas`;

      default:
        // Tipo no reconocido: no genera log ni avance.
        return null;
    }
  }
}
