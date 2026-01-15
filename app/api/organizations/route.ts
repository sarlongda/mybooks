// app/api/organizations/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // cookies() is typed as Promise<ReadonlyRequestCookies> → await it
  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get('orgId')?.value ?? null;

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  });

  const items = memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    role: m.role, // enum OWNER | ADMIN | STAFF
  }));

  const activeOrganizationId =
    cookieOrgId && items.some((o) => o.id === cookieOrgId)
      ? cookieOrgId
      : user.organizationId && items.some((o) => o.id === user.organizationId)
      ? user.organizationId
      : items[0]?.id ?? null;

  return NextResponse.json({ activeOrganizationId, items });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const rawName = body?.name;
  const name = typeof rawName === 'string' ? rawName.trim() : '';

  if (!name) {
    return NextResponse.json(
      { error: 'Name is required' },
      { status: 400 },
    );
  }

  const slugBase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const slug = `${slugBase || 'business'}-${Date.now().toString(36)}`;

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      baseCurrency: 'USD',
      memberships: {
        create: {
          userId: user.id,
          role: 'OWNER',
        },
      },
      users: {
        connect: { id: user.id },
      },
    },
  });

  // also update user's primary org
  await prisma.user.update({
    where: { id: user.id },
    data: { organizationId: org.id },
  });

  // Create response and set cookie on the *response* (not via cookies())
  const res = NextResponse.json(
    { id: org.id, name: org.name, role: 'OWNER' },
    { status: 201 },
  );

  res.cookies.set('orgId', org.id, {
    httpOnly: true,
    path: '/',
  });

  return res;
}
