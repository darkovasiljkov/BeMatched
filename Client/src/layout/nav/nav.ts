import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../core/services/account-service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastService } from '../../core/services/toast-service';
import { themes } from '../theme';
import { BusyService } from '../../core/services/busy-service';

@Component({
  selector: 'app-nav',
  imports: [FormsModule, RouterLink, RouterLinkActive, RouterLinkActive],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav implements OnInit {
  protected accountService = inject(AccountService);
  protected busyService = inject(BusyService);
  protected creds: any = {}
  private router = inject(Router);
  private toast = inject(ToastService);
  protected selectedTheme = signal<string>(localStorage.getItem('theme') || 'night');
  protected themes = themes;


  ngOnInit(): void {
        document.documentElement.setAttribute('data-theme', this.selectedTheme());
  }

  handleSelectTheme(theme: string) {
  this.selectedTheme.set(theme);
  localStorage.setItem('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  }

  toggleTheme() {
  const newTheme =
    this.selectedTheme() === 'night'
      ? 'light'
      : 'night';

  this.handleSelectTheme(newTheme);
}

  login ()
  {
    this.accountService.login(this.creds).subscribe({
      next: result => {
        this.router.navigateByUrl('/members')
        this.toast.success('Logged in successfully');
        this.creds = {};
      },
      error: error => 
      {
        this.toast.error(error.error)
      }
    })
  }

  logout()
  {
    this.accountService.logout();
    this.router.navigateByUrl('/');
  }
}
