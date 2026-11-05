import { describe, it, expect, jest, beforeEach } from "@jest/globals";

jest.mock("../../src/repositories/teacher.repository.js", () => ({
  registerStudents: jest.fn(),
  findCommonStudents: jest.fn(),
  suspendStudent: jest.fn(),
  findActiveStudentsOfTeacher: jest.fn(),
  findSuspendedStudents: jest.fn(),
}));

import * as teacherRepository from "../../src/repositories/teacher.repository.js";
import {
  getNotificationRecipients,
  suspendStudent,
  getCommonStudents,
  registerStudents,
} from "../../src/services/teacher.service.js";
import { AppError } from "../../src/errors/AppError";

const mockedRegister = jest.mocked(teacherRepository.registerStudents);
const mockedFindCommon = jest.mocked(teacherRepository.findCommonStudents);
const mockedSuspend = jest.mocked(teacherRepository.suspendStudent);
const mockedFindActive = jest.mocked(teacherRepository.findActiveStudentsOfTeacher);
const mockedFindSuspended = jest.mocked(teacherRepository.findSuspendedStudents);

//story 1: POST /api/register
describe("teacherService.registerStudents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("removes duplicate students ignoring letter case", async () => {
    mockedRegister.mockResolvedValue(undefined);

    await registerStudents("teacherken@gmail.com", [
      "studentjon@gmail.com",
      "StudentJon@Gmail.com",
    ]);

    expect(mockedRegister).toHaveBeenCalledWith("teacherken@gmail.com", [
      "studentjon@gmail.com",
    ]);
  });
  it("passes teacher and students to the repository", async () => {
    mockedRegister.mockResolvedValue(undefined);

    await registerStudents("teacherken@gmail.com", [
      "studentjon@gmail.com",
      "studenthon@gmail.com",
    ]);

    expect(mockedRegister).toHaveBeenCalledWith("teacherken@gmail.com", [
      "studentjon@gmail.com",
      "studenthon@gmail.com",
    ]);
  });

  it("removes duplicate students before saving", async () => {
    mockedRegister.mockResolvedValue(undefined);

    await registerStudents("teacherken@gmail.com", [
      "studentjon@gmail.com",
      "studentjon@gmail.com",
    ]);

    expect(mockedRegister).toHaveBeenCalledWith("teacherken@gmail.com", [
      "studentjon@gmail.com",
    ]);
  });

  it("propagates repository errors", async () => {
    mockedRegister.mockRejectedValue(new Error("DB down"));

    await expect(
      registerStudents("teacherken@gmail.com", ["studentjon@gmail.com"])
    ).rejects.toThrow("DB down");
  });
});

//story 2: GET /api/commonstudents
describe("teacherService.getCommonStudents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns students from the repository", async () => {
    mockedFindCommon.mockResolvedValue(["commonstudent1@gmail.com"]);

    const result = await getCommonStudents(["teacherken@gmail.com"]);

    expect(result).toEqual(["commonstudent1@gmail.com"]);
    expect(mockedFindCommon).toHaveBeenCalledWith(["teacherken@gmail.com"]);
  });

  it("removes duplicate teachers, ignoring case", async () => {
    mockedFindCommon.mockResolvedValue([]);

    await getCommonStudents(["teacherken@gmail.com", "TeacherKen@Gmail.com"]);

    expect(mockedFindCommon).toHaveBeenCalledWith(["teacherken@gmail.com"]);
  });

  it("propagates repository errors", async () => {
    mockedFindCommon.mockRejectedValue(new Error("DB down"));

    await expect(getCommonStudents(["teacherken@gmail.com"])).rejects.toThrow("DB down");
  });
});

//story 3: POST /api/suspend
describe("teacherService.suspendStudent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("suspends an existing student", async () => {
    mockedSuspend.mockResolvedValue(true);

    await expect(suspendStudent("studentmary@gmail.com")).resolves.toBeUndefined();
    expect(mockedSuspend).toHaveBeenCalledWith("studentmary@gmail.com");
  });

  it("throws a 404 AppError when the student does not exist", async () => {
    mockedSuspend.mockResolvedValue(false);

    const promise = suspendStudent("nobody@gmail.com");

    await expect(promise).rejects.toBeInstanceOf(AppError);
    await expect(promise).rejects.toMatchObject({
      statusCode: 404,
      message: "Student not found: nobody@gmail.com",
    });
  });

  it("propagates repository errors", async () => {
    mockedSuspend.mockRejectedValue(new Error("DB down"));

    await expect(suspendStudent("studentmary@gmail.com")).rejects.toThrow("DB down");
  });

  it("excludes a suspended mentioned student even when the case differs", async () => {
    mockedFindActive.mockResolvedValue([]);
    mockedFindSuspended.mockResolvedValue(["studentmiche@gmail.com"]);

    const result = await getNotificationRecipients(
      "teacherken@gmail.com",
      "@StudentMiche@Gmail.com @studentagnes@gmail.com"
    );

    expect(result).toEqual(["studentagnes@gmail.com"]);
  });
});

//story 4: POST /api/retrievefornotifications
describe("teacherService.getNotificationRecipients", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFindActive.mockResolvedValue([]);
    mockedFindSuspended.mockResolvedValue([]);
  });

  it("returns registered students followed by mentioned students (spec example 1)", async () => {
    mockedFindActive.mockResolvedValue(["studentbob@gmail.com"]);

    const result = await getNotificationRecipients(
      "teacherken@gmail.com",
      "Hello students! @studentagnes@gmail.com @studentmiche@gmail.com"
    );

    expect(result).toEqual([
      "studentbob@gmail.com",
      "studentagnes@gmail.com",
      "studentmiche@gmail.com",
    ]);
  });

  it("returns only registered students when there are no mentions (spec example 2)", async () => {
    mockedFindActive.mockResolvedValue(["studentbob@gmail.com"]);

    const result = await getNotificationRecipients(
      "teacherken@gmail.com",
      "Hey everybody"
    );

    expect(result).toEqual(["studentbob@gmail.com"]);
  });

  it("excludes mentioned students who are suspended", async () => {
    mockedFindSuspended.mockResolvedValue(["studentmiche@gmail.com"]);

    const result = await getNotificationRecipients(
      "teacherken@gmail.com",
      "@studentagnes@gmail.com @studentmiche@gmail.com"
    );

    expect(result).toEqual(["studentagnes@gmail.com"]);
  });

  it("removes duplicates between registered and mentioned students, ignoring case", async () => {
    mockedFindActive.mockResolvedValue(["studentbob@gmail.com"]);

    const result = await getNotificationRecipients(
      "teacherken@gmail.com",
      "@StudentBob@gmail.com @studentagnes@gmail.com @studentagnes@gmail.com"
    );

    expect(result).toEqual(["studentbob@gmail.com", "studentagnes@gmail.com"]);
  });

  it("passes the teacher and mentions to the repository", async () => {
    await getNotificationRecipients("teacherken@gmail.com", "Hi @studentagnes@gmail.com");

    expect(mockedFindActive).toHaveBeenCalledWith("teacherken@gmail.com");
    expect(mockedFindSuspended).toHaveBeenCalledWith(["studentagnes@gmail.com"]);
  });

  it("propagates repository errors", async () => {
    mockedFindActive.mockRejectedValue(new Error("DB down"));

    await expect(
      getNotificationRecipients("teacherken@gmail.com", "Hey everybody")
    ).rejects.toThrow("DB down");
  });
});
