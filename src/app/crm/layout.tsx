// Nonce-based CSP must render each CRM request separately; no shared HTML cache.
export const dynamic = 'force-dynamic';
export default function CrmLayout({ children }: { children: React.ReactNode }) { return children; }
