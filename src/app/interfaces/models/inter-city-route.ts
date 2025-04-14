import { Route } from "@angular/router";
import { City } from "./city";

export interface InterCityRoute extends Route{
    startLocation: City,
    endLocation: City
}
