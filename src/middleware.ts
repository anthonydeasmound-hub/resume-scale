import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPaths = [
  "/dashboard",
  "/master-resume",
  "/review",
  "/applied",
  "/onboarding",
  "/extension",
  "/tools",
];

// Security headers are set in next.config.ts via async headers().
// This middleware handles auth-only redirects for protected routes.

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  if (!token) {
    const signInUrl = new URL("/", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/master-resume",
    "/review",
    "/applied/:path*",
    "/onboarding",
    "/extension",
    "/tools",
  ],
};
