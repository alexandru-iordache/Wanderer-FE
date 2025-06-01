import { Uuid } from "../../../shared/helpers/uuid";
import { UserInfoDto } from "../response/user-info-dto";
import { BaseImageInfoDto } from "./base-image-info-dto";

export interface BasePostDto {
    id?: Uuid;
    title: string;
    description: string;
    createdAt?: Date;
    tripId?: Uuid;
    ownerId?: Uuid;
    images: BaseImageInfoDto[];
    userInfo?: UserInfoDto;
    likesCount?: number;
    commentsCount?: number;
    isLiked?: boolean;
}

export type PostDto = Required<BasePostDto>;
export type AddPostDto = Omit<BasePostDto, 'id' | 'createdAt' | 'ownerId' | 'userInfo' | 'likesCount' | 'commentsCount' | 'isLiked'>; 