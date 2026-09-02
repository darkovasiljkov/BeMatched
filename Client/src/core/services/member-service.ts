import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { EditableMember, Member, Photo } from '../../types/member';
import { tap } from 'rxjs';
import { PaginatedResult } from '../../types/pagination';
import { MemberParams } from '../../types/member-params';

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  editMode = signal(true);
  member = signal<Member | null>(null);
  
  getMembers(memberParams: MemberParams) {
    let params = new HttpParams()
      .set('pageNumber', memberParams.pageNumber)
      .set('pageSize', memberParams.pageSize)
      .set('minAge', memberParams.minAge)
      .set('maxAge', memberParams.maxAge)
      .set('orderBy', memberParams.orderBy);

    if (memberParams.gender) {
      params = params.set('gender', memberParams.gender);
    }

    return this.http.get<PaginatedResult<Member>>(this.baseUrl + 'members', {params}).pipe(
      tap(() => {
        localStorage.setItem('filters', JSON.stringify(memberParams))
      })
    )
  }

  getMember(id: string) {
    return this.http.get<Member>(this.baseUrl + 'members/' + id).pipe(
      tap(member => {
        this.member.set(member);
      })
    )
  }

  getMemberPhotos(id: string) {
    return this.http.get<Photo[]>(this.baseUrl + 'members/' + id + '/photos')
  }

  updateMember(member: EditableMember) {
    return this.http.put(this.baseUrl + 'members', member);
  }

  uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Photo>(this.baseUrl + 'members/add-photo', formData)
  }

  setMainPhoto(photo: Photo) {
    return this.http.put(this.baseUrl + 'members/set-main-photo/' + photo.id, {});
  }

  deletePhoto(photoId: number) {
    return this.http.delete(this.baseUrl + 'members/delete-photo/' + photoId);
  }
}
 
