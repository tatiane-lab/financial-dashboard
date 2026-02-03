import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  SimpleChanges,
} from '@angular/core';

export interface ChartConfig {
  xAxis?: Record<string, unknown>;
  yAxis?: Record<string, unknown>;
  series?: Record<string, unknown>[];
  legend?: Record<string, unknown>;
  tooltip?: Record<string, unknown>;
  grid?: Record<string, unknown>;
}

declare const echarts: {
  init: (el: HTMLElement) => EChartsInstance;
};

interface EChartsInstance {
  setOption: (config: unknown) => void;
  resize: () => void;
  dispose: () => void;
}

@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<div #chartContainer style="width: 100%; height: 400px;"></div>`,
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartContainer') containerRef!: ElementRef<HTMLElement>;
  @Input({ required: true }) config!: ChartConfig;
  @Input() height = '400px';

  private chartInstance: EChartsInstance | null = null;
  private resizeObserver!: ResizeObserver;

  ngAfterViewInit() {
    this.initChart();
    this.resizeObserver = new ResizeObserver(() => this.chartInstance?.resize());
    this.resizeObserver.observe(this.containerRef.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config'] && this.chartInstance) {
      this.chartInstance.setOption({
        tooltip: { trigger: 'axis' },
        legend: {},
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        ...this.config,
      });
    }
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.chartInstance?.dispose();
  }

  private initChart() {
    if (typeof echarts === 'undefined') return;
    this.chartInstance = echarts.init(this.containerRef.nativeElement);
    this.ngOnChanges({ config: { currentValue: this.config } } as never);
  }
}
