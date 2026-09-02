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
    this.restoreFilters();
    this.paginatedMembers$ = this.memberService.getMembers(this.memberParams);
  }

  protected onPageChange(pageNumber: number): void {
    this.memberParams = { ...this.memberParams, pageNumber };
    this.loadMembers();
  }

  protected onFiltersApplied(filters: MemberFilters): void {
    // A new filter can change how many pages exist, so always return to page 1.
    this.memberParams = { ...this.memberParams, ...filters, pageNumber: 1 };
    localStorage.setItem('filters', JSON.stringify(filters));
    this.loadMembers();
  }

  private loadMembers(): void {
    this.paginatedMembers$ = this.memberService.getMembers(this.memberParams);
  }

  private restoreFilters(): void {
    const savedFilters = localStorage.getItem('filters');

    if (!savedFilters) return;

    try {
      const filters = JSON.parse(savedFilters) as MemberFilters;
      this.memberParams = {
        ...this.memberParams,
        ...filters,
        pageNumber: 1,
      };
    } catch {
      // Ignore invalid old storage and continue with the default filters.
      localStorage.removeItem('filters');
    }
  }
}
