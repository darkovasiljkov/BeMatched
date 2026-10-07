import { Component, inject, OnInit, signal } from '@angular/core';
import { MessageService } from '../../../core/services/message-service';
import { PaginatedResult } from '../../../types/pagination';
import { Message } from '../../../types/message';

@Component({
  selector: 'app-messages',
  imports: [],
  templateUrl: './messages.html',
  styleUrl: './messages.css',
})
export class Messages implements OnInit {
  private messageService = inject(MessageService);
  protected container = 'Inbox';
  protected pageNumber = 1;
  protected pageSize = 10;
  protected paginatedMessages = signal<PaginatedResult<Message> | null>(null);

  ngOnInit(): void {

  }

  loadMessages() {
    this.messageService.getMessages(this.container, this.pageNumber, this.pageSize).subscribe({
      next: resp => this.paginatedMessages.set(resp)
    })
  }
}
