const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("[postgres] Unexpected error on idle client", err);
});

async function withRetry(fn, { retries = 10, delayMs = 3000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      console.error(`[postgres] Attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

async function initDb() {
  await withRetry(() => pool.query("SELECT 1"));

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(10, 2) NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM products");
  if (rows[0].count === 0) {
    console.log("[postgres] Seeding sample products...");
    await pool.query(`
      INSERT INTO products (name, description, price, stock) VALUES
        ('Wireless Mouse', 'Ergonomic 2.4GHz wireless mouse', 15.99, 120),
        ('Mechanical Keyboard', 'RGB backlit mechanical keyboard', 49.99, 75),
        ('USB-C Hub', '7-in-1 USB-C hub with HDMI', 24.50, 200),
        ('Laptop Stand', 'Adjustable aluminum laptop stand', 32.00, 60),
        ('Webcam 1080p', 'Full HD webcam with autofocus', 39.99, 90);
    `);
  }

  console.log("[postgres] Database ready");
}

module.exports = { pool, initDb };
