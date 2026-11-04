import { z } from "zod";

// "@" at the start of the text or after whitespace, followed by non-space characters
const MENTION_PATTERN = /(?:^|\s)@(\S+)/g;
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/;
const emailSchema = z.email();

/**
 * Extracts @mentioned email addresses from notification text, in order of appearance.
 * Invalid emails are ignored. Duplicates are NOT removed here.
 */
export function extractMentions(text: string): string[] {
  const mentions: string[] = [];

  for (const match of text.matchAll(MENTION_PATTERN)) {
    const candidate = match[1].replace(TRAILING_PUNCTUATION, "");

    if (emailSchema.safeParse(candidate).success) {
      mentions.push(candidate);
    }
  }

  return mentions;
}