import { ChangeDetectorRef, Component } from '@angular/core';
import { GoogleMapsService } from '../../services/google-maps.service';

import { environment } from '../../../environments/environment';
import { ModalView } from '../helpers/modal-view.enum';
import { CityTransferDto } from '../../interfaces/dtos/city-transfer-dto';
import { AddCityDto } from '../../interfaces/dtos/add-city-dto';
import { SelectedCityDto } from '../../interfaces/dtos/selected-city-dto';
import { LatLngBound } from '../../interfaces/dtos/lat-lang-bound';
import { PanelView } from '../helpers/panel-view.enum';
import { AddWaypointDto } from '../../interfaces/dtos/add-waypoint-dto';

@Component({
  selector: 'app-create-trip-page',
  templateUrl: './create-trip-page.component.html',
  styleUrl: './create-trip-page.component.scss',
})
export class CreateTripPageComponent {
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
  currentDayIndex: number = 0;

  // Panel Shared Properties
  cityToAdd: CityTransferDto | undefined = undefined;
  startDate: Date | null = new Date();
  panelViewToSet: PanelView | null = null;

  //Modal Shared Properties
  modalClosed: boolean = true;

  // Multiple Dependendants Properties
  cityList: AddCityDto[] = [
    // new AddCityDto(
    //   'Bârlad',
    //   'Romania',
    //   46.2276613,
    //   27.6692265,
    //   new Date('2025-01-05T14:00:05.444Z'),
    //   3,
    //   new LatLngBound(46.26240424613476, 27.69721986114218),
    //   new LatLngBound(46.19940878412697, 27.63958457457981),
    //   0,
    //   [[], [], [], []]
    // ),
  ]; // to be changed
  selectedCityDto: SelectedCityDto | null = null;
  selectedEntity: {
    type: 'city' | 'waypoint';
    data: AddCityDto | AddWaypointDto;
  } | null = null;

  constructor(
    private googleMapsService: GoogleMapsService,
    private changeDetector: ChangeDetectorRef
  ) {}

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
    this.cityList = [...this.cityList, city];

    console.log(this.cityList);
    this.changeDetector.detectChanges();
  }

  onCityEdited(cityList: AddCityDto[]): void {
    this.cityList = [...cityList];

    this.changeDetector.detectChanges();
  }

  onWaypointSubmitted(waypoint: AddWaypointDto): void {
    console.log(this.cityList);

    let city = this.cityList.find(
      (city) => city === this.selectedCityDto?.selectedCity
    );

    city?.waypoints[this.currentDayIndex].push(waypoint);
    this.cityList = [...this.cityList];
    console.log(this.cityList);

    this.changeDetector.detectChanges();
  }

  onWaypointEdited(waypoint: AddWaypointDto): void {
    let city = this.cityList.find(
      (city) => city === this.selectedCityDto?.selectedCity
    );

    let waypointInList = city?.waypoints[this.currentDayIndex].find(
      (cityWaypoint) => cityWaypoint.placeId === waypoint.placeId
    );

    waypointInList!.startTime = waypoint.startTime;
    waypointInList!.endTime = waypoint.endTime;

    this.cityList = [...this.cityList];
    console.log(this.cityList);

    this.changeDetector.detectChanges();
  }

  onCitySelected(selectedCityDto: SelectedCityDto | null) {
    this.panelViewToSet = null;
    this.selectedCityDto = selectedCityDto;

    this.changeDetector.detectChanges();
  }

  onDayChanged(dayIndex: number): void {
    this.currentDayIndex = dayIndex;

    this.changeDetector.detectChanges();
  }

  onViewChanged(viewData: { view: ModalView }): void {
    if (viewData.view === ModalView.NoView) {
      this.modalClosed = true;
    }
  }

  onExitCityView() {
    this.panelViewToSet = PanelView.CitiesListView;
    this.currentDayIndex = 0;
    this.selectedCityDto = null;

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
      this.cityList = this.cityList.filter(
        (city) => city !== this.selectedEntity?.data
      );

      this.changeDetector.detectChanges();
    }

    if (this.selectedEntity?.type === 'waypoint') {
      let city = this.cityList.find(
        (city) => city === this.selectedCityDto!.selectedCity
      );

      const waypointIndex = city!.waypoints[this.currentDayIndex].indexOf(
        this.selectedEntity?.data as AddWaypointDto
      );
      if (waypointIndex > -1) {
        city!.waypoints[this.currentDayIndex].splice(waypointIndex, 1);
      }

      this.cityList = [...this.cityList];
      console.log(this.cityList);

      this.changeDetector.detectChanges();
    }
    this.closeDeleteModal();
  }

  closeDeleteModal() {
    this.selectedEntity = null;
  }
}
