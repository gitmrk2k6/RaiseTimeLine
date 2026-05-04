import { NextRequest, NextResponse } from "next/server";

const TOKEN_KEY = "raisetimeline_token";
const PUBLIC_PATHS = ["/login", "/register"];
const PROTECTED_PREFIX = "/home";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has(TOKEN_KEY);

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isProtected = pathname === PROTECTED_PREFIX || pathname.startsWith(PROTECTED_PREFIX + "/");

  if (isProtected && !hasToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublic && hasToken) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/login", "/register"],
};
