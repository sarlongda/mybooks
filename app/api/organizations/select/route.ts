// app/api/organizations/select/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, createAuthToken } from '@/lib/auth';

const AUTH_COOKIE_NAME = 'auth_token';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const organizationId = body?.organizationId as string | undefined;

  if (!organizationId) {
    return NextResponse.json(
      { error: 'organizationId is required' },
      { status: 400 },
    );
  }

  // Make sure user belongs to this org
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, organizationId },
  });

  if (!membership) {
    return NextResponse.json(
      { error: 'Not a member of this organization' },
      { status: 403 },
    );
  }

  // 1) Update user's primary org in DB (optional but nice)
  await prisma.user.update({
    where: { id: user.id },
    data: { organizationId },
  });

  // 2) Issue a NEW auth_token with the new organizationId
  const newToken = await createAuthToken({
    userId: user.id,
    email: user.email,
    organizationId, // important
  });

  // 3) Set cookies on the response
  const res = NextResponse.json({ ok: true });

  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: newToken,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  res.cookies.set({
    name: 'orgId',
    value: organizationId,
    httpOnly: true,
    path: '/',
  });

  return res;
}
