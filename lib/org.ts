// lib/org.ts
'use server';

import { cookies } from 'next/headers';
import { prisma } from './db';
import { getCurrentUser } from './auth';
import { OrganizationRole } from '@prisma/client';

export async function getActiveOrganizationId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // In app router, cookies() is sync and read-only
  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get('orgId')?.value || null;

  // 1) If cookie is set AND user is a member of that org → use it
  if (cookieOrgId) {
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id, organizationId: cookieOrgId },
    });
    if (membership) {
      return cookieOrgId;
    }
  }

  // 2) If user.organizationId is set AND they’re a member there → use it
  if (user.organizationId) {
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id, organizationId: user.organizationId },
    });
    if (membership) {
      return user.organizationId;
    }
  }

  // 3) Otherwise pick first membership (oldest org)
  const existingMembership = await prisma.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  });

  if (existingMembership) {
    return existingMembership.organizationId;
  }

  // 4) If user has NO orgs at all, create a default one and link it
  const orgName = user.name ? `${user.name}'s Business` : 'My Business';

  const slugBase = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const slug = `${slugBase || 'business'}-${Date.now().toString(36)}`;

  const org = await prisma.organization.create({
    data: {
      name: orgName,
      slug,
      baseCurrency: 'USD',
      memberships: {
        create: {
          userId: user.id,
          role: OrganizationRole.OWNER,
        },
      },
      users: {
        connect: { id: user.id },
      },
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { organizationId: org.id },
  });

  // We *only* return the org id here; cookie setting is done in API routes
  return org.id;
}
