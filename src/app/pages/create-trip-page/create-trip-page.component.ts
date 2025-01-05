import { ChangeDetectorRef, Component } from '@angular/core';
import { GoogleMapsService } from '../../services/google-maps.service';

import { environment } from '../../../environments/environment';
import { ModalView } from '../helpers/modal-view.enum';
import { CityTransferDto } from '../../interfaces/dtos/city-transfer-dto';
import { AddCityDto } from '../../interfaces/dtos/add-city-dto';
import { SelectedCityDto } from '../../interfaces/dtos/selected-city-dto';
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

  cityToAdd: CityTransferDto | undefined = undefined; // to be changed
  cityList: AddCityDto[] = [
    new AddCityDto(
      'Bârlad',
      'Romania',
      46.2276613,
      27.6692265,
      new Date('2025-01-05T14:00:05.444Z'),
      3,
      new LatLngBound(46.26240424613476, 27.69721986114218),
      new LatLngBound(46.19940878412697, 27.63958457457981),
      [[], [], [], []]
    ),
  ]; // to be changed
  startDate: Date | null = new Date();
  selectedCity: SelectedCityDto | null = null;

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

  onCitySelected(citySelectedData: {
    selectedCityDto: SelectedCityDto | null;
  }) {
    this.selectedCity = citySelectedData.selectedCityDto;

    this.changeDetector.detectChanges();
  }

  onViewChanged(viewData: { view: ModalView }): void {
    if (viewData.view === ModalView.NoView) {
      this.modalClosed = true;
    }
  }
}
