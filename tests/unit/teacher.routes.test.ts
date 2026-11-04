import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import request from "supertest";
import { AppError } from "../../src/errors/AppError"; 

jest.mock("../../src/services/teacher.service.js", () => ({
  registerStudents: jest.fn(),
  getCommonStudents: jest.fn(),  
  suspendStudent: jest.fn(), 
  getNotificationRecipients: jest.fn(),
}));

import app from "../../src/app.js";
import * as teacherService from "../../src/services/teacher.service.js";

const mockedRegister = jest.mocked(teacherService.registerStudents);
const mockedCommon = jest.mocked(teacherService.getCommonStudents);
const mockedSuspend = jest.mocked(teacherService.suspendStudent);
const mockedNotification = jest.mocked(teacherService.getNotificationRecipients);

//strory 1: POST /api/register
describe("POST /api/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRegister.mockResolvedValue(undefined);
  });
  it("returns 400 when students is a string instead of an array", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ teacher: "teacherken@gmail.com", students: "studentjon@gmail.com" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("students");
  });

  it("returns 400 when a student is not a string", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ teacher: "teacherken@gmail.com", students: [123] });

    expect(res.status).toBe(400);
  });

  it("returns 400 when teacher is null", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ teacher: null, students: ["studentjon@gmail.com"] });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("teacher");
  });

  it("returns 400 when the body is a JSON array", async () => {
    const res = await request(app).post("/api/register").send([]);

    expect(res.status).toBe(400);
  });

  it("returns 400 when Content-Type is not JSON", async () => {
    const res = await request(app)
      .post("/api/register")
      .set("Content-Type", "text/plain")
      .send('{"teacher":"teacherken@gmail.com","students":["studentjon@gmail.com"]}');

    expect(res.status).toBe(400);
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it("returns 413 when the student list makes the body too large", async () => {
    const students = Array.from({ length: 1001 }, (_, i) => `s${i}@gmail.com`);

    const res = await request(app)
      .post("/api/register")
      .send({ teacher: "teacherken@gmail.com", students });

    expect(res.status).toBe(413);
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it("returns 400 when an email is too long", async () => {
    const longEmail = `${"a".repeat(250)}@gmail.com`;

    const res = await request(app)
      .post("/api/register")
      .send({ teacher: longEmail, students: ["studentjon@gmail.com"] });

    expect(res.status).toBe(400);
  });

  it("rejects SQL injection attempts as invalid emails", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ teacher: "x'; DROP TABLE teachers; --", students: ["studentjon@gmail.com"] });

    expect(res.status).toBe(400);
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it("ignores unknown extra fields", async () => {
    mockedRegister.mockResolvedValue(undefined);

    const res = await request(app)
      .post("/api/register")
      .send({ teacher: "teacherken@gmail.com", students: ["studentjon@gmail.com"], admin: true });

    expect(res.status).toBe(204);
    expect(mockedRegister).toHaveBeenCalledWith("teacherken@gmail.com", ["studentjon@gmail.com"]);
  });
  it("returns 204 for a valid request", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({
        teacher: "teacherken@gmail.com",
        students: ["studentjon@gmail.com", "studenthon@gmail.com"],
      });

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(mockedRegister).toHaveBeenCalledWith("teacherken@gmail.com", [
      "studentjon@gmail.com",
      "studenthon@gmail.com",
    ]);
  });

  it("returns 400 when teacher email is invalid", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ teacher: "bad", students: ["studentjon@gmail.com"] });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("teacher");
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it("returns 400 when students is missing", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ teacher: "teacherken@gmail.com" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("students");
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await request(app)
      .post("/api/register")
      .set("Content-Type", "application/json")
      .send('{"teacher": ');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Request body is not valid JSON");
  });

  it("returns 500 with a generic message when the service fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockedRegister.mockRejectedValue(new Error("Sensitive DB details"));

    const res = await request(app)
      .post("/api/register")
      .send({
        teacher: "teacherken@gmail.com",
        students: ["studentjon@gmail.com"],
      });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Internal server error");
    expect(JSON.stringify(res.body)).not.toContain("Sensitive");
  });
  
});

//story 2: GET /api/commonstudents
describe("GET /api/commonstudents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("returns 400 when teacher is an empty string", async () => {
    const res = await request(app).get("/api/commonstudents?teacher=");

    expect(res.status).toBe(400);
  });

  it("accepts an unencoded @ in the query string", async () => {
    mockedCommon.mockResolvedValue([]);

    const res = await request(app).get("/api/commonstudents?teacher=teacherken@gmail.com");

    expect(res.status).toBe(200);
    expect(mockedCommon).toHaveBeenCalledWith(["teacherken@gmail.com"]);
  });
  it("returns 200 with students for a single teacher", async () => {
    mockedCommon.mockResolvedValue(["commonstudent1@gmail.com", "commonstudent2@gmail.com"]);

    const res = await request(app).get(
      "/api/commonstudents?teacher=teacherken%40gmail.com"
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      students: ["commonstudent1@gmail.com", "commonstudent2@gmail.com"],
    });
    expect(mockedCommon).toHaveBeenCalledWith(["teacherken@gmail.com"]);
  });

  it("passes multiple teachers to the service", async () => {
    mockedCommon.mockResolvedValue(["commonstudent1@gmail.com"]);

    const res = await request(app).get(
      "/api/commonstudents?teacher=teacherken%40gmail.com&teacher=teacherjoe%40gmail.com"
    );

    expect(res.status).toBe(200);
    expect(mockedCommon).toHaveBeenCalledWith([
      "teacherken@gmail.com",
      "teacherjoe@gmail.com",
    ]);
  });

  it("returns an empty list when no students match", async () => {
    mockedCommon.mockResolvedValue([]);

    const res = await request(app).get("/api/commonstudents?teacher=nobody%40gmail.com");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ students: [] });
  });

  it("returns 400 when teacher is missing", async () => {
    const res = await request(app).get("/api/commonstudents");

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("teacher");
    expect(mockedCommon).not.toHaveBeenCalled();
  });

  it("returns 400 when a teacher email is invalid", async () => {
    const res = await request(app).get("/api/commonstudents?teacher=bad");

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Invalid email address");
    expect(mockedCommon).not.toHaveBeenCalled();
  });

  it("returns 500 with a generic message when the service fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockedCommon.mockRejectedValue(new Error("Sensitive DB details"));

    const res = await request(app).get(
      "/api/commonstudents?teacher=teacherken%40gmail.com"
    );

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Internal server error" });
  });

  it("returns 405 for wrong HTTP method", async () => {
    const res = await request(app).post("/api/commonstudents");

    expect(res.status).toBe(405);
    expect(res.body).toEqual({ message: "Method not allowed" });
  });
});
//story 3: POST /api/suspend
describe("POST /api/suspend", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSuspend.mockResolvedValue(undefined);
  });

  it("returns 204 for a valid request", async () => {
    const res = await request(app)
      .post("/api/suspend")
      .send({ student: "studentmary@gmail.com" });

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(mockedSuspend).toHaveBeenCalledWith("studentmary@gmail.com");
  });

  it("returns 404 when the student does not exist", async () => {
    mockedSuspend.mockRejectedValue(
      new AppError(404, "Student not found: nobody@gmail.com")
    );

    const res = await request(app)
      .post("/api/suspend")
      .send({ student: "nobody@gmail.com" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Student not found: nobody@gmail.com" });
  });

  it("returns 400 when student email is invalid", async () => {
    const res = await request(app).post("/api/suspend").send({ student: "bad" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("student");
    expect(mockedSuspend).not.toHaveBeenCalled();
  });

  it("returns 400 when student is missing", async () => {
    const res = await request(app).post("/api/suspend").send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("student");
    expect(mockedSuspend).not.toHaveBeenCalled();
  });

  it("returns 500 with a generic message when the service fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockedSuspend.mockRejectedValue(new Error("Sensitive DB details"));

    const res = await request(app)
      .post("/api/suspend")
      .send({ student: "studentmary@gmail.com" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Internal server error" });
  });

  it("returns 405 for wrong HTTP method", async () => {
    const res = await request(app).get("/api/suspend");

    expect(res.status).toBe(405);
    expect(res.body).toEqual({ message: "Method not allowed" });
  });
});

//story 4: POST /api/retrievefornotifications
describe("POST /api/retrievefornotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("returns 400 when notification is not a string", async () => {
    const res = await request(app)
      .post("/api/retrievefornotifications")
      .send({ teacher: "teacherken@gmail.com", notification: 123 });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("notification");
  });

  it("returns 400 when notification is too long", async () => {
    const res = await request(app)
      .post("/api/retrievefornotifications")
      .send({ teacher: "teacherken@gmail.com", notification: "a".repeat(5001) });

    expect(res.status).toBe(400);
  });
  it("returns 200 with recipients", async () => {
    mockedNotification.mockResolvedValue([
      "studentbob@gmail.com",
      "studentagnes@gmail.com",
      "studentmiche@gmail.com",
    ]);

    const res = await request(app)
      .post("/api/retrievefornotifications")
      .send({
        teacher: "teacherken@gmail.com",
        notification: "Hello students! @studentagnes@gmail.com @studentmiche@gmail.com",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      recipients: ["studentbob@gmail.com", "studentagnes@gmail.com", "studentmiche@gmail.com"],
    });
    expect(mockedNotification).toHaveBeenCalledWith(
      "teacherken@gmail.com",
      "Hello students! @studentagnes@gmail.com @studentmiche@gmail.com"
    );
  });

  it("returns 200 with an empty list when nobody qualifies", async () => {
    mockedNotification.mockResolvedValue([]);

    const res = await request(app)
      .post("/api/retrievefornotifications")
      .send({ teacher: "teacherken@gmail.com", notification: "Hey everybody" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ recipients: [] });
  });

  it("returns 400 when notification is missing", async () => {
    const res = await request(app)
      .post("/api/retrievefornotifications")
      .send({ teacher: "teacherken@gmail.com" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("notification");
    expect(mockedNotification).not.toHaveBeenCalled();
  });

  it("returns 400 when teacher email is invalid", async () => {
    const res = await request(app)
      .post("/api/retrievefornotifications")
      .send({ teacher: "bad", notification: "Hey everybody" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("teacher");
  });

  it("returns 500 with a generic message when the service fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockedNotification.mockRejectedValue(new Error("Sensitive DB details"));

    const res = await request(app)
      .post("/api/retrievefornotifications")
      .send({ teacher: "teacherken@gmail.com", notification: "Hey everybody" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Internal server error" });
  });

  it("returns 405 for wrong HTTP method", async () => {
    const res = await request(app).get("/api/retrievefornotifications");

    expect(res.status).toBe(405);
    expect(res.body).toEqual({ message: "Method not allowed" });
  });
});

//unkown routes
describe("Unknown routes", () => {
  it("returns 404", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("Security headers", () => {
  it("sets helmet security headers", async () => {
    const res = await request(app).get("/api/does-not-exist");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});