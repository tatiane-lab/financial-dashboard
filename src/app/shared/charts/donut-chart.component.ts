import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { formatBRL, formatPercent } from '../../core/utils/format';

export interface DonutItem {
  label: string;
  value: number;
}

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

@Component({
  selector: 'app-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'donut-host' },
  template: `
    <svg viewBox="0 0 200 200" class="donut" role="img" [attr.aria-label]="ariaLabel()">
      <circle cx="100" cy="100" [attr.r]="r" fill="none" class="donut-track" stroke-width="26" />
      @for (s of segments(); track s.label) {
        <circle cx="100" cy="100" [attr.r]="r" fill="none" stroke-width="26" transform="rotate(-90 100 100)"
          [style.stroke]="s.color" [attr.stroke-dasharray]="s.dash" [attr.stroke-dashoffset]="s.offset"
          [class.dim]="hover() !== null && hover() !== s.label"
          (mouseenter)="hover.set(s.label)" (mouseleave)="hover.set(null)" />
      }
      <text x="100" y="94" text-anchor="middle" class="donut-caption">{{ hoverItem()?.label ?? centerLabel() }}</text>
      <text x="100" y="116" text-anchor="middle" class="donut-value">{{ hoverItem() ? brl(hoverItem()!.value) : brl(total()) }}</text>
    </svg>
    <ul class="legend">
      @for (s of segments(); track s.label) {
        <li (mouseenter)="hover.set(s.label)" (mouseleave)="hover.set(null)" [class.dim]="hover() !== null && hover() !== s.label">
          <i [style.background]="s.color"></i>
          <span class="legend-name">{{ s.label }}</span>
          <span class="legend-pct">{{ pct(s.share) }}</span>
        </li>
      }
    </ul>
  `,
})
export class DonutChartComponent {
  readonly items = input.required<DonutItem[]>();
  readonly centerLabel = input('Total');
  readonly ariaLabel = input('Gráfico de rosca');
  /** Quantas fatias mostrar antes de agrupar o resto em "Outras". */
  readonly maxSlices = input(6);

  protected readonly r = RADIUS;
  protected readonly hover = signal<string | null>(null);
  protected readonly brl = formatBRL;
  protected readonly pct = formatPercent;

  protected readonly total = computed(() => this.items().reduce((a, i) => a + i.value, 0));

  private readonly grouped = computed(() => {
    const sorted = [...this.items()].sort((a, b) => b.value - a.value);
    const max = this.maxSlices();
    if (sorted.length <= max) return sorted;
    const rest = sorted.slice(max - 1).reduce((a, i) => a + i.value, 0);
    return [...sorted.slice(0, max - 1), { label: 'Outras', value: rest }];
  });

  protected readonly segments = computed(() => {
    const total = this.total() || 1;
    let acc = 0;
    return this.grouped().map((item, i) => {
      const share = item.value / total;
      const length = share * CIRCUMFERENCE;
      const seg = {
        ...item,
        share,
        color: `var(--chart-${(i % 8) + 1})`,
        dash: `${Math.max(0, length - 1.5)} ${CIRCUMFERENCE}`,
        offset: -acc,
      };
      acc += length;
      return seg;
    });
  });

  protected readonly hoverItem = computed(() => this.segments().find((s) => s.label === this.hover()) ?? null);
}
