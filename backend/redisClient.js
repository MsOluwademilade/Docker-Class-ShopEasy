const { createClient } = require("redis");

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT || 6379),
    reconnectStrategy: (retries) => Math.min(retries * 200, 5000),
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on("error", (err) => console.error("[redis] Client error", err.message));
redisClient.on("connect", () => console.log("[redis] Connecting..."));
redisClient.on("ready", () => console.log("[redis] Ready"));

async function initRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

module.exports = { redisClient, initRedis };
