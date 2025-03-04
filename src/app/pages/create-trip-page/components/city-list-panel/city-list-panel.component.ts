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
import { timeValidator as timeValidator } from '../../../../shared/helpers/validators';
import { TripStateService } from '../../services/trip-state.service';
import { Subscription } from 'rxjs';

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

  @ViewChild('waypointName') waypointNameInput?: ElementRef<HTMLInputElement>;

  PanelView = PanelView;
  private waypointAutocomplete: google.maps.places.Autocomplete | null = null;
  private getWaypoints = () =>
    this.selectedCity?.waypoints[this.currentDayIndex] ?? undefined;
  private getIsEditFlag = () => ({
    isEditFlow: this.isEditFlow ?? false,
    waypointInProcess: this.waypointInProcess ?? undefined,
  });

  waypointForm: FormGroup = new FormGroup({});

  currentView: PanelView = PanelView.CitiesListView; // change it
  currentDayIndex: number = 0;
  waypointInProcess: AddWaypointDto | null = null;
  selectedCity: AddCityDto | null = null;
  isEditFlow: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private changeDetector: ChangeDetectorRef,
    private googleMapsService: GoogleMapsService,
    private tripStateService: TripStateService
  ) {}

  async ngOnInit(): Promise<void> {
    this.subscriptions.push(
      this.tripStateService.getCities().subscribe((cities) => {
        this.cityList = cities;
      }),
      this.tripStateService.getSelectedCity().subscribe((selectedCity) => {
        this.handleCitySelected(selectedCity);
      }),
      this.tripStateService.getCityToAdd().subscribe((cityToAdd) => {
        if(cityToAdd === undefined){
          return;
        }

        this.setCurrentView(PanelView.CityView);
      })
    );

    this.waypointForm = this.formBuilder.group(
      {
        waypointName: ['', [Validators.required]],
        startHour: ['00', [Validators.required]],
        startMinutes: ['00', [Validators.required]],
        endHour: ['00', [Validators.required]],
        endMinutes: ['01', [Validators.required]],
      },
      {
        validators: timeValidator(this.getWaypoints, this.getIsEditFlag),
      }
    );

    try {
      if (this.googleMapsService.isScriptLoaded() === false) {
        await this.googleMapsService.loadScriptAsync();
      }
    } catch (error) {
      console.error('[City-List-Panel] Google Maps script not loaded.', error);
    }
  }

  ngAfterViewInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
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
        '',
        0
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

  handleCitySelected(selectedCity: SelectedCityDto | null) {
    if (selectedCity === null) {
      return;
    }

    this.selectedCity = selectedCity.selectedCity;
    this.setCurrentView(PanelView.WaypointsListView);

    this.changeDetector.detectChanges();
  }

  onWaypointFormSubmit() {
    if (!this.waypointForm.valid) {
      console.log('Invalid Form: ' + this.waypointForm.errors);
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

    if (type === 'waypoint') {
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
        this.tripStateService.updateCityToEdit(undefined);
      } else {
        this.waypointForm.get('waypointName')?.enable();
      }
    } else {
      this.tripStateService.updateCityToAdd(undefined);
    }

    this.setCurrentView(view);
  }

  setCurrentView(view: PanelView) {
    if (this.currentView === PanelView.WaypointView) {
      this.destroyAutocomplete(this.waypointAutocomplete);
    }

    this.currentView = view;
    this.changeDetector.detectChanges();

    switch (view) {
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

  preventEnterSubmit(event: Event) {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement.tagName.toLowerCase() === 'button') {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault();
    this.focusNextElement(keyboardEvent);
  }

  focusNextElement(event: KeyboardEvent) {
    const form = event.target as HTMLElement;

    const focusableElements = Array.from(
      form
        .closest('form')
        ?.querySelectorAll(
          'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) || []
    ) as HTMLElement[];

    const index = focusableElements.indexOf(event.target as HTMLElement);
    if (index > -1 && index < focusableElements.length - 1) {
      focusableElements[index + 1].focus();
    }
  }

  private HandleWaypointAdd(): boolean {
    const enteredValue = this.waypointNameInput?.nativeElement.value.trim();
    if (!enteredValue || this.waypointInProcess!.name !== enteredValue) {
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

  private setWaypointForm(waypointToEdit: AddWaypointDto) {
    this.waypointInProcess = waypointToEdit;

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

      // this.waypointForm.get('waypointName')?.setErrors(null);

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
        '',
        0
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
