import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { GoogleMapsService } from '../../services/google-maps.service';

import { environment } from '../../../environments/environment';
import { ModalView } from '../helpers/modal-view.enum';
import { CityTransferDto } from '../../interfaces/dtos/city-transfer-dto';
import { AddCityDto } from '../../interfaces/dtos/add-city-dto';
import { SelectedCityDto } from '../../interfaces/dtos/selected-city-dto';
import { LatLngBound } from '../../interfaces/dtos/lat-lang-bound';
import { PanelView } from '../helpers/panel-view.enum';
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

  // Panel Shared Properties
  cityToAdd: CityTransferDto | undefined = undefined;
  startDate: Date | null = new Date();
  panelViewToSet: PanelView | null = null;

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
    private googleMapsService: GoogleMapsService,
    private changeDetector: ChangeDetectorRef,
    private tripState: TripStateService
  ) {}
  
  ngOnInit(): void {
    this.subscriptions = [
      this.tripState.getCities().subscribe(cities => this.cities = cities),
      this.tripState.getSelectedCity().subscribe(city => this.selectedCity = city),
      this.tripState.getCurrentDayIndex().subscribe(index => this.currentDayIndex = index),
      this.tripState.getCityToAdd().subscribe(city => this.cityToAdd = city),
      this.tripState.getStartDate().subscribe(date => this.startDate = date)
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  handlePanelAction(event: { type: string; payload?: any }) {
    switch (event.type) {
      case 'citySubmitted':
        this.onCitySubmitted(event.payload);
        break;
      case 'cityEdited':
        this.onCityEdited(event.payload);
        break;
      case 'waypointSubmitted':
        this.onWaypointSubmitted(event.payload);
        break;
      case 'waypointEdited':
        this.onWaypointEdited(event.payload);
        break;
      case 'citySelected':
        this.onCitySelected(event.payload);
        break;
      case 'dayChanged':
        this.onDayChanged(event.payload.dayIndex);
        break;
      default:
        console.error('Unhandled event type:', event.type);
    }
  }

  onCityToAdd(cityToAddData: { city: CityTransferDto }): void {
    this.cityToAdd = cityToAddData.city;
    this.changeDetector.detectChanges();
  }

  onTripStarted(tripStarted: { city: CityTransferDto; startDate: Date }) {
    this.cityToAdd = tripStarted.city;
    this.startDate = tripStarted.startDate;

    this.changeDetector.detectChanges();
  }

  onCitySubmitted(city: AddCityDto): void {
    const updatedCities = [...this.cities, city];
    this.tripState.updateCities(updatedCities);
  }

  onCityEdited(cityList: AddCityDto[]): void {
    this.cities = [...cityList];

    this.changeDetector.detectChanges();
  }

  onWaypointSubmitted(waypoint: AddWaypointDto): void {
    console.log(this.cities);

    let city = this.cities.find(
      (city) => city === this.selectedCity?.selectedCity
    );

    this.setWaypointsOrder(
      waypoint,
      this.selectedCity!.selectedCity!.waypoints[this.currentDayIndex]
        .length,
      city!
    );

    city?.waypoints[this.currentDayIndex].push(waypoint);
    city?.waypoints[this.currentDayIndex].sort((a, b) => a.order - b.order);
    this.cities = [...this.cities];
    console.log(this.cities);

    this.changeDetector.detectChanges();
  }

  onWaypointEdited(waypoint: AddWaypointDto): void {
    let city = this.cities.find(
      (city) => city === this.selectedCity?.selectedCity
    );

    let waypointInList = city?.waypoints[this.currentDayIndex].find(
      (cityWaypoint) => cityWaypoint.placeId === waypoint.placeId
    );

    waypointInList!.startTime = waypoint.startTime;
    waypointInList!.endTime = waypoint.endTime;

    this.setWaypointsOrder(waypointInList!, waypointInList!.order, city!);

    city?.waypoints[this.currentDayIndex].sort((a, b) => a.order - b.order);
    this.cities = [...this.cities];
    console.log(this.cities);

    this.changeDetector.detectChanges();
  }

  onCitySelected(selectedCityDto: SelectedCityDto | null) {
    this.tripState.updateSelectedCity(selectedCityDto);
    this.panelViewToSet = null;
  }

  onDayChanged(dayIndex: number): void {
    this.tripState.updateCurrentDayIndex(dayIndex);
  }

  onViewChanged(viewData: { view: ModalView }): void {
    if (viewData.view === ModalView.NoView) {
      this.modalClosed = true;
    }
  }

  onExitCityView() {
    this.panelViewToSet = PanelView.CitiesListView;
    this.currentDayIndex = 0;
    this.selectedCity = null;

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
      this.deleteCity();
    }

    if (this.selectedEntity?.type === 'waypoint') {
      this.deleteWaypoint();
    }

    this.changeDetector.detectChanges();
    this.closeDeleteModal();
  }

  closeDeleteModal() {
    this.selectedEntity = null;
  }

  private deleteCity() {
    const cityIndex = this.cities.indexOf(
      this.selectedEntity?.data as AddCityDto
    );
    if (cityIndex > -1) {
      this.cities.splice(cityIndex, 1);
    }

    this.cities
      .sort((x) => x.order)
      .forEach((city, index) => {
        city.order = index;

        if (index == 0) {
          city.arrivalDate = this.startDate;
        } else {
          let tempDate = new Date(this.cities[index - 1].arrivalDate!);
          tempDate.setDate(
            this.cities[index - 1].arrivalDate!.getDate() +
              this.cities[index - 1].numberOfNights
          );
          city.arrivalDate = tempDate;
        }
      });
    this.cities = [...this.cities];

    console.log(
      'City: ' + this.selectedEntity?.data.name + ' deleted succesfully.'
    );
  }

  private deleteWaypoint() {
    let city = this.cities.find(
      (city) => city === this.selectedCity!.selectedCity
    );

    if (city === undefined) {
      console.error('No city found.');
      return;
    }

    const waypointIndex = city.waypoints[this.currentDayIndex].indexOf(
      this.selectedEntity?.data as AddWaypointDto
    );
    if (waypointIndex > -1) {
      city.waypoints[this.currentDayIndex].splice(waypointIndex, 1);
    }

    city.waypoints[this.currentDayIndex]
      .sort((x) => x.order)
      .forEach((waypoint, index) => {
        waypoint.order = index;
      });

    this.cities = [...this.cities];
    console.log(
      'Waypoint: ' + this.selectedEntity?.data.name + ' deleted succesfully.'
    );
  }

  private setWaypointsOrder(
    waypoint: AddWaypointDto,
    initialOrder: number,
    city: AddCityDto
  ) {
    const waypointSplitStartTime = waypoint.startTime.split(':');
    const waypointStartTime =
      parseInt(waypointSplitStartTime[0], 10) * 60 +
      parseInt(waypointSplitStartTime[1], 10);

    let currentDayWaypoints = city.waypoints[this.currentDayIndex];

    let order = initialOrder;
    let index = 0;
    let isLast = true;
    while (index < currentDayWaypoints.length) {
      const splitStartTime = currentDayWaypoints[index].startTime.split(':');
      const currentWaypointStartTime =
        parseInt(splitStartTime[0], 10) * 60 + parseInt(splitStartTime[1], 10);

      if (waypointStartTime < currentWaypointStartTime) {
        isLast = false;
        break;
      }

      const currentPlaceId = currentDayWaypoints[index].placeId;
      if (
        waypointStartTime === currentWaypointStartTime &&
        waypoint.placeId === currentPlaceId
      ) {
        break;
      }

      index++;
    }

    if (isLast === false) {
      order = currentDayWaypoints[index].order;
      for (
        let secondIndex = index;
        secondIndex < currentDayWaypoints.length;
        secondIndex++
      ) {
        currentDayWaypoints[secondIndex].order =
          currentDayWaypoints[secondIndex].order + 1;
      }
    }

    waypoint.order = order;
  }
}
