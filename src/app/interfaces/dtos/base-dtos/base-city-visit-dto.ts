import { Uuid } from "../../../shared/helpers/uuid";
import { LatLngBound } from "../lat-lang-bound";
import { BaseDayVisitDto as BaseDayVisitDto } from "./base-day-visit-dto";

export interface BaseCityVisitDto {
    id?: Uuid;
    startDate: Date;
    numberOfNights: number;
    placeId: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    northEastBound: LatLngBound;
    southWestBound: LatLngBound;
    order: number;
    dayVisits: BaseDayVisitDto[];
}

export type CityVisitDto = Required<BaseCityVisitDto>;
export type AddCityVisitDto = Omit<BaseCityVisitDto, 'id'>;
export type UpdateCityVisitDto = BaseCityVisitDto;