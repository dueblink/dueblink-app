import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const country =
    req.headers.get('x-vercel-ip-country')?.toUpperCase() || 'UNKNOWN';

  return NextResponse.json(
    {
      country,
      isIndia: country === 'IN' || country === 'UNKNOWN',
    },
    {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    }
  );
}