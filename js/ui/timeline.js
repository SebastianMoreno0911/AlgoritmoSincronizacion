import { create } from "../utils/dom.js";

// Registro cronologico de eventos del simulador.
export class Timeline {
  constructor(container) {
    this.container = container;
  }

  // Inserta un evento nuevo al inicio del timeline.
  addEvent(text) {
    const log = create("div");
    log.className = "text-[11px] font-mono py-1.5 border-b border-gray-800";

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour12: false,
      minute: "2-digit",
      second: "2-digit",
    });

    log.innerHTML = `<span class="text-green-500">[${timeStr}]</span> <span class="text-gray-200">${text}</span>`;

    // Inserta arriba para mostrar primero lo mas reciente.
    this.container.prepend(log);
  }

  // Limpia todos los eventos del timeline.
  clear() {
    this.container.innerHTML = "";
  }
}
