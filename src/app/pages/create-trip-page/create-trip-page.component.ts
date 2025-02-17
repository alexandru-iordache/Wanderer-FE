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

    this.setWaypointsOrder(
      waypoint,
      this.selectedCityDto!.selectedCity!.waypoints[this.currentDayIndex]
        .length,
      city!
    );

    city?.waypoints[this.currentDayIndex].push(waypoint);
    city?.waypoints[this.currentDayIndex].sort((a, b) => a.order - b.order);
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

    this.setWaypointsOrder(waypointInList!, waypointInList!.order, city!);

    city?.waypoints[this.currentDayIndex].sort((a, b) => a.order - b.order);
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
    const cityIndex = this.cityList.indexOf(
      this.selectedEntity?.data as AddCityDto
    );
    if (cityIndex > -1) {
      this.cityList.splice(cityIndex, 1);
    }

    this.cityList
      .sort((x) => x.order)
      .forEach((city, index) => {
        city.order = index;

        if (index == 0) {
          city.arrivalDate = this.startDate;
        } else {
          let tempDate = new Date(this.cityList[index - 1].arrivalDate!);
          tempDate.setDate(
            this.cityList[index - 1].arrivalDate!.getDate() +
              this.cityList[index - 1].numberOfNights
          );
          city.arrivalDate = tempDate;
        }
      });
    this.cityList = [...this.cityList];

    console.log(
      'City: ' + this.selectedEntity?.data.name + ' deleted succesfully.'
    );
  }

  private deleteWaypoint() {
    let city = this.cityList.find(
      (city) => city === this.selectedCityDto!.selectedCity
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

    this.cityList = [...this.cityList];
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
