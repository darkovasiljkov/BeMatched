import { Location } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AgePipe } from '../../../core/pipes/age-pipe';
import { AccountService } from '../../../core/services/account-service';
import { LikesService } from '../../../core/services/likes-service';
import { MemberService } from '../../../core/services/member-service';
import { ToastService } from '../../../core/services/toast-service';

@Component({
  selector: 'app-member-detailed',
  imports: [RouterLink, AgePipe, RouterLinkActive, RouterOutlet],
  templateUrl: './member-detailed.html',
  styleUrl: './member-detailed.css',
})
export class MemberDetailed implements OnInit {
  private route = inject(ActivatedRoute);
  protected memberService = inject(MemberService);
  private accountService = inject(AccountService);
  private likesService = inject(LikesService);
  private toastService = inject(ToastService);
  private location = inject(Location);
  private router = inject(Router);
  // The resolver fills this signal; photo and profile edits update it too.
  protected member = this.memberService.member;
  protected title = signal<string | undefined>('Profile');
  protected isCurrentUser = computed(() => this.accountService.currentUser()?.id === this.member()?.id);
  protected hasLiked = computed(() => this.likesService.likeIds().includes(this.member()?.id ?? ''));
  protected isLiking = signal(false);

  ngOnInit(): void {
    this.title.set(this.route.firstChild?.snapshot?.title);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe({
      next: () => {
        this.title.set(this.route.firstChild?.snapshot?.title);
      }
    })
  }

  protected goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      void this.router.navigateByUrl('/members');
    }
  }

  protected toggleLike(memberId: string): void {
    if (this.isCurrentUser() || this.isLiking()) return;

    this.isLiking.set(true);
    this.likesService.toggleLike(memberId).subscribe({
      next: () => {
        this.likesService.likeIds.update(ids =>
          ids.includes(memberId) ? ids.filter(id => id !== memberId) : [...ids, memberId]
        );
        this.isLiking.set(false);
      },
      error: () => {
        this.toastService.error('Could not update this like. Please try again.');
        this.isLiking.set(false);
      },
    });
  }
}
