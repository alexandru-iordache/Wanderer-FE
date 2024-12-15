import { LatLngBound } from "./lat-lang-bound";

export class AddCityDto {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  startDate: Date | null;
  numberOfDays: number;
  northEastBound: LatLngBound;
  southWestBound: LatLngBound;

  constructor(
    name: string,
    country: string,
    latitude: number,
    longitude: number,
    startDate: Date | null,
    numberOfDays: number,
    northEastBound: LatLngBound,
    southWestBound: LatLngBound
  ) {
    this.name = name;
    this.country = country;
    this.latitude = latitude;
    this.longitude = longitude;
    this.startDate = startDate;
    this.numberOfDays = numberOfDays;
    this.northEastBound = northEastBound;
    this.southWestBound = southWestBound;
  }
}
