import { Component, OnDestroy, OnInit } from '@angular/core';
import { Uuid } from '../../shared/helpers/uuid';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserProfileDto } from '../../interfaces/dtos/response/user-profile-dto';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  userId: Uuid | null = null;
  userProfileDto: UserProfileDto | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private userService: UserService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id');

        this.userId = id ? (id as Uuid) : null;
      })
    );

    if (this.userId === null) {
      console.error('User ID is null');
      return;
    }

    this.subscriptions.push(
      this.userService.getUserProfile(this.userId).subscribe({
        next: (response) => {
          this.userProfileDto = response as UserProfileDto;
        },
        error: (error) => {
          console.error('Error fetching user details:', error);
        },
      })
    );
  }

  onFollowClick(): void {
    if (this.userProfileDto === null){
      alert('User profile is not loaded yet.');
      // TO DO: Handle this case more gracefully
      return;
    }

    this.userService.changeFollowingStatus(this.userId!).subscribe({
      next: (response) => {
        this.userProfileDto!.isFollowing = !this.userProfileDto!.isFollowing;
        this.userProfileDto!.followersCount += this.userProfileDto!.isFollowing ? 1 : -1;
      },
      error: (error) => {
        console.error('Error changing following status:', error);
      },
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
