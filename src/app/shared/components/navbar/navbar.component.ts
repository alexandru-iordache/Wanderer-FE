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
export class NavbarComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isLoggedIn: boolean = false;
  userDetails: UserDto | null = null;
  loading: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.userService.getUserDetailsChanged().subscribe((userDetails) => {
        if (userDetails) {
          this.userDetails = userDetails;
          this.isLoggedIn = true;
        }
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isLoggedIn'] && this.isLoggedIn) {
      this.fetchUserDetails();
    } else {
      this.userDetails = null;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
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
        localStorage.removeItem('idToken');
        sessionStorage.removeItem('idToken');
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
      this.userService.getUserDetails().subscribe({
        next: (userDetails) => {
          this.userDetails = userDetails;
          // this.userService.updateUserDetailsChanged(userDetails);
        },
        error: (error) => {
          console.error('Error fetching user details:', error);
          this.userDetails = null;
          this.userService.updateUserDetailsChanged(null);
        },
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      this.loading = false;
    }
  }
}
