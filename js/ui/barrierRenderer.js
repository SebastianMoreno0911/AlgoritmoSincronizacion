import { clear } from "../utils/dom.js";
import { Instructions } from "../core/instructions.js";

// Render del caso Barrera: carrera con checkpoint obligatorio
export function renderBarrierView({
  context,
  threads,
  totalNode,
  checkpointNode,
  finishNode,
  waitingNode,
  racersContainer,
}) {
  totalNode.innerText = String(context.race.totalRacers);
  checkpointNode.innerText = String(context.race.passedCheckpointCount);
  finishNode.innerText = String(context.race.finishedCount);

  // Cola actual de la barrera (hilos bloqueados en checkpoint)
  clear(waitingNode);
  context.race.barrier.waitingQueue.forEach((racer) => {
    const chip = document.createElement("div");
    chip.className =
      "px-2 py-1 rounded border border-amber-400/40 bg-amber-900/30 text-amber-100 text-[11px]";
    chip.innerText = `🏃 ${racer.name}`;
    waitingNode.appendChild(chip);
  });

  // Tarjetas de corredores para ver en que fase esta cada uno
  clear(racersContainer);
  threads.forEach((racer) => {
    const tone =
      racer.state === "finished"
        ? "border-emerald-500/40 bg-emerald-900/20"
        : racer.state === "blocked"
          ? "border-amber-500/40 bg-amber-900/20"
          : "border-cyan-500/30 bg-cyan-900/20";

    const card = document.createElement("div");
    card.className = `rounded-xl border p-3 ${tone}`;
    card.innerHTML = `
      <div class="text-sm font-semibold">🏃 ${racer.name}</div>
      <div class="text-[11px] text-gray-300 mt-1 uppercase">${racer.state}</div>
      <div class="text-[11px] text-gray-400 mt-1">Fase: ${getRacerPhase(racer)}</div>
      <div class="text-[11px] text-gray-400 mt-1">Checkpoint: ${racer.passedCheckpoint ? "Si" : "No"}</div>
      <div class="text-[11px] text-gray-400 mt-1">Meta: ${racer.finishedRace ? "Si" : "No"}</div>
    `;
    racersContainer.appendChild(card);
  });
}

function getRacerPhase(racer) {
  const inst = racer.currentInstruction?.();
  if (!inst) return "Termino";
  if (inst.type === Instructions.RUN_STAGE && inst.stage === "to-checkpoint") {
    return "Corriendo hacia checkpoint";
  }
  if (inst.type === Instructions.BARRIER_WAIT) return "Esperando barrera";
  if (inst.type === Instructions.RUN_STAGE && inst.stage === "to-finish") {
    return "Corriendo hacia meta";
  }
  if (inst.type === Instructions.END) return "Finalizando";
  return "En carrera";
}
