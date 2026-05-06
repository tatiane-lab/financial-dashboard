export type TransactionType = 'credit' | 'debit';

export interface Transaction {
  id: string;
  /** yyyy-MM-dd */
  date: string;
  description: string;
  category: string;
  /** Sempre positivo; o sinal vem de `type`. */
  amount: number;
  type: TransactionType;
}

export const CREDIT_CATEGORIES = ['Vendas', 'Assinaturas', 'Serviços', 'Investimentos'] as const;
export const DEBIT_CATEGORIES = [
  'Folha de pagamento',
  'Aluguel',
  'Impostos',
  'Infraestrutura',
  'Marketing',
  'Software',
  'Fornecedores',
] as const;
export const ALL_CATEGORIES: string[] = [...CREDIT_CATEGORIES, ...DEBIT_CATEGORIES];
