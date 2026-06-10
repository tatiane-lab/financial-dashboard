import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { generateTransactions } from '../data/mock-data';
import { Transaction } from '../data/transaction.model';

export const DEMO_CREDENTIALS = { email: 'demo@financeiro.com', password: 'Demo@2026' } as const;

const DEMO_USER = {
  id: 'u-001',
  name: 'Tatiane Bezerra',
  email: DEMO_CREDENTIALS.email,
  role: 'admin' as const,
};

function base64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** JWT apenas de demonstração (não assinado de verdade). */
function fakeJwt(): string {
  const header = base64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({ sub: DEMO_USER.id, user: DEMO_USER, exp: Math.floor(Date.now() / 1000) + 8 * 3600 }),
  );
  return `${header}.${payload}.demo-signature`;
}

let cache: Transaction[] | null = null;

function reply<T>(body: T, status = 200, latency = 450): Observable<HttpResponse<T>> {
  return timer(latency).pipe(mergeMap(() => of(new HttpResponse({ status, body }))));
}

function fail(status: number, message: string, url: string, latency = 400): Observable<never> {
  return timer(latency).pipe(
    mergeMap(() => throwError(() => new HttpErrorResponse({ status, url, error: { message } }))),
  );
}

/**
 * Back-end simulado em memória: mantém a aplicação 100% estática (GitHub Pages),
 * mas os serviços continuam usando HttpClient como numa API real. Para usar um
 * back-end de verdade, basta remover este interceptor de `app.config.ts`.
 */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) return next(req);

  if (req.url === '/api/auth/login' && req.method === 'POST') {
    const { email, password } = req.body as { email: string; password: string };
    const ok = email?.trim().toLowerCase() === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password;
    return ok
      ? reply({ token: fakeJwt(), user: DEMO_USER }, 200, 700)
      : fail(401, 'E-mail ou senha inválidos.', req.url, 700);
  }

  if (!req.headers.has('Authorization')) return fail(401, 'Não autenticado.', req.url, 50);

  if (req.url === '/api/transactions' && req.method === 'GET') {
    cache ??= generateTransactions(new Date());
    return reply(cache, 200, 800);
  }

  return fail(404, 'Recurso não encontrado.', req.url, 50);
};
