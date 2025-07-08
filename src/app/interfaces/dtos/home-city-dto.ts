import { LatLngBound } from "./lat-lang-bound";

export interface HomeCityDto {
    placeId: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    northEastBound: LatLngBound;
    southWestBound: LatLngBound;
}