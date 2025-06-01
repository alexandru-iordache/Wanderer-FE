import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { environment } from '../../../environments/environment';
import { ModalView } from '../helpers/modal-view.enum';
import { SelectedCityVisitDto } from '../../interfaces/dtos/selected-city-dto';
import { TripStateService } from './services/trip-state.service';
import { Subscription } from 'rxjs';
import { Uuid } from '../../shared/helpers/uuid';
import { TripService } from '../../services/trip.service';
import { BaseCityVisitDto } from '../../interfaces/dtos/base-dtos/base-city-visit-dto';
import { BaseWaypointVisitDto } from '../../interfaces/dtos/base-dtos/base-waypoint-visit-dto';
import { TripDto } from '../../interfaces/dtos/base-dtos/base-trip-dto';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-trip-page',
  templateUrl: './trip-page.component.html',
  styleUrl: './trip-page.component.scss',
})
export class TripPageComponent implements OnInit, OnDestroy {
  tripId: Uuid | null = null;

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
    keyboardShortcuts: false,
  };

  //Modal Shared Properties
  modalClosed: boolean = false;
  isEditMode: boolean = false;
  // Multiple Dependendants Properties
  cities: BaseCityVisitDto[] = [];
  selectedCity: SelectedCityVisitDto | null = null;
  currentDayIndex: number = 0;
  selectedEntity: {
    type: 'city' | 'waypoint';
    data: BaseCityVisitDto | BaseWaypointVisitDto;
  } | null = null;
  isSaved: boolean = false;
  isCompleted: boolean = false;
  isCurrentUserOwner: boolean = true;

  private subscriptions: Subscription[] = [];

  constructor(
    private changeDetector: ChangeDetectorRef,
    private tripStateService: TripStateService,
    private tripService: TripService,
    private route: ActivatedRoute,
    private modalService: ModalService
  ) {}

  async ngOnInit(): Promise<void> {
    this.subscriptions.push(
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id');

        this.tripId = id ? (id as Uuid) : null;
      })
    );

    if (this.tripId) {
      await this.loadExistingTrip();
      this.isEditMode = true;
      this.modalClosed = true;
      this.tripStateService.updateIsSaved(true);
    }

    this.subscriptions.push(
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
      this.tripStateService
        .getIsSaved()
        .subscribe((isSaved) => (this.isSaved = isSaved))
    );
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
      this.tripStateService.deleteCity(
        this.selectedEntity.data as BaseCityVisitDto
      );
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
      const response = await this.tripService.getTripByIdAsync(this.tripId!);
      if (response.statusCode !== 200) {
        this.modalService.snackbar(
        'Error loading existing trip.', 100000, false);
        return;
      }

      const trip = response.body as TripDto;

      // Set trip completion status
      this.isCompleted = trip.isCompleted || false;
      
      // Check if current user is the owner
      const currentUserId = localStorage.getItem("userId");
      this.isCurrentUserOwner = trip.ownerId === currentUserId;

      this.tripStateService.updateTrip(trip);
      this.tripStateService.updateCityVisits(trip.cityVisits);
      this.tripStateService.updateStartDate(trip.startDate);
    } catch (error) {
      this.modalService.snackbar(
        'Error loading existing trip.', 100000, false);
      console.error('[Create-Trip-Page] Error loading existing trip.', error);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.tripStateService.resetTripState();
  }
}
