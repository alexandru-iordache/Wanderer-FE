import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Subscription, map, take } from 'rxjs';
import { environment } from '../environments/environment';

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
    this.loadGoogleMapsScript();
    this.authSubscription = this.authService.getAuthState().subscribe((user) => {
      this.isLoggedIn = user != null ? true : false;
    })
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  private loadGoogleMapsScript(): void {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
}
