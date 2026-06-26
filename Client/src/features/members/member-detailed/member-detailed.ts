import { Component, inject, OnInit } from '@angular/core';
import { MemberService } from '../../../core/services/member-service';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { Member } from '../../../types/member';

@Component({
  selector: 'app-member-detailed',
  imports: [AsyncPipe, RouterLink, RouterLinkActive],
  templateUrl: './member-detailed.html',
  styleUrl: './member-detailed.css',
})
export class MemberDetailed implements OnInit {

  private memberService = inject(MemberService);
  private route = inject(ActivatedRoute);
  protected member$?: Observable<Member>;

    ngOnInit(): void {
    this.member$ = this.loadMember();
  }

  loadMember() {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id){
      return
    }
    return this.memberService.getMember(id);
  }

}
