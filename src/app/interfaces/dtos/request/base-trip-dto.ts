import { Uuid } from "../../../shared/helpers/uuid";
import { BaseCityVisitDto as BaseCityVisitDto } from "./base-city-visit-dto";

export interface BaseTripDto {
    id?: Uuid;
    title: string;
    startDate: Date;
    cityVisits: BaseCityVisitDto[];
}

export type TripDto = Required<BaseTripDto>;
export type AddTripDto = Omit<BaseTripDto, 'id'>;
export type UpdateTripDto = TripDto;