import { PEOPLE, productIds, type Archetype, type ProductId } from '../../data/catalog';
import type { Session } from '../types';
import { capacity } from '../inventory/inventory';

// One integer PRNG state is persisted; rendering never draws random numbers from it.
export function random(state: Session): number {
  let x = state.rng >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  state.rng = x >>> 0;
  return state.rng / 4_294_967_296;
}
export function purchaseChance(price: number, reputation: number, archetype: Archetype): number {
  const p = PEOPLE[archetype];
  const value = ((10_000 - price) / 10_000) * p.sensitivity;
  return Math.min(
    0.97,
    Math.max(0.08, 0.76 + value + (reputation - 50) / 300 + (archetype === 'loyal' ? 0.12 : 0)),
  );
}
export function chooseProduct(
  state: Session,
  archetype: Archetype,
  budget: number,
): ProductId | null {
  const options = productIds.filter(
    (id) =>
      state.menu[id].active && state.menu[id].price <= budget && capacity(state.inventory, id) > 0,
  );
  if (!options.length) return null;
  const weights = options.map(
    (id) =>
      (id === PEOPLE[archetype].favorite ? 3 : 1) *
      (1 + (100_000 - state.menu[id].price) / 100_000),
  );
  let draw = random(state) * weights.reduce((a, b) => a + b, 0);
  return options.find((_, i) => (draw -= weights[i]) <= 0) ?? options[options.length - 1];
}
