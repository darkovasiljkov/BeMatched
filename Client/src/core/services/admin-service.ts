import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { UserWithRoles } from '../../types/user-with-roles';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getUserWithRoles() {
    return this.http.get<UserWithRoles[]>(this.baseUrl + 'admin/users-with-roles');
  }

  updateUserRoles(userId: string, roles: string[]) {
    return this.http.post<string[]>(
      this.baseUrl + 'admin/edit-roles/' + encodeURIComponent(userId),
      {},
      { params: { roles: roles.join(',') } }
    );
  }
}
