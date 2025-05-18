import { HomeCityDto } from "../home-city-dto";

export interface UserProfileDto {
    profileName: string;
    avatarUrl?: string;
    homeCity?: HomeCityDto;
    profileDescription?: string;
    visitedCities: string[];
    visitedCountries: string[];
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
}