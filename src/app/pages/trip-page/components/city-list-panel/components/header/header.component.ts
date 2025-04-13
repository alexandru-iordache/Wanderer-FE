import { Component, OnDestroy, OnInit } from '@angular/core';
import { TripStateService } from '../../../../services/trip-state.service';
import { Subscription } from 'rxjs';
import {
  BaseTripDto,
  TripDto,
} from '../../../../../../interfaces/dtos/request/base-trip-dto';
import { TripService } from '../../../../../../services/trip.service';
import {
  BaseCityVisitDto,
  CityVisitDto,
} from '../../../../../../interfaces/dtos/request/base-city-visit-dto';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  trip!: BaseTripDto;

  private subscriptions: Subscription[] = [];

  constructor(
    private tripStateService: TripStateService,
    private tripService: TripService
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

    if (this.trip.id !== undefined) {
      this.tripService
        .updateTrip(this.trip.id, this.trip as TripDto)
        .subscribe(() => {
          console.log('Trip updated successfully!');
        });
    } else {
      try {
        var response = await this.tripService.createTrip(this.trip);

        this.tripStateService.updateTrip(response.body as TripDto);
        this.tripStateService.updateCityVisits(
          response.body.cityVisits as CityVisitDto[]
        );
        this.tripStateService.updateIsSaved(true);
      } catch (error) {
        console.error('Error creating trip:', error);
      }
    }
  }
}
