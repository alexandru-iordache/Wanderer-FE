import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { PanelView } from '../../../../../helpers/panel-view.enum';
import { TripStateService } from '../../../../services/trip-state.service';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { timeValidator } from '../../../../../../shared/helpers/validators';
import { AddCityDto } from '../../../../../../interfaces/dtos/add-city-dto';
import { AddWaypointDto } from '../../../../../../interfaces/dtos/add-waypoint-dto';
import { WaypointType } from '../../../../../helpers/waypoint-type.enum';
import {
  ATTRACTIONS_WAYPOINT_TYPES,
  FOOD_WAYPOINT_TYPES,
  RECREATIONAL_WAYPOINT_TYPES,
} from '../../../../../../shared/helpers/preferred-waypoint-types';

@Component({
  selector: 'app-waypoint-form',
  templateUrl: './waypoint-form.component.html',
  styleUrl: './waypoint-form.component.scss',
})
export class WaypointFormComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() onDiscardClick!: (
    view: PanelView,
    type: 'city' | 'waypoint'
  ) => void;
  @Input() preventEnterSubmit!: (event: Event) => void;
  @Input() setCurrentView!: (panelView: PanelView) => void;

  @ViewChild('waypointName') waypointNameInput?: ElementRef<HTMLInputElement>;

  waypointForm: FormGroup = new FormGroup({});
  isEditFlow: boolean = false;
  waypointInProcess: AddWaypointDto | null = null;
  PanelView = PanelView;

  private subsciptions: Subscription[] = [];
  private waypointAutocomplete: google.maps.places.Autocomplete | null = null;
  private selectedCity: AddCityDto | null = null;
  private currentDayIndex: number = 0;
  private getWaypoints = () =>
    this.selectedCity?.waypoints[this.currentDayIndex] ?? undefined;
  private getIsEditFlag = () => ({
    isEditFlow: this.isEditFlow ?? false,
    waypointInProcess: this.waypointInProcess ?? undefined,
  });

  constructor(
    private tripStateService: TripStateService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
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

    this.subsciptions.push(
      this.tripStateService.getSelectedCity().subscribe((city) => {
        this.selectedCity = city !== null ? city.selectedCity : null;
      }),
      this.tripStateService.getCurrentDayIndex().subscribe((dayIndex) => {
        this.currentDayIndex = dayIndex;
      }),
      this.tripStateService.getWaypointToEdit().subscribe((waypoint) => {
        if (waypoint === undefined) {
          return;
        }

        this.HandleWaypointToEdit(waypoint);
      })
    );
  }

  ngAfterViewInit(): void {
    this.initializeWaypointAutocomplete();
  }

  private HandleWaypointToEdit(waypoint: AddWaypointDto): void {
    this.isEditFlow = true;
    this.setWaypointForm(waypoint);
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

    const formattedTime = this.getFormattedTime(this.waypointForm);

    this.waypointInProcess!.startTime = formattedTime.startTime;
    this.waypointInProcess!.endTime = formattedTime.endTime;

    let response: boolean;
    if (this.isEditFlow) {
      response = this.HandleWaypointEdit();
      this.isEditFlow = false;
    } else {
      response = this.HandleWaypointAdd();
    }

    if (response) {
      if (this.isEditFlow) {
        this.tripStateService.updateWaypointToEdit(undefined);
      }
      this.setCurrentView(PanelView.WaypointsListView);
    }
  }

  formatTwoDigitsInput(event: Event, type: 'hour' | 'minutes'): void {
    const inputElement = event.target as HTMLInputElement;

    inputElement.value = this.formatTwoDigits(inputElement.value, type);
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

  private HandleWaypointAdd(): boolean {
    const enteredValue = this.waypointNameInput?.nativeElement.value.trim();
    if (!enteredValue || this.waypointInProcess!.name !== enteredValue) {
      this.waypointForm.get('waypointName')?.setErrors({ noResult: true });
      return false;
    }

    this.tripStateService.submitWaypointForm(this.waypointInProcess!, false);
    return true;
  }

  private HandleWaypointEdit(): boolean {
    this.tripStateService.submitWaypointForm(this.waypointInProcess!, true);
    return true;
  }

  private getFormattedTime(waypointForm: FormGroup<any>): {
    startTime: string;
    endTime: string;
  } {
    const startHour = waypointForm.get('startHour')?.value;
    const startMinutes = waypointForm.get('startMinutes')?.value;

    const endHour = waypointForm.get('endHour')?.value;
    const endMinutes = waypointForm.get('endMinutes')?.value;

    return {
      startTime: `${this.formatTwoDigits(
        startHour,
        'hour'
      )}:${this.formatTwoDigits(startMinutes, 'minutes')}`,
      endTime: `${this.formatTwoDigits(endHour, 'hour')}:${this.formatTwoDigits(
        endMinutes,
        'minutes'
      )}`,
    };
  }

  private formatTwoDigits(text: string, type: 'hour' | 'minutes'): string {
    let value = parseInt(text, 10);

    return value.toString().padStart(2, '0');
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

  ngOnDestroy(): void {
    this.subsciptions.forEach((sub) => sub.unsubscribe());
    this.destroyAutocomplete(this.waypointAutocomplete);
  }
}
