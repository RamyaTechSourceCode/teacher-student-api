import "dotenv/config";
import app from "./app.js";
import pool from "./config/database.js";
import {env}  from "./config/env.js";
import { logger } from "./config/logger.js";

const port = env.PORT || 3000;

async function start() {
  try {
    await pool.query("SELECT 1");
    logger.info("Database connected");

    const server = app.listen(port, () => {
      logger.info(`Server running on http://localhost:${port}`);
    });

    server.on("error", (err) => {
      logger.fatal({ err }, "Failed to start server");
      process.exit(1);
    });

    const shutdown = () => {
      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (err) {
    logger.fatal({ err }, "Database connection failed");
    process.exit(1);
  }
}

start();