import { describe, it, expect } from "@jest/globals";
import { extractMentions } from "../../src/utils/extractMentions.js";

describe("extractMentions", () => {
  it("handles mentions separated by commas without spaces", () => {
    expect(extractMentions("Hi @a@gmail.com,@b@gmail.com")).toEqual([
        "a@gmail.com",
        "b@gmail.com",
    ]);
    });

  it("handles mentions inside brackets", () => {
    expect(extractMentions("Hi (@a@gmail.com)")).toEqual(["a@gmail.com"]);
    });

  it("handles a mention at the end of a sentence", () => {
    expect(extractMentions("Please see me @a@gmail.com.")).toEqual(["a@gmail.com"]);
    });

  it("handles mentions on new lines", () => {
    expect(extractMentions("Hi\n@a@gmail.com\n@b@gmail.com")).toEqual([
        "a@gmail.com",
        "b@gmail.com",
    ]);
    });

  it("keeps the original letter case", () => {
    expect(extractMentions("@StudentAgnes@Gmail.com")).toEqual(["StudentAgnes@Gmail.com"]);
    });
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