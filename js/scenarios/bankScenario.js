import { Thread } from "../core/thread.js";
import { Instructions } from "../core/instructions.js";
import { Mutex } from "../core/mutex.js";

// Crea un escenario inicial de banco con N hilos
export function createBankScenario(
  engine,
  threadCount,
  operations,
  initialBalance,
) {
  const mutex = new Mutex();
  const account = { balance: initialBalance }; // Estado compartido

  for (let i = 1; i <= threadCount; i++) {
    // Cada hilo ejecuta una operacion configurada en la interfaz
    const operation = operations[i - 1] ?? {
      type: Instructions.WITHDRAW,
      amount: 100,
    };
    const amount = Math.max(0, Number(operation.amount) || 0);

    // Flujo base: entrar, operar, salir, terminar
    const instructions = [
      { type: Instructions.ACQUIRE },
      { type: operation.type, amount },
      { type: Instructions.RELEASE },
      { type: Instructions.END },
    ];

    const thread = new Thread(`Cliente-${i}`, instructions);
    engine.addThread(thread);
  }

  return { mutex, account };
}
