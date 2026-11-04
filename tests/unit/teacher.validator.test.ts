import { describe, it, expect } from "@jest/globals";
import { notificationSchema ,suspendSchema, commonStudentsSchema, registerSchema } from "../../src/validators/teacher.validator.js";

//story 1: POST /api/register
describe("registerSchema", () => {
  it("accepts a valid request and trims emails", () => {
  const result = registerSchema.safeParse({
    teacher: "  TeacherKen@Gmail.com ",
    students: ["StudentJon@gmail.com"],
  });

  expect(result.success).toBe(true);
  expect(result.data).toEqual({
    teacher: "TeacherKen@Gmail.com",
    students: ["StudentJon@gmail.com"],
  });
});

  it("rejects an invalid teacher email", () => {
    const result = registerSchema.safeParse({
      teacher: "not-an-email",
      students: ["studentjon@gmail.com"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid student email", () => {
    const result = registerSchema.safeParse({
      teacher: "teacherken@gmail.com",
      students: ["studentjon@gmail.com", "bad-email"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty students array", () => {
    const result = registerSchema.safeParse({
      teacher: "teacherken@gmail.com",
      students: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing students field", () => {
    const result = registerSchema.safeParse({
      teacher: "teacherken@gmail.com",
    });

    expect(result.success).toBe(false);
  });
  it("rejects more than 1000 students", () => {
    const students = Array.from({ length: 1001 }, (_, i) => `s${i}@gmail.com`);
    const result = registerSchema.safeParse({ teacher: "teacherken@gmail.com", students });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 1000 students", () => {
    const students = Array.from({ length: 1000 }, (_, i) => `s${i}@gmail.com`);
    const result = registerSchema.safeParse({ teacher: "teacherken@gmail.com", students });
    expect(result.success).toBe(true);
  });
});
//story 2: GET /api/commonstudents
describe("commonStudentsSchema", () => {
  it("converts a single teacher into an array", () => {
    const result = commonStudentsSchema.safeParse({ teacher: "teacherken@gmail.com" });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ teacher: ["teacherken@gmail.com"] });
  });

  it("accepts multiple teachers", () => {
    const result = commonStudentsSchema.safeParse({
      teacher: ["teacherken@gmail.com", "teacherjoe@gmail.com"],
    });

    expect(result.success).toBe(true);
    expect(result.data?.teacher).toHaveLength(2);
  });

  it("rejects a missing teacher", () => {
    const result = commonStudentsSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("rejects an invalid teacher email", () => {
    const result = commonStudentsSchema.safeParse({
      teacher: ["teacherken@gmail.com", "not-an-email"],
    });

    expect(result.success).toBe(false);
  });
});

//story 3: POST /api/suspend
describe("suspendSchema", () => {
  it("accepts a valid student email and trims it", () => {
    const result = suspendSchema.safeParse({ student: "  studentmary@gmail.com " });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ student: "studentmary@gmail.com" });
  });

  it("rejects an invalid student email", () => {
    const result = suspendSchema.safeParse({ student: "not-an-email" });

    expect(result.success).toBe(false);
  });

  it("rejects a missing student", () => {
    const result = suspendSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("rejects a non-string student", () => {
    const result = suspendSchema.safeParse({ student: ["studentmary@gmail.com"] });

    expect(result.success).toBe(false);
  });
});

//story 4: POST /api/retrievefornotifications
describe("notificationSchema", () => {
  it("accepts a valid request", () => {
    const result = notificationSchema.safeParse({
      teacher: "teacherken@gmail.com",
      notification: "Hello students! @studentagnes@gmail.com",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a missing notification", () => {
    const result = notificationSchema.safeParse({ teacher: "teacherken@gmail.com" });

    expect(result.success).toBe(false);
  });

  it("rejects an empty notification", () => {
    const result = notificationSchema.safeParse({
      teacher: "teacherken@gmail.com",
      notification: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid teacher email", () => {
    const result = notificationSchema.safeParse({
      teacher: "not-an-email",
      notification: "Hey everybody",
    });

    expect(result.success).toBe(false);
  });
});