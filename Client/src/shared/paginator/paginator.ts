import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Pagination } from '../../types/pagination';

@Component({
  selector: 'app-paginator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pagination().totalPages > 1) {
      <nav class="mt-9 flex flex-col items-center gap-3 text-base-content" aria-label="Pagination">
        <p class="text-sm font-medium">
          {{ itemRange() }} of {{ pagination().totalCount }} {{ itemName() }}
        </p>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="inline-flex size-11 items-center justify-center rounded-full bg-base-content text-base-100 transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-20"
            [disabled]="isFirstPage()"
            (click)="goToPage(pagination().currentPage - 1)"
            aria-label="Previous page"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="size-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <p class="min-w-24 text-center text-lg font-black tracking-tight">
            {{ pagination().currentPage }} <span class="text-base-content/35">/</span> {{ pagination().totalPages }}
          </p>

          <button
            type="button"
            class="inline-flex size-11 items-center justify-center rounded-full bg-base-content text-base-100 transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-20"
            [disabled]="isLastPage()"
            (click)="goToPage(pagination().currentPage + 1)"
            aria-label="Next page"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="size-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </nav>
    }
  `,
})
export class Paginator {
  pagination = input.required<Pagination>();
  itemName = input('matches');
  pageChange = output<number>();

  protected isFirstPage = computed(() => this.pagination().currentPage <= 1);
  protected isLastPage = computed(() => this.pagination().currentPage >= this.pagination().totalPages);
  protected itemRange = computed(() => {
    const { currentPage, pageSize, totalCount } = this.pagination();
    const firstItem = (currentPage - 1) * pageSize + 1;
    const lastItem = Math.min(currentPage * pageSize, totalCount);

    return `${firstItem}-${lastItem}`;
  });

  protected goToPage(page: number): void {
    const { currentPage, totalPages } = this.pagination();
    const targetPage = Math.min(Math.max(page, 1), totalPages);

    if (targetPage !== currentPage) {
      this.pageChange.emit(targetPage);
    }
  }
}
