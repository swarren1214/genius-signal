"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_SECONDS,
  createAuthSession,
  isAuthConfigured,
  safeRedirectPath,
  verifyAuthCredentials,
} from "@/lib/auth";

export async function signIn(
  _state: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  if (!isAuthConfigured())
    return { error: "Sign-in is not configured for this deployment." };
  const usernameValue = formData.get("username");
  const passwordValue = formData.get("password");
  const username = typeof usernameValue === "string" ? usernameValue : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  if (!verifyAuthCredentials(username, password))
    return { error: "That username and password did not match." };

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, createAuthSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_SESSION_SECONDS,
  });
  const nextValue = formData.get("next");
  redirect(safeRedirectPath(typeof nextValue === "string" ? nextValue : "/"));
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect("/login");
}