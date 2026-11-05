import { Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { AccountService } from '../../core/services/account-service';
import { AdminService } from '../../core/services/admin-service';
import { ToastService } from '../../core/services/toast-service';
import { UserWithRoles } from '../../types/user-with-roles';

@Component({
  selector: 'app-admin',
  imports: [],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  private accountService = inject(AccountService);
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private rolesDialog = viewChild<ElementRef<HTMLDialogElement>>('rolesDialog');

  protected readonly isAdmin = computed(() => this.accountService.currentUser()?.roles.includes('Admin') ?? false);
  protected readonly activeTab = signal<'photos' | 'roles'>('photos');
  protected readonly users = signal<UserWithRoles[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadError = signal(false);
  protected readonly selectedUser = signal<UserWithRoles | null>(null);
  protected readonly selectedRoles = signal<string[]>([]);
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');
  protected readonly availableRoles = ['Member', 'Moderator', 'Admin'];
  protected readonly adminLocked = computed(() => this.selectedUser()?.roles.includes('Admin') ?? false);
  protected readonly rolesChanged = computed(() => {
    const original = this.selectedUser()?.roles ?? [];
    const selected = this.selectedRoles();
    return original.length !== selected.length || original.some(role => !selected.includes(role));
  });

  ngOnInit(): void {
    if (this.isAdmin()) this.loadUsers();
  }

  protected setTab(tab: 'photos' | 'roles'): void {
    if (tab === 'roles' && !this.isAdmin()) return;
    this.activeTab.set(tab);
  }

  protected loadUsers(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.adminService.getUserWithRoles().subscribe({
      next: users => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      }
    });
  }

  protected openRolesModal(user: UserWithRoles): void {
    if (!this.isAdmin()) return;
    this.selectedUser.set(user);
    // Edit a copy so cancelling the modal leaves the table unchanged.
    this.selectedRoles.set([...user.roles]);
    this.saveError.set('');
    this.rolesDialog()?.nativeElement.showModal();
  }

  protected toggleRole(role: string, checked: boolean): void {
    if (this.saving() || (role === 'Admin' && this.adminLocked())) return;
    this.selectedRoles.update(roles => checked ? [...roles, role] : roles.filter(value => value !== role));
    this.saveError.set('');
  }

  protected closeRolesModal(): void {
    if (this.saving()) return;
    this.rolesDialog()?.nativeElement.close();
    this.selectedUser.set(null);
  }

  protected saveRoles(): void {
    const user = this.selectedUser();
    if (!user || !this.isAdmin() || this.saving() || !this.rolesChanged() || !this.selectedRoles().length) return;
    if (this.adminLocked() && !this.selectedRoles().includes('Admin')) return;

    this.saving.set(true);
    this.saveError.set('');
    this.adminService.updateUserRoles(user.id, this.selectedRoles()).subscribe({
      next: roles => {
        this.users.update(users => users.map(value => value.id === user.id ? { ...value, roles } : value));
        this.saving.set(false);
        this.closeRolesModal();
        this.toast.success('Roles updated. They take effect the next time this user signs in.');
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('Could not save these roles. Please try again.');
      }
    });
  }
}
