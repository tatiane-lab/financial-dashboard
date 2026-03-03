import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  isLoading = this.authService.isLoading;
  errorMessage = signal<string | null>(null);

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.errorMessage.set(null);
    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) =>
        this.errorMessage.set(
          err.error?.message ?? 'Invalid credentials. Please try again.'
        ),
    });
  }

  get emailErrors() {
    const ctrl = this.loginForm.controls.email;
    if (!ctrl.dirty) return null;
    if (ctrl.hasError('required')) return 'Email is required';
    if (ctrl.hasError('email')) return 'Enter a valid email address';
    return null;
  }
}
