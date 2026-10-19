import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/ingest") return NextResponse.next();
  const user = process.env.SIGNAL_AUTH_USER;
  const password = process.env.SIGNAL_AUTH_PASSWORD;
  if (!user || !password) {
    const hostname = request.nextUrl.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") return NextResponse.next();
    return new NextResponse("Configure SIGNAL_AUTH_USER and SIGNAL_AUTH_PASSWORD before exposing this workspace to a network.", { status: 503 });
  }
  const expected = createHash("sha256").update(`Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`).digest();
  const actual = createHash("sha256").update(request.headers.get("authorization") ?? "").digest();
  if (!timingSafeEqual(expected, actual)) return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Genius Signal", charset="UTF-8"' } });
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };