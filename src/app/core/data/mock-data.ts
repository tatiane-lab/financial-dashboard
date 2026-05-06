import { Transaction } from './transaction.model';
import { addDays, addMonths, toISODate } from '../utils/date-utils';

/** PRNG determinístico: os mesmos números em toda execução. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CLIENTS = [
  'Mercado Alvorada', 'Clínica Vida Plena', 'Construtora Horizonte', 'Escola Novo Saber',
  'Grupo Pinheiro', 'Farmácia Central', 'Transportes Rota 66', 'Studio Aurora',
  'Agro Vale Verde', 'Hotel Mirante', 'Padaria Estrela', 'Tech Nordeste',
];
const CLOUD = ['AWS', 'Google Cloud', 'Azure', 'Cloudflare', 'Datadog'];
const ADS = ['Google Ads', 'Meta Ads', 'LinkedIn Ads', 'Evento Fintech Summit', 'Influenciadores'];
const SOFT = ['Slack', 'Figma', 'GitHub', 'Notion', 'Jira', 'Zoom', '1Password', 'Google Workspace'];
const SUPPLIERS = ['Papelaria Prime', 'Limpeza Total', 'Coworking Hub', 'Contabilidade Souza', 'Jurídico Lima'];

/**
 * Gera ~25 meses de movimentações realistas de uma empresa SaaS/serviços,
 * terminando em `today`. Tendência de crescimento + sazonalidade.
 */
export function generateTransactions(today: Date, months = 25): Transaction[] {
  const rand = mulberry32(20260);
  const between = (min: number, max: number) => min + rand() * (max - min);
  const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)];
  const money = (v: number) => Math.round(v * 100) / 100;
  const dayOfMonth = () => 1 + Math.floor(rand() * 28);
  const out: Omit<Transaction, 'id'>[] = [];
  const todayIso = toISODate(today);
  const seasonality = [0.85, 0.9, 1, 1, 1.05, 1.05, 0.95, 1, 1.05, 1.1, 1.25, 1.35];

  for (let i = months - 1; i >= 0; i--) {
    const first = addMonths(today, -i);
    const age = months - 1 - i;
    const growth = 1 + 0.018 * age;
    const season = seasonality[first.getMonth()];
    const add = (day: number, description: string, category: string, type: 'credit' | 'debit', amount: number) => {
      const date = toISODate(addDays(first, day - 1));
      if (date <= todayIso) out.push({ date, description, category, type, amount: money(amount) });
    };

    let revenue = 0;
    const credit = (day: number, description: string, category: string, amount: number) => {
      revenue += amount;
      add(day, description, category, 'credit', amount);
    };

    credit(5, 'Assinaturas - plano Pro (recorrência)', 'Assinaturas', 44_000 * growth * between(0.97, 1.03));
    credit(6, 'Assinaturas - plano Enterprise', 'Assinaturas', 21_000 * growth * between(0.97, 1.04));
    const sales = 5 + Math.floor(rand() * 4);
    for (let s = 0; s < sales; s++) {
      credit(dayOfMonth(), `Venda - ${pick(CLIENTS)}`, 'Vendas', between(2_800, 15_000) * season * growth);
    }
    const services = 2 + Math.floor(rand() * 2);
    for (let s = 0; s < services; s++) {
      credit(dayOfMonth(), `Consultoria - ${pick(CLIENTS)}`, 'Serviços', between(4_500, 14_000) * growth);
    }
    credit(28, 'Rendimento CDB', 'Investimentos', between(900, 2_600) * growth);

    add(5, 'Folha de pagamento', 'Folha de pagamento', 'debit', 58_000 * (1 + 0.009 * age) * between(0.99, 1.01));
    add(10, 'Aluguel - sala comercial', 'Aluguel', 'debit', 9_800);
    add(20, 'Impostos - Simples Nacional', 'Impostos', 'debit', revenue * between(0.085, 0.095));
    for (let s = 0; s < 3; s++) {
      add(dayOfMonth(), `Infraestrutura - ${pick(CLOUD)}`, 'Infraestrutura', 'debit', between(1_800, 5_800) * growth);
    }
    const ads = 3 + Math.floor(rand() * 2);
    for (let s = 0; s < ads; s++) {
      add(dayOfMonth(), `Marketing - ${pick(ADS)}`, 'Marketing', 'debit', between(1_500, 7_500) * season);
    }
    for (let s = 0; s < 5; s++) {
      add(dayOfMonth(), `Software - ${pick(SOFT)}`, 'Software', 'debit', between(180, 2_200));
    }
    for (let s = 0; s < 3; s++) {
      add(dayOfMonth(), `Fornecedor - ${pick(SUPPLIERS)}`, 'Fornecedores', 'debit', between(900, 6_500));
    }
  }

  const sorted = out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return sorted.map((t, i) => ({ ...t, id: `TX-${String(sorted.length - i).padStart(4, '0')}` }));
}
