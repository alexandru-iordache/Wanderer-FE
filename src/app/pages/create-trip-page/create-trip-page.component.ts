import { ChangeDetectorRef, Component } from '@angular/core';
import { GoogleMapsService } from '../../services/google-maps.service';

import { environment } from '../../../environments/environment';
import { ModalView } from '../helpers/modal-view.enum';
import { CityTransferDto } from '../../interfaces/dtos/city-transfer-dto';
import { AddCityDto } from '../../interfaces/dtos/add-city-dto';

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
    mapTypeControl: false
  };

  cityToAdd: CityTransferDto | undefined = undefined;
  cityList: AddCityDto[] = [];
  startDate: Date | null = new Date();
  selectedCityBounds: google.maps.LatLngBounds | null = null;

  modalClosed: boolean = true;

  constructor(
    private googleMapsService: GoogleMapsService,
    private changeDetector: ChangeDetectorRef
  ) {}

  onCityToAdd(cityToAddData: { city: CityTransferDto }): void {
    this.cityToAdd = cityToAddData.city;
    this.changeDetector.detectChanges();
  }

  onTripStarted(tripStarted: { city: CityTransferDto; startDate: Date }) {
    this.cityToAdd = tripStarted.city;
    this.startDate = tripStarted.startDate;

    this.changeDetector.detectChanges();
  }

  onCitySubmitted(citySubmittedData: { city: AddCityDto }): void {
    this.cityList = [...this.cityList, citySubmittedData.city];

    console.log(this.cityList);
    this.changeDetector.detectChanges();
  }

  onCitySelected(citySelectedData: { bounds: google.maps.LatLngBounds | null }) {
    this.selectedCityBounds = citySelectedData.bounds;

    console.log("here1");

    this.changeDetector.detectChanges();
  }

  onViewChanged(viewData: { view: ModalView }): void {
    if (viewData.view === ModalView.NoView) {
      this.modalClosed = true;
    }
  }
}
