import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TripStateService } from '../../../../services/trip-state.service';
import { Subscription } from 'rxjs';
import {
  BaseTripDto,
  TripDto,
} from '../../../../../../interfaces/dtos/base-dtos/base-trip-dto';
import { TripService } from '../../../../../../services/trip.service';
import {
  BaseCityVisitDto,
  CityVisitDto,
} from '../../../../../../interfaces/dtos/base-dtos/base-city-visit-dto';
import { ModalService } from '../../../../../../services/modal.service';
import { Uuid } from '../../../../../../shared/helpers/uuid';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  trip!: BaseTripDto;
  @Input() isCompleted: boolean = false;
  @Input() isCurrentUserOwner: boolean = true;

  private subscriptions: Subscription[] = [];

  constructor(
    private tripStateService: TripStateService,
    private tripService: TripService,
    private router: Router,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.tripStateService.getTrip().subscribe((trip) => {
        this.trip = trip as BaseTripDto;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  async onSaveClick() {
    // IMPORTANT: Snackbar service

    this.tripStateService.getCityVisits().subscribe((cityVisits) => {
      this.trip.cityVisits = cityVisits as BaseCityVisitDto[];
    });

    try {
      let response;
      if (this.trip.id !== undefined) {
        this.tripService
          .updateTrip(this.trip.id, this.trip as TripDto)
          .subscribe({
            next: (response) => {
              var updatedTrip = response as TripDto;
              this.tripStateService.updateTrip(updatedTrip);
              this.tripStateService.updateCityVisits(
                updatedTrip.cityVisits as CityVisitDto[]
              );
              this.tripStateService.updateIsSaved(true);
              this.modalService.snackbar("Trip updated succesfully", 5000);
            },
            error: (error) => {
              this.modalService.snackbar("Error updating trip", 5000);
            },
          });
      } else {
        response = await this.tripService.createTrip(this.trip);

        this.router.navigate(['/trip', response.body.id]);
      }
    } catch (error) {
      // IMPORTANT: Snackbar service
      console.error('Error creating trip:', error);
    }
  }

    cloneTrip() {
      this.tripService.cloneTrip(this.trip.id!).subscribe({
        next: (trip) => {
          this.modalService.snackbar(
            'Trip cloned successfully!',
            5000,
            true
          );
        },
        error: (error) => {
          this.modalService.snackbar(
            'Error cloning trip. Please try again later.',
            10000,
            false
          );
          console.error('Error cloning trip:', error);
        },
      });
    }
}
