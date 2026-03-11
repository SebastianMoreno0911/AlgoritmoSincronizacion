import { Thread } from "../core/thread.js";
import { Instructions } from "../core/instructions.js";
import { LibraryMonitor } from "../core/monitorLibrary.js";

// Escenario de biblioteca con estudiantes lectores y bibliotecario escritor
export function createLibraryScenario(engine, readerCount, writerUpdates) {
  const safeReaders = Math.max(1, Number(readerCount) || 1);
  const safeUpdates = Math.max(1, Number(writerUpdates) || 1);

  const library = {
    monitor: new LibraryMonitor(),
    catalogVersion: 1, // Version del catalogo para mostrar cambios
    totalReads: 0, // Cuantas lecturas completaron los estudiantes
    totalWrites: 0, // Cuantas actualizaciones hizo el bibliotecario
  };

  // Creo estudiantes lectores
  for (let i = 1; i <= safeReaders; i++) {
    const readInstructions = [
      { type: Instructions.ENTER_READ },
      { type: Instructions.READ_BOOK, title: `Libro-${i}` },
      { type: Instructions.EXIT_READ },
      { type: Instructions.END },
    ];
    const reader = new Thread(`Estudiante-${i}`, readInstructions);
    reader.role = "reader";
    reader.targetBook = `Libro-${i}`;
    engine.addThread(reader);
  }

  // Creo un bibliotecario escritor que actualiza varias veces
  const writerInstructions = [];
  for (let i = 0; i < safeUpdates; i++) {
    writerInstructions.push({ type: Instructions.ENTER_WRITE });
    writerInstructions.push({ type: Instructions.UPDATE_CATALOG });
    writerInstructions.push({ type: Instructions.EXIT_WRITE });
  }
  writerInstructions.push({ type: Instructions.END });

  const writer = new Thread("Bibliotecario", writerInstructions);
  writer.role = "writer";
  engine.addThread(writer);

  return { library, writerThread: writer };
}
