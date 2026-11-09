import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { filter, merge, Subscription } from 'rxjs';
import { MessageService } from '../../../core/services/message-service';
import { PaginatedResult } from '../../../types/pagination';
import { Message } from '../../../types/message';
import { Paginator } from '../../../shared/paginator/paginator';
import { PresenceService } from '../../../core/services/presence-service';
import { AccountService } from '../../../core/services/account-service';

@Component({
  selector: 'app-messages',
  imports: [DatePipe, RouterLink, Paginator],
  templateUrl: './messages.html',
  styleUrl: './messages.css',
})
export class Messages implements OnInit {
  private messageService = inject(MessageService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private presenceService = inject(PresenceService);
  private accountService = inject(AccountService);
  private messagesRequest?: Subscription;
  protected container = 'Inbox';
  protected fetchedContainer = 'Inbox';
  protected pageNumber = 1;
  protected pageSize = 10;
  protected paginatedMessages = signal<PaginatedResult<Message> | null>(null);
  protected isLoading = signal(false);
  protected hasError = signal(false);
  protected pendingDeleteId = signal<string | null>(null);
  protected deletingMessageId = signal<string | null>(null);
  protected deleteError = signal(false);

  tabs = [
    {label: 'Inbox', value: 'Inbox'},
    {label: 'Outbox', value: 'Outbox'}
  ]
  ngOnInit(): void {
    this.loadMessages();
    const messagesForCurrentFolder = this.presenceService.newMessages$.pipe(
      filter(message => {
        const userId = this.accountService.currentUser()?.id;
        if (!userId) return false;
        return this.container === 'Inbox'
          ? message.recipientId === userId
          : message.senderId === userId;
      })
    );

    merge(messagesForCurrentFolder, this.presenceService.reconnected$)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.deletingMessageId()) this.loadMessages(false);
      });
  }

  loadMessages(showLoading = true) {
    this.messagesRequest?.unsubscribe();
    if (showLoading) this.isLoading.set(true);
    this.hasError.set(false);
    const requestedContainer = this.container;

    this.messagesRequest = this.messageService.getMessages(requestedContainer, this.pageNumber, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: resp => {
          this.paginatedMessages.set(resp);
          this.fetchedContainer = requestedContainer;
          this.isLoading.set(false);
        },
        error: () => {
          this.hasError.set(true);
          this.isLoading.set(false);
        },
      });
  }

  get isInbox() {
    return this.fetchedContainer === 'Inbox';
  }

  setContainer(container: string) {
    if (this.container === container || this.deletingMessageId()) return;
    this.pendingDeleteId.set(null);
    this.deleteError.set(false);
    this.container = container;
    this.pageNumber = 1;
    this.loadMessages();
  }

  onPageChange(pageNumber: number) {
    if (this.deletingMessageId()) return;
    this.pendingDeleteId.set(null);
    this.pageNumber = pageNumber;
    this.loadMessages();
  }

  openMessage(message: Message) {
    const memberId = this.isInbox ? message.senderId : message.recipientId;
    void this.router.navigate(['/members', memberId, 'messages']);
  }

  protected deleteMessage(messageId: string): void {
    if (this.deletingMessageId() || this.isLoading()) return;

    this.deletingMessageId.set(messageId);
    this.deleteError.set(false);
    this.messageService.deleteMessage(messageId).subscribe({
      next: () => {
        this.deletingMessageId.set(null);
        this.pendingDeleteId.set(null);
        // Deleting the last row on the last page can remove that page.
        const remainingCount = Math.max(0, (this.paginatedMessages()?.metadata.totalCount ?? 1) - 1);
        const lastPage = Math.max(1, Math.ceil(remainingCount / this.pageSize));
        this.pageNumber = Math.min(this.pageNumber, lastPage);
        this.loadMessages();
      },
      error: () => {
        this.deletingMessageId.set(null);
        this.deleteError.set(true);
      },
    });
  }

}
