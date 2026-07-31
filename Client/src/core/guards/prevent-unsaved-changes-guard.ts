import { CanDeactivateFn } from '@angular/router';
import { MemberProfile } from '../../features/members/member-profile/member-profile';

export const preventUnsavedChangesGuard: CanDeactivateFn<MemberProfile> =
(component) => {

  if (
    component.editForm?.dirty
  ) {
    return confirm(
      'You have unsaved changes. Are you sure you want to leave this page?'
    );
  }

  return true;
};