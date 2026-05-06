import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Transaction } from './transaction.model';

export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

/** Fonte única de verdade das transações (dashboard e tabela derivam daqui). */
@Injectable({ providedIn: 'root' })
export class FinanceStore {
  private readonly http = inject(HttpClient);

  private readonly _transactions = signal<Transaction[]>([]);
  private readonly _status = signal<LoadStatus>('idle');
  private readonly _error = signal<string | null>(null);

  readonly transactions = this._transactions.asReadonly();
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isLoading = computed(() => this._status() === 'loading');
  /** Referência de "hoje" estável durante a sessão. */
  readonly today = new Date();

  /** Carrega apenas se ainda não carregou (ou se `force`). */
  load(force = false): void {
    if (this._status() === 'loading' || (!force && this._status() === 'success')) return;
    this._status.set('loading');
    this._error.set(null);
    this.http.get<Transaction[]>('/api/transactions').subscribe({
      next: (data) => {
        this._transactions.set(data);
        this._status.set('success');
      },
      error: (err) => {
        this._error.set(err?.error?.message ?? 'Não foi possível carregar as transações.');
        this._status.set('error');
      },
    });
  }
}
