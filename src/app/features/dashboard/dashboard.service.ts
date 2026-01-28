import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  growthRate: number;
  monthlyRevenue: number[];
  monthlyExpenses: number[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = '/api/dashboard';

  getSummary(period = '6m'): Observable<FinancialSummary> {
    const params = new HttpParams().set('period', period);
    return this.http.get<FinancialSummary>(`${this.apiUrl}/summary`, { params });
  }
}
