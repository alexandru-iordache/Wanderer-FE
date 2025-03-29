import { AddCityVisitDto, BaseCityVisitDto } from './request/base-city-visit-dto';

export class SelectedCityVisitDto {
  cityVisit: BaseCityVisitDto | null = null;
  bounds: google.maps.LatLngBounds | null = null;

  constructor(
    selectedCityVisit: BaseCityVisitDto | null = null,
    bounds: google.maps.LatLngBounds | null = null
  ) {
    this.cityVisit = selectedCityVisit;
    this.bounds = bounds;
  }
}
