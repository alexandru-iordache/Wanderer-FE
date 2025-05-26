import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PanelView } from '../../../../../helpers/panel-view.enum';
import { TripStateService } from '../../../../services/trip-state.service';
import { Subscription } from 'rxjs';
import { LatLngBound } from '../../../../../../interfaces/dtos/lat-lang-bound';
import { CityTransferDto } from '../../../../../../interfaces/dtos/city-transfer-dto';
import {
  AddCityVisitDto,
  BaseCityVisitDto,
} from '../../../../../../interfaces/dtos/base-dtos/base-city-visit-dto';
import { BaseDayVisitDto } from '../../../../../../interfaces/dtos/base-dtos/base-day-visit-dto';
import { BaseWaypointVisitDto } from '../../../../../../interfaces/dtos/base-dtos/base-waypoint-visit-dto';

@Component({
  selector: 'app-city-form',
  templateUrl: './city-form.component.html',
  styleUrl: './city-form.component.scss',
})
export class CityFormComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() onDiscardClick!: (
    view: PanelView,
    type: 'city' | 'waypoint',
    isEditFlow: boolean
  ) => void;
  @Input() preventEnterSubmit!: (event: Event) => void;
  @Input() setCurrentView!: (panelView: PanelView) => void;

  @ViewChild('cityName') cityNameInput?: ElementRef<HTMLInputElement>;

  PanelView = PanelView;

  cityForm: FormGroup = new FormGroup({});
  isEditFlow: boolean = false;
  cityVisitInProcess: AddCityVisitDto | null = null;

  private subscriptions: Subscription[] = [];
  private cityAutocomplete: google.maps.places.Autocomplete | null = null;
  private cityVisits: AddCityVisitDto[] = [];
  private startDate: Date | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private tripStateService: TripStateService
  ) {}

  ngOnInit(): void {
    this.cityForm = this.formBuilder.group({
      cityName: ['', [Validators.required]],
      numberOfNights: ['0', [Validators.required]],
    });

    this.subscriptions.push(
      this.tripStateService.getCityVisits().subscribe((cities) => {
        this.cityVisits = cities;
      }),
      this.tripStateService.getStartDate().subscribe((date) => {
        this.startDate = date;
      }),
      this.tripStateService.getCityVisitToAdd().subscribe((city) => {
        if (city === undefined) {
          return;
        }
        this.HandleCityToAdd(city);
      }),
      this.tripStateService.getCityVisitToEdit().subscribe((city) => {
        if (city === undefined) {
          return;
        }
        this.HandleCityVisitToEdit(city);
      })
    );
  }

  ngAfterViewInit(): void {
    this.initializeCityAutocomplete();
  }

  onCityFormSubmit() {
    if (!this.cityForm.valid) {
      console.log('Invalid Form: ' + this.cityForm.errors);
      return;
    }

    if (this.cityVisitInProcess === null) {
      this.cityForm.get('cityName')?.setErrors({ noResult: true });
      return;
    }

    const numberOfNights = this.cityForm.get('numberOfNights')?.value;

    let response: boolean;
    if (this.isEditFlow) {
      response = this.HandleCityEditSubmit(numberOfNights);
    } else {
      response = this.HandleCityVisitAddSubmit(numberOfNights);
    }

    if (response) {
      if (this.isEditFlow) {
        this.tripStateService.updateCityVisitToEdit(undefined);
      } else {
        this.tripStateService.updateCityToAdd(undefined);
      }
      this.setCurrentView(PanelView.CitiesListView);
    }
  }

  private HandleCityToAdd(cityTransferDto: CityTransferDto) {
    this.cityForm.get('cityName')?.setValue(cityTransferDto.name);

    this.cityVisitInProcess = {
      city: cityTransferDto.name,
      country: cityTransferDto.country,
      startDate: new Date(),
      numberOfNights: 0,
      placeId: cityTransferDto.placeId,
      northEastBound: cityTransferDto.northEastBound,
      southWestBound: cityTransferDto.southWestBound,
      latitude: cityTransferDto.latitude,
      longitude: cityTransferDto.longitude,
      order:
        this.cityVisits.length > 0
          ? Math.max(...this.cityVisits.map((x) => x.order)) + 1
          : 0,
      dayVisits: [] as BaseDayVisitDto[],
    } as AddCityVisitDto;
  }

  private HandleCityVisitToEdit(cityVisit: BaseCityVisitDto): void {
    this.isEditFlow = true;
    this.setCityForm(cityVisit);
  }

  private HandleCityVisitAddSubmit(numberOfNights: number): boolean {
    if (this.cityVisitInProcess === null) {
      // TO DO: Add snackbar
      console.error('City Visit In Process is null.');
      return false;
    }

    const enteredValue = this.cityNameInput?.nativeElement.value.trim();
    if (!enteredValue || this.cityVisitInProcess.city !== enteredValue) {
      this.cityForm.get('cityName')?.setErrors({ noResult: true });
      return false;
    }

    let nights = this.cityVisits.reduce(
      (sumOfNights, city) => sumOfNights + Number(city.numberOfNights),
      0
    );

    let tempDate = new Date(this.startDate!);
    tempDate.setDate(tempDate.getDate() + nights);

    this.cityVisitInProcess.startDate = tempDate;
    this.cityVisitInProcess.numberOfNights = numberOfNights;
    this.cityVisitInProcess.dayVisits = Array.from(
      { length: numberOfNights + 1 },
      (x, index) =>
        ({
          date: this.calculateDate(this.cityVisitInProcess!.startDate, index),
          waypointVisits: [] as BaseWaypointVisitDto[],
        } as BaseDayVisitDto)
    );

    this.tripStateService.updateCityVisits([
      ...this.cityVisits,
      this.cityVisitInProcess!,
    ]);

    return true;
  }

  private HandleCityEditSubmit(newNumberOfNights: number): boolean {
    if (this.cityVisitInProcess === null) {
      // TO DO: Add snackbar
      console.error('City Visit In Process is null.');
      return false;
    }

    if (this.cityVisitInProcess.numberOfNights < newNumberOfNights) {
      // TO DO: Ask for confirmation
    }

    if (this.cityVisitInProcess.numberOfNights === newNumberOfNights) {
      return true;
    }

    let currentCityVisit = this.cityVisits.find(
      (x) => x.order === this.cityVisitInProcess!.order
    )!;

    if (currentCityVisit.numberOfNights > newNumberOfNights) {
      currentCityVisit.dayVisits = currentCityVisit.dayVisits.slice(0, newNumberOfNights + 1);
    } else {
      const newDayVisits = Array.from(
        { length: newNumberOfNights - currentCityVisit.numberOfNights + 1 },
        () =>
          ({
            waypointVisits: [] as BaseWaypointVisitDto[],
          } as BaseDayVisitDto)
      );

      currentCityVisit.dayVisits.push(...newDayVisits);
    }
    currentCityVisit.numberOfNights = newNumberOfNights;

    this.cityVisits
      .filter((x) => x.order >= this.cityVisitInProcess!.order)
      .forEach((cityVisit) => {
        this.RearrangeDates(cityVisit);
      });

    this.tripStateService.updateCityVisits(this.cityVisits);

    return true;
  }

  private RearrangeDates(cityVisit: AddCityVisitDto) {
    if (this.cityVisits.indexOf(cityVisit) == 0) {
      cityVisit.startDate = this.startDate!;
    } else {
      const previousArrivalDate =
        this.cityVisits[this.cityVisits.indexOf(cityVisit) - 1].startDate;

      let tempDate = new Date(previousArrivalDate);
      tempDate.setDate(
        previousArrivalDate.getDate() +
          this.cityVisits[this.cityVisits.indexOf(cityVisit) - 1].numberOfNights
      );

      cityVisit.startDate = tempDate;
    }

    cityVisit.dayVisits.forEach((dayVisit, index) => {
      dayVisit.date = this.calculateDate(cityVisit.startDate, index);
    });
  }

  private calculateDate(date: Date, days: number): Date {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  }

  private setCityForm(cityVisitToEdit: BaseCityVisitDto) {
    this.cityVisitInProcess = cityVisitToEdit;

    this.cityForm.get('cityName')?.disable();
    this.cityForm.patchValue({
      cityName: cityVisitToEdit.city,
      numberOfNights: cityVisitToEdit.numberOfNights,
    });
  }

  private initializeCityAutocomplete() {
    if (this.cityNameInput?.nativeElement === undefined) {
      console.error(
        'City Name Input is not rendered. The autocomplete cannot be initialized.'
      );
      return;
    }

    this.cityAutocomplete = new google.maps.places.Autocomplete(
      this.cityNameInput!.nativeElement,
      {
        types: ['(cities)'],
      }
    );

    this.cityAutocomplete.addListener('place_changed', () => {
      let place = this.cityAutocomplete!.getPlace();

      if (!place.place_id || !place.name) {
        return;
      }

      if (place.address_components === undefined) {
        // IMPORTANT: See how to handle this type of problem
        return;
      }

      const cityName = place.name;
      this.cityNameInput!.nativeElement.value = cityName;

      // this.cityForm.get('cityName')?.setErrors(null);

      // IMPORTANT: Show no result feedback, country filtering etc
      const placeId = place.place_id;
      const countryName =
        place.address_components
          .filter((x) => x.types.includes('country'))
          .at(0)?.long_name ?? '';

      const latitude = place.geometry?.location?.lat() ?? 0;
      const longitude = place.geometry?.location?.lng() ?? 0;

      var northEastBound = place.geometry?.viewport?.getNorthEast();
      var southWestBound = place.geometry?.viewport?.getSouthWest();

      if (northEastBound === undefined || southWestBound === undefined) {
        // IMPORTANT: See how to handle this type of problem
        console.error('Bounds of city cannot be found.');
        return;
      }

      this.cityVisitInProcess = {
        city: cityName,
        placeId: placeId,
        country: countryName,
        latitude: latitude,
        longitude: longitude,
        startDate: new Date(),
        numberOfNights: 0,
        northEastBound: new LatLngBound(
          northEastBound!.lat(),
          northEastBound!.lng()
        ),
        southWestBound: new LatLngBound(
          southWestBound!.lat(),
          southWestBound!.lng()
        ),
        order:
          this.cityVisits.length > 0
            ? Math.max(...this.cityVisits.map((x) => x.order)) + 1
            : 0,
        dayVisits: [],
      } as AddCityVisitDto;
    });
  }

  private destroyAutocomplete(
    autocomplete: google.maps.places.Autocomplete | null
  ) {
    if (autocomplete) {
      google.maps.event.clearInstanceListeners(autocomplete);
      autocomplete = null;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.destroyAutocomplete(this.cityAutocomplete);
  }
}
