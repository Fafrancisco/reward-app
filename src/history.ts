import type { Entry } from './domain';
export type HistoryGroup = { date: string; entries: Entry[] };
/** Preserve the order supplied by the data source, grouping events by local calendar day. */
export function groupHistory(entries: Entry[]): HistoryGroup[] {
 const groups = new Map<string, HistoryGroup>();
 for (const entry of entries) {
  const date = new Date(entry.date);
  const key = Number.isNaN(date.getTime()) ? 'Data desconhecida' : date.toLocaleDateString('pt-PT', { day:'numeric', month:'long', year:'numeric' });
  const group = groups.get(key);
  if(group) group.entries.push(entry); else groups.set(key,{date:key,entries:[entry]});
 }
 return [...groups.values()];
}
