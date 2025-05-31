import {
  Component,
  ElementRef,
  Input,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { TripDto } from '../../../interfaces/dtos/base-dtos/base-trip-dto';
import { UiHelper } from '../../helpers/ui-helper';
import { TripService } from '../../../services/trip.service';
import { ModalService } from '../../../services/modal.service';
import { UserService } from '../../../services/user.service';
import { FilterOptionsDto } from '../../../interfaces/dtos/filter-options-dto';
import { Subscription } from 'rxjs';
import { Uuid } from '../../helpers/uuid';

@Component({
  selector: 'app-trip-panel',
  templateUrl: './trip-panel.component.html',
  styleUrl: './trip-panel.component.scss',
})
export class TripPanelComponent implements OnInit {
  @Input() areCurrentUserTrips: boolean = false;
  @Input() userId: Uuid = '';

  @ViewChild('minDate') minDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('maxDate') maxDateInput?: ElementRef<HTMLInputElement>;
  @ViewChildren('allStatus, completedStatus, notStatus')
  completionRadioButtons?: QueryList<ElementRef<HTMLInputElement>>;

  areFiltersOpened: boolean = false;
  trips: TripDto[] = [];
  filterOptions: FilterOptionsDto = {
    minDate: undefined,
    maxDate: undefined,
    completionStatus: 'All',
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private modalService: ModalService,
    private tripService: TripService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    if (!this.areCurrentUserTrips) {
      this.filterOptions.isPublished = true;
    }

    this.subscriptions.push(
      this.userService
        .getUserTrips(this.userId, true, this.filterOptions)
        .subscribe({
          next: (trips) => {
            this.trips = trips as TripDto[];
          },
          error: (error) => {
            this.modalService.snackbar('Error fetching trips.', 10000, false);
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
          (radio) =>
            radio.nativeElement.value === this.filterOptions.completionStatus
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
      isPublished: !this.areCurrentUserTrips,
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
    const checkedRadioButton = this.completionRadioButtons!.toArray().find(
      (radio) => {
        console.log(radio.nativeElement.value, radio.nativeElement.checked);
        return radio.nativeElement.checked === true;
      }
    );

    this.filterOptions.completionStatus =
      checkedRadioButton!.nativeElement.value;

    this.filterOptions.isPublished = !this.areCurrentUserTrips;

    this.subscriptions[0]?.unsubscribe();
    this.subscriptions[0] = this.tripService
      .getTrips(true, this.filterOptions)
      .subscribe((trips) => (this.trips = trips as TripDto[]));

    this.areFiltersOpened = !this.areFiltersOpened;
  }

  async completeTrip(event: MouseEvent, tripName: string, tripId: string) {
    event.stopPropagation();
    const completeConfirmed = await this.modalService.confirmCompleteTrip(
      'trip',
      tripName
    );
    if (!completeConfirmed) {
      return;
    }

    let tripToChangeStatus = this.trips.find((trip) => trip.id === tripId)!;

    this.tripService.completeTrip(tripId).subscribe({
      next: (response) => {
        tripToChangeStatus.isCompleted = true;
        this.userService.updateUserStatsChanged();
        this.modalService.snackbar('Trip completed successfully.', 5000, true);
      },
      error: (error) => {
        console.error('Error completing trip:', error);
        this.modalService.snackbar('Error completing trip.', 10000, false);
      },
    });
  }

  async publishTrip(event: MouseEvent, tripName: string, tripId: string) {
    event.stopPropagation();

    const publishConfirmed = await this.modalService.confirmPublishTrip(
      tripName
    );
    if (!publishConfirmed) {
      return;
    }

    let tripToPublish = this.trips.find((trip) => trip.id === tripId)!;

    const createPostConfirmed = await this.modalService.confirmCreatePost(
      tripName
    );
    if (!createPostConfirmed) {
      this.tripService.publishTrip(tripId).subscribe({
        next: (response) => {
          tripToPublish.isPublished = true;
          this.userService.updateUserStatsChanged();
        },
        error: (error) => {
          console.error('Error publishing trip:', error);
          this.modalService.snackbar('Error publishing trip.', 10000, false);
        },
      });
    }

    const createPostModalResponse = await this.modalService.createPost(
      tripToPublish.id
    );
    if (createPostModalResponse) {
      this.modalService.snackbar('Post created successfully.', 5000, true);
    } else {
      this.modalService.snackbar('Error creating post.', 10000, false);
    }
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
      this.modalService.snackbar('Trip deleted succesfully.', 5000, true);
    } else {
      console.error('Error deleting trip:', response);
      this.modalService.snackbar('Error publishing trip.', 10000, false);
    }
  }
}
