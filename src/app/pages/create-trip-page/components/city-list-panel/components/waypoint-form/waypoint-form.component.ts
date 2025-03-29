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
import { WaypointType } from '../../../../../helpers/waypoint-type.enum';
import {
  ATTRACTIONS_WAYPOINT_TYPES,
  FOOD_WAYPOINT_TYPES,
  RECREATIONAL_WAYPOINT_TYPES,
} from '../../../../../../shared/helpers/preferred-waypoint-types';
import { BaseCityVisitDto, CityVisitDto } from '../../../../../../interfaces/dtos/request/base-city-visit-dto';
import { BaseWaypointVisitDto, AddWaypointVisitDto } from '../../../../../../interfaces/dtos/request/base-waypoint-visit-dto';

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
  waypointVisitInProcess: BaseWaypointVisitDto | null = null;
  PanelView = PanelView;

  private subsciptions: Subscription[] = [];
  private waypointAutocomplete: google.maps.places.Autocomplete | null = null;
  private selectedCityVisit: BaseCityVisitDto | null = null;
  private currentDayIndex: number = 0;
  private getWaypoints = () =>
    this.selectedCityVisit?.dayVisits[this.currentDayIndex].waypointVisits ?? undefined;
  private getIsEditFlag = () => ({
    isEditFlow: this.isEditFlow ?? false,
    waypointVisitInProcess: this.waypointVisitInProcess ?? undefined,
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
      this.tripStateService.getSelectedCityVisit().subscribe((value) => {
        this.selectedCityVisit = value !== null ? value.cityVisit : null;
      }),
      this.tripStateService.getCurrentDayIndex().subscribe((dayIndex) => {
        this.currentDayIndex = dayIndex;
      }),
      this.tripStateService.getWaypointVisitToEdit().subscribe((waypointVisit) => {
        if (waypointVisit === undefined) {
          return;
        }

        this.HandleWaypointToEdit(waypointVisit);
      })
    );
  }

  ngAfterViewInit(): void {
    this.initializeWaypointAutocomplete();
  }

  private HandleWaypointToEdit(waypoint: BaseWaypointVisitDto): void {
    this.isEditFlow = true;
    this.setWaypointForm(waypoint);
  }

  onWaypointFormSubmit() {
    if (!this.waypointForm.valid) {
      console.log('Invalid Form: ' + this.waypointForm.errors);
      return;
    }

    if (this.waypointVisitInProcess === null) {
      this.waypointForm.get('waypointName')?.setErrors({ noResult: true });
      return;
    }

    const formattedTime = this.getFormattedTime(this.waypointForm);

    this.waypointVisitInProcess!.startTime = formattedTime.startTime;
    this.waypointVisitInProcess!.endTime = formattedTime.endTime;

    let response: boolean;
    if (this.isEditFlow) {
      response = this.HandleWaypointEdit();
    } else {
      response = this.HandleWaypointAdd();
    }

    console.log(response);

    if (response) {
      if (this.isEditFlow) {
        this.tripStateService.updateWaypointVisitToEdit(undefined);
      }
      this.setCurrentView(PanelView.WaypointsListView);
    }
  }

  formatTwoDigitsInput(event: Event, type: 'hour' | 'minutes'): void {
    const inputElement = event.target as HTMLInputElement;

    inputElement.value = this.formatTwoDigits(inputElement.value, type);
  }

  private setWaypointForm(waypointToEdit: BaseWaypointVisitDto) {
    this.waypointVisitInProcess = waypointToEdit;

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
    if (!enteredValue || this.waypointVisitInProcess!.name !== enteredValue) {
      this.waypointForm.get('waypointName')?.setErrors({ noResult: true });
      return false;
    }

    return this.tripStateService.submitWaypointForm(this.waypointVisitInProcess!, false);
  }

  private HandleWaypointEdit(): boolean {
    return this.tripStateService.submitWaypointForm(this.waypointVisitInProcess!, true);
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

    if (this.selectedCityVisit === null) {
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
            this.selectedCityVisit.southWestBound.latitude,
            this.selectedCityVisit.southWestBound.longitude
          ),
          new google.maps.LatLng(
            this.selectedCityVisit.northEastBound.latitude,
            this.selectedCityVisit.northEastBound.longitude
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

      this.waypointVisitInProcess = {
        name: waypointName,
        type: waypointType.toString(),
        placeId: placeId,
        latitude: latitude,
        longitude: longitude,
        startTime: '00:00',
        endTime: '00:01'
      } as AddWaypointVisitDto;
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
