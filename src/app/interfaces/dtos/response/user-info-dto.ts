import { Uuid } from "../../../shared/helpers/uuid";

export interface UserInfoDto {
    id: Uuid;
    profileName: string;
    avatarUrl: string | null;
}