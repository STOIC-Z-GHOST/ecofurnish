// How long a sold-out product stays sold out before it refills by itself,
// and how many units it comes back with. Used in two places that must agree:
//
//  - the server (lib/auto-restock.ts), for a product that's out of stock for
//    EVERYONE (stock 0 in the database), and
//  - the browser (lib/simulated-stock.ts), for a product one visitor's own
//    demo purchases have sold out for THEM only.
//
// To change either number, edit it here and redeploy.
export const RESTOCK_AFTER_HOURS = 6;
export const RESTOCK_QUANTITY = 20;
