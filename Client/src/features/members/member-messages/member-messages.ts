import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, map, Subscription } from 'rxjs';
import { AccountService } from '../../../core/services/account-service';
import { MessageService } from '../../../core/services/message-service';
import { Message } from '../../../types/message';

@Component({
  selector: 'app-member-messages',
  imports: [DatePipe, FormsModule],
  templateUrl: './member-messages.html',
  styleUrl: './member-messages.css',
})
export class MemberMessages {
  @ViewChild('messageEndRef') messageEndRef?: ElementRef<HTMLDivElement>;
  private messageService = inject(MessageService);
  private accountService = inject(AccountService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private threadRequest?: Subscription;

  protected messages = signal<Message[]>([]);
  private recipientId = signal<string | null>(null);
  protected currentUserId = computed(() => this.accountService.currentUser()?.id);
  protected lastSeenMessageId = computed(() => {
    const seenMessages = this.messages().filter(message =>
      message.senderId === this.currentUserId() && !!message.dateRead
    );
    return seenMessages.at(-1)?.id;
  });
  protected canSend = computed(() => {
    const recipientId = this.recipientId();
    const currentUserId = this.currentUserId();
    return !!recipientId && !!currentUserId && recipientId !== currentUserId;
  });
  protected messageContent = '';
  protected isLoading = signal(false);
  protected hasError = signal(false);
  protected isSending = signal(false);
  protected sendError = signal(false);
  protected pendingDeleteId = signal<string | null>(null);
  protected deletingMessageId = signal<string | null>(null);
  protected deleteError = signal(false);

  constructor() {
    effect(() => {
      const currentMessages = this.messages();

      if (currentMessages.length > 0) {
        this.scrollToBottom();
      }
    })
  }
  ngOnInit(): void {
    if (!this.route.parent) {
      this.hasError.set(true);
      return;
    }

    this.route.parent.paramMap.pipe(
      map(params => params.get('id')),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(memberId => {
      this.recipientId.set(memberId);
      this.messages.set([]);
      this.messageContent = '';
      this.sendError.set(false);
      this.pendingDeleteId.set(null);
      this.deleteError.set(false);
      this.loadMessages();
    });
  }

  loadMessages(): void {
    const memberId = this.recipientId();
    this.threadRequest?.unsubscribe();

    if (memberId) {
      this.isLoading.set(true);
      this.hasError.set(false);
      this.threadRequest = this.messageService.getMessageThread(memberId)
        .subscribe({
          next: messages => {
            this.messages.set(messages);
            this.isLoading.set(false);
          },
          error: () => {
            this.hasError.set(true);
            this.isLoading.set(false);
          },
        });
    } else {
      this.hasError.set(true);
      this.isLoading.set(false);
    }
  }

  protected sendMessage(): void {
    const recipientId = this.recipientId();
    const content = this.messageContent.trim();

    if (!recipientId || !this.canSend() || !content || this.isSending() || this.isLoading() || this.hasError() || this.deletingMessageId()) return;

    this.isSending.set(true);
    this.sendError.set(false);

    this.messageService.sendMessage(recipientId, content).subscribe({
        next: message => {
          if (this.recipientId() === recipientId) {
            this.messages.update(messages => [...messages, message]);
            this.messageContent = '';
          }
          this.isSending.set(false);
        },
        error: () => {
          if (this.recipientId() === recipientId) this.sendError.set(true);
          this.isSending.set(false);
        },
      });
  }
  protected deleteMessage(messageId: string): void {
    if (this.deletingMessageId() || this.isLoading() || this.isSending()) return;

    const recipientId = this.recipientId();
    this.deletingMessageId.set(messageId);
    this.deleteError.set(false);
    this.messageService.deleteMessage(messageId).subscribe({
      next: () => {
        if (this.recipientId() === recipientId) {
          this.messages.update(messages => messages.filter(message => message.id !== messageId));
          this.pendingDeleteId.set(null);
        }
        this.deletingMessageId.set(null);
      },
      error: () => {
        if (this.recipientId() === recipientId) this.deleteError.set(true);
        this.deletingMessageId.set(null);
      },
    });
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageEndRef) {
        this.messageEndRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }
}
