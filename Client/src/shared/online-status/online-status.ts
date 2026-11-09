import { Component, computed, inject, input } from '@angular/core';
import { PresenceService } from '../../core/services/presence-service';

@Component({
  selector: 'app-online-status',
  template: `
    <span class="inline-flex items-center gap-1.5 text-xs" [attr.title]="label()" [attr.aria-label]="label()">
      <span class="status status-sm" [class.status-success]="isOnline()" [class.status-neutral]="!isOnline()" aria-hidden="true"></span>
      <span [class.sr-only]="compact()">{{ label() }}</span>
    </span>
  `
})
export class OnlineStatus {
  private presence = inject(PresenceService);
  memberId = input.required<string>();
  compact = input(false);
  protected readonly isOnline = computed(() => this.presence.isConnected()
    && this.presence.onlineUsersReady()
    && this.presence.onlineUsers().includes(this.memberId()));
  protected readonly label = computed(() => this.presence.isConnected() && this.presence.onlineUsersReady()
    ? (this.isOnline() ? 'Online' : 'Offline')
    : 'Status unavailable');
}
