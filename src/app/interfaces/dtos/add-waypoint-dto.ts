import { Time } from "@angular/common";

export class AddWaypointDto 
{
    name: string;
    type: string;
    placeId: string;
    latitude: number;
    longitude: number;
    startTime: string;
    endTime: string;

    constructor(
        name: string,
        type: string,
        placeId: string,
        latitude: number,
        longitude: number,
        startTime: string,
        endTime: string
    ){
        this.name = name;
        this.type = type;
        this.placeId = placeId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.startTime = startTime;
        this.endTime = endTime;
    }
}