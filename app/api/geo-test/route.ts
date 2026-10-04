import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  return NextResponse.json({
    country: req.headers.get('x-vercel-ip-country'),
    region: req.headers.get('x-vercel-ip-country-region'),
    city: req.headers.get('x-vercel-ip-city'),
    ip: req.headers.get('x-forwarded-for'),
cloudflareIp: req.headers.get('cf-connecting-ip'),
cloudflareCountry: req.headers.get('cf-ipcountry'),
  });
}