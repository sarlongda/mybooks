// src/lib/auth.ts
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";

const AUTH_COOKIE_NAME = "auth_token";

// Use a real secret in .env
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

type AuthTokenPayload = {
  userId: string;
  organizationId: string;
  email: string;
};

export async function createAuthToken(payload: AuthTokenPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAuthToken(
  token: string
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyAuthToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { organization: true },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    organizationId: user.organizationId,
  };
}

export async function getCurrentOrganizationId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.organizationId ?? null;
}

export function setAuthCookie(res: Response, token: string) {
  // When using NextResponse, we’ll overwrite cookies there,
  // so this helper is just conceptual; we’ll inline cookie.set in routes.
}
