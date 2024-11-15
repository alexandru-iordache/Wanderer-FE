export class AddCityDto {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
    startDate: Date;
    endDate: Date;

    constructor(
        name: string,
        country: string,
        latitude: number,
        longitude: number,
        startDate: Date,
        endDate: Date) {
            this.name = name;
            this.country = country;
            this.latitude = latitude;
            this.longitude = longitude;
            this.startDate = startDate;
            this.endDate = endDate;
    }
}