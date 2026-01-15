// src/app/api/organizations/select/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
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

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, organizationId },
  });

  if (!membership) {
    return NextResponse.json(
      { error: 'Not a member of this organization' },
      { status: 403 },
    );
  }

  // update primary org on user as well
  await prisma.user.update({
    where: { id: user.id },
    data: { organizationId },
  });

  const cookieStore = await cookies();
  cookieStore.set('orgId', organizationId, {
    httpOnly: true,
    path: '/',
  });

  return NextResponse.json({ ok: true });
}
