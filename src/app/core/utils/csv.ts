/**
 * Gera CSV compatível com Excel pt-BR: separador `;`, decimal com vírgula,
 * BOM UTF-8 para acentuação correta.
 */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (cell: string | number): string => {
    const text = typeof cell === 'number' ? String(cell).replace('.', ',') : cell;
    return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [headers, ...rows].map((row) => row.map(escape).join(';'));
  return '﻿' + lines.join('\r\n');
}

export function downloadFile(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
