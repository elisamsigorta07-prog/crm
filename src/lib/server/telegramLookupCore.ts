export type LookupRow = { id: string | number; [key: string]: unknown };
export type LookupSelection = { kind: 'policy' | 'customer'; id: string; customerId?: string };

export function foldLookup(value: unknown) {
  return String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}
const compact = (value: unknown) => foldLookup(value).replace(/ /g, '');
const identity = (value: unknown) => String(value ?? '').replace(/\D/g, '');
const validIdentity = (value: string) => /^\d{10,11}$/.test(value);
const link = (value: unknown) => String(value ?? '').trim().toLowerCase();
const hasName = (value: unknown, query: string) => !!query && query.split(' ').every(word => foldLookup(value).includes(word));

export function lookupDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:T[^\s]+)?$/.exec(text);
  const local = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(text);
  if (!iso && !local) return null;
  const year = Number(iso ? iso[1] : local![3]);
  const month = Number(iso ? iso[2] : local![2]);
  const day = Number(iso ? iso[3] : local![1]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function orderPolicies(rows: LookupRow[]) {
  return [...rows].sort((a, b) => (lookupDate(a.end_date) || '9999-99-99').localeCompare(lookupDate(b.end_date) || '9999-99-99') || String(a.id).localeCompare(String(b.id), 'en'));
}
function customerResolver(customers: readonly LookupRow[]) {
  const byId = new Map(customers.map(c => [link(c.id), c]));
  const byIdentity = new Map<string, LookupRow[]>();
  for (const c of customers) { const tc = identity(c.identity_no); if (validIdentity(tc)) byIdentity.set(tc, [...(byIdentity.get(tc) || []), c]); }
  return (policy: LookupRow) => {
    const direct = link(policy.customer_id) ? byId.get(link(policy.customer_id)) : undefined;
    if (direct) return direct;
    const matches = byIdentity.get(identity(policy.customer_tc));
    return matches?.length === 1 ? matches[0] : undefined;
  };
}
export function searchLookup(policies: readonly LookupRow[], customers: readonly LookupRow[], term: string): LookupSelection[] {
  const query = foldLookup(term); const number = compact(term); const digits = identity(term);
  const identityQuery = validIdentity(digits) && !/\p{L}/u.test(term);
  const matchedCards = customers.filter(c => identityQuery ? identity(c.identity_no) === digits : hasName(c.name, query));
  const direct = policies.filter(p => {
    const policyNumber = compact(p.policy_no);
    return (identityQuery ? identity(p.customer_tc) === digits || policyNumber === number : hasName(p.customer_name, query) || !!number && policyNumber.includes(number));
  });
  const customerLinks = new Set(matchedCards.map(c => link(c.id)));
  const identities = new Set(matchedCards.map(c => identity(c.identity_no)).filter(validIdentity));
  for (const row of direct) {
    if (row.customer_id !== null && row.customer_id !== undefined) customerLinks.add(link(row.customer_id));
    const tc = identity(row.customer_tc); if (validIdentity(tc)) identities.add(tc);
  }
  for (const customer of customers) if (validIdentity(identity(customer.identity_no)) && identities.has(identity(customer.identity_no))) customerLinks.add(link(customer.id));
  const directIds = new Set(direct.map(p => String(p.id)));
  const matches = orderPolicies(policies.filter(p => directIds.has(String(p.id)) || customerLinks.has(link(p.customer_id)) || validIdentity(identity(p.customer_tc)) && identities.has(identity(p.customer_tc))));
  const coveredCards = new Set<string>();
  const resolveCustomer = customerResolver(customers);
  const selections: LookupSelection[] = matches.map(p => {
    const card = resolveCustomer(p);
    if (card) coveredCards.add(String(card.id));
    return { kind: 'policy', id: String(p.id), ...(card ? { customerId: String(card.id) } : {}) };
  });
  for (const card of matchedCards.filter(c => !coveredCards.has(String(c.id))).sort((a, b) => foldLookup(a.name).localeCompare(foldLookup(b.name)) || String(a.id).localeCompare(String(b.id)))) selections.push({ kind: 'customer', id: String(card.id), customerId: String(card.id) });
  return selections;
}
export function expiringLookup(policies: readonly LookupRow[], customers: readonly LookupRow[], first: string, last: string): LookupSelection[] {
  const resolveCustomer = customerResolver(customers);
  return orderPolicies(policies.filter(p => { const end = lookupDate(p.end_date); return !!end && end >= first && end <= last; })).map(p => {
    const customer = resolveCustomer(p);
    return { kind: 'policy', id: String(p.id), ...(customer ? { customerId: String(customer.id) } : {}) };
  });
}
