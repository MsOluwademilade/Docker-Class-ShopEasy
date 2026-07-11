require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { pool, initDb } = require("./db");
const { redisClient, initRedis } = require("./redisClient");
const productsRouter = require("./routes/products");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// Health check - used by Docker HEALTHCHECK and Compose depends_on
app.get("/health", async (req, res) => {
  const status = { service: "shopeasy-backend", status: "ok", db: "unknown", redis: "unknown" };
  try {
    await pool.query("SELECT 1");
    status.db = "connected";
  } catch (err) {
    status.db = "error";
    status.status = "degraded";
  }
  try {
    await redisClient.ping();
    status.redis = "connected";
  } catch (err) {
    status.redis = "error";
    status.status = "degraded";
  }
  res.status(status.status === "ok" ? 200 : 503).json(status);
});

app.use("/api/products", productsRouter);

app.get("/", (req, res) => {
  res.json({ message: "ShopEasy backend API", docs: "/api/products, /health" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

async function start() {
  try {
    await initDb();
    await initRedis();

    app.listen(PORT, () => {
      console.log(`[server] ShopEasy backend listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("[server] Failed to start:", err);
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  console.log("[server] SIGTERM received, shutting down gracefully");
  await pool.end();
  await redisClient.quit();
  process.exit(0);
});

start();
