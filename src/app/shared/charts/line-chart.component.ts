import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { formatBRL, formatBRLCompact } from '../../core/utils/format';
import { CHART_MARGIN, ChartSeries, hostWidth, labelStep, niceTicks } from './chart-utils';

@Component({
  selector: 'app-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'chart-host' },
  template: `
    <svg [attr.viewBox]="'0 0 ' + width() + ' ' + height()" [attr.width]="width()" [attr.height]="height()" role="img" [attr.aria-label]="ariaLabel()">
      @for (t of yTicks(); track t.value) {
        <line class="grid" [attr.x1]="m.left" [attr.x2]="width() - m.right" [attr.y1]="t.y" [attr.y2]="t.y" />
        <text class="axis" [attr.x]="m.left - 8" [attr.y]="t.y + 4" text-anchor="end">{{ compact(t.value) }}</text>
      }
      @for (l of xLabels(); track l.index) {
        <text class="axis" [attr.x]="l.x" [attr.y]="height() - 8" text-anchor="middle">{{ l.text }}</text>
      }
      @for (s of paths(); track s.name) {
        @if (s.area) {
          <path [attr.d]="s.areaPath" [style.fill]="s.color" fill-opacity="0.12" />
        }
        <path [attr.d]="s.line" fill="none" [style.stroke]="s.color" stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round" />
      }
      @if (hover() !== null) {
        <line class="guide" [attr.x1]="xAt(hover()!)" [attr.x2]="xAt(hover()!)" [attr.y1]="m.top" [attr.y2]="height() - m.bottom" />
        @for (s of series(); track s.name) {
          <circle [attr.cx]="xAt(hover()!)" [attr.cy]="yAt(s.values[hover()!])" r="4.5" [style.fill]="s.color" class="dot" />
        }
      }
      @for (b of bands(); track b.index) {
        <rect class="hit" [attr.x]="b.x" [attr.y]="m.top" [attr.width]="b.w" [attr.height]="height() - m.top - m.bottom"
          (mouseenter)="hover.set(b.index)" (mouseleave)="hover.set(null)" (touchstart)="hover.set(b.index)" />
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
export class LineChartComponent {
  readonly labels = input.required<string[]>();
  readonly tooltipLabels = input<string[]>([]);
  readonly series = input.required<ChartSeries[]>();
  readonly height = input(280);
  readonly ariaLabel = input('Gráfico de linhas');

  protected readonly m = CHART_MARGIN;
  protected readonly width = hostWidth();
  protected readonly hover = signal<number | null>(null);
  protected readonly compact = formatBRLCompact;
  protected readonly brl = formatBRL;

  private readonly plotW = computed(() => Math.max(10, this.width() - this.m.left - this.m.right));
  private readonly plotH = computed(() => this.height() - this.m.top - this.m.bottom);

  private readonly ticks = computed(() => {
    const max = Math.max(0, ...this.series().flatMap((s) => s.values));
    const min = Math.min(0, ...this.series().flatMap((s) => s.values));
    return { values: niceTicks(max), min };
  });
  private readonly top = computed(() => this.ticks().values.at(-1) ?? 1);
  private readonly bottom = computed(() => this.ticks().min);

  protected xAt(i: number): number {
    const n = this.labels().length;
    return n <= 1 ? this.m.left + this.plotW() / 2 : this.m.left + (i * this.plotW()) / (n - 1);
  }
  protected yAt(v: number): number {
    const span = this.top() - this.bottom() || 1;
    return this.m.top + this.plotH() - ((v - this.bottom()) / span) * this.plotH();
  }

  protected readonly yTicks = computed(() => this.ticks().values.map((value) => ({ value, y: this.yAt(value) })));

  protected readonly xLabels = computed(() => {
    const step = labelStep(this.labels().length, this.plotW());
    return this.labels()
      .map((text, index) => ({ text, index, x: this.xAt(index) }))
      .filter((l) => l.index % step === 0);
  });

  protected readonly paths = computed(() =>
    this.series().map((s) => {
      const pts = s.values.map((v, i) => `${this.xAt(i).toFixed(1)},${this.yAt(v).toFixed(1)}`);
      const line = pts.length ? `M${pts.join(' L')}` : '';
      const baseY = this.yAt(Math.max(0, this.bottom())).toFixed(1);
      const last = s.values.length - 1;
      const areaPath = pts.length
        ? `${line} L${this.xAt(last).toFixed(1)},${baseY} L${this.xAt(0).toFixed(1)},${baseY} Z`
        : '';
      return { name: s.name, color: s.color, area: s.area, line, areaPath };
    }),
  );

  protected readonly bands = computed(() => {
    const n = this.labels().length;
    const w = n <= 1 ? this.plotW() : this.plotW() / (n - 1);
    return this.labels().map((_, index) => ({ index, x: this.xAt(index) - w / 2, w }));
  });

  protected readonly tooltipLeft = computed(() => {
    const i = this.hover();
    if (i === null) return 0;
    return Math.min(Math.max(this.xAt(i) + 12, 8), this.width() - 190);
  });
}
