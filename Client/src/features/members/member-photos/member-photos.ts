import { Component, inject, OnInit, signal } from '@angular/core';
import { MemberService } from '../../../core/services/member-service';
import { ActivatedRoute } from '@angular/router';
import { Photo } from '../../../types/member';
import { ImageUpload } from '../../../shared/image-upload/image-upload';
import { AccountService } from '../../../core/services/account-service';
import { StarButton } from "../../../shared/star-button/star-button";
import { DeleteButton } from "../../../shared/delete-button/delete-button";

@Component({
  selector: 'app-member-photos',
  imports: [ImageUpload, StarButton, DeleteButton],
  templateUrl: './member-photos.html',
  styleUrl: './member-photos.css',
})
export class MemberPhotos implements OnInit {
  protected memberService = inject(MemberService)
  protected accountService = inject(AccountService);
  private route = inject(ActivatedRoute);
  protected photos = signal<Photo[]>([])
  protected loading = signal(false);
  protected settingMainPhoto = signal(false);

  ngOnInit(): void {
    const memberId = this.route.parent?.snapshot.paramMap.get('id');
    if (memberId) {
      this.memberService.getMemberPhotos(memberId).subscribe({
        next: photos => this.photos.set(photos)
      })
    }
  }

  onUploadImage(file: File) {
    if (this.loading()) return;
    this.loading.set(true);
    this.memberService.uploadPhoto(file).subscribe({
      next: photo => {
        // The API makes the first photo main automatically.
        if (!this.memberService.member()?.imageUrl) {
          this.updateMainPhoto(photo);
        }
        this.memberService.editMode.set(false);
        this.loading.set(false);
        this.photos.update(photos => [...photos, photo])
      },
      error: () => {
        this.loading.set(false);
      }
    })
  }
  
  protected isMainPhoto(photo: Photo): boolean {
    return photo.url === this.memberService.member()?.imageUrl;
  }

  setMainPhoto(photo: Photo) {
    if (this.isMainPhoto(photo) || this.settingMainPhoto()) {
      return;
    }

    this.settingMainPhoto.set(true);
    this.memberService.setMainPhoto(photo).subscribe({
      next: () => {
        this.updateMainPhoto(photo);
        this.settingMainPhoto.set(false);
      },
      error: () => {
        this.settingMainPhoto.set(false);
      }
    })
  }

  private updateMainPhoto(photo: Photo): void {
    this.memberService.member.update(member =>
      member?.id === photo.memberId ? { ...member, imageUrl: photo.url } : member
    );

    const currentUser = this.accountService.currentUser();
    if (currentUser?.id === photo.memberId) {
      this.accountService.setCurrentUser({ ...currentUser, imageUrl: photo.url });
    }
  }

  deletePhoto(photoId: number) {
    this.memberService.deletePhoto(photoId).subscribe({
      next: () => {
        this.photos.update(photos => photos.filter(x => x.id !== photoId))
      }
    })
  }
}
