import { LatLngBound } from "./lat-lang-bound";

export class CityTransferDto {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  northEastBound: LatLngBound;
  southWestBound: LatLngBound;

  constructor(
    name: string,
    country: string,
    latitude: number,
    longitude: number,
    northEastBound: LatLngBound,
    southWestBound: LatLngBound
  ) {
    this.name = name;
    this.country = country;
    this.latitude = latitude;
    this.longitude = longitude;
    this.northEastBound = northEastBound;
    this.southWestBound = southWestBound;
  }
}
