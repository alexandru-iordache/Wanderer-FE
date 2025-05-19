import {
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { UserStatsDto } from '../../interfaces/dtos/response/user-stats-dto';
import { UserService } from '../../services/user.service';
import { FilterOptionsDto } from '../../interfaces/dtos/filter-options-dto';
import { Uuid } from '../../shared/helpers/uuid';

@Component({
  selector: 'app-my-trips-page',
  templateUrl: './my-trips-page.component.html',
  styleUrl: './my-trips-page.component.scss',
})
export class MyTripsPageComponent implements OnInit, OnDestroy {
  userTotalStats: UserStatsDto = {
    tripsCount: 0,
    countriesCount: 0,
    citiesCount: 0,
    waypointsCount: 0,
    daysCount: 0,
  } as UserStatsDto;
  userCompletedStats: UserStatsDto = {
    tripsCount: 0,
    countriesCount: 0,
    citiesCount: 0,
    waypointsCount: 0,
    daysCount: 0,
  } as UserStatsDto;
  filterOptions: FilterOptionsDto = {
    minDate: undefined,
    maxDate: undefined,
    completionStatus: 'All',
  };
  areFiltersOpened: boolean = false;

  userId: Uuid;

  private subscriptions: Subscription[] = [];

  constructor(private userService: UserService) {
     this.userId = localStorage.getItem('userId') as Uuid;
  }

  ngOnInit(): void {
    this.getAllUserStats();
    this.getCompletedUserStats();
    
    this.subscriptions.push(
      this.userService.getUserStatsChanged().subscribe({
        next: (userStatsChanged) => {
          this.getAllUserStats();
          this.getCompletedUserStats();
        },
        error: (error) => {
          // IMPORTANT: SNACKBAR SERVICE
          console.error('Error fetching user stats:', error);
        },
      })
    );
  }

  getAllUserStats() {
    this.userService
      .getUserStats(false)
      .subscribe({
        next: (userStats) => {
          this.userTotalStats = userStats as UserStatsDto;
        },
        error: (error) => {
          // IMPORTANT: SNACKBAR SERVICE
          alert('Error fetching user stats');
        },
      });
  }

  getCompletedUserStats() {
    this.userService
      .getUserStats(true)
      .subscribe({
        next: (userStats) => {
          this.userCompletedStats = userStats as UserStatsDto;
        },
        error: (error) => {
          // IMPORTANT: SNACKBAR SERVICE
          alert('Error fetching user stats');
        },
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
