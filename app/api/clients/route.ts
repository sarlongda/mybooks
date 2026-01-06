// app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get('page') || '1');
  const pageSize = Number(searchParams.get('pageSize') || '30');
  const q = searchParams.get('q') ?? '';

  // TODO: replace with real organization id from auth/session
  const organizationId = process.env.DEMO_ORG_ID;

  const where: any = {
    organizationId,
  };

  if (q) {
    where.OR = [
      { displayName: { contains: q, mode: 'insensitive' } },
      { company: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [totalItems, clients] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.ceil(totalItems / pageSize);

  return NextResponse.json({
    items: clients.map((c) => ({
      id: c.id,
      name: c.displayName,
      company: c.company,
      email: c.email,
      phone: c.phone,
      city: c.city,
      country: c.country,
      createdAt: c.createdAt,
    })),
    page,
    pageSize,
    totalItems,
    totalPages,
  });
}

export async function POST(req: NextRequest) {
  // TODO: replace with real organization id from auth/session
  const organizationId = process.env.DEMO_ORG_ID || 'demo-org-1';

  const body = await req.json();

  // This shape should match what your ClientFormPage sends
  const {
    name,
    company,
    email,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    notes,
  } = body;

  if (!name) {
    return NextResponse.json(
      { error: 'Name is required' },
      { status: 400 },
    );
  }

  const client = await prisma.client.create({
    data: {
      organizationId,
      displayName: name,
      company: company || null,
      email: email || null,
      phone: phone || null,
      addressLine1: addressLine1 || null,
      addressLine2: addressLine2 || null,
      city: city || null,
      state: state || null,
      postalCode: postalCode || null,
      country: country || null,
    },
  });

  // Return in the same shape the frontend expects
  return NextResponse.json(
    {
      id: client.id,
      name: client.displayName,
      company: client.company,
      email: client.email,
      phone: client.phone,
      city: client.city,
      country: client.country,
      createdAt: client.createdAt,
    },
    { status: 201 },
  );
}
