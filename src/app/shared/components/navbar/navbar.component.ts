import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { UserDto } from '../../../interfaces/dtos/response/user-dto';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy{
  isLoggedIn: boolean  = false;
  userDetails: UserDto | null = null;
  loading: boolean = false;
  
  private authSubscription: Subscription | null = null;

  constructor(private userService: UserService, private authService: AuthService) { }

  ngOnInit(): void {
    this.authSubscription = this.authService.getAuthState().subscribe((user) => {
      this.isLoggedIn = user != null ? true : false;

      if (this.isLoggedIn) {
        this.fetchUserDetails();
      }
    });
  }

  ngOnDestroy(): void {
    if(this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  private async fetchUserDetails(): Promise<void> {
    this.loading = true;
    try {
      
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      const profileName = localStorage.getItem('profileName') || sessionStorage.getItem('profileName');
      
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
