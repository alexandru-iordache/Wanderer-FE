import { Uuid } from "../../../shared/helpers/uuid";
import { BaseWaypointVisitDto as BaseWaypointVisitDto } from "./base-waypoint-visit-dto";

export interface BaseDayVisitDto {
    id?: Uuid;
    date: Date;
    waypointVisits: BaseWaypointVisitDto[];
}

type DayVisitDto = Required<BaseDayVisitDto>;
type AddDayVisitDto = Omit<BaseDayVisitDto, 'id'>;
type UpdateDayVisitDto = BaseDayVisitDto;