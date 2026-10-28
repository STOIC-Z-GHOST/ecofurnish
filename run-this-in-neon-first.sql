-- Run this ONCE in the Neon SQL editor (on the database your Vercel app uses)
-- BEFORE deploying cart-and-stock-update-2. Safe to run twice.
CREATE TABLE IF NOT EXISTS order_stock_holds (
  order_id text PRIMARY KEY REFERENCES orders(id),
  state    text NOT NULL,
  note     text,
  since    timestamp NOT NULL DEFAULT now()
);
