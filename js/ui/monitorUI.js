import { $ } from "../utils/dom.js";
import { Timeline } from "./timeline.js";
import { createLibraryScenario } from "../scenarios/libraryScenario.js";
import { renderMonitorView } from "./monitorRenderer.js";

// UI del caso Monitores: Biblioteca con lectores y escritor.
export const MonitorUI = {
  autoInterval: null,
  simulationFinished: false,

  init(engine) {
    const timeline = new Timeline($("monTimeline"));
    let context = null;

    // Crea escenario nuevo segun parametros del usuario.
    $("monGenerateScenario").onclick = () => {
      this.stopAuto();
      this.simulationFinished = false;
      engine.threads = [];

      const readers = Math.max(1, Number($("monReaderCount").value) || 1);
      const updates = Math.max(1, Number($("monUpdateCount").value) || 1);
      context = createLibraryScenario(engine, readers, updates);

      timeline.clear();
      timeline.addEvent(
        `Biblioteca lista: ${readers} lectores y ${updates} actualizaciones del catalogo.`,
      );
      this.update(engine, context);
    };

    $("monStepBtn").onclick = () => this.runTick(engine, context, timeline);
    $("monAutoBtn").onclick = () => {
      if (this.autoInterval) this.stopAuto();
      else this.startAuto(engine, context, timeline);
    };
  },

  runTick(engine, context, timeline) {
    if (!context) return;
    const events = engine.step(context);
    const active = engine.threads.some((thread) => thread.state !== "finished");

    if (events.length === 0) {
      if (active) timeline.addEvent("Planificador: sin cambios este tick.");
      else if (!this.simulationFinished) {
        timeline.addEvent("Simulacion de monitor finalizada.");
        this.simulationFinished = true;
      }
    } else {
      events.forEach((event) => timeline.addEvent(event));
    }

    if (!active) this.stopAuto();
    this.update(engine, context);
  },

  startAuto(engine, context, timeline) {
    $("monAutoBtn").innerText = "Detener";
    $("monAutoBtn").classList.replace("bg-emerald-600", "bg-red-600");
    this.autoInterval = setInterval(() => {
      this.runTick(engine, context, timeline);
    }, 1000);
  },

  stopAuto() {
    clearInterval(this.autoInterval);
    this.autoInterval = null;
    if ($("monAutoBtn")) {
      $("monAutoBtn").innerText = "Auto";
      $("monAutoBtn").classList.replace("bg-red-600", "bg-emerald-600");
    }
  },

  update(engine, context) {
    renderMonitorView({
      context,
      threads: engine.threads,
      writerThread: context.writerThread,
      versionNode: $("monCatalogVersion"),
      readsNode: $("monTotalReads"),
      writesNode: $("monTotalWrites"),
      activeReadersNode: $("monActiveReaders"),
      writerStateNode: $("monWriterState"),
      readerQueueNode: $("monReaderQueue"),
      writerQueueNode: $("monWriterQueue"),
      readersContainer: $("monReaders"),
      writerPanel: $("monWriterPanel"),
    });
  },
};
