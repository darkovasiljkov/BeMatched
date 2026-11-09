import { Component, DestroyRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { EditableMember, Member } from '../../../types/member';
import { DatePipe } from '@angular/common';
import { MemberService } from '../../../core/services/member-service';
import { ToastService } from '../../../core/services/toast-service';
import { FormsModule, NgForm } from '@angular/forms';
import { AccountService } from '../../../core/services/account-service';
import { TimeagoPipe } from 'ngx-timeago';

@Component({
  selector: 'app-member-profile',
  imports: [DatePipe, FormsModule, TimeagoPipe],
  templateUrl: './member-profile.html',
  styleUrl: './member-profile.css',
})
export class MemberProfile implements OnInit, OnDestroy {
  @ViewChild('editForm') editForm? : NgForm;

  protected accountService = inject(AccountService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  protected memberService = inject(MemberService);
  private toast = inject(ToastService);
  protected editableMember: EditableMember = {
    displayName: '',
    description: '',
    city: '',
    country: ''
  }


  ngOnInit(): void {
    this.route.parent?.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      const member = data['member'] as Member | undefined;
      if (!member) return;

      this.memberService.editMode.set(false);
      this.editableMember = {
        displayName: member.displayName,
        description: member.description || '',
        city: member.city,
        country: member.country
      };
      this.editForm?.reset(this.editableMember);
    });
  }

  updateProfile() {
    const member = this.memberService.member();
    if (!member || this.accountService.currentUser()?.id !== member.id) {
      return;
    }

    const updatedMember = {...member, ...this.editableMember}
    this.memberService.updateMember(this.editableMember).subscribe({
      next: () => {
            const currentUser = this.accountService.currentUser();
            if (currentUser && updatedMember.displayName !== currentUser?.displayName) {
              currentUser.displayName = updatedMember.displayName
              this.accountService.setCurrentUser(currentUser);
            }
            this.toast.success('Profile updated successfully!');
            this.memberService.editMode.set(false);
            this.memberService.member.set(updatedMember as Member);
            this.editForm?.reset(updatedMember);
      }
    })
  }

  ngOnDestroy(): void {
    if (this.memberService.editMode()) {
      this.memberService.editMode.set(false);
    }
  }
}
