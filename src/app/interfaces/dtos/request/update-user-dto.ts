import { HomeCityDto } from "../home-city-dto";

export interface UpdateUserDto {
    id: string;
    profileName: string;
    avatarUrl?: string;
    homeCity: HomeCityDto | null;
}