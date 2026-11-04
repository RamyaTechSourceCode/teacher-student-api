import * as teacherRepository from "../repositories/teacher.repository.js";
import { AppError } from "../errors/AppError.js";
import { extractMentions } from "../utils/extractMentions.js";

export async function registerStudents(
  teacher: string,
  students: string[]
): Promise<void> {
  const uniqueStudents = [...new Set(students)];
  await teacherRepository.registerStudents(teacher, uniqueStudents);
}

export async function getCommonStudents(teachers: string[]): Promise<string[]> {
  return teacherRepository.findCommonStudents(uniqueEmailsIgnoreCase(teachers));
}

export async function suspendStudent(student: string): Promise<void> {
   const found = await teacherRepository.suspendStudent(student);

  if (!found) {
    throw new AppError(404, `Student not found: ${student}`);
  }
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

  return uniqueEmailsIgnoreCase([...registered, ...eligibleMentioned]);
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
