import { CanActivateFn } from '@angular/router';
import { AccountService } from '../services/account-service';
import { inject } from '@angular/core';
import { ToastService } from '../services/toast-service';

export const adminGuard: CanActivateFn = (route, state) => {
  const accountService = inject(AccountService);
  const toast = inject(ToastService);

  if (accountService.currentUser()?.roles.includes('Admin')
     || accountService.currentUser()?.roles.includes('Moderator'))
  {
    return true;

  }
  else {
    toast.error("You must be admin to enter this area");
    return false;
  }
};
