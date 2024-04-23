import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  isCollapsed: boolean = true;

  constructor(private authService: AuthService) {
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
