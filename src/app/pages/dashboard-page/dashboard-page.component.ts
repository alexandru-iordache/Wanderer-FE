import { Component } from '@angular/core';
import { Uuid } from '../../shared/helpers/uuid';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
  userId: Uuid;

  constructor() {    
    this.userId = localStorage.getItem('userId') as Uuid;
  }
}
