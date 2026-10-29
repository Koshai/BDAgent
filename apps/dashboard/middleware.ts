import "./lib/normalize-env";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";

export default async function middleware(req: NextRequest) {
  const session = await auth();
  const path = req.nextUrl.pathname;
  const publicPath =
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/api/auth");

  if (path.startsWith("/app") && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (!session && path.startsWith("/stores")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (session && (path === "/login" || path === "/register")) {
    return NextResponse.redirect(new URL("/app", req.url));
  }
  if (session && path === "/") {
    return NextResponse.redirect(new URL("/app", req.url));
  }
  if (!session && !publicPath && path.startsWith("/app")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
