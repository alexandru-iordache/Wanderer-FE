import { Injectable } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { IdTokenResult } from 'firebase/auth';

@Injectable({
  providedIn: 'root',
})
export class TokenRefreshService {
  private refreshSubscription: Subscription | null = null;

  constructor(private auth: AngularFireAuth) {}

  startTokenRefreshJob(): void {
    this.stopTokenRefreshJob();

    this.refreshSubscription = interval(1 * 60 * 1000)
      .pipe(
        switchMap(() => this.getIdToken()),
        switchMap((tokenResult) => {
          if (!tokenResult) {
            throw new Error('No token result found');
          }

          console.log('[RefreshToken] Token result:', tokenResult);

          const isExpiringSoon = this.isTokenExpiringSoon(tokenResult);
          if (isExpiringSoon) {
            console.log('[RefreshToken] Token is expiring soon, refreshing...');
            localStorage.setItem('issuer time:', tokenResult.issuedAtTime); // IMPORTANT: Remove
            return this.refreshToken();
          }
          return [];
        })
      )
      .subscribe({
        error: (err) => console.error('Error refreshing token:', err),
      });
  }

  stopTokenRefreshJob(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = null;
    }
  }

  private async getIdToken(): Promise<IdTokenResult | null> {
    const user = await this.auth.currentUser;
    if (user) {
      return user.getIdTokenResult();
    }
    return null;
  }

  private async refreshToken(): Promise<void> {
    const user = await this.auth.currentUser;
    if (user) {
      await user.getIdToken(true);
    }
  }

  private isTokenExpiringSoon(tokenResult: IdTokenResult): boolean {
    const expiry = tokenResult.expirationTime;

    const expiryTime = new Date(expiry).getTime();
    const now = Date.now();
    const buffer = 5 * 60 * 1000;

    return expiryTime - now < buffer;
  }
}
