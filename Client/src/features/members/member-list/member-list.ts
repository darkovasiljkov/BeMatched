import { Component, inject } from '@angular/core';
import { MemberService } from '../../../core/services/member-service';
import { Observable } from 'rxjs';
import { Member } from '../../../types/member';
import { AsyncPipe } from '@angular/common';
import { MemberCard } from '../member-card/member-card';
import { PaginatedResult } from '../../../types/pagination';
import { Paginator } from '../../../shared/paginator/paginator';
import { FilterModal } from '../filter-modal/filter-modal';
import { MemberFilters, MemberParams } from '../../../types/member-params';

@Component({
  selector: 'app-member-list',
  imports: [AsyncPipe, MemberCard, Paginator, FilterModal],
  templateUrl: './member-list.html',
  styleUrl: './member-list.css',
})
export class MemberList {
  private memberService = inject(MemberService);

  protected paginatedMembers$: Observable<PaginatedResult<Member>>;
  protected memberParams: MemberParams = {
    pageNumber: 1,
    pageSize: 5,
    minAge: 18,
    maxAge: 100,
    orderBy: 'lastActive',
  };

  constructor () {
    this.paginatedMembers$ = this.memberService.getMembers(this.memberParams);
  }

  protected onPageChange(pageNumber: number): void {
    this.memberParams = { ...this.memberParams, pageNumber };
    this.loadMembers();
  }

  protected onFiltersApplied(filters: MemberFilters): void {
    // A new filter can change how many pages exist, so always return to page 1.
    this.memberParams = { ...this.memberParams, ...filters, pageNumber: 1 };
    this.loadMembers();
  }

  private loadMembers(): void {
    this.paginatedMembers$ = this.memberService.getMembers(this.memberParams);
  }
}
