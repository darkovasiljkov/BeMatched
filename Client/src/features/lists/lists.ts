import { Component, computed, inject, signal } from '@angular/core';
import { LikesService } from '../../core/services/likes-service';
import { Member } from '../../types/member';
import { MemberCard } from '../members/member-card/member-card';
import { PaginatedResult } from '../../types/pagination';
import { Paginator } from '../../shared/paginator/paginator';

@Component({
  selector: 'app-lists',
  imports: [MemberCard, Paginator],
  templateUrl: './lists.html',
  styleUrl: './lists.css',
})
export class Lists {
  private likesService = inject(LikesService);
  protected paginatedResult = signal<PaginatedResult<Member> | null>(null);
  protected readonly members = signal<Member[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly hasError = signal(false);
  protected readonly predicate = signal('mutual');
  protected pageNumber = 1;
  protected pageSize = 5;
  protected readonly activeTab = computed(() =>

    this.tabs.find(tab => tab.value === this.predicate())
  );
  protected readonly skeletons = [1, 2, 3, 4];

  protected readonly tabs = [
    {
      label: 'Mutual',
      value: 'mutual',
      description: 'The people you both chose.',
      emptyTitle: 'No mutual matches yet',
      emptyText: 'Keep exploring profiles. When the feeling is mutual, they will appear here.',
    },
    {
      label: 'Liked',
      value: 'liked',
      description: 'Profiles you have liked.',
      emptyTitle: 'Your liked list is empty',
      emptyText: 'Like a profile to keep it close and find it again here.',
    },
    {
      label: 'Liked me',
      value: 'likedBy',
      description: 'People who have liked you.',
      emptyTitle: 'No likes yet',
      emptyText: 'Your new admirers will show up here when someone likes your profile.',
    },
  ];

  ngOnInit(): void {
    this.loadLikes();
  }

  protected setPredicate(predicate: string) {
    if (this.predicate() !== predicate) {
      this.predicate.set(predicate);
      this.pageNumber = 1;
      this.loadLikes();
    }
  }

  protected onPageChange(pageNumber: number): void {
    this.pageNumber = pageNumber;
    this.loadLikes();
  }

  protected loadLikes(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.likesService.getLikes(this.predicate(), this.pageNumber, this.pageSize).subscribe({
      next: paginatedResult => {
        this.paginatedResult.set(paginatedResult);
        this.members.set(paginatedResult.items);
        this.isLoading.set(false);
      },
      error: () => {
        this.paginatedResult.set(null);
        this.members.set([]);
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }
}
