import { Router } from "express";
import { retrieveForNotifications, suspendStudent, getCommonStudents,register } from "../controllers/teacher.controller.js";
import { validateBody } from "../middleware/validateBody.js";
import { notificationSchema, suspendSchema, commonStudentsSchema,registerSchema } from "../validators/teacher.validator.js";
import { validateQuery } from "../middleware/validateQuery.js";
import { AppError } from "../errors/AppError.js";

const router = Router();

//router.post("/register", validateBody(registerSchema), register);
router
  .route("/register")
  .post(validateBody(registerSchema), register)
  .all(() => {
    throw new AppError(405, "Method not allowed");
  });

router
  .route("/commonstudents")
  .get(validateQuery(commonStudentsSchema), getCommonStudents)
  .all(() => {
    throw new AppError(405, "Method not allowed");
  });

router
  .route("/suspend")
  .post(validateBody(suspendSchema), suspendStudent)
  .all(() => {
    throw new AppError(405, "Method not allowed");
  });

router
  .route("/retrievefornotifications")
  .post(validateBody(notificationSchema), retrieveForNotifications)
  .all(() => {
    throw new AppError(405, "Method not allowed");
  });
  
export default router;