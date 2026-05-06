const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlCompactFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const percentFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export const formatBRL = (value: number): string => brlFormatter.format(value);
export const formatBRLCompact = (value: number): string => brlCompactFormatter.format(value);
export const formatPercent = (ratio: number): string => percentFormatter.format(ratio);
export const formatDateBR = (date: Date): string => dateFormatter.format(date);
export const formatSignedPercent = (ratio: number): string =>
  `${ratio > 0 ? '+' : ''}${percentFormatter.format(ratio)}`;
