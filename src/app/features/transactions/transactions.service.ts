import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'credit' | 'debit';
}

export interface TransactionFilters {
  search: string;
  category: string;
  dateRange: string;
  pageIndex: number;
  pageSize: number;
  sortColumn?: string;
  sortDirection?: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private http = inject(HttpClient);
  private apiUrl = '/api/transactions';

  getTransactions(filters: TransactionFilters): Observable<PagedResult<Transaction>> {
    let params = new HttpParams()
      .set('page', filters.pageIndex.toString())
      .set('size', filters.pageSize.toString())
      .set('dateRange', filters.dateRange);

    if (filters.search) params = params.set('search', filters.search);
    if (filters.category !== 'all') params = params.set('category', filters.category);
    if (filters.sortColumn) params = params.set('sort', filters.sortColumn);
    if (filters.sortDirection) params = params.set('dir', filters.sortDirection);

    return this.http.get<PagedResult<Transaction>>(this.apiUrl, { params });
  }
}
