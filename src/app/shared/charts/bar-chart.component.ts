import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { formatBRL, formatBRLCompact } from '../../core/utils/format';
import { CHART_MARGIN, ChartSeries, hostWidth, labelStep, niceTicks } from './chart-utils';

@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'chart-host' },
  template: `
    <svg [attr.viewBox]="'0 0 ' + width() + ' ' + height()" [attr.width]="width()" [attr.height]="height()" role="img" [attr.aria-label]="ariaLabel()">
      @for (t of yTicks(); track t.value) {
        <line class="grid" [attr.x1]="m.left" [attr.x2]="width() - m.right" [attr.y1]="t.y" [attr.y2]="t.y" />
        <text class="axis" [attr.x]="m.left - 8" [attr.y]="t.y + 4" text-anchor="end">{{ compact(t.value) }}</text>
      }
      @for (g of groups(); track g.index) {
        @if (hover() === g.index) {
          <rect class="band" [attr.x]="g.x" [attr.y]="m.top" [attr.width]="g.w" [attr.height]="height() - m.top - m.bottom" />
        }
        @for (b of g.bars; track b.name) {
          <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="b.h" rx="2" [style.fill]="b.color" />
        }
      }
      @for (l of xLabels(); track l.index) {
        <text class="axis" [attr.x]="l.x" [attr.y]="height() - 8" text-anchor="middle">{{ l.text }}</text>
      }
      @for (g of groups(); track g.index) {
        <rect class="hit" [attr.x]="g.x" [attr.y]="m.top" [attr.width]="g.w" [attr.height]="height() - m.top - m.bottom"
          (mouseenter)="hover.set(g.index)" (mouseleave)="hover.set(null)" (touchstart)="hover.set(g.index)" />
      }
    </svg>
    @if (hover() !== null) {
      <div class="tooltip" [style.left.px]="tooltipLeft()" role="status">
        <strong>{{ tooltipLabels()[hover()!] ?? labels()[hover()!] }}</strong>
        @for (s of series(); track s.name) {
          <div><i [style.background]="s.color"></i>{{ s.name }}: <b>{{ brl(s.values[hover()!]) }}</b></div>
        }
      </div>
    }
  `,
})
export class BarChartComponent {
  readonly labels = input.required<string[]>();
  readonly tooltipLabels = input<string[]>([]);
  readonly series = input.required<ChartSeries[]>();
  readonly height = input(280);
  readonly ariaLabel = input('Gráfico de barras');

  protected readonly m = CHART_MARGIN;
  protected readonly width = hostWidth();
  protected readonly hover = signal<number | null>(null);
  protected readonly compact = formatBRLCompact;
  protected readonly brl = formatBRL;

  private readonly plotW = computed(() => Math.max(10, this.width() - this.m.left - this.m.right));
  private readonly plotH = computed(() => this.height() - this.m.top - this.m.bottom);
  private readonly tickValues = computed(() => niceTicks(Math.max(0, ...this.series().flatMap((s) => s.values))));
  private readonly top = computed(() => this.tickValues().at(-1) ?? 1);

  private yAt(v: number): number {
    return this.m.top + this.plotH() - (v / this.top()) * this.plotH();
  }

  protected readonly yTicks = computed(() => this.tickValues().map((value) => ({ value, y: this.yAt(value) })));

  protected readonly groups = computed(() => {
    const labels = this.labels();
    const series = this.series();
    const slot = this.plotW() / Math.max(1, labels.length);
    const inner = Math.max(2, slot * 0.7);
    const barW = Math.max(1.5, inner / Math.max(1, series.length) - 1);
    return labels.map((_, index) => {
      const x0 = this.m.left + index * slot;
      const start = x0 + (slot - (barW + 1) * series.length + 1) / 2;
      return {
        index,
        x: x0,
        w: slot,
        bars: series.map((s, si) => {
          const y = this.yAt(s.values[index] ?? 0);
          return { name: s.name, color: s.color, x: start + si * (barW + 1), w: barW, y, h: Math.max(0, this.m.top + this.plotH() - y) };
        }),
      };
    });
  });

  protected readonly xLabels = computed(() => {
    const step = labelStep(this.labels().length, this.plotW());
    const slot = this.plotW() / Math.max(1, this.labels().length);
    return this.labels()
      .map((text, index) => ({ text, index, x: this.m.left + index * slot + slot / 2 }))
      .filter((l) => l.index % step === 0);
  });

  protected readonly tooltipLeft = computed(() => {
    const i = this.hover();
    if (i === null) return 0;
    const slot = this.plotW() / Math.max(1, this.labels().length);
    return Math.min(Math.max(this.m.left + i * slot + slot + 6, 8), this.width() - 190);
  });
}
