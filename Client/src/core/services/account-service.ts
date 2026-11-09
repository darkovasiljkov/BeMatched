import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { LoginCreds, RegisterCreds, User } from '../../types/user';
import { finalize, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { LikesService } from './likes-service';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);
  private likesService = inject(LikesService);
  private refreshInterval?: ReturnType<typeof setInterval>;
  private refreshSubscription?: Subscription;

  currentUser = signal<User | null>(null);
  readonly loggingOut = signal(false);
  
  private baseUrl = environment.apiUrl;

  register(creds: RegisterCreds){
    return this.http.post<User>(this.baseUrl + 'accounts/register', creds, { withCredentials: true}).pipe(
      tap(user => {
        if (user){
          this.setCurrentUser(user);
        }
      })
    )
  }

  login(creds: LoginCreds)
  {
    return this.http.post<User>(this.baseUrl + 'accounts/login', creds, { withCredentials: true}).pipe(
      tap(user => {
        if (user){
          this.setCurrentUser(user);
          this.startTokenRefreshinterval();
        }
      })
    )
  }

  refreshToken () {
    return this.http.post<User>(this.baseUrl + 'accounts/refresh-token', {}, { withCredentials: true})
  }

  startTokenRefreshinterval() {
    this.stopTokenRefreshinterval();
    this.refreshInterval = setInterval(() => {
      this.refreshSubscription = this.http.post<User>(this.baseUrl + 'accounts/refresh-token', {}, { withCredentials: true}).subscribe({
        next: user => {
          if (user && !this.loggingOut()) this.setCurrentUser(user);
        },
        error: () => {
          this.logout().subscribe({ error: () => {} });
        }
      })
    }, 5 * 60 * 1000) // 5 minute interval
  }

  setCurrentUser(user: User) {
    user.roles = this.getRolesFromToken(user);
    this.currentUser.set(user);
    this.likesService.getLikeIds();
  }

  logout(){
    this.stopTokenRefreshinterval();
    this.loggingOut.set(true);
    return this.http.post<void>(this.baseUrl + 'accounts/logout', {}, { withCredentials: true }).pipe(
      tap(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('filters');
        this.likesService.clearLikeIds();
        this.currentUser.set(null);
      }),
      finalize(() => {
        this.loggingOut.set(false);
        // Keep the user signed in and allow retry if server logout failed.
        if (this.currentUser()) this.startTokenRefreshinterval();
      })
    );
  }

  private stopTokenRefreshinterval() {
    if (this.refreshInterval !== undefined) clearInterval(this.refreshInterval);
    this.refreshInterval = undefined;
    this.refreshSubscription?.unsubscribe();
    this.refreshSubscription = undefined;
  }

  private getRolesFromToken(user: User): string[] {
    const payload = user.token.split('.')[1];
    const decoded = atob(payload);
    const jsonPayload = JSON.parse(decoded);
    return Array.isArray(jsonPayload.role) ? jsonPayload.role : [jsonPayload.role];
  }
}
