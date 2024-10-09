import { Component } from '@angular/core';
import { GoogleMapsService } from '../../services/google-maps.service';

import { environment } from '../../../environments/environment';
import { City } from '../../interfaces/city';
import { ModalView } from '../helpers/modal-view.enum';

@Component({
  selector: 'app-create-trip-page',
  templateUrl: './create-trip-page.component.html',
  styleUrl: './create-trip-page.component.scss'
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
  }
  modalClosed: boolean = false;

  cityList: City[] = [];

  constructor(private googleMapsService: GoogleMapsService) {
  }

  onCityAdded(cityData: { city: City }): void {
    this.cityList.push(cityData.city);
    console.log('Added to list:', cityData.city.name + ", " + cityData.city.country + 
                ", " + cityData.city.latitude + ", " + cityData.city.longitude);
  }

  onViewChanged(viewData: { view: ModalView }): void {
    if (viewData.view === ModalView.NoView) {
      this.modalClosed = true;
    }
  }
}
