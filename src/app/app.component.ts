import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Subscription, map, take } from 'rxjs';
import { environment } from '../environments/environment';
import { GoogleMapsService } from './services/google-maps.service';
import { TokenRefreshService } from './services/token-refresh.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'wanderer-fe';

  isLoggedIn: boolean = false;
  private authSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private googleMapsService: GoogleMapsService,
    private tokenRefreshService: TokenRefreshService
  ) {}

  async ngOnInit(): Promise<void> {
    this.authSubscription = this.authService
      .getAuthState()
      .subscribe((user) => {
        this.isLoggedIn = user != null ? true : false;
      });

    try {
      await this.googleMapsService.loadScriptAsync();
    } catch (exception) {
      console.error("Couldn't load the Google Maps scipt.", exception);
    }
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }
}
