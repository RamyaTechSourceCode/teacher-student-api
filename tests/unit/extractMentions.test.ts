import { describe, it, expect } from "@jest/globals";
import { extractMentions } from "../../src/utils/extractMentions.js";

describe("extractMentions", () => {
  it("extracts mentioned emails in order", () => {
    expect(
      extractMentions("Hello students! @studentagnes@gmail.com @studentmiche@gmail.com")
    ).toEqual(["studentagnes@gmail.com", "studentmiche@gmail.com"]);
  });

  it("returns an empty array when there are no mentions", () => {
    expect(extractMentions("Hey everybody")).toEqual([]);
  });

  it("handles a mention at the start of the text", () => {
    expect(extractMentions("@studentagnes@gmail.com please see me")).toEqual([
      "studentagnes@gmail.com",
    ]);
  });

  it("strips trailing punctuation", () => {
    expect(extractMentions("Well done @studentagnes@gmail.com, and @studentmiche@gmail.com!")).toEqual([
      "studentagnes@gmail.com",
      "studentmiche@gmail.com",
    ]);
  });

  it("ignores emails that are not @mentioned", () => {
    expect(extractMentions("Email me at teacherken@gmail.com")).toEqual([]);
  });

  it("ignores mentions that are not valid emails", () => {
    expect(extractMentions("Hi @everyone and @studentagnes")).toEqual([]);
  });

  it("keeps duplicates (de-duplication happens in the service)", () => {
    expect(
      extractMentions("@studentagnes@gmail.com @studentagnes@gmail.com")
    ).toEqual(["studentagnes@gmail.com", "studentagnes@gmail.com"]);
  });
});