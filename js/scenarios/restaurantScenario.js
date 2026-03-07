import { Thread } from "../core/thread.js";
import { Instructions } from "../core/instructions.js";
import { ConditionVariable } from "../core/conditionVariable.js";

// Escenario: restaurante con clientes esperando comida por variable de condicion.
export function createRestaurantScenario(engine, customerCount, mealsToCook) {
  const safeCustomers = Math.max(1, Number(customerCount) || 1);
  const safeMeals = Math.max(1, Number(mealsToCook) || 1);

  const restaurant = {
    availableDishes: 0, // Platos listos para servir.
    totalCooked: 0, // Cuantos platos preparo el chef en total.
    totalEaten: 0, // Cuantos platos se consumieron.
    mealsTarget: safeMeals, // Meta de platos a preparar.
    foodCondition: new ConditionVariable("ComidaLista"),
  };

  // Primero agrego clientes para que intenten esperar antes de que cocine el chef.
  for (let i = 1; i <= safeCustomers; i++) {
    const customerInstructions = [
      { type: Instructions.WAIT_FOOD },
      { type: Instructions.EAT_FOOD },
      { type: Instructions.END },
    ];

    const customer = new Thread(`Cliente-${i}`, customerInstructions);
    engine.addThread(customer);
  }

  // El chef cocina N platos y luego hace signal para despertar clientes.
  const chefInstructions = [];
  for (let i = 0; i < safeMeals; i++) {
    chefInstructions.push({ type: Instructions.COOK_DISH });
    chefInstructions.push({ type: Instructions.SIGNAL_FOOD });
  }
  chefInstructions.push({ type: Instructions.END });

  const chefThread = new Thread("Chef", chefInstructions);
  engine.addThread(chefThread);

  return { restaurant, chefThread };
}
