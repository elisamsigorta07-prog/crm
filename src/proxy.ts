import { NextRequest, NextResponse } from 'next/server';
import { crmCsp } from './lib/securityHeaders';

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const origin = configured ? new URL(configured).origin : 'https://gafqicguxykkgiuemara.supabase.co';
  const csp = crmCsp(nonce, origin, process.env.NODE_ENV !== 'production');
  const incoming = new Headers(request.headers);
  incoming.set('x-nonce', nonce);
  incoming.set('Content-Security-Policy', csp);
  const response = NextResponse.next({ request: { headers: incoming } });
  if (request.nextUrl.pathname.startsWith('/crm')) response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Cache-Control', 'no-store, private');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
export const config = { matcher: ['/crm/:path*', '/api/crm/:path*', '/api/telegram/:path*'] };
