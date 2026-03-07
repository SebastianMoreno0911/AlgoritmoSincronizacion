import { clear } from "../utils/dom.js";
import { Instructions } from "../core/instructions.js";

// Render del caso Peterson: robots compartiendo estacion.
export function renderPetersonView({
  context,
  threads,
  ownerNode,
  turnNode,
  flagsNode,
  totalUsesNode,
  stationNode,
  robotsContainer,
}) {
  const lock = context.station.lock;
  ownerNode.innerText = lock.owner === null ? "Libre" : `Robot-${lock.owner + 1}`;
  turnNode.innerText = `Robot-${lock.turn + 1}`;
  flagsNode.innerText = `R1=${lock.flag[0] ? "1" : "0"} | R2=${lock.flag[1] ? "1" : "0"}`;
  totalUsesNode.innerText = String(context.station.totalUses);

  stationNode.innerHTML = `
    <div class="rounded-xl border border-white/10 bg-slate-950/60 p-3">
      <div class="text-xs text-gray-300">Estado de estacion</div>
      <div class="text-lg font-bold mt-1 ${
        lock.owner === null ? "text-emerald-200" : "text-amber-200"
      }">${lock.owner === null ? "Disponible" : `Ocupada por Robot-${lock.owner + 1}`}</div>
      <div class="text-xs text-gray-400 mt-2">Peterson turn: Robot-${lock.turn + 1}</div>
    </div>
  `;

  clear(robotsContainer);
  threads.forEach((robot) => {
    const id = Number(robot.petersonId);
    const tone =
      robot.state === "finished"
        ? "border-emerald-500/40 bg-emerald-900/20"
        : robot.state === "blocked"
          ? "border-amber-500/40 bg-amber-900/20"
          : "border-cyan-500/30 bg-cyan-900/20";

    const card = document.createElement("div");
    card.className = `rounded-xl border p-3 ${tone}`;
    card.innerHTML = `
      <div class="text-sm font-semibold">🤖 ${robot.name}</div>
      <div class="text-[11px] text-gray-300 mt-1 uppercase">${robot.state}</div>
      <div class="text-[11px] text-gray-400 mt-1">Fase: ${getRobotPhase(robot)}</div>
      <div class="text-[11px] text-gray-400 mt-1">Usos estacion: ${context.station.usageCount[id]}</div>
      <div class="text-[11px] text-gray-400 mt-1">Flag: ${lock.flag[id] ? "1" : "0"}</div>
    `;
    robotsContainer.appendChild(card);
  });
}

function getRobotPhase(robot) {
  const inst = robot.currentInstruction?.();
  if (!inst) return "Terminado";
  if (inst.type === Instructions.PETERSON_LOCK) return "Intentando lock";
  if (inst.type === Instructions.USE_STATION) return "Usando estacion";
  if (inst.type === Instructions.PETERSON_UNLOCK) return "Liberando lock";
  if (inst.type === Instructions.END) return "Finalizando";
  return "En proceso";
}
