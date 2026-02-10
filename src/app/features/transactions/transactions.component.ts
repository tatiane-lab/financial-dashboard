import {
  Component,
  OnInit,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import {
  switchMap,
  debounceTime,
  distinctUntilChanged,
  startWith,
  tap,
} from 'rxjs/operators';
import {
  TransactionsService,
  Transaction,
  TransactionFilters,
  PagedResult,
} from './transactions.service';
import { DataTableComponent, TableColumn, PageEvent, SortEvent } from '../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [ReactiveFormsModule, DataTableComponent],
  templateUrl: './transactions.component.html',
})
export class TransactionsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private transactionsService = inject(TransactionsService);
  private destroyRef = inject(DestroyRef);
  private pageParams$ = new Subject<{ pageIndex: number; pageSize: number; sortColumn: string; sortDirection: string }>();

  filterForm = this.fb.nonNullable.group({
    search: [''],
    category: ['all'],
    dateRange: ['30d'],
  });

  pagedResult = signal<PagedResult<Transaction>>({ items: [], total: 0 });
  isLoading = signal(false);

  columns: TableColumn[] = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'description', label: 'Description', sortable: false },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true },
  ];

  ngOnInit() {
    this.filterForm.valueChanges
      .pipe(
        startWith(this.filterForm.value),
        debounceTime(400),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        tap(() => this.isLoading.set(true)),
        switchMap((filters) =>
          this.transactionsService.getTransactions({
            ...filters,
            pageIndex: 0,
            pageSize: 10,
          } as TransactionFilters)
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (result) => {
          this.pagedResult.set(result);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  onPageChange(event: PageEvent) {
    this.isLoading.set(true);
    this.transactionsService
      .getTransactions({
        ...this.filterForm.value,
        pageIndex: event.pageIndex,
        pageSize: event.pageSize,
      } as TransactionFilters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.pagedResult.set(result);
        this.isLoading.set(false);
      });
  }

  onSortChange(event: SortEvent) {
    this.isLoading.set(true);
    this.transactionsService
      .getTransactions({
        ...this.filterForm.value,
        pageIndex: 0,
        pageSize: 10,
        sortColumn: event.column,
        sortDirection: event.direction,
      } as TransactionFilters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.pagedResult.set(result);
        this.isLoading.set(false);
      });
  }
}
