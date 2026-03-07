import { clear } from "../utils/dom.js";
import { Instructions } from "../core/instructions.js";

// Render principal del escenario de restaurante (variables de condicion).
export function renderConditionView({
  context,
  threads,
  chefThread,
  dishesNode,
  cookedNode,
  eatenNode,
  waitingNode,
  chefPanelNode,
  customersContainer,
}) {
  // Resumen rapido para entender estado global.
  dishesNode.innerText = String(context.restaurant.availableDishes);
  cookedNode.innerText = String(context.restaurant.totalCooked);
  eatenNode.innerText = String(context.restaurant.totalEaten);

  // Cola de wait() en la variable de condicion.
  clear(waitingNode);
  context.restaurant.foodCondition.queue.forEach((thread) => {
    const chip = document.createElement("div");
    chip.className =
      "px-2 py-1 rounded border border-amber-400/40 bg-amber-900/30 text-amber-100 text-[11px]";
    chip.innerText = thread.name;
    waitingNode.appendChild(chip);
  });

  // Panel del chef con fase actual.
  const chefInstruction = chefThread?.currentInstruction?.();
  const chefPhase = getChefPhase(chefThread, chefInstruction);
  chefPanelNode.innerHTML = `
    <div class="rounded-xl border border-white/10 bg-slate-950/60 p-3">
      <div class="text-xs text-gray-400">Estado del chef</div>
      <div class="text-lg font-bold text-cyan-100 mt-1">${chefThread?.state?.toUpperCase() ?? "N/A"}</div>
      <div class="text-xs text-gray-300 mt-2">Fase actual: <span class="font-semibold text-white">${chefPhase}</span></div>
      <div class="text-xs text-gray-400 mt-2">PC: ${chefThread?.pc ?? 0}</div>
    </div>
  `;

  // Tarjetas de clientes (sin incluir al chef).
  const customers = threads.filter((thread) => thread !== chefThread);
  clear(customersContainer);
  customers.forEach((customer) => {
    const card = document.createElement("div");
    const tone =
      customer.state === "finished"
        ? "border-emerald-500/40 bg-emerald-900/20"
        : customer.state === "blocked"
          ? "border-amber-500/40 bg-amber-900/20"
          : "border-white/10 bg-slate-950/60";

    card.className = `rounded-xl border p-3 ${tone}`;
    card.innerHTML = `
      <div class="text-sm font-semibold">${customer.name}</div>
      <div class="text-[11px] text-gray-300 mt-1 uppercase">${customer.state}</div>
      <div class="text-[11px] text-gray-400 mt-1">Fase: ${getCustomerPhase(customer)}</div>
      <div class="text-[11px] text-gray-400 mt-1">Plato reservado: ${customer.hasReservedDish ? "Si" : "No"}</div>
    `;
    customersContainer.appendChild(card);
  });
}

function getChefPhase(thread, currentInstruction) {
  if (!thread) return "Sin chef";
  if (thread.state === "finished") return "Termino jornada";
  if (!currentInstruction) return "Sin instruccion";
  if (currentInstruction.type === Instructions.COOK_DISH) return "Cocinando plato";
  if (currentInstruction.type === Instructions.SIGNAL_FOOD) return "Llamando cliente";
  if (currentInstruction.type === Instructions.END) return "Cerrando cocina";
  return "Preparando siguiente paso";
}

function getCustomerPhase(thread) {
  const inst = thread.currentInstruction?.();
  if (!inst) return "Terminado";
  if (inst.type === Instructions.WAIT_FOOD) return "Esperando comida";
  if (inst.type === Instructions.EAT_FOOD) return "Comiendo";
  if (inst.type === Instructions.END) return "Saliendo del restaurante";
  return "En proceso";
}
