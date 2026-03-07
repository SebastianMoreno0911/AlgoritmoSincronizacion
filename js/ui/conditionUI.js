import { $ } from "../utils/dom.js";
import { Timeline } from "./timeline.js";
import { createRestaurantScenario } from "../scenarios/restaurantScenario.js";
import { renderConditionView } from "./conditionRenderer.js";

// UI para variables de condicion: restaurante esperando comida.
export const ConditionUI = {
  autoInterval: null,
  simulationFinished: false,

  init(engine) {
    const timeline = new Timeline($("condTimeline"));
    let context = null;

    // Genera escenario con clientes + chef.
    $("condGenerateScenario").onclick = () => {
      this.stopAuto();
      this.simulationFinished = false;
      engine.threads = [];

      const customers = Math.max(1, Number($("condCustomerCount").value) || 1);
      const meals = Math.max(1, Number($("condMealsToCook").value) || 1);
      context = createRestaurantScenario(engine, customers, meals);

      timeline.clear();
      timeline.addEvent(
        `Restaurante listo: ${customers} clientes y ${meals} platos por cocinar.`,
      );
      this.update(engine, context);
    };

    // Paso manual del simulador.
    $("condStepBtn").onclick = () => this.runTick(engine, context, timeline);

    // Toggle de auto ejecucion.
    $("condAutoBtn").onclick = () => {
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
        timeline.addEvent("Servicio finalizado: todos los hilos terminaron.");
        this.simulationFinished = true;
      }
    } else {
      events.forEach((event) => timeline.addEvent(event));
    }

    if (!active) this.stopAuto();
    this.update(engine, context);
  },

  startAuto(engine, context, timeline) {
    $("condAutoBtn").innerText = "Detener";
    $("condAutoBtn").classList.replace("bg-emerald-600", "bg-red-600");
    this.autoInterval = setInterval(() => {
      this.runTick(engine, context, timeline);
    }, 1000);
  },

  stopAuto() {
    clearInterval(this.autoInterval);
    this.autoInterval = null;
    if ($("condAutoBtn")) {
      $("condAutoBtn").innerText = "Auto";
      $("condAutoBtn").classList.replace("bg-red-600", "bg-emerald-600");
    }
  },

  update(engine, context) {
    renderConditionView({
      context,
      threads: engine.threads,
      chefThread: context.chefThread,
      dishesNode: $("condAvailableDishes"),
      cookedNode: $("condCookedTotal"),
      eatenNode: $("condEatenTotal"),
      waitingNode: $("condWaitingQueue"),
      chefPanelNode: $("condChefPanel"),
      customersContainer: $("condCustomers"),
    });
  },
};
