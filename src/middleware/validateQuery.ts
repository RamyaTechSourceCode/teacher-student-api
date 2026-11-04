import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../errors/AppError.js";

export const validateQuery =
  (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue.path.join(".") || "query";
      return next(new AppError(400, `${field}: ${issue.message}`));
    }

    // Express 5: req.query is read-only, so store validated values here
    res.locals.query = result.data;
    next();
  };