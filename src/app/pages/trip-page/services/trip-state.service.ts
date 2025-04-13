import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CityTransferDto } from '../../../interfaces/dtos/city-transfer-dto';
import { SelectedCityVisitDto } from '../../../interfaces/dtos/selected-city-dto';
import { BaseCityVisitDto } from '../../../interfaces/dtos/request/base-city-visit-dto';
import {
  AddWaypointVisitDto,
  BaseWaypointVisitDto,
} from '../../../interfaces/dtos/request/base-waypoint-visit-dto';
import { BaseTripDto } from '../../../interfaces/dtos/request/base-trip-dto';

@Injectable({
  providedIn: 'root',
  deps: [],
})
export class TripStateService {
  private cityVisits = new BehaviorSubject<BaseCityVisitDto[]>([]);
  private selectedCityVisit = new BehaviorSubject<SelectedCityVisitDto | null>(
    null
  );
  private cityToEdit = new BehaviorSubject<BaseCityVisitDto | undefined>(
    undefined
  );
  private currentDayIndex = new BehaviorSubject<number>(0);
  private cityToAdd = new BehaviorSubject<CityTransferDto | undefined>(
    undefined
  );
  private startDate = new BehaviorSubject<Date | null>(new Date());

  private waypointToAdd = new BehaviorSubject<BaseWaypointVisitDto | undefined>(
    undefined
  );
  private waypointToEdit = new BehaviorSubject<
    BaseWaypointVisitDto | undefined
  >(undefined);
  private trip = new BehaviorSubject<BaseTripDto | undefined>(undefined);
  private isSaved = new BehaviorSubject<boolean>(false);

  // Trip
  getTrip() {
    return this.trip.asObservable();
  }
  updateTrip(trip: BaseTripDto | undefined) {
    this.trip.next(trip);
  }
  updateIsSaved(isSaved: boolean) {
    this.isSaved.next(isSaved);
  }
  getIsSaved() {
    return this.isSaved.asObservable();
  }

  // Cities
  getCityVisits() {
    return this.cityVisits.asObservable();
  }
  updateCityVisits(cities: BaseCityVisitDto[]) {
    this.cityVisits.next(cities);
    console.log('Cities: ', cities);
  }

  // Selected City
  getSelectedCityVisit() {
    return this.selectedCityVisit.asObservable();
  }
  updateSelectedCity(city: SelectedCityVisitDto | null) {
    this.selectedCityVisit.next(city);
  }

  // Current Day Index
  getCurrentDayIndex() {
    return this.currentDayIndex.asObservable();
  }
  updateCurrentDayIndex(index: number) {
    this.currentDayIndex.next(index);
  }

  // City To Add
  getCityVisitToAdd() {
    return this.cityToAdd.asObservable();
  }
  updateCityToAdd(city: CityTransferDto | undefined) {
    this.cityToAdd.next(city);
  }

  // City To Edit
  getCityVisitToEdit() {
    return this.cityToEdit.asObservable();
  }
  updateCityVisitToEdit(city: BaseCityVisitDto | undefined) {
    this.cityToEdit.next(city);
  }

  // Waypoint To Add
  getWaypointToAdd() {
    return this.waypointToAdd.asObservable();
  }
  updateWaypointToAdd(waypoint: AddWaypointVisitDto | undefined) {
    this.waypointToAdd.next(waypoint);
  }

  // Waypoint To Edit
  getWaypointVisitToEdit() {
    return this.waypointToEdit.asObservable();
  }
  updateWaypointVisitToEdit(waypoint: BaseWaypointVisitDto | undefined) {
    this.waypointToEdit.next(waypoint);
  }

  // Waypoint Submit Form
  submitWaypointVisitForm(
    waypointVisit: BaseWaypointVisitDto,
    isEditFlow: boolean
  ): boolean {
    const cityVisitsValue = this.cityVisits.getValue();
    const currentDayIndexValue = this.currentDayIndex.getValue();
    const selectedCityVisitValue = this.selectedCityVisit.getValue();
    if (!selectedCityVisitValue) return false;

    const cityVisit = cityVisitsValue.find(
      (city) =>
        city.order === selectedCityVisitValue.cityVisit!.order &&
        city.placeId === selectedCityVisitValue.cityVisit!.placeId
    );
    if (!cityVisit) return false;

    if (!isEditFlow) {
      cityVisit.dayVisits[currentDayIndexValue].waypointVisits.push(
        waypointVisit
      );
    } else {
      let waypointInList = cityVisit.dayVisits[
        currentDayIndexValue
      ].waypointVisits.find(
        (cityWaypoint) => cityWaypoint.placeId === waypointVisit.placeId
      );

      if (waypointInList === undefined) {
        console.error('No waypoint found.');
        return false;
      }

      waypointInList.startTime = waypointVisit.startTime;
      waypointInList.endTime = waypointVisit.endTime;
    }

    cityVisit.dayVisits[currentDayIndexValue].waypointVisits.sort(
      (a, b) =>
        this.convertToMinutes(a.startTime) - this.convertToMinutes(b.endTime)
    );

    this.updateCityVisits([...cityVisitsValue]);

    return true;
  }

  // Start Date
  getStartDate() {
    return this.startDate.asObservable();
  }
  updateStartDate(date: Date | null) {
    this.startDate.next(date);
  }

  // Delete flows
  deleteCity(cityVisit: BaseCityVisitDto) {
    const cityVisitsValue = this.cityVisits.getValue();

    const cityIndex = cityVisitsValue.indexOf(cityVisit);
    if (cityIndex > -1) {
      cityVisitsValue.splice(cityIndex, 1);
    }

    cityVisitsValue
      .sort((x) => x.order)
      .forEach((x, index) => {
        x.order = index;

        if (index == 0) {
          x.startDate = this.startDate.getValue()!;
        } else {
          let tempDate = new Date(cityVisitsValue[index - 1].startDate);
          tempDate.setDate(
            cityVisitsValue[index - 1].startDate.getDate() +
              cityVisitsValue[index - 1].numberOfNights
          );
          x.startDate = tempDate;
        }
      });
    this.updateCityVisits([...cityVisitsValue]);

    console.log('City: ' + cityVisit.city + ' deleted succesfully.');
  }

  deleteWaypoint(waypoint: BaseWaypointVisitDto) {
    const cityVisitsValue = this.cityVisits.getValue();
    const currentDayIndexValue = this.currentDayIndex.getValue();
    const selectedCityVisitValue = this.selectedCityVisit.getValue();
    if (!selectedCityVisitValue) return;

    let cityVisit = cityVisitsValue.find(
      (city) => city === selectedCityVisitValue.cityVisit
    );
    if (cityVisit === undefined) {
      console.error('No city found.');
      return;
    }

    const waypointVisitIndex =
      cityVisit.dayVisits[currentDayIndexValue].waypointVisits.indexOf(
        waypoint
      );
    if (waypointVisitIndex > -1) {
      cityVisit.dayVisits[currentDayIndexValue].waypointVisits.splice(
        waypointVisitIndex,
        1
      );
    }

    this.updateCityVisits([...cityVisitsValue]);
    console.log('Waypoint: ' + waypoint.name + ' deleted succesfully.');
  }

  private convertToMinutes(time: string): number {
    const splitTime = time.split(':');
    return parseInt(splitTime[0], 10) * 60 + parseInt(splitTime[1], 10);
  }
}
