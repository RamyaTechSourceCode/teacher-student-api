import { env } from "./config/env.js";
import app from "./app.js";
import pool from "./config/database.js";
import { logger } from "./config/logger.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function start(): Promise<void> {
  try {
    await pool.query("SELECT 1");
    logger.info("Database connected");
  } catch (err) {
    logger.fatal({ err }, "Database connection failed");
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "Server listening");
  });

  server.on("error", (err) => {
    logger.fatal({ err }, "Failed to start server");
    process.exit(1);
  });

  let shuttingDown = false;

  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Shutting down");

    // Force exit if connections don't close in time
    setTimeout(() => {
      logger.error("Shutdown timed out, forcing exit");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    // Stop accepting new connections; let in-flight requests finish
    server.close(async (err) => {
      try {
        await pool.end();
        logger.info("Shutdown complete");
        process.exit(err ? 1 : 0);
      } catch (closeErr) {
        logger.error({ err: closeErr }, "Error closing database pool");
        process.exit(1);
      }
    });

    // Close idle keep-alive connections so server.close() isn't kept waiting
    server.closeIdleConnections();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// Last-resort safety nets: log and exit, so Docker can restart a clean process
process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled promise rejection");
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  process.exit(1);
});

start();