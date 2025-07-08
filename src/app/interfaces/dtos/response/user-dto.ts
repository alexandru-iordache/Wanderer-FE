import { HomeCityDto } from "../home-city-dto";

export interface UserDto {
    id: string;
    profileName: string;
    email: string;
    avatarUrl?: string;
    homeCity?: HomeCityDto;
    profileDescription?: string;
}