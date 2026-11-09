import { computed, inject, Injectable, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Message } from '../../types/message';
import { User } from '../../types/user';
import { ToastService } from './toast-service';

@Injectable({ providedIn: 'root' })
export class PresenceService {
  private toast = inject(ToastService);
  private user?: User;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private startAttempts = 0;
  private incomingMessages = new Subject<Message>();
  private reconnects = new Subject<void>();
  hubConnection?: HubConnection;

  readonly onlineUsers = signal<string[]>([]);
  readonly onlineUsersReady = signal(false);
  readonly connectionState = signal(HubConnectionState.Disconnected);
  readonly isConnected = computed(() => this.connectionState() === HubConnectionState.Connected);
  readonly newMessages$ = this.incomingMessages.asObservable();
  readonly reconnected$ = this.reconnects.asObservable();

  async createHubConnection(user: User): Promise<void> {
    const sameUser = this.user?.id === user.id;
    this.user = user; // Token refresh updates the token used for the next reconnect.
    if (sameUser && this.hubConnection) {
      if (this.hubConnection.state === HubConnectionState.Disconnected && !this.retryTimer)
        await this.startConnection(this.hubConnection);
      return;
    }

    const previousConnection = this.hubConnection;
    this.clearRetry();
    this.startAttempts = 0;
    this.onlineUsers.set([]);
    this.onlineUsersReady.set(false);
    const connection = new HubConnectionBuilder()
      .withUrl(environment.hubUrl.replace(/\/$/, '') + '/presence', {
        accessTokenFactory: () => this.user?.token ?? ''
      })
      .withAutomaticReconnect()
      .build();
    this.hubConnection = connection;
    this.connectionState.set(HubConnectionState.Connecting);
    const isCurrent = () => this.hubConnection === connection;

    // Register handlers before starting, so the initial online list cannot be missed.
    connection.on('GetOnlineUsers', (ids: string[]) => {
      if (isCurrent()) {
        this.onlineUsers.set(ids);
        this.onlineUsersReady.set(true);
      }
    });
    connection.on('UserOnline', (id: string) => {
      if (isCurrent()) this.onlineUsers.update(ids => ids.includes(id) ? ids : [...ids, id]);
    });
    connection.on('UserOffline', (id: string) => {
      if (isCurrent()) this.onlineUsers.update(ids => ids.filter(value => value !== id));
    });
    connection.on('NewMessage', (message: Message) => {
      if (!isCurrent()) return;
      this.incomingMessages.next(message);
      if (message.recipientId === this.user?.id) {
        this.toast.messageReceived(message.senderId, message.senderDisplayName, message.senderImageUrl, message.content);
      }
    });
    connection.onreconnecting(() => {
      if (!isCurrent()) return;
      this.connectionState.set(HubConnectionState.Reconnecting);
      this.onlineUsers.set([]);
      this.onlineUsersReady.set(false);
    });
    connection.onreconnected(() => {
      if (!isCurrent()) return;
      this.connectionState.set(HubConnectionState.Connected);
      this.reconnects.next(); // Open pages reload history missed during the disconnect.
    });
    connection.onclose(() => {
      if (!isCurrent()) return;
      this.connectionState.set(HubConnectionState.Disconnected);
      this.onlineUsers.set([]);
      this.onlineUsersReady.set(false);
      this.retryConnection(connection);
    });

    try { await previousConnection?.stop(); }
    catch (error) { console.warn('Could not stop the previous presence connection.', error); }
    if (isCurrent()) await this.startConnection(connection);
  }

  async stopHubConnection(): Promise<void> {
    const connection = this.hubConnection;
    this.hubConnection = undefined;
    this.user = undefined;
    this.clearRetry();
    this.onlineUsers.set([]);
    this.onlineUsersReady.set(false);
    this.connectionState.set(HubConnectionState.Disconnected);
    try { await connection?.stop(); }
    catch (error) { console.warn('Could not stop presence connection.', error); }
  }

  async sendMessage(recipientId: string, content: string): Promise<Message> {
    if (!this.hubConnection || !this.isConnected()) throw new Error('Live messaging is reconnecting. Please try again.');
    return this.hubConnection.invoke<Message>('SendMessage', { recipientId, content });
  }

  private async startConnection(connection: HubConnection): Promise<void> {
    if (this.hubConnection !== connection || connection.state !== HubConnectionState.Disconnected) return;
    const isRetry = this.startAttempts > 0;
    this.startAttempts++;
    this.connectionState.set(HubConnectionState.Connecting);
    try {
      await connection.start();
      if (this.hubConnection === connection) {
        this.connectionState.set(HubConnectionState.Connected);
        // The first connection needs no extra fetch; the page loads its history itself.
        if (isRetry) this.reconnects.next();
      }
    } catch (error) {
      if (this.hubConnection !== connection) return;
      console.warn('Presence connection failed; retrying in five seconds.', error);
      this.connectionState.set(HubConnectionState.Disconnected);
      this.retryConnection(connection);
    }
  }

  private retryConnection(connection: HubConnection): void {
    this.clearRetry();
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      void this.startConnection(connection);
    }, 5000); // Automatic reconnect does not retry the very first start failure.
  }

  private clearRetry(): void {
    if (this.retryTimer !== undefined) clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
  }
}
