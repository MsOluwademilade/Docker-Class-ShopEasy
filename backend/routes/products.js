const express = require("express");
const { pool } = require("../db");
const { redisClient } = require("../redisClient");

const router = express.Router();
const CACHE_TTL_SECONDS = 60;
const LIST_CACHE_KEY = "products:all";

// GET /api/products - list all products (cached in Redis)
router.get("/", async (req, res) => {
  try {
    const cached = await redisClient.get(LIST_CACHE_KEY);
    if (cached) {
      return res.json({ source: "cache", products: JSON.parse(cached) });
    }

    const { rows } = await pool.query(
      "SELECT id, name, description, price, stock, created_at FROM products ORDER BY id ASC"
    );

    await redisClient.set(LIST_CACHE_KEY, JSON.stringify(rows), { EX: CACHE_TTL_SECONDS });

    res.json({ source: "database", products: rows });
  } catch (err) {
    console.error("[products] list error", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /api/products/:id - single product
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json({ product: rows[0] });
  } catch (err) {
    console.error("[products] get error", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// POST /api/products - create a product (invalidates cache)
router.post("/", async (req, res) => {
  const { name, description, price, stock } = req.body || {};
  if (!name || price === undefined) {
    return res.status(400).json({ error: "name and price are required" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO products (name, description, price, stock)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description || null, price, stock || 0]
    );

    await redisClient.del(LIST_CACHE_KEY);

    res.status(201).json({ product: rows[0] });
  } catch (err) {
    console.error("[products] create error", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

module.exports = router;
