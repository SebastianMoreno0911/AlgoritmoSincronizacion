import { $ } from "../utils/dom.js";
import { Timeline } from "./timeline.js";
import { createHouseScenario } from "../scenarios/houseScenario.js";
import { renderJoinView } from "./joinRenderer.js";

// UI para Join/Await: construccion de casa
export const JoinUI = {
  autoInterval: null,
  simulationFinished: false,

  init(engine) {
    const timeline = new Timeline($("joinTimeline"));
    let context = null;

    $("joinGenerateScenario").onclick = () => {
      this.stopAuto();
      this.simulationFinished = false;
      engine.threads = [];

      // Duraciones por etapa para hacerlo interactivo
      const durations = {
        foundation: Number($("joinFoundationDuration").value),
        walls: Number($("joinWallsDuration").value),
        roof: Number($("joinRoofDuration").value),
        installations: Number($("joinInstallDuration").value),
      };

      context = createHouseScenario(engine, durations);
      timeline.clear();
      timeline.addEvent("Obra iniciada: dependencias join/await activas.");
      this.update(engine, context);
    };

    $("joinStepBtn").onclick = () => this.runTick(engine, context, timeline);
    $("joinAutoBtn").onclick = () => {
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
        timeline.addEvent("Construccion finalizada.");
        this.simulationFinished = true;
      }
    } else {
      events.forEach((event) => timeline.addEvent(event));
    }

    if (!active) this.stopAuto();
    this.update(engine, context);
  },

  startAuto(engine, context, timeline) {
    $("joinAutoBtn").innerText = "Detener";
    $("joinAutoBtn").classList.replace("bg-emerald-600", "bg-red-600");
    this.autoInterval = setInterval(() => {
      this.runTick(engine, context, timeline);
    }, 1000);
  },

  stopAuto() {
    clearInterval(this.autoInterval);
    this.autoInterval = null;
    if ($("joinAutoBtn")) {
      $("joinAutoBtn").innerText = "Auto";
      $("joinAutoBtn").classList.replace("bg-red-600", "bg-emerald-600");
    }
  },

  update(engine, context) {
    renderJoinView({
      context,
      threads: engine.threads,
      deliveredNode: $("joinHouseDelivered"),
      joinQueueNode: $("joinQueue"),
      awaitQueueNode: $("joinAwaitQueue"),
      stagesContainer: $("joinStages"),
      workersContainer: $("joinWorkers"),
    });
  },
};
