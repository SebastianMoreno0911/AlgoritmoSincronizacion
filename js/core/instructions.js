// Conjunto de tipos de instruccion soportados por el motor.
export const Instructions = {
  ACQUIRE: "acquire", // Intentar tomar el mutex.
  WITHDRAW: "withdraw", // Retirar dinero de la cuenta.
  DEPOSIT: "deposit", // Ingresar dinero en la cuenta.
  RELEASE: "release", // Soltar el mutex.
  WAIT_SEM: "wait_sem", // Intentar tomar un token del semaforo.
  PRINT: "print", // Simular impresion de trabajo.
  SIGNAL_SEM: "signal_sem", // Liberar token del semaforo.
  WAIT_FOOD: "wait_food", // Cliente espera comida si aun no esta lista.
  EAT_FOOD: "eat_food", // Cliente consume el plato reservado.
  COOK_DISH: "cook_dish", // Chef prepara un plato.
  SIGNAL_FOOD: "signal_food", // Chef avisa que hay comida lista.
  ENTER_READ: "enter_read", // Lector intenta entrar al monitor en modo lectura.
  READ_BOOK: "read_book", // Lector lee el libro compartido.
  EXIT_READ: "exit_read", // Lector sale del monitor.
  ENTER_WRITE: "enter_write", // Escritor intenta entrar al monitor en modo escritura.
  UPDATE_CATALOG: "update_catalog", // Escritor actualiza catalogo.
  EXIT_WRITE: "exit_write", // Escritor sale del monitor.
  RUN_STAGE: "run_stage", // Corredor avanza en un tramo de la carrera.
  BARRIER_WAIT: "barrier_wait", // Corredor espera en checkpoint hasta que lleguen todos.
  BUILD_STAGE: "build_stage", // Trabajador construye una etapa de la casa.
  JOIN_THREAD: "join_thread", // Espera a que termine un hilo especifico.
  AWAIT_ALL: "await_all", // Espera a que termine un grupo de hilos.
  COMPLETE_HOUSE: "complete_house", // Marca entrega final de la casa.
  PETERSON_LOCK: "peterson_lock", // Robot intenta entrar a estacion compartida.
  USE_STATION: "use_station", // Robot usa la estacion critica.
  PETERSON_UNLOCK: "peterson_unlock", // Robot libera estacion compartida.
  END: "end", // Finalizar ejecucion del hilo.
};
