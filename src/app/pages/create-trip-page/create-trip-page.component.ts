import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';

import { environment } from '../../../environments/environment';
import { ModalView } from '../helpers/modal-view.enum';
import { CityTransferDto } from '../../interfaces/dtos/city-transfer-dto';
import { SelectedCityVisitDto } from '../../interfaces/dtos/selected-city-dto';
import { TripStateService } from './services/trip-state.service';
import { firstValueFrom, Subscription } from 'rxjs';
import { Uuid } from '../../shared/helpers/uuid';
import { TripService } from '../../services/trip.service';
import { BaseCityVisitDto } from '../../interfaces/dtos/request/base-city-visit-dto';
import { BaseWaypointVisitDto } from '../../interfaces/dtos/request/base-waypoint-visit-dto';

@Component({
  selector: 'app-create-trip-page',
  templateUrl: './create-trip-page.component.html',
  styleUrl: './create-trip-page.component.scss',
})
export class CreateTripPageComponent implements OnInit, OnDestroy {
  @Input() tripId: Uuid | null = null;

  // Map Shared Properties
  mapOptions: google.maps.MapOptions = {
    mapId: environment.googleMapId,
    center: { lat: 20, lng: 20 },
    zoom: 3,
    minZoom: 3,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: true,
    mapTypeControl: false,
    restriction: null,
  };

  //Modal Shared Properties
  modalClosed: boolean = true;
  isEditMode: boolean = false;

  // Multiple Dependendants Properties
  cities: BaseCityVisitDto[] = [];
  selectedCity: SelectedCityVisitDto | null = null;
  currentDayIndex: number = 0;
  selectedEntity: {
    type: 'city' | 'waypoint';
    data: BaseCityVisitDto | BaseWaypointVisitDto;
  } | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private changeDetector: ChangeDetectorRef,
    private tripStateService: TripStateService,
    private tripService: TripService
  ) {}

  ngOnInit(): void {
    if (this.tripId) {
      this.isEditMode = true;
      this.modalClosed = true;
      this.loadExistingTrip();
    }

    this.subscriptions = [
      this.tripStateService
        .getCityVisits()
        .subscribe((cities) => (this.cities = cities)),
      this.tripStateService.getSelectedCityVisit().subscribe((city) => {
        this.selectedCity = city;
        this.changeDetector.detectChanges();
      }),
      this.tripStateService
        .getCurrentDayIndex()
        .subscribe((index) => (this.currentDayIndex = index)),
    ];
  }

  onTripStarted(tripStarted: { city: CityTransferDto; startDate: Date }) {
    this.tripStateService.updateCityToAdd(tripStarted.city);
    this.tripStateService.updateStartDate(tripStarted.startDate);
  }

  onViewChanged(viewData: { view: ModalView }): void {
    if (viewData.view === ModalView.NoView) {
      this.modalClosed = true;
    }
  }

  onExitCityView() {
    this.currentDayIndex = 0;

    this.tripStateService.updateCurrentDayIndex(0);
    this.tripStateService.updateSelectedCity(null);
    this.changeDetector.detectChanges();
  }

  openDeleteModal(
    type: 'city' | 'waypoint',
    data: BaseCityVisitDto | BaseWaypointVisitDto
  ) {
    this.selectedEntity = { type, data };
  }

  confirmDelete() {
    if (this.selectedEntity?.type === 'city') {
      this.tripStateService.deleteCity(this.selectedEntity.data as BaseCityVisitDto);
    }

    if (this.selectedEntity?.type === 'waypoint') {
      this.tripStateService.deleteWaypoint(
        this.selectedEntity.data as BaseWaypointVisitDto
      );
    }

    this.changeDetector.detectChanges();
    this.closeDeleteModal();
  }

  closeDeleteModal() {
    this.selectedEntity = null;
  }

  private async loadExistingTrip() {
    try {
      const trip = await firstValueFrom(
        this.tripService.getTripById(this.tripId!)
      );

      this.tripStateService.updateCityVisits(trip.cityVisits);
      this.tripStateService.updateStartDate(trip.startDate);
    } catch (error) {
      console.error('[Create-Trip-Page] Error loading existing trip.', error);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
