import { Transaction, TransactionType } from './transaction.model';
import { addDays, addMonths, dayDiff, startOfDay, toISODate } from '../utils/date-utils';

export type Period = '30d' | '90d' | '6m' | '12m';

export const PERIODS: { value: Period; label: string }[] = [
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: '6m', label: '6 meses' },
  { value: '12m', label: '12 meses' },
];

export interface DateRange {
  start: Date;
  end: Date;
}

export interface Summary {
  revenue: number;
  expenses: number;
  net: number;
  /** net / revenue (0 quando não há receita). */
  margin: number;
  count: number;
}

export interface Bucket {
  label: string;
  fullLabel: string;
  from: string;
  to: string;
  revenue: number;
  expenses: number;
  net: number;
}

export interface CategoryShare {
  category: string;
  total: number;
  share: number;
}

type Granularity = 'day' | 'week' | 'month';

const monthShort = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
const monthLong = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });

export function periodRange(period: Period, now: Date): DateRange {
  const end = startOfDay(now);
  switch (period) {
    case '30d':
      return { start: addDays(end, -29), end };
    case '90d':
      return { start: addDays(end, -89), end };
    case '6m':
      return { start: addMonths(end, -5), end };
    case '12m':
      return { start: addMonths(end, -11), end };
  }
}

/** Janela imediatamente anterior, com o mesmo número de dias. */
export function previousRange(range: DateRange): DateRange {
  const length = dayDiff(range.start, range.end) + 1;
  const end = addDays(range.start, -1);
  return { start: addDays(end, -(length - 1)), end };
}

export function inRange(tx: Transaction, range: DateRange): boolean {
  return tx.date >= toISODate(range.start) && tx.date <= toISODate(range.end);
}

export function filterByRange(txs: Transaction[], range: DateRange): Transaction[] {
  return txs.filter((t) => inRange(t, range));
}

export function summarize(txs: Transaction[]): Summary {
  let revenue = 0;
  let expenses = 0;
  for (const t of txs) {
    if (t.type === 'credit') revenue += t.amount;
    else expenses += t.amount;
  }
  const net = revenue - expenses;
  return { revenue, expenses, net, margin: revenue === 0 ? 0 : net / revenue, count: txs.length };
}

/** Variação relativa; `null` quando não há base de comparação. */
export function delta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

function granularityFor(period: Period): Granularity {
  return period === '30d' ? 'day' : period === '90d' ? 'week' : 'month';
}

export function buildBuckets(range: DateRange, period: Period, txs: Transaction[]): Bucket[] {
  const granularity = granularityFor(period);
  const buckets: Bucket[] = [];
  const endIso = toISODate(range.end);

  let cursor = range.start;
  while (toISODate(cursor) <= endIso) {
    let from = cursor;
    let to: Date;
    let label: string;
    let fullLabel: string;
    if (granularity === 'day') {
      to = cursor;
      label = dayMonth.format(cursor);
      fullLabel = label;
      cursor = addDays(cursor, 1);
    } else if (granularity === 'week') {
      to = addDays(cursor, 6);
      if (toISODate(to) > endIso) to = range.end;
      label = dayMonth.format(from);
      fullLabel = `${dayMonth.format(from)} a ${dayMonth.format(to)}`;
      cursor = addDays(to, 1);
    } else {
      const next = addMonths(cursor, 1);
      to = addDays(next, -1);
      if (toISODate(to) > endIso) to = range.end;
      label = monthShort.format(from).replace('.', '');
      fullLabel = monthLong.format(from);
      from = cursor;
      cursor = next;
    }
    buckets.push({ label, fullLabel, from: toISODate(from), to: toISODate(to), revenue: 0, expenses: 0, net: 0 });
  }

  for (const t of txs) {
    const bucket = buckets.find((b) => t.date >= b.from && t.date <= b.to);
    if (!bucket) continue;
    if (t.type === 'credit') bucket.revenue += t.amount;
    else bucket.expenses += t.amount;
  }
  for (const b of buckets) b.net = b.revenue - b.expenses;
  return buckets;
}

export function categoryBreakdown(txs: Transaction[], type: TransactionType): CategoryShare[] {
  const totals = new Map<string, number>();
  for (const t of txs) {
    if (t.type === type) totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals.entries()]
    .map(([category, total]) => ({ category, total, share: sum === 0 ? 0 : total / sum }))
    .sort((a, b) => b.total - a.total);
}

