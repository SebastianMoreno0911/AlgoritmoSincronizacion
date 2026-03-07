import { Engine } from "./core/engine.js";
import { UI } from "./ui/ui.js";
import { SemaphoreUI } from "./ui/semaphoreUI.js";
import { ConditionUI } from "./ui/conditionUI.js";
import { MonitorUI } from "./ui/monitorUI.js";
import { BarrierUI } from "./ui/barrierUI.js";
import { JoinUI } from "./ui/joinUI.js";
import { PetersonUI } from "./ui/petersonUI.js";

// Punto de entrada: crea el motor y conecta la seleccion de algoritmos
const engine = new Engine();
// Estas referencias apuntan a cada pantalla principal
const selector = document.getElementById("algorithmSelector");
const mutexApp = document.getElementById("simulatorApp");
const semaphoreApp = document.getElementById("semaphoreApp");
const conditionApp = document.getElementById("conditionApp");
const monitorApp = document.getElementById("monitorApp");
const barrierApp = document.getElementById("barrierApp");
const joinApp = document.getElementById("joinApp");
const petersonApp = document.getElementById("petersonApp");
const hint = document.getElementById("algorithmHint");
const backMutexBtn = document.getElementById("backToAlgorithms");
const backSemaphoreBtn = document.getElementById("backFromSemaphores");
const backConditionBtn = document.getElementById("backFromConditions");
const backMonitorBtn = document.getElementById("backFromMonitors");
const backBarrierBtn = document.getElementById("backFromBarriers");
const backJoinBtn = document.getElementById("backFromJoin");
const backPetersonBtn = document.getElementById("backFromPeterson");
const algorithmButtons = Array.from(
  document.querySelectorAll(".algorithm-btn"),
);

// Flags para no inicializar dos veces cada UI
let mutexInitialized = false;
let semaphoreInitialized = false;
let conditionInitialized = false;
let monitorInitialized = false;
let barrierInitialized = false;
let joinInitialized = false;
let petersonInitialized = false;

function hideAllApps() {
  // Primero oculto todo, luego muestro solo la vista elegida
  mutexApp.classList.add("hidden");
  semaphoreApp.classList.add("hidden");
  conditionApp.classList.add("hidden");
  monitorApp.classList.add("hidden");
  barrierApp.classList.add("hidden");
  joinApp.classList.add("hidden");
  petersonApp.classList.add("hidden");
}

function enterMutexSimulator() {
  // Salgo del selector visual.
  selector.classList.add("hidden");
  hideAllApps();
  // Muestro la app de mutex.
  mutexApp.classList.remove("hidden");

  // init solo una vez para evitar registrar listeners repetidos.
  if (!mutexInitialized) {
    UI.init(engine);
    mutexInitialized = true;
  }
}

function enterSemaphoreSimulator() {
  selector.classList.add("hidden");
  hideAllApps();
  // Muestro la app de semaforos.
  semaphoreApp.classList.remove("hidden");

  if (!semaphoreInitialized) {
    SemaphoreUI.init(engine);
    semaphoreInitialized = true;
  }
}

function enterConditionSimulator() {
  selector.classList.add("hidden");
  hideAllApps();
  // Muestro la app de variables de condicion.
  conditionApp.classList.remove("hidden");

  if (!conditionInitialized) {
    ConditionUI.init(engine);
    conditionInitialized = true;
  }
}

function enterMonitorSimulator() {
  selector.classList.add("hidden");
  hideAllApps();
  // Muestro la app de monitores.
  monitorApp.classList.remove("hidden");

  if (!monitorInitialized) {
    MonitorUI.init(engine);
    monitorInitialized = true;
  }
}

function enterBarrierSimulator() {
  selector.classList.add("hidden");
  hideAllApps();
  // Muestro la app de barreras.
  barrierApp.classList.remove("hidden");

  if (!barrierInitialized) {
    BarrierUI.init(engine);
    barrierInitialized = true;
  }
}

function enterJoinSimulator() {
  selector.classList.add("hidden");
  hideAllApps();
  // Muestro la app de join/await.
  joinApp.classList.remove("hidden");

  if (!joinInitialized) {
    JoinUI.init(engine);
    joinInitialized = true;
  }
}

function enterPetersonSimulator() {
  selector.classList.add("hidden");
  hideAllApps();
  // Muestro la app de Peterson.
  petersonApp.classList.remove("hidden");

  if (!petersonInitialized) {
    PetersonUI.init(engine);
    petersonInitialized = true;
  }
}

function showSelector() {
  // Si habia auto activo en algun modulo, lo detengo antes de volver
  UI.stopAuto();
  SemaphoreUI.stopAuto();
  ConditionUI.stopAuto();
  MonitorUI.stopAuto();
  BarrierUI.stopAuto();
  JoinUI.stopAuto();
  PetersonUI.stopAuto();
  hideAllApps();
  // Regreso a la pantalla inicial de algoritmos
  selector.classList.remove("hidden");
  // Limpio mensajes viejos del hint
  hint.innerText = "";
}

algorithmButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Cada boton trae su algoritmo por data-attribute
    const algorithm = button.dataset.algorithm;
    if (algorithm === "mutex") {
      enterMutexSimulator();
      return;
    }
    if (algorithm === "semaphores") {
      enterSemaphoreSimulator();
      return;
    }
    if (algorithm === "condition-variables") {
      enterConditionSimulator();
      return;
    }
    if (algorithm === "monitors") {
      enterMonitorSimulator();
      return;
    }
    if (algorithm === "barriers") {
      enterBarrierSimulator();
      return;
    }
    if (algorithm === "join-await") {
      enterJoinSimulator();
      return;
    }
    if (algorithm === "peterson") {
      enterPetersonSimulator();
      return;
    }

    // Los algoritmos que aun no tienen modulo real caen aca
    hint.innerText =
      "Este algoritmo aun no esta implementado. Usa alguno de los modulos activos del menu."; //Provisional mientras agrego los otros
  });
});

// Botones de regreso al selector principal.
backMutexBtn.addEventListener("click", showSelector);
backSemaphoreBtn.addEventListener("click", showSelector);
backConditionBtn.addEventListener("click", showSelector);
backMonitorBtn.addEventListener("click", showSelector);
backBarrierBtn.addEventListener("click", showSelector);
backJoinBtn.addEventListener("click", showSelector);
backPetersonBtn.addEventListener("click", showSelector);
