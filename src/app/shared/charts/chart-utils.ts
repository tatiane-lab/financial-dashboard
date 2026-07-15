import { DestroyRef, ElementRef, Signal, afterNextRender, inject, signal } from '@angular/core';

export interface ChartSeries {
  name: string;
  /** Qualquer cor CSS, inclusive `var(--chart-1)`. */
  color: string;
  values: number[];
  /** Linha: preenche a área sob a curva. */
  area?: boolean;
}

export const CHART_MARGIN = { top: 14, right: 14, bottom: 30, left: 62 } as const;

/** Largura reativa do elemento host (ResizeObserver) como signal. */
export function hostWidth(fallback = 640): Signal<number> {
  const width = signal(fallback);
  const host = inject<ElementRef<HTMLElement>>(ElementRef);
  const destroyRef = inject(DestroyRef);
  afterNextRender(() => {
    const read = () => {
      const w = host.nativeElement.clientWidth;
      if (w > 0) width.set(Math.round(w));
    };
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(read);
    observer.observe(host.nativeElement);
    destroyRef.onDestroy(() => observer.disconnect());
  });
  return width;
}

/** Escala "bonita": retorna ticks de 0 até um máximo arredondado. */
export function niceTicks(maxValue: number, count = 4): number[] {
  if (maxValue <= 0) return [0, 1];
  const rough = maxValue / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  const step = (residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 2.5 ? 2.5 : residual <= 5 ? 5 : 10) * magnitude;
  const ticks: number[] = [];
  for (let v = 0; v < maxValue + step * 0.999; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/** Evita rótulos sobrepostos no eixo X. */
export function labelStep(count: number, plotWidth: number, minGap = 54): number {
  const fit = Math.max(1, Math.floor(plotWidth / minGap));
  return Math.max(1, Math.ceil(count / fit));
}
