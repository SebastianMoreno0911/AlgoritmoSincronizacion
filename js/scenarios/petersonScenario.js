import { Thread } from "../core/thread.js";
import { Instructions } from "../core/instructions.js";
import { PetersonLock } from "../core/petersonLock.js";

// Escenario: dos robots comparten una misma estacion critica.
export function createPetersonScenario(engine, cyclesPerRobot) {
  const cycles = Math.max(1, Number(cyclesPerRobot) || 1);
  const lock = new PetersonLock();

  const station = {
    lock,
    usageCount: [0, 0], // Cuantas veces uso estacion cada robot.
    totalUses: 0,
  };

  // Para Peterson deben ser exactamente 2 participantes (0 y 1).
  for (let i = 0; i < 2; i++) {
    const instructions = [];
    for (let c = 0; c < cycles; c++) {
      instructions.push({ type: Instructions.PETERSON_LOCK });
      instructions.push({ type: Instructions.USE_STATION, cycle: c + 1 });
      instructions.push({ type: Instructions.PETERSON_UNLOCK });
    }
    instructions.push({ type: Instructions.END });

    const robot = new Thread(`Robot-${i + 1}`, instructions);
    robot.petersonId = i;
    engine.addThread(robot);
  }

  return { station };
}
