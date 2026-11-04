import "dotenv/config";
import app from "./app.js";
import pool from "./config/database.js";
import {env}  from "./config/env.js";

const port = env.PORT || 3000;

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("Database connected");

    const server = app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });

    server.on("error", (err) => {
      console.error("Failed to start server:", err);
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
    console.error("Database connection failed:", err);
    process.exit(1);
  }
}

start();