import { Uuid } from "../../../shared/helpers/uuid";
import { BaseImageInfoDto } from "./base-image-info-dto";

export interface BasePostDto {
    id?: Uuid;
    title: string;
    description: string;
    createdAt?: Date;
    tripId?: Uuid;
    ownerId?: Uuid;
    images: BaseImageInfoDto[];
}

export type PostDto = Required<BasePostDto>;
export type AddPostDto = Omit<BasePostDto, 'id' | 'createdAt' | 'ownerId'>;