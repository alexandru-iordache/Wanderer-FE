import { Uuid } from "../../../shared/helpers/uuid";

export interface BaseImageInfoDto {
    imageUrl: string;
    cityPlaceId?: string | null;
    cityName?: string | null;
    createdAt?: Date;
    waypointPlaceId?: string | null;
    waypointName?: string | null;
    placeId?: string | null;
}

export type ImageInfoDto = Required<BaseImageInfoDto>;
export type AddImageInfoDto = Omit<BaseImageInfoDto, 'id' | 'createdAt'>;