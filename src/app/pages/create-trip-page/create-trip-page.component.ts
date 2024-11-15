import { ChangeDetectorRef, Component } from '@angular/core';
import { GoogleMapsService } from '../../services/google-maps.service';

import { environment } from '../../../environments/environment';
import { ModalView } from '../helpers/modal-view.enum';
import { CityTransferDto } from '../../interfaces/dtos/city-transfer-dto';

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
  onCityAddedFromMap: CityTransferDto | undefined = undefined;

  cityList: CityTransferDto[] = [new CityTransferDto('Barcelona', 'Spain', 40, 50)];

  constructor(private googleMapsService: GoogleMapsService,
    private changeDetector: ChangeDetectorRef
  ) { }

  onCityAdded(cityData: { city: CityTransferDto }): void {
    this.cityList.push(cityData.city);
    this.onCityAddedFromMap = cityData.city;
    this.changeDetector.detectChanges();
  }

  onViewChanged(viewData: { view: ModalView }): void {
    if (viewData.view === ModalView.NoView) {
      this.modalClosed = true;
    }
  }
}
