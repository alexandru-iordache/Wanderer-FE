import { Uuid } from "../../../shared/helpers/uuid";
import { BaseCityVisitDto as BaseCityVisitDto } from "./base-city-visit-dto";

export interface BaseTripDto {
    id?: Uuid;
    title: string;
    startDate: Date;
    cityVisits: BaseCityVisitDto[];
    isCompleted?: boolean;
    isPublished?: boolean;
    ownerId?: string;
}

export type TripDto = Required<BaseTripDto>;
export type AddTripDto = Omit<BaseTripDto, 'id' | 'isCompleted' | 'isPublished'>;
export type UpdateTripDto = TripDto;