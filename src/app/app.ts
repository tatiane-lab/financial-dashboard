import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly themeService = inject(ThemeService);

  protected readonly nav = [
    { path: '/dashboard', label: 'Visão geral', icon: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10' },
    { path: '/transactions', label: 'Transações', icon: 'M4 6h16M4 12h16M4 18h10' },
  ];

  protected initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  }
}
