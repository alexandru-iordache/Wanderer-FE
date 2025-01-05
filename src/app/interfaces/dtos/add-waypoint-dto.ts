import { Time } from "@angular/common";

export class AddWaypointDto 
{
    name: string;
    type: string;
    latitude: number;
    longitude: number;
    startHour: Time;
    numberOfHours: number;

    constructor(
        name: string,
        type: string,
        latitude: number,
        longitude: number,
        startHour: Time,
        numberOfHours: number,
    ){
        this.name = name;
        this.type = type;
        this.latitude = latitude;
        this.longitude = longitude;
        this.startHour = startHour;
        this.numberOfHours = numberOfHours;
    }
}