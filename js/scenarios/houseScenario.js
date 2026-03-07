import { Thread } from "../core/thread.js";
import { Instructions } from "../core/instructions.js";
import { JoinManager } from "../core/joinManager.js";

// Escenario Join/Await: construccion de casa con dependencias de tareas.
export function createHouseScenario(engine, durations) {
  const d = {
    foundation: Math.max(1, Number(durations.foundation) || 1),
    walls: Math.max(1, Number(durations.walls) || 1),
    roof: Math.max(1, Number(durations.roof) || 1),
    installations: Math.max(1, Number(durations.installations) || 1),
  };

  const house = {
    delivered: false,
    // Progreso por etapa para render visual.
    stages: {
      Cimientos: { current: 0, total: d.foundation, owner: "Maestro-Cimientos", done: false },
      Paredes: { current: 0, total: d.walls, owner: "Maestro-Paredes", done: false },
      Techo: { current: 0, total: d.roof, owner: "Techador", done: false },
      Instalaciones: {
        current: 0,
        total: d.installations,
        owner: "Instalador",
        done: false,
      },
    },
  };

  const joinManager = new JoinManager();

  // 1) Cimientos: arranca de inmediato.
  const foundationWorker = new Thread("Maestro-Cimientos", [
    { type: Instructions.BUILD_STAGE, stage: "Cimientos", duration: d.foundation },
    { type: Instructions.END },
  ]);

  // 2) Paredes: depende de cimientos (join).
  const wallWorker = new Thread("Maestro-Paredes", [
    { type: Instructions.JOIN_THREAD, target: "Maestro-Cimientos" },
    { type: Instructions.BUILD_STAGE, stage: "Paredes", duration: d.walls },
    { type: Instructions.END },
  ]);

  // 3) Techo: depende de paredes.
  const roofWorker = new Thread("Techador", [
    { type: Instructions.JOIN_THREAD, target: "Maestro-Paredes" },
    { type: Instructions.BUILD_STAGE, stage: "Techo", duration: d.roof },
    { type: Instructions.END },
  ]);

  // 4) Instalaciones: depende de paredes.
  const installationWorker = new Thread("Instalador", [
    { type: Instructions.JOIN_THREAD, target: "Maestro-Paredes" },
    { type: Instructions.BUILD_STAGE, stage: "Instalaciones", duration: d.installations },
    { type: Instructions.END },
  ]);

  // 5) Arquitecto: await de techo+instalaciones para entregar casa.
  const architect = new Thread("Arquitecto", [
    { type: Instructions.AWAIT_ALL, targets: ["Techador", "Instalador"] },
    { type: Instructions.COMPLETE_HOUSE },
    { type: Instructions.END },
  ]);

  engine.addThread(foundationWorker);
  engine.addThread(wallWorker);
  engine.addThread(roofWorker);
  engine.addThread(installationWorker);
  engine.addThread(architect);

  return { house, joinManager, architectThread: architect };
}
