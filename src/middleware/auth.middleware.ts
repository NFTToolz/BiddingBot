import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

export async function authMiddleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    console.log({ secret });

    const { payload } = await jose.jwtVerify(token, secret);

    console.log({ payload });

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("X-User-ID", payload.userId as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("Token verification error:", error);

    if (
      error instanceof jose.errors.JWTExpired ||
      error instanceof jose.errors.JWTInvalid ||
      error instanceof jose.errors.JWTClaimValidationFailed
    ) {
      const response = NextResponse.redirect(
        new URL("/auth/signin", request.url)
      );
      response.cookies.delete("token");
      return response;
    }
    return NextResponse.next();
  }
}
