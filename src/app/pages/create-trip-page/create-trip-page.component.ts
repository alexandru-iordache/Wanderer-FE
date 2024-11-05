import { ChangeDetectorRef, Component } from '@angular/core';
import { GoogleMapsService } from '../../services/google-maps.service';

import { environment } from '../../../environments/environment';
import { City } from '../../interfaces/city';
import { ModalView } from '../helpers/modal-view.enum';

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
  modalClosed: boolean = true;
  onCityAddedFromMap: City | undefined = undefined;

  cityList: City[] = [new City('Barcelona', 'Spain', 40, 50)];

  constructor(private googleMapsService: GoogleMapsService) {}

  onCityAdded(cityData: { city: City }): void {
    this.cityList.push(cityData.city);
    console.log("haha");
    this.onCityAddedFromMap = cityData.city;
  }

  onViewChanged(viewData: { view: ModalView }): void {
    if (viewData.view === ModalView.NoView) {
      this.modalClosed = true;
    }
  }
}
