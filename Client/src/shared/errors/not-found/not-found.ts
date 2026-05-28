import { Component, inject } from '@angular/core';
import { Location} from '@angular/common';
@Component({
  selector: 'app-not-found',
  imports: [],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
})
export class NotFound {
  private location = inject(Location);
  
  goBack() {
    this.location.back();
  }

}
