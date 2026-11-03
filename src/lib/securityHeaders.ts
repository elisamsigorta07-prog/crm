export function crmCsp(nonce: string, supabaseOrigin: string, development: boolean) {
  const websocket = supabaseOrigin.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
  return [
    "default-src 'self'", `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${development ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self'", "worker-src 'self' blob:",
    `connect-src 'self' ${supabaseOrigin} ${websocket}${development ? ' ws://localhost:* ws://127.0.0.1:*' : ''}`,
    `frame-src 'self' blob: ${supabaseOrigin}`, "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
  ].join('; ');
}
export const baselineHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
];
