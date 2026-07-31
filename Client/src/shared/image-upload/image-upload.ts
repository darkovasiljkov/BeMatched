import { Component, EventEmitter, HostListener, Input, OnDestroy, Output } from '@angular/core';

@Component({
  selector: 'app-image-upload',
  imports: [],
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.css',
})
export class ImageUpload implements OnDestroy {
  @Input() loading = false;
  @Output() uploadFile = new EventEmitter<File>();

  protected isDragging = false;
  protected selectedFile: File | null = null;
  protected selectedFileName = '';
  protected statusMessage = 'Drag and drop a photo here, or browse from your device.';
  protected previewUrl: string | null = null;

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const currentTarget = event.currentTarget as HTMLElement | null;
    if (currentTarget?.contains(event.relatedTarget as Node | null)) {
      return;
    }

    this.isDragging = false;
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files?.length) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFiles(input.files);
    }
  }

  protected triggerFilePicker(): void {
    const input = document.getElementById('image-upload-input') as HTMLInputElement | null;
    input?.click();
  }

  protected resetSelection(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.statusMessage = 'Drag and drop a photo here, or browse from your device.';
    this.isDragging = false;
    this.setPreviewUrl(null);
  }

  protected uploadImage(): void {
    if (this.loading) {
      return;
    }

    if (!this.selectedFile) {
      this.statusMessage = 'Choose a photo before uploading.';
      return;
    }

    this.statusMessage = `Uploading ${this.selectedFile.name}...`;
    this.uploadFile.emit(this.selectedFile);
  }

  protected get previewImage(): string {
    return this.previewUrl ?? '/user.png';
  }

  private handleFiles(files: FileList): void {
    const file = files.item(0);

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.statusMessage = 'Please choose a valid image file.';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.statusMessage = 'The image must be smaller than 5MB.';
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
    this.statusMessage = 'Image ready to upload.';
    this.setPreviewUrl(URL.createObjectURL(file));
  }

  private setPreviewUrl(url: string | null): void {
    if (this.previewUrl && this.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }

    this.previewUrl = url;
  }

  ngOnDestroy(): void {
    this.setPreviewUrl(null);
  }
}
