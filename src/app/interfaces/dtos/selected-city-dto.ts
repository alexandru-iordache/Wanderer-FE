import { AddCityDto } from './add-city-dto';

export class SelectedCityDto {
  selectedCity: AddCityDto | null = null;
  bounds: google.maps.LatLngBounds | null = null;

  constructor(
    selectedCity: AddCityDto | null = null,
    bounds: google.maps.LatLngBounds | null = null
  ) {
    this.selectedCity = selectedCity;
    this.bounds = bounds;
  }
}
