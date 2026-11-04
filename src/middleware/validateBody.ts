import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../errors/AppError.js";

export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue.path.join(".") || "body";
      return next(new AppError(400, `${field}: ${issue.message}`));
    }

    req.body = result.data; // cleaned values (trimmed)
    next();
  };
