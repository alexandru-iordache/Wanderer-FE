import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { UserService } from '../../../services/user.service';
import { UserDto } from '../../../interfaces/dtos/response/user-dto';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  userDetails: UserDto | null = null;
  loading: boolean = false;

  private authSubscription: Subscription | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authSubscription = this.authService
      .getAuthState()
      .subscribe((user) => {
        this.isLoggedIn = user != null ? true : false;

        if (this.isLoggedIn) {
          this.fetchUserDetails();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  onLogoutClicked(): void {
    this.loading = true;
    this.authService
      .signOut()
      .then(() => {
        this.isLoggedIn = false;
        this.userDetails = null;
        localStorage.removeItem('userId');
        localStorage.removeItem('profileName');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('profileName');
        this.router.navigate(['/sign-in']);
      })
      .catch((error) => {
        console.error('Logout error:', error);
      })
      .finally(() => {
        this.loading = false;
      });
  }

  private async fetchUserDetails(): Promise<void> {
    this.loading = true;
    try {
      const userId =
        localStorage.getItem('userId') || sessionStorage.getItem('userId');
      const profileName =
        localStorage.getItem('profileName') ||
        sessionStorage.getItem('profileName');

      if (userId && profileName) {
        this.userDetails = { id: userId, profileName: profileName } as UserDto;
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      this.loading = false;
    }
  }
}
