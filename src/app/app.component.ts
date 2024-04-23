import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Subscription, map, take } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'wanderer-fe';

  isLoggedIn: boolean | null = null;
  private authSubscription!: Subscription;

  constructor(private authService: AuthService) {
  }

  ngOnInit(): void {
    this.authSubscription = this.authService.getAuthState().subscribe((user) => {
      this.isLoggedIn = user != null ? true : false;
    })
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }
}
