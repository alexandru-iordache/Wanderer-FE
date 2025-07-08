import { Uuid } from "../../shared/helpers/uuid";

export interface PostCityDto {
    id: Uuid;
    name: string;
    placeId: string;
    waypoints: PostWaypointDto[];
}

export interface PostWaypointDto {
    id: Uuid;
    name: string;
    placeId: string;
    type: string;
}
