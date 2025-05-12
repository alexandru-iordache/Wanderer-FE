export interface UserDto {
    id: string;
    profileName: string;
    email: string;
    address: string | null;
    birthDate: Date | null;
}