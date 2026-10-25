import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isChildPreviewMode } from "@/lib/child/preview-mode";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const publicPage = pathname === "/child/voice-guide" || pathname === "/parent/sign-in" ||
    pathname.startsWith("/child") && isChildPreviewMode(request.nextUrl.searchParams);
  const incoming = new Headers(request.headers);
  incoming.set("x-wordspire-public-page", publicPage ? "1" : "0");
  if (!publicPage) {
    const session = await getSession(request);
    if (!session || session.role !== (pathname.startsWith("/parent") ? "guardian" : "child")) {
      return NextResponse.redirect(new URL(pathname.startsWith("/parent") ? "/parent/sign-in" : "/child/voice-guide", request.url));
    }
  }
  return NextResponse.next({ request: { headers: incoming } });
}

export const config = { runtime: "nodejs", matcher: ["/child/:path*", "/parent/:path*"] };
