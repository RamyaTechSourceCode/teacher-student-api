import { randomUUID } from "node:crypto";
import express from "express";
import helmet from "helmet";
import teacherRoutes from "./routes/teacher.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { pinoHttp } from "pino-http";
import { logger } from "./config/logger.js";

const app = express();

app.use(helmet());

app.use(
  pinoHttp({
    logger,

    // Reuse the caller's request ID if valid, otherwise generate one
    genReqId: (req, res) => {
      const incoming = req.headers["x-request-id"];
      const id =
        typeof incoming === "string" && incoming.length > 0 && incoming.length <= 100
          ? incoming
          : randomUUID();
      res.setHeader("x-request-id", id);
      return id;
    },

    // 5xx = error, 4xx = warn, everything else = info
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },

    // Keep request logs small, and leave out query strings (they contain emails)
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url?.split("?")[0] }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  })
);

app.use(express.json({ limit: "100kb" }));

app.use("/api", teacherRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler); // must be last

export default app;
