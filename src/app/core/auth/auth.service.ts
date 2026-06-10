import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, tap } from 'rxjs/operators';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'analyst' | 'viewer';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'finance_auth_token';
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<AuthUser | null>(null);
  private readonly _isLoading = signal(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isLoading = this._isLoading.asReadonly();

  constructor() {
    this.loadUserFromToken();
  }

  login(credentials: LoginCredentials) {
    this._isLoading.set(true);
    return this.http.post<{ token: string; user: AuthUser }>('/api/auth/login', credentials).pipe(
      tap(({ token, user }) => {
        this.storeToken(token);
        this._currentUser.set(user);
      }),
      finalize(() => this._isLoading.set(false)),
    );
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private storeToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch {
      /* armazenamento indisponível: sessão vive só em memória */
    }
  }

  private clearSession(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch {
      /* noop */
    }
    this._currentUser.set(null);
  }

  private loadUserFromToken(): void {
    const token = this.getToken();
    if (!token) return;
    try {
      const segment = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const bytes = Uint8Array.from(atob(segment), (c) => c.charCodeAt(0));
      const payload = JSON.parse(new TextDecoder().decode(bytes));
      if (payload.exp * 1000 > Date.now()) {
        this._currentUser.set(payload.user as AuthUser);
      } else {
        this.clearSession();
      }
    } catch {
      this.clearSession();
    }
  }
}
