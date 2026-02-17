import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

export interface PageEvent {
  pageIndex: number;
  pageSize: number;
}

export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
})
export class DataTableComponent {
  @Input({ required: true }) columns: TableColumn[] = [];
  @Input({ required: true }) data: Record<string, unknown>[] = [];
  @Input() total = 0;
  @Input() pageSize = 10;
  @Input() isLoading = false;

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<SortEvent>();

  currentPage = signal(0);
  sortColumn = signal('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  totalPages = computed(() => Math.ceil(this.total / this.pageSize));

  pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i)
  );

  onSort(column: string) {
    if (!this.columns.find((c) => c.key === column)?.sortable) return;

    if (this.sortColumn() === column) {
      this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }

    this.sortChange.emit({ column, direction: this.sortDirection() });
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.pageChange.emit({ pageIndex: page, pageSize: this.pageSize });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) return '↕';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }
}
