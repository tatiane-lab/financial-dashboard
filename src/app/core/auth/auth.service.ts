import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';

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
  private http = inject(HttpClient);
  private router = inject(Router);

  private _currentUser = signal<AuthUser | null>(null);
  private _isLoading = signal(false);

  currentUser = this._currentUser.asReadonly();
  isAuthenticated = computed(() => this._currentUser() !== null);
  isLoading = this._isLoading.asReadonly();

  constructor() {
    this.loadUserFromToken();
  }

  login(credentials: LoginCredentials) {
    this._isLoading.set(true);
    return this.http
      .post<{ token: string; user: AuthUser }>('/api/auth/login', credentials)
      .pipe(
        tap(({ token, user }) => {
          localStorage.setItem(this.TOKEN_KEY, token);
          this._currentUser.set(user);
          this._isLoading.set(false);
        }),
        catchError((err) => {
          this._isLoading.set(false);
          throw err;
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private loadUserFromToken(): void {
    const token = this.getToken();
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 > Date.now()) {
        this._currentUser.set(payload.user as AuthUser);
      } else {
        this.logout();
      }
    } catch {
      this.logout();
    }
  }
}
