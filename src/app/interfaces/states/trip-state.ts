import { AddCityDto } from "../dtos/add-city-dto";
import { AddWaypointDto } from "../dtos/add-waypoint-dto";
import { CityTransferDto } from "../dtos/city-transfer-dto";

export interface TripState {
  cities: AddCityDto[];
  selectedCity: AddCityDto | null;
  currentDayIndex: number;
  cityToAdd: CityTransferDto | null;
  waypointToAdd: AddWaypointDto | null;
  startDate: Date | null;
}