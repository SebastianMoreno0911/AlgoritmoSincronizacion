import { $, clear } from "../utils/dom.js";
import { Timeline } from "./timeline.js";
import { createPrinterScenario } from "../scenarios/printerScenario.js";
import { renderSemaphoreView } from "./semaphoreRenderer.js";

// UI del problema: control de impresoras con semaforo.
export const SemaphoreUI = {
  autoInterval: null,
  simulationFinished: false,

  init(engine) {
    // Timeline independiente para no mezclar eventos con Mutex.
    const timeline = new Timeline($("semTimeline"));
    // Contexto del escenario actual (se crea al generar).
    let context = null;

    // Pinto inputs iniciales de trabajos.
    this.renderJobsInputs();
    this.syncAutoPrinterCount();
    // Si cambia cantidad de trabajos, regenero filas.
    $("semJobCount").addEventListener("input", () => {
      this.renderJobsInputs();
      this.syncAutoPrinterCount();
    });

    $("semGenerateScenario").onclick = () => {
      // Al crear escenario nuevo, corto auto y limpio estado previo.
      this.stopAuto();
      this.simulationFinished = false;
      engine.threads = [];

      // Leo parametros del formulario.
      const jobs = Math.max(1, Number($("semJobCount").value) || 1);
      // Regla pedida: impresoras automaticas segun cantidad de trabajos.
      const printers = this.getAutoPrinterCount(jobs);
      const jobConfig = this.getJobsFromUI(jobs);

      // Creo escenario y refresco timeline + UI.
      context = createPrinterScenario(engine, jobs, printers, jobConfig);
      timeline.clear();
      timeline.addEvent(`Sistema listo: ${jobs} trabajos y ${printers} impresoras.`);
      this.update(engine, context);
    };

    // Modo paso a paso.
    $("semStepBtn").onclick = () => this.runTick(engine, context, timeline);
    // Modo automatico.
    $("semAutoBtn").onclick = () => {
      if (this.autoInterval) this.stopAuto();
      else this.startAuto(engine, context, timeline);
    };
  },

  getAutoPrinterCount(jobCount) {
    // Nota: en este modelo se usa 1 impresora por cada trabajo configurado.
    return Math.max(1, Number(jobCount) || 1);
  },

  syncAutoPrinterCount() {
    const jobs = Math.max(1, Number($("semJobCount")?.value) || 1);
    const printers = this.getAutoPrinterCount(jobs);
    const label = $("semPrinterCountLabel");
    if (label) label.innerText = `Automatico: ${printers}`;
  },

  renderJobsInputs() {
    const container = $("semJobsRows");
    if (!container) return;

    // Cada vez rehago contenido para que coincida con cantidad de trabajos.
    clear(container);
    const count = Math.max(1, Number($("semJobCount")?.value) || 1);

    for (let i = 1; i <= count; i++) {
      const row = document.createElement("div");
      row.className =
        "grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-950/60 border border-white/10 rounded-xl p-2";
      row.innerHTML = `
        <div class="text-xs text-cyan-100 flex items-center font-semibold">Trabajo-${i}</div>
        <label class="flex flex-col gap-1 md:col-span-2">
          <span class="text-[11px] text-gray-300">Paginas a imprimir</span>
          <input
            data-job-pages="${i}"
            type="number"
            min="1"
            step="1"
            value="${5 + i}"
            class="bg-slate-950 border border-white/15 rounded-lg px-2 py-1 text-sm"
          />
        </label>
      `;
      container.appendChild(row);
    }
  },

  getJobsFromUI(jobCount) {
    // Traduzco inputs del formulario a arreglo de trabajos.
    const jobs = [];
    for (let i = 1; i <= jobCount; i++) {
      const pagesElement = document.querySelector(`[data-job-pages="${i}"]`);
      const pages = Math.max(1, Number(pagesElement?.value) || 1);
      jobs.push({ pages });
    }
    return jobs;
  },

  runTick(engine, context, timeline) {
    // Si aun no se genero escenario no hay nada que ejecutar.
    if (!context) return;

    // Ejecuta un ciclo del motor y revisa si hay hilos activos.
    const events = engine.step(context);
    const active = engine.threads.some((thread) => thread.state !== "finished");

    if (events.length === 0) {
      if (active) timeline.addEvent("Planificador: sin cambios en este tick.");
      else if (!this.simulationFinished) {
        timeline.addEvent("Simulacion de impresoras finalizada.");
        this.simulationFinished = true;
      }
    } else {
      events.forEach((event) => timeline.addEvent(event));
    }

    // Cuando termina todo, detengo auto para no seguir disparando ticks.
    if (!active) this.stopAuto();
    // Siempre refresco panel visual al final del tick.
    this.update(engine, context);
  },

  startAuto(engine, context, timeline) {
    // Cambio visual del boton mientras corre.
    $("semAutoBtn").innerText = "Detener";
    $("semAutoBtn").classList.replace("bg-emerald-600", "bg-red-600");

    // Tick cada 1 segundo.
    this.autoInterval = setInterval(() => {
      this.runTick(engine, context, timeline);
    }, 1000);
  },

  stopAuto() {
    // Limpieza de intervalo para que no quede ejecutando en segundo plano.
    clearInterval(this.autoInterval);
    this.autoInterval = null;
    if ($("semAutoBtn")) {
      $("semAutoBtn").innerText = "Auto";
      $("semAutoBtn").classList.replace("bg-red-600", "bg-emerald-600");
    }
  },

  update(engine, context) {
    // Centralizo render en una sola funcion para mantener la UI sincronizada.
    renderSemaphoreView({
      printersContainer: $("semPrinters"),
      threadsContainer: $("semThreads"),
      queueContainer: $("semQueue"),
      semaphoreCountNode: $("semTokens"),
      context,
      threads: engine.threads,
    });
  },
};
