import { ChangeDetectorRef, Component } from '@angular/core';
import { GoogleMapsService } from '../../services/google-maps.service';

import { environment } from '../../../environments/environment';
import { ModalView } from '../helpers/modal-view.enum';
import { CityTransferDto } from '../../interfaces/dtos/city-transfer-dto';
import { AddCityDto } from '../../interfaces/dtos/add-city-dto';
import { LatLngBound } from '../../interfaces/dtos/lat-lang-bound';

@Component({
  selector: 'app-create-trip-page',
  templateUrl: './create-trip-page.component.html',
  styleUrl: './create-trip-page.component.scss',
})
export class CreateTripPageComponent {
  mapOptions: google.maps.MapOptions = {
    mapId: environment.googleMapId,
    center: { lat: 20, lng: 20 },
    zoom: 3,
    minZoom: 3,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: true,
    mapTypeControl: false,
  };
  markers: google.maps.marker.AdvancedMarkerElement[] = [];

  cityToAdd: CityTransferDto | undefined = undefined;
  cityList: AddCityDto[] = [
    new AddCityDto(
      'Barcelona',
      'Spain',
      41.3873974,
      2.168568,
      new Date(),
      1,
      new LatLngBound(41.4682974272428, 2.22804492421789),
      new LatLngBound(41.31703848925413, 2.052333262952554)
    ),
  ];

  modalClosed: boolean = true;

  constructor(
    private googleMapsService: GoogleMapsService,
    private changeDetector: ChangeDetectorRef
  ) {}

  onCityToAdd(cityToAddData: { city: CityTransferDto }): void {
    this.cityToAdd = cityToAddData.city;
    this.changeDetector.detectChanges();
  }

  onCitySubmitted(citySubmittedData: { city: AddCityDto }): void {
    this.cityList = [...this.cityList, citySubmittedData.city];

    console.log(this.cityList);
    this.changeDetector.detectChanges();
  }

  onViewChanged(viewData: { view: ModalView }): void {
    if (viewData.view === ModalView.NoView) {
      this.modalClosed = true;
    }
  }
}
