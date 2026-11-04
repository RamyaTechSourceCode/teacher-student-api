import { z } from "zod";

// "@" not preceded by a letter, digit, dot or "@" (so "bob@gmail.com" in plain text is not a mention),
// followed by an email address
const MENTION_PATTERN =
  /(?<![\w.@])@([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const emailSchema = z.email();

/**
 * Extracts @mentioned email addresses from notification text, in order of appearance.
 * Invalid emails are ignored. Duplicates are NOT removed here.
 */
export function extractMentions(text: string): string[] {
  const mentions: string[] = [];

  for (const match of text.matchAll(MENTION_PATTERN)) {
    const candidate = match[1];
    if (emailSchema.safeParse(candidate).success) {
      mentions.push(candidate);
    }
  }

  return mentions;
}