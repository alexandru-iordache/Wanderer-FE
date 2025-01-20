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

  @Output() action = new EventEmitter<{
    type:
      | 'citySubmitted'
      | 'cityEdited'
      | 'waypointSubmitted'
      | 'waypointEdited'
      | 'citySelected'
      | 'dayChanged';
    payload?: any;
  }>();

  @ViewChild('cityName') cityNameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('waypointName') waypointNameInput?: ElementRef<HTMLInputElement>;

  PanelView = PanelView;
  private cityAutocomplete: google.maps.places.Autocomplete | null = null;
  private waypointAutocomplete: google.maps.places.Autocomplete | null = null;

  cityForm: FormGroup = new FormGroup({});
  waypointForm: FormGroup = new FormGroup({});

  currentView: PanelView = PanelView.CitiesListView; // change it
  currentDayIndex: number = 0;
  cityInProcess: AddCityDto | null = null;
  waypointInProcess: AddWaypointDto | null = null;
  selectedCity: AddCityDto | null = null;
  isEditFlow: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private changeDetector: ChangeDetectorRef,
    private googleMapsService: GoogleMapsService
  ) {}

  async ngOnInit(): Promise<void> {
    this.cityForm = this.formBuilder.group({
      cityName: ['', [Validators.required]],
      numberOfNights: ['0', [Validators.required]],
    });

    this.waypointForm = this.formBuilder.group(
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
      this.cityForm.reset();
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

    if (
      changes['waypointToAdd'] &&
      (changes['waypointToAdd'].currentValue as WaypointTransferDto)
    ) {
      let waypointTransferDto = changes['waypointToAdd']
        .currentValue as WaypointTransferDto;

      this.setCurrentView(PanelView.WaypointView);

      this.waypointForm.get('waypointName')?.setValue(waypointTransferDto.name);
      this.waypointInProcess = new AddWaypointDto(
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

  onCityFormSubmit() {
    if (!this.cityForm.valid) {
      return;
    }

    if (this.cityInProcess === null) {
      this.cityForm.get('cityName')?.setErrors({ noResult: true });
      return;
    }

    const numberOfNights = this.cityForm.get('numberOfNights')?.value;

    let response: boolean;
    if (this.isEditFlow) {
      response = this.HandleCityEdit(numberOfNights);
      this.isEditFlow = false;
    } else {
      response = this.HandleCityAdd(numberOfNights);
    }

    if (response) {
      this.cityForm.get('cityName')?.enable();
      this.setCurrentView(PanelView.CitiesListView);
      this.cityInProcess = null;
    }
  }

  onWaypointFormSubmit() {
    if (!this.waypointForm.valid) {
      return;
    }

    if (this.waypointInProcess === null) {
      this.waypointForm.get('waypointName')?.setErrors({ noResult: true });
      return;
    }

    const startHour = this.waypointForm.get('startHour')?.value;
    const startMinutes = this.waypointForm.get('startMinutes')?.value;

    const endHour = this.waypointForm.get('endHour')?.value;
    const endMinutes = this.waypointForm.get('endMinutes')?.value;

    this.waypointInProcess!.startTime = `${this.formatTwoDigits(
      startHour,
      'hour'
    )}:${this.formatTwoDigits(startMinutes, 'minutes')}`;
    this.waypointInProcess!.endTime = `${this.formatTwoDigits(
      endHour,
      'hour'
    )}:${this.formatTwoDigits(endMinutes, 'minutes')}`;

    let response: boolean;
    if (this.isEditFlow) {
      response = this.HandleWaypointEdit();
      this.isEditFlow = false;
    } else {
      response = this.HandleWaypointAdd();
    }

    if (response) {
      this.waypointForm.get('waypointName')?.enable();
      this.setCurrentView(PanelView.WaypointsListView);
      this.waypointInProcess = null;
    }
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

    this.action.emit({
      type: 'citySelected',
      payload: new SelectedCityDto(selectedCity, cityBounds),
    });
  }

  onEditClick(entity: AddCityDto | AddWaypointDto, type: 'city' | 'waypoint') {
    this.isEditFlow = true;

    if (type === 'city') {
      this.setCurrentView(PanelView.CityView);
      this.setCityForm(entity as AddCityDto);
    } else if (type === 'waypoint') {
      this.setCurrentView(PanelView.WaypointView);
      this.setWaypointForm(entity as AddWaypointDto);
    }

    this.changeDetector.detectChanges();
  }

  onDeleteClick(
    entity: AddCityDto | AddWaypointDto,
    type: 'city' | 'waypoint'
  ) {
    this.openDeleteModal(type, entity);
  }

  onDiscardClick(view: PanelView, type: 'city' | 'waypoint') {
    if (this.isEditFlow) {
      this.isEditFlow = false;

      if (type === 'city') {
        this.cityForm.get('cityName')?.enable();
      } else {
        this.waypointForm.get('waypointName')?.enable();
      }
    }

    this.setCurrentView(view);
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
        this.cityForm.reset({
          numberOfNights: '0',
        });
        this.initializeCityAutocomplete();
        break;
      case PanelView.CitiesListView:
        break;
      case PanelView.WaypointView:
        this.waypointForm.reset({
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

    this.action.emit({
      type: 'dayChanged',
      payload: { dayIndex: this.currentDayIndex },
    });
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

  private HandleCityAdd(numberOfNights: number): boolean {
    const enteredValue = this.cityNameInput?.nativeElement.value.trim();
    if (
      !enteredValue ||
      this.cityInProcess!.name !== enteredValue
    ) {
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

    this.action.emit({ type: 'citySubmitted', payload: this.cityInProcess });
    return true;
  }

  private HandleCityEdit(numberOfNights: number): boolean {
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

    this.action.emit({ type: 'cityEdited', payload: this.cityList });

    return true;
  }

  private HandleWaypointAdd(): boolean {
    const enteredValue = this.waypointNameInput?.nativeElement.value.trim();
    if (
      !enteredValue ||
      this.waypointInProcess!.name !== enteredValue
    ) {
      this.waypointForm.get('waypointName')?.setErrors({ noResult: true });
      return false;
    }

    this.action.emit({
      type: 'waypointSubmitted',
      payload: this.waypointInProcess,
    });
    return true;
  }

  private HandleWaypointEdit(): boolean {
    this.action.emit({
      type: 'waypointEdited',
      payload: this.waypointInProcess,
    });
    return true;
  }

  private setCityForm(cityToEdit: AddCityDto) {
    this.cityForm.get('cityName')?.disable();
    this.cityForm.patchValue({
      cityName: cityToEdit.name,
      numberOfNights: cityToEdit.numberOfNights,
    });

    this.cityInProcess = new AddCityDto(
      cityToEdit.name,
      cityToEdit.country,
      cityToEdit.latitude,
      cityToEdit.longitude,
      cityToEdit.arrivalDate,
      cityToEdit.numberOfNights,
      cityToEdit.northEastBound,
      cityToEdit.southWestBound,
      cityToEdit.order,
      cityToEdit.waypoints
    );
  }

  private setWaypointForm(waypointToEdit: AddWaypointDto) {
    this.waypointForm.get('waypointName')?.disable();
    const [startHour, startMinutes] = waypointToEdit.startTime.split(':');
    const [endHour, endMinutes] = waypointToEdit.endTime.split(':');
    this.waypointForm.patchValue({
      waypointName: waypointToEdit.name,
      startHour: startHour,
      startMinutes: startMinutes,
      endHour: endHour,
      endMinutes: endMinutes,
    });

    this.waypointInProcess = { ...waypointToEdit };
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

      this.cityForm.get('cityName')?.setErrors(null);

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
        this.waypointForm.get('waypointName')?.setErrors({
          unsupportedType: true,
        });
        return;
      }

      this.waypointForm.get('waypointName')?.setErrors(null);

      // IMPORTANT: Show no result feedback, country filtering etc
      const placeId = place.place_id ?? '';
      const latitude = place.geometry?.location?.lat() ?? 0;
      const longitude = place.geometry?.location?.lng() ?? 0;

      this.waypointInProcess = new AddWaypointDto(
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
