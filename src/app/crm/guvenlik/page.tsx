import { redirect } from 'next/navigation';

// Compatibility for earlier setup links; no phone-code setup is required.
export default async function CrmSecurityPage({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  const { area } = await searchParams;
  redirect(area === 'rent' ? '/crm/rent-a-car/dashboard' : '/crm/sigorta/dashboard');
}
