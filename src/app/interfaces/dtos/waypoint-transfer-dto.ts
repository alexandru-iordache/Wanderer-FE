export class WaypointTransferDto {
  name: string;
  type: string;
  placeId: string;
  latitude: number;
  longitude: number;

  constructor(
    name: string,
    type: string,
    placeId: string,
    latitude: number,
    longitude: number,
  ) {
    this.name = name;
    this.type = type;
    this.placeId = placeId;
    this.latitude = latitude;
    this.longitude = longitude;
  }
}