// The database tables. The site creates them itself on the first visit (lib/db.ts), so there is no SQL to run.
// To set up a database by hand instead, paste everything between the backticks into the Neon SQL editor,
// or run: npm run db:setup
// Tables are prefixed bg_ so they never clash with another shop's tables if a database is ever shared.

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS bg_products (
  id                  SERIAL PRIMARY KEY,
  slug                TEXT UNIQUE NOT NULL,
  title               TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  category            TEXT NOT NULL DEFAULT 'board-games',
  era                 TEXT NOT NULL DEFAULT '',
  publisher           TEXT NOT NULL DEFAULT '',
  players             TEXT NOT NULL DEFAULT '',
  year                TEXT NOT NULL DEFAULT '',
  condition           TEXT NOT NULL DEFAULT 'good',
  completeness        TEXT NOT NULL DEFAULT 'not-counted',
  price_cents         INTEGER NOT NULL CHECK (price_cents >= 50),
  shipping_cents      INTEGER NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0),
  images              JSONB NOT NULL DEFAULT '[]'::jsonb,
  blurs               JSONB NOT NULL DEFAULT '{}'::jsonb,
  stripe_product_id   TEXT NOT NULL DEFAULT '',
  status              TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  visible             BOOLEAN NOT NULL DEFAULT TRUE,
  reserved_until      TIMESTAMPTZ,
  reserved_session_id TEXT,
  sold_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bg_products_visible_idx ON bg_products (visible, created_at DESC);

CREATE TABLE IF NOT EXISTS bg_orders (
  id                SERIAL PRIMARY KEY,
  product_id        INTEGER REFERENCES bg_products(id) ON DELETE SET NULL,
  product_title     TEXT NOT NULL,
  product_era       TEXT NOT NULL DEFAULT '',
  stripe_session_id TEXT UNIQUE NOT NULL,
  delivery          TEXT NOT NULL DEFAULT 'courier' CHECK (delivery IN ('courier', 'pickup')),
  customer_name     TEXT NOT NULL DEFAULT '',
  customer_email    TEXT NOT NULL DEFAULT '',
  customer_phone    TEXT NOT NULL DEFAULT '',
  shipping_name     TEXT NOT NULL DEFAULT '',
  shipping_address  JSONB NOT NULL DEFAULT '{}'::jsonb,
  amount_total      INTEGER NOT NULL DEFAULT 0,
  shipping_amount   INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'shipped')),
  tracking          TEXT NOT NULL DEFAULT '',
  marketing_opt_in  BOOLEAN NOT NULL DEFAULT FALSE,
  follow_up_sent_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  shipped_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS bg_orders_created_idx ON bg_orders (created_at DESC);

-- People who unsubscribed from follow-up emails
CREATE TABLE IF NOT EXISTS bg_email_optouts (
  email      TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;
