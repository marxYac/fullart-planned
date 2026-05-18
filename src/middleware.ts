import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isDashboardRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const authObject = await auth();
  
  if (isAdminRoute(req) || isDashboardRoute(req)) {
    if (!authObject.userId) {
      return authObject.redirectToSignIn();
    }
    
    const role = (authObject.sessionClaims?.metadata as any)?.role || "client";
    
    if (isAdminRoute(req)) {
      if (role !== "admin" && role !== "super_user") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
    
    if (isDashboardRoute(req)) {
      if (role !== "admin" && role !== "super_user" && role !== "operator") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
