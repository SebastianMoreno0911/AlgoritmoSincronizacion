import { clear } from "../utils/dom.js";

// Dibuja estado visual de saldo y clientes.
export function renderClients(
  container,
  threads,
  mutexOwner,
  account,
  initialBalance,
) {
  clear(container);

  // Bloque de saldo global.
  const stats = document.createElement("div");
  stats.className =
    "w-full bg-black/30 p-4 rounded-lg mb-6 border border-gray-700";

  // Protege calculo ante valores faltantes o invalidos.
  const safeBalance = Number(account?.balance ?? 0);
  const safeInitialBalance = Math.max(1, Number(initialBalance) || 1);
  const percentage = Math.max(0, (safeBalance / safeInitialBalance) * 100);
  const barColor =
    percentage > 50
      ? "bg-green-500"
      : percentage > 20
        ? "bg-yellow-500"
        : "bg-red-500";

  stats.innerHTML = `
    <div class="flex justify-between text-xs mb-1">
        <span>Estado del Saldo Bancario</span>
        <span>${percentage.toFixed(1)}%</span>
    </div>
    <div class="w-full bg-gray-700 h-4 rounded-full overflow-hidden">
        <div class="h-full ${barColor} transition-all duration-500" style="width: ${percentage}%"></div>
    </div>
  `;
  container.appendChild(stats);

  // Contenedor de tarjetas por hilo.
  const threadsGrid = document.createElement("div");
  threadsGrid.className = "flex flex-wrap gap-4 justify-center";
  container.appendChild(threadsGrid);

  // Tarjeta de cada hilo con estado actual.
  threads.forEach((thread) => {
    const card = document.createElement("div");
    let border = "border-gray-600";
    let icon = "👤";
    let bg = "bg-gray-800";

    if (thread.state === "blocked") {
      border = "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
      icon = "🔒";
    } else if (thread.state === "finished") {
      card.style.opacity = "0.4";
      icon = "✅";
    } else if (mutexOwner === thread) {
      border = "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]";
      bg = "bg-gray-700";
      icon = "💰";
    }

    card.className = `${bg} p-4 rounded-xl border-2 ${border} transition-all duration-300 w-32 flex flex-col items-center`;
    card.innerHTML = `
      <div class="text-3xl mb-2">${icon}</div>
      <div class="font-bold text-xs text-white text-center">${thread.name}</div>
      <div class="text-[9px] mt-2 px-2 py-0.5 rounded bg-black/50 text-gray-300 uppercase font-mono">
        ${thread.state}
      </div>
    `;
    threadsGrid.appendChild(card);
  });
}
