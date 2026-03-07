import { $, clear } from "../utils/dom.js";
import { renderClients } from "./renderer.js";
import { Timeline } from "./timeline.js";
import { createBankScenario } from "../scenarios/bankScenario.js";
import { Instructions } from "../core/instructions.js";

// Orquestador principal de interfaz y simulacion.
export const UI = {
  autoInterval: null,
  simulationFinished: false, // Evita mensajes finales duplicados.

  init(engine) {
    // Referencia al timeline y contexto activo del escenario.
    const timeline = new Timeline($("timeline"));
    let context = null;

    // Construye filas iniciales para operaciones por hilo.
    this.renderOperationsInputs();

    // Regenera filas cuando cambia la cantidad de hilos.
    $("threadCount").addEventListener("input", () => {
      this.renderOperationsInputs();
    });

    // Crea un nuevo escenario con los parametros de la UI.
    $("generateScenario").onclick = () => {
      this.stopAuto();
      this.simulationFinished = false;
      engine.threads = [];

      const num = Number($("threadCount").value) || 3;
      const bal = Number($("initialBalance").value) || 1000;
      const operations = this.getOperationsFromUI(num);
      if (!operations) return;

      context = createBankScenario(engine, num, operations, bal);
      timeline.clear();
      timeline.addEvent(`Sistema listo: ${num} hilos creados.`);
      operations.forEach((op, i) => {
        const action = op.type === Instructions.DEPOSIT ? "ingresar" : "retirar";
        timeline.addEvent(`Cliente-${i + 1} va a ${action} $${op.amount}.`);
      });
      this.update(engine, context);
    };

    // Ejecuta un ciclo manual.
    $("stepBtn").onclick = () => {
      this.runTick(engine, context, timeline);
    };

    // Inicia o detiene ejecucion automatica.
    $("autoBtn").onclick = () => {
      if (this.autoInterval) {
        this.stopAuto();
      } else {
        this.startAuto(engine, context, timeline);
      }
    };
  },

  runTick(engine, context, timeline) {
    // Sin escenario activo no se puede ejecutar.
    if (!context) return;

    // Ejecuta un tick y determina si aun quedan hilos por terminar.
    const events = engine.step(context);
    const active = engine.threads.some((t) => t.state !== "finished");

    // Muestra eventos del tick o estado final.
    if (events.length === 0) {
      if (active) {
        timeline.addEvent("Planificador: Sin tareas pendientes.");
      } else if (!this.simulationFinished) {
        timeline.addEvent("Simulacion terminada satisfactoriamente.");
        this.simulationFinished = true;
      }
    } else {
      events.forEach((e) => timeline.addEvent(e));
    }

    // Si ya termino, fuerza detener modo automatico.
    if (!active) this.stopAuto();
    this.update(engine, context);
  },

  startAuto(engine, context, timeline) {
    // Cambia estilo y texto del boton mientras corre auto.
    $("autoBtn").innerText = "Detener";
    $("autoBtn").classList.replace("bg-emerald-600", "bg-red-600");

    // Ejecuta un tick por segundo.
    this.autoInterval = setInterval(() => {
      this.runTick(engine, context, timeline);
    }, 1000);
  },

  stopAuto() {
    // Limpia temporizador y restaura boton.
    clearInterval(this.autoInterval);
    this.autoInterval = null;
    $("autoBtn").innerText = "Auto";
    $("autoBtn").classList.replace("bg-red-600", "bg-emerald-600");
  },

  // Renderiza una fila de configuracion por cada cliente.
  renderOperationsInputs() {
    const container = $("operationsRows");
    if (!container) return;

    clear(container);
    const count = Math.max(1, Number($("threadCount")?.value) || 1);

    for (let i = 1; i <= count; i++) {
      const row = document.createElement("div");
      row.className =
        "grid grid-cols-1 md:grid-cols-4 gap-2 bg-slate-950/60 border border-white/10 rounded-xl p-2";
      row.innerHTML = `
        <div class="text-xs text-cyan-100 flex items-center font-semibold">Cliente-${i}</div>
        <label class="flex flex-col gap-1">
          <span class="text-[11px] text-gray-300">Accion</span>
          <select data-op-type="${i}" class="bg-slate-950 border border-white/15 rounded-lg px-2 py-1 text-sm">
            <option value="${Instructions.WITHDRAW}">Retirar</option>
            <option value="${Instructions.DEPOSIT}">Ingresar</option>
          </select>
        </label>
        <label class="flex flex-col gap-1 md:col-span-2">
          <span class="text-[11px] text-gray-300">Monto</span>
          <input
            data-op-amount="${i}"
            type="number"
            min="0"
            step="1"
            value="100"
            class="bg-slate-950 border border-white/15 rounded-lg px-2 py-1 text-sm"
          />
        </label>
      `;
      container.appendChild(row);
    }
  },

  // Lee las operaciones escritas en la interfaz.
  getOperationsFromUI(threadCount) {
    const operations = [];

    for (let i = 1; i <= threadCount; i++) {
      const typeElement = document.querySelector(`[data-op-type="${i}"]`);
      const amountElement = document.querySelector(`[data-op-amount="${i}"]`);
      if (!typeElement || !amountElement) return null;

      const type = typeElement.value;
      const amount = Math.max(0, Number(amountElement.value) || 0);
      operations.push({ type, amount });
    }

    return operations;
  },

  // Sincroniza resumen, cola y tarjetas visuales.
  update(engine, context) {
    $("balance").innerText = "$" + context.account.balance;
    $("owner").innerText = context.mutex.owner
      ? context.mutex.owner.name
      : "Libre";

    // Redibuja cola de espera del mutex.
    clear($("queue"));
    context.mutex.queue.forEach((t) => {
      const node = document.createElement("div");
      node.className =
        "bg-red-900/50 border border-red-500 text-[10px] px-2 py-1 rounded text-red-200 animate-pulse";
      node.innerText = t.name;
      $("queue").appendChild(node);
    });

    renderClients(
      $("threads"),
      engine.threads,
      context.mutex.owner,
      context.account,
      Number($("initialBalance").value) || 1,
    );
  },
};
