import { Thread } from "../core/thread.js";
import { Instructions } from "../core/instructions.js";
import { Barrier } from "../core/barrier.js";

// Escenario: carrera con checkpoint de barrera.
export function createRaceBarrierScenario(engine, racerCount) {
  const safeRacers = Math.max(1, Number(racerCount) || 1);
  const barrier = new Barrier(safeRacers);

  const race = {
    barrier,
    totalRacers: safeRacers,
    passedCheckpointCount: 0, // Cuantos ya lograron cruzar la barrera.
    finishedCount: 0, // Cuantos llegaron a meta.
  };

  for (let i = 1; i <= safeRacers; i++) {
    // Flujo simple para explicar barrera:
    // 1) correr al checkpoint
    // 2) esperar barrera
    // 3) correr a meta
    const instructions = [
      { type: Instructions.RUN_STAGE, stage: "to-checkpoint" },
      { type: Instructions.BARRIER_WAIT },
      { type: Instructions.RUN_STAGE, stage: "to-finish" },
      { type: Instructions.END },
    ];

    const racer = new Thread(`Corredor-${i}`, instructions);
    racer.role = "racer";
    racer.passedCheckpoint = false;
    racer.finishedRace = false;
    engine.addThread(racer);
  }

  return { race };
}
