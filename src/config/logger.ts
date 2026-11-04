import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level:
    process.env.NODE_ENV === "test"
      ? "silent"
      : (process.env.LOG_LEVEL ?? (isDev ? "debug" : "info")),
  redact: ["req.headers.authorization", "req.headers.cookie"],
  ...(isDev && {
    transport: { target: "pino-pretty", options: { colorize: true } },
  }),
});
