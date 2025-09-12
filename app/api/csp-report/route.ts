import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  console.log('CSP report', JSON.stringify(body, null, 2));
  return new NextResponse(null, { status: 204 });
}