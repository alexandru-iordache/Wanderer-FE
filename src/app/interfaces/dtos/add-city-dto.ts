export class AddCityDto {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
    startDate: Date | null;
    endDate: Date | null;

    constructor(
        name: string,
        country: string,
        latitude: number,
        longitude: number,
        startDate: Date | null = null,
        endDate: Date | null = null) {
            this.name = name;
            this.country = country;
            this.latitude = latitude;
            this.longitude = longitude;
            this.startDate = startDate;
            this.endDate = endDate;
    }
}