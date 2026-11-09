import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, isAuthConfigured, verifyAuthSession } from "@/lib/auth";

function continueRequest(request: NextRequest, isLoginPage = false) {
  const headers = new Headers(request.headers);
  headers.set("x-signal-login-page", isLoginPage ? "1" : "0");
  return NextResponse.next({ request: { headers } });
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/ingest") return NextResponse.next();
  if (request.nextUrl.pathname === "/login")
    return continueRequest(request, true);
  if (!isAuthConfigured()) {
    const host = request.headers.get("host") ?? request.nextUrl.host;
    const hostname = new URL(`http://${host}`).hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]"
    ) return continueRequest(request);
    return new NextResponse(
      "Configure SIGNAL_AUTH_USER and SIGNAL_AUTH_PASSWORD before exposing this workspace to a network.",
      { status: 503 },
    );
  }
  if (verifyAuthSession(request.cookies.get(AUTH_COOKIE_NAME)?.value))
    return continueRequest(request);
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
