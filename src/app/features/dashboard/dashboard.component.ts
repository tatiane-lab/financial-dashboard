import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, PercentPipe } from '@angular/common';
import { DashboardService, FinancialSummary } from './dashboard.service';
import { ChartComponent, ChartConfig } from '../../shared/components/chart/chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, PercentPipe, ChartComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private destroyRef = inject(DestroyRef);

  summary = signal<FinancialSummary | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  profitMargin = computed(() => {
    const s = this.summary();
    if (!s || s.totalRevenue === 0) return 0;
    return s.netProfit / s.totalRevenue;
  });

  monthlyChartConfig = computed<ChartConfig>(() => ({
    xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'Revenue',
        type: 'bar',
        data: this.summary()?.monthlyRevenue ?? [],
      },
      {
        name: 'Expenses',
        type: 'bar',
        data: this.summary()?.monthlyExpenses ?? [],
      },
    ],
  }));

  ngOnInit() {
    this.dashboardService
      .getSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.summary.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(err.message);
          this.isLoading.set(false);
        },
      });
  }
}
