import { buildBuckets, categoryBreakdown, delta, filterByRange, periodRange, previousRange, summarize } from './analytics';
import { generateTransactions } from './mock-data';
import { Transaction } from './transaction.model';
import { toCsv } from '../utils/csv';
import { formatBRL } from '../utils/format';

const tx = (date: string, type: 'credit' | 'debit', amount: number, category = 'Vendas'): Transaction => ({
  id: date + amount, date, description: 'x', category, amount, type,
});

describe('analytics', () => {
  const now = new Date(2026, 10, 24);

  it('summarize calcula receita, despesa, saldo e margem', () => {
    const s = summarize([tx('2026-11-01', 'credit', 1000), tx('2026-11-02', 'debit', 400)]);
    expect(s).toEqual({ revenue: 1000, expenses: 400, net: 600, margin: 0.6, count: 2 });
  });

  it('summarize não divide por zero', () => {
    expect(summarize([tx('2026-11-02', 'debit', 50)]).margin).toBe(0);
  });

  it('delta retorna null sem base e variação relativa com base', () => {
    expect(delta(10, 0)).toBeNull();
    expect(delta(150, 100)).toBeCloseTo(0.5);
  });

  it('período de 30 dias tem 30 dias e o anterior é adjacente', () => {
    const r = periodRange('30d', now);
    expect(r.start).toEqual(new Date(2026, 9, 26));
    const p = previousRange(r);
    expect(p.end).toEqual(new Date(2026, 9, 25));
    expect(p.start).toEqual(new Date(2026, 8, 26));
  });

  it('buckets mensais somam o mesmo total que o resumo', () => {
    const txs = generateTransactions(now);
    const range = periodRange('6m', now);
    const inside = filterByRange(txs, range);
    const buckets = buildBuckets(range, '6m', inside);
    expect(buckets).toHaveLength(6);
    expect(buckets.reduce((a, b) => a + b.revenue, 0)).toBeCloseTo(summarize(inside).revenue, 2);
  });

  it('categoryBreakdown ordena por total e soma 100%', () => {
    const list = categoryBreakdown([tx('2026-11-01', 'debit', 100, 'A'), tx('2026-11-01', 'debit', 300, 'B')], 'debit');
    expect(list[0].category).toBe('B');
    expect(list.reduce((a, c) => a + c.share, 0)).toBeCloseTo(1);
  });

  it('mock data é determinístico e não passa de hoje', () => {
    const a = generateTransactions(now);
    expect(a).toEqual(generateTransactions(now));
    expect(a.every((t) => t.date <= '2026-11-24')).toBe(true);
  });
});

describe('utils', () => {
  it('toCsv usa ; , vírgula decimal e escapa aspas', () => {
    const csv = toCsv(['A', 'B'], [['x;y', -10.5], ['diz "oi"', 2]]);
    expect(csv).toContain('"x;y";-10,5');
    expect(csv).toContain('"diz ""oi""";2');
  });

  it('formatBRL usa padrão pt-BR', () => {
    expect(formatBRL(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50');
  });
});
