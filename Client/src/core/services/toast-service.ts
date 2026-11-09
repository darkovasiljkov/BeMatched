import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private router = inject(Router);

  constructor()
  {
    this.createToastContainer();
  }

  private createToastContainer()
  {
    if (!document.getElementById('toast-container'))
    {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = `
        toast toast-bottom toast-end
        z-50
        gap-3
        p-6
      `;
      document.body.appendChild(container)
    }
  }

  private createToastElement(content: HTMLElement, alertClass: string, duration = 5000, onClick?: () => void){
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer){
      return;
    }

    const toast = document.createElement('div');
    toast.className = `
      alert ${alertClass}
      rounded-3xl
      border border-white/10
      bg-zinc-900/80
      text-base-content
      backdrop-blur-2xl
      shadow-2xl
      px-5 py-4
      min-w-[320px]
      transition-all duration-300
      hover:-translate-y-1
    `;
    toast.append(content);

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn btn-circle btn-ghost btn-sm text-white/50 hover:bg-white/10 hover:text-white';
    closeButton.setAttribute('aria-label', 'Dismiss notification');
    closeButton.textContent = '✕';
    closeButton.addEventListener('click', () => toast.remove());
    toast.append(closeButton);

    if (onClick) {
      content.addEventListener('click', () => {
        onClick();
        toast.remove();
      });
    }

    toastContainer.append(toast);

    setTimeout(() => {
      toast.remove();
    }, duration)
  }

  messageReceived(senderId: string, senderName: string, senderImageUrl: string, messageContent: string) {
    const content = document.createElement('button');
    content.type = 'button';
    content.className = 'flex min-w-0 flex-1 items-center gap-3 text-left';

    const image = document.createElement('img');
    image.src = senderImageUrl || '/user.png';
    image.alt = '';
    image.className = 'size-12 shrink-0 rounded-full object-cover';
    image.onerror = () => {
      image.onerror = null;
      image.src = '/user.png';
    };
    content.append(image);

    const text = document.createElement('span');
    text.className = 'min-w-0 flex-1';

    const title = document.createElement('span');
    title.className = 'block font-semibold';
    title.textContent = `${senderName} sent you a message`;
    text.append(title);

    if (messageContent.trim()) {
      const preview = document.createElement('span');
      preview.className = 'mt-1 block truncate text-sm opacity-70';
      preview.textContent = messageContent;
      text.append(preview);
    }
    content.append(text);

    this.createToastElement(content, 'alert-info', 8000, () => {
      void this.router.navigate(['/members', senderId, 'messages']);
    });
  }

  success(message: string, duration?: number) {
    this.createToastElement(this.textContent(message), 'alert-success', duration);
  }

  error(message: string, duration?: number) {
    this.createToastElement(this.textContent(message), 'alert-error', duration);
  }

  warning(message: string, duration?: number) {
    this.createToastElement(this.textContent(message), 'alert-warning', duration);
  }

  info(message: string, duration?: number) {
    this.createToastElement(this.textContent(message), 'alert-info', duration);
  }

  private textContent(message: string): HTMLElement {
    const text = document.createElement('span');
    text.textContent = message;
    return text;
  }
}
