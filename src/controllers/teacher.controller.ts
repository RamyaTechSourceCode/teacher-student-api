import type { Request, Response } from "express";
import * as teacherService from "../services/teacher.service.js";
import type {
  NotificationInput,
  SuspendInput,
  CommonStudentsQuery,
  RegisterInput,
} from "../validators/teacher.validator.js";

// Story 1 :  POST /api/register
export async function register(req: Request, res: Response): Promise<void> {
  const { teacher, students } = req.body as RegisterInput;
  await teacherService.registerStudents(teacher, students);
  res.sendStatus(204);
}

// Story 2: GET /api/commonstudents
export async function getCommonStudents(_req: Request, res: Response): Promise<void> {
  const { teacher } = res.locals.query as CommonStudentsQuery;
  const students = await teacherService.getCommonStudents(teacher);
  res.status(200).json({ students });
}

// Story 3: POST /api/suspend
export async function suspendStudent(req: Request, res: Response): Promise<void> {
  const { student } = req.body as SuspendInput;
  await teacherService.suspendStudent(student);
  res.sendStatus(204);
}

// Story 4: POST /api/retrievefornotifications
export async function retrieveForNotifications(
  req: Request<unknown, unknown, NotificationInput>,
  res: Response
): Promise<void> {
  const { teacher, notification } = req.body;
  const recipients = await teacherService.getNotificationRecipients(
    teacher,
    notification
  );
  res.status(200).json({ recipients });
}
