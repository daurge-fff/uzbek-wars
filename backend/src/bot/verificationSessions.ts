/**
 * Lightweight verification session store.
 *
 * Extracted from telegramBot.ts so auth routes can generate / verify
 * linking codes without importing node-telegram-bot-api and its side effects.
 */

export interface VerificationSession {
  userId: string;
  code: string;
  timestamp: number;
}

export const verificationSessions = new Map<string, VerificationSession>();

/**
 * Create a new verification session and return the random code.
 * Code is valid for 5 minutes.
 */
export const createVerificationSession = (userId: string): string => {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  verificationSessions.set(code, {
    userId,
    code,
    timestamp: Date.now()
  });
  return code;
};

// Clean up old sessions (older than 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [code, session] of verificationSessions.entries()) {
    if (now - session.timestamp > 5 * 60 * 1000) {
      verificationSessions.delete(code);
    }
  }
}, 60 * 1000);
