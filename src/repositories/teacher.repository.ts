import pool from "../config/database.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

// Story 1: POST /api/register
export async function registerStudents(
  teacherEmail: string,
  studentEmails: string[]
): Promise<void> {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Create teacher if not exists
    await conn.query(
      "INSERT INTO teachers (email) VALUES (?) ON DUPLICATE KEY UPDATE email = email",
      [teacherEmail]
    );

    // Create students if not exist (bulk insert)
    await conn.query(
      "INSERT INTO students (email) VALUES ? ON DUPLICATE KEY UPDATE email = email",
      [studentEmails.map((e) => [e])]
    );

    // Link teacher to students (skip existing links)
    await conn.query(
      `INSERT INTO teacher_students (teacher_id, student_id)
       SELECT t.id, s.id
       FROM teachers t
       JOIN students s ON s.email IN (?)
       WHERE t.email = ?
       ON DUPLICATE KEY UPDATE teacher_id = teacher_students.teacher_id`,
      [studentEmails, teacherEmail]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Story 2: GET /api/commonstudents
interface EmailRow extends RowDataPacket {
  email: string;
}

export async function findCommonStudents(teacherEmails: string[]): Promise<string[]> {
  const [rows] = await pool.query<EmailRow[]>(
    `SELECT s.email
     FROM students s
     JOIN teacher_students ts ON ts.student_id = s.id
     JOIN teachers t ON t.id = ts.teacher_id
     WHERE t.email IN (?)
     GROUP BY s.id, s.email
     HAVING COUNT(DISTINCT t.id) = ?
     ORDER BY s.email`,
    [teacherEmails, teacherEmails.length]
  );

  return rows.map((row) => row.email);
}

// Story 3: POST /api/suspend
export async function suspendStudent(studentEmail: string): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE students SET is_suspended = TRUE WHERE email = ?",
    [studentEmail]
  );

  return result.affectedRows > 0;
}

//story 4: GET /api/retrievefornotifications
/** Students registered to the teacher who are NOT suspended. */
export async function findActiveStudentsOfTeacher(
  teacherEmail: string
): Promise<string[]> {
  const [rows] = await pool.query<EmailRow[]>(
    `SELECT s.email
     FROM students s
     JOIN teacher_students ts ON ts.student_id = s.id
     JOIN teachers t ON t.id = ts.teacher_id
     WHERE t.email = ?
       AND s.is_suspended = FALSE
     ORDER BY s.email`,
    [teacherEmail]
  );

  return rows.map((row) => row.email);
}

/** Of the given emails, returns those belonging to suspended students. */
export async function findSuspendedStudents(studentEmails: string[]): Promise<string[]> {
  if (studentEmails.length === 0) return [];

  const [rows] = await pool.query<EmailRow[]>(
    "SELECT email FROM students WHERE email IN (?) AND is_suspended = TRUE",
    [studentEmails]
  );

  return rows.map((row) => row.email);
}
