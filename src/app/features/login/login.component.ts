import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { DEMO_CREDENTIALS } from '../../core/interceptors/mock-api.interceptor';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly themeService = inject(ThemeService);

  protected readonly demo = DEMO_CREDENTIALS;
  protected readonly isLoading = this.authService.isLoading;
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage.set(null);
    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: (err) => this.errorMessage.set(err?.error?.message ?? 'Não foi possível entrar. Tente novamente.'),
    });
  }

  protected useDemo(): void {
    this.form.setValue({ email: this.demo.email, password: this.demo.password });
    this.submit();
  }

  protected fillDemo(): void {
    this.form.setValue({ email: this.demo.email, password: this.demo.password });
    this.errorMessage.set(null);
  }

  protected error(field: 'email' | 'password'): string | null {
    const ctrl = this.form.controls[field];
    if (!ctrl.touched && !ctrl.dirty) return null;
    if (ctrl.hasError('required')) return field === 'email' ? 'Informe o e-mail.' : 'Informe a senha.';
    if (ctrl.hasError('email')) return 'Digite um e-mail válido.';
    if (ctrl.hasError('minlength')) return 'A senha precisa ter ao menos 8 caracteres.';
    return null;
  }
}
