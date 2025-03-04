import { Injectable } from '@angular/core';
import { BehaviorSubject, concatMap, delay, of } from 'rxjs';
import { CityTransferDto } from '../../../interfaces/dtos/city-transfer-dto';
import { AddCityDto } from '../../../interfaces/dtos/add-city-dto';
import { SelectedCityDto } from '../../../interfaces/dtos/selected-city-dto';

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

  // Cities
  getCities() {
    return this.cities.asObservable();
  }
  updateCities(cities: AddCityDto[]) {
    this.cities.next(cities);
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
    return this.cityToAdd
      .asObservable();
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

  // Start Date
  getStartDate() {
    return this.startDate.asObservable();
  }
  updateStartDate(date: Date | null) {
    this.startDate.next(date);
  }
}
