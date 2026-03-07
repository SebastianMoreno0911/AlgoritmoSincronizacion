import { $ } from "../utils/dom.js";
import { Timeline } from "./timeline.js";
import { createPetersonScenario } from "../scenarios/petersonScenario.js";
import { renderPetersonView } from "./petersonRenderer.js";

// UI del caso Peterson: dos robots en una estacion compartida.
export const PetersonUI = {
  autoInterval: null,
  simulationFinished: false,

  init(engine) {
    const timeline = new Timeline($("petTimeline"));
    let context = null;

    $("petGenerateScenario").onclick = () => {
      this.stopAuto();
      this.simulationFinished = false;
      engine.threads = [];

      const cycles = Math.max(1, Number($("petCycles").value) || 1);
      context = createPetersonScenario(engine, cycles);
      timeline.clear();
      timeline.addEvent(`Escenario Peterson listo: 2 robots, ${cycles} ciclos cada uno.`);
      this.update(engine, context);
    };

    $("petStepBtn").onclick = () => this.runTick(engine, context, timeline);
    $("petAutoBtn").onclick = () => {
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
        timeline.addEvent("Simulacion Peterson finalizada.");
        this.simulationFinished = true;
      }
    } else {
      events.forEach((event) => timeline.addEvent(event));
    }

    if (!active) this.stopAuto();
    this.update(engine, context);
  },

  startAuto(engine, context, timeline) {
    $("petAutoBtn").innerText = "Detener";
    $("petAutoBtn").classList.replace("bg-emerald-600", "bg-red-600");
    this.autoInterval = setInterval(() => {
      this.runTick(engine, context, timeline);
    }, 1000);
  },

  stopAuto() {
    clearInterval(this.autoInterval);
    this.autoInterval = null;
    if ($("petAutoBtn")) {
      $("petAutoBtn").innerText = "Auto";
      $("petAutoBtn").classList.replace("bg-red-600", "bg-emerald-600");
    }
  },

  update(engine, context) {
    renderPetersonView({
      context,
      threads: engine.threads,
      ownerNode: $("petOwner"),
      turnNode: $("petTurn"),
      flagsNode: $("petFlags"),
      totalUsesNode: $("petTotalUses"),
      stationNode: $("petStationPanel"),
      robotsContainer: $("petRobots"),
    });
  },
};
