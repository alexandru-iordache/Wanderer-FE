import { Injectable } from '@angular/core';
import { BehaviorSubject, concatMap, delay, of } from 'rxjs';
import { CityTransferDto } from '../../../interfaces/dtos/city-transfer-dto';
import { AddCityDto } from '../../../interfaces/dtos/add-city-dto';
import { SelectedCityDto } from '../../../interfaces/dtos/selected-city-dto';
import { AddWaypointDto } from '../../../interfaces/dtos/add-waypoint-dto';

@Injectable({
  providedIn: 'root',
})
export class TripStateService {
  private cities = new BehaviorSubject<AddCityDto[]>([]);
  private selectedCity = new BehaviorSubject<SelectedCityDto | null>(null);
  private cityToEdit = new BehaviorSubject<AddCityDto | undefined>(undefined);
  private currentDayIndex = new BehaviorSubject<number>(0);
  private cityToAdd = new BehaviorSubject<CityTransferDto | undefined>(
    undefined
  );
  private startDate = new BehaviorSubject<Date | null>(new Date());

  private waypointToEdit = new BehaviorSubject<AddWaypointDto | undefined>(
    undefined
  );

  // Cities
  getCities() {
    return this.cities.asObservable();
  }
  updateCities(cities: AddCityDto[]) {
    this.cities.next(cities);
    console.log('Cities: ', cities);
  }

  // Selected City
  getSelectedCity() {
    return this.selectedCity.asObservable();
  }
  updateSelectedCity(city: SelectedCityDto | null) {
    this.selectedCity.next(city);
  }

  // Current Day Index
  getCurrentDayIndex() {
    return this.currentDayIndex.asObservable();
  }
  updateCurrentDayIndex(index: number) {
    this.currentDayIndex.next(index);
  }

  // City To Add
  getCityToAdd() {
    return this.cityToAdd.asObservable();
  }
  updateCityToAdd(city: CityTransferDto | undefined) {
    this.cityToAdd.next(city);
  }

  // City To Edit
  getCityToEdit() {
    return this.cityToEdit.asObservable();
  }
  updateCityToEdit(city: AddCityDto | undefined) {
    this.cityToEdit.next(city);
  }

  // Waypoint To Edit
  getWaypointToEdit() {
    return this.waypointToEdit.asObservable();
  }
  updateWaypointToEdit(waypoint: AddWaypointDto | undefined) {
    this.waypointToEdit.next(waypoint);
  }

  // Waypoint Submit Form
  submitWaypointForm(waypoint: AddWaypointDto, isEditFlow: boolean) {
    const citiesValue = this.cities.getValue();
    const currentDayIndexValue = this.currentDayIndex.getValue();
    const selectedCityValue = this.selectedCity.getValue();
    if (!selectedCityValue) return;

    const city = citiesValue.find((city) => city === selectedCityValue.selectedCity);
    if (!city) return;

    if (!isEditFlow) {
      this.setWaypointsOrder(
        waypoint,
        city.waypoints[currentDayIndexValue].length,
        city
      );

      city.waypoints[currentDayIndexValue].push(waypoint);
    } else {
      let waypointInList = city?.waypoints[currentDayIndexValue].find(
        (cityWaypoint) => cityWaypoint.placeId === waypoint.placeId
      );

      waypointInList!.startTime = waypoint.startTime;
      waypointInList!.endTime = waypoint.endTime;

      this.setWaypointsOrder(waypointInList!, waypointInList!.order, city!);
    }

    city.waypoints[currentDayIndexValue].sort((a, b) => a.order - b.order);
    this.updateCities([...citiesValue]);
  }

  // Start Date
  getStartDate() {
    return this.startDate.asObservable();
  }
  updateStartDate(date: Date | null) {
    this.startDate.next(date);
  }

  // Delete flows
  deleteCity(city: AddCityDto) {
    const citiesValue = this.cities.getValue();
    const cityIndex = citiesValue.indexOf(city);
    if (cityIndex > -1) {
      citiesValue.splice(cityIndex, 1);
    }

    citiesValue
      .sort((x) => x.order)
      .forEach((city, index) => {
        city.order = index;

        if (index == 0) {
          city.arrivalDate = this.startDate.getValue();
        } else {
          let tempDate = new Date(citiesValue[index - 1].arrivalDate!);
          tempDate.setDate(
            citiesValue[index - 1].arrivalDate!.getDate() +
              citiesValue[index - 1].numberOfNights
          );
          city.arrivalDate = tempDate;
        }
      });
    this.updateCities([...citiesValue]);

    console.log('City: ' + city.name + ' deleted succesfully.');
  }
  deleteWaypoint(waypoint: AddWaypointDto) {
    const citiesValue = this.cities.getValue();
    const currentDayIndexValue = this.currentDayIndex.getValue();
    const selectedCityValue = this.selectedCity.getValue();
    if (!selectedCityValue) return;

    let city = citiesValue.find((city) => city === selectedCityValue.selectedCity);

    if (city === undefined) {
      console.error('No city found.');
      return;
    }

    const waypointIndex =
      city.waypoints[currentDayIndexValue].indexOf(waypoint);
    if (waypointIndex > -1) {
      city.waypoints[currentDayIndexValue].splice(waypointIndex, 1);
    }

    city.waypoints[currentDayIndexValue]
      .sort((x) => x.order)
      .forEach((waypoint, index) => {
        waypoint.order = index;
      });

    this.updateCities([...citiesValue]);
    console.log('Waypoint: ' + waypoint.name + ' deleted succesfully.');
  }

  private setWaypointsOrder(
    waypoint: AddWaypointDto,
    initialOrder: number,
    city: AddCityDto
  ) {
    const waypointSplitStartTime = waypoint.startTime.split(':');
    const waypointStartTime =
      parseInt(waypointSplitStartTime[0], 10) * 60 +
      parseInt(waypointSplitStartTime[1], 10);

    let currentDayWaypoints = city.waypoints[this.currentDayIndex.getValue()];

    let order = initialOrder;
    let index = 0;
    let isLast = true;
    while (index < currentDayWaypoints.length) {
      const splitStartTime = currentDayWaypoints[index].startTime.split(':');
      const currentWaypointStartTime =
        parseInt(splitStartTime[0], 10) * 60 + parseInt(splitStartTime[1], 10);

      if (waypointStartTime < currentWaypointStartTime) {
        isLast = false;
        break;
      }

      const currentPlaceId = currentDayWaypoints[index].placeId;
      if (
        waypointStartTime === currentWaypointStartTime &&
        waypoint.placeId === currentPlaceId
      ) {
        break;
      }

      index++;
    }

    if (isLast === false) {
      order = currentDayWaypoints[index].order;
      for (
        let secondIndex = index;
        secondIndex < currentDayWaypoints.length;
        secondIndex++
      ) {
        currentDayWaypoints[secondIndex].order =
          currentDayWaypoints[secondIndex].order + 1;
      }
    }

    waypoint.order = order;
  }
}
