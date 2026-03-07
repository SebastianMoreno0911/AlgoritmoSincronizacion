import { $ } from "../utils/dom.js";
import { Timeline } from "./timeline.js";
import { createRaceBarrierScenario } from "../scenarios/raceBarrierScenario.js";
import { renderBarrierView } from "./barrierRenderer.js";

// UI del caso barrera: carrera con checkpoint.
export const BarrierUI = {
  autoInterval: null,
  simulationFinished: false,

  init(engine) {
    const timeline = new Timeline($("barTimeline"));
    let context = null;

    // Genera escenario nuevo con N corredores.
    $("barGenerateScenario").onclick = () => {
      this.stopAuto();
      this.simulationFinished = false;
      engine.threads = [];

      const racers = Math.max(1, Number($("barRacerCount").value) || 1);
      context = createRaceBarrierScenario(engine, racers);
      timeline.clear();
      timeline.addEvent(
        `Carrera lista: ${racers} corredores deben pasar juntos por el checkpoint.`,
      );
      this.update(engine, context);
    };

    $("barStepBtn").onclick = () => this.runTick(engine, context, timeline);
    $("barAutoBtn").onclick = () => {
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
        timeline.addEvent("Carrera finalizada: todos llegaron a meta.");
        this.simulationFinished = true;
      }
    } else {
      events.forEach((event) => timeline.addEvent(event));
    }

    if (!active) this.stopAuto();
    this.update(engine, context);
  },

  startAuto(engine, context, timeline) {
    $("barAutoBtn").innerText = "Detener";
    $("barAutoBtn").classList.replace("bg-emerald-600", "bg-red-600");
    this.autoInterval = setInterval(() => {
      this.runTick(engine, context, timeline);
    }, 1000);
  },

  stopAuto() {
    clearInterval(this.autoInterval);
    this.autoInterval = null;
    if ($("barAutoBtn")) {
      $("barAutoBtn").innerText = "Auto";
      $("barAutoBtn").classList.replace("bg-red-600", "bg-emerald-600");
    }
  },

  update(engine, context) {
    renderBarrierView({
      context,
      threads: engine.threads,
      totalNode: $("barTotalRacers"),
      checkpointNode: $("barCheckpointPassed"),
      finishNode: $("barFinishedCount"),
      waitingNode: $("barWaitingQueue"),
      racersContainer: $("barRacers"),
    });
  },
};
