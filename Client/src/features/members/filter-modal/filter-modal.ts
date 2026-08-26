import { Component, ElementRef, effect, inject, input, output, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MemberFilters } from '../../../types/member-params';

@Component({
  selector: 'app-filter-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './filter-modal.html',
  styleUrl: './filter-modal.css',
})
export class FilterModal {
  private formBuilder = inject(FormBuilder).nonNullable;
  private filterDialog = viewChild<ElementRef<HTMLDialogElement>>('filterDialog');

  filters = input.required<MemberFilters>();
  resultCount = input.required<number>();
  filtersApplied = output<MemberFilters>();

  protected filterForm = this.formBuilder.group({
    gender: '',
    minAge: 18,
    maxAge: 100,
    orderBy: 'lastActive' as MemberFilters['orderBy'],
  });

  constructor() {
    effect(() => this.filterForm.patchValue(this.filters(), { emitEvent: false }));
  }

  protected open(): void {
    this.filterDialog()?.nativeElement.showModal();
  }

  protected close(): void {
    this.filterDialog()?.nativeElement.close();
  }

  protected apply(): void {
    const values = this.filterForm.getRawValue();

    if (values.minAge > values.maxAge) return;

    this.filtersApplied.emit({
      ...values,
      gender: values.gender || undefined,
    });
    this.close();
  }

  protected reset(): void {
    this.filterForm.setValue({
      gender: '',
      minAge: 18,
      maxAge: 100,
      orderBy: 'lastActive',
    });
  }
}
