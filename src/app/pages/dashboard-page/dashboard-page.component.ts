import { Component } from '@angular/core';
import { Uuid } from '../../shared/helpers/uuid';
import { PostBatch } from '../../interfaces/enums/post-batch.enum';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  userId: Uuid;
  batchType: PostBatch = PostBatch.USER_FEED;
  searchValue: string = '';

  constructor() {
    this.userId = localStorage.getItem('userId') as Uuid;
    if (this.userId === null) {
      this.userId = sessionStorage.getItem('userId') as Uuid;
    }
  }

  onSearchValueChange(value: string): void {
    this.searchValue = value;
    // TODO: Implement search functionality
  }

  onSearch(value: string): void {
    // TODO: Implement search logic
    console.log('Searching for:', value);
  }
}
