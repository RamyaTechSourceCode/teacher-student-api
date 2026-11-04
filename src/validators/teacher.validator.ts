import { z } from "zod";

const email = z
  .string()
  .trim()
  .pipe(z.email("Invalid email address").max(254, "Email is too long"));

// ---------- Story 1: POST /api/register ----------
export const registerSchema = z.object({
  teacher: email,
  students: z
    .array(email)
    .min(1, "At least one student is required")
    .max(1000, "Cannot register more than 100 students at once"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ---------- Story 2: GET /api/commonstudents ----------
const toArray = (value: unknown) =>
  value === undefined || Array.isArray(value) ? value : [value];

export const commonStudentsSchema = z.object({
  teacher: z.preprocess(
    toArray,
    z
      .array(email, { error: "At least one teacher is required" })
      .min(1, "At least one teacher is required")
      .max(100, "Cannot query more than 100 teachers at once")
  ),
});

export type CommonStudentsQuery = z.infer<typeof commonStudentsSchema>;

// ---------- Story 3: POST /api/suspend ----------
export const suspendSchema = z.object(
  {
    student: email,
  },
  { error: "Request body must be a JSON object" }
);

export type SuspendInput = z.infer<typeof suspendSchema>;

// ---------- Story 4: POST /api/retrievefornotifications ----------
export const notificationSchema = z.object(
  {
    teacher: email,
    notification: z
      .string({
        error: (iss) => (iss.input === undefined ? "Field is required" : "Must be a string"),
      })
      .trim()
      .min(1, "Notification cannot be empty")
      .max(5000, "Notification is too long"),
  },
  { error: "Request body must be a JSON object" }
);

export type NotificationInput = z.infer<typeof notificationSchema>;