import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, computed, contentChild, input, output } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right';
}

export interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

export interface CellContext {
  $implicit: Record<string, unknown>;
  column: TableColumn;
}

/**
 * Tabela genérica "controlada": o pai é dono de página/ordenação/dados e a
 * tabela só renderiza e emite eventos. Células customizáveis via <ng-template>.
 */
@Component({
  selector: 'app-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './data-table.component.html',
})
export class DataTableComponent {
  readonly columns = input.required<TableColumn[]>();
  readonly rows = input.required<Record<string, unknown>[]>();
  readonly total = input(0);
  readonly page = input(0);
  readonly pageSize = input(10);
  readonly pageSizeOptions = input([10, 25, 50]);
  readonly sort = input<SortState | null>(null);
  readonly loading = input(false);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();
  readonly sortChange = output<SortState>();

  protected readonly cell = contentChild<TemplateRef<CellContext>>('cell');

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected readonly firstItem = computed(() => (this.total() === 0 ? 0 : this.page() * this.pageSize() + 1));
  protected readonly lastItem = computed(() => Math.min(this.total(), (this.page() + 1) * this.pageSize()));
  protected readonly skeletonRows = computed(() => Array.from({ length: Math.min(this.pageSize(), 8) }));

  /** Janela de páginas com reticências: 1 … 4 5 [6] 7 8 … 20 */
  protected readonly pageButtons = computed<(number | null)[]>(() => {
    const last = this.totalPages() - 1;
    const current = this.page();
    const pages = new Set([0, last, current - 1, current, current + 1].filter((p) => p >= 0 && p <= last));
    const sorted = [...pages].sort((a, b) => a - b);
    const out: (number | null)[] = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
      out.push(p);
    });
    return out;
  });

  protected sortIcon(column: string): string {
    const s = this.sort();
    if (s?.column !== column) return '↕';
    return s.direction === 'asc' ? '↑' : '↓';
  }

  protected ariaSort(column: string): 'ascending' | 'descending' | 'none' {
    const s = this.sort();
    if (s?.column !== column) return 'none';
    return s.direction === 'asc' ? 'ascending' : 'descending';
  }

  protected toggleSort(col: TableColumn): void {
    if (!col.sortable) return;
    const s = this.sort();
    const direction = s?.column === col.key && s.direction === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ column: col.key, direction });
  }

  protected display(row: Record<string, unknown>, key: string): string {
    return String(row[key] ?? '');
  }

  protected goTo(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.page()) return;
    this.pageChange.emit(page);
  }

  protected onPageSize(event: Event): void {
    this.pageSizeChange.emit(Number((event.target as HTMLSelectElement).value));
  }
}
