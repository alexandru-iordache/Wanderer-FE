import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { TripDto } from '../../interfaces/dtos/request/base-trip-dto';
import { TripService } from '../../services/trip.service';
import { Subscription } from 'rxjs';
import { UiHelper } from '../../shared/helpers/ui-helper';
import { ModalService } from '../../services/modal.service';
import { UserStatsDto } from '../../interfaces/dtos/response/user-stats-dto';
import { UserService } from '../../services/user.service';
import { FilterOptionsDto } from '../../interfaces/dtos/filter-options-dto';

@Component({
  selector: 'app-my-trips-page',
  templateUrl: './my-trips-page.component.html',
  styleUrl: './my-trips-page.component.scss',
})
export class MyTripsPageComponent implements OnInit, OnDestroy {
  @ViewChild('minDate') minDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('maxDate') maxDateInput?: ElementRef<HTMLInputElement>;
  @ViewChildren('allStatus, completedStatus, notStatus')
  completionRadioButtons?: QueryList<ElementRef<HTMLInputElement>>;

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
  filterOptions: FilterOptionsDto = {
    minDate: undefined,
    maxDate: undefined,
    completionStatus: 'All',
  };
  areFiltersOpened: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private tripService: TripService,
    private userService: UserService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.tripService.getTrips(true, this.filterOptions).subscribe({
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

  onFiltersClicked(event: MouseEvent): void {
    event.stopPropagation();
    this.areFiltersOpened = !this.areFiltersOpened;

    setTimeout(() => {
      if (this.areFiltersOpened) {
        this.minDateInput!.nativeElement.value = this.filterOptions.minDate
          ? this.filterOptions.minDate.toISOString().split('T')[0]
          : '';
        this.maxDateInput!.nativeElement.value = this.filterOptions.maxDate
          ? this.filterOptions.maxDate.toISOString().split('T')[0]
          : '';
        const toCheckRadioButton = this.completionRadioButtons!.find(
          (radio) => radio.nativeElement.value === this.filterOptions.completionStatus
        );
        toCheckRadioButton!.nativeElement.checked = true;
      }
    });
  }

  onClearClicked(event: MouseEvent): void {
    event.stopPropagation();
    this.filterOptions = {
      minDate: undefined,
      maxDate: undefined,
      completionStatus: 'All',
    };
    this.minDateInput!.nativeElement.value = '';
    this.maxDateInput!.nativeElement.value = '';
    const allRadioButton = this.completionRadioButtons!.find(
      (radio) => radio.nativeElement.value === 'All'
    );
    allRadioButton!.nativeElement.checked = true;
  }

  onSaveClicked(event: MouseEvent): void {
    event.stopPropagation();
    this.filterOptions.minDate = this.minDateInput?.nativeElement.value
      ? new Date(this.minDateInput.nativeElement.value)
      : undefined;
    this.filterOptions.maxDate = this.maxDateInput?.nativeElement.value
      ? new Date(this.maxDateInput.nativeElement.value)
      : undefined;
    const checkedRadioButton = this.completionRadioButtons!.toArray().find((radio) => {
      console.log(radio.nativeElement.value, radio.nativeElement.checked);
      return radio.nativeElement.checked === true;
    });

    this.filterOptions.completionStatus = checkedRadioButton!.nativeElement.value;

    this.subscriptions[0]?.unsubscribe();
    this.subscriptions[0] = this.tripService
      .getTrips(true, this.filterOptions)
      .subscribe((trips) => (this.trips = trips as TripDto[]));

    this.areFiltersOpened = !this.areFiltersOpened;
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
