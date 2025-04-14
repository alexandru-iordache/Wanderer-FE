import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
    private tripService: TripService,
    private router: Router
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
        response = await this.tripService.updateTrip(
          this.trip.id,
          this.trip as TripDto
        );

        const tripDto = response.body as TripDto;

        this.tripStateService.updateTrip(tripDto);
        this.tripStateService.updateCityVisits(
          tripDto.cityVisits as CityVisitDto[]
        );

        this.tripStateService.updateIsSaved(true);
      } else {
        response = await this.tripService.createTrip(this.trip);

        this.router.navigate(['/trip', response.body.id]);
      }
    } catch (error) {
      // IMPORTANT: Snackbar service
      console.error('Error creating trip:', error);
    }
  }
}
