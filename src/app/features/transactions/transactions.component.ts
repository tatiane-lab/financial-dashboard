import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, startWith } from 'rxjs';
import { Period, PERIODS, filterByRange, periodRange, summarize } from '../../core/data/analytics';
import { FinanceStore } from '../../core/data/finance.store';
import { ALL_CATEGORIES, Transaction } from '../../core/data/transaction.model';
import { downloadFile, toCsv } from '../../core/utils/csv';
import { addDays, parseISODate, toISODate } from '../../core/utils/date-utils';
import { formatBRL, formatDateBR } from '../../core/utils/format';
import { DataTableComponent, SortState, TableColumn } from '../../shared/components/data-table/data-table.component';

type PeriodFilter = Period | 'all';

@Component({
  selector: 'app-transactions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DataTableComponent],
  templateUrl: './transactions.component.html',
})
export class TransactionsComponent {
  protected readonly store = inject(FinanceStore);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly categories = ALL_CATEGORIES;
  protected readonly periods: { value: PeriodFilter; label: string }[] = [
    ...PERIODS,
    { value: 'all', label: 'Todo o histórico' },
  ];
  protected readonly brl = formatBRL;

  protected readonly columns: TableColumn[] = [
    { key: 'date', label: 'Data', sortable: true },
    { key: 'description', label: 'Descrição', sortable: true },
    { key: 'category', label: 'Categoria', sortable: true },
    { key: 'amount', label: 'Valor', sortable: true, align: 'right' },
  ];

  protected readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    category: ['all'],
    type: ['all' as 'all' | 'credit' | 'debit'],
    period: ['90d' as PeriodFilter],
  });

  private readonly filters = toSignal(
    this.filterForm.valueChanges.pipe(startWith(this.filterForm.getRawValue()), debounceTime(200)),
    { initialValue: this.filterForm.getRawValue() },
  );

  protected readonly sort = signal<SortState>({ column: 'date', direction: 'desc' });
  protected readonly page = signal(0);
  protected readonly pageSize = signal(10);

  constructor() {
    this.store.load();
    // Qualquer mudança de filtro volta para a primeira página.
    this.filterForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.page.set(0));
  }

  protected readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!f?.search?.trim() || f?.category !== 'all' || f?.type !== 'all' || f?.period !== '90d';
  });

  /** Filtra e ordena tudo no cliente (a "API" devolve o histórico completo). */
  protected readonly filtered = computed<Transaction[]>(() => {
    const f = this.filters();
    let list = this.store.transactions();
    if (f?.period && f.period !== 'all') list = filterByRange(list, periodRange(f.period, this.store.today));
    if (f?.type && f.type !== 'all') list = list.filter((t) => t.type === f.type);
    if (f?.category && f.category !== 'all') list = list.filter((t) => t.category === f.category);
    const term = f?.search?.trim().toLowerCase();
    if (term) list = list.filter((t) => `${t.description} ${t.category}`.toLowerCase().includes(term));

    const { column, direction } = this.sort();
    const factor = direction === 'asc' ? 1 : -1;
    const signed = (t: Transaction) => (t.type === 'credit' ? t.amount : -t.amount);
    return [...list].sort((a, b) => {
      switch (column) {
        case 'amount':
          return (signed(a) - signed(b)) * factor;
        case 'description':
          return a.description.localeCompare(b.description, 'pt-BR') * factor;
        case 'category':
          return a.category.localeCompare(b.category, 'pt-BR') * factor || (a.date < b.date ? 1 : -1);
        default:
          return (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id.localeCompare(b.id)) * factor;
      }
    });
  });

  protected readonly summary = computed(() => summarize(this.filtered()));

  protected readonly pageRows = computed(() => {
    const size = this.pageSize();
    const lastPage = Math.max(0, Math.ceil(this.filtered().length / size) - 1);
    const page = Math.min(this.page(), lastPage);
    return this.filtered().slice(page * size, page * size + size) as unknown as Record<string, unknown>[];
  });

  protected readonly currentPage = computed(() =>
    Math.min(this.page(), Math.max(0, Math.ceil(this.filtered().length / this.pageSize()) - 1)),
  );

  protected asTx(row: Record<string, unknown>): Transaction {
    return row as unknown as Transaction;
  }

  protected formatDate(iso: string): string {
    return formatDateBR(parseISODate(iso));
  }

  protected onSort(sort: SortState): void {
    this.sort.set(sort);
    this.page.set(0);
  }

  protected onPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(0);
  }

  protected resetFilters(): void {
    this.filterForm.reset();
  }

  protected exportCsv(): void {
    const rows = this.filtered().map((t) => [
      this.formatDate(t.date),
      t.description,
      t.category,
      t.type === 'credit' ? 'Receita' : 'Despesa',
      t.type === 'credit' ? t.amount : -t.amount,
    ]);
    const csv = toCsv(['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor (R$)'], rows);
    downloadFile(`transacoes-${toISODate(addDays(this.store.today, 0))}.csv`, csv);
  }
}
