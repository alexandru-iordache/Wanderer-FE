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
import { AddCityDto } from '../../../../../../interfaces/dtos/add-city-dto';
import { TripStateService } from '../../../../services/trip-state.service';
import { Subscription } from 'rxjs';
import { GoogleMapsService } from '../../../../../../services/google-maps.service';
import { LatLngBound } from '../../../../../../interfaces/dtos/lat-lang-bound';
import { CityTransferDto } from '../../../../../../interfaces/dtos/city-transfer-dto';

@Component({
  selector: 'app-city-form',
  templateUrl: './city-form.component.html',
  styleUrl: './city-form.component.scss',
})
export class CityFormComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() onDiscardClick!: (
    view: PanelView,
    type: 'city' | 'waypoint'
  ) => void;
  @Input() preventEnterSubmit!: (event: Event) => void;
  @Input() setCurrentView!: (panelView: PanelView) => void;

  @ViewChild('cityName') cityNameInput?: ElementRef<HTMLInputElement>;

  PanelView = PanelView;

  cityForm: FormGroup = new FormGroup({});
  isEditFlow: boolean = false;
  cityInProcess: AddCityDto | null = null;

  private subscriptions: Subscription[] = [];
  private cityAutocomplete: google.maps.places.Autocomplete | null = null;
  private cityList: AddCityDto[] = [];
  private startDate: Date | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private tripStateService: TripStateService,
    private googleMapsService: GoogleMapsService
  ) {}

  ngOnInit(): void {
    this.cityForm = this.formBuilder.group({
      cityName: ['', [Validators.required]],
      numberOfNights: ['0', [Validators.required]],
    });

    this.subscriptions.push(
      this.tripStateService.getCities().subscribe((cities) => {
        this.cityList = cities;
      }),
      this.tripStateService.getStartDate().subscribe((date) => {
        this.startDate = date;
      }),
      this.tripStateService.getCityToAdd().subscribe((city) => {
        if (city === undefined) {
          return;
        }
        this.HandleCityToAdd(city);
      }),
      this.tripStateService.getCityToEdit().subscribe((city) => {
        if (city === undefined) {
          return;
        }
        this.HandleCityToEdit(city);
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

    if (this.cityInProcess === null) {
      this.cityForm.get('cityName')?.setErrors({ noResult: true });
      return;
    }

    const numberOfNights = this.cityForm.get('numberOfNights')?.value;

    let response: boolean;
    if (this.isEditFlow) {
      response = this.HandleCityEditSubmit(numberOfNights);
    } else {
      response = this.HandleCityAddSubmit(numberOfNights);
    }

    if (response) {
      if (this.isEditFlow) {
        this.tripStateService.updateCityToEdit(undefined);
      } else {
        this.tripStateService.updateCityToAdd(undefined);
      }
      this.setCurrentView(PanelView.CitiesListView);
    }
  }

  private HandleCityToAdd(cityTransferDto: CityTransferDto) {
    this.cityForm.get('cityName')?.setValue(cityTransferDto.name);
    this.cityInProcess = new AddCityDto(
      cityTransferDto.name,
      cityTransferDto.country,
      cityTransferDto.latitude,
      cityTransferDto.longitude,
      null,
      0,
      cityTransferDto.northEastBound,
      cityTransferDto.southWestBound,
      this.cityList.length > 0
        ? Math.max(...this.cityList.map((x) => x.order)) + 1
        : 0,
      []
    );
  }

  private HandleCityToEdit(city: AddCityDto): void {
    this.isEditFlow = true;
    this.setCityForm(city);
  }

  private HandleCityAddSubmit(numberOfNights: number): boolean {
    const enteredValue = this.cityNameInput?.nativeElement.value.trim();
    if (!enteredValue || this.cityInProcess!.name !== enteredValue) {
      this.cityForm.get('cityName')?.setErrors({ noResult: true });
      return false;
    }

    let nights = this.cityList.reduce(
      (sumOfNights, city) => sumOfNights + city.numberOfNights,
      0
    );

    let tempDate = new Date(this.startDate!);
    tempDate.setDate(this.startDate!.getDate() + nights);

    this.cityInProcess!.arrivalDate = tempDate;
    this.cityInProcess!.setNumberOfNights(numberOfNights);

    this.tripStateService.updateCities([...this.cityList, this.cityInProcess!]);

    return true;
  }

  private HandleCityEditSubmit(numberOfNights: number): boolean {
    if (this.cityInProcess!.numberOfNights < numberOfNights) {
      // TO DO: Ask for confirmation
    }

    if (this.cityInProcess!.numberOfNights === numberOfNights) {
      return true;
    }

    this.cityList
      .filter((x) => x.order >= this.cityInProcess!.order)
      .forEach((x) => {
        let previousArrivalDate;

        if (x.order === this.cityInProcess!.order) {
          x.setNumberOfNights(numberOfNights);
        }

        if (this.cityList.indexOf(x) == 0) {
          x.arrivalDate = this.startDate;
          return;
        } else {
          previousArrivalDate =
            this.cityList[this.cityList.indexOf(x) - 1].arrivalDate;
        }

        let tempDate = new Date(previousArrivalDate!);
        tempDate.setDate(
          previousArrivalDate!.getDate() +
            this.cityList[this.cityList.indexOf(x) - 1].numberOfNights
        );

        x.arrivalDate = tempDate;
      });

    this.tripStateService.updateCities(this.cityList);

    return true;
  }

  private setCityForm(cityToEdit: AddCityDto) {
    this.cityInProcess = cityToEdit;

    this.cityForm.get('cityName')?.disable();
    this.cityForm.patchValue({
      cityName: cityToEdit.name,
      numberOfNights: cityToEdit.numberOfNights,
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

      this.cityInProcess = new AddCityDto(
        cityName,
        countryName,
        latitude,
        longitude,
        null,
        0,
        new LatLngBound(northEastBound!.lat(), northEastBound!.lng()),
        new LatLngBound(southWestBound!.lat(), southWestBound!.lng()),
        this.cityList.length > 0
          ? Math.max(...this.cityList.map((x) => x.order)) + 1
          : 0,
        []
      );
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
