import { RESOURCE_LOOKUP, RESOURCE_TYPES } from "./game-data.js";

export function createMarket() {
  return Object.fromEntries(
    RESOURCE_TYPES.map((resource) => [
      resource.id,
      {
        buy: resource.baseBuy,
        sell: resource.baseSell
      }
    ])
  );
}

export function buyResource(state, resourceId, quantity = 5) {
  const resource = RESOURCE_LOOKUP[resourceId];
  const price = state.market[resourceId];
  const cost = Math.round(price.buy * quantity);

  if (!resource || state.player.gold < cost) {
    return { ok: false, message: "Not enough gold for that trade." };
  }

  state.player.gold -= cost;
  state.player.resources[resourceId] += quantity;
  moveMarketPrice(price, resource, 1);

  return {
    ok: true,
    message: `Bought ${quantity} ${resource.name} for ${cost} gold.`
  };
}

export function sellResource(state, resourceId, quantity = 5) {
  const resource = RESOURCE_LOOKUP[resourceId];
  const price = state.market[resourceId];

  if (!resource || state.player.resources[resourceId] < quantity) {
    return { ok: false, message: "Not enough stock in your satchel." };
  }

  const value = Math.round(price.sell * quantity);
  state.player.resources[resourceId] -= quantity;
  state.player.gold += value;
  moveMarketPrice(price, resource, -1);

  return {
    ok: true,
    message: `Sold ${quantity} ${resource.name} for ${value} gold.`
  };
}

function moveMarketPrice(price, resource, direction) {
  if (direction > 0) {
    price.buy = clamp(price.buy + 1, resource.floor + 6, resource.ceiling);
    price.sell = clamp(price.sell + 1, resource.floor, price.buy - 5);
  } else {
    price.sell = clamp(price.sell - 1, resource.floor, resource.ceiling - 8);
    price.buy = clamp(price.buy - 1, price.sell + 5, resource.ceiling);
  }
}

export function canPay(resources, cost) {
  return Object.entries(cost).every(([resourceId, amount]) => {
    return (resources[resourceId] ?? 0) >= amount;
  });
}

export function payCost(resources, cost) {
  for (const [resourceId, amount] of Object.entries(cost)) {
    resources[resourceId] = (resources[resourceId] ?? 0) - amount;
  }
}

export function formatCost(cost) {
  return Object.entries(cost)
    .filter(([, amount]) => amount > 0)
    .map(([resourceId, amount]) => `${amount} ${RESOURCE_LOOKUP[resourceId].name}`)
    .join(", ");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
