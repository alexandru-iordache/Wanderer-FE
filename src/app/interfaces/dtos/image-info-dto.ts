import { Uuid } from "../../shared/helpers/uuid";

export interface ImageInfoDto {
    imageUrl: string;
    cityId?: string | null;
    cityName?: string | null;
    waypointId?: string | null;
    waypointName?: string | null;
}
