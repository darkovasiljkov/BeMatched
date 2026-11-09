import { inject, Injectable } from '@angular/core';
import { AccountService } from './account-service';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InitService {
  private accountService = inject(AccountService);

  init() {
    return this.accountService.refreshToken().pipe(
      tap(user => {
        if (user) { // this happens once we refresh the page!
          this.accountService.setCurrentUser(user);
          this.accountService.startTokenRefreshinterval();
        }
      })
    )
    
  }

}
