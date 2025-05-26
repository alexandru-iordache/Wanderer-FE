import { Uuid } from "../../../shared/helpers/uuid";

export interface BaseWaypointVisitDto {
    id?: Uuid;
    startTime: string;
    endTime: string;
    placeId: string;
    name: string;
    type: string;
    latitude: number;
    longitude: number;
}

export type WaypointVisitDto = Required<BaseWaypointVisitDto>;
export type AddWaypointVisitDto = Omit<BaseWaypointVisitDto, 'id'>;
export type UpdateWaypointVisitDto = BaseWaypointVisitDto;