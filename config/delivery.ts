// Delivery times, written once. The support chatbot (lib/support.ts) and the
// product page both read from here, so they can never disagree.
//
// PLACEHOLDER NUMBERS: these are sample figures for the demo store. Replace
// them with the real ones and every place that mentions delivery updates.
//
// Two separate stages, counted in business days:
//   1. Preparing: the order is packed and handed to the delivery team.
//   2. Delivering: the trip from our hand-off to the customer's door.
export const DELIVERY = {
  prepare: [1, 2],
  deliverAddis: [1, 2],
  deliverElsewhere: [3, 7],
} as const;

type Range = readonly [number, number];

function fmt([min, max]: Range) {
  return min === max ? String(min) : `${min}-${max}`;
}

function add(a: Range, b: Range): Range {
  return [a[0] + b[0], a[1] + b[1]];
}

/** Total time from placing the order to arrival, for each area. */
export const DELIVERY_TOTAL = {
  addis: fmt(add(DELIVERY.prepare, DELIVERY.deliverAddis)),
  elsewhere: fmt(add(DELIVERY.prepare, DELIVERY.deliverElsewhere)),
};

/** The full explanation, in plain words, for the chatbot. */
export const DELIVERY_SUMMARY =
  `Orders are packed and handed to our delivery team within ${fmt(DELIVERY.prepare)} business days. ` +
  `After that, delivery takes ${fmt(DELIVERY.deliverAddis)} business days within Addis Ababa and ` +
  `${fmt(DELIVERY.deliverElsewhere)} business days elsewhere in Ethiopia. ` +
  `In total, most orders arrive within ${DELIVERY_TOTAL.addis} business days in Addis Ababa ` +
  `and ${DELIVERY_TOTAL.elsewhere} business days elsewhere in Ethiopia, counted from the day you order.`;
