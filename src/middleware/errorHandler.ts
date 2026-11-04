import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // Errors from express.json(): malformed JSON, body too large, etc.
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ message: "Request body is not valid JSON" });
    return;
  }

  if (err?.type === "entity.too.large") {
    res.status(413).json({ message: "Request body is too large" });
    return;
  }

  req.log.error({ err }, "Unhandled error");
  res.status(500).json({ message: "Internal server error" });
};