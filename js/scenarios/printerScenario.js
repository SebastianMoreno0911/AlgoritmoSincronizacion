import { Thread } from "../core/thread.js";
import { Semaphore } from "../core/semaphore.js";
import { Instructions } from "../core/instructions.js";

// Crea el escenario de control de impresoras con semaforo contador.
export function createPrinterScenario(engine, jobCount, printerCount, jobs) {
  // Aseguro minimo 1 impresora para que el escenario sea valido.
  const safePrinters = Math.max(1, Number(printerCount) || 1);
  const semaphore = new Semaphore(safePrinters);
  // Cada objeto impresora guarda estado actual + estadisticas.
  const printers = Array.from({ length: safePrinters }, (_, i) => ({
    id: i + 1,
    owner: null,
    completedJobs: 0,
    totalPages: 0,
    lastCompletedJob: null,
  }));

  for (let i = 1; i <= jobCount; i++) {
    // Si el usuario no pone paginas validas, uso al menos 1.
    const pages = Math.max(1, Number(jobs[i - 1]?.pages) || 1);
    // Flujo fijo por trabajo: pedir impresora -> imprimir -> liberar -> terminar.
    const instructions = [
      { type: Instructions.WAIT_SEM },
      { type: Instructions.PRINT, pages },
      { type: Instructions.SIGNAL_SEM },
      { type: Instructions.END },
    ];

    const thread = new Thread(`Trabajo-${i}`, instructions);
    // Nota: guardo paginas tambien en el hilo para mostrar metricas por impresora.
    thread.jobPages = pages;
    engine.addThread(thread);
  }

  // Devuelvo todo el estado compartido que la UI necesita para render.
  return { semaphore, printers };
}
