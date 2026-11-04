import * as teacherRepository from "../repositories/teacher.repository.js";
import { AppError } from "../errors/AppError.js";
import { extractMentions } from "../utils/extractMentions.js";
import { logger } from "../config/logger.js";

export async function registerStudents(
  teacher: string,
  students: string[]
): Promise<void> {
  //const uniqueStudents = [...new Set(students)];//will not consider case-insensitive duplicates, so using a custom function below
   const uniqueStudents = uniqueEmailsIgnoreCase(students);
  await teacherRepository.registerStudents(teacher, uniqueStudents);
  logger.info({ studentCount: uniqueStudents.length }, "Students registered to teacher");
}

export async function getCommonStudents(teachers: string[]): Promise<string[]> {
  const uniqueTeachers = uniqueEmailsIgnoreCase(teachers);
  const students = await teacherRepository.findCommonStudents(uniqueTeachers);
  logger.debug(
    { teacherCount: uniqueTeachers.length, studentCount: students.length },
    "Common students retrieved"
  );
  return students;
}

export async function suspendStudent(student: string): Promise<void> {
  const found = await teacherRepository.suspendStudent(student);

  if (!found) {
    throw new AppError(404, `Student not found: ${student}`);
  }
  logger.info("Student suspended");
}

export async function getNotificationRecipients(
  teacher: string,
  notification: string
): Promise<string[]> {
  const mentioned = extractMentions(notification);

  const [registered, suspended] = await Promise.all([
    teacherRepository.findActiveStudentsOfTeacher(teacher),
    teacherRepository.findSuspendedStudents(mentioned),
  ]);

  const suspendedKeys = new Set(suspended.map((email) => email.toLowerCase()));
  const eligibleMentioned = mentioned.filter(
    (email) => !suspendedKeys.has(email.toLowerCase())
  );

  const recipients = uniqueEmailsIgnoreCase([...registered, ...eligibleMentioned]);

  logger.debug(
    {
      registeredCount: registered.length,
      mentionedCount: mentioned.length,
      recipientCount: recipients.length,
    },
    "Notification recipients resolved"
  );

  return recipients;
}

/** Removes duplicate emails, ignoring case (MySQL compares emails case-insensitively). */
function uniqueEmailsIgnoreCase(emails: string[]): string[] {
  const seen = new Map<string, string>();
  for (const email of emails) {
    const key = email.toLowerCase();
    if (!seen.has(key)) seen.set(key, email);
  }
  return [...seen.values()];
}
