import { Component, OnDestroy, OnInit } from '@angular/core';
import { TripDto } from '../../interfaces/dtos/request/base-trip-dto';
import { TripService } from '../../services/trip.service';
import { Subscription } from 'rxjs';
import { UiHelper } from '../../shared/helpers/ui-helper';
import { ModalService } from '../../services/modal.service';
import { UserStatsDto } from '../../interfaces/dtos/response/user-stats-dto';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-my-trips-page',
  templateUrl: './my-trips-page.component.html',
  styleUrl: './my-trips-page.component.scss',
})
export class MyTripsPageComponent implements OnInit, OnDestroy {
  trips: TripDto[] = [];
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

  private subscriptions: Subscription[] = [];

  constructor(
    private tripService: TripService,
    private userService: UserService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.tripService.getTrips(true).subscribe({
        next: (trips) => {
          this.trips = trips as TripDto[];
        },
        error: (error) => {
          // IMPORTANT: SNACKBAR SERVICE
          console.error('Error fetching trips:', error);
        },
      }),
      this.userService.getUserStats(false).subscribe({
        next: (userStats) => {
          this.userTotalStats = userStats as UserStatsDto;
        },
        error: (error) => {
          // IMPORTANT: SNACKBAR SERVICE
          console.error('Error fetching user stats:', error);
        },
      }),
      this.userService.getUserStats(true).subscribe({
        next: (userStats) => {
          this.userCompletedStats = userStats as UserStatsDto;
        },
        error: (error) => {
          // IMPORTANT: SNACKBAR SERVICE
          console.error('Error fetching user stats:', error);
        },
      })

    );
  }

  getFormattedDate(date: Date): string {
    var date = UiHelper.getSummedDate(date, 0);

    return UiHelper.getShortMonthDate(date);
  }

  async deleteTrip(
    event: MouseEvent,
    tripName: string,
    tripId: string
  ): Promise<void> {
    event.stopPropagation();
    const deleteConfirmed = await this.modalService.confirmDelete(
      'trip',
      tripName
    );
    if (!deleteConfirmed) {
      return;
    }

    var response = this.tripService.deleteTrip(tripId);
    if ((await response).statusCode === 204) {
      this.trips = this.trips.filter((trip) => trip.id !== tripId);
    } else {
      // IMPORTANT: SNACKBAR SERVICE
      console.error('Error deleting trip:', response);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
