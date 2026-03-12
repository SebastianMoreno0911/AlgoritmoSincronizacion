import { clear } from "../utils/dom.js";
import { Instructions } from "../core/instructions.js";

// Render de paneles para escenario de impresoras con semaforo
export function renderSemaphoreView({
  printersContainer,
  threadsContainer,
  queueContainer,
  semaphoreCountNode,
  context,
  threads,
}) {
  // Muestro tokens disponibles en tiempo real
  semaphoreCountNode.innerText = String(context.semaphore.count);

  // Pinto cola del semaforo (hilos bloqueados esperando impresora)
  clear(queueContainer);
  context.semaphore.queue.forEach((thread) => {
    const chip = document.createElement("div");
    chip.className =
      "px-2 py-1 rounded border border-amber-500/40 bg-amber-900/30 text-amber-100 text-[11px]";
    chip.innerText = thread.name;
    queueContainer.appendChild(chip);
  });

  clear(printersContainer);
  context.printers.forEach((printer) => {
    const card = document.createElement("div");
    // owner representa el trabajo que esta usando esta impresora
    const owner = printer.owner;
    const isBusy = Boolean(owner);
    // Tomo paginas del trabajo actual para mostrarlas en panel
    const pages = owner ? Math.max(1, Number(owner.jobPages) || 1) : 0;
    // Instruccion actual del trabajo para inferir fase
    const currentInst = owner?.currentInstruction?.();
    const phase = getPrinterPhase(owner, currentInst);

    card.className = `rounded-2xl border p-4 ${
      isBusy
        ? "bg-cyan-900/25 border-cyan-500/40"
        : "bg-slate-950/60 border-white/10"
    }`;
    card.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <div class="text-xs text-gray-300">Impresora-${printer.id}</div>
        <div class="text-[10px] px-2 py-1 rounded-full border ${
          isBusy
            ? "text-cyan-100 border-cyan-400/50 bg-cyan-500/20"
            : "text-gray-200 border-white/20 bg-slate-800/80"
        }">
          ${isBusy ? "ACTIVA" : "LIBRE"}
        </div>
      </div>

      <div class="mt-3 rounded-xl border border-white/10 bg-slate-950/70 p-3">
        <div class="text-xs text-gray-400">Trabajo actual</div>
        <div class="text-sm font-semibold text-white mt-1">${owner?.name ?? "Sin trabajo"}</div>
        <div class="text-xs text-gray-400 mt-2">Paginas</div>
        <div class="text-sm font-semibold ${isBusy ? "text-cyan-200" : "text-gray-300"} mt-1">
          ${isBusy ? `${pages} paginas` : "-"}
        </div>
        <div class="text-xs text-gray-400 mt-2">Fase</div>
        <div class="text-sm font-semibold ${isBusy ? "text-cyan-200" : "text-gray-300"} mt-1">
          ${phase}
        </div>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div class="rounded-lg border border-white/10 bg-slate-900/70 p-2">
          <div class="text-gray-400">Trabajos completados</div>
          <div class="text-base font-bold text-emerald-200">${printer.completedJobs}</div>
        </div>
        <div class="rounded-lg border border-white/10 bg-slate-900/70 p-2">
          <div class="text-gray-400">Paginas impresas</div>
          <div class="text-base font-bold text-emerald-200">${printer.totalPages}</div>
        </div>
      </div>

      <div class="mt-2 text-[11px] text-gray-400">
        Ultimo trabajo: ${
          printer.lastCompletedJob
            ? `${printer.lastCompletedJob.name} (${printer.lastCompletedJob.pages} pags)`
            : "Ninguno"
        }
      </div>
    `;
    printersContainer.appendChild(card);
  });

  // Panel secundario: estado de todos los trabajos
  clear(threadsContainer);
  threads.forEach((thread) => {
    const card = document.createElement("div");
    const tone =
      thread.state === "finished"
        ? "border-emerald-500/40 bg-emerald-900/20"
        : thread.state === "blocked"
          ? "border-red-500/40 bg-red-900/20"
          : "border-white/10 bg-slate-950/60";
    card.className = `rounded-xl border p-3 ${tone}`;
    card.innerHTML = `
      <div class="text-sm font-semibold">${thread.name}</div>
      <div class="text-[11px] text-gray-300 mt-1 uppercase">${thread.state}</div>
      <div class="text-[11px] text-gray-400 mt-1">PC: ${thread.pc}</div>
    `;
    threadsContainer.appendChild(card);
  });
}

function getPrinterPhase(owner, currentInstruction) {
  // Sin owner, la impresora esta libre
  if (!owner) return "En espera de trabajo";
  // Sin instruccion, el hilo ya termino todo su flujo
  if (!currentInstruction) return "Finalizado";

  // Traduzco instruccion tecnica a texto mas humano
  if (currentInstruction.type === Instructions.PRINT) return "Imprimiendo";
  if (currentInstruction.type === Instructions.SIGNAL_SEM)
    return "Liberando recurso";
  if (currentInstruction.type === Instructions.END) return "Cerrando trabajo";
  return "Preparando impresion";
}
