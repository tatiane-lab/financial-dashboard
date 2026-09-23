import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  PERIODS,
  Period,
  buildBuckets,
  categoryBreakdown,
  delta,
  filterByRange,
  periodRange,
  previousRange,
  summarize,
} from '../../core/data/analytics';
import { FinanceStore } from '../../core/data/finance.store';
import { formatBRL, formatDateBR, formatPercent, formatSignedPercent } from '../../core/utils/format';
import { parseISODate } from '../../core/utils/date-utils';
import { BarChartComponent } from '../../shared/charts/bar-chart.component';
import { ChartSeries } from '../../shared/charts/chart-utils';
import { DonutChartComponent } from '../../shared/charts/donut-chart.component';
import { LineChartComponent } from '../../shared/charts/line-chart.component';

interface Kpi {
  key: string;
  label: string;
  value: string;
  tone: 'neutral' | 'positive' | 'negative';
  delta: number | null;
  /** Para despesas, subir é ruim. */
  upIsGood: boolean;
  hint: string;
}

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LineChartComponent, BarChartComponent, DonutChartComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  protected readonly store = inject(FinanceStore);

  protected readonly periods = PERIODS;
  protected readonly period = signal<Period>('6m');
  protected readonly brl = formatBRL;
  protected readonly formatSignedPercent = formatSignedPercent;
  protected readonly skeletons = [1, 2, 3, 4];

  constructor() {
    this.store.load();
  }

  private readonly range = computed(() => periodRange(this.period(), this.store.today));
  private readonly current = computed(() => filterByRange(this.store.transactions(), this.range()));
  private readonly previous = computed(() => filterByRange(this.store.transactions(), previousRange(this.range())));

  protected readonly summary = computed(() => summarize(this.current()));
  private readonly previousSummary = computed(() => summarize(this.previous()));
  protected readonly isEmpty = computed(() => this.store.status() === 'success' && this.current().length === 0);

  protected readonly rangeLabel = computed(
    () => `${formatDateBR(this.range().start)} a ${formatDateBR(this.range().end)}`,
  );

  protected readonly kpis = computed<Kpi[]>(() => {
    const s = this.summary();
    const p = this.previousSummary();
    return [
      { key: 'revenue', label: 'Receita', value: formatBRL(s.revenue), tone: 'neutral', delta: delta(s.revenue, p.revenue), upIsGood: true, hint: 'vs. anterior' },
      { key: 'expenses', label: 'Despesas', value: formatBRL(s.expenses), tone: 'neutral', delta: delta(s.expenses, p.expenses), upIsGood: false, hint: 'vs. anterior' },
      { key: 'net', label: 'Resultado líquido', value: formatBRL(s.net), tone: s.net >= 0 ? 'positive' : 'negative', delta: delta(s.net, p.net), upIsGood: true, hint: 'vs. anterior' },
      { key: 'margin', label: 'Margem de lucro', value: formatPercent(s.margin), tone: s.margin >= 0 ? 'positive' : 'negative', delta: p.revenue === 0 ? null : s.margin - p.margin, upIsGood: true, hint: 'vs. anterior' },
    ];
  });

  private readonly buckets = computed(() => buildBuckets(this.range(), this.period(), this.current()));
  protected readonly labels = computed(() => this.buckets().map((b) => b.label));
  protected readonly fullLabels = computed(() => this.buckets().map((b) => b.fullLabel));

  protected readonly balanceSeries = computed<ChartSeries[]>(() => {
    let acc = 0;
    return [{ name: 'Saldo acumulado', color: 'var(--chart-1)', area: true, values: this.buckets().map((b) => (acc += b.net)) }];
  });

  protected readonly flowSeries = computed<ChartSeries[]>(() => [
    { name: 'Receitas', color: 'var(--chart-2)', values: this.buckets().map((b) => b.revenue) },
    { name: 'Despesas', color: 'var(--chart-4)', values: this.buckets().map((b) => b.expenses) },
  ]);

  protected readonly expenseShares = computed(() =>
    categoryBreakdown(this.current(), 'debit').map((c) => ({ label: c.category, value: c.total })),
  );

  protected readonly recent = computed(() => this.current().slice(0, 6));

  protected setPeriod(p: Period): void {
    this.period.set(p);
  }

  protected deltaClass(k: Kpi): string {
    if (k.delta === null || Math.abs(k.delta) < 0.0005) return 'flat';
    return k.delta > 0 === k.upIsGood ? 'good' : 'bad';
  }

  protected deltaText(k: Kpi): string {
    if (k.delta === null) return 'sem base de comparação';
    return k.key === 'margin' ? `${k.delta > 0 ? '+' : ''}${(k.delta * 100).toFixed(1).replace('.', ',')} p.p.` : formatSignedPercent(k.delta);
  }

  protected shortDate(iso: string): string {
    return formatDateBR(parseISODate(iso));
  }
}
