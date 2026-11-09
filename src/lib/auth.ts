import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE_NAME = "genius_signal_session";
export const AUTH_SESSION_SECONDS = 60 * 60 * 8;

export function isAuthConfigured() {
  return Boolean(
    process.env.SIGNAL_AUTH_USER && process.env.SIGNAL_AUTH_PASSWORD,
  );
}

function safeEqual(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function verifyAuthCredentials(username: string, password: string) {
  const expectedUsername = process.env.SIGNAL_AUTH_USER ?? "";
  const expectedPassword = process.env.SIGNAL_AUTH_PASSWORD ?? "";
  return (
    isAuthConfigured() &&
    safeEqual(username, expectedUsername) &&
    safeEqual(password, expectedPassword)
  );
}

function sessionSignature(expiresAt: string) {
  const secret = process.env.SIGNAL_AUTH_SECRET || process.env.SIGNAL_AUTH_PASSWORD;
  if (!secret) return "";
  return createHmac("sha256", secret).update(expiresAt).digest("hex");
}

export function createAuthSession() {
  const expiresAt = String(Math.floor(Date.now() / 1000) + AUTH_SESSION_SECONDS);
  return `${expiresAt}.${sessionSignature(expiresAt)}`;
}

export function verifyAuthSession(value: string | undefined) {
  if (!value) return false;
  const [expiresAt, signature, extra] = value.split(".");
  if (
    extra !== undefined ||
    !/^\d+$/.test(expiresAt) ||
    !/^[a-f0-9]{64}$/.test(signature) ||
    Number(expiresAt) <= Math.floor(Date.now() / 1000)
  ) return false;
  return safeEqual(signature, sessionSignature(expiresAt));
}

export function safeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\"))
    return "/";
  return value;
}