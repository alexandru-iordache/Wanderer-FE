import { AddWaypointDto } from './add-waypoint-dto';
import { LatLngBound } from './lat-lang-bound';

export class AddCityDto {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  arrivalDate: Date | null;
  numberOfNights: number;
  northEastBound: LatLngBound;
  southWestBound: LatLngBound;
  order: number;
  waypoints: AddWaypointDto[][] = [];

  constructor(
    name: string,
    country: string,
    latitude: number,
    longitude: number,
    arrivalDate: Date | null,
    numberOfNights: number,
    northEastBound: LatLngBound,
    southWestBound: LatLngBound,
    order: number,
    waypoints: AddWaypointDto[][]
  ) {
    this.name = name;
    this.country = country;
    this.latitude = latitude;
    this.longitude = longitude;
    this.arrivalDate = arrivalDate;
    this.numberOfNights = numberOfNights;
    this.northEastBound = northEastBound;
    this.southWestBound = southWestBound;
    this.order = order;
    this.waypoints = waypoints;
  }

  setNumberOfNights(numberOfNights: number) {
    this.numberOfNights = numberOfNights;
    this.waypoints = new Array(this.numberOfNights + 1)
      .fill(undefined)
      .map(() => []);
  }
}
