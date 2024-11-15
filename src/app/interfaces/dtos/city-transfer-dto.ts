export class CityTransferDto {
    name: string;
    country: string;
    latitude: number;
    longitude: number;

    constructor(
        name: string,
        country: string,
        latitude: number,
        longitude: number) {
            this.name = name;
            this.country = country;
            this.latitude = latitude;
            this.longitude = longitude;
    }
}