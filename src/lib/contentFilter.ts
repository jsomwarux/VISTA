// Basic content filter for user-generated content
// Checks for objectionable language in reviews and comments

const OBJECTIONABLE_PATTERNS: RegExp[] = [
  // Slurs and hate speech patterns
  /\bn[i1]gg[aer]/i,
  /\bf[a@]gg?[o0]t/i,
  /\bk[i1]ke\b/i,
  /\bsp[i1]c\b/i,
  /\bch[i1]nk\b/i,
  /\bwetback/i,
  /\btr[a@]nn[yi]/i,
  /\bretard/i,
  // Threats and violence
  /\bkill\s+(your|my|him|her|them)self/i,
  /\bi('ll|m going to)\s+kill\s+you/i,
  /\bdeath\s+threat/i,
  // Explicit sexual content
  /\bp[o0]rn/i,
  /\bh[e3]nt[a@][i1]/i,
];

export interface ContentFilterResult {
  isClean: boolean;
  reason?: string;
}

export function filterContent(text: string): ContentFilterResult {
  if (!text || text.trim().length === 0) {
    return { isClean: true };
  }

  for (const pattern of OBJECTIONABLE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isClean: false,
        reason: 'Your content contains language that violates our community guidelines. Please revise and try again.',
      };
    }
  }

  return { isClean: true };
}
