import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

import { environment } from '../../../environments/environment';
import { ModalView } from '../helpers/modal-view.enum';
import { CityTransferDto } from '../../interfaces/dtos/city-transfer-dto';
import { AddCityDto } from '../../interfaces/dtos/add-city-dto';
import { SelectedCityDto } from '../../interfaces/dtos/selected-city-dto';
import { AddWaypointDto } from '../../interfaces/dtos/add-waypoint-dto';
import { TripStateService } from './services/trip-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-create-trip-page',
  templateUrl: './create-trip-page.component.html',
  styleUrl: './create-trip-page.component.scss',
})
export class CreateTripPageComponent implements OnInit, OnDestroy {
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

  // Multiple Dependendants Properties
  cities: AddCityDto[] = [];
  selectedCity: SelectedCityDto | null = null;
  currentDayIndex: number = 0;
  selectedEntity: {
    type: 'city' | 'waypoint';
    data: AddCityDto | AddWaypointDto;
  } | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private changeDetector: ChangeDetectorRef,
    private tripState: TripStateService
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.tripState.getCities().subscribe((cities) => (this.cities = cities)),
      this.tripState
        .getSelectedCity()
        .subscribe((city) => {
          this.selectedCity = city;
          this.changeDetector.detectChanges();
        }),
      this.tripState
        .getCurrentDayIndex()
        .subscribe((index) => (this.currentDayIndex = index)),
    ];
  }

  onTripStarted(tripStarted: { city: CityTransferDto; startDate: Date }) {
    this.tripState.updateCityToAdd(tripStarted.city);
    this.tripState.updateStartDate(tripStarted.startDate);
  }

  onViewChanged(viewData: { view: ModalView }): void {
    if (viewData.view === ModalView.NoView) {
      this.modalClosed = true;
    }
  }

  onExitCityView() {
    this.currentDayIndex = 0;

    this.tripState.updateCurrentDayIndex(0);
    this.tripState.updateSelectedCity(null);
    this.changeDetector.detectChanges();
  }

  openDeleteModal(
    type: 'city' | 'waypoint',
    data: AddCityDto | AddWaypointDto
  ) {
    this.selectedEntity = { type, data };
  }

  confirmDelete() {
    if (this.selectedEntity?.type === 'city') {
      this.tripState.deleteCity(this.selectedEntity.data as AddCityDto);
    }

    if (this.selectedEntity?.type === 'waypoint') {
      this.tripState.deleteWaypoint(this.selectedEntity.data as AddWaypointDto);
    }

    this.changeDetector.detectChanges();
    this.closeDeleteModal();
  }

  closeDeleteModal() {
    this.selectedEntity = null;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
