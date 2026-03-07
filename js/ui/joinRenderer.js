import { clear } from "../utils/dom.js";
import { Instructions } from "../core/instructions.js";

// Render del caso Join/Await: construccion de casa.
export function renderJoinView({
  context,
  threads,
  deliveredNode,
  joinQueueNode,
  awaitQueueNode,
  stagesContainer,
  workersContainer,
}) {
  deliveredNode.innerText = context.house.delivered ? "Entregada" : "En construccion";

  // join queue por objetivo.
  clear(joinQueueNode);
  for (const [target, waiters] of context.joinManager.joinWaiters.entries()) {
    const chip = document.createElement("div");
    chip.className =
      "px-2 py-1 rounded border border-cyan-400/40 bg-cyan-900/30 text-cyan-100 text-[11px]";
    chip.innerText = `${target} <- ${waiters.map((w) => w.name).join(", ")}`;
    joinQueueNode.appendChild(chip);
  }

  // await queue por hilo y su lista de dependencias.
  clear(awaitQueueNode);
  context.joinManager.awaitAllWaiters.forEach((entry) => {
    const chip = document.createElement("div");
    chip.className =
      "px-2 py-1 rounded border border-fuchsia-400/40 bg-fuchsia-900/30 text-fuchsia-100 text-[11px]";
    chip.innerText = `${entry.thread.name} await: ${entry.targets.join(", ")}`;
    awaitQueueNode.appendChild(chip);
  });

  // Tarjetas de etapas de construccion.
  clear(stagesContainer);
  Object.entries(context.house.stages).forEach(([name, stage]) => {
    const percent = Math.min(100, Math.round((stage.current / stage.total) * 100));
    const card = document.createElement("div");
    card.className =
      "rounded-xl border border-white/10 bg-slate-950/60 p-3";
    card.innerHTML = `
      <div class="text-sm font-semibold">${name}</div>
      <div class="text-[11px] text-gray-400 mt-1">Responsable: ${stage.owner}</div>
      <div class="text-[11px] text-gray-300 mt-2">Progreso: ${stage.current}/${stage.total}</div>
      <div class="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
        <div class="h-full ${stage.done ? "bg-emerald-500" : "bg-cyan-500"}" style="width:${percent}%"></div>
      </div>
      <div class="text-[11px] mt-2 ${stage.done ? "text-emerald-200" : "text-amber-200"}">
        ${stage.done ? "Completada" : "En progreso"}
      </div>
    `;
    stagesContainer.appendChild(card);
  });

  // Tarjetas de hilos/trabajadores.
  clear(workersContainer);
  threads.forEach((thread) => {
    const tone =
      thread.state === "finished"
        ? "border-emerald-500/40 bg-emerald-900/20"
        : thread.state === "blocked"
          ? "border-amber-500/40 bg-amber-900/20"
          : "border-white/10 bg-slate-950/60";
    const card = document.createElement("div");
    card.className = `rounded-xl border p-3 ${tone}`;
    card.innerHTML = `
      <div class="text-sm font-semibold">${thread.name}</div>
      <div class="text-[11px] text-gray-300 mt-1 uppercase">${thread.state}</div>
      <div class="text-[11px] text-gray-400 mt-1">Fase: ${getWorkerPhase(thread)}</div>
    `;
    workersContainer.appendChild(card);
  });
}

function getWorkerPhase(thread) {
  const inst = thread.currentInstruction?.();
  if (!inst) return "Terminado";
  if (inst.type === Instructions.BUILD_STAGE) return `Construyendo ${inst.stage}`;
  if (inst.type === Instructions.JOIN_THREAD) return `Join con ${inst.target}`;
  if (inst.type === Instructions.AWAIT_ALL) return `Await de ${inst.targets.join(", ")}`;
  if (inst.type === Instructions.COMPLETE_HOUSE) return "Entregando casa";
  if (inst.type === Instructions.END) return "Finalizando";
  return "En proceso";
}
