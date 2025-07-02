import { Uuid } from "../../../shared/helpers/uuid";

export interface SearchResponseDto {
    id: Uuid;
    avatarUrl: string | null;
    name: string;
    type: 'user' | 'trip'; 
}