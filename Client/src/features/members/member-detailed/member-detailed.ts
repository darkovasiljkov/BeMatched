import { Component, inject, OnInit, signal } from '@angular/core';
import { MemberService } from '../../../core/services/member-service';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { Member } from '../../../types/member';
import { filter } from 'rxjs';

@Component({
  selector: 'app-member-detailed',
  imports: [AsyncPipe, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './member-detailed.html',
  styleUrl: './member-detailed.css',
})
export class MemberDetailed implements OnInit {

  private memberService = inject(MemberService);
  private route = inject(ActivatedRoute);
  protected member$?: Observable<Member>;
  private router = inject(Router);
  protected title = signal<string | undefined>('Profile');

    ngOnInit(): void {
    this.member$ = this.loadMember();
    this.title.set(this.route.firstChild?.snapshot?.title);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe({
      next: () => {
        this.title.set(this.route.firstChild?.snapshot?.title);
      }
    })
  }

  loadMember() {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id){
      return
    }
    return this.memberService.getMember(id);
  }

}
