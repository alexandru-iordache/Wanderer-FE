import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { PanelView } from '../../../helpers/panel-view.enum';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CityTransferDto } from '../../../../interfaces/dtos/city-transfer-dto';
import { AddCityDto } from '../../../../interfaces/dtos/add-city-dto';
import { GoogleMapsService } from '../../../../services/google-maps.service';
import { LatLngBound } from '../../../../interfaces/dtos/lat-lang-bound';
import { SelectedCityDto } from '../../../../interfaces/dtos/selected-city-dto';
import { AddWaypointDto } from '../../../../interfaces/dtos/add-waypoint-dto';
import { WaypointTransferDto } from '../../../../interfaces/dtos/waypoint-transfer-dto';
import {
  ATTRACTIONS_WAYPOINT_TYPES,
  FOOD_WAYPOINT_TYPES,
  RECREATIONAL_WAYPOINT_TYPES,
} from '../../../../shared/helpers/preferred-waypoint-types';
import { WaypointType } from '../../../helpers/waypoint-type.enum';
import { endTimeValidator } from '../../../../shared/helpers/validators';

@Component({
  selector: 'app-city-list-panel',
  templateUrl: './city-list-panel.component.html',
  styleUrl: './city-list-panel.component.scss',
})
export class CityListPanelComponent
  implements OnInit, OnChanges, AfterViewInit
{
  @Input() cityToAdd: CityTransferDto | undefined = undefined;
  @Input() cityList: AddCityDto[] = [];
  @Input() startDate: Date | null = null;
  @Input() viewChanged: PanelView | null = null;
  @Input() openDeleteModal!: (type: 'city' | 'waypoint', data: any) => void;

  @Output() citySubmitted = new EventEmitter<{ city: AddCityDto }>();
  @Output() waypointSubmitted = new EventEmitter<{
    waypoint: AddWaypointDto;
  }>();
  @Output() citySelected = new EventEmitter<{
    selectedCityDto: SelectedCityDto;
  }>();
  @Output() dayChanged = new EventEmitter<{
    dayIndex: number;
  }>();

  @ViewChild('cityName') cityNameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('waypointName') waypointNameInput?: ElementRef<HTMLInputElement>;

  PanelView = PanelView;
  private cityAutocomplete: google.maps.places.Autocomplete | null = null;
  private waypointAutocomplete: google.maps.places.Autocomplete | null = null;

  addCityForm: FormGroup = new FormGroup({});
  addWaypointForm: FormGroup = new FormGroup({});

  currentView: PanelView = PanelView.CitiesListView; // change it
  currentDayIndex: number = 0;
  cityInAddProcess: AddCityDto | null = null;
  waypointInAddProcess: AddWaypointDto | null = null;
  selectedCity: AddCityDto | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private changeDetector: ChangeDetectorRef,
    private googleMapsService: GoogleMapsService
  ) {}

  async ngOnInit(): Promise<void> {
    this.addCityForm = this.formBuilder.group({
      cityName: ['', [Validators.required]],
      numberOfNights: ['0', [Validators.required]],
    });

    this.addWaypointForm = this.formBuilder.group(
      {
        waypointName: ['', [Validators.required]],
        startHour: ['00', [Validators.required]],
        startMinutes: ['00', [Validators.required]],
        endHour: ['00', [Validators.required]],
        endMinutes: ['01', [Validators.required]],
      },
      { validators: endTimeValidator() }
    );

    try {
      if (this.googleMapsService.isScriptLoaded() === false) {
        await this.googleMapsService.loadScriptAsync();
      }
    } catch (error) {
      console.error('[City-List-Panel] Google Maps script not loaded.', error);
    }
  }

  ngAfterViewInit(): void {
    if (this.currentView === PanelView.CityView) {
      this.addCityForm.reset();
      this.initializeCityAutocomplete();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['cityToAdd'] &&
      (changes['cityToAdd'].currentValue as CityTransferDto)
    ) {
      let cityTransferDto = changes['cityToAdd']
        .currentValue as CityTransferDto;

      this.setCurrentView(PanelView.CityView);

      this.addCityForm.get('cityName')?.setValue(cityTransferDto.name);
      this.cityInAddProcess = new AddCityDto(
        cityTransferDto.name,
        cityTransferDto.country,
        cityTransferDto.latitude,
        cityTransferDto.longitude,
        null,
        0,
        cityTransferDto.northEastBound,
        cityTransferDto.southWestBound,
        []
      );
    }

    if (
      changes['waypointToAdd'] &&
      (changes['waypointToAdd'].currentValue as WaypointTransferDto)
    ) {
      let waypointTransferDto = changes['waypointToAdd']
        .currentValue as WaypointTransferDto;

      this.setCurrentView(PanelView.WaypointView);

      this.addWaypointForm
        .get('waypointName')
        ?.setValue(waypointTransferDto.name);
      this.waypointInAddProcess = new AddWaypointDto(
        waypointTransferDto.name,
        waypointTransferDto.type,
        waypointTransferDto.placeId,
        waypointTransferDto.latitude,
        waypointTransferDto.longitude,
        '',
        ''
      );
    }

    if (changes['startDate'] && (changes['startDate'].currentValue as Date)) {
      this.startDate = new Date(changes['startDate'].currentValue);
    }

    if (
      changes['viewChanged'] &&
      changes['viewChanged'].currentValue !== null
    ) {
      const view = changes['viewChanged'].currentValue as PanelView;
      this.setCurrentView(view);

      if (view === PanelView.CitiesListView) {
        this.currentDayIndex = 0;
      }
    }

    this.changeDetector.detectChanges();
  }

  onAddCitySubmit() {
    if (!this.addCityForm.valid) {
      return;
    }

    const enteredValue = this.cityNameInput?.nativeElement.value.trim();
    if (
      !enteredValue ||
      !this.cityInAddProcess ||
      this.cityInAddProcess.name !== enteredValue
    ) {
      this.addCityForm.get('cityName')?.setErrors({ noResult: true });
      return;
    }

    const numberOfNights = this.addCityForm.get('numberOfNights')?.value;

    if (this.cityInAddProcess === null) {
      // IMPORTANT: Error snackbar, unexepected error
      return;
    }

    let nights = this.cityList.reduce(
      (sumOfNights, city) => sumOfNights + city.numberOfNights,
      0
    );

    let tempDate = new Date(this.startDate!);
    tempDate.setDate(this.startDate!.getDate() + nights);

    this.cityInAddProcess.arrivalDate = tempDate;
    this.cityInAddProcess.setNumberOfNights(numberOfNights);

    this.citySubmitted.emit({ city: this.cityInAddProcess });

    this.setCurrentView(PanelView.CitiesListView);
  }

  onAddWaypointSubmit() {
    if (!this.addWaypointForm.valid) {
      return;
    }

    const enteredValue = this.waypointNameInput?.nativeElement.value.trim();
    if (
      !enteredValue ||
      !this.waypointInAddProcess ||
      this.waypointInAddProcess.name !== enteredValue
    ) {
      this.addWaypointForm.get('waypointName')?.setErrors({ noResult: true });
      return;
    }

    const startHour = this.addWaypointForm.get('startHour')?.value;
    const startMinutes = this.addWaypointForm.get('startMinutes')?.value;

    const endHour = this.addWaypointForm.get('endHour')?.value;
    const endMinutes = this.addWaypointForm.get('endMinutes')?.value;

    if (this.waypointInAddProcess === null) {
      // IMPORTANT: Error snackbar, unexepected error
      return;
    }

    this.waypointInAddProcess!.startTime = `${this.formatTwoDigits(
      startHour,
      'hour'
    )}:${this.formatTwoDigits(startMinutes, 'minutes')}`;
    this.waypointInAddProcess!.endTime = `${this.formatTwoDigits(
      endHour,
      'hour'
    )}:${this.formatTwoDigits(endMinutes, 'minutes')}`;

    this.waypointSubmitted.emit({ waypoint: this.waypointInAddProcess });
    this.waypointInAddProcess = null;
    this.setCurrentView(PanelView.WaypointsListView);

    this.changeDetector.detectChanges();
  }

  onCityClick(selectedCity: AddCityDto) {
    console.log('City clicked: ' + selectedCity.name);
    const cityBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(
        selectedCity.southWestBound.latitude,
        selectedCity.southWestBound.longitude
      ),
      new google.maps.LatLng(
        selectedCity.northEastBound.latitude,
        selectedCity.northEastBound.longitude
      )
    );

    this.selectedCity = selectedCity;
    this.setCurrentView(PanelView.WaypointsListView);

    this.citySelected.emit({
      selectedCityDto: new SelectedCityDto(selectedCity, cityBounds),
    });
  }

  onDeleteClick(
    entity: AddCityDto | AddWaypointDto,
    type: 'city' | 'waypoint'
  ) {
    this.openDeleteModal(type, entity);
  }

  setCurrentView(view: PanelView) {
    if (this.currentView === PanelView.CityView) {
      this.destroyAutocomplete(this.cityAutocomplete);
    }

    if (this.currentView === PanelView.WaypointView) {
      this.destroyAutocomplete(this.waypointAutocomplete);
    }

    this.currentView = view;
    this.changeDetector.detectChanges();

    switch (view) {
      case PanelView.CityView:
        this.addCityForm.reset({
          numberOfNights: '0',
        });
        this.initializeCityAutocomplete();
        break;
      case PanelView.CitiesListView:
        break;
      case PanelView.WaypointView:
        this.addWaypointForm.reset({
          startHour: '00',
          startMinutes: '00',
          endHour: '00',
          endMinutes: '01',
        });
        this.initializeWaypointAutocomplete();
        break;
      case PanelView.WaypointsListView:
        break;
      default:
        break;
    }
  }

  navigateToDay(dayIndex: number): void {
    this.currentDayIndex = dayIndex;

    this.dayChanged.emit({ dayIndex: this.currentDayIndex });
  }

  getDateForDay(startDate: Date, dayIndex: number): string {
    const result = new Date(startDate);
    result.setDate(startDate.getDate() + dayIndex);
    return result.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
    });
  }

  formatTwoDigitsInput(event: Event, type: 'hour' | 'minutes'): void {
    const inputElement = event.target as HTMLInputElement;

    inputElement.value = this.formatTwoDigits(inputElement.value, type);
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

      this.addCityForm.get('cityName')?.setErrors(null);

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

      this.cityInAddProcess = new AddCityDto(
        cityName,
        countryName,
        latitude,
        longitude,
        null,
        0,
        new LatLngBound(northEastBound!.lat(), northEastBound!.lng()),
        new LatLngBound(southWestBound!.lat(), southWestBound!.lng()),
        []
      );
    });
  }

  private initializeWaypointAutocomplete() {
    if (this.waypointNameInput?.nativeElement === undefined) {
      console.error(
        'Waypoint Name Input is not rendered. The autocomplete cannot be initialized.'
      );
      return;
    }

    if (this.selectedCity === null) {
      console.error(
        'No city is selected. The autocomplete cannot be initialized.'
      );
      return;
    }

    this.waypointAutocomplete = new google.maps.places.Autocomplete(
      this.waypointNameInput!.nativeElement,
      {
        types: ['establishment'],
        fields: ['name', 'types', 'place_id', 'geometry'],
        bounds: new google.maps.LatLngBounds(
          new google.maps.LatLng(
            this.selectedCity.southWestBound.latitude,
            this.selectedCity.southWestBound.longitude
          ),
          new google.maps.LatLng(
            this.selectedCity.northEastBound.latitude,
            this.selectedCity.northEastBound.longitude
          )
        ),
        strictBounds: true,
      }
    );

    this.waypointAutocomplete.addListener('place_changed', () => {
      let place = this.waypointAutocomplete!.getPlace();

      const waypointName = place.name?.split(',')[0] ?? '';
      this.waypointNameInput!.nativeElement.value = waypointName;

      if (!place.place_id || !place.name) {
        return;
      }

      const waypointType = this.getWaypointType(place.types!);
      if (waypointType === WaypointType.Unkwnown) {
        this.addWaypointForm.get('waypointName')?.setErrors({
          unsupportedType: true,
        });
        return;
      }

      this.addWaypointForm.get('waypointName')?.setErrors(null);

      // IMPORTANT: Show no result feedback, country filtering etc
      const placeId = place.place_id ?? '';
      const latitude = place.geometry?.location?.lat() ?? 0;
      const longitude = place.geometry?.location?.lng() ?? 0;

      this.waypointInAddProcess = new AddWaypointDto(
        waypointName,
        waypointType.toString(),
        placeId,
        latitude,
        longitude,
        '',
        ''
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

  private getWaypointType(types: string[]): WaypointType {
    const foodMatch = types.find((type) =>
      FOOD_WAYPOINT_TYPES.find((knownType) => knownType === type)
    );
    if (foodMatch) {
      return WaypointType.Food;
    }

    const recreationalMatch = types.find((type) =>
      RECREATIONAL_WAYPOINT_TYPES.find((knownType) => knownType === type)
    );
    if (recreationalMatch) {
      return WaypointType.Recreational;
    }

    const attractionMatch = types.find((type) =>
      ATTRACTIONS_WAYPOINT_TYPES.find((knownType) => knownType === type)
    );
    if (attractionMatch) {
      return WaypointType.Attraction;
    }

    return WaypointType.Unkwnown;
  }

  private formatTwoDigits(text: string, type: 'hour' | 'minutes'): string {
    let value = parseInt(text, 10);

    return value.toString().padStart(2, '0');
  }
}
