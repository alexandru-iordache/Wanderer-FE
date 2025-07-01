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

  constructor() {
    this.userId = localStorage.getItem('userId') as Uuid;
    if (this.userId === null) {
      this.userId = sessionStorage.getItem('userId') as Uuid;
    }
  }
}
