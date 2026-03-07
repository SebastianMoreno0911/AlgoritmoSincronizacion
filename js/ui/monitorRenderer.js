import { clear } from "../utils/dom.js";
import { Instructions } from "../core/instructions.js";

// Render del escenario Biblioteca (monitor lectores-escritor).
export function renderMonitorView({
  context,
  threads,
  writerThread,
  versionNode,
  readsNode,
  writesNode,
  activeReadersNode,
  writerStateNode,
  readerQueueNode,
  writerQueueNode,
  readersContainer,
  writerPanel,
}) {
  const monitor = context.library.monitor;
  versionNode.innerText = `v${context.library.catalogVersion}`;
  readsNode.innerText = String(context.library.totalReads);
  writesNode.innerText = String(context.library.totalWrites);
  activeReadersNode.innerText = String(monitor.activeReaders);
  writerStateNode.innerText = monitor.writerActive ? "Escribiendo" : "Libre";

  clear(readerQueueNode);
  monitor.readerQueue.forEach((reader) => {
    const chip = document.createElement("div");
    chip.className =
      "px-2 py-1 rounded border border-cyan-400/40 bg-cyan-900/30 text-cyan-100 text-[11px]";
    chip.innerText = `👩‍🎓 ${reader.name}`;
    readerQueueNode.appendChild(chip);
  });

  clear(writerQueueNode);
  monitor.writerQueue.forEach((writer) => {
    const chip = document.createElement("div");
    chip.className =
      "px-2 py-1 rounded border border-fuchsia-400/40 bg-fuchsia-900/30 text-fuchsia-100 text-[11px]";
    chip.innerText = `🧑‍💼 ${writer.name}`;
    writerQueueNode.appendChild(chip);
  });

  // Panel destacado del bibliotecario escritor.
  const writerInst = writerThread?.currentInstruction?.();
  writerPanel.innerHTML = `
    <div class="rounded-xl border border-fuchsia-400/30 bg-fuchsia-900/20 p-3">
      <div class="text-xs text-fuchsia-200">🧑‍💼 Bibliotecario (escritor)</div>
      <div class="text-lg font-bold mt-1">${writerThread?.state?.toUpperCase() ?? "N/A"}</div>
      <div class="text-xs text-gray-300 mt-2">Fase: ${getWriterPhase(writerInst, writerThread)}</div>
      <div class="text-xs text-gray-400 mt-1">PC: ${writerThread?.pc ?? 0}</div>
    </div>
  `;

  const readers = threads.filter((thread) => thread !== writerThread);
  clear(readersContainer);
  readers.forEach((reader) => {
    const tone =
      reader.state === "finished"
        ? "border-emerald-500/40 bg-emerald-900/20"
        : reader.state === "blocked"
          ? "border-amber-500/40 bg-amber-900/20"
          : "border-cyan-500/30 bg-cyan-900/20";

    const card = document.createElement("div");
    card.className = `rounded-xl border p-3 ${tone}`;
    card.innerHTML = `
      <div class="text-sm font-semibold">👩‍🎓 ${reader.name}</div>
      <div class="text-[11px] text-gray-300 mt-1 uppercase">${reader.state}</div>
      <div class="text-[11px] text-gray-400 mt-1">Fase: ${getReaderPhase(reader)}</div>
      <div class="text-[11px] text-gray-400 mt-1">Libro objetivo: ${reader.targetBook ?? "N/A"}</div>
    `;
    readersContainer.appendChild(card);
  });
}

function getReaderPhase(reader) {
  const inst = reader.currentInstruction?.();
  if (!inst) return "Termino";
  if (inst.type === Instructions.ENTER_READ) return "Intentando entrar";
  if (inst.type === Instructions.READ_BOOK) return "Leyendo libro";
  if (inst.type === Instructions.EXIT_READ) return "Saliendo del monitor";
  if (inst.type === Instructions.END) return "Finalizando";
  return "En proceso";
}

function getWriterPhase(inst, writerThread) {
  if (!writerThread) return "Sin escritor";
  if (writerThread.state === "finished") return "Jornada terminada";
  if (!inst) return "Sin instruccion";
  if (inst.type === Instructions.ENTER_WRITE) return "Esperando exclusividad";
  if (inst.type === Instructions.UPDATE_CATALOG) return "Actualizando catalogo";
  if (inst.type === Instructions.EXIT_WRITE) return "Liberando monitor";
  if (inst.type === Instructions.END) return "Cerrando turno";
  return "En proceso";
}
