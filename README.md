# Financial Dashboard

> Angular 22 · JWT Authentication · ECharts · Typed Reactive Forms · Signals · RxJS · Lazy Loading

A financial analytics dashboard demonstrating modern Angular patterns. Features JWT-based authentication, signal-driven state management, server-side paginated tables with sortable columns, and interactive ECharts visualizations.

## Features

- **Authentication** – JWT tokens stored in `localStorage`, auto-loaded on boot, invalidated on expiry. Functional guards protect all routes; a functional HTTP interceptor attaches `Bearer` tokens and handles 401 responses globally.
- **Signals & Computed** – Dashboard state lives in `signal<T>()` primitives; derived values (profit margin, chart configs) use `computed()` and update automatically.
- **Typed Reactive Forms** – The filter form is typed with `fb.nonNullable.group<T>()`, making the value always `T` without null-checking.
- **RxJS Pipeline** – The filter-to-fetch pipeline chains `debounceTime(400)` → `distinctUntilChanged` → `switchMap` to cancel in-flight requests and avoid redundant calls.
- **Server-side Table** – `DataTableComponent` emits `PageEvent` and `SortEvent`; the parent fetches the new page from the API and updates the signal.
- **Lazy Loading** – Every route uses `loadComponent()` so each feature chunk is split and loaded on demand.
- **Memory Safety** – All subscriptions use `takeUntilDestroyed(destroyRef)`, the idiomatic Angular 17+ way to prevent leaks without `OnDestroy`.

## Tech Stack

| Package | Version |
|---|---|
| `@angular/core` | ^22.3.0 |
| `rxjs` | ~7.8.0 |
| `echarts` | ^5.6.0 |

## Running locally

```bash
npm install
ng serve
```

## Architecture

```
src/app/
├── core/
│   ├── auth/           # AuthService (signals), AuthGuard (functional)
│   └── interceptors/   # JWT interceptor (functional HttpInterceptorFn)
├── features/
│   ├── dashboard/      # Summary cards + ECharts bar chart
│   ├── transactions/   # Filtered + paginated transaction table
│   └── login/          # Typed reactive form
└── shared/
    └── components/
        ├── chart/      # ECharts wrapper with ResizeObserver
        └── data-table/ # Generic paginated sortable table
```
