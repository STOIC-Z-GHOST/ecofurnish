-- BATCH A — run this ONCE in the Neon SQL editor (the database your Vercel
-- app uses) BEFORE deploying batch-a-update. Safe to run twice.
-- Adds the table that stores Chapa receipt details for each paid order.
CREATE TABLE IF NOT EXISTS order_payments (
  order_id        text PRIMARY KEY REFERENCES orders(id),
  chapa_reference text NOT NULL,
  method          text,
  currency        text,
  amount          text,
  charge          text,
  paid_at         timestamp,
  recorded_at     timestamp NOT NULL DEFAULT now()
);
