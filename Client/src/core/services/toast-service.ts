import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ToastService {

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
        z-[9999]
        gap-3
        p-6
      `;
      document.body.appendChild(container)
    }
  }

  private createToastElement(message: string, alertClass: string, duration = 5000){
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
  text-white
  backdrop-blur-2xl
  shadow-2xl
  px-5 py-4
  min-w-[320px]
  transition-all duration-300
  hover:-translate-y-1
`;
    toast.innerHTML = `
      <span>${message}</span>
      <button class="btn btn-circle btn-ghost btn-sm text-white/50 hover:bg-white/10 hover:text-white">
      ✕
      </button>
    `
    toast.querySelector('button')?.addEventListener('click', () => 
    toastContainer.removeChild(toast));

    toastContainer.append(toast);

    setTimeout(() => {
      if (toastContainer.contains(toast)){
        toastContainer.removeChild(toast)
      }
    }, duration)
  }

  success(message: string, duration?: number) {
    this.createToastElement(message, 'alert-success', duration);
  }

  error(message: string, duration?: number) {
    this.createToastElement(message, 'alert-error', duration);
  }

  warning(message: string, duration?: number) {
    this.createToastElement(message, 'alert-warning', duration);
  }

  info(message: string, duration?: number) {
    this.createToastElement(message, 'alert-info', duration);
  }
}
